from fastapi import HTTPException, status
from sqlalchemy import or_, cast, String, func
from sqlalchemy.orm import Session

from models.campaign_recipients import CampaignRecipient
from models.campaigns import Campaign
from models.user import User, UserRole

from schema.campaign_recipients import (
    AddRecipientsSchema,
    UpdateRecipientsSchema
)


def get_all_recipients(
    db: Session,
    current_user: User,
    page: int = 1,
    limit: int = 20,
    upload_id: int | None = None,
    search: str | None = None,
    status_filter: str | None = None
):
    page = max(page, 1)
    limit = min(max(limit, 1), 100)
    offset = (page - 1) * limit

    query = (
        db.query(CampaignRecipient)
        .join(Campaign, CampaignRecipient.campaign_id == Campaign.id)
        .filter(Campaign.user_id == current_user.id)
    )

    if upload_id is not None:
        query = query.filter(CampaignRecipient.upload_id == upload_id)

    if status_filter and status_filter != "All":
        query = query.filter(CampaignRecipient.status == status_filter)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                CampaignRecipient.name.ilike(term),
                CampaignRecipient.email.ilike(term),
                cast(CampaignRecipient.id, String).ilike(term),
            )
        )

    total = query.count()

    data = (
        query.order_by(CampaignRecipient.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    total_pages = (total + limit - 1) // limit

    return {
        "message": "Recipients fetched successfully",
        "data": data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
        },
    }


def get_recipients_of_campaign(
    campaign_id: int,
    db: Session,
    current_user: User
):
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

    if current_user.role == UserRole.EMPLOYEE and campaign.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access recipients from your own campaigns"
        )

    return (
        db.query(CampaignRecipient)
        .filter(CampaignRecipient.campaign_id == campaign_id)
        .all()
    )


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


def add_recipients_data(
    db: Session,
    credentials: AddRecipientsSchema,
    current_user: User
):
    recipient_data = credentials.model_dump()

    campaign_id = recipient_data.get("campaign_id")

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

    update_data = credentials.model_dump(exclude_unset=True)

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