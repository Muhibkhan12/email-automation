from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.upload_file import Upload
from schema.upload_file import UploadFileSchema


def add_upload_file(
    db: Session,
    credentials: UploadFileSchema
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
    upload_file_id: int
):

    upload = db.get(
        Upload,
        upload_file_id
    )

    if upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found."
        )

    db.delete(upload)
    db.commit()

    return {
        "message": "Upload deleted successfully."
    }