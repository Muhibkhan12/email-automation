import httpx
from urllib.parse import urlencode
from config import settings

class OAuthService:

    @staticmethod
    def generate_auth_url():
        params = {
            "client_id" : settings.MS_CLIENT_ID,
            "response_type" : "code",
            "redirect_uri" : settings.MS_REDIRECT_URI,

            "scope" : "offline_access Mail.Send User.read",
            "response_mode" : "query",
            "state" : "123456",
        }
        auth_url = (
            f"https://login.microsoftonline.com/"
            f"{settings.MS_TENANT_ID}"
            f"/oauth2/v2.0/authorize?"
            f"{urlencode(params)}"
        )

        return auth_url

    @staticmethod
    async def exchange_code_for_token(code: str):

        token_url = (
            f"https://login.microsoftonline.com/"
            f"{settings.MS_TENANT_ID}"
            f"/oauth2/v2.0/token"
        )

        data = {
            "client_id": settings.MS_CLIENT_ID,
            "client_secret": settings.MS_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.MS_REDIRECT_URI,
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)

        if response.status_code != 200:
            raise Exception(response.text)

        return response.json()