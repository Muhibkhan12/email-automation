import asyncio
import random
import re
from datetime import datetime, timedelta, timezone
from html import escape
from html.parser import HTMLParser

from celery.utils.log import get_task_logger  # type: ignore
from sqlalchemy.orm import Session

from database import SessionLocal
from models.campaign_recipients import CampaignRecipient, RecipientStatus
from models.campaigns import Campaign, CampaignStatus
from models.email_logs import EmailLog, EmailLogStatus
from models.html_templates import HTMLTemplate
from models.sender_account import SenderAccount, AccountStatus
from services.graph_service import GraphService
from services.oauth_service import OAuthService
from workers.celery_app import celery

logger = get_task_logger(__name__)

UTC = timezone.utc  # py3.10-safe

MAX_RETRIES = 5
TOKEN_REFRESH_BUFFER = timedelta(minutes=5)
MAX_ERROR_LEN = 500
LIMIT_RESCHEDULE_PAD = 5   # seconds, small buffer after a limit window resets
DISPATCH_BATCH = 20        # max emails queued per minute (avoids bursts)
MIN_GAP_SECONDS = 20       # minimum gap between two scheduled emails

# Domains that get PLAIN TEXT instead of the HTML template.
PLAIN_TEXT_DOMAINS = {"gmail.com", "googlemail.com"}

# Used when SenderAccount has no such column. EDIT THESE.
SENDER_DEFAULTS = {
    "company": "Your Company",
    "title": "Funding Advisor",
    "phone": "",
}

# Matches {{ key }} and [Key Name]
_PLACEHOLDER = re.compile(
    r"\{\{\s*([\w ]+?)\s*\}\}|\[\s*([A-Za-z][A-Za-z ]*?)\s*\]"
)


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
# Template rendering (fills sender / recipient data)
# =========================================================

def _norm_key(raw: str) -> str:
    """'Sender Name' -> 'sender_name'"""
    return re.sub(r"\s+", "_", raw.strip().lower())


def build_context(recipient: CampaignRecipient, sender: SenderAccount) -> dict[str, str]:
    """All values that can be used as placeholders in a template."""
    name = (recipient.name or "").strip()
    first_name = name.split()[0] if name else ""
    recipient_company = (recipient.company or "").strip()

    sender_name = (sender.display_name or sender.email or "").strip()
    sender_company = (getattr(sender, "company_name", None) or SENDER_DEFAULTS["company"] or "").strip()
    sender_title = (getattr(sender, "job_title", None) or SENDER_DEFAULTS["title"] or "").strip()
    sender_phone = (getattr(sender, "phone", None) or SENDER_DEFAULTS["phone"] or "").strip()

    return {
        # recipient
        "name": name,
        "recipient_name": name,
        "business_owner": name,
        "owner_name": name,
        "first_name": first_name,
        "email": recipient.email or "",
        "recipient_email": recipient.email or "",
        "company": recipient_company,
        "company_name": recipient_company,
        "business_name": recipient_company,
        "recipient_phone": (recipient.phone or "").strip(),
        # sender
        "sender_name": sender_name,
        "sender_email": sender.email or "",
        "sender_company": sender_company,
        "sender_title": sender_title,
        "sender_phone": sender_phone,
        "title": sender_title,
        "phone": sender_phone,
    }


def render_template(html: str, context: dict[str, str]) -> str:
    """
    Replace {{key}} and [Key Name] placeholders with HTML-escaped values.
    - Unknown {{key}}  -> removed (empty), so recipients never see raw tags.
    - Unknown [Text]   -> left untouched (could be normal text or [if mso]).
    """

    def repl(match: re.Match) -> str:
        curly = match.group(1)
        raw = curly if curly is not None else match.group(2)
        key = _norm_key(raw)

        if key in context:
            return escape(context[key])

        if curly is not None:
            logger.warning("Template placeholder {{%s}} has no value", key)
            return ""
        return match.group(0)

    return _PLACEHOLDER.sub(repl, html)


# =========================================================
# Plain text for Gmail
# =========================================================

def is_plain_text_recipient(email: str) -> bool:
    domain = (email or "").rsplit("@", 1)[-1].strip().lower()
    return domain in PLAIN_TEXT_DOMAINS


_BLOCK_TAGS = {"p", "div", "tr", "table", "ul", "ol", "section", "h1", "h2", "h3", "h4", "h5", "h6"}
_SKIP_TAGS = {"script", "style", "head", "title"}


class _TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self._skip = 0
        self._href: str | None = None
        self._link_text = ""

    def handle_starttag(self, tag, attrs):
        if tag in _SKIP_TAGS:
            self._skip += 1
        elif tag == "br" or tag in _BLOCK_TAGS:
            self.parts.append("\n")
        elif tag == "li":
            self.parts.append("\n- ")
        elif tag == "a":
            self._href = dict(attrs).get("href")
            self._link_text = ""

    def handle_endtag(self, tag):
        if tag in _SKIP_TAGS:
            self._skip = max(0, self._skip - 1)
        elif tag in _BLOCK_TAGS:
            self.parts.append("\n")
        elif tag == "a":
            href = self._href
            if href and href.startswith(("http://", "https://")) and href.strip() != self._link_text.strip():
                self.parts.append(f" ({href})")
            self._href = None

    def handle_data(self, data):
        if self._skip:
            return
        data = re.sub(r"[ \t\r\n]+", " ", data)
        if self._href is not None:
            self._link_text += data
        self.parts.append(data)


def html_to_text(html: str) -> str:
    """Convert rendered HTML into clean plain text."""
    parser = _TextExtractor()
    parser.feed(html)
    parser.close()
    text = "".join(parser.parts)
    text = re.sub(r"[ \t]*\n[ \t]*", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# =========================================================
# Token refresh
# =========================================================

def _refresh_token(refresh_token: str) -> dict:
    """
    Raises AuthError for permanent failures (invalid_grant, invalid_client),
    original exception for transient ones (network, 5xx).
    """
    try:
        return _run_async(OAuthService.refresh_access_token(refresh_token))
    except Exception as exc:
        msg = str(exc).lower()
        permanent_markers = ("invalid_grant", "invalid_client", "unauthorized_client")
        if any(marker in msg for marker in permanent_markers):
            raise AuthError(f"Token refresh permanently failed: {exc}") from exc
        raise


def get_fresh_access_token(db: Session, sender_account_id: int) -> str:
    """Return a valid access token, refreshing (with row lock) only if needed."""
    sender = db.get(SenderAccount, sender_account_id)
    if sender is None:
        raise PermanentError("Sender not found")

    if sender.status == AccountStatus.NEEDS_REAUTH:
        raise AuthError("Sender account needs re-authentication")

    expires_at = _as_aware(sender.token_expires_at)
    if expires_at is not None and expires_at > datetime.now(UTC) + TOKEN_REFRESH_BUFFER:
        return sender.access_token

    sender = (
        db.query(SenderAccount)
        .filter(SenderAccount.id == sender_account_id)
        .populate_existing()
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
# Sender counters (hourly + daily) and limits
# =========================================================

def _hour_start(now: datetime) -> datetime:
    return now.replace(minute=0, second=0, microsecond=0)


def _day_start(now: datetime) -> datetime:
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _limit_wait_seconds(sender: SenderAccount) -> int | None:
    """If an hourly/daily limit is hit, return seconds until it resets, else None."""
    now = datetime.now(UTC)
    hour_start, day_start = _hour_start(now), _day_start(now)

    sent_hour = (
        (sender.emails_sent_hour or 0)
        if _as_aware(sender.hour_window_start) == hour_start
        else 0
    )
    sent_today = (
        (sender.emails_sent_today or 0)
        if _as_aware(sender.day_window_start) == day_start
        else 0
    )

    if sender.daily_limit and sent_today >= sender.daily_limit:
        next_day = day_start + timedelta(days=1)
        return int((next_day - now).total_seconds()) + LIMIT_RESCHEDULE_PAD

    if sender.hourly_limit and sent_hour >= sender.hourly_limit:
        next_hour = hour_start + timedelta(hours=1)
        return int((next_hour - now).total_seconds()) + LIMIT_RESCHEDULE_PAD

    return None


def _bump_sender_counters(db: Session, sender_account_id: int) -> None:
    """+1 on hour and day counters (reset first if the window changed). Caller commits."""
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
    """Zero stale counters for senders who sent nothing in the new hour/day."""
    now = datetime.now(UTC)
    hour_start = _hour_start(now).replace(tzinfo=None)
    day_start = _day_start(now).replace(tzinfo=None)
    try:
        db.query(SenderAccount).filter(
            (SenderAccount.hour_window_start == None)  # noqa: E711
            | (SenderAccount.hour_window_start < hour_start)
        ).update(
            {
                SenderAccount.emails_sent_hour: 0,
                SenderAccount.hour_window_start: hour_start,
            },
            synchronize_session=False,
        )
        db.query(SenderAccount).filter(
            (SenderAccount.day_window_start == None)  # noqa: E711
            | (SenderAccount.day_window_start < day_start)
        ).update(
            {
                SenderAccount.emails_sent_today: 0,
                SenderAccount.day_window_start: day_start,
            },
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
    """If no PENDING/QUEUED recipient is left, mark a RUNNING campaign COMPLETED."""
    try:
        pending = (
            db.query(CampaignRecipient)
            .filter(
                CampaignRecipient.campaign_id == campaign_id,
                CampaignRecipient.status.in_(
                    [RecipientStatus.PENDING, RecipientStatus.QUEUED]
                ),
            )
            .count()
        )
        if pending == 0:
            db.query(Campaign).filter(
                Campaign.id == campaign_id,
                Campaign.status == CampaignStatus.RUNNING,  # paused/cancelled stay as is
            ).update(
                {Campaign.status: CampaignStatus.COMPLETED},
                synchronize_session=False,
            )
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Could not finalize campaign %s", campaign_id)


# =========================================================
# Random scheduling (anti-spam)
# =========================================================

def schedule_campaign_sends(
    db: Session,
    campaign_id: int,
    window_hours: float = 7.0,
) -> int:
    """
    Give every PENDING valid recipient a random send time inside window_hours.
    Call this once when the campaign starts. Returns how many were scheduled.
    """
    recipients = (
        db.query(CampaignRecipient)
        .filter(
            CampaignRecipient.campaign_id == campaign_id,
            CampaignRecipient.status == RecipientStatus.PENDING,
            CampaignRecipient.is_valid_email == True,  # noqa: E712
        )
        .all()
    )
    n = len(recipients)
    if n == 0:
        return 0

    window = max(60.0, window_hours * 3600)
    gap = min(MIN_GAP_SECONDS, window / n)

    offsets = sorted(random.uniform(0, window) for _ in range(n))
    for i in range(1, n):
        if offsets[i] - offsets[i - 1] < gap:
            offsets[i] = offsets[i - 1] + gap

    random.shuffle(recipients)  # random order too, so no pattern
    start = datetime.now(UTC).replace(tzinfo=None)
    for recipient, offset in zip(recipients, offsets):
        recipient.scheduled_at = start + timedelta(seconds=offset)

    db.commit()
    return n


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
    """Write a FAILED log row, mark recipient FAILED, failed_count +1. Never raises."""
    try:
        db.rollback()
        recipient = db.get(CampaignRecipient, recipient_id)

        newly_failed = False
        if recipient is not None and mark_recipient_failed:
            newly_failed = _status_str(recipient.status) != "failed"
            recipient.status = RecipientStatus.FAILED
        elif recipient is not None:
            # Auth error: not the recipient's fault, will run again after reconnect.
            recipient.status = RecipientStatus.PENDING

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
    """Sender token dead: mark sender NEEDS_REAUTH and pause the campaign."""
    _set_status(db, SenderAccount, sender_account_id, AccountStatus.NEEDS_REAUTH)
    _set_status(db, Campaign, campaign_id, CampaignStatus.PAUSED)


# =========================================================
# Task: send one email
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

        # Idempotency: duplicate/retried message must not resend.
        if _status_str(recipient.status) == "sent":
            return {"message": "Already sent, skipping"}

        if not recipient.is_valid_email:
            raise PermanentError("Invalid email address")

        # Paused/cancelled: put recipient back to PENDING; dispatcher picks it up on resume.
        if campaign.status in (CampaignStatus.PAUSED, CampaignStatus.CANCELLED):
            recipient.status = RecipientStatus.PENDING
            db.commit()
            return {"message": f"Campaign is {_status_str(campaign.status)}, skipping"}

        # --- Sender limits (hourly + daily) ---
        sender = db.get(SenderAccount, sender_account_id)
        if sender is None:
            raise PermanentError("Sender not found")

        wait = _limit_wait_seconds(sender)
        if wait is not None:
            recipient.status = RecipientStatus.PENDING
            recipient.scheduled_at = (
                datetime.now(UTC) + timedelta(seconds=wait + random.randint(0, 300))
            ).replace(tzinfo=None)
            db.commit()
            return {"message": f"Sender limit reached, moved by {wait}s"}

        # --- Token ---
        access_token = get_fresh_access_token(db, sender_account_id)

        # --- Render template with sender + recipient data ---
        context = build_context(recipient, sender)
        html = render_template(template.html_content, context)

        recipient_email = recipient.email
        subject = campaign.subject

        # --- Gmail -> plain text, everyone else -> HTML ---
        if is_plain_text_recipient(recipient_email):
            body, content_type = html_to_text(html), "Text"
        else:
            body, content_type = html, "HTML"

        # --- Send ---
        _run_async(
            GraphService.send_email(
                access_token=access_token,
                recipient=recipient_email,
                subject=subject,
                html_body=body,
                content_type=content_type,
            )
        )
        email_sent = True

        # --- Bookkeeping ---
        now = datetime.now(UTC)
        recipient.status = RecipientStatus.SENT
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

        db.query(Campaign).filter(Campaign.id == campaign_id).update(
            {Campaign.sent_count: Campaign.sent_count + 1},
            synchronize_session=False,
        )

        _bump_sender_counters(db, sender_account_id)

        db.commit()
        _finalize_if_done(db, campaign_id)
        return {"message": f"Email Sent Successfully ({content_type})"}

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


# =========================================================
# Task: dispatcher (runs every minute via Celery beat)
# =========================================================

@celery.task(
    name="workers.sending_emails.dispatch_due_task",
    queue="email_sender_queue",
)
def dispatch_due_task():
    """Queue every recipient whose random send time has arrived."""
    db: Session = SessionLocal()
    try:
        now = datetime.now(UTC).replace(tzinfo=None)
        rows = (
            db.query(
                CampaignRecipient.id,
                CampaignRecipient.campaign_id,
                Campaign.sender_account_id,
            )
            .join(Campaign, Campaign.id == CampaignRecipient.campaign_id)
            .filter(
                CampaignRecipient.status == RecipientStatus.PENDING,
                CampaignRecipient.scheduled_at.isnot(None),
                CampaignRecipient.scheduled_at <= now,
                Campaign.status == CampaignStatus.RUNNING,  # paused/cancelled skipped
            )
            .order_by(CampaignRecipient.scheduled_at)
            .limit(DISPATCH_BATCH)
            .all()
        )
        if not rows:
            return 0

        ids = [r.id for r in rows]
        db.query(CampaignRecipient).filter(
            CampaignRecipient.id.in_(ids),
            CampaignRecipient.status == RecipientStatus.PENDING,
        ).update(
            {CampaignRecipient.status: RecipientStatus.QUEUED},
            synchronize_session=False,
        )
        db.commit()

        for r in rows:
            send_email_task.delay(r.id, r.sender_account_id, r.campaign_id)
        return len(rows)
    except Exception:
        db.rollback()
        logger.exception("Dispatcher failed")
        raise
    finally:
        db.close()