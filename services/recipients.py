from fastapi import HTTPException, status

from sqlalchemy.orm import Session

from models.recipients import Recipients
from schema.recipients import AddRecipientsSchema, UpdateRecipientsSchema

def get_all_recipients(db :  Session):
    pass

def add_recipients_data(db : Session, credentials : AddRecipientsSchema):
    upload_recipient = Recipients(**credentials.model_dump())


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

def updated_recipients_data(db : Session, credentials : UpdateRecipientsSchema):
    pass