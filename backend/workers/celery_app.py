import os

from celery import Celery # type: ignore
from kombu import Queue # type: ignore

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery = Celery(
    "email-automation",
    broker=REDIS_URL,
    backend=os.getenv("CELERY_RESULT_BACKEND", REDIS_URL),
)

celery.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Karachi",
    enable_utc=True,
    task_queues=(
        Queue("extract_emails_queue"),
        Queue("email_sender_queue"),
        Queue("dead_letter_queue"),
    ),
    task_routes={
        "workers.extract_email.*": {"queue": "extract_emails_queue"},
        "workers.sending_emails.*": {"queue": "email_sender_queue"},
    },
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,
    broker_transport_options={"visibility_timeout": 3600},
)

celery.conf.imports = (
    "workers.extract_email",
    "workers.sending_emails",
)