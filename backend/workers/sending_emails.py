from datetime import datetime, UTC, timedelta

from sqlalchemy.orm import Session

from backend.models.campaigns import Campaign, CampaignStatus
from backend.models.campaign_recipients import CampaignRecipient, RecipientStatus
from backend.models.sender_account import SenderAccount
from backend.models.html_templates import HTMLTemplate
from backend.models.email_logs import EmailLog, EmailLogStatus

from backend.database import SessionLocal
from backend.workers.celery_app import celery

from backend.services.oauth_service import OAuthService
from backend.services.graph_service import GraphService


@celery.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 5},
)
def send_email_task(
    self,
    recipient_id: int,
    sender_account_id: int,
    campaign_id: int,
):

    db: Session = SessionLocal()

    try:

        ####################################################
        # Load Database Objects
        ####################################################

        recipient = (
            db.query(CampaignRecipient)
            .filter(CampaignRecipient.id == recipient_id)
            .first()
        )

        sender = (
            db.query(SenderAccount)
            .filter(SenderAccount.id == sender_account_id)
            .first()
        )

        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == campaign_id)
            .first()
        )

        template = (
            db.query(HTMLTemplate)
            .filter(HTMLTemplate.id == campaign.template_id)
            .first()
        )

        if recipient is None:
            raise Exception("Recipient not found")

        if sender is None:
            raise Exception("Sender not found")

        if campaign is None:
            raise Exception("Campaign not found")

        ####################################################
        # Refresh Token
        ####################################################

        if sender.token_expires_at <= datetime.now(UTC):

            token = OAuthService.refresh_access_token(
                sender.refresh_token
            )

            sender.access_token = token["access_token"]

            sender.refresh_token = token.get(
                "refresh_token",
                sender.refresh_token
            )

            sender.token_expires_at = (
                datetime.now(UTC)
                + timedelta(seconds=token["expires_in"])
            )

            db.commit()

        ####################################################
        # Render Template
        ####################################################

        html = template.html_content

        html = html.replace(
            "{{name}}",
            recipient.name
        )

        html = html.replace(
            "{{email}}",
            recipient.email
        )

        ####################################################
        # Send Email
        ####################################################

        import asyncio

        asyncio.run(

            GraphService.send_email(

                access_token=sender.access_token,

                recipient=recipient.email,

                subject=campaign.subject,

                html_body=html

            )

        )

        ####################################################
        # Recipient Status
        ####################################################

        recipient.status = RecipientStatus.SENT

        recipient.sent_at = datetime.now(UTC)

        ####################################################
        # Email Log
        ####################################################

        log = EmailLog(

            campaign_id=campaign.id,

            sender_account_id=sender.id,

            recipient_email=recipient.email,

            subject=campaign.subject,

            status=EmailLogStatus.SENT,

            sent_at=datetime.now(UTC),

        )

        db.add(log)

        ####################################################
        # Campaign Progress
        ####################################################

        campaign.sent_count += 1

        db.commit()

        return {
            "message": "Email Sent Successfully"
        }

    except Exception as e:

        db.rollback()

        ####################################################
        # Recipient Failed
        ####################################################

        if recipient:

            recipient.status = RecipientStatus.FAILED

        ####################################################
        # Email Log
        ####################################################

        log = EmailLog(

            campaign_id=campaign_id,

            sender_account_id=sender_account_id,

            recipient_email=recipient.email if recipient else "",

            subject=campaign.subject if campaign else "",

            status=EmailLogStatus.FAILED,

            error_message=str(e),

        )

        db.add(log)

        db.commit()

        raise

    finally:

        db.close()