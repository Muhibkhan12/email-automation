import pandas as pd
from fastapi import HTTPException, status

from workers.celery_app import celery
from models.upload_file import Upload

from database import SessionLocal

from models.campaigns import Campaign
from models.campaign_recipients import CampaignRecipient

from schema.campaigns import CampaignStatus
from schema.upload_file import UploadStatus

from workers.sending_emails import sending_emails


@celery.task(queue="extract_emails_queue")
def extract_emails(upload_id : int):
        db =  SessionLocal()

        recipients = []

        try:
            # get upload using uplod-id
            upload = db.query(Upload).filter(Upload.id == upload_id).first()

            if upload is None:
                raise HTTPException(
                      status_code=status.HTTP_400_BAD_REQUEST,
                      detail="FIle doesn't exist"
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
                  raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Email column is required"
                  )

            for _, row in df.iterrows():
                recipient = CampaignRecipient(
                    campaign_id = upload.campaign_id,
                    upload_id = upload.id,
                    name = row["name"],
                    email = row["email"],
                    company = row["company"],
                    phone = row["phone"],
                    is_valid_email=True
                )
            recipients.append(recipient)
            db.add_all(recipients)
            upload.total_records = len(df)
            upload.processed_records = 0
            upload.status = UploadStatus.COMPLETED

            # campaign
            campaign = (
                  db.query(Campaign).filter(Campaign.id == upload.campaign_id).first()
                )
            if campaign:
                campaign.status = CampaignStatus.READY
            # saves everything
            db.commit()

            for recipient in recipients:
                  db.refresh(recipient)

            for recipient in recipients:
                  sending_emails.apply_async(
                        args=[recipient.id],
                        queue="email_sending_queue"
                  )
            
        except Exception:
              db.rollback()
              raise

        finally:
                db.close()