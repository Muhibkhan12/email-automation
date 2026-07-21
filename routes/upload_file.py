from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schema.upload_file import UploadedFileUpdateSchema, UploadFileSchema
from models.upload_file import UploadFile
from services.upload_file import add_upload_file, update_upload_file, delete_upload_file

router = APIRouter(
    prefix="/uploaded_file",
    tags=["upload_files"]
)

@router.post("/add")
def add_uploadFile(credentials : UploadFileSchema, db : Session = Depends(get_db)):
    return add_upload_file(db, credentials)

@router.patch("/update/{id}")
def update_UploadedFile(id : int,credentials : UploadedFileUpdateSchema, db : Session = Depends(get_db)):
    return update_upload_file( db,id, credentials)

@router.delete("/delete/{id}")
def delete_UploadedFile(id : int, db : Session = Depends(get_db)):
    return delete_upload_file(db, id)