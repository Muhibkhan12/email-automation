from fastapi import APIRouter
from workers.extract_email import say_hello


router = APIRouter(
    prefix="/worker",
    tags=["email_worker"]
)

@router.get("/")
def home():
    say_hello.delay("Muhib")

    return {
        "Message" : "Task Send Successfully",
    }
