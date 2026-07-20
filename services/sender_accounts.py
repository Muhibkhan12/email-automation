from fastapi import HTTPException,status

from sqlalchemy.orm import Session
from services.security import hash_password
from schema.sender_account import addSenderAccountSchema, updateSenderAccout
from models.sender_account import SenderAccount

def add_sender_account(db : Session ,credentials : addSenderAccountSchema):
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
        try: 
            db.commit()
        except:
            db.rollback()
            raise
        db.refresh(add_account)
        return{
                "message" : "Account Added successfully",
                "account" : add_account
        }



def update_sender_account(id, db , credentials):
    sender_account = db.query(SenderAccount).filter(SenderAccount.id == id).first()
    if not sender_account:
        raise HTTPException(
              status_code=status.HTTP_400_BAD_REQUEST,
              detail="Sender Account not found"
        ) 
      
    existing_email = db.query(SenderAccount).filter(SenderAccount.email == credentials.email, SenderAccount.id != id).first()
    if existing_email:
        raise HTTPException(
              status_code=status.HTTP_400_BAD_REQUEST,
              detail="Email is already being used by other sender account"
        )
    
    sender_account.email = credentials.email
    sender_account.password = credentials.password
    sender_account.display_name = credentials.display_name
    sender_account.provider = credentials.provider
    sender_account.username = credentials.username
    sender_account.smtp_host = credentials.smtp_host
    sender_account.smtp_port = credentials.smtp_port
    sender_account.daily_limit = credentials.daily_limit
    sender_account.hourly_limit = credentials.hourly_limit

    db.commit()
    db.refresh(SenderAccount)

    return{
         "message" : "Account Updated Successfully",
         "account" : sender_account
    }


def delete_sender_account(id : int, db : Session):
    existing_account = db.query(SenderAccount).filter(SenderAccount.id == id).first()
    if not existing_account:
         raise HTTPException(
              status_code=status.HTTP_404_NOT_FOUND,
              detail="Account doesn't exist"
         )
    
    db.delete(existing_account)
    db.commit()

    return{
         "message" : "Account Deleted Successfully"
    }

def get_account(id : int, db):
     data = db.query(SenderAccount).filter(SenderAccount.id == id).first()

     if not data:
          raise HTTPException(
               status_code=status.HTTP_404_NOT_FOUND,
               detail="Account doesn't exist"
          )
     return {
          "message":"User Exist",
          "account" : data
     }
     