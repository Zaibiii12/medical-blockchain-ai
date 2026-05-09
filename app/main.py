from fastapi import FastAPI
import hashlib

from app.blockchain import upload_record, get_record_count, get_record

app = FastAPI()

# =========================
# HEALTH CHECK
# =========================
@app.get("/")
def home():
    return {"message": "Medical Blockchain AI API Running"}


# =========================
# HASH FUNCTION
# =========================
def generate_hash(data: str):
    return hashlib.sha256(data.encode()).hexdigest()


# =========================
# UPLOAD RECORD TO BLOCKCHAIN
# =========================
@app.post("/upload")
def upload(record: str):
    file_hash = generate_hash(record)

    result = upload_record(file_hash)

    return {
        "message": "Record stored on blockchain",
        "original_data": record,
        "hash": file_hash,
        "transaction": result
    }


# =========================
# GET TOTAL RECORD COUNT
# =========================
@app.get("/count")
def count():
    total = get_record_count()
    return {"total_records": total}


# =========================
# GET RECORD BY INDEX
# =========================
@app.get("/record/{index}")
def fetch_record(index: int):
    data = get_record(index)

    return {
        "index": index,
        "file_hash": data[0],
        "uploaded_by": data[1],
        "timestamp": data[2]
    }