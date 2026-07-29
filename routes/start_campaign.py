from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from services.start_campaign import start_campaign
from services.validate_file import validate_file
from services.upload_file import delete_upload_file, get_upload_by_campaign
from services.campaigns import update_campaign
from database import get_db

router = APIRouter(
    prefix="/campaigns",
    tags=["start_campaign"]
)

@router.post("/{campaign_id}/start")
def start_campaign_route(campaign_id : int, db : Session = Depends(get_db)):
    return start_campaign(db, campaign_id)