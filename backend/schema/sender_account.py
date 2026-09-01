from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

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
    email: Optional[EmailStr] = None
    display_name: Optional[str] = None
    provider: Optional[str] = None

    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None

    daily_limit: Optional[int] = None
    hourly_limit: Optional[int] = None

    emails_sent_today: Optional[int] = None
    emails_sent_hour: Optional[int] = None

    status: Optional[str] = None