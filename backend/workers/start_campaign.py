import logging

from database import SessionLocal
from models.campaign_recipients import CampaignRecipient, RecipientStatus
from models.campaigns import Campaign
from schema.campaigns import CampaignStatus
from workers.celery_app import celery
from workers.sending_emails import schedule_campaign_sends

# Needed so SQLAlchemy relationships resolve in the worker process.
from models.upload_file import Upload  # noqa: F401
from models.user import User  # noqa: F401
from models.email_logs import EmailLog  # noqa: F401
from models.sender_account import SenderAccount  # noqa: F401
from models.html_templates import HTMLTemplate  # noqa: F401
from models.campaigns import CampaignStatus as A
from schema.campaigns import CampaignStatus as B
print(A is B, A.RUNNING, B.RUNNING)

logger = logging.getLogger(__name__)

def _abort_campaign(db, campaign_id: int) -> None:
    """Dispatch failed: don't leave the campaign stuck in RUNNING with no schedule."""
    try:
        db.rollback()
        db.query(Campaign).filter(Campaign.id == campaign_id).update(
            {Campaign.status: CampaignStatus.PAUSED},
            synchronize_session=False,
        )
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Could not pause campaign %s after dispatch failure", campaign_id)


@celery.task(
    name="workers.start_campaign.dispatch_campaign",
    queue="extract_emails_queue",
)
def dispatch_campaign(campaign_id: int, upload_id: int) -> dict:
    """
    Link recipients to the campaign and give each valid PENDING recipient a
    random human-like send time starting now. Actual sending is done by
    dispatch_due_task (Celery beat).
    """
    db = SessionLocal()
    try:
        campaign = db.get(Campaign, campaign_id)
        if campaign is None:
            logger.error("Campaign %s not found", campaign_id)
            return {"scheduled": 0, "error": "Campaign not found"}

        if campaign.sender_account_id is None:
            logger.error("Campaign %s has no sender account", campaign_id)
            _abort_campaign(db, campaign_id)
            return {"scheduled": 0, "error": "No sender account"}

        # 1. Link unlinked recipients from this upload to this campaign.
        db.query(CampaignRecipient).filter(
            CampaignRecipient.upload_id == upload_id,
            CampaignRecipient.campaign_id.is_(None),
        ).update({CampaignRecipient.campaign_id: campaign_id}, synchronize_session=False)
        db.commit()

        # 2. Invalid emails are never scheduled, so mark them FAILED now.
        invalid_marked = (
            db.query(CampaignRecipient)
            .filter(
                CampaignRecipient.campaign_id == campaign_id,
                CampaignRecipient.upload_id == upload_id,
                CampaignRecipient.status == RecipientStatus.PENDING,
                CampaignRecipient.is_valid_email == False,  # noqa: E712
            )
            .update(
                {CampaignRecipient.status: RecipientStatus.FAILED},
                synchronize_session=False,
            )
        )
        if invalid_marked:
            db.query(Campaign).filter(Campaign.id == campaign_id).update(
                {Campaign.failed_count: Campaign.failed_count + invalid_marked},
                synchronize_session=False,
            )
        db.commit()

        # 3. Random schedule, starting now.
        scheduled = schedule_campaign_sends(db, campaign_id)

        if scheduled == 0:
            logger.warning("Campaign %s: nothing to schedule", campaign_id)
            _abort_campaign(db, campaign_id)
            return {"scheduled": 0, "invalid_skipped": invalid_marked}

        logger.info(
            "Campaign %s: %d recipients scheduled (%d invalid skipped)",
            campaign_id, scheduled, invalid_marked,
        )
        return {"scheduled": scheduled, "invalid_skipped": invalid_marked}

    except Exception:
        logger.exception("dispatch_campaign failed for campaign %s", campaign_id)
        _abort_campaign(db, campaign_id)
        raise
    finally:
        db.close()