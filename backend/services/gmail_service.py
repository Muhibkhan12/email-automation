import base64
from email.message import EmailMessage
from email.utils import formataddr

import httpx


class GmailSendError(Exception):
    """
    Carries status_code + headers so the worker's existing _as_rate_limit()
    (which looks for exc.status_code / Retry-After) works without changes.
    """

    def __init__(self, message: str, status_code: int | None = None, headers: dict | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.headers = headers or {}


class GmailService:
    SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"

    @staticmethod
    def build_raw_message(
        *,
        recipient: str,
        subject: str,
        body: str,
        content_type: str = "HTML",          # "HTML" or "Text" (same as GraphService)
        from_email: str | None = None,
        from_name: str | None = None,
        text_alternative: str | None = None,  # plain-text part for HTML mails
    ) -> str:
        msg = EmailMessage()
        msg["To"] = recipient
        msg["Subject"] = subject
        if from_email:
            msg["From"] = formataddr((from_name or "", from_email))

        if content_type.lower() == "html":
            msg.set_content(text_alternative or "Please view this email in an HTML-capable client.")
            msg.add_alternative(body, subtype="html")
        else:
            msg.set_content(body)

        return base64.urlsafe_b64encode(msg.as_bytes()).decode()

    @staticmethod
    async def send_email(
        access_token: str,
        recipient: str,
        subject: str,
        body: str,
        content_type: str = "HTML",
        from_email: str | None = None,
        from_name: str | None = None,
        text_alternative: str | None = None,
    ) -> dict:
        raw = GmailService.build_raw_message(
            recipient=recipient,
            subject=subject,
            body=body,
            content_type=content_type,
            from_email=from_email,
            from_name=from_name,
            text_alternative=text_alternative,
        )
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                GmailService.SEND_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                json={"raw": raw},
            )

        if resp.status_code != 200:
            raise GmailSendError(resp.text, resp.status_code, dict(resp.headers))

        return {"message": "Email Sent Successfully", "id": resp.json().get("id")}