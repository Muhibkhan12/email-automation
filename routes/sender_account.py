from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from schema.sender_account import addSenderAccountSchema, updateSenderAccout
from database import get_db
from services.sender_accounts import  add_sender_account, update_sender_account, delete_sender_account, get_account

router = APIRouter(
    prefix="/sender-accounts",
    tags=["Sender Account"]
)

@router.get("/{id}")
def getAccount(id : int, db : Session = Depends(get_db)):
    return get_account(id, db)

@router.post("/")
def addSenderAccount(credentials : addSenderAccountSchema, db : Session = Depends(get_db)):
    return add_sender_account(db = db ,credentials = credentials)

@router.put("/{id}")
def updateSenderAcc(id : int , credentials : updateSenderAccout, db : Session = Depends(get_db)):
    return update_sender_account(id, db, credentials)

@router.delete("/{id}")
def deleteAccount(id : int, db: Session = Depends(get_db)):
    return delete_sender_account(id, db)