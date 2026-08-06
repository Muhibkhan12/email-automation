from fastapi import HTTPException, status

from sqlalchemy.orm import Session

from models.campaign_recipients import CampaignRecipient
from schema.campaign_recipients import AddRecipientsSchema, UpdateRecipientsSchema

def get_all_recipients(db :  Session):
    data = db.query(CampaignRecipient).all()
    return{
        "message" : "Recipients fetched successfully",
        "count" : len(data),
        "data": data 
    }

def get_recipients_by_id(id : int, db : Session):
    recipient = db.query(CampaignRecipient).filter(CampaignRecipient.id == id).first()
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient Doesn't exist"
        )
    return{
        "message" : "Recipient Found Successfully",
        "recipient" : recipient
    }
    
def add_recipients_data(db : Session, credentials : AddRecipientsSchema):
    upload_recipient = CampaignRecipient(**credentials.model_dump())


    db.add(upload_recipient)
    try:
        db.commit()
        db.refresh(upload_recipient)
    except Exception:
        db.rollback()
        raise

    return {
        "message" : "Data added to DB successfully",
        "data" : upload_recipient
    }

def updated_recipients_data(id : int,db : Session, credentials : UpdateRecipientsSchema):

    data = get_recipients_by_id(id, db )["recipient"]
    update_data = credentials.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(data, key, val)

    db.commit()
    db.refresh(data)

    return{
        "message" : "Recipient updated Successfully",
        "data" : data
    }

def delete_recipient_data(id : int, db : Session):
    data = get_recipients_by_id(id,db)["recipient"]

    db.delete(data)
    db.commit()

    return{
        "message" : "Recipient Deleted Successfully"
    }