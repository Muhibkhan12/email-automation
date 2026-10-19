import asyncio
import re
from datetime import datetime, timedelta, timezone
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

UTC = timezone.utc  # py3.10-safe

MAX_RETRIES = 5
TOKEN_REFRESH_BUFFER = timedelta(minutes=5)
MAX_ERROR_LEN = 500

SENDER_NEEDS_REAUTH_STATUS = "needs_reauth"
CAMPAIGN_PAUSED_STATUS = "paused"

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
    """
    Run an async coroutine from sync Celery code.

    Uses a fresh event loop each call. Works with --pool=solo on Windows too.
    """
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
    """
    EmailLog columns: campaign_id, recipient_id, sender_account_id,
    status, error_message, sent_at (+ id/created_at/updated_at).
    Email address and subject are NOT stored here; they live on
    CampaignRecipient and Campaign.
    """
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
    """
    Call the OAuth provider. Raises:
      - AuthError for permanent failures (invalid_grant, invalid_client).
      - The original exception for transient failures (network, 5xx).
    """
    try:
        return _run_async(OAuthService.refresh_access_token(refresh_token))
    except Exception as exc:
        msg = str(exc).lower()
        permanent_markers = ("invalid_grant", "invalid_client", "unauthorized_client")
        if any(marker in msg for marker in permanent_markers):
            raise AuthError(f"Token refresh permanently failed: {exc}") from exc
        # Transient — let Celery retry with backoff.
        raise


def get_fresh_access_token(db: Session, sender_account_id: int) -> str:
    """
    Return a valid access token, refreshing if needed.

    Two-phase locking:
      1. Read without lock to check expiry.
      2. Only if refresh is needed, take the row lock, re-read, and refresh.
    This keeps the lock off the hot path for the common case.
    """
    sender = db.get(SenderAccount, sender_account_id)
    if sender is None:
        raise PermanentError("Sender not found")

    if _status_str(sender.status) == SENDER_NEEDS_REAUTH_STATUS:
        raise AuthError("Sender account needs re-authentication")

    expires_at = _as_aware(sender.token_expires_at)
    if expires_at is not None and expires_at > datetime.now(UTC) + TOKEN_REFRESH_BUFFER:
        # Token is still good — no lock needed.
        return sender.access_token

    # Refresh path: take the lock, re-read, re-check.
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
        # Another worker refreshed while we were waiting for the lock.
        access_token = sender.access_token
        db.commit()
        return access_token

    refresh_token = (sender.refresh_token or "").strip()
    if not refresh_token:
        raise AuthError("No refresh token stored for sender account")

    # NOTE: this network call happens while holding the row lock.
    # It's bounded and serialized on purpose so rotating refresh
    # tokens don't race.
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

        if recipient is not None and mark_recipient_failed:
            recipient.status = RecipientStatus.FAILED

        # Log row needs a real recipient (recipient_id points to it).
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

        db.commit()
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

        # Idempotency: a retry or duplicate message must not resend.
        if _status_str(recipient.status) == "sent":
            return {"message": "Already sent, skipping"}

        if not recipient.is_valid_email:
            raise PermanentError("Invalid email address")

        # Campaign paused/cancelled → skip; recipient stays PENDING.
        if _status_str(campaign.status) in (CAMPAIGN_PAUSED_STATUS, "cancelled"):
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
            # Email is already out; retrying would duplicate it.
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
                # Auth error isn't the recipient's fault → don't FAIL them,
                # so they can be re-sent after the sender reconnects.
                mark_recipient_failed=not is_auth_error,
            )
            if is_auth_error:
                flag_auth_failure(db, sender_account_id, campaign_id)

        raise  # let Celery autoretry non-final attempts

    finally:
        db.close()