from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends,
    HTTPException,
    status
)
from sqlalchemy.orm import Session
from database import get_db
from schema.upload_file import UploadFileSchema, UploadedFileUpdateSchema, DeleteFileSchema
from models.upload_file import Upload
from models.user import User
from services.validate_file import (
    validate_file,
    save_file_to_storage
)
from database import get_db
from services.upload_file import (
    add_upload_file
)

router= APIRouter(
    prefix="/uploads",
    tag=['uploads']
)

@router.get("/all")
def get_all_uploads_file(db: Session = Depends(get_db)):
    data = db.query(Upload).all()
    if (data != True):
        return HTTPException(
            status= status.HTTP_404_NOT_FOUND,
            detail="Data doesn't exist",
        )
    else:
        return{
            "message" : "Data Fetch Successfully",
            "data" : data,
        }

@router.get("/{id}")
def get_uploads_file_by_id(user_id : int, db: Session = Depends(get_db)):

    data = db.query(Upload).filter(User.id == user_id).all()
    if data:
        return HTTPException(
            status = status.HTTP_404_NOT_FOUND,
            detail = "No upload file exists"
        )
    else:
        return{
            "message" : "Data found successfully",
            "data" : data,
        }

@router.patch("/{id}")
def update_uploaded_file(id: int, credentials : UploadedFileUpdateSchema, db : Session = Depends(get_db)):
    uploads_file = db.query(Upload).filter(Upload.id == id).all()

    for key, val in credentials.model_dump(exclude_unset = True).items():
        setattr(uploads_file, key, val)

    try:
        db.commit()
        db.refresh(uploads_file)

    except Exception:
        db.rollback()
        raise

    return {
        "message" : "Uploaded file updated successfully",
        "data" : uploads_file  
    }

@router.delete("/{id}")
def delete_uploaded_file(id : int, credentials : DeleteFileSchema, db : Session = Depends(get_db)):
    data = db.query(Upload).filter(Upload.id == id).all()
    try:
        db.delete(data)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return{
        "message" : "File deleted successfully"
    }
