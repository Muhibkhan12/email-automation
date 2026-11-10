import os
import random
import requests
import msal
import logging
from datetime import datetime, timedelta
from config import settings

logger = logging.getLogger(__name__)

OTP_TTL_MINUTES = 10
_OTP_STORE: dict[str, tuple[str, datetime]] = {}

CLIENT_ID     = settings.OTP_CLIENT_ID
TENANT_ID     = settings.OTP_TENANT_ID
SENDER_EMAIL  = settings.OTP_SENDER_EMAIL

# Device Code Flow ke liye authority 'consumers' honi chahiye
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
SCOPES    = ["Mail.Send"]
CACHE_FILE = "token_cache.bin"


def _get_access_token() -> str:
    """Token retrieve karta hai. Pehli baar Device Code flow trigger karega."""
    cache = msal.SerializableTokenCache()
    
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r") as f:
                cache.deserialize(f.read())
        except Exception as e:
            logger.warning(f"Failed to load token cache: {e}")

    app = msal.PublicClientApplication(
        CLIENT_ID, authority=AUTHORITY, token_cache=cache
    )
    
    accounts = app.get_accounts()
    result = None
    
    # Agar pehle se token cache mein hai
    if accounts:
        result = app.acquire_token_silent(SCOPES, account=accounts[0])

    # Agar cache mein nahi hai, toh Device Code flow start karo
    if not result:
        flow = app.initiate_device_flow(scopes=SCOPES)
        if "user_code" not in flow:
            raise ValueError(f"Failed to create device flow: {flow.get('error_description')}")
        
        print("\n" + "="*60)
        print("AUTHENTICATION REQUIRED")
        print(flow['message'])
        print("="*60 + "\n")
        
        result = app.acquire_token_by_device_flow(flow)

    if "access_token" in result:
        if cache.has_state_changed:
            with open(CACHE_FILE, "w") as f:
                f.write(cache.serialize())
        return result["access_token"]
        
    raise Exception(f"Token acquisition failed: {result.get('error_description')}")


def send_otp_email(to_email: str, code: str, username: str = "") -> None:
    """Send OTP via Microsoft Graph using the authenticated user."""
    if not CLIENT_ID or not SENDER_EMAIL:
        logger.warning(f"OTP config missing. [DEV] OTP for {to_email}: {code}")
        return

    token = _get_access_token()
    
    # Device flow mein /me/sendMail use hota hai kyunki user login hai
    url = "https://graph.microsoft.com/v1.0/me/sendMail"
    
    body = {
        "message": {
            "subject": f"Your verification code: {code}",
            "body": {
                "contentType": "HTML",
                "content": f"""
                <div style="font-family:Inter,Arial,sans-serif;background:#0B0C0E;padding:32px;color:#E8EAED;">
                  <div style="max-width:480px;margin:auto;background:#111214;border:1px solid #24282E;border-radius:12px;padding:28px;">
                    <h2 style="margin:0 0 12px;color:#E8EAED;">Verify your email</h2>
                    <p style="color:#9AA0A6;font-size:14px;line-height:1.5;">
                      Hi {username or 'there'}, use the code below to finish creating your account.
                    </p>
                    <div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;
                                padding:16px 0;margin:16px 0;background:#16181B;border-radius:8px;color:#6EE7A8;">
                      {code}
                    </div>
                    <p style="color:#6B7075;font-size:12px;">
                      This code expires in {OTP_TTL_MINUTES} minutes.
                    </p>
                  </div>
                </div>
                """
            },
            "toRecipients": [{"emailAddress": {"address": to_email}}]
        }
    }
    
    r = requests.post(
        url,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=body,
        timeout=15,
    )
    
    if r.status_code >= 400:
        raise Exception(f"Graph send failed: {r.status_code} {r.text}")
        
    logger.info(f"OTP email successfully sent to {to_email}")


def store_otp(email: str) -> str:
    code = f"{random.randint(0, 999999):06d}"
    _OTP_STORE[email.lower()] = (code, datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES))
    return code


def verify_stored_otp(email: str, otp: str) -> bool:
    e = _OTP_STORE.get(email.lower())
    if not e:
        return False
    code, exp = e
    if datetime.utcnow() > exp:
        _OTP_STORE.pop(email.lower(), None)
        return False
    if code != otp.strip():
        return False
    _OTP_STORE.pop(email.lower(), None)
    return True