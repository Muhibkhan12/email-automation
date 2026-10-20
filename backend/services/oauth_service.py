import httpx
from urllib.parse import urlencode
from config import settings

SCOPE = "offline_access Mail.Send User.Read"


def _token_url() -> str:
    return (
        f"https://login.microsoftonline.com/"
        f"{settings.MS_TENANT_ID}"
        f"/oauth2/v2.0/token"
    )


class OAuthService:
    @staticmethod
    def generate_auth_url(state: str = "123456") -> str:
        params = {
            "client_id": settings.MS_CLIENT_ID,
            "response_type": "code",
            "redirect_uri": settings.MS_REDIRECT_URI,
            "scope": SCOPE,
            "response_mode": "query",
            "prompt": "select_account",
            "state": state,
        }
        return (
            f"https://login.microsoftonline.com/"
            f"{settings.MS_TENANT_ID}"
            f"/oauth2/v2.0/authorize?"
            f"{urlencode(params)}"
        )

    @staticmethod
    async def exchange_code_for_token(code: str) -> dict:
        data = {
            "client_id": settings.MS_CLIENT_ID,
            "client_secret": settings.MS_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.MS_REDIRECT_URI,
            "grant_type": "authorization_code",
            "scope": SCOPE,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(_token_url(), data=data)

        if response.status_code != 200:
            raise Exception(
                f"Token exchange failed: {response.status_code} {response.text[:300]}"
            )
        return response.json()

    @staticmethod
    async def get_user_profile(access_token: str) -> dict:
        url = "https://graph.microsoft.com/v1.0/me"
        headers = {"Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(url, headers=headers)

        if response.status_code != 200:
            raise Exception(
                f"Profile fetch failed: {response.status_code} {response.text[:300]}"
            )
        return response.json()

    @staticmethod
    async def refresh_access_token(refresh_token: str) -> dict:
        data = {
            "client_id": settings.MS_CLIENT_ID,
            "client_secret": settings.MS_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
            "redirect_uri": settings.MS_REDIRECT_URI,
            "scope": SCOPE,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(_token_url(), data=data)

        if response.status_code != 200:
            raise Exception(
                f"Token refresh failed: {response.status_code} {response.text[:300]}"
            )
        return response.json()