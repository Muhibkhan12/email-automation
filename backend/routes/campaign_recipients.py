from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db

from schema.campaign_recipients import (
    AddRecipientsSchema,
    UpdateRecipientsSchema
)
import services.campaign_recipients as recipient_service

from services.user import GetCurrentUser

router = APIRouter(
    prefix="/recipient",
    tags=["recipients"]
)


@router.get("")
def get_recipients(
    page: int = 1,
    limit: int = 20,
    upload_id: int | None = None,
    search: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(GetCurrentUser)
):
    return recipient_service.get_all_recipients(
        db=db,
        current_user=current_user,
        page=page,
        limit=limit,
        upload_id=upload_id,
        search=search,
        status_filter=status,
    )


@router.get("/{campaign_id}/recipients")
def get_recipient(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(GetCurrentUser)
):
    return recipient_service.get_recipients_of_campaign(
        campaign_id,
        db,
        current_user
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