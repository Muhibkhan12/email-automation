"""One place that knows which provider a SenderAccount uses."""
from models.sender_account import Provider, SenderAccount
from services.gmail_service import GmailService
from services.google_oauth_service import GoogleOAuthService
from services.graph_service import GraphService
from services.oauth_service import OAuthService


async def refresh_access_token(provider: Provider, refresh_token: str) -> dict:
    if provider == Provider.GMAIL:
        return await GoogleOAuthService.refresh_access_token(refresh_token)
    return await OAuthService.refresh_access_token(refresh_token)


async def send_email(
    sender: SenderAccount,
    *,
    access_token: str,
    recipient: str,
    subject: str,
    body: str,
    content_type: str,                    # "HTML" | "Text"
    text_alternative: str | None = None,
) -> dict:
    if sender.provider == Provider.GMAIL:
        return await GmailService.send_email(
            access_token=access_token,
            recipient=recipient,
            subject=subject,
            body=body,
            content_type=content_type,
            from_email=sender.email,
            from_name=sender.display_name,
            text_alternative=text_alternative,
        )
    return await GraphService.send_email(
        access_token=access_token,
        recipient=recipient,
        subject=subject,
        html_body=body,
        content_type=content_type,
    )