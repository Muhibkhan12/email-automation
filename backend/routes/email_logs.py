

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schema.email_logs import AddEmailLogSchema, UpdateEmailLogSchema
import backend.services.email_logs as email_log_service

router = APIRouter(
    prefix="/email-logs",
    tags=["email_logs"]
)

@router.get("/")
def get_all_email_logs(db: Session = Depends(get_db)):
    return email_log_service.get_all_email_logs(db)

@router.get("/{id}")
def get_email_log(id: int, db: Session = Depends(get_db)):
    return email_log_service.get_email_log_by_id(db, id)

@router.post("/add")
def add_email_log(credentials: AddEmailLogSchema, db: Session = Depends(get_db)):
    return email_log_service.add_email_log(db, credentials)

@router.patch("/update/{id}")
def update_email_log(id: int, credentials: UpdateEmailLogSchema, db: Session = Depends(get_db)):
    return email_log_service.update_email_log(db, id, credentials)