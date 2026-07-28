from pydantic import BaseModel
from enum import Enum


class CampaignStatus(str, Enum):
    DRAFT = "Draft"
    READY = "Ready"
    RUNNING = "Running"
    PAUSED = "Paused"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class AddCampaignSchema(BaseModel):
    user_id : int
    template_id : int
    sender_account_id : int
    campaign_name : str
    subject : str
    status : CampaignStatus = CampaignStatus.DRAFT


class UpdateCampaignSchema(BaseModel):
    template_id : int | None = None
    sender_account_id : int | None = None
    campaign_name : str | None = None
    subject : str | None = None
    status : CampaignStatus | None = None
    recipient_count : int | None = None


class CampaignResponse(BaseModel):
    id : int
    campaign_name : str
    subject : str
    status : CampaignStatus
    recipient_count : int

    class config:
        from_attributes = True