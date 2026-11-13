import logging
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from config import settings  # adjust; add FRONTEND_URL: str = "http://localhost:5173"
from database import get_db
from models.sender_account import AccountStatus, Provider, SenderAccount
from models.user import User
from services.auth import verify_access_token
from services.google_oauth_service import GMAIL_SEND_SCOPE, GoogleOAuthService
from services.oauth_state import sign_state, verify_state

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/oauth/gmail", tags=["OAuth"])

STATE_PURPOSE = "gmail_connect"


class ConnectError(Exception):
    """Message is safe to show to the user."""


def _to_frontend(status: str, reason: str | None = None) -> RedirectResponse:
    url = f"{settings.FRONTEND_URL}/user/sender-account?google={status}"
    if reason:
        url += f"&reason={quote(reason[:200])}"
    return RedirectResponse(url=url, status_code=302)


@router.get("/connect")
async def connect_gmail(token: str = Query(...), db: Session = Depends(get_db)):
    # Same pattern as the Outlook route (browser redirect can't send a bearer header)
    payload = verify_access_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User does not exist")

    state = sign_state(user.id, STATE_PURPOSE)
    return RedirectResponse(url=GoogleOAuthService.generate_auth_url(state), status_code=302)


@router.get("/callback")
async def gmail_callback(
    code: str | None = Query(None),
    state: str | None = Query(None),
    error: str | None = Query(None),
    db: Session = Depends(get_db),
):
    if error or not code:
        return _to_frontend("error", "Google access was not granted.")

    try:
        user_id = verify_state(state or "", STATE_PURPOSE)
    except ValueError:
        return _to_frontend("error", "Invalid or expired request. Please try again.")

    try:
        token = await GoogleOAuthService.exchange_code_for_token(code)

        # Google lets users untick individual permissions on the consent screen.
        if GMAIL_SEND_SCOPE not in (token.get("scope") or "").split():
            raise ConnectError("Please allow 'Send email on your behalf' to connect Gmail.")

        refresh_token = token.get("refresh_token")
        if not refresh_token:
            raise ConnectError("Google did not return a refresh token. Please try again.")

        access_token = token["access_token"]
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=token.get("expires_in", 3600))

        profile = await GoogleOAuthService.get_user_profile(access_token)
        email = (profile.get("email") or "").strip().lower()
        if not email:
            raise ConnectError("Could not determine Gmail address.")
        display_name = profile.get("name")

        # SenderAccount.email is globally unique, so look up by email only.
        account = db.query(SenderAccount).filter(SenderAccount.email == email).first()

        if account is not None:
            if account.user_id != user_id:
                raise ConnectError("This email is already connected to another account.")
            if account.provider != Provider.GMAIL:
                raise ConnectError("This email is already connected through another provider.")
            account.display_name = display_name
            account.access_token = access_token
            account.refresh_token = refresh_token
            account.token_expires_at = expires_at.replace(tzinfo=None)  # DB stores naive UTC
            account.status = AccountStatus.ACTIVE
        else:
            db.add(
                SenderAccount(
                    user_id=user_id,
                    email=email,
                    display_name=display_name,
                    provider=Provider.GMAIL,
                    access_token=access_token,
                    refresh_token=refresh_token,
                    token_expires_at=expires_at.replace(tzinfo=None),
                    status=AccountStatus.ACTIVE,
                    daily_limit=100,
                    hourly_limit=20,
                    emails_sent_today=0,
                    emails_sent_hour=0,
                )
            )

        db.commit()
        return _to_frontend("connected")

    except ConnectError as e:
        db.rollback()
        return _to_frontend("error", str(e))
    except Exception:
        db.rollback()
        logger.exception("Gmail connect failed")
        return _to_frontend("error", "Could not connect Gmail. Please try again.")