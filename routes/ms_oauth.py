from fastapi import APIRouter, status
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


    

    # return{
    #     "auth_url" : auth_url
    # }
    return RedirectResponse(
        url=auth_url,
        status_code=status.HTTP_302_FOUND
    )