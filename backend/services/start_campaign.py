from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.campaigns import CampaignStatus
from services.campaigns import get_campaign_by_id
from services.upload_file import get_upload_by_campaign
from workers.start_campaign import dispatch_campaign


def start_campaign(db: Session, campaign_id: int, upload_id: int | None = None):
    campaign = get_campaign_by_id(db, campaign_id)

    if campaign.status != CampaignStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign has already been started",
        )

    if upload_id is None:
        upload = get_upload_by_campaign(db, campaign_id)
        if upload is None:
            raise HTTPException(status_code=400, detail="No upload found for this campaign")
        upload_id = upload.id

    campaign.status = CampaignStatus.RUNNING
    db.commit()

    dispatch_campaign.apply_async(
        args=[campaign_id, upload_id],
        queue="extract_emails_queue",
    )

    return {"message": "Campaign started", "status": "Running"}