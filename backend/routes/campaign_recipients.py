from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db

from schema.campaign_recipients import (
    AddRecipientsSchema,
    RecipientsResponse,
    UpdateRecipientsSchema
)

import services.campaign_recipients as recipient_service

from services.user import (
    GetCurrentUser,
    require_admin
)


router = APIRouter(
    prefix="/recipient",
    tags=["recipients"]
)

@router.get(
    "/all",
    dependencies=[Depends(require_admin)]
)
def get_all_recipients(
    db: Session = Depends(get_db)
):
    return recipient_service.get_all_recipients(db)


# =========================================================
# GET RECIPIENT BY ID
# ADMIN + EMPLOYEE
# Employee → only their own recipient
# =========================================================

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
