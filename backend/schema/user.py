from pydantic import BaseModel,EmailStr
from enum import Enum

class UserRole(str, Enum):
    ADMIN="ADMIN"
    EMPLOYEE="EMPLOYEE"

class RegisterSchema(BaseModel):
    username : str
    email : EmailStr
    password : str
    

class LoginSchema(BaseModel):
    email : EmailStr
    password : str

class ForgetSchema(BaseModel):
    email: EmailStr

class GetCurrentUserSchema(BaseModel):
    token : str

class UpdateUser(BaseModel):
    username : str | None = None
    email: EmailStr | None = None
    role : UserRole