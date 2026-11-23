from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schema.email_logs import AddEmailLogSchema, UpdateEmailLogSchema
from services.user import GetCurrentUser
import services.email_logs as email_log_service

router = APIRouter(prefix="/email-logs", tags=["email_logs"])


def require_admin(current_user=Depends(GetCurrentUser)):
    role = (getattr(current_user, "role", None) or "").upper()
    is_admin = bool(getattr(current_user, "is_admin", False)) or role == "ADMIN"
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user


# ─────────────── ADMIN ROUTES FIRST (before /{id}) ───────────────
@router.get("/admin/all")
def admin_get_all_logs(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return email_log_service.get_all_email_logs_admin(db)


# ─────────────── USER-SCOPED ROUTES ───────────────
@router.get("/")
def get_all_email_logs(
    db: Session = Depends(get_db),
    current_user=Depends(GetCurrentUser),
):
    return email_log_service.get_all_email_logs(db, current_user.id)


@router.post("/add")
def add_email_log(
    credentials: AddEmailLogSchema,
    db: Session = Depends(get_db),
    current_user=Depends(GetCurrentUser),
):
    return email_log_service.add_email_log(db, credentials, current_user.id)


@router.get("/{id}")
def get_email_log(
    id: int,
    db: Session = Depends(get_db),
    current_user=Depends(GetCurrentUser),
):
    return email_log_service.get_email_log_by_id(db, id, current_user.id)


@router.patch("/update/{id}")
def update_email_log(
    id: int,
    credentials: UpdateEmailLogSchema,
    db: Session = Depends(get_db),
    current_user=Depends(GetCurrentUser),
):
    return email_log_service.update_email_log(db, id, credentials, current_user.id)