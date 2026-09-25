from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from schema.user import (RegisterSchema, LoginSchema, ForgetSchema, UpdateUser)
from database import get_db
from models.user import User
from services.auth import oauth2_scheme, refresh_access_token
from services.user import (userByIdWithSenAcc,getAllUserWithSenderAccounts,LoginUser, RegisterUser, ForgetPassword, GetCurrentUser, updateUser, deleteUser, getUserById, getAllUsers)

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
    response : Response,
    db: Session = Depends(get_db)
):
    result = LoginUser(
        db=db,
        credential=credentials
    )

    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        httponly=True,
        secure=False,       # localhost pe HTTP hai, isliye False. Production me True karna (HTTPS required)
        samesite="lax",     # agar frontend/backend alag port pe hain but same domain (localhost) hai to "lax" chalega
        max_age= 7 * 7 * 30 * 30, # 7 days, refresh token expiry se match karo
        path="/auth/refresh",  # sirf refresh endpoint ko cookie milega
    )
    return result

@router.post("/refresh")
def refresh_token_endpoint(request: Request):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    new_access_token = refresh_access_token(token)
    return {"access_token": new_access_token}

@router.post("/forget_password")
def forgetPassword(credentials: ForgetSchema, db: Session  = Depends(get_db)):
    return ForgetPassword(db, credentials)

@router.get("/profile")
def profile(current_user : User = Depends(GetCurrentUser)):
    return{
        "user_id" : current_user.id,
        "username" : current_user.username,
        "email" : current_user.email,
        "role" : current_user.role,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at,
    }

@router.put("/users/{user_id}")
def update_user(user_id: int, credentials: UpdateUser, db: Session = Depends(get_db)):
    return updateUser(db, user_id, credentials)

@router.post("/user/delete/{id}")
def delete_user(user_id : int ,db : Session = Depends(get_db)):
    return deleteUser(db, user_id)

@router.get("/users")
def get_all_users(db:Session = Depends(get_db)):
    return getAllUsers(db)

@router.get("/user/{id}")
def get_user_by_id(user_id : int , db : Session = Depends(get_db)):
    return getUserById(db,user_id)

@router.get("/users/sender-account")
def get_send_acc_with_users( db : Session = Depends(get_db)):
    return getAllUserWithSenderAccounts(db)

@router.get("/user/sender-account/{id}")
def get_send_acc_with_user_id(user_id : int, db : Session = Depends(get_db)):
    return userByIdWithSenAcc(db, user_id)

@router.delete("/users/{user_id}")
def delete_user(user_id : int, db : Session = Depends(get_db) ):
    return deleteUser(db, user_id)