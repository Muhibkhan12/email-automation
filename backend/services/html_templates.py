from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.html_templates import HTMLTemplate
from schema.html_templates import AddHTMLSchema, UpdateHtmlTemplateSchema


# ---------------------------------------------------------------------------
# READ
# ---------------------------------------------------------------------------

def get_all_templates(db: Session):
    data = db.query(HTMLTemplate).all()

    return {
        "message": "Data Fetched Successfully",
        "count": len(data),
        "data": data,
    }


def get_template_by_id(db: Session, id: int):
    data = (
        db.query(HTMLTemplate)
        .filter(HTMLTemplate.id == id)
        .first()
    )

    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template doesn't exist",
        )

    return data


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------

def upload_html_template(
    db: Session,
    credentials: AddHTMLSchema,
    user_id: int,
):
    template = HTMLTemplate(
        **credentials.model_dump(),
        user_id=user_id,   # <-- ownership set from authenticated user
    )

    db.add(template)

    try:
        db.commit()
        db.refresh(template)
    except Exception:
        db.rollback()
        raise

    return {
        "message": "Template Uploaded Successfully",
        "template": template,
    }


# ---------------------------------------------------------------------------
# UPDATE
# ---------------------------------------------------------------------------

def edit_html_template(
    db: Session,
    id: int,
    credentials: UpdateHtmlTemplateSchema,
    user_id: Optional[int] = None,
):
    template = get_template_by_id(db, id)

    for key, val in credentials.model_dump(exclude_unset=True).items():
        setattr(template, key, val)

    # Optional audit field — only if your model has `updated_by`.
    # If your model does NOT define `updated_by`, remove this block.
    if user_id is not None and hasattr(template, "updated_by"):
        setattr(template, "updated_by", user_id)

    try:
        db.commit()
        db.refresh(template)
    except Exception:
        db.rollback()
        raise

    return {
        "message": "Template Updated Successfully",
        "template": template,
    }


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------

def delete_html_template(
    db: Session,
    id: int,
    user_id: Optional[int] = None,
):
    template = get_template_by_id(db, id)

    try:
        db.delete(template)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "message": "Template Deleted Successfully",
    }