from fastapi import HTTPException, status
import pandas as pd

from services.validate_file import validate_file
from services.upload_file import delete_upload_file, get_upload_by_campaign
from services.campaigns import update_campaign, get_campaign_by_id
from schema.campaigns import CampaignStatus
from schema.upload_file import UploadStatus
from schema.campaign_recipients import AddRecipientsSchema
from sqlalchemy.orm import Session

def start_campaign(db : Session, campaing_id :  int):

    campaign = get_campaign_by_id(db,campaing_id)
    upload = get_upload_by_campaign(db,campaing_id)

    if upload.stored_filename.split(".")[-1].lower() == "xlsx":
        df = pd.read_excel(upload.file_path)
    elif upload.stored_filename.split(".")[-1].lower() == "csv":
        df = pd.read_csv(upload.file_path)

    for _, row in df.iterrows():
        recipient = AddRecipientsSchema(
            campaign_id=campaign.id,
            upload_id=upload.id,

            email=row["email"],

            name=row.get("name"),
            company=row.get("company"),
            phone=row.get("phone"),

            is_valid_email=True
        )
        db.add(recipient)

    upload.total_records = len(df)
    upload.processed_records = 0
    upload.status = UploadStatus.COMPLETED

    campaign.status = CampaignStatus.READY
    
    db.commit()

    return{
        "message" : "Campaign is ready",
        "total_recipient" : len(df)
    }
    


