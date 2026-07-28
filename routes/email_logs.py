from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schema.campaigns import AddCampaignSchema, UpdateCampaignSchema
import services.campaigns as campaign_service

router = APIRouter(
    prefix="/campaigns",
    tags=["campaigns"]
)

@router.get("/")
def get_all_campaigns(db: Session = Depends(get_db)):
    return campaign_service.get_all_campaigns(db)

@router.get("/{id}")
def get_campaign(id: int, db: Session = Depends(get_db)):
    return campaign_service.get_campaign_by_id(db, id)

@router.post("/add")
def add_campaign(credentials: AddCampaignSchema, db: Session = Depends(get_db)):
    return campaign_service.add_campaign(db, credentials)

@router.patch("/update/{id}")
def update_campaign(id: int, credentials: UpdateCampaignSchema, db: Session = Depends(get_db)):
    return campaign_service.update_campaign(db, id, credentials)

@router.delete("/delete/{id}")
def delete_campaign(id: int, db: Session = Depends(get_db)):
    return campaign_service.delete_campaign(db, id)

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schema.email_logs import AddEmailLogSchema, UpdateEmailLogSchema
import services.email_logs as email_log_service

router = APIRouter(
    prefix="/email-logs",
    tags=["email_logs"]
)

@router.get("/")
def get_all_email_logs(db: Session = Depends(get_db)):
    return email_log_service.get_all_email_logs(db)

@router.get("/{id}")
def get_email_log(id: int, db: Session = Depends(get_db)):
    return email_log_service.get_email_log_by_id(db, id)

@router.post("/add")
def add_email_log(credentials: AddEmailLogSchema, db: Session = Depends(get_db)):
    return email_log_service.add_email_log(db, credentials)

@router.patch("/update/{id}")
def update_email_log(id: int, credentials: UpdateEmailLogSchema, db: Session = Depends(get_db)):
    return email_log_service.update_email_log(db, id, credentials)