from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schema.sender_account import addSenderAccountSchema, updateSenderAccout
from services.user import GetCurrentUser
from services.sender_accounts import (
    add_sender_account,
    update_sender_account,
    delete_sender_account,
    get_account_by_id,
    get_all_sender_accounts,
    get_my_senders_accounts_using_id
)

router = APIRouter(
    prefix="/sender-accounts",
    tags=["Sender Account"],
)

@router.get("/my")
def get_my_senders_accounts(
    current_user : User = Depends(GetCurrentUser),
    db : Session = Depends(get_db),
):
    return get_my_senders_accounts_using_id(current_user,db)

@router.get("/all")
def getAllSenderAccounts(
    current_user: User = Depends(GetCurrentUser),
    db: Session = Depends(get_db),
):
    return get_all_sender_accounts(current_user.id, db)

@router.get("/{id}")
def getAccount(
    id: int,
    current_user: User = Depends(GetCurrentUser),
    db: Session = Depends(get_db),
):
    return get_account_by_id(id, current_user.id, db)

@router.post("/")
def addSenderAccount(
    credentials: addSenderAccountSchema,
    current_user: User = Depends(GetCurrentUser),
    db: Session = Depends(get_db),
):
    return add_sender_account(db=db, credentials=credentials, user_id=current_user.id)

@router.put("/{id}")
def updateSenderAcc(
    id: int,
    credentials: updateSenderAccout,
    current_user: User = Depends(GetCurrentUser),
    db: Session = Depends(get_db),
):
    return update_sender_account(id, db, credentials, current_user.id)

@router.delete("/{id}")
def deleteAccount(
    id: int,
    current_user: User = Depends(GetCurrentUser),
    db: Session = Depends(get_db),
):
    return delete_sender_account(id, db, current_user.id)