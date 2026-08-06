from fastapi import APIRouter
from workers.extract_email import extract_emails


router = APIRouter(
    prefix="/worker",
    tags=["email_worker"]
)

@router.get("/")
def home():
    pass
