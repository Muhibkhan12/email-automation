from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from services.user import GetCurrentUser


from pydantic import BaseModel

from models.campaigns import Campaign
from redis_client import load_analytics
from schema.campaigns import CampaignStatus
from workers.start_campaign import dispatch_campaign


class StartCampaignBody(BaseModel):
    upload_id: int

from models.upload_file import Upload, UploadStatus

from workers.extract_email import extract_upload_task

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

    extract_upload_task.apply_async(
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


@router.get("/analytics/{upload_id}")
def get_analytics(
    upload_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(GetCurrentUser),
):
    upload = (
        db.query(Upload)
        .filter(Upload.id == upload_id, Upload.user_id == current_user.id)
        .first()
    )
    if upload is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Upload file not found.")

    # Redis first, MySQL fallback if the cache expired.
    cached = load_analytics(upload_id)
    if cached:
        return {"data": cached}

    return {
        "data": {
            "upload_id": upload.id,
            "status": upload.status,
            "total_rows": upload.total_rows,
            "valid_count": upload.valid_count,
            "invalid_count": upload.invalid_count,
            "duplicate_count": upload.duplicate_count,
        }
    }


@router.post("/start/{campaign_id}")
def start_campaign(
    campaign_id: int,
    body: StartCampaignBody,
    db: Session = Depends(get_db),
    current_user=Depends(GetCurrentUser),
):
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
        .first()
    )
    if campaign is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Campaign not found.")

    upload = (
        db.query(Upload)
        .filter(Upload.id == body.upload_id, Upload.user_id == current_user.id)
        .first()
    )
    if upload is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Upload file not found.")
    if upload.status != UploadStatus.COMPLETED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Extraction is not finished yet.")

    # Form completeness check
    if not (campaign.subject and campaign.template_id and campaign.sender_account_id):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Fill subject, template and sender account first.",
        )

    # Double-click guard
    if campaign.status == CampaignStatus.RUNNING:
        raise HTTPException(status.HTTP_409_CONFLICT, "Campaign already started.")

    campaign.status = CampaignStatus.RUNNING
    db.commit()

    dispatch_campaign.apply_async(
        args=[campaign.id, upload.id],
        queue="extract_emails_queue",
    )

    return {"message": "Campaign started.", "data": {"campaign_id": campaign.id}}