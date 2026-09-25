from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db

from schema.campaign_recipients import (
    AddRecipientsSchema,
    RecipientsResponse,
    UpdateRecipientsSchema
)
from models.campaign_recipients import CampaignRecipient
import services.campaign_recipients as recipient_service

from services.user import (
    GetCurrentUser,
    require_admin
)

router = APIRouter(
    prefix="/recipient",
    tags=["recipients"]
)

@router.get("/")
def get_recipients(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    return recipient_service.get_all_recipients(
        db=db,
        page=page,
        limit=limit
    )

@router.get("/{id}")
def get_data_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user=Depends(GetCurrentUser)
):
    return recipient_service.get_recipients_by_id(
        id,
        db,
        current_user
    )


# =========================================================
# CREATE RECIPIENT
# ADMIN + EMPLOYEE
# =========================================================

@router.post("/add")
def add_recipients(
    credentials: AddRecipientsSchema,
    db: Session = Depends(get_db),
    current_user=Depends(GetCurrentUser)
):
    return recipient_service.add_recipients_data(
        db,
        credentials,
        current_user
    )


# =========================================================
# UPDATE RECIPIENT
# ADMIN + EMPLOYEE
# Employee → only their own recipient
# =========================================================

@router.patch("/{id}")
def update_recipients(
    id: int,
    credentials: UpdateRecipientsSchema,
    db: Session = Depends(get_db),
    current_user=Depends(GetCurrentUser)
):
    return recipient_service.updated_recipients_data(
        id,
        db,
        credentials,
        current_user
    )


# =========================================================
# DELETE RECIPIENT
# ADMIN + EMPLOYEE
# Employee → only their own recipient
# =========================================================

@router.delete("/{id}")
def delete_recipient(
    id: int,
    db: Session = Depends(get_db),
    current_user=Depends(GetCurrentUser)
):
    return recipient_service.delete_recipient_data(
        id,
        db,
        current_user
    )

@router.get("/{campaign_id}/recipients")
def get_recipient(campaign_id : int, db : Session = Depends(get_db)):
    recipients = (
        db.query(CampaignRecipient).filter(CampaignRecipient.campaign_id).all()
    )
    return  recipients