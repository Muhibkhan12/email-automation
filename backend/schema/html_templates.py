from pydantic import BaseModel
from typing import Optional

class AddHTMLSchema(BaseModel):
    name : str
    html_content : str
    description : str
    is_active : bool

class UpdateHtmlTemplateSchema(BaseModel):
    name : Optional[str] =  None
    html_contenct : Optional[str] = None
    description : Optional[str] = None
    is_active : Optional[bool] = None

class DeleteHtmlTemplateSchema():
    id : int
