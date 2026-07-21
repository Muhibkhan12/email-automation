from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.upload_file import UploadFile
from schema.upload_file import UploadFileSchema, UploadedFileUpdateSchema


def get_upload_file_or_404(db: Session, upload_file_id: int) -> UploadFile:

    upload_file = db.get(UploadFile, upload_file_id)

    if upload_file is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload file not found."
        )

    return upload_file


def add_upload_file(
    db: Session,
    credentials: UploadFileSchema
):
    """Create a new upload file."""

    upload_file = UploadFile(**credentials.model_dump())

    db.add(upload_file)

    try:
        db.commit()
        db.refresh(upload_file)
    except Exception:
        db.rollback()
        raise

    return {
        "message": "Upload file created successfully.",
        "data": upload_file
    }


def update_upload_file(
    db: Session,
    upload_file_id: int,
    credentials: UploadFileUpdateSchema
):
    """Update an existing upload file."""

    upload_file = get_upload_file_or_404(db, upload_file_id)

    for field, value in credentials.model_dump(exclude_unset=True).items():
        setattr(upload_file, field, value)

    try:
        db.commit()
        db.refresh(upload_file)
    except Exception:
        db.rollback()
        raise

    return {
        "message": "Upload file updated successfully.",
        "data": upload_file
    }


def delete_upload_file(
    db: Session,
    upload_file_id: int
):
    """Delete an upload file."""

    upload_file = get_upload_file_or_404(db, upload_file_id)

    try:
        db.delete(upload_file)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "message": "Upload file deleted successfully."
    }