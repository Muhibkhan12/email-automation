import asyncio
import re
from datetime import UTC, datetime, timedelta
from html import escape

from celery.utils.log import get_task_logger  # type: ignore
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

# Status values used when a sender's token is dead. Change these to match
# your own status values / enums.
SENDER_NEEDS_REAUTH_STATUS = "needs_reauth"
CAMPAIGN_PAUSED_STATUS = "paused"

_PLACEHOLDER = re.compile(r"\{\{\s*(\w+)\s*\}\}")

# EmailLog ka recipient-email column naam auto-detect hota hai, taaki
# "'recipient_email' is an invalid keyword argument" dobara na aaye.
_EMAIL_FIELD_CANDIDATES = ("recipient_email", "recipient", "to_email", "email")
EMAIL_LOG_EMAIL_FIELD = next(
    (name for name in _EMAIL_FIELD_CANDIDATES if hasattr(EmailLog, name)), None
)
if EMAIL_LOG_EMAIL_FIELD is None:
    raise RuntimeError(
        "EmailLog has no recipient email column. Columns found: "
        f"{list(EmailLog.__table__.columns.keys())}"
    )


class PermanentError(Exception):
    """Raised for failures that retrying cannot fix."""


class AuthError(PermanentError):
    """Sender's Microsoft token is unusable; needs the user to re-connect."""


def _as_aware(dt: datetime | None) -> datetime | None:
    """MySQL returns naive datetimes; treat them as UTC."""
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


def _status_str(value) -> str:
    """Works for plain strings and Enum members."""
    return str(getattr(value, "value", value) or "").lower()


def render_template(html: str, context: dict[str, str]) -> str:
    """Replace {{key}} / {{ key }} placeholders with HTML-escaped values."""

    def repl(match: re.Match) -> str:
        key = match.group(1)
        if key in context:
            return escape(context[key])
        return match.group(0)  # leave unknown placeholders untouched

    return _PLACEHOLDER.sub(repl, html)


def _new_email_log(
    *,
    campaign_id: int,
    sender_account_id: int,
    email: str,
    subject: str,
    status,
    error_message: str | None = None,
    sent_at: datetime | None = None,
) -> EmailLog:
    fields = {
        "campaign_id": campaign_id,
        "sender_account_id": sender_account_id,
        EMAIL_LOG_EMAIL_FIELD: email,
        "subject": subject,
        "status": status,
    }
    if error_message is not None:
        fields["error_message"] = error_message[:MAX_ERROR_LEN]
    if sent_at is not None and hasattr(EmailLog, "sent_at"):
        fields["sent_at"] = sent_at
    return EmailLog(**fields)


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

    # Token pehle hi dead mark ho chuka hai: Microsoft ko dobara hit mat karo.
    if _status_str(sender.status) == SENDER_NEEDS_REAUTH_STATUS:
        raise AuthError("Sender account needs re-authentication")

    expires_at = _as_aware(sender.token_expires_at)

    if expires_at is None or expires_at <= datetime.now(UTC) + TOKEN_REFRESH_BUFFER:
        refresh_token = (sender.refresh_token or "").strip()
        if not refresh_token:
            raise AuthError("No refresh token stored for sender account")

        try:
            token = asyncio.run(OAuthService.refresh_access_token(refresh_token))
        except Exception as e:
            raise AuthError(f"Token refresh failed: {e}") from e

        sender.access_token = token["access_token"]
        sender.refresh_token = token.get("refresh_token", sender.refresh_token)
        sender.token_expires_at = datetime.now(UTC) + timedelta(
            seconds=int(token["expires_in"])
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
    mark_recipient_failed: bool = True,
) -> None:
    """Write a FAILED log row (and optionally mark recipient FAILED). Never raises."""
    try:
        recipient = db.get(CampaignRecipient, recipient_id)
        campaign = db.get(Campaign, campaign_id)

        if recipient is not None and mark_recipient_failed:
            recipient.status = RecipientStatus.FAILED

        db.add(
            _new_email_log(
                campaign_id=campaign_id,
                sender_account_id=sender_account_id,
                email=recipient.email if recipient else "",
                subject=campaign.subject if campaign else "",
                status=EmailLogStatus.FAILED,
                error_message=error,
            )
        )
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Could not record failure for recipient %s", recipient_id)


def _set_status(db: Session, model, row_id: int, value: str) -> None:
    """Best-effort status update. Never raises."""
    try:
        row = db.get(model, row_id)
        if row is not None:
            row.status = value
            db.commit()
    except Exception:
        db.rollback()
        logger.exception("Could not set %s %s status to %r", model.__name__, row_id, value)


def flag_auth_failure(db: Session, sender_account_id: int, campaign_id: int) -> None:
    """Sender token dead: mark sender needs-reauth and pause the campaign."""
    _set_status(db, SenderAccount, sender_account_id, SENDER_NEEDS_REAUTH_STATUS)
    _set_status(db, Campaign, campaign_id, CAMPAIGN_PAUSED_STATUS)


@celery.task(
    name="workers.sending_emails.send_email_task",
    queue="email_sender_queue",
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

        # Campaign paused/cancelled hai to skip karo (recipient pending rehta hai).
        if _status_str(campaign.status) in (CAMPAIGN_PAUSED_STATUS, "cancelled"):
            return {"message": f"Campaign is {_status_str(campaign.status)}, skipping"}

        ################################################################
        # Token
        ################################################################

        access_token = get_fresh_access_token(db, sender_account_id)

        html = render_template(
            template.html_content,
            {
                "name": recipient.name or "",
                "email": recipient.email,
            },
        )

        recipient_email = recipient.email
        subject = campaign.subject


        asyncio.run(
            GraphService.send_email(
                access_token=access_token,
                recipient=recipient_email,
                subject=subject,
                html_body=html,
            )
        )
        email_sent = True

        now = datetime.now(UTC)

        recipient.status = RecipientStatus.SENT
        recipient.sent_at = now

        db.add(
            _new_email_log(
                campaign_id=campaign_id,
                sender_account_id=sender_account_id,
                email=recipient_email,
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

        is_auth_error = isinstance(exc, AuthError)
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
                # Auth error recipient ki galti nahi hai: usse FAILED mark mat
                # karo, taaki re-connect ke baad dobara bheja ja sake.
                mark_recipient_failed=not is_auth_error,
            )
            if is_auth_error:
                flag_auth_failure(db, sender_account_id, campaign_id)

        raise  # lets Celery's autoretry handle non-final attempts

    finally:
        db.close()