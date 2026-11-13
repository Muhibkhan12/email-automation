from urllib.parse import urlencode

import httpx

from config import settings  # adjust

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send"
SCOPES = f"openid email profile {GMAIL_SEND_SCOPE}"


class GoogleOAuthService:
    @staticmethod
    def generate_auth_url(state: str) -> str:
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": SCOPES,
            "access_type": "offline",   # needed to get a refresh token
            "prompt": "consent",        # always return a refresh token (also on reconnect)
            "state": state,
        }
        return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"

    @staticmethod
    async def exchange_code_for_token(code: str) -> dict:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )
        if resp.status_code != 200:
            raise Exception(resp.text)
        return resp.json()

    @staticmethod
    async def refresh_access_token(refresh_token: str) -> dict:
        """Returns {'access_token', 'expires_in', ...}. Google does not rotate the refresh token."""
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "refresh_token": refresh_token,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "grant_type": "refresh_token",
                },
            )
        if resp.status_code != 200:
            # body contains "invalid_grant" when revoked/expired -> worker maps it to AuthError
            raise Exception(resp.text)
        return resp.json()

    @staticmethod
    async def get_user_profile(access_token: str) -> dict:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code != 200:
            raise Exception(resp.text)
        return resp.json()