from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from schema.upload_file import UploadedFileUpdateSchema, UploadFileSchema
from models.upload_file import UploadFile

router = APIRouter(
    prefix="/uploaded_file",
    tags=["upload_files"]
)

def findData(id:int, db : Session):
    data = db.query(UploadFile).filter(UploadFile.id == id).first()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data doesn't exist"
        )
    return data



def add_uploaded_file():
