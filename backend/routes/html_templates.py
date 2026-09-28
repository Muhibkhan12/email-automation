from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schema.html_templates import (
    AddHTMLSchema,
    UpdateHtmlTemplateSchema,
)

from services.html_templates import (
    get_all_templates,
    get_template_by_id,
    upload_html_template,
    edit_html_template,
    delete_html_template,
)

from services.user import GetCurrentUser, require_admin

router = APIRouter(
    prefix="/html-templates",
    tags=["HTML Templates"],
)


# ADMIN + EMPLOYEE
@router.get(
    "/",
    dependencies=[Depends(GetCurrentUser)],
)
def get_templates(
    db: Session = Depends(get_db),
):
    return get_all_templates(db)


# ADMIN + EMPLOYEE
@router.get(
    "/{id}",
    dependencies=[Depends(GetCurrentUser)],
)
def get_template(
    id: int,
    db: Session = Depends(get_db),
):
    return get_template_by_id(db, id)


# ADMIN ONLY
@router.post("/")
def create_template(
    credentials: AddHTMLSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return upload_html_template(db, credentials, user_id=current_user.id)


# ADMIN ONLY
@router.put("/{id}")
def update_template(
    id: int,
    credentials: UpdateHtmlTemplateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return edit_html_template(db, id, credentials, user_id=current_user.id)


# ADMIN ONLY
@router.delete("/{id}")
def remove_template(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return delete_html_template(db, id, user_id=current_user.id)