import json
import logging
import re

import pandas as pd  # type: ignore
import redis  # type: ignore

from workers.celery_app import celery
from database import SessionLocal

from models.upload_file import Upload, UploadStatus
from models.campaigns import Campaign
from models.campaign_recipients import CampaignRecipient
from models.user import User

from schema.campaigns import CampaignStatus


logger = logging.getLogger(__name__)


EMAIL_RE = re.compile(
    r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
)


# =========================================================
# Redis connection
# =========================================================

redis_client = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    decode_responses=True,
)


# =========================================================
# Mark upload as failed
# =========================================================

def _mark_failed(
    db,
    upload_id: int,
    message: str,
):
    db.rollback()

    upload = db.get(
        Upload,
        upload_id,
    )

    if upload:
        upload.status = UploadStatus.FAILED
        upload.error_message = message[:255]

        db.commit()


# =========================================================
# Celery task
# =========================================================

@celery.task(
    queue="extract_emails_queue"
)
def extract_emails(upload_id: int):

    db = SessionLocal()

    try:

        # =====================================================
        # 1. Get upload
        # =====================================================

        upload = db.get(
            Upload,
            upload_id,
        )

        if upload is None:

            logger.error(
                f"Upload {upload_id} not found."
            )

            return

        # =====================================================
        # 2. Prevent duplicate extraction
        # =====================================================

        if upload.status != UploadStatus.UPLOADED:

            logger.warning(
                f"Upload {upload_id} cannot be processed. "
                f"Current status: {upload.status}"
            )

            return

        # =====================================================
        # 3. Mark upload as PROCESSING
        # =====================================================

        upload.status = UploadStatus.PROCESSING

        db.commit()

        try:

            # =================================================
            # 4. Check file path
            # =================================================

            if not upload.file_path:

                raise ValueError(
                    "Upload file path is missing."
                )

            # =================================================
            # 5. Determine file extension
            # =================================================

            extension = (
                upload.file_path
                .split(".")[-1]
                .lower()
            )

            # =================================================
            # 6. Read Excel / CSV
            # =================================================

            if extension == "xlsx":

                df = pd.read_excel(
                    upload.file_path,
                    dtype=str,
                )

            elif extension == "csv":

                df = pd.read_csv(
                    upload.file_path,
                    dtype=str,
                )

            else:

                raise ValueError(
                    "Only XLSX and CSV files are allowed."
                )

            # =================================================
            # 7. Normalize dataframe
            # =================================================

            df = df.fillna("")

            df.columns = [
                str(column)
                .strip()
                .lower()
                for column in df.columns
            ]

            # =================================================
            # 8. Check email column
            # =================================================

            if "email" not in df.columns:

                raise ValueError(
                    "Email column is required."
                )

            # =================================================
            # 9. Extract recipients
            # =================================================

            recipients = []

            seen = set()

            for row in df.to_dict("records"):

                email = str(
                    row.get(
                        "email",
                        "",
                    )
                ).strip()

                key = email.lower()

                # ---------------------------------------------
                # Invalid email
                # ---------------------------------------------

                if not EMAIL_RE.match(email):

                    continue

                # ---------------------------------------------
                # Duplicate email
                # ---------------------------------------------

                if key in seen:

                    continue

                seen.add(key)

                # ---------------------------------------------
                # Create recipient
                # ---------------------------------------------

                recipient = CampaignRecipient(

                    campaign_id=upload.campaign_id,

                    upload_id=upload.id,

                    name=(
                        str(
                            row.get(
                                "name",
                                "",
                            )
                        ).strip()
                        or None
                    ),

                    email=email,

                    company=(
                        str(
                            row.get(
                                "company",
                                "",
                            )
                        ).strip()
                        or None
                    ),

                    phone=(
                        str(
                            row.get(
                                "phone",
                                "",
                            )
                        ).strip()
                        or None
                    ),

                    is_valid_email=True,
                )

                recipients.append(
                    recipient
                )

            # =================================================
            # 10. Save recipients to MySQL
            # =================================================

            db.add_all(
                recipients
            )

            # Assign database IDs
            # without committing yet
            db.flush()

            # =================================================
            # 11. Update upload information
            # =================================================

            upload.total_records = len(df)

            upload.processed_records = len(
                recipients
            )

            upload.status = (
                UploadStatus.COMPLETED
            )

            upload.error_message = None

            # =================================================
            # 12. Mark campaign READY
            # =================================================

            campaign = db.get(
                Campaign,
                upload.campaign_id,
            )

            if campaign:

                campaign.status = (
                    CampaignStatus.READY
                )

            # =================================================
            # 13. Commit everything to MySQL
            # =================================================

            db.commit()

            logger.info(
                f"Upload {upload_id}: "
                f"{len(recipients)} recipients "
                f"saved to MySQL."
            )

        except Exception as e:

            logger.exception(
                f"Extraction failed for "
                f"upload {upload_id}."
            )

            _mark_failed(
                db,
                upload_id,
                str(e),
            )

            return

        # =====================================================
        # 14. Redis Stream
        # =====================================================

        redis_stream = (
            f"campaign:{upload.campaign_id}:recipients"
        )

        # =====================================================
        # 15. Push actual recipient data to Redis
        # =====================================================

        for recipient in recipients:

            recipient_data = {

                "recipient_id": str(
                    recipient.id
                ),

                "campaign_id": str(
                    recipient.campaign_id
                ),

                "name": (
                    recipient.name
                    or ""
                ),

                "email": recipient.email,

                "company": (
                    recipient.company
                    or ""
                ),

                "phone": (
                    recipient.phone
                    or ""
                ),
            }

            redis_client.xadd(
                redis_stream,
                {
                    "data": json.dumps(
                        recipient_data
                    )
                },
            )

        # =====================================================
        # 16. Logging
        # =====================================================

        logger.info(
            f"Upload {upload_id}: "
            f"{len(recipients)} recipients "
            f"pushed to Redis stream "
            f"{redis_stream}."
        )

    finally:

        db.close()