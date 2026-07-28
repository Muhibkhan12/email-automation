from fastapi import APIRouter, UploadFile, File

from services.file_services import save_file, extract_data


router = APIRouter()


@router.post("/test-upload")
def test_upload(
    file: UploadFile = File(...)
):

    file_data = save_file(file)

    print(file_data)


    df = extract_data(
        file_data["file_path"]
    )


    return {
        "filename": file_data["original_filename"],
        "rows": len(df)
    }