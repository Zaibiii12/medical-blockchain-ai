from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import requests
import os
import io
import PyPDF2
import google.genai as genai
from cryptography.fernet import Fernet
import base64
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)

PINATA_API_KEY = os.getenv("PINATA_KEY")
PINATA_SECRET_API_KEY = os.getenv("PINATA_SECRET")
GEMINI_API_KEY = os.getenv("GEMINI_KEY")

raw_key_string = os.getenv("ENCRYPTION_KEY")
if not raw_key_string:
    raise ValueError("ENCRYPTION_KEY not found in .env file")
    
SECRET_ENCRYPTION_KEY = base64.urlsafe_b64encode(raw_key_string.encode().ljust(32)[:32])
cipher_suite = Fernet(SECRET_ENCRYPTION_KEY)

ai_client = genai.Client(api_key=GEMINI_API_KEY)

# --- REQUEST MODELS ---
class ChatRequest(BaseModel):
    ipfs_hash: str
    question: str

def extract_text_from_pdf(file_bytes):
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print("Error reading PDF:", e)
        return ""

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    ai_summary = "AI Summary not available."
    
    if file.filename.lower().endswith('.pdf'):
        extracted_text = extract_text_from_pdf(content)
        if extracted_text.strip():
            try:
                prompt = f"Summarize this medical record in 2 concise sentences: {extracted_text}"
                response = ai_client.models.generate_content(
                    model='gemini-1.5-flash',
                    contents=prompt,
                )
                ai_summary = response.text.strip()
            except Exception as e:
                print(f"Gemini Upload Error: {e}")
                ai_summary = "AI temporarily unavailable. File securely stored."

    encrypted_content = cipher_suite.encrypt(content)
    url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
    headers = {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_SECRET_API_KEY,
    }
    files = {"file": (file.filename, encrypted_content)}

    try:
        pinata_response = requests.post(url, files=files, headers=headers)
        if pinata_response.status_code == 200:
            return {
                "filename": file.filename,
                "fileHash": pinata_response.json()["IpfsHash"],
                "ai_summary": ai_summary
            }
        else:
            raise HTTPException(status_code=500, detail="Pinata Upload Failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{ipfs_hash}")
async def download_file(ipfs_hash: str):
    gateway_url = f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
    try:
        response = requests.get(gateway_url)
        decrypted_content = cipher_suite.decrypt(response.content)
        return Response(
            content=decrypted_content, 
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename={ipfs_hash}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=403, detail="Decryption failed.")

@app.post("/chat")
async def chat_with_record(request: ChatRequest):
    gateway_url = f"https://gateway.pinata.cloud/ipfs/{request.ipfs_hash}"
    try:
        # 1. Fetch & Decrypt
        response = requests.get(gateway_url)
        decrypted_content = cipher_suite.decrypt(response.content)
        
        # 2. Extract context
        text_context = extract_text_from_pdf(decrypted_content)
        
        # 3. Prompt Gemini
        prompt = f"""
        You are an expert medical AI assistant. Below is a patient's confidential medical record.
        Answer the patient's question based strictly on this text. Speak directly to the patient in a reassuring tone.
        If the answer is not in the text, inform the patient that the data is not available in this specific document.
        
        RECORD CONTENT:
        {text_context}
        
        PATIENT QUESTION:
        {request.question}
        """
        
        gemini_response = ai_client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt,
        )
        return {"answer": gemini_response.text.strip()}
        
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail="Could not process chat.")