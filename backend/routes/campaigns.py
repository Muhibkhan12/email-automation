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