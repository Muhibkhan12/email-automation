from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schema.campaign_recipients import (AddRecipientsSchema, RecipientsResponse, UpdateRecipientsSchema)
import backend.services.campaign_recipients as recipient_service


router = APIRouter(
    prefix="/recipient",
    tags=["recipients"]
)

@router.get("/all")
def get_all_recipients(db: Session = Depends(get_db)):
    return recipient_service.get_all_recipients(db)

@router.get("/{id}")
def get_data_by_id(id : int, db : Session = Depends(get_db)):
    return recipient_service.get_recipients_by_id(id, db)

@router.post("/add")
def add_recipients(credentials : AddRecipientsSchema , db : Session = Depends(get_db)):
    return recipient_service.add_recipients_data(db,credentials)

@router.patch("/{id}")
def update_recipients(
        id : int,
        credenitials : UpdateRecipientsSchema,
        db : Session = Depends(get_db)
    ):
    return recipient_service.updated_recipients_data(id, db, credenitials)

@router.delete("/{id}")
def delete_recipient(id : int, db : Session = Depends(get_db)):
    return recipient_service.delete_recipient_data(id, db)