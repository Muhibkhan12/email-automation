from pydantic import BaseModel
from enum import Enum


class RecipientStatus(str, Enum):
    PENDING = "Pending"
    QUEUED = "Queued"
    SENDING = "Sending"
    SENT = "Sent"
    FAILED = "Failed"


class AddRecipientsSchema(BaseModel):
    campaign_id : int
    upload_id : int
    name : str
    email : str
    company : str
    phone : str
    is_valid_email : bool
    status : RecipientStatus = RecipientStatus.PENDING


class UpdateRecipientsSchema(BaseModel):
    campaign_id : int | None = None
    upload_id : int | None = None
    name : str | None = None
    email : str | None = None
    company : str | None = None
    phone : str | None = None
    is_valid_email : bool | None = None
    status : RecipientStatus | None = None

class RecipientsResponse(BaseModel):
    name : str
    email : str
    company : str
    phone : str | None
    status : RecipientStatus


    class config:
        from_attributes = True