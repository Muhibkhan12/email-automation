import pandas as pd
import os
import uuid

from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from models.upload_file import UploadFile
from models.campaign_recipients import CampaignRecipient

UPLOAD_DIR = "/uploads"

def save_file(file : UploadFile):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    extension = file.filename.split(".")[-1].lower()

    if extension not in ["xlsx", "csv"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Excel and CSV files are allowed"
        )


    filename = f"{uuid.uuid4()}.{extension}"

    file_path = os.path.join(
        UPLOAD_DIR,
        filename,
    )

    with open(file_path, "w+b") as reader:
        reader.write(file.file.read())

    return{
        "original_filename" : file.filename,
        "stored_filename" : filename,
        "file_path" : file_path,
    }

def extract_data(file_path : str):
    extension = file_path.split(".")[-1]

    try:
        if extension == "xlsx":
            df = pd.read_excel(file_path)
        elif extension == "csv":
            df = pd.read_csv(file_path)
        else:
            raise Exception("Invalid Format")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot read file"
        )

    print(df) 

def process_upload(db : Session, campaign_id : id, file: UploadFile):
    pass