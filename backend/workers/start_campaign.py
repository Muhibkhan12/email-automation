import logging

from database import SessionLocal
from models.campaign_recipients import CampaignRecipient, RecipientStatus
from models.campaigns import Campaign
from schema.campaigns import CampaignStatus
from workers.celery_app import celery
from workers.sending_emails import send_email_task

# Needed so SQLAlchemy relationships resolve in the worker process.
from models.upload_file import Upload  # noqa: F401
from models.user import User  # noqa: F401
from models.email_logs import EmailLog  # noqa: F401
from models.sender_account import SenderAccount  # noqa: F401
from models.html_templates import HTMLTemplate  # noqa: F401

logger = logging.getLogger(__name__)

SEND_QUEUE = "email_sender_queue"


@celery.task(
    name="workers.start_campaign.dispatch_campaign",
    queue="extract_emails_queue",
)
def dispatch_campaign(campaign_id: int, upload_id: int) -> dict:
    """Link recipients to the campaign and queue one send job per PENDING recipient."""
    db = SessionLocal()
    try:
        campaign = db.get(Campaign, campaign_id)
        if campaign is None:
            logger.error("Campaign %s not found", campaign_id)
            return {"queued": 0, "error": "Campaign not found"}

        sender_account_id = campaign.sender_account_id
        if sender_account_id is None:
            logger.error("Campaign %s has no sender account", campaign_id)
            return {"queued": 0, "error": "No sender account"}

        # Link unlinked recipients from this upload to this campaign.
        db.query(CampaignRecipient).filter(
            CampaignRecipient.upload_id == upload_id,
            CampaignRecipient.campaign_id.is_(None),
        ).update({CampaignRecipient.campaign_id: campaign_id}, synchronize_session=False)
        db.commit()

        recipient_ids = [
            rid
            for (rid,) in db.query(CampaignRecipient.id)
            .filter(
                CampaignRecipient.campaign_id == campaign_id,
                CampaignRecipient.upload_id == upload_id,
                CampaignRecipient.status == RecipientStatus.PENDING,
            )
            .all()
        ]
    finally:
        db.close()

    queued = 0
    for recipient_id in recipient_ids:
        try:
            send_email_task.apply_async(
                kwargs={
                    "recipient_id": recipient_id,
                    "sender_account_id": sender_account_id,
                    "campaign_id": campaign_id,
                },
                queue=SEND_QUEUE,
            )
            queued += 1
        except Exception:
            logger.exception("Failed to enqueue send job for recipient %s", recipient_id)

    logger.info("Campaign %s: %d/%d send jobs queued", campaign_id, queued, len(recipient_ids))
    return {"queued": queued, "total": len(recipient_ids)}