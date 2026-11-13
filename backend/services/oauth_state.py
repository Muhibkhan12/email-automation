"""Signed, expiring OAuth `state` (HMAC). Use for Gmail now, and swap into the Outlook route too."""
import base64
import hashlib
import hmac
import json
import secrets
import time

from config import settings  # adjust to wherever your pydantic `settings` lives


def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def _unb64(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _sig(body: str) -> str:
    return _b64(hmac.new(settings.SECRET_KEY.encode(), body.encode(), hashlib.sha256).digest())


def sign_state(user_id: int, purpose: str, ttl: int = 600) -> str:
    body = _b64(
        json.dumps(
            {"uid": user_id, "p": purpose, "exp": int(time.time()) + ttl, "n": secrets.token_urlsafe(8)}
        ).encode()
    )
    return f"{body}.{_sig(body)}"


def verify_state(state: str, purpose: str) -> int:
    """Returns user_id or raises ValueError."""
    try:
        body, sig = state.split(".", 1)
        if not hmac.compare_digest(sig, _sig(body)):
            raise ValueError
        data = json.loads(_unb64(body))
        if data["p"] != purpose or data["exp"] < time.time():
            raise ValueError
        return int(data["uid"])
    except Exception:
        raise ValueError("Invalid or expired state")