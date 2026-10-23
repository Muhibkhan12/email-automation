import asyncio
import re
from datetime import datetime, timedelta, timezone
from html import escape

from celery.utils.log import get_task_logger
from sqlalchemy.orm import Session

from database import SessionLocal
from models.campaign_recipients import CampaignRecipient, RecipientStatus
from models.campaigns import Campaign, CampaignStatus
from models.email_logs import EmailLog, EmailLogStatus
from models.html_templates import HTMLTemplate
from models.sender_account import SenderAccount
from services.graph_service import GraphService
from services.oauth_service import OAuthService
from workers.celery_app import celery

logger = get_task_logger(__name__)

UTC = timezone.utc  # py3.10-safe

MAX_RETRIES = 5
TOKEN_REFRESH_BUFFER = timedelta(minutes=5)
MAX_ERROR_LEN = 500

SENDER_NEEDS_REAUTH_STATUS = "needs_reauth"
CAMPAIGN_PAUSED_STATUS = CampaignStatus.PAUSED  # enum member (string nahi)

_PLACEHOLDER = re.compile(r"\{\{\s*(\w+)\s*\}\}")


class PermanentError(Exception):
    """Raised for failures that retrying cannot fix."""


class AuthError(PermanentError):
    """Sender's Microsoft token is unusable; needs the user to re-connect."""


# =========================================================
# Helpers
# =========================================================

def _as_aware(dt: datetime | None) -> datetime | None:
    """MySQL returns naive datetimes; treat them as UTC."""
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


def _status_str(value) -> str:
    """Works for plain strings and Enum members."""
    return str(getattr(value, "value", value) or "").lower()


def _run_async(coro):
    """Run an async coroutine from sync Celery code (fresh loop each call)."""
    return asyncio.run(coro)


def render_template(html: str, context: dict[str, str]) -> str:
    """Replace {{key}} / {{ key }} placeholders with HTML-escaped values."""

    def repl(match: re.Match) -> str:
        key = match.group(1)
        if key in context:
            return escape(context[key])
        return match.group(0)

    return _PLACEHOLDER.sub(repl, html)


def _new_email_log(
    *,
    campaign_id: int,
    sender_account_id: int,
    recipient_id: int,
    status,
    error_message: str | None = None,
    sent_at: datetime | None = None,
) -> EmailLog:
    fields = {
        "campaign_id": campaign_id,
        "sender_account_id": sender_account_id,
        "recipient_id": recipient_id,
        "status": status,
    }
    if error_message is not None:
        fields["error_message"] = error_message[:MAX_ERROR_LEN]
    if sent_at is not None:
        fields["sent_at"] = sent_at
    return EmailLog(**fields)


# =========================================================
# Token refresh
# =========================================================

def _refresh_token(refresh_token: str) -> dict:
    try:
        return _run_async(OAuthService.refresh_access_token(refresh_token))
    except Exception as exc:
        msg = str(exc).lower()
        permanent_markers = ("invalid_grant", "invalid_client", "unauthorized_client")
        if any(marker in msg for marker in permanent_markers):
            raise AuthError(f"Token refresh permanently failed: {exc}") from exc
        raise


def get_fresh_access_token(db: Session, sender_account_id: int) -> str:
    sender = db.get(SenderAccount, sender_account_id)
    if sender is None:
        raise PermanentError("Sender not found")

    if _status_str(sender.status) == SENDER_NEEDS_REAUTH_STATUS:
        raise AuthError("Sender account needs re-authentication")

    expires_at = _as_aware(sender.token_expires_at)
    if expires_at is not None and expires_at > datetime.now(UTC) + TOKEN_REFRESH_BUFFER:
        return sender.access_token

    sender = (
        db.query(SenderAccount)
        .filter(SenderAccount.id == sender_account_id)
        .with_for_update()
        .first()
    )
    if sender is None:
        raise PermanentError("Sender not found")

    expires_at = _as_aware(sender.token_expires_at)
    if expires_at is not None and expires_at > datetime.now(UTC) + TOKEN_REFRESH_BUFFER:
        access_token = sender.access_token
        db.commit()
        return access_token

    refresh_token = (sender.refresh_token or "").strip()
    if not refresh_token:
        raise AuthError("No refresh token stored for sender account")

    token = _refresh_token(refresh_token)

    sender.access_token = token["access_token"]
    sender.refresh_token = token.get("refresh_token", sender.refresh_token)
    sender.token_expires_at = datetime.now(UTC) + timedelta(
        seconds=int(token["expires_in"])
    )

    access_token = sender.access_token
    db.commit()
    return access_token


# =========================================================
# Sender counters (hourly + daily)
# =========================================================

def _hour_start(now: datetime) -> datetime:
    return now.replace(minute=0, second=0, microsecond=0)


def _day_start(now: datetime) -> datetime:
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _bump_sender_counters(db: Session, sender_account_id: int) -> None:
    """Har sent email pe hour + today counter +1. Commit caller karega."""
    sender = (
        db.query(SenderAccount)
        .filter(SenderAccount.id == sender_account_id)
        .with_for_update()
        .first()
    )
    if sender is None:
        return

    now = datetime.now(UTC)
    hour_start, day_start = _hour_start(now), _day_start(now)

    if _as_aware(sender.hour_window_start) != hour_start:
        sender.emails_sent_hour = 0
        sender.hour_window_start = hour_start

    if _as_aware(sender.day_window_start) != day_start:
        sender.emails_sent_today = 0
        sender.day_window_start = day_start

    sender.emails_sent_hour = (sender.emails_sent_hour or 0) + 1
    sender.emails_sent_today = (sender.emails_sent_today or 0) + 1


def roll_sender_windows(db: Session) -> None:
    """Purani window wale senders ke counters zero karo."""
    now = datetime.now(UTC)
    hour_start = _hour_start(now).replace(tzinfo=None)
    day_start = _day_start(now).replace(tzinfo=None)
    try:
        db.query(SenderAccount).filter(
            (SenderAccount.hour_window_start == None)  # noqa: E711
            | (SenderAccount.hour_window_start < hour_start)
        ).update(
            {SenderAccount.emails_sent_hour: 0, SenderAccount.hour_window_start: hour_start},
            synchronize_session=False,
        )
        db.query(SenderAccount).filter(
            (SenderAccount.day_window_start == None)  # noqa: E711
            | (SenderAccount.day_window_start < day_start)
        ).update(
            {SenderAccount.emails_sent_today: 0, SenderAccount.day_window_start: day_start},
            synchronize_session=False,
        )
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Could not roll sender windows")


# =========================================================
# Campaign completion
# =========================================================

def _finalize_if_done(db: Session, campaign_id: int) -> None:
    """Koi PENDING recipient na bache to RUNNING campaign ko COMPLETED mark karo."""
    try:
        pending = (
            db.query(CampaignRecipient)
            .filter(
                CampaignRecipient.campaign_id == campaign_id,
                CampaignRecipient.status == RecipientStatus.PENDING,
            )
            .count()
        )
        if pending == 0:
            db.query(Campaign).filter(
                Campaign.id == campaign_id,
                Campaign.status == CampaignStatus.RUNNING,  # paused/cancelled overwrite nahi honge
            ).update(
                {Campaign.status: CampaignStatus.COMPLETED},
                synchronize_session=False,
            )
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Could not finalize campaign %s", campaign_id)


# =========================================================
# Failure recording
# =========================================================

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
        db.rollback()
        recipient = db.get(CampaignRecipient, recipient_id)

        newly_failed = False
        if recipient is not None and mark_recipient_failed:
            newly_failed = _status_str(recipient.status) != "failed"
            recipient.status = RecipientStatus.FAILED

        if recipient is not None:
            db.add(
                _new_email_log(
                    campaign_id=campaign_id,
                    sender_account_id=sender_account_id,
                    recipient_id=recipient_id,
                    status=EmailLogStatus.FAILED,
                    error_message=error,
                )
            )

        if newly_failed:
            db.query(Campaign).filter(Campaign.id == campaign_id).update(
                {Campaign.failed_count: Campaign.failed_count + 1},
                synchronize_session=False,
            )

        db.commit()

        if newly_failed:
            _finalize_if_done(db, campaign_id)
    except Exception:
        db.rollback()
        logger.exception("Could not record failure for recipient %s", recipient_id)


def _set_status(db: Session, model, row_id: int, value) -> None:
    """Best-effort status update. Never raises."""
    try:
        row = db.get(model, row_id)
        if row is not None:
            row.status = value
            db.commit()
    except Exception:
        db.rollback()
        logger.exception(
            "Could not set %s %s status to %r", model.__name__, row_id, value
        )


def flag_auth_failure(db: Session, sender_account_id: int, campaign_id: int) -> None:
    """Sender token dead: mark sender needs-reauth and pause the campaign."""
    _set_status(db, SenderAccount, sender_account_id, SENDER_NEEDS_REAUTH_STATUS)
    _set_status(db, Campaign, campaign_id, CAMPAIGN_PAUSED_STATUS)


# =========================================================
# Task
# =========================================================

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
def send_email_task(self, recipient_id: int, sender_account_id: int, campaign_id: int):
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

        # Idempotency: retry/duplicate message resend nahi karega.
        if _status_str(recipient.status) == "sent":
            return {"message": "Already sent, skipping"}

        if not recipient.is_valid_email:
            raise PermanentError("Invalid email address")

        # Campaign paused/cancelled → skip; recipient PENDING rehta hai.
        if _status_str(campaign.status) in (
            _status_str(CampaignStatus.PAUSED),
            _status_str(CampaignStatus.CANCELLED),
        ):
            return {
                "message": f"Campaign is {_status_str(campaign.status)}, skipping"
            }

        # --- Token ---
        access_token = get_fresh_access_token(db, sender_account_id)

        # --- Render ---
        html = render_template(
            template.html_content,
            {"name": recipient.name or "", "email": recipient.email},
        )
        recipient_email = recipient.email
        subject = campaign.subject

        # --- Send ---
        _run_async(
            GraphService.send_email(
                access_token=access_token,
                recipient=recipient_email,
                subject=subject,
                html_body=html,
            )
        )
        email_sent = True

        # --- Bookkeeping ---
        now = datetime.now(UTC)
        recipient.status = RecipientStatus.SENT
        if hasattr(recipient, "sent_at"):
            recipient.sent_at = now

        db.add(
            _new_email_log(
                campaign_id=campaign_id,
                sender_account_id=sender_account_id,
                recipient_id=recipient_id,
                status=EmailLogStatus.SENT,
                sent_at=now,
            )
        )

        # Atomic increments: concurrent workers ke saath safe.
        db.query(Campaign).filter(Campaign.id == campaign_id).update(
            {Campaign.sent_count: Campaign.sent_count + 1},
            synchronize_session=False,
        )

        _bump_sender_counters(db, sender_account_id)  # hourly + today

        db.commit()
        _finalize_if_done(db, campaign_id)  # file complete → Completed
        return {"message": "Email Sent Successfully"}

    except Exception as exc:
        db.rollback()

        if email_sent:
            logger.exception(
                "Email to recipient %s was sent but DB update failed", recipient_id
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
                mark_recipient_failed=not is_auth_error,
            )
            if is_auth_error:
                flag_auth_failure(db, sender_account_id, campaign_id)

        raise

    finally:
        db.close()