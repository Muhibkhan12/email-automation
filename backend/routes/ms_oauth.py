from datetime import datetime, timedelta, timezone
import json, base64, secrets

from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from services.oauth_service import OAuthService
from database import get_db
from models.sender_account import SenderAccount
from models.user import User
from services.auth import verify_access_token


router = APIRouter(
    prefix="/api/oauth/outlook",
    tags=["OAuth"]
)


@router.get("/connect")
async def connect_outlook(
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    # Manually verify the token (same logic GetCurrentUser does)
    payload = verify_access_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User does not exist")

    # Pack user_id into state so we can recover it on the callback
    state_payload = {
        "user_id": user.id,
        "nonce": secrets.token_urlsafe(16),
    }
    state = base64.urlsafe_b64encode(
        json.dumps(state_payload).encode()
    ).decode()

    auth_url = OAuthService.generate_auth_url(state=state)
    return RedirectResponse(url=auth_url, status_code=302)


@router.get("/callback")
async def outlook_callback(
    code: str = Query(...),
    state: str | None = Query(None),
    db: Session = Depends(get_db),
):
    try:
        # -----------------------------------------
        # 0. Recover user_id from state
        # -----------------------------------------
        if not state:
            raise Exception("Missing state parameter.")

        try:
            payload = json.loads(
                base64.urlsafe_b64decode(state.encode()).decode()
            )
            user_id = payload["user_id"]
        except Exception:
            raise Exception("Invalid state parameter.")

        # -----------------------------------------
        # 1. Exchange authorization code
        # -----------------------------------------
        token = await OAuthService.exchange_code_for_token(code)

        access_token = token["access_token"]
        refresh_token = token.get("refresh_token")
        expires_in = token.get("expires_in", 3600)

        # -----------------------------------------
        # 2. Get Microsoft profile
        # -----------------------------------------
        profile = await OAuthService.get_user_profile(access_token)

        email = (
            profile.get("mail")
            or profile.get("userPrincipalName")
        )
        display_name = profile.get("displayName")

        if not email:
            raise Exception("Could not determine Outlook email address.")

        # -----------------------------------------
        # 3. Calculate token expiration
        # -----------------------------------------
        token_expires_at = (
            datetime.now(timezone.utc)
            + timedelta(seconds=expires_in)
        )

        # -----------------------------------------
        # 4. Check if account already exists (for THIS user)
        # -----------------------------------------
        sender_account = (
            db.query(SenderAccount)
            .filter(
                SenderAccount.email == email,
                SenderAccount.user_id == user_id,
            )
            .first()
        )

        # -----------------------------------------
        # 5. Update existing
        # -----------------------------------------
        if sender_account:
            sender_account.display_name = display_name
            sender_account.provider = "outlook"
            sender_account.access_token = access_token

            if refresh_token:
                sender_account.refresh_token = refresh_token

            sender_account.token_expires_at = token_expires_at
            sender_account.status = "active"

        # -----------------------------------------
        # 6. Create new
        # -----------------------------------------
        else:
            sender_account = SenderAccount(
                user_id=user_id,
                email=email,
                display_name=display_name,
                provider="outlook",
                access_token=access_token,
                refresh_token=refresh_token,
                token_expires_at=token_expires_at,
                status="active",
                daily_limit=100,
                hourly_limit=20,
                emails_sent_today=0,
                emails_sent_hour=0,
            )
            db.add(sender_account)

        # -----------------------------------------
        # 7. Save
        # -----------------------------------------
        db.commit()
        db.refresh(sender_account)

        # -----------------------------------------
        # 8. Redirect back to frontend
        # -----------------------------------------
        return RedirectResponse(
            url="http://localhost:5173/user/sender-account?ms=connected",
            status_code=302,
        )

    except Exception as e:
        db.rollback()
        return RedirectResponse(
            url=f"http://localhost:5173/user/sender-account?ms=error&reason={str(e)[:200]}",
            status_code=302,
        )