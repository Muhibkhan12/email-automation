from fastapi import APIRouter, status, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from services.oauth_service import OAuthService

from database import SessionLocal

router = APIRouter(
    prefix="/api/oauth/outlook",
    tags=["OAuth"]
)

@router.get('/connect')
def connect_outlook():
    auth_url = OAuthService.generate_auth_url()
    return{
        "auth_url" : auth_url
    }
    # return RedirectResponse(
    #     url=auth_url,
    #     status_code=status.HTTP_302_FOUND
    # )

@router.get('/callback')
async def outlook_callback(code : str):
    try:
        token = await OAuthService.exchange_code_for_token(code)

        return token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )