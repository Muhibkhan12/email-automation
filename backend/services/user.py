from fastapi import HTTPException, Depends
from sqlalchemy.orm import selectinload, Session

from services.otp import send_otp_email, store_otp, verify_stored_otp
from services.auth import create_access_token, create_refresh_token, oauth2_scheme, verify_access_token
from services.security import verify_password, hash_password
from database import get_db
from schema.user import LoginSchema, RegisterSchema, ForgetSchema, UpdateUser
from models.user import User


def RegisterUser(db: Session, credential: RegisterSchema):
    existing_user = db.query(User).filter(User.email == credential.email).first()

    if existing_user:
        if existing_user.is_verified:
            raise HTTPException(status_code=400, detail="User already exists")
        # Pending verification — naya OTP bhej do
        code = store_otp(existing_user.email)
        send_otp_email(existing_user.email, code, existing_user.username)
        return {"message": "Account pending. New code sent.", "user": existing_user}

    user = User(
        username=credential.username,
        email=credential.email,
        password=hash_password(credential.password),
        role="EMPLOYEE",
        is_verified=False,   # 👈 naya user unverified
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    code = store_otp(user.email)
    send_otp_email(user.email, code, user.username)

    return {"message": "Registration successful. Check your email for the code.", "user": user}


def LoginUser(db: Session, credential: LoginSchema):
    user = db.query(User).filter(User.email == credential.email).first()

    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(credential.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # 👇 verified nahi hai to login block
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before logging in.")

    access_token  = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return {
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer",
        "user": user,
    }


def SendOTP(db: Session, email: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    code = store_otp(email)
    send_otp_email(email, code, user.username)
    return {"message": "Code sent."}


def VerifyOTP(db: Session, email: str, otp: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        return {"message": "Already verified."}
    if not verify_stored_otp(email, otp):
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    user.is_verified = True
    db.commit()
    db.refresh(user)
    return {"message": "Verified. You can log in now."}

# ── baaki functions jo pehle se hain, waise hi rahenge ──

def GetCurrentUser(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = verify_access_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid Token")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User doesn't exist")
    return user


def ForgetPassword(db: Session, credential: ForgetSchema):
    pass


def getAllUsers(db: Session):
    return {"users": db.query(User).all()}


def getAllUserWithSenderAccounts(db: Session):
    userWithAcc = db.query(User).options(selectinload(User.sender_accounts)).all()
    return {"users": userWithAcc}


def getUserById(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=400, detail="User not Found")
    return user


def userByIdWithSenAcc(db: Session, user_id: int):
    user = db.query(User).options(selectinload(User.sender_accounts)).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=400, detail="User not Found")
    return user


def updateUser(db: Session, user_id: int, credentials: UpdateUser):
    user = getUserById(db, user_id)
    if credentials.username is not None:
        user.username = credentials.username
    if credentials.email is not None:
        user.email = credentials.email
    db.commit()
    db.refresh(user)
    return {"user": user, "message": "User Updated Successfully"}


def deleteUser(db: Session, user_id: int):
    user = getUserById(db, user_id)
    db.delete(user)
    db.commit()
    return {"message": "User deleted Successfully"}


def require_admin(current_user: User = Depends(GetCurrentUser)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=401, detail="Admin Access required")
    return current_user

def ChangePassword(db, user, current_password: str, new_password: str):
    if not verify_password(current_password, user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if verify_password(new_password, user.password):
        raise HTTPException(status_code=400, detail="New password must be different")

    user.password = hash_password(new_password)
    db.commit()
    return {"message": "Password changed"}