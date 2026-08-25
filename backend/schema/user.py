from pydantic import BaseModel,EmailStr

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
    email : str | None = None