from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.campaign_recipients import CampaignRecipient
from models.campaigns import Campaign
from models.user import UserRole

from schema.campaign_recipients import (
    AddRecipientsSchema,
    UpdateRecipientsSchema
)


# =========================================================
# GET ALL RECIPIENTS
# ADMIN ONLY
#
# Router already protects this route with require_admin.
# =========================================================

def get_all_recipients(db: Session):
    data = db.query(CampaignRecipient).all()

    return {
        "message": "Recipients fetched successfully",
        "count": len(data),
        "data": data
    }


# =========================================================
# GET RECIPIENT BY ID
# ADMIN + EMPLOYEE
#
# Employee → only recipient belonging to their campaign
# Admin    → any recipient
# =========================================================

def get_recipients_by_id(
    id: int,
    db: Session,
    current_user: User
):
    recipient = (
        db.query(CampaignRecipient)
        .filter(CampaignRecipient.id == id)
        .first()
    )

    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient doesn't exist"
        )

    # Employee can only access recipients
    # belonging to their own campaign
    if current_user.role == UserRole.EMPLOYEE:

        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == recipient.campaign_id)
            .first()
        )

        if not campaign or campaign.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access recipients from your own campaigns"
            )

    return {
        "message": "Recipient found successfully",
        "recipient": recipient
    }


# =========================================================
# CREATE RECIPIENT
# ADMIN + EMPLOYEE
#
# Employee → can only add recipient to their own campaign
# =========================================================

def add_recipients_data(
    db: Session,
    credentials: AddRecipientsSchema,
    current_user: User
):
    recipient_data = credentials.model_dump()

    campaign_id = recipient_data.get("campaign_id")

    # Make sure campaign exists
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id)
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign doesn't exist"
        )

    # Employee can only add recipients
    # to their own campaign
    if current_user.role == UserRole.EMPLOYEE:

        if campaign.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only add recipients to your own campaigns"
            )

    upload_recipient = CampaignRecipient(**recipient_data)

    db.add(upload_recipient)

    try:
        db.commit()
        db.refresh(upload_recipient)

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Data added to DB successfully",
        "data": upload_recipient
    }


# =========================================================
# UPDATE RECIPIENT
# ADMIN + EMPLOYEE
#
# Employee → only recipient from their own campaign
# =========================================================

def updated_recipients_data(
    id: int,
    db: Session,
    credentials: UpdateRecipientsSchema,
    current_user: User
):
    recipient = (
        db.query(CampaignRecipient)
        .filter(CampaignRecipient.id == id)
        .first()
    )

    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient doesn't exist"
        )

    # Employee ownership check
    if current_user.role == UserRole.EMPLOYEE:

        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == recipient.campaign_id)
            .first()
        )

        if not campaign or campaign.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update recipients from your own campaigns"
            )

    update_data = credentials.model_dump(
        exclude_unset=True
    )

    for key, val in update_data.items():
        setattr(recipient, key, val)

    try:
        db.commit()
        db.refresh(recipient)

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Recipient updated successfully",
        "data": recipient
    }


# =========================================================
# DELETE RECIPIENT
# ADMIN + EMPLOYEE
#
# Employee → only recipient from their own campaign
# =========================================================

def delete_recipient_data(
    id: int,
    db: Session,
    current_user: User
):
    recipient = (
        db.query(CampaignRecipient)
        .filter(CampaignRecipient.id == id)
        .first()
    )

    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient doesn't exist"
        )

    # Employee ownership check
    if current_user.role == UserRole.EMPLOYEE:

        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == recipient.campaign_id)
            .first()
        )

        if not campaign or campaign.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete recipients from your own campaigns"
            )

    try:
        db.delete(recipient)
        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Recipient deleted successfully"
    }