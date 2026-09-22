from pydantic import BaseModel, EmailStr
from datetime import datetime
from enum import Enum


class UploadStatus(str, Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class UploadFileSchema(BaseModel):
    campaign_id: int
    original_filename: str
    stored_filename: str
    file_path: str
    total_records: int = 0
    processed_records: int = 0
    status : UploadStatus = UploadStatus.UPLOADED

class UploadedFileUpdateSchema(BaseModel):
    original_filename: str | None = None

class DeleteFileSchema(BaseModel):
    id : int