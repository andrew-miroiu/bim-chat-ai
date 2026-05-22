import fitz
import pytesseract
from PIL import Image
import io
import os
from google import genai
from src.lib.supabase_client import supabase
from dotenv import load_dotenv

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        page_text = page.get_text()
        if page_text.strip():
            text += page_text
        else:
            pix = page.get_pixmap()
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            text += pytesseract.image_to_string(img)
    return text

def extract_text_from_image(file_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(file_bytes))
    return pytesseract.image_to_string(img)

def chunk_text(text: str, chunk_size: int = 500) -> list[str]:
    words = text.split()
    chunks = []
    current_chunk = []
    current_size = 0

    for word in words:
        current_chunk.append(word)
        current_size += 1
        if current_size >= chunk_size:
            chunks.append(" ".join(current_chunk))
            current_chunk = []
            current_size = 0

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks

def embed_text(text: str) -> list[float]:
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text
    )
    return result.embeddings[0].values

def process_document(file_bytes: bytes, filename: str, title: str, uploaded_by: str) -> dict:
    if filename.endswith(".pdf"):
        text = extract_text_from_pdf(file_bytes)
    else:
        text = extract_text_from_image(file_bytes)

    chunks = chunk_text(text)

    doc_result = supabase.table("documents").insert({
        "title": title,
        "file_url": "",
        "uploaded_by": uploaded_by,
        "category": "uncategorized"
    }).execute()

    document_id = doc_result.data[0]["id"]

    for i, chunk in enumerate(chunks):
        embedding = embed_text(chunk)
        supabase.table("chunks").insert({
            "document_id": document_id,
            "content": chunk,
            "embedding": embedding,
            "chunk_index": i
        }).execute()

    return {
        "document_id": document_id,
        "chunks_count": len(chunks),
        "message": "Document procesat cu succes"
    }