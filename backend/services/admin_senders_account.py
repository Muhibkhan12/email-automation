# ───────────── ADMIN (not scoped to a user) ─────────────

from fastapi import HTTPException, status
from models.sender_account import SenderAccount
from models.user import User
from schema.sender_account import updateSenderAccout
from sqlalchemy.orm import Session

ADMIN_EDITABLE_FIELDS = {"display_name", "status", "daily_limit", "hourly_limit"}


def _serialize_admin_account(acc: SenderAccount, owner: User | None) -> dict:
    g = lambda name: getattr(acc, name, None)
    return {
        "id": acc.id,
        "user_id": g("user_id"),
        "display_name": g("display_name"),
        "email": g("email"),
        "provider": g("provider"),
        "status": g("status"),
        "daily_limit": g("daily_limit"),
        "hourly_limit": g("hourly_limit"),
        "emails_sent_today": g("emails_sent_today"),
        "emails_sent_hour": g("emails_sent_hour"),
        "created_at": g("created_at"),
        "updated_at": g("updated_at"),
        # adjust to your User columns (name / full_name / username ...)
        "owner_name": getattr(owner, "name", None) or getattr(owner, "full_name", None) if owner else None,
        "owner_email": getattr(owner, "email", None) if owner else None,
    }


def _get_any_account(id: int, db: Session) -> SenderAccount:
    account = db.query(SenderAccount).filter(SenderAccount.id == id).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sender Account not found")
    return account


def admin_get_all_sender_accounts(db: Session):
    rows = (
        db.query(SenderAccount, User)
        .outerjoin(User, SenderAccount.user_id == User.id)
        .order_by(SenderAccount.id.desc())
        .all()
    )
    return [_serialize_admin_account(acc, owner) for acc, owner in rows]


def admin_update_sender_account(id: int, db: Session, credentials: updateSenderAccout):
    account = _get_any_account(id, db)

    data = credentials.model_dump(exclude_unset=True)
    for field, value in data.items():
        if field in ADMIN_EDITABLE_FIELDS:       # admin can't change email/provider/owner
            setattr(account, field, value)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(account)

    owner = db.query(User).filter(User.id == account.user_id).first()
    return _serialize_admin_account(account, owner)


def admin_delete_sender_account(id: int, db: Session):
    account = _get_any_account(id, db)
    db.delete(account)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return {"message": "Account Deleted Successfully"}