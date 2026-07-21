
from fastapi import HTTPException, status
from models.upload_file import UploadFile
from sqlalchemy import Session


def findData(id:int, db : Session):
    data = db.query(UploadFile).filter(UploadFile.id == id).first()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data doesn't exist"
        )
    return data



def add_upload_file(db : Session, credentials):
    data = UploadFile(**credentials.model_dump())

    db.add(data)
    db.commit()
    db.refresh(data)

    return{
        "message" : "File Uploaded successfully",
        "data": data
    }

def update_uploaded_file(db  : Session, credentials):
    data = findData()

    if not data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=""
        )