from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from schema.sender_account import addSenderAccountSchema, updateSenderAccout
from models.sender_account import SenderAccount
from models.user import User


def _get_owned_account(id: int, user_id: int, db: Session) -> SenderAccount:
    account = (
        db.query(SenderAccount)
        .filter(SenderAccount.id == id, SenderAccount.user_id == user_id)
        .first()
    )
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sender Account not found",
        )
    return account


def add_sender_account(db: Session, credentials: addSenderAccountSchema, user_id: int):
    existing_data = (
        db.query(SenderAccount)
        .filter(SenderAccount.email == credentials.email)
        .first()
    )

    if existing_data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Account Already Exist",
        )

    # user_id always comes from the logged-in user (token), never from the client
    data = credentials.model_dump(exclude={"user_id"})
    account = SenderAccount(**data, user_id=user_id)

    db.add(account)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(account)

    return {
        "message": "Account Added successfully",
        "account": account,
    }


def update_sender_account(
    id: int,
    db: Session,
    credentials: updateSenderAccout,
    user_id: int,
):
    sender_account = _get_owned_account(id, user_id, db)

    if credentials.email is not None:
        existing_email = (
            db.query(SenderAccount)
            .filter(
                SenderAccount.email == credentials.email,
                SenderAccount.id != id,
            )
            .first()
        )
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already being used by another sender account",
            )

    update_data = credentials.model_dump(exclude_unset=True, exclude={"user_id"})
    for field, value in update_data.items():
        setattr(sender_account, field, value)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(sender_account)

    return {
        "message": "Account Updated Successfully",
        "account": sender_account,
    }


def delete_sender_account(id: int, db: Session, user_id: int):
    existing_account = _get_owned_account(id, user_id, db)

    db.delete(existing_account)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {"message": "Account Deleted Successfully"}


# GET /sender-accounts/{id}  -> ONE account by its id
def get_account_by_id(id: int, user_id: int, db: Session):
    account = _get_owned_account(id, user_id, db)
    return {
        "message": "Account Exist",
        "account": account,
    }


# GET /sender-accounts/all  -> all accounts of the logged-in user
def get_all_sender_accounts(user_id: int, db: Session):
    data = (
        db.query(SenderAccount).all()
    )
    return {"accounts": data}

def get_my_senders_accounts_using_id(current_user : id , db : Session):
        data = (
            db.query(SenderAccount, User)
            .outerjoin(User, SenderAccount.user_id == User.id)
            .filter(SenderAccount.user_id == current_user.id)
            .all()
        )
        return data