from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from services.oauth_service import OAuthService
from database import get_db
from models.sender_account import SenderAccount


router = APIRouter(
    prefix="/api/oauth/outlook",
    tags=["OAuth"]
)


@router.get("/connect")
async def connect_outlook():
    auth_url = OAuthService.generate_auth_url()
    return RedirectResponse(
        url=auth_url,
        status_code=302
    )


@router.get("/callback")
async def outlook_callback(
    code: str = Query(...),
    state: str | None = Query(None),
    db: Session = Depends(get_db)
):

    try:

        # -----------------------------------------
        # 1. Exchange authorization code
        # -----------------------------------------

        token = await OAuthService.exchange_code_for_token(
            code
        )

        access_token = token["access_token"]
        refresh_token = token.get("refresh_token")

        expires_in = token.get("expires_in", 3600)

        # -----------------------------------------
        # 2. Get Microsoft profile
        # -----------------------------------------

        profile = await OAuthService.get_user_profile(
            access_token
        )

        email = (
            profile.get("mail")
            or profile.get("userPrincipalName")
        )

        display_name = profile.get("displayName")

        if not email:

            raise Exception(
                "Could not determine Outlook email address."
            )

        # -----------------------------------------
        # 3. Calculate token expiration
        # -----------------------------------------

        token_expires_at = (
            datetime.now(timezone.utc)
            + timedelta(seconds=expires_in)
        )

        # -----------------------------------------
        # 4. Check if account already exists
        # -----------------------------------------

        sender_account = (
            db.query(SenderAccount)
            .filter(
                SenderAccount.email == email
            )
            .first()
        )

        # -----------------------------------------
        # 5. Update existing account
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
        # 6. Create new account
        # -----------------------------------------

        else:

            sender_account = SenderAccount(
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
                emails_sent_hour=0
            )

            db.add(sender_account)

        # -----------------------------------------
        # 7. Save database changes
        # -----------------------------------------

        db.commit()
        db.refresh(sender_account)

        # -----------------------------------------
        # 8. DON'T return tokens
        # -----------------------------------------

        return {
            "message": "Outlook Connected Successfully",

            "sender_account": {
                "id": sender_account.id,
                "email": sender_account.email,
                "display_name": sender_account.display_name,
                "provider": sender_account.provider,
                "status": sender_account.status
            }
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )