from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.models.campaigns import Campaign
from backend.schema.campaigns import AddCampaignSchema, UpdateCampaignSchema


def get_all_campaigns(db: Session):
    data = db.query(Campaign).all()
    return {
        "message": "Campaigns fetched successfully",
        "count": len(data),
        "data": data
    }


def get_campaign_by_id(db: Session, id: int):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign doesn't exist"
        )
    return campaign


def add_campaign(db: Session, credentials: AddCampaignSchema):
    campaign = Campaign(**credentials.model_dump())

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


def update_campaign(db: Session, id: int, credentials: UpdateCampaignSchema):
    campaign = get_campaign_by_id(db, id)

    for key, val in credentials.model_dump(exclude_unset=True).items():
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


def delete_campaign(db: Session, id: int):
    campaign = get_campaign_by_id(db, id)

    try:
        db.delete(campaign)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "message": "Campaign deleted successfully"
    }