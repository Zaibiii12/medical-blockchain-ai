import os

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import SessionLocal

from app import models

from app.hashing import generate_file_hash

from app.auth import get_current_user

router = APIRouter()

UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


# ==============================
# DATABASE SESSION
# ==============================
def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ==============================
# SECURE FILE UPLOAD
# ==============================
@router.post("/upload")
async def upload_medical_record(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):

    if not file:

        raise HTTPException(
            status_code=400,
            detail="No file uploaded"
        )

    content = await file.read()

    # Save file locally
    file_path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )

    with open(file_path, "wb") as f:
        f.write(content)

    # Generate SHA-256 hash
    file_hash = generate_file_hash(content)

    # Save record in DB
    new_record = models.MedicalRecord(
        filename=file.filename,
        file_hash=file_hash,
        owner_email=current_user
    )

    db.add(new_record)

    db.commit()

    db.refresh(new_record)

    return {
        "message": "Medical record uploaded successfully",
        "filename": file.filename,
        "owner": current_user,
        "file_hash": file_hash
    }