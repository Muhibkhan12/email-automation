from celery import Celery # type: ignore
from kombu import Queue # type: ignore\
from models.user import User 


celery = Celery(
    "email-automation",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
)

celery.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Karachi",
    enable_utc=True,
)

celery.conf.task_queue = (
    Queue("extract_emails_queue"),
    Queue("email_sender_queue"),
    Queue("dead_letter_queue"),
)

celery.conf.imports = (
    "workers.extract_email",
    "workers.sending_emails",
)