from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from models.email_logs import EmailLog, EmailLogStatus
from models.campaigns import Campaign  # apne actual path ke hisaab se adjust karo
from schema.email_logs import AddEmailLogSchema, UpdateEmailLogSchema


def _serialize_log(log: EmailLog) -> dict:
    return {
        "id": log.id,
        "campaign_id": log.campaign_id,
        "recipient_id": log.recipient_id,
        "sender_account_id": log.sender_account_id,
        "status": log.status.value,
        "error_message": log.error_message,
        "sent_at": log.sent_at,
        "created_at": log.created_at,
        "updated_at": log.updated_at,
        "campaign_name": log.campaign.campaign_name if log.campaign else None,
        "subject": log.campaign.subject if log.campaign else None,
        "recipient_email": log.recipient.email if log.recipient else None,         # column name check karna
        "sender_email": log.sender_account.email if log.sender_account else None,  # column name check karna
    }


def _to_status_enum(value) -> EmailLogStatus:
    return value if isinstance(value, EmailLogStatus) else EmailLogStatus(value)


def _base_query(db: Session, user_id: int):
    return (
        db.query(EmailLog)
        .join(Campaign, EmailLog.campaign_id == Campaign.id)
        .filter(Campaign.user_id == user_id)
        .options(
            joinedload(EmailLog.campaign),
            joinedload(EmailLog.recipient),
            joinedload(EmailLog.sender_account),
        )
    )


def get_all_email_logs(db: Session, user_id: int):
    logs = _base_query(db, user_id).order_by(EmailLog.created_at.desc()).all()
    return {
        "message": "Email logs fetched successfully",
        "count": len(logs),
        "data": [_serialize_log(l) for l in logs],
    }


def get_email_log_by_id(db: Session, log_id: int, user_id: int):
    log = _base_query(db, user_id).filter(EmailLog.id == log_id).first()
    if log is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email log not found")
    return {"message": "Email log fetched successfully", "data": _serialize_log(log)}


def add_email_log(db: Session, credentials: AddEmailLogSchema, user_id: int):
    # Campaign isi user ki honi chahiye
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == credentials.campaign_id, Campaign.user_id == user_id)
        .first()
    )
    if campaign is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    log = EmailLog(
        campaign_id=credentials.campaign_id,
        recipient_id=credentials.recipient_id,
        sender_account_id=credentials.sender_account_id,
        status=_to_status_enum(credentials.status),
        error_message=credentials.error_message,
        sent_at=credentials.sent_at,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return {"message": "Email log added successfully", "data": _serialize_log(log)}


def update_email_log(db: Session, log_id: int, credentials: UpdateEmailLogSchema, user_id: int):
    log = (
        db.query(EmailLog)
        .join(Campaign, EmailLog.campaign_id == Campaign.id)
        .filter(EmailLog.id == log_id, Campaign.user_id == user_id)
        .first()
    )
    if log is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email log not found")

    data = credentials.model_dump(exclude_unset=True)
    for key, value in data.items():
        if key == "status" and value is not None:
            value = _to_status_enum(value)
        setattr(log, key, value)

    db.commit()
    db.refresh(log)
    return {"message": "Email log updated successfully", "data": _serialize_log(log)}