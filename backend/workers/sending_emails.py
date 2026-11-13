import asyncio
import os
import random
import re
import time
from datetime import datetime, timedelta, timezone
from html import escape
from html.parser import HTMLParser

import redis  # type: ignore
from celery.utils.log import get_task_logger  # type: ignore
from sqlalchemy import func, or_, true
from sqlalchemy.orm import Session

from database import SessionLocal
from models.campaign_recipients import CampaignRecipient, RecipientStatus
from models.campaigns import Campaign, CampaignStatus
from models.email_logs import EmailLog, EmailLogStatus
from models.html_templates import HTMLTemplate
from models.sender_account import SenderAccount, AccountStatus, Provider
from services.gmail_service import GmailService, GmailSendError
from services.google_oauth_service import GoogleOAuthService
from services.graph_service import GraphService
from services.oauth_service import OAuthService
from workers.celery_app import celery

logger = get_task_logger(__name__)

UTC = timezone.utc

MAX_RETRIES = 5
TOKEN_REFRESH_BUFFER = timedelta(minutes=5)
MAX_ERROR_LEN = 500
LIMIT_RESCHEDULE_PAD = 5
DISPATCH_BATCH = 50
DISPATCH_LOOKAHEAD = 45
OVERDUE_GRACE = 90
STALE_QUEUED_MINUTES = 30

GAP_BUCKETS = [
    (0.55, 10, 45),
    (0.30, 45, 120),
    (0.12, 120, 300),
    (0.03, 300, 600),
]
FIRST_SEND_DELAY = (2, 20)

DAILY_SPREAD_SECONDS = 43200.0

MIN_SEND_GAP = (10, 20)
GATE_PUSHBACK_JITTER = 30

RATE_LIMIT_PAD = 15
DEFAULT_THROTTLE_WAIT = 300
THROTTLE_STATUS_CODES = (429, 503, 504)
THROTTLE_MARKERS = (
    "throttl",
    "too many requests",
    "toomanyrequests",
    "mailboxconcurrency",
    "rate limit",
    "ratelimit",
    "retry-after",
    "serverbusy",
    "server busy",
)
QUOTA_MARKERS = (
    "sendquota",
    "quotaexceeded",
    "quota exceeded",
    "exceeded the daily",
    "daily limit",
    "daily sending limit",
    "per day",
    "recipient rate limit",
)
_STATUS_429_RE = re.compile(r"\b429\b")

PLAIN_TEXT_DOMAINS = {"gmail.com", "googlemail.com"}

SENDER_DEFAULTS = {
    "company": "Harbour Funding",
    "title": "Funding Advisor",
    "website": "https://www.harbourfundingsolutions.com/",
    "phone": "",
}

_PLACEHOLDER = re.compile(
    r"\{\{\s*([\w ]+?)\s*\}\}|\[\s*([A-Za-z][A-Za-z ]*?)\s*\]"
)


class PermanentError(Exception):
    """Raised for failures that retrying cannot fix."""


class AuthError(PermanentError):
    """Sender's Microsoft/Google token is unusable; needs the user to re-connect."""


class RateLimitError(Exception):
    """Provider said 'slow down' / 'limit reached'. NOT a failure."""

    def __init__(self, wait: int, reason: str = ""):
        super().__init__(reason or f"Rate limited, retry in {wait}s")
        self.wait = wait
        self.reason = reason


# =========================================================
# Helpers
# =========================================================

def _as_aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


def _naive_utc(dt: datetime) -> datetime:
    return dt.astimezone(UTC).replace(tzinfo=None) if dt.tzinfo else dt


def _status_str(value) -> str:
    return str(getattr(value, "value", value) or "").lower()


def _run_async(coro):
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
# Redis gate
# =========================================================

_redis_client = None


def _get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis.from_url(
            os.getenv("REDIS_URL", "redis://localhost:6379/0"),
            decode_responses=True,
        )
    return _redis_client


def _gap_key(sender_id: int) -> str:
    return f"sender:{sender_id}:next_send_ts"


def _cooldown_key(sender_id: int) -> str:
    return f"sender:{sender_id}:cooldown_until_ts"


_GATE_LUA = """
local now = tonumber(ARGV[1])
local cd = tonumber(redis.call('GET', KEYS[2]) or '0')
if cd > now then
  return tostring(cd - now)
end
local nxt = tonumber(redis.call('GET', KEYS[1]) or '0')
if nxt > now then
  return tostring(nxt - now)
end
redis.call('SET', KEYS[1], tostring(now + tonumber(ARGV[2])), 'EX', 172800)
return '0'
"""


def _take_send_slot(sender_id: int) -> float:
    gap = random.uniform(*MIN_SEND_GAP)
    res = _get_redis().eval(
        _GATE_LUA, 2, _gap_key(sender_id), _cooldown_key(sender_id), time.time(), gap
    )
    return float(res)


def _set_sender_cooldown(sender_id: int, seconds: float) -> None:
    r = _get_redis()
    key = _cooldown_key(sender_id)
    until = time.time() + seconds
    current = float(r.get(key) or 0)
    r.set(key, str(max(current, until)), ex=int(seconds) + 3600)


def _cooldown_remaining(sender_id: int) -> float:
    remaining = float(_get_redis().get(_cooldown_key(sender_id)) or 0) - time.time()
    return max(0.0, remaining)


def get_sender_cooldown_until(sender_id: int | None) -> datetime | None:
    if sender_id is None:
        return None
    try:
        remaining = _cooldown_remaining(sender_id)
    except Exception:
        return None
    if remaining <= 0:
        return None
    return datetime.now(UTC).replace(tzinfo=None) + timedelta(seconds=remaining)


# =========================================================
# Rate limit classification (works for Gmail + Outlook)
# =========================================================

def _seconds_until_tomorrow() -> int:
    now = datetime.now(UTC)
    next_day = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    return int((next_day - now).total_seconds())


def _as_rate_limit(exc: Exception) -> RateLimitError | None:
    response = getattr(exc, "response", None)
    status = getattr(exc, "status_code", None) or getattr(response, "status_code", None)
    try:
        status = int(status) if status is not None else None
    except (TypeError, ValueError):
        status = None

    text = str(exc).lower()
    is_quota = any(m in text for m in QUOTA_MARKERS)
    is_throttle = (
        status in THROTTLE_STATUS_CODES
        or bool(_STATUS_429_RE.search(text))
        or any(m in text for m in THROTTLE_MARKERS)
    )
    if not (is_quota or is_throttle):
        return None

    retry_after: float | None = None
    headers = getattr(response, "headers", None) or getattr(exc, "headers", None)
    if headers:
        raw = None
        try:
            raw = headers.get("Retry-After") or headers.get("retry-after")
        except Exception:
            raw = None
        if raw is not None:
            try:
                retry_after = float(raw)
            except (TypeError, ValueError):
                retry_after = None

    if retry_after is None:
        retry_after = _seconds_until_tomorrow() if is_quota else DEFAULT_THROTTLE_WAIT

    wait = int(max(retry_after, 30)) + RATE_LIMIT_PAD
    return RateLimitError(wait, f"{type(exc).__name__}: {exc}"[:MAX_ERROR_LEN])


def _defer_after_rate_limit(
    db: Session, recipient_id: int, sender_account_id: int, wait: int
) -> None:
    try:
        _set_sender_cooldown(sender_account_id, wait)
    except Exception:
        logger.exception("Could not set cooldown for sender %s", sender_account_id)

    try:
        db.rollback()
        recipient = db.get(CampaignRecipient, recipient_id)
        if recipient is not None and _status_str(recipient.status) in ("queued", "pending"):
            recipient.status = RecipientStatus.PENDING
            recipient.scheduled_at = _naive_utc(
                datetime.now(UTC) + timedelta(seconds=wait + random.randint(0, 120))
            )
            db.commit()
    except Exception:
        db.rollback()
        logger.exception("Could not defer recipient %s after rate limit", recipient_id)


# =========================================================
# Template rendering
# =========================================================

def _norm_key(raw: str) -> str:
    return re.sub(r"\s+", "_", raw.strip().lower())


def build_context(recipient: CampaignRecipient, sender: SenderAccount) -> dict[str, str]:
    name = (recipient.name or "").strip()
    first_name = name.split()[0] if name else ""
    recipient_company = (recipient.company or "").strip()

    sender_name = (sender.display_name or sender.email or "").strip()
    sender_company = (
        getattr(sender, "company_name", None) or SENDER_DEFAULTS.get("company") or ""
    ).strip()
    sender_title = (
        getattr(sender, "job_title", None) or SENDER_DEFAULTS.get("title") or ""
    ).strip()
    sender_phone = (getattr(sender, "phone", None) or SENDER_DEFAULTS.get("phone") or "").strip()

    return {
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
        "sender_name": sender_name,
        "sender_email": sender.email or "",
        "sender_company": sender_company,
        "sender_title": sender_title,
        "sender_phone": sender_phone,
        "title": sender_title,
        "phone": sender_phone,
    }


def render_template(html: str, context: dict[str, str]) -> str:
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
# HTML -> text
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
    parser = _TextExtractor()
    parser.feed(html)
    parser.close()
    text = "".join(parser.parts)
    text = re.sub(r"[ \t]*\n[ \t]*", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# =========================================================
# Token refresh (provider-aware, inline)
# =========================================================

def _refresh_token(provider, refresh_token: str) -> dict:
    """
    Gmail -> GoogleOAuthService, everything else -> OAuthService (Microsoft).
    Raises AuthError for permanent failures, original exception for transient.
    """
    try:
        if provider == Provider.GMAIL:
            return _run_async(GoogleOAuthService.refresh_access_token(refresh_token))
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

    token = _refresh_token(sender.provider, refresh_token)

    sender.access_token = token["access_token"]
    sender.refresh_token = token.get("refresh_token", sender.refresh_token)
    sender.token_expires_at = datetime.now(UTC) + timedelta(
        seconds=int(token["expires_in"])
    )

    access_token = sender.access_token
    db.commit()
    return access_token


# =========================================================
# Send (provider-aware, inline) — the actual fix
# =========================================================

async def _dispatch_send(
    sender: SenderAccount,
    *,
    access_token: str,
    recipient: str,
    subject: str,
    body: str,
    content_type: str,
    text_alternative: str | None,
) -> dict:
    """Gmail -> GmailService, everything else -> GraphService."""
    if sender.provider == Provider.GMAIL:
        return await GmailService.send_email(
            access_token=access_token,
            recipient=recipient,
            subject=subject,
            body=body,
            content_type=content_type,
            from_email=sender.email,
            from_name=sender.display_name,
            text_alternative=text_alternative,
        )
    return await GraphService.send_email(
        access_token=access_token,
        recipient=recipient,
        subject=subject,
        html_body=body,
        content_type=content_type,
    )


# =========================================================
# Counters / limits
# =========================================================

def _hour_start(now: datetime) -> datetime:
    return now.replace(minute=0, second=0, microsecond=0)


def _day_start(now: datetime) -> datetime:
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _limit_wait_seconds(sender: SenderAccount) -> int | None:
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
# Campaign finalize
# =========================================================

def _finalize_if_done(db: Session, campaign_id: int) -> None:
    try:
        pending = (
            db.query(CampaignRecipient)
            .filter(
                CampaignRecipient.campaign_id == campaign_id,
                CampaignRecipient.is_valid_email == True,  # noqa: E712
                CampaignRecipient.status.in_(
                    [RecipientStatus.PENDING, RecipientStatus.QUEUED]
                ),
            )
            .count()
        )
        if pending == 0:
            db.query(Campaign).filter(
                Campaign.id == campaign_id,
                Campaign.status == CampaignStatus.RUNNING,
            ).update(
                {Campaign.status: CampaignStatus.COMPLETED},
                synchronize_session=False,
            )
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Could not finalize campaign %s", campaign_id)


# =========================================================
# Scheduling
# =========================================================

def _random_gap() -> float:
    r = random.random()
    acc = 0.0
    for prob, lo, hi in GAP_BUCKETS:
        acc += prob
        if r < acc:
            return random.uniform(lo, hi)
    _, lo, hi = GAP_BUCKETS[-1]
    return random.uniform(lo, hi)


def schedule_campaign_sends(db: Session, campaign_id: int) -> int:
    campaign = db.get(Campaign, campaign_id)
    if campaign is None:
        return 0

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

    gaps = [_random_gap() for _ in range(n - 1)]

    sender = db.get(SenderAccount, campaign.sender_account_id)
    needed = 0.0
    if sender is not None:
        if sender.hourly_limit:
            needed = max(needed, 3600.0 / sender.hourly_limit)
        if sender.daily_limit:
            needed = max(needed, DAILY_SPREAD_SECONDS / sender.daily_limit)
    if gaps and needed:
        mean = sum(gaps) / len(gaps)
        if mean < needed:
            factor = needed / mean
            gaps = [g * factor for g in gaps]

    random.shuffle(recipients)

    t = datetime.now(UTC).replace(tzinfo=None) + timedelta(
        seconds=random.uniform(*FIRST_SEND_DELAY)
    )
    for i, recipient in enumerate(recipients):
        if i > 0:
            t += timedelta(seconds=gaps[i - 1])
        recipient.scheduled_at = t

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
    try:
        db.rollback()
        recipient = db.get(CampaignRecipient, recipient_id)

        newly_failed = False
        if recipient is not None and mark_recipient_failed:
            newly_failed = _status_str(recipient.status) != "failed"
            recipient.status = RecipientStatus.FAILED
            db.add(
                _new_email_log(
                    campaign_id=campaign_id,
                    sender_account_id=sender_account_id,
                    recipient_id=recipient_id,
                    status=EmailLogStatus.FAILED,
                    error_message=error,
                )
            )
        elif recipient is not None:
            recipient.status = RecipientStatus.PENDING

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
    dont_autoretry_for=(PermanentError, RateLimitError),
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

        if _status_str(recipient.status) == "sent":
            return {"message": "Already sent, skipping"}

        if _status_str(recipient.status) != "queued":
            return {"message": f"Recipient is {_status_str(recipient.status)}, skipping"}

        if not recipient.is_valid_email:
            raise PermanentError("Invalid email address")

        if campaign.status in (CampaignStatus.PAUSED, CampaignStatus.CANCELLED):
            recipient.status = RecipientStatus.PENDING
            db.commit()
            return {"message": f"Campaign is {_status_str(campaign.status)}, skipping"}

        sender = db.get(SenderAccount, sender_account_id)
        if sender is None:
            raise PermanentError("Sender not found")

        # Fail fast: account known-broken -> no retry loop.
        if sender.status == AccountStatus.NEEDS_REAUTH or not sender.refresh_token:
            recipient.status = RecipientStatus.FAILED
            db.commit()
            _finalize_if_done(db, campaign_id)
            return {
                "message": f"Sender {_status_str(sender.provider)} disconnected, needs reconnect"
            }

        wait = _limit_wait_seconds(sender)
        if wait is not None:
            recipient.status = RecipientStatus.PENDING
            recipient.scheduled_at = (
                datetime.now(UTC) + timedelta(seconds=wait + random.randint(0, 300))
            ).replace(tzinfo=None)
            db.commit()
            return {"message": f"Sender limit reached, moved by {wait}s"}

        gate_wait = _take_send_slot(sender_account_id)
        if gate_wait > 0:
            recipient.status = RecipientStatus.PENDING
            recipient.scheduled_at = _naive_utc(
                datetime.now(UTC)
                + timedelta(seconds=gate_wait + random.uniform(0, GATE_PUSHBACK_JITTER))
            )
            db.commit()
            return {"message": f"Too soon for this sender, moved by {gate_wait:.0f}s"}

        access_token = get_fresh_access_token(db, sender_account_id)

        context = build_context(recipient, sender)
        html = render_template(template.html_content, context)

        recipient_email = recipient.email
        subject = campaign.subject

        if is_plain_text_recipient(recipient_email):
            body, content_type = html_to_text(html), "Text"
        else:
            body, content_type = html, "HTML"

        # --- Send: provider-aware ---
        try:
            _run_async(
                _dispatch_send(
                    sender,
                    access_token=access_token,
                    recipient=recipient_email,
                    subject=subject,
                    body=body,
                    content_type=content_type,
                    text_alternative=html_to_text(html) if content_type == "HTML" else None,
                )
            )
        except Exception as send_exc:
            rate_limit = _as_rate_limit(send_exc)
            if rate_limit is not None:
                raise rate_limit from send_exc
            raise
        email_sent = True

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

    except RateLimitError as exc:
        logger.warning(
            "Rate limit for sender %s. Cooling down %ss. %s",
            sender_account_id, exc.wait, exc.reason,
        )
        _defer_after_rate_limit(db, recipient_id, sender_account_id, exc.wait)
        return {"message": f"Rate limited by provider, retry in {exc.wait}s"}

    except Exception as exc:
        db.rollback()

        if email_sent:
            logger.exception(
                "Email to recipient %s was sent but DB update failed", recipient_id
            )
            _set_status(db, CampaignRecipient, recipient_id, RecipientStatus.SENT)
            return {"message": "Sent, but bookkeeping failed"}

        is_auth_error = isinstance(exc, AuthError)
        is_final_attempt = (
            isinstance(exc, PermanentError)
            or self.request.retries >= self.max_retries
        )
        if is_final_attempt:
            error_text = f"{type(exc).__name__}: {exc}"
            record_failure(
                db,
                recipient_id,
                campaign_id,
                sender_account_id,
                error_text,
                mark_recipient_failed=not is_auth_error,
            )
            if is_auth_error:
                flag_auth_failure(db, sender_account_id, campaign_id)

        raise

    finally:
        db.close()


# =========================================================
# Task: dispatcher
# =========================================================

@celery.task(
    name="workers.sending_emails.dispatch_due_task",
    queue="email_sender_queue",
)
def dispatch_due_task():
    db: Session = SessionLocal()
    try:
        now = datetime.now(UTC).replace(tzinfo=None)
        horizon = now + timedelta(seconds=DISPATCH_LOOKAHEAD)
        overdue_cutoff = now - timedelta(seconds=OVERDUE_GRACE)

        running_senders = [
            sid
            for (sid,) in db.query(Campaign.sender_account_id)
            .filter(Campaign.status == CampaignStatus.RUNNING)
            .distinct()
            .all()
            if sid is not None
        ]
        cooling = [sid for sid in running_senders if _cooldown_remaining(sid) > 0]
        not_cooling = (
            ~Campaign.sender_account_id.in_(cooling) if cooling else true()
        )

        backlog_campaigns = [
            cid
            for (cid,) in db.query(CampaignRecipient.campaign_id)
            .join(Campaign, Campaign.id == CampaignRecipient.campaign_id)
            .filter(
                CampaignRecipient.status == RecipientStatus.PENDING,
                CampaignRecipient.is_valid_email == True,  # noqa: E712
                or_(
                    CampaignRecipient.scheduled_at.is_(None),
                    CampaignRecipient.scheduled_at < overdue_cutoff,
                ),
                Campaign.status == CampaignStatus.RUNNING,
                not_cooling,
            )
            .distinct()
            .all()
        ]
        for cid in backlog_campaigns:
            n = schedule_campaign_sends(db, cid)
            logger.warning("Campaign %s had a backlog: re-scheduled %d recipients from now", cid, n)

        rows = (
            db.query(
                CampaignRecipient.id,
                CampaignRecipient.campaign_id,
                CampaignRecipient.scheduled_at,
                Campaign.sender_account_id,
            )
            .join(Campaign, Campaign.id == CampaignRecipient.campaign_id)
            .filter(
                CampaignRecipient.status == RecipientStatus.PENDING,
                CampaignRecipient.scheduled_at.isnot(None),
                CampaignRecipient.scheduled_at <= horizon,
                Campaign.status == CampaignStatus.RUNNING,
                not_cooling,
            )
            .order_by(CampaignRecipient.scheduled_at)
            .limit(DISPATCH_BATCH)
            .all()
        )
        if not rows:
            return 0

        claimed = []
        for r in rows:
            updated = (
                db.query(CampaignRecipient)
                .filter(
                    CampaignRecipient.id == r.id,
                    CampaignRecipient.status == RecipientStatus.PENDING,
                )
                .update(
                    {CampaignRecipient.status: RecipientStatus.QUEUED},
                    synchronize_session=False,
                )
            )
            if updated == 1:
                claimed.append((r, r.scheduled_at))
        db.commit()

        for r, sched in claimed:
            send_email_task.apply_async(
                args=[r.id, r.sender_account_id, r.campaign_id],
                queue="email_sender_queue",
                eta=_as_aware(sched),
            )
        return len(claimed)
    except Exception:
        db.rollback()
        logger.exception("Dispatcher failed")
        raise
    finally:
        db.close()


# =========================================================
# Task: requeue stale
# =========================================================

@celery.task(
    name="workers.sending_emails.requeue_stale_task",
    queue="email_sender_queue",
)
def requeue_stale_task():
    db: Session = SessionLocal()
    try:
        now = datetime.now(UTC).replace(tzinfo=None)
        cutoff = now - timedelta(minutes=STALE_QUEUED_MINUTES)
        count = (
            db.query(CampaignRecipient)
            .filter(
                CampaignRecipient.status == RecipientStatus.QUEUED,
                CampaignRecipient.scheduled_at < cutoff,
            )
            .update(
                {CampaignRecipient.status: RecipientStatus.PENDING},
                synchronize_session=False,
            )
        )
        db.commit()
        if count:
            logger.warning("Requeued %d stale QUEUED recipients", count)
        return count
    except Exception:
        db.rollback()
        logger.exception("requeue_stale_task failed")
        raise
    finally:
        db.close()