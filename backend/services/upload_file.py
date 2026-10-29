from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from pathlib import Path

from models.upload_file import Upload
from schema.upload_file import UploadFileSchema
from models.campaign_recipients import CampaignRecipient
import os


STORAGE_DIR = Path("storage").resolve()

def add_upload_file(
    db: Session,
    credentials: UploadFileSchema,
):

    upload = Upload(
        **credentials.model_dump()
    )

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
    campaign_id: int
):

    upload = (
        db.query(Upload)
        .filter(Upload.campaign_id == campaign_id)
        .first()
    )

    if upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No uploaded file found for this campaign."
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

    file_path = (STORAGE_DIR / upload.file_path).resolve()

    # Prevent paths outside the storage directory.
    if not file_path.is_relative_to(STORAGE_DIR):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file path.",
        )

    try:
        # Recipients (aur unke logs) rakhne hain, bas upload se alag karna hai
        db.query(CampaignRecipient).filter(
            CampaignRecipient.upload_id == upload_file_id
        ).update({"upload_id": None}, synchronize_session=False)

        db.delete(upload)
        db.commit()
    except Exception:
        db.rollback()
        raise

    try:
        file_path.unlink(missing_ok=True)
    except OSError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database record deleted, but file cleanup failed.",
        )

    return {"message": "File deleted successfully"}