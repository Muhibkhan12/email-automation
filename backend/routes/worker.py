from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from services.user import GetCurrentUser

from models.campaigns import Campaign
from models.campaign_recipients import CampaignRecipient, RecipientStatus
from models.upload_file import Upload, UploadStatus
from redis_client import load_analytics
from schema.campaigns import CampaignStatus
from workers.extract_email import extract_upload_task
from workers.start_campaign import dispatch_campaign
from workers.sending_emails import schedule_campaign_sends


class StartCampaignBody(BaseModel):
    upload_id: int


router = APIRouter(
    prefix="/worker",
    tags=["email_worker"],
)


def _get_user_campaign(db: Session, campaign_id: int, user_id: int) -> Campaign:
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.user_id == user_id)
        .first()
    )
    if campaign is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Campaign not found.")
    return campaign


# ---------------------------------------------------------
# Extraction (unchanged)
# ---------------------------------------------------------

@router.post("/extract/{upload_id}")
def start_extraction(
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

    if upload.status == UploadStatus.PROCESSING:
        raise HTTPException(status.HTTP_409_CONFLICT, "This file is already being processed.")

    if upload.status == UploadStatus.COMPLETED:
        raise HTTPException(status.HTTP_409_CONFLICT, "This file has already been processed.")

    if upload.status == UploadStatus.FAILED:
        upload.status = UploadStatus.UPLOADED
        upload.error_message = None
        db.commit()
        db.refresh(upload)

    extract_upload_task.apply_async(
        args=[upload.id],
        queue="extract_emails_queue",
    )

    return {
        "message": "File extraction queued successfully.",
        "data": {"upload_id": upload.id, "status": upload.status},
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

    cached = load_analytics(upload_id)
    if cached:
        return {"data": cached}

    return {
        "data": {
            "upload_id": upload.id,
            "status": upload.status,
            "total_rows": upload.total_records,
        }
    }


# ---------------------------------------------------------
# Campaign start / pause / resume
# ---------------------------------------------------------

@router.post("/start/{campaign_id}")
def start_campaign(
    campaign_id: int,
    body: StartCampaignBody,
    db: Session = Depends(get_db),
    current_user=Depends(GetCurrentUser),
):
    campaign = _get_user_campaign(db, campaign_id, current_user.id)

    upload = (
        db.query(Upload)
        .filter(Upload.id == body.upload_id, Upload.user_id == current_user.id)
        .first()
    )
    if upload is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Upload file not found.")
    if upload.status != UploadStatus.COMPLETED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Extraction is not finished yet.")

    if not (campaign.subject and campaign.template_id and campaign.sender_account_id):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Fill subject, template and sender account first.",
        )

    if campaign.status == CampaignStatus.RUNNING:
        raise HTTPException(status.HTTP_409_CONFLICT, "Campaign already started.")

    campaign.status = CampaignStatus.RUNNING
    db.commit()

    dispatch_campaign.apply_async(
        args=[campaign.id, upload.id],
        queue="extract_emails_queue",
    )

    return {"message": "Campaign started.", "data": {"campaign_id": campaign.id}}


@router.post("/pause/{campaign_id}")
def pause_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(GetCurrentUser),
):
    campaign = _get_user_campaign(db, campaign_id, current_user.id)

    if campaign.status != CampaignStatus.RUNNING:
        raise HTTPException(status.HTTP_409_CONFLICT, "Only a running campaign can be paused.")

    campaign.status = CampaignStatus.PAUSED
    db.commit()
    return {"message": "Campaign paused.", "data": {"campaign_id": campaign.id}}


@router.post("/resume/{campaign_id}")
def resume_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(GetCurrentUser),
):
    campaign = _get_user_campaign(db, campaign_id, current_user.id)

    if campaign.status != CampaignStatus.PAUSED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Only a paused campaign can be resumed.")

    # QUEUED ones that never ran -> back to PENDING so they get a fresh schedule
    db.query(CampaignRecipient).filter(
        CampaignRecipient.campaign_id == campaign_id,
        CampaignRecipient.status == RecipientStatus.QUEUED,
    ).update({CampaignRecipient.status: RecipientStatus.PENDING}, synchronize_session=False)
    db.commit()

    # Remaining recipients get a fresh random schedule starting now
    rescheduled = schedule_campaign_sends(db, campaign_id)

    campaign.status = CampaignStatus.RUNNING
    db.commit()

    return {
        "message": "Campaign resumed.",
        "data": {"campaign_id": campaign.id, "rescheduled": rescheduled},
    }


# ---------------------------------------------------------
# Progress (frontend polls this)
# ---------------------------------------------------------

@router.get("/progress/{campaign_id}")
def campaign_progress(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(GetCurrentUser),
):
    campaign = _get_user_campaign(db, campaign_id, current_user.id)

    rows = (
        db.query(CampaignRecipient.status, func.count(CampaignRecipient.id))
        .filter(CampaignRecipient.campaign_id == campaign_id)
        .group_by(CampaignRecipient.status)
        .all()
    )
    counts = {str(getattr(s, "value", s)).lower(): c for s, c in rows}

    next_send = (
        db.query(func.min(CampaignRecipient.scheduled_at))
        .filter(
            CampaignRecipient.campaign_id == campaign_id,
            CampaignRecipient.status.in_(
                [RecipientStatus.PENDING, RecipientStatus.QUEUED]
            ),
            CampaignRecipient.scheduled_at.isnot(None),
        )
        .scalar()
    )
    last_send = (
        db.query(func.max(CampaignRecipient.scheduled_at))
        .filter(
            CampaignRecipient.campaign_id == campaign_id,
            CampaignRecipient.status.in_(
                [RecipientStatus.PENDING, RecipientStatus.QUEUED]
            ),
        )
        .scalar()
    )

    return {
        "data": {
            "status": str(getattr(campaign.status, "value", campaign.status)).lower(),
            "sent": counts.get("sent", 0),
            "pending": counts.get("pending", 0),
            "queued": counts.get("queued", 0),
            "failed": counts.get("failed", 0),
            "total": sum(counts.values()),
            # scheduled_at DB me naive UTC hai, isliye "Z"
            "next_send_at": next_send.isoformat() + "Z" if next_send else None,
            "estimated_finish_at": last_send.isoformat() + "Z" if last_send else None,
        }
    }