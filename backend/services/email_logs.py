from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.models.email_logs import EmailLog
from backend.schema.email_logs import AddEmailLogSchema, UpdateEmailLogSchema


def get_all_email_logs(db: Session):
    data = db.query(EmailLog).all()
    return {
        "message": "Email logs fetched successfully",
        "count": len(data),
        "data": data
    }


def get_email_log_by_id(db: Session, id: int):
    log = db.query(EmailLog).filter(EmailLog.id == id).first()

    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email log doesn't exist"
        )
    return log


def add_email_log(db: Session, credentials: AddEmailLogSchema):
    log = EmailLog(**credentials.model_dump())

    db.add(log)
    try:
        db.commit()
        db.refresh(log)
    except Exception:
        db.rollback()
        raise

    return {
        "message": "Email log created successfully",
        "data": log
    }


def update_email_log(db: Session, id: int, credentials: UpdateEmailLogSchema):
    log = get_email_log_by_id(db, id)

    for key, val in credentials.model_dump(exclude_unset=True).items():
        setattr(log, key, val)

    try:
        db.commit()
        db.refresh(log)
    except Exception:
        db.rollback()
        raise

    return {
        "message": "Email log updated successfully",
        "data": log
    }