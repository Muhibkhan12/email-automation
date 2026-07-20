from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from schema.sender_account import addSenderAccountSchema
from database import get_db
from services.sender_accounts import  add_sender_account

router = APIRouter(
    prefix="/sender_accounts",
    tags="senderAccount"
)

@router.post()
def addSenderAccount(credentials : addSenderAccountSchema, db : Session = Depends(get_db)):
    return add_sender_account(db = db ,credentials = credentials)