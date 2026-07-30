from workers.celery_app import celery
from database import SessionLocal
from models.campaign_recipients import CampaignRecipient
from models.campaigns import Campaign, CampaignStatus
from models.html_templates import HTMLTemplate

# recipient_id receive
#         │
#         ▼
# Get recipient
#         │
#         ▼
# Get campaign
#         │
#         ▼
# Get template
#         │
#         ▼
# Get sender account
#         │
#         ▼
# Render HTML
#         │
#         ▼
# Send Email (SMTP)
#         │
#         ▼
# Save EmailLog
#         │
#         ▼
# recipient.status = SENT / FAILED

@celery.task(queue="email_sender_queue")
def sending_emails(recipient_id : int):
    db = SessionLocal()
    recipient = db.query(CampaignRecipient).filter(recipient_id == CampaignRecipient.id).first()

    campaign = recipient.campaign
    html_template =  campaign.template
    sender_account = campaign.sender_account