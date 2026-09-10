# email_logs.py (router)

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schema.email_logs import (
    AddEmailLogSchema,
    UpdateEmailLogSchema,
    EmailLogResponseSchema,
    EmailLogsListResponseSchema,
    EmailLogSingleResponseSchema,
    MessageResponseSchema
)
from models.email_logs import EmailLog

router = APIRouter(prefix="/email-logs", tags=["Email Logs"])

# GET all email logs
@router.get("/", response_model=EmailLogsListResponseSchema)
def get_all_email_logs(db: Session = Depends(get_db)):
    data = db.query(EmailLog).all()
    
    result = []
    for log in data:
        result.append({
            "id": log.id,
            "campaign_id": log.campaign_id,
            "recipient_id": log.recipient_id,
            "sender_account_id": log.sender_account_id,
            "status": log.status,
            "error_message": log.error_message,
            "sent_at": log.sent_at,
            "created_at": log.created_at,
            "updated_at": log.updated_at,
            # Add related data
            "campaign_name": log.campaign.name if log.campaign else None,
            "recipient_email": log.recipient.email if log.recipient else None,
            "sender_email": log.sender_account.email if log.sender_account else None,
        })
    
    return {
        "message": "Email logs fetched successfully",
        "count": len(result),
        "data": result
    }


# GET single email log
@router.get("/{id}", response_model=EmailLogSingleResponseSchema)
def get_email_log_by_id(id: int, db: Session = Depends(get_db)):
    log = db.query(EmailLog).filter(EmailLog.id == id).first()
    
    if not log:
        return {
            "message": "Email log not found",
            "data": None
        }
    
    return {
        "message": "Email log fetched successfully",
        "data": {
            "id": log.id,
            "campaign_id": log.campaign_id,
            "recipient_id": log.recipient_id,
            "sender_account_id": log.sender_account_id,
            "status": log.status,
            "error_message": log.error_message,
            "sent_at": log.sent_at,
            "created_at": log.created_at,
            "updated_at": log.updated_at,
            "campaign_name": log.campaign.name if log.campaign else None,
            "recipient_email": log.recipient.email if log.recipient else None,
            "sender_email": log.sender_account.email if log.sender_account else None,
        }
    }


# POST - Add new email log
@router.post("/add", response_model=EmailLogSingleResponseSchema)
def add_email_log(data: AddEmailLogSchema, db: Session = Depends(get_db)):
    new_log = EmailLog(
        campaign_id=data.campaign_id,
        recipient_id=data.recipient_id,
        sender_account_id=data.sender_account_id,
        status=data.status,
        error_message=data.error_message,
        sent_at=data.sent_at,
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    
    return {
        "message": "Email log created successfully",
        "data": {
            "id": new_log.id,
            "campaign_id": new_log.campaign_id,
            "recipient_id": new_log.recipient_id,
            "sender_account_id": new_log.sender_account_id,
            "status": new_log.status,
            "error_message": new_log.error_message,
            "sent_at": new_log.sent_at,
            "created_at": new_log.created_at,
            "updated_at": new_log.updated_at,
            "campaign_name": new_log.campaign.name if new_log.campaign else None,
            "recipient_email": new_log.recipient.email if new_log.recipient else None,
            "sender_email": new_log.sender_account.email if new_log.sender_account else None,
        }
    }


# PATCH - Update email log
@router.patch("/update/{id}", response_model=EmailLogSingleResponseSchema)
def update_email_log(id: int, data: UpdateEmailLogSchema, db: Session = Depends(get_db)):
    log = db.query(EmailLog).filter(EmailLog.id == id).first()
    
    if not log:
        return {
            "message": "Email log not found",
            "data": None
        }
    
    if data.status is not None:
        log.status = data.status
    if data.error_message is not None:
        log.error_message = data.error_message
    if data.sent_at is not None:
        log.sent_at = data.sent_at
    
    db.commit()
    db.refresh(log)
    
    return {
        "message": "Email log updated successfully",
        "data": {
            "id": log.id,
            "campaign_id": log.campaign_id,
            "recipient_id": log.recipient_id,
            "sender_account_id": log.sender_account_id,
            "status": log.status,
            "error_message": log.error_message,
            "sent_at": log.sent_at,
            "created_at": log.created_at,
            "updated_at": log.updated_at,
            "campaign_name": log.campaign.name if log.campaign else None,
            "recipient_email": log.recipient.email if log.recipient else None,
            "sender_email": log.sender_account.email if log.sender_account else None,
        }
    }


# DELETE - Delete email log
@router.delete("/{id}", response_model=MessageResponseSchema)
def delete_email_log(id: int, db: Session = Depends(get_db)):
    log = db.query(EmailLog).filter(EmailLog.id == id).first()
    
    if not log:
        return {
            "message": "Email log not found",
            "success": False
        }
    
    db.delete(log)
    db.commit()
    
    return {
        "message": "Email log deleted successfully",
        "success": True
    }