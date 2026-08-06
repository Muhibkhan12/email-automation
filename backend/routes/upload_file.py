from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends
)

from sqlalchemy.orm import Session

from database import get_db

from schema.upload_file import UploadFileSchema

from services.validate_file import (
    validate_file,
    save_file_to_storage
)

from services.upload_file import (
    add_upload_file
)

router = APIRouter(
    prefix="/campaigns",
    tags=["Uploads"]
)


@router.post("/{campaign_id}/upload")
def upload_campaign_file(
    campaign_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    # Validate file
    validate_file(file)

    # Save file physically
    file_data = save_file_to_storage(file)

    # Create schema
    upload = UploadFileSchema(
        campaign_id=campaign_id,
        original_filename=file_data["original_filename"],
        stored_filename=file_data["stored_filename"],
        file_path=file_data["file_path"],
        total_records=0,
        processed_records=0,
        status="UPLOADED"
    )

    # Save metadata to database
    upload = add_upload_file(
        db,
        upload
    )

    return {
        "message": "File uploaded successfully.",
        "data": upload
    }