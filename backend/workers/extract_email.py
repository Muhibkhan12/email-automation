import logging
import re

import pandas as pd  # type: ignore

from workers.celery_app import celery
from workers.sending_emails import send_email_task
from database import SessionLocal

from models.upload_file import Upload, UploadStatus
from models.campaigns import Campaign
from models.campaign_recipients import CampaignRecipient

# Not used directly, but REQUIRED: SQLAlchemy relationships (e.g. Campaign -> User)
# can only resolve if every related model is imported in the worker process.
from models.user import User  # noqa: F401

from schema.campaigns import CampaignStatus


logger = logging.getLogger(__name__)


EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

SEND_QUEUE = "email_sender_queue"

# Header names (lowercased) that are treated as the email column
EMAIL_COLUMN_ALIASES = {
    "e-mail",
    "e mail",
    "email address",
    "email id",
    "emailid",
    "emails",
    "mail",
}


# =========================================================
# Mark upload as failed
# =========================================================

def _mark_failed(db, upload_id: int, message: str):
    db.rollback()

    upload = db.get(Upload, upload_id)

    if upload:
        upload.status = UploadStatus.FAILED
        upload.error_message = message[:255]
        db.commit()


def _clean(value) -> str | None:
    """Strip a cell value; return None if empty."""
    return str(value).strip() or None


# =========================================================
# Task
# =========================================================

@celery.task(
    name="workers.extract_email.extract_emails",
    queue="extract_emails_queue",
)
def extract_emails(upload_id: int):

    db = SessionLocal()

    try:
        upload = db.get(Upload, upload_id)

        if upload is None:
            logger.error(f"Upload {upload_id} not found.")
            return

        if upload.status != UploadStatus.UPLOADED:
            logger.warning(
                f"Upload {upload_id} cannot be processed. "
                f"Current status: {upload.status}"
            )
            return

        upload.status = UploadStatus.PROCESSING
        db.commit()

        # Filled inside the try block, used after the commit
        recipient_ids: list[int] = []
        campaign_id: int = upload.campaign_id
        sender_account_id: int | None = None

        try:
            if not upload.file_path:
                raise ValueError("Upload file path is missing.")

            extension = upload.file_path.split(".")[-1].lower()

            if extension == "xlsx":
                df = pd.read_excel(upload.file_path, dtype=str)
            elif extension == "csv":
                # utf-8-sig strips the hidden BOM that Excel adds to CSVs
                df = pd.read_csv(
                    upload.file_path, dtype=str, encoding="utf-8-sig"
                )
            else:
                raise ValueError("Only XLSX and CSV files are allowed.")

            # ---------------------------------------------
            # Normalize dataframe
            # ---------------------------------------------

            df = df.fillna("")
            df.columns = [
                str(c).replace("\ufeff", "").strip().lower()
                for c in df.columns
            ]

            if "email" not in df.columns:
                alias = next(
                    (c for c in df.columns if c in EMAIL_COLUMN_ALIASES),
                    None,
                )
                if alias is None:
                    raise ValueError(
                        "Email column is required. "
                        f"Found columns: {list(df.columns)}"
                    )
                df = df.rename(columns={alias: "email"})

            # ---------------------------------------------
            # Extract recipients
            # ---------------------------------------------

            recipients = []
            seen = set()

            for row in df.to_dict("records"):
                email = str(row.get("email", "")).strip()
                key = email.lower()

                if not EMAIL_RE.match(email):
                    continue

                if key in seen:
                    continue

                seen.add(key)

                recipients.append(
                    CampaignRecipient(
                        campaign_id=upload.campaign_id,
                        upload_id=upload.id,
                        name=_clean(row.get("name", "")),
                        email=email,
                        company=_clean(row.get("company", "")),
                        phone=_clean(row.get("phone", "")),
                        is_valid_email=True,
                    )
                )

            # ---------------------------------------------
            # Save recipients to MySQL
            # ---------------------------------------------

            db.add_all(recipients)
            db.flush()  # assigns IDs without committing

            # Collect IDs now: after commit, attributes expire
            recipient_ids = [r.id for r in recipients]

            # ---------------------------------------------
            # Update upload info
            # ---------------------------------------------

            upload.total_records = len(df)
            upload.processed_records = len(recipients)
            upload.status = UploadStatus.COMPLETED
            upload.error_message = None

            # ---------------------------------------------
            # Mark campaign READY
            # ---------------------------------------------

            campaign = db.get(Campaign, upload.campaign_id)

            if campaign:
                campaign.status = CampaignStatus.READY
                # Adjust this attribute name to match your Campaign model
                sender_account_id = campaign.sender_account_id

            db.commit()

            logger.info(
                f"Upload {upload_id}: "
                f"{len(recipient_ids)} recipients saved to MySQL."
            )

        except Exception as e:
            logger.exception(f"Extraction failed for upload {upload_id}.")
            _mark_failed(db, upload_id, str(e))
            return

        # =====================================================
        # Enqueue one send job per recipient (after commit!)
        # =====================================================

        if sender_account_id is None:
            logger.error(
                f"Upload {upload_id}: campaign {campaign_id} has no "
                f"sender account. Recipients saved, but no send jobs queued."
            )
            return

        for recipient_id in recipient_ids:
            send_email_task.apply_async(
                kwargs={
                    "recipient_id": recipient_id,
                    "sender_account_id": sender_account_id,
                    "campaign_id": campaign_id,
                },
                queue=SEND_QUEUE,
            )

        logger.info(
            f"Upload {upload_id}: {len(recipient_ids)} send jobs "
            f"queued to {SEND_QUEUE}."
        )

    finally:
        db.close()