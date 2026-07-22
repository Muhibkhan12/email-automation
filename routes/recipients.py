from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
# from models.recipients import Recipients
from schema.recipients import (AddRecipientsSchema, RecipientsResponse, UpdateRecipientsSchema)
import services.recipients as recipient_service


router = APIRouter(
    prefix="/recipients",
    tags="recipients"
)

@router.get("/all")
def get_all_recipients(db: Session = Depends(get_db),response_model=list[RecipientsResponse]):
    return recipient_service.get_all_recipients(db)


@router.post("/add")
def add_recipients(credentials : AddRecipientsSchema , db : Session = Depends(get_db)):
    return recipient_service.add_recipients_data(db,credentials)
