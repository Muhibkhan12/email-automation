import pandas as pd
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from schema.campaigns import CampaignStatus
from services.upload_file import  get_upload_by_campaign
from services.campaigns import  get_campaign_by_id
from workers.extract_email import extract_emails



def start_campaign(db : Session, campaign_id :  int ):
    upload = get_upload_by_campaign(db,campaign_id)
    campaign = get_campaign_by_id(db,campaign_id)

    if campaign.status != CampaignStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign has already been started"
        )

    extract_emails.apply_async(
        args=[upload.id],
        queue="extract_emails_queue"
    )

    return{
        "message" : "Campaign has been queued Successfully"
    }
