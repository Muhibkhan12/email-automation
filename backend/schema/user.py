from pydantic import BaseModel,EmailStr
from schema.sender_account import SenderAccountResponse
from enum import Enum

class UserRole(str, Enum):
    ADMIN="ADMIN"
    EMPLOYEE="EMPLOYEE"

class RegisterSchema(BaseModel):
    username : str
    email : EmailStr
    password : str

class UserWithSenderAccountsResponse(BaseModel):
    username : str
    email : str
    role : str
    sender_accounts : list[SenderAccountResponse]

    model_config = {  
        "from_attribute" : True
    }
    

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