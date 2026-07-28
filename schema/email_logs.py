from pydantic import BaseModel
from datetime import datetime
from enum import Enum


class EmailLogStatus(str, Enum):
    PENDING = "Pending"
    SENT = "Sent"
    FAILED = "Failed"


class AddEmailLogSchema(BaseModel):
    campaign_id : int
    recipient_id : int
    sender_account_id : int
    status : EmailLogStatus = EmailLogStatus.PENDING
    error_message : str | None = None
    sent_at : datetime | None = None


class UpdateEmailLogSchema(BaseModel):
    status : EmailLogStatus | None = None
    error_message : str | None = None
    sent_at : datetime | None = None