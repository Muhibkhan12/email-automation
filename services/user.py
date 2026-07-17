from fastapi import HTTPException, status
from sqlalchemy.orm import Session
# from datetime import datetime

from services.auth import create_access_token, create_refresh_token
from services.security import verify_password, hash_password
from schema.user import LoginSchema, RegisterSchema
from models.user import User



def RegisterUser(db: Session, credential : RegisterSchema):
    print(type(credential.password))
    print(credential.password)
    print(len(credential.password))
    existing_user = db.query(User).filter(User.email == credential.email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User Already exist"
        )
    
    user = User(
        username = credential.username,
        email = credential.email,
        password = hash_password(credential.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "message" : "Registration Succesfull",
        "user" : user,
    }

def LoginUser(db: Session, credential : LoginSchema):
    user = (db.query(User).filter(User.email == credential.email).first())

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_BAD_REQUEST,
            detail="Invalid username or password"
        )
    
    if not verify_password(credential.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Email or password"
        )
    
    access_token = create_access_token(
        {
            "sub": str(user.id)
        }
    )

    refresh_token = create_refresh_token(
        {
            "sub": str(user.id)
        }
    )

    return{
        "message": "Login Successfull",
        "access_token" : access_token,
        "refresh_token" : refresh_token,
        "token_type" : "Bearer",
    }