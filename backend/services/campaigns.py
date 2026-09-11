from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.campaigns import Campaign
from schema.campaigns import AddCampaignSchema, UpdateCampaignSchema
from models.user import User
from models.user import UserRole


def get_all_campaigns(db: Session):
    data = db.query(Campaign).all()

    return {
        "message": "Campaigns fetched successfully",
        "count": len(data),
        "data": data
    }


def get_campaign_by_id(db: Session, id: int):
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == id)
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign doesn't exist"
        )

    return campaign


def add_campaign(
    db: Session,
    credentials: AddCampaignSchema,
    current_user: User
):
    # Do NOT take user_id from the frontend.
    # Get it from the authenticated user.

    campaign_data = credentials.model_dump()

    campaign_data["user_id"] = current_user.id

    campaign = Campaign(**campaign_data)

    db.add(campaign)

    try:
        db.commit()
        db.refresh(campaign)

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Campaign created successfully",
        "campaign": campaign
    }


def update_campaign(
    db: Session,
    id: int,
    credentials: UpdateCampaignSchema,
    current_user: User
):
    campaign = get_campaign_by_id(db, id)

    # Employee can update only their own campaign
    if current_user.role == UserRole.EMPLOYEE:
        if campaign.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own campaigns"
            )

    # Admin can update any campaign

    for key, val in credentials.model_dump(
        exclude_unset=True
    ).items():
        setattr(campaign, key, val)

    try:
        db.commit()
        db.refresh(campaign)

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Campaign updated successfully",
        "campaign": campaign
    }


def delete_campaign(
    db: Session,
    id: int,
    current_user: User
):
    campaign = get_campaign_by_id(db, id)

    # Employee can delete only their own campaign
    if current_user.role == UserRole.EMPLOYEE:
        if campaign.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own campaigns"
            )

    # Admin can delete any campaign

    try:
        db.delete(campaign)
        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Campaign deleted successfully"
    }
