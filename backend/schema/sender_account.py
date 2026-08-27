from pydantic import BaseModel, EmailStr

class addSenderAccountSchema(BaseModel):
    email : EmailStr
    display_name : str
    provider : str
    access_token : str
    refresh_token : str
    token_expires_at : str
    daily_limit : int
    hourly_limit : int
    emails_sent_today : int
    status : str
    created_at : str
    updated_at : str
    emails_sent_hour : int
    
class SenderAccountResponse(BaseModel):
    email : EmailStr	
    display_name : str	
    provider : str	
    status : str	
    created_at : str	
    updated_at : str	
    emails_sent_hour : str	

    model_config = {
        "form_attributes" : True
    }

class updateSenderAccout(BaseModel):
    email : EmailStr
    display_name : str
    username : str
    provider : str
    daily_limit : int
    hourly_limit : int