
import re
import pandas as pd

from workers.celery_app import celery
from database import SessionLocal

from models.upload_file import Upload, UploadStatus
from models.campaigns import Campaign
from models.campaign_recipients import CampaignRecipient

from schema.campaigns import CampaignStatus
from workers.sending_emails import send_email_task

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _mark_failed(db, upload_id: int, message: str):
    db.rollback()
    upload = db.get(Upload, upload_id)
    if upload:
        upload.status = UploadStatus.FAILED
        upload.error_message = message[:255]
        db.commit()

import logging
logger = logging.getLogger(__name__)

@celery.task(queue="extract_emails_queue")
def extract_emails(upload_id: int):
    db = SessionLocal()
    try:
        upload = db.get(Upload, upload_id)

        # Missing, or already picked up (guards against double sends on retry)
        if upload is None or upload.status != UploadStatus.UPLOADED:
            return

        upload.status = UploadStatus.PROCESSING
        db.commit()

        try:
            extension = upload.file_path.split(".")[-1].lower()
            if extension == "xlsx":
                df = pd.read_excel(upload.file_path, dtype=str)
            elif extension == "csv":
                df = pd.read_csv(upload.file_path, dtype=str)
            else:
                raise ValueError("Only XLSX and CSV files are allowed")

            df = df.fillna("")
            df.columns = [str(c).strip().lower() for c in df.columns]

            if "email" not in df.columns:
                raise ValueError("Email column is required")

            recipients = []
            seen = set()

            for row in df.to_dict("records"):
                email = str(row.get("email", "")).strip()
                key = email.lower()

                if not EMAIL_RE.match(email) or key in seen:
                    continue
                seen.add(key)

                recipients.append(
                    CampaignRecipient(
                        campaign_id=upload.campaign_id,
                        upload_id=upload.id,
                        name=str(row.get("name", "")).strip() or None,
                        email=email,
                        company=str(row.get("company", "")).strip() or None,
                        phone=str(row.get("phone", "")).strip() or None,
                        is_valid_email=True,
                    )
                )

            db.add_all(recipients)
            db.flush()  # assigns ids without committing
            recipient_ids = [r.id for r in recipients]

            upload.total_records = len(df)
            upload.processed_records = len(recipients)  # frontend: Added = this, Skipped = total - this
            upload.status = UploadStatus.COMPLETED
            upload.error_message = None

            campaign = db.get(Campaign, upload.campaign_id)
            if campaign:
                campaign.status = CampaignStatus.READY

            db.commit()

        except Exception as e:
            _mark_failed(db, upload_id, str(e))
            return

        # Only after the commit, so the email tasks can see the rows
        for rid in recipient_ids:
            send_email_task.apply_async(
                args=[rid],
                queue="email_sending_queue",
            )

    finally:
        db.close()