from pydantic import BaseModel, EmailStr


class addSenderAccountSchema(BaseModel):
    user_id: int
    email : EmailStr
    password : str
    display_name : str
    username : str
    smtp_host : str
    smtp_port : int
    provider : str
    daily_limit : int
    hourly_limit : int

class updateSenderAccout(BaseModel):
    email : EmailStr
    password : str
    display_name : str
    username : str
    smtp_host : str
    smtp_port : int
    provider : str
    daily_limit : int
    hourly_limit : int