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

    async def outlook_callback():
        code : str

