import pandas as pd
from sqlalchemy.orm import Session
from services.upload_file import  get_upload_by_campaign
from services.campaigns import  get_campaign_by_id
from workers.extract_email import extract_emails



def start_campaign(db : Session, campaign_id :  int ):
    upload = get_upload_by_campaign(db,campaign_id)
    campaign = get_campaign_by_id(db,campaign_id)

    extract_emails.delay(upload.id)

    return{
        "message" : "Campaign has been queued Successfully"
    }
