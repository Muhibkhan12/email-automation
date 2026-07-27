from workers.celery_app import celery

@task.celery()
def say_hello():
    print(f"Hello {name}")

    return{ f"message: {name}"}