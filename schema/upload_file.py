from pydantic import BaseModel, EmailStr
from datetime import datetime
from enum import Enum


class UploadStatus(str, Enum):
    UPLOADED : "UPLOADED"
    PROCESSING : "PROCESSING"
    COMPLETED : "COMPLETED"
    FAILED : "FAILED"

class UploadFileSchema(BaseModel):
    user_id: int
    original_filename: str
    stored_filename: str
    file_path: str
    total_records: int = 0
    processed_records: int = 0
    status : UploadStatus = UploadStatus.UPLOADED

class UploadedFileUpdateSchema(BaseModel):
    user_id: int | None = None
    original_filename: str | None = None
    stored_filename: str | None = None
    file_path: str | None = None
    total_records: int  | None = None
    processed_records: int | None = None
    status : UploadStatus.UPLOADED = None | None

class DeleteFileSchema(BaseModel):
    id : int