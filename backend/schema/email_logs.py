# schemas.py
from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import Optional, List


# ============================
# Enums
# ============================

class EmailLogStatus(str, Enum):
    PENDING = "Pending"
    SENT = "Sent"
    FAILED = "Failed"


# ============================
# Related Data Schemas
# ============================

class RecipientSchema(BaseModel):
    id: int
    email: str
    name: Optional[str] = None

    class Config:
        from_attributes = True


class CampaignSchema(BaseModel):
    id: int
    name: str
    subject: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class SenderAccountSchema(BaseModel):
    id: int
    email: str
    name: Optional[str] = None

    class Config:
        from_attributes = True


# ============================
# Email Log Request Schemas
# ============================

class AddEmailLogSchema(BaseModel):
    campaign_id: int
    recipient_id: int
    sender_account_id: int
    status: EmailLogStatus = EmailLogStatus.PENDING
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None


class UpdateEmailLogSchema(BaseModel):
    status: Optional[EmailLogStatus] = None
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None


# ============================
# Email Log Response Schemas
# ============================

class EmailLogResponseSchema(BaseModel):
    id: int
    campaign_id: int
    recipient_id: int
    sender_account_id: int
    status: EmailLogStatus
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Additional fields from related tables
    campaign_name: Optional[str] = None
    recipient_email: Optional[str] = None
    sender_email: Optional[str] = None
    
    # Optional nested objects if you want full related data
    # recipient: Optional[RecipientSchema] = None
    # campaign: Optional[CampaignSchema] = None
    # sender: Optional[SenderAccountSchema] = None

    class Config:
        from_attributes = True


class EmailLogsListResponseSchema(BaseModel):
    message: str
    count: int
    data: List[EmailLogResponseSchema]


class EmailLogSingleResponseSchema(BaseModel):
    message: str
    data: EmailLogResponseSchema


# ============================
# Generic Response Schemas
# ============================

class MessageResponseSchema(BaseModel):
    message: str
    success: bool = True