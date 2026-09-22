from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from database import get_db

from schema.upload_file import (
    UploadFileSchema,
    UploadedFileUpdateSchema,
    DeleteFileSchema,
)

from models.upload_file import Upload

from services.validate_file import (
    validate_file,
    save_file_to_storage,
)

from services.upload_file import add_upload_file

campaign_upload_router = APIRouter(
    prefix="/campaigns",
    tags=["Uploads"],
)

upload_file_crud = APIRouter(
    prefix="/uploads",
    tags=["Uploads"],
)

@campaign_upload_router.post("/{campaign_id}/upload")
def upload_campaign_file(
    campaign_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Validate uploaded file
    validate_file(file)

    # Save file physically
    file_data = save_file_to_storage(file)
    print("FILE SIZE", file_data),

    # Create upload schema
    upload = UploadFileSchema(
        campaign_id=campaign_id,
        original_filename=file_data["original_filename"],
        stored_filename=file_data["stored_filename"],
        file_path=file_data["file_path"],
        file_size=file_data["file_size"],

        mime_type=file_data.get(
            "mime_type",
            file.content_type,
        ),
        total_records=0,
        processed_records=0,
        status="UPLOADED",
    )

    # Save upload metadata to database
    upload = add_upload_file(
        db,
        upload,
    )

    return {
        "message": "File uploaded successfully.",
        "data": upload,
    }

@upload_file_crud.get("/all")
def get_all_uploads_file(
    db: Session = Depends(get_db),
):
    data = db.query(Upload).all()

    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data doesn't exist",
        )

    return {
        "message": "Data fetched successfully",
        "data": data,
    }

@upload_file_crud.get("/{id}")
def get_uploads_file_by_id(
    id: int,
    db: Session = Depends(get_db),
):
    data = (
        db.query(Upload)
        .filter(Upload.id == id)
        .first()
    )

    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No upload file exists",
        )

    return {
        "message": "Data found successfully",
        "data": data,
    }

@upload_file_crud.patch("/{id}")
def update_uploaded_file(
    id: int,
    credentials: UploadedFileUpdateSchema,
    db: Session = Depends(get_db),
):
    uploads_file = (
        db.query(Upload)
        .filter(Upload.id == id)
        .first()
    )

    if not uploads_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload file not found",
        )

    # Update only fields provided by the client
    for key, val in credentials.model_dump(
        exclude_unset=True
    ).items():
        setattr(uploads_file, key, val)

    try:
        db.commit()
        db.refresh(uploads_file)

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Uploaded file updated successfully",
        "data": uploads_file,
    }

@upload_file_crud.delete("/{id}")
def delete_uploaded_file(
    id: int,
    credentials: DeleteFileSchema,
    db: Session = Depends(get_db),
):
    data = (
        db.query(Upload)
        .filter(Upload.id == id)
        .first()
    )

    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload file not found",
        )

    try:
        db.delete(data)
        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "message": "File deleted successfully",
    }