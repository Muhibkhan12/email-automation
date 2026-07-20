from fastapi import HTTPException,status

from sqlalchemy.orm import Session
from security import hash_password
from schema.sender_account import addSenderAccountSchema
from models.sender_account import SenderAccount

def AddSenderAccount(db : Session ,credentials : addSenderAccountSchema):
        existing_data = db.query(SenderAccount).filter(credentials.email == SenderAccount.email).first()

        if existing_data:
                raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Account Already Exist"
                )
        add_account = SenderAccount(
                email = credentials.email,
                password = hash_password(credentials.password),
                display_name = credentials.display_name,
                provider = credentials.provider,
                username = credentials.username,
                smtp_host = credentials.smtp_host,
                smtp_port = credentials.smtp_port,
                daily_limit = credentials.daily_limit,
                hourly_limit = credentials.hourly_limit,
        )
        db.add(add_account)
        db.commit()
        db.refresh(add_account)
        return{
                "message" : "Account Added successfully",
                "account" : add_account
        }