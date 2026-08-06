from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.schema.user import (RegisterSchema, LoginSchema, ForgetSchema, GetCurrentUserSchema)
from backend.database import get_db
from backend.models.user import User
from backend.services.auth import oauth2_scheme
from backend.services.user import (LoginUser, RegisterUser, ForgetPassword, GetCurrentUser)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.get("/")
def welcome():
    return{
        "message" : "Hola Amigo"
    }

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

@router.post("/forget_password")
def forgetPassword(credentials: ForgetSchema, db: Session  = Depends(get_db)):
    return ForgetPassword(db, credentials)

@router.get("/profile")
def profile(current_user : User = Depends(GetCurrentUser)):
    return{
        "user_id" : current_user.id,
        "user_name" : current_user.username,
        "user_email" : current_user.email,
    }
