from workers.celery_app import celery
from fastapi import HTTPException, status
import pandas as pd
from models.upload_file import Upload
from database import SessionLocal
from services.upload_file import  get_upload_by_campaign
from services.campaigns import  get_campaign_by_id

from models.campaigns import Campaign
from schema.campaigns import CampaignStatus
from schema.upload_file import UploadStatus
from schema.campaign_recipients import AddRecipientsSchema
from sqlalchemy.orm import Session

@celery.task()
def extract_emails(upload_id : int):
        db =  SessionLocal()
        # 1. Get upload from DB
        # 2. Read upload.file_path
        # 3. Extract recipients
        # 4. Save recipients
        # 5. Update uploads table
        # 6. Update campaign status
        # 7. Push recipient IDs to email queue
        try:
            upload = db.query(Upload).filter(Upload.id == upload_id).first()
            if upload is None:
                raise HTTPException(
                      status_code=status.HTTP_400_BAD_REQUEST,
                      details="FIle doesn't exist"
                )
            extension = upload.file_path.split(".")[-1].lower()
            if extension == "xlsx":
                   df = pd.read_excel(upload.file_path)
            elif extension == "csv":
                   df = pd.read_csv(upload.file_path)
            else:
                  raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Only XLSX and CSV files are allowed"
                    )
            if "email" not in df.columns:
                  raise HTTPException("Email column is required")

            for rows in df.itterows():
                recipient = AddRecipientsSchema(
                    campaign_id = upload.campaign_id,
                    upload_id = upload.id,
                    name = rows["name"],
                    email = rows["email"],
                    company = rows["company"],
                    phone = rows["phone"],
                    is_valid_email=True
                )
                db.add(recipient)

                upload.total_records = len(df)
                upload.processed_records = 0
                upload.status = UploadStatus.COMPLETED

                campaign = (
                      db.query(Campaign).filter(Campaign.id == upload.id).first()
                )
                campaign.status = CampaignStatus.READY

                db.commit()
        except Exception:
              db.rollback()
              raise

        finally:
                db.close()


