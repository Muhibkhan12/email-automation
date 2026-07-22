from pydantic import BaseModel


class AddRecipientsSchema(BaseModel):
    user_id : int
    upload_id : int

    name : str
    email : str
    company : str
    phone : str
    is_valid_email : bool


class UpdateRecipientsSchema(BaseModel):
    user_id : int | None = None
    upload_id : int | None = None
    name : str | None = None
    email : str | None = None
    company : str | None = None
    phone : str | None = None
    is_valid_email : bool | None = None

class RecipientsResponse(BaseModel):
    name : str
    email : str
    company : str
    phone : str | None
    

    class config:
        from_attributes = True