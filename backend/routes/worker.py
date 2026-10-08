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
    current_user=Depends(GetCurrentUser),
):
    # ---------------------------------------------------------
    # 1. Find upload belonging to current user
    # ---------------------------------------------------------

    upload = (
        db.query(Upload)
        .filter(
            Upload.id == upload_id,
            Upload.user_id == current_user.id,
        )
        .first()
    )

    if upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload file not found.",
        )

    # ---------------------------------------------------------
    # 2. Don't allow duplicate processing
    # ---------------------------------------------------------

    if upload.status == UploadStatus.PROCESSING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This file is already being processed.",
        )

    if upload.status == UploadStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This file has already been processed.",
        )

    # ---------------------------------------------------------
    # 3. Retry failed upload
    # ---------------------------------------------------------

    if upload.status == UploadStatus.FAILED:
        upload.status = UploadStatus.UPLOADED
        upload.error_message = None

        db.commit()
        db.refresh(upload)

    # ---------------------------------------------------------
    # 4. Queue extraction job
    # ---------------------------------------------------------

    extract_emails.apply_async(
        args=[upload.id],
        queue="extract_emails_queue",
    )

    # ---------------------------------------------------------
    # 5. Return immediately
    # ---------------------------------------------------------

    return {
        "message": "File extraction queued successfully.",
        "data": {
            "upload_id": upload.id,
            "status": upload.status,
        },
    }