from workers.celery_app import celery

@celery.task()
def sending_emails():
    pass