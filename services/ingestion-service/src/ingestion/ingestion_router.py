from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException
from src.ingestion.ingestion_service import process_document
import jwt
import os

router = APIRouter()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    authorization: str = Header(...)
):
    token = authorization.replace("Bearer ", "")
    
    try:
        decoded = jwt.decode(
            token,
            os.getenv("JWT_SECRET"),
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        user_id = decoded["sub"]
    except Exception as e:
        print(f"JWT Error: {e}")
        raise HTTPException(status_code=401, detail="Token invalid")
    
    file_bytes = await file.read()
    filename = file.filename or "document"
    
    result = process_document(file_bytes, filename, title, user_id)
    return result