# routers/admin_sender_accounts.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db                          # <- your db dependency
from services.user import GetCurrentUser                    # <- your existing auth dependency
from models.user import User
from schema.sender_account import updateSenderAccout
from services.admin_senders_account import (
    admin_get_all_sender_accounts,
    admin_update_sender_account,
    admin_delete_sender_account,
)

# routers/admin_sender_accounts.py
def require_admin(current_user: User = Depends(GetCurrentUser)) -> User:
    role = getattr(current_user, "role", None)
    role_value = str(getattr(role, "value", role) or "").strip().lower()
    is_admin = bool(getattr(current_user, "is_admin", False)) or role_value in {"admin", "superadmin"}
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user

router = APIRouter(
    prefix="/admin/sender-accounts",
    tags=["admin-sender-accounts"],
    dependencies=[Depends(require_admin)],
)
@router.get("")
def list_all(db: Session = Depends(get_db)):
    return admin_get_all_sender_accounts(db)
@router.put("/{id}")
def update_one(id: int, body: updateSenderAccout, db: Session = Depends(get_db)):
    return admin_update_sender_account(id, db, body)
@router.delete("/{id}")
def delete_one(id: int, db: Session = Depends(get_db)):
    return admin_delete_sender_account(id, db)