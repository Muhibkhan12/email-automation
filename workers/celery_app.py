from celery import Celery

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

celery.conf.imports = (
    "workers.extract_email",
)