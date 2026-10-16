import logging
import re
from collections import Counter
from datetime import datetime, timezone

import pandas as pd  # type: ignore

from database import SessionLocal
from redis_client import save_analytics
from workers.celery_app import celery

from models.campaign_recipients import CampaignRecipient
from models.upload_file import Upload, UploadStatus

# Not used directly, but REQUIRED so SQLAlchemy relationships resolve
# in the worker process. Import every related model here.
from models.campaigns import Campaign  # noqa: F401
from models.user import User  # noqa: F401
from models.email_logs import EmailLog  # noqa: F401
from models.sender_account import SenderAccount  # noqa: F401
from models.html_templates import HTMLTemplate  # noqa: F401

logger = logging.getLogger(__name__)

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

# Checked in this order. Keep as a tuple so behavior is deterministic.
EMAIL_COLUMN_ALIASES = (
    "email",
    "e-mail",
    "e mail",
    "email address",
    "email id",
    "emailid",
    "emails",
    "mail",
)


def _mark_failed(db, upload_id: int, message: str) -> None:
    """Best-effort: mark an upload as FAILED. Never raises."""
    try:
        db.rollback()
        upload = db.get(Upload, upload_id)
        if upload is not None:
            upload.status = UploadStatus.FAILED
            upload.error_message = (message or "")[:255]
            db.commit()
    except Exception:
        db.rollback()
        logger.exception("Could not mark upload %s as FAILED", upload_id)


def _clean(value) -> str | None:
    """Strip a cell value; return None if empty/NaN."""
    if value is None:
        return None
    if isinstance(value, float) and pd.isna(value):
        return None
    s = str(value).strip()
    return s or None


def _read_file(path: str) -> pd.DataFrame:
    lower = path.lower()
    if lower.endswith((".xlsx", ".xls")):
        return pd.read_excel(path, dtype=str)
    if lower.endswith(".csv"):
        # utf-8-sig strips the hidden BOM that Excel adds to CSVs
        return pd.read_csv(path, dtype=str, encoding="utf-8-sig")
    raise ValueError("Only XLSX and CSV files are allowed.")


def _count_filled(df: pd.DataFrame, col: str | None, mask: pd.Series) -> int:
    """How many of the unique valid rows have a non-empty value in `col`."""
    if col is None:
        return 0
    return int(df.loc[mask, col].map(_clean).notna().sum())


@celery.task(
    name="workers.extract_email.extract_upload_task",
    queue="extract_emails_queue",
)
def extract_upload_task(upload_id: int) -> dict | None:
    """
    Extract + validate + dedupe emails, store recipients (PENDING) in MySQL,
    store analytics in MySQL (Upload row) and Redis.

    DOES NOT queue any send jobs. Sending starts only when the user presses
    Start (see workers/start_campaign.py).
    """
    db = SessionLocal()
    analytics: dict | None = None

    try:
        upload = db.get(Upload, upload_id)
        if upload is None:
            logger.error("Upload %s not found", upload_id)
            return None

        # Guard against double-processing. If it's stuck in PROCESSING from a
        # crashed worker, allow reprocessing.
        if upload.status not in (UploadStatus.UPLOADED, UploadStatus.PROCESSING):
            logger.warning(
                "Upload %s cannot be processed. Current status: %s",
                upload_id,
                upload.status,
            )
            return None

        if not upload.file_path:
            _mark_failed(db, upload_id, "Upload file path is missing.")
            return None

        upload.status = UploadStatus.PROCESSING
        db.commit()

        try:
            df = _read_file(upload.file_path)

            # Normalize columns: strip BOM, whitespace, lowercase.
            df.columns = [
                str(c).replace("\ufeff", "").strip().lower() for c in df.columns
            ]

            email_col = next(
                (c for c in EMAIL_COLUMN_ALIASES if c in df.columns), None
            )
            if email_col is None:
                raise ValueError(
                    "Email column is required. "
                    f"Found columns: {list(df.columns)}"
                )

            total = len(df)
            df["_email"] = df[email_col].map(_clean).str.lower()
            df["_valid"] = (
                df["_email"].fillna("").str.fullmatch(EMAIL_RE).astype(bool)
            )

            empty_count = int(df["_email"].isna().sum())

            valid_df = df[df["_valid"]]
            dupes_mask = valid_df.duplicated(subset="_email", keep="first")
            unique_df = valid_df[~dupes_mask]

            invalid_count = int((~df["_valid"]).sum())
            duplicate_count = int(dupes_mask.sum())

            # Idempotency: replace any earlier unlinked rows for this upload.
            db.query(CampaignRecipient).filter(
                CampaignRecipient.upload_id == upload_id,
                CampaignRecipient.campaign_id.is_(None),
            ).delete(synchronize_session=False)

            name_col = "name" if "name" in df.columns else None
            company_col = "company" if "company" in df.columns else None
            phone_col = "phone" if "phone" in df.columns else None

            # Recipients are saved with campaign_id possibly None (form not
            # filled yet). They get linked to the campaign when user hits Start.
            # Status stays at the model default (PENDING).
            new_recipients = [
                CampaignRecipient(
                    upload_id=upload_id,
                    campaign_id=upload.campaign_id,
                    name=_clean(row[name_col]) if name_col else None,
                    email=row["_email"],
                    company=_clean(row[company_col]) if company_col else None,
                    phone=_clean(row[phone_col]) if phone_col else None,
                    is_valid_email=True,
                )
                for _, row in unique_df.iterrows()
            ]
            db.add_all(new_recipients)

            # ---------------- Analytics ----------------
            unique_mask = unique_df.index
            domains = Counter(e.split("@", 1)[1] for e in unique_df["_email"])

            analytics = {
                "upload_id": upload_id,
                "status": "completed",
                "email_column": email_col,
                "columns": [c for c in df.columns if not c.startswith("_")],
                "total_rows": total,
                "valid_count": len(unique_df),
                "invalid_count": invalid_count,
                "empty_count": empty_count,
                "duplicate_count": duplicate_count,
                "with_name": _count_filled(df, name_col, unique_mask),
                "with_company": _count_filled(df, company_col, unique_mask),
                "with_phone": _count_filled(df, phone_col, unique_mask),
                "top_domains": [
                    {"domain": d, "count": c} for d, c in domains.most_common(10)
                ],
                "processed_at": datetime.now(timezone.utc).isoformat(),
            }

            # MySQL: counts on the Upload row.
            upload.total_rows = total
            upload.valid_count = len(unique_df)
            upload.invalid_count = invalid_count
            upload.duplicate_count = duplicate_count
            upload.status = UploadStatus.COMPLETED
            upload.error_message = None

            db.commit()

            logger.info(
                "Upload %s: %d recipients saved (total=%d, invalid=%d, dupes=%d)",
                upload_id,
                len(new_recipients),
                total,
                invalid_count,
                duplicate_count,
            )

        except Exception as exc:
            logger.exception("Extraction failed for upload %s", upload_id)
            _mark_failed(db, upload_id, str(exc))
            return None

    finally:
        db.close()

    # Redis: best-effort. MySQL already has the source of truth.
    if analytics is not None:
        try:
            save_analytics(upload_id, analytics)
        except Exception:
            logger.exception("Could not cache analytics in Redis for %s", upload_id)

    # NOTE: no send_email_task here on purpose. Waiting for the Start button.
    return analytics