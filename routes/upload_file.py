from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schema.upload_file import UploadedFileUpdateSchema, UploadFileSchema
from models.upload_file import UploadFile
from services.upload_file import add_upload_file, update_uploaded_file

router = APIRouter(
    prefix="/uploaded_file",
    tags=["upload_files"]
)

@router.post("/add")
def add_uploadFile(credentials : UploadFileSchema, db : Session = Depends(get_db)):
    return add_upload_file(db, credentials)

@router.post("/update")
def update_UploadedFile(credentials : UploadFileSchema, db : Session = Depends(get_db)):
    return update_uploaded_file(db, credentials)