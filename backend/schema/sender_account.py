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

class SenderAccountResponse(BaseModel):
    email : EmailStr	
    display_name : str	
    provider : str	
    status : str	
    created_at : str	
    updated_at : str	
    emails_sent_hour : str	

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