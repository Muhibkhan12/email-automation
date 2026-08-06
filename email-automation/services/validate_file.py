import os
import uuid
import pandas as pd
from fastapi import UploadFile, HTTPException, status

UPLOAD_DIR = "storage/uploads"

def validate_file(file: UploadFile):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is missing"
        )

    extension = file.filename.split(".")[-1].lower()

    if extension not in ["xlsx" , "csv"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV and XLSX files are allow"
        )

    
def save_file_to_storage(file: UploadFile):
    os.makedirs(
        UPLOAD_DIR,
        exist_ok=True
    )
    extension = file.filename.split(".")[-1].lower()

    stored_filename = f"{uuid.uuid4()}.{extension}"

    file_path = os.path.join(
        UPLOAD_DIR,
        stored_filename
    )
    with open(file_path, "wb") as reader:
        reader.write(file.file.read())

    return {
        "original_filename" : file.filename,
        "stored_filename" : stored_filename,
        "file_path"  : file_path 
    }