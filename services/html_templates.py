from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.html_templates import HTMLTemplate
from schema.html_templates import UpdateHtmlTemplateSchema

def get_all_templates(db : Session):
    data = db.query(HTMLTemplate).all()

    return{
        "message" : "Data Fetched Successfully",
        "count" : len(data),
        "data" : data
    }

def get_template_by_id(db : Session, id : int):
    data = db.query(HTMLTemplate).filter(HTMLTemplate.id == id).first()

    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Templates doesn't exist"
        )
    return data

def upload_html_template(db, credentials):
    template = HTMLTemplate(**credentials.model_dump())

    db.add(template)
    try:
        db.commit()
        db.refresh(template)
    except Exception:
        db.rollback()
        raise

def edit_html_template(db : Session, id : int, credentials : UpdateHtmlTemplateSchema):
    template = get_template_by_id(db,id)

    for key, val in credentials.model_dump(exclude_unset=True).items():
        setattr(template, key, val)

        try:
            db.commit()
            db.refresh(template)
        except Exception:
            db.rollback()
        raise


def delete_html_template(db, id):
    template = get_template_by_id(db,id)
    try:
        db.delete(template)
        db.commit()
    except Exception:
        db.rollback()
    raise