from pydantic import BaseModel


class AddHTMLSchema(BaseModel):
    name : str
    subject : str
    html_content : str
    description : str
    is_active : bool

class UpdateHtmlTemplateSchema(BaseModel):
    name : int =   None | None
    subject : str = None | None
    html_contenct : str = None | None
    description : str = None | None

class DeleteHtmlTemplateSchema():
    id : int
