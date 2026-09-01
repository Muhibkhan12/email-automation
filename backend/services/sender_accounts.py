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
        account = SenderAccount(**credentials.model_dump())
        db.add(account)
        try: 
            db.commit()
        except:
            db.rollback()
            raise
        db.refresh(account)
        return{
                "message" : "Account Added successfully",
                "account" : account
        }

def update_sender_account(
    id: int,
    db: Session,
    credentials: updateSenderAccout
):
    sender_account = (
        db.query(SenderAccount)
        .filter(SenderAccount.id == id)
        .first()
    )

    if not sender_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sender Account not found"
        )

    if credentials.email is not None:
        existing_email = (
            db.query(SenderAccount)
            .filter(
                SenderAccount.email == credentials.email,
                SenderAccount.id != id
            )
            .first()
        )

        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already being used by another sender account"
            )

    update_data = credentials.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(sender_account, field, value)

    db.commit()
    db.refresh(sender_account)

    return {
        "message": "Account Updated Successfully",
        "account": sender_account
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

def get_account_by_id(id : int, db):
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
     
def get_all_sender_accounts(db: Session):
     data = db.query(SenderAccount).all()
     return {
          "accounts" : data
     }