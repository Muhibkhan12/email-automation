from pydantic import BaseModel, ConfigDict
from enum import Enum


class CampaignStatus(str, Enum):
    DRAFT = "Draft"
    READY = "Ready"
    SCHEDULED = "Scheduled"
    RUNNING = "Running"
    PAUSED = "Paused"
    COMPLETED = "Completed"
    FAILED = "Failed"
    CANCELLED = "Cancelled"


class AddCampaignSchema(BaseModel):
    user_id: int
    template_id: int
    sender_account_id: int
    campaign_name: str
    subject: str
    sent_count: int = 0          # default 0, ab required nahi
    status: CampaignStatus = CampaignStatus.DRAFT


class UpdateCampaignSchema(BaseModel):
    template_id: int | None = None
    sender_account_id: int | None = None
    campaign_name: str | None = None
    subject: str | None = None
    status: CampaignStatus | None = None
    recipient_count: int | None = None
    sent_count: int | None = None


class CampaignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)   # `class config` (lowercase) Pydantic v2 mein kaam nahi karta

    id: int
    campaign_name: str
    subject: str
    status: CampaignStatus
    recipient_count: int