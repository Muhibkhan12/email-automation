from fastapi import HTTPException, status
from sqlalchemy.orm import Session
# from datetime import datetime

from services.auth import create_access_token, create_refresh_token
from services.security import verify_passoword, hash_password
from schema.user import LoginSchema, RegisterSchema
from models.user import User



def RegisterUser(db: Session, credential : RegisterSchema):
    existing_user = db.query(User).filter(User.email == credential.email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            details="User Already exist"
        )
    
    user = User(
        name = credential.name,
        email = credential.email,
        password = hash_password(credential.password),
    )

    db.add(user)
    db.commit()
    db.refresh()
    return {
        "message" : "Registration Succesfull",
        "user" : user,
    }

def LoginUser(db: Session, credential : LoginSchema):
    pass