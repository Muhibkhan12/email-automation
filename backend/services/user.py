from fastapi import HTTPException, status, Depends
import asyncio

from sqlalchemy.orm import Session
# from datetime import datetime

from services.auth import create_access_token, create_refresh_token, oauth2_scheme, verify_access_token
from services.security import verify_password, hash_password
from database import get_db
from schema.user import (LoginSchema, RegisterSchema, ForgetSchema, UpdateUser)
from models.user import User

def RegisterUser(db: Session, credential : RegisterSchema):
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
        role = "EMPLOYEE",
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
            status_code=status.HTTP_401_UNAUTHORIZED,
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
        "user" : user
    }

def GetCurrentUser(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db) ):
    payload = verify_access_token(token)

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Token",
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User doesn't exist"
        )
    return user    

def ForgetPassword(db: Session, credetntial : ForgetSchema):
    pass

def getAllUsers(db : Session):
    users = db.query(User).all()
    return{
        "users" : users
    }

def getAllUserWithSenderAccounts(db: Session):
    userWithAcc =   db.query(User).selectinload(User.sender_accounts).all() 
    return {
        "users" : userWithAcc
    }

def getUserById(db : Session, user_id : int):
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not Found"
        )
    return user

def userByIdWithSenAcc(db : Session, user_id : int):
    user = db.query(User).options(selectinload(User.sender_accounts)).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not Found"
        )
    return user

def updateUser(db : Session, user_id : int, credentials : UpdateUser):
    user = getUserById(db, user_id)
    if credentials.username is not None:
        user.username = credentials.username

    if credentials.email is not None:
        user.email = credentials.email

    db.commit()
    db.refresh(user)

    return {
        "user": user,
        "message" : "User Updated Successfully"
    }

def deleteUser(db:Session, user_id : int):
    user = getUserById(db, user_id)

    db.delete(user)
    db.commit()

    return {
        "message" : "User deleted Successfully"
    }