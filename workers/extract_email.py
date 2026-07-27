from workers.celery_app import celery

@celery.task()
def say_hello(name):
    print(f"Hello {name}")

    return {
        "message": name
    }