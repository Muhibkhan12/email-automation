from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from services.user import GetCurrentUser
from models.upload_file import Upload, UploadStatus
from workers.extract_email import extract_emails

router = APIRouter(
    prefix="/worker",
    tags=["email_worker"],
)


@router.post("/extract/{upload_id}")
def start_extraction(
    upload_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(GetCurrentUser),
):
    upload = (
        db.query(Upload)
        .filter(Upload.id == upload_id, Upload.user_id == current_user.id)
        .first()
    )

    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload file not found",
        )

    if upload.status in (UploadStatus.PROCESSING, UploadStatus.COMPLETED):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This file has already been processed or is being processed.",
        )

    # Retry of a failed upload: the task only runs for UPLOADED status
    if upload.status == UploadStatus.FAILED:
        upload.status = UploadStatus.UPLOADED
        upload.error_message = None
        db.commit()

    extract_emails.delay(upload.id)

    return {
        "message": "Processing started.",
        "data": {"upload_id": upload.id},
    }