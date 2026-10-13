import asyncio
import re
from datetime import UTC, datetime, timedelta
from html import escape

from celery.utils.log import get_task_logger
from sqlalchemy.orm import Session

from database import SessionLocal
from models.campaign_recipients import CampaignRecipient, RecipientStatus
from models.campaigns import Campaign
from models.email_logs import EmailLog, EmailLogStatus
from models.html_templates import HTMLTemplate
from models.sender_account import SenderAccount
from services.graph_service import GraphService
from services.oauth_service import OAuthService
from workers.celery_app import celery

logger = get_task_logger(__name__)

MAX_RETRIES = 5
TOKEN_REFRESH_BUFFER = timedelta(minutes=5)
MAX_ERROR_LEN = 500  # keep <= your EmailLog.error_message column size

_PLACEHOLDER = re.compile(r"\{\{\s*(\w+)\s*\}\}")


class PermanentError(Exception):
    """Raised for failures that retrying cannot fix."""


########################################################################
# Helpers
########################################################################


def _as_aware(dt: datetime | None) -> datetime | None:
    """MySQL returns naive datetimes; treat them as UTC."""
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


def render_template(html: str, context: dict[str, str]) -> str:
    """Replace {{key}} / {{ key }} placeholders with HTML-escaped values."""

    def repl(match: re.Match) -> str:
        key = match.group(1)
        if key in context:
            return escape(context[key])
        return match.group(0)  # leave unknown placeholders untouched

    return _PLACEHOLDER.sub(repl, html)


def get_fresh_access_token(db: Session, sender_account_id: int) -> str:
    """
    Return a valid access token, refreshing if needed.

    The sender row is locked so concurrent workers don't refresh the same
    (rotating) refresh token at the same time.
    """
    sender = (
        db.query(SenderAccount)
        .filter(SenderAccount.id == sender_account_id)
        .with_for_update()
        .first()
    )

    if sender is None:
        raise PermanentError("Sender not found")

    expires_at = _as_aware(sender.token_expires_at)

    if expires_at is None or expires_at <= datetime.now(UTC) + TOKEN_REFRESH_BUFFER:
        token = OAuthService.refresh_access_token(sender.refresh_token)

        sender.access_token = token["access_token"]
        sender.refresh_token = token.get("refresh_token", sender.refresh_token)
        sender.token_expires_at = datetime.now(UTC) + timedelta(
            seconds=token["expires_in"]
        )

    access_token = sender.access_token  # read before commit expires attributes
    db.commit()  # releases the row lock
    return access_token


def record_failure(
    db: Session,
    recipient_id: int,
    campaign_id: int,
    sender_account_id: int,
    error: str,
) -> None:
    """Mark recipient FAILED and write a log row. Never raises."""
    try:
        recipient = db.get(CampaignRecipient, recipient_id)
        campaign = db.get(Campaign, campaign_id)

        if recipient is not None:
            recipient.status = RecipientStatus.FAILED

        db.add(
            EmailLog(
                campaign_id=campaign_id,
                sender_account_id=sender_account_id,
                recipient_email=recipient.email if recipient else "",
                subject=campaign.subject if campaign else "",
                status=EmailLogStatus.FAILED,
                error_message=error[:MAX_ERROR_LEN],
            )
        )
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Could not record failure for recipient %s", recipient_id)


########################################################################
# Task
########################################################################


@celery.task(
    bind=True,
    acks_late=True,
    autoretry_for=(Exception,),
    dont_autoretry_for=(PermanentError,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    max_retries=MAX_RETRIES,
)
def send_email_task(
    self,
    recipient_id: int,
    sender_account_id: int,
    campaign_id: int,
):
    db: Session = SessionLocal()
    email_sent = False

    try:
        ################################################################
        # Load objects (validate before touching attributes)
        ################################################################

        recipient = db.get(CampaignRecipient, recipient_id)
        if recipient is None:
            raise PermanentError("Recipient not found")

        campaign = db.get(Campaign, campaign_id)
        if campaign is None:
            raise PermanentError("Campaign not found")

        template = db.get(HTMLTemplate, campaign.template_id)
        if template is None:
            raise PermanentError("Template not found")

        # Idempotency: a retry or duplicate message must not resend.
        if recipient.status == RecipientStatus.SENT:
            return {"message": "Already sent, skipping"}

        if not recipient.is_valid_email:
            raise PermanentError("Invalid email address")

        # TODO: skip if the campaign is paused/cancelled, e.g.
        # if campaign.status in (CampaignStatus.PAUSED, CampaignStatus.CANCELLED): return

        ################################################################
        # Token
        ################################################################

        access_token = get_fresh_access_token(db, sender_account_id)

        ################################################################
        # Render
        ################################################################

        html = render_template(
            template.html_content,
            {
                "name": recipient.name or "",
                "email": recipient.email,
            },
        )

        recipient_email = recipient.email
        subject = campaign.subject

        ################################################################
        # Send (no retries after this succeeds)
        ################################################################

        asyncio.run(
            GraphService.send_email(
                access_token=access_token,
                recipient=recipient_email,
                subject=subject,
                html_body=html,
            )
        )
        email_sent = True

        ################################################################
        # Bookkeeping
        ################################################################

        now = datetime.now(UTC)

        recipient.status = RecipientStatus.SENT
        recipient.sent_at = now

        db.add(
            EmailLog(
                campaign_id=campaign_id,
                sender_account_id=sender_account_id,
                recipient_email=recipient_email,
                subject=subject,
                status=EmailLogStatus.SENT,
                sent_at=now,
            )
        )

        # Atomic increment: safe with many concurrent workers.
        db.query(Campaign).filter(Campaign.id == campaign_id).update(
            {Campaign.sent_count: Campaign.sent_count + 1},
            synchronize_session=False,
        )

        db.commit()

        return {"message": "Email Sent Successfully"}

    except Exception as exc:
        db.rollback()

        if email_sent:
            # The email is already out; retrying would duplicate it.
            logger.exception(
                "Email to recipient %s was sent but DB update failed",
                recipient_id,
            )
            return {"message": "Sent, but bookkeeping failed"}

        is_final_attempt = (
            isinstance(exc, PermanentError)
            or self.request.retries >= self.max_retries
        )

        if is_final_attempt:
            record_failure(
                db,
                recipient_id,
                campaign_id,
                sender_account_id,
                str(exc),
            )

        raise  # lets Celery's autoretry handle non-final attempts

    finally:
        db.close()