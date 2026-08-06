from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse

from backend.services.oauth_service import OAuthService

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
    state: str = Query(...)
):
    try:

        # Exchange authorization code for tokens
        token = await OAuthService.exchange_code_for_token(code)

        # Get Outlook profile
        profile = await OAuthService.get_user_profile(
            token["access_token"]
        )

        email = profile.get("mail") or profile.get("userPrincipalName")

        display_name = profile.get("displayName")

        ##########################################################
        # TODO
        #
        # Save these values into SenderAccount table
        #
        # email
        # display_name
        # access_token
        # refresh_token
        # expires_in
        #
        ##########################################################

        return {
            "message": "Outlook Connected Successfully",

            "profile": {
                "display_name": display_name,
                "email": email,
            },

            "token": {
                "access_token": token["access_token"],
                "refresh_token": token["refresh_token"],
                "expires_in": token["expires_in"],
                "token_type": token["token_type"],
            }
        }

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )