from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db

from schema.campaigns import (
    AddCampaignSchema,
    UpdateCampaignSchema
)

import services.campaigns as campaign_service

from services.user import (
    GetCurrentUser,
    require_admin
)


router = APIRouter(
    prefix="/campaigns",
    tags=["campaigns"]
)


# =========================================================
# GET ALL CAMPAIGNS
# ADMIN ONLY
# =========================================================

@router.get("/my")
def get_my_campaigns(
    db: Session = Depends(get_db),
    current_user = Depends(GetCurrentUser)
):
    return campaign_service.get_my_campaigns(
        db,
        current_user
    )



@router.get(
    "/",
    dependencies=[Depends(require_admin)]
)
def get_all_campaigns(
    db: Session = Depends(get_db)
):
    return campaign_service.get_all_campaigns(db)


# =========================================================
# GET CAMPAIGN BY ID
# ADMIN ONLY
# =========================================================

@router.get(
    "/{id}",
    dependencies=[Depends(require_admin)]
)
def get_campaign(
    id: int,
    db: Session = Depends(get_db)
):
    return campaign_service.get_campaign_by_id(db, id)


# =========================================================
# CREATE CAMPAIGN
# ADMIN + EMPLOYEE
# =========================================================

@router.post("/")
def add_campaign(
    credentials: AddCampaignSchema,
    db: Session = Depends(get_db),
    current_user = Depends(GetCurrentUser)
):
    return campaign_service.add_campaign(
        db,
        credentials,
        current_user
    )


# =========================================================
# UPDATE CAMPAIGN
# ADMIN + EMPLOYEE
# Employee → only own campaign
# =========================================================

@router.patch("/update/{id}")
def update_campaign(
    id: int,
    credentials: UpdateCampaignSchema,
    db: Session = Depends(get_db),
    current_user = Depends(GetCurrentUser)
):
    return campaign_service.update_campaign(
        db,
        id,
        credentials,
        current_user
    )


# =========================================================
# DELETE CAMPAIGN
# ADMIN + EMPLOYEE
# Employee → only own campaign
# =========================================================

@router.delete("/delete/{id}")
def delete_campaign(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(GetCurrentUser)
):
    return campaign_service.delete_campaign(
        db,
        id,
        current_user
    )
