import logging
import os
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.upload_file import Upload
from schema.upload_file import UploadFileSchema
from models.campaign_recipients import CampaignRecipient

logger = logging.getLogger(__name__)

# Anchor storage to the project location instead of the current working directory.
# In production you can override it with the STORAGE_DIR environment variable.
BASE_DIR = Path(__file__).resolve().parent.parent  # adjust to your project root
STORAGE_DIR = Path(os.getenv("STORAGE_DIR", BASE_DIR / "storage")).resolve()


def resolve_storage_path(stored_path: str) -> Path:
    """
    Convert the path saved in the DB into a real path inside STORAGE_DIR.
    Handles relative paths, paths that already start with "storage/",
    and absolute paths. Rejects anything outside STORAGE_DIR.
    """
    p = Path(stored_path)

    # If the DB value already includes the "storage/" prefix, strip it
    if not p.is_absolute() and p.parts and p.parts[0] == STORAGE_DIR.name:
        p = Path(*p.parts[1:])

    full_path = p if p.is_absolute() else STORAGE_DIR / p
    full_path = full_path.resolve()

    # Prevent paths outside the storage directory
    if not full_path.is_relative_to(STORAGE_DIR):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file path.",
        )

    return full_path


def add_upload_file(
    db: Session,
    credentials: UploadFileSchema,
):
    upload = Upload(**credentials.model_dump())

    db.add(upload)

    try:
        db.commit()
        db.refresh(upload)
    except Exception:
        db.rollback()
        raise

    return upload


def get_upload_by_campaign(
    db: Session,
    campaign_id: int,
):
    upload = (
        db.query(Upload)
        .filter(Upload.campaign_id == campaign_id)
        .first()
    )

    if upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No uploaded file found for this campaign.",
        )

    return upload


def delete_upload_file(
    db: Session,
    upload_file_id: int,
    user_id: int,
):
    upload = (
        db.query(Upload)
        .filter(Upload.id == upload_file_id, Upload.user_id == user_id)
        .first()
    )

    if upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload file not found",
        )

    # Read everything we need BEFORE commit (attributes expire after commit/delete)
    stored_path = upload.file_path
    file_path = resolve_storage_path(stored_path)

    # Check whether another Upload row points to the same file
    file_still_used = (
        db.query(Upload.id)
        .filter(Upload.file_path == stored_path, Upload.id != upload_file_id)
        .first()
        is not None
    )

    try:
        # Keep recipients (and their logs), just detach them from the upload
        db.query(CampaignRecipient).filter(
            CampaignRecipient.upload_id == upload_file_id
        ).update({"upload_id": None}, synchronize_session=False)

        db.delete(upload)
        db.commit()
    except Exception:
        db.rollback()
        raise

    # Delete the physical file only after the DB commit succeeded
    if file_still_used:
        logger.info(
            "Skipping file deletion, still referenced by another upload: %s",
            file_path,
        )
    else:
        try:
            if file_path.exists():
                file_path.unlink()
                logger.info("Deleted file from storage: %s", file_path)
            else:
                logger.warning(
                    "File not found on disk during delete: %s (stored path: %s)",
                    file_path,
                    stored_path,
                )
        except OSError:
            logger.exception("Failed to delete file %s", file_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database record deleted, but file cleanup failed.",
            )

    return {"message": "File deleted successfully"}