from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from schema.user import (RegisterSchema, LoginSchema)
from database import get_db
from services.user import (LoginUser, RegisterUser)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register", status_code=201)
def registerUser(credentials : RegisterSchema , db: Session = Depends(get_db)):
    return RegisterUser(db=db,credential=credentials)

@router.post("/login")
def login(
    credentials: LoginSchema,
    db: Session = Depends(get_db)
):
    return LoginUser(
        db=db,
        credential=credentials
    )