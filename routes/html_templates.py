from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from schema.html_templates import (AddHTMLSchema, UpdateHtmlTemplateSchema, DeleteHtmlTemplateSchema)
from services.html_templates import (upload_html_template, delete_html_template, edit_html_template)
from database import get_db

router = APIRouter(
    prefix="html_templates",
    tags=["html_templates"]
)

@router.post("/add")
def add_html_template(credentials : AddHTMLSchema ,db : Session = Depends(get_db)):
    return upload_html_template(db,credentials)

@router.patch("/update/{id}")
def update_html_template(id : int,credentials : UpdateHtmlTemplateSchema, db : Session = Depends(get_db)):
    return edit_html_template(db,id,credentials)

@router.delete("/delete/{id}")
def delete_html_template(id : int, db:Session = Depends(get_db)):
    return delete_html_template(id)