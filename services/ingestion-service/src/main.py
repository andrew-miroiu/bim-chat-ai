from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.ingestion.ingestion_router import router as ingestion_router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingestion_router, prefix="/ingestion")

@app.get("/health")
def health():
    return {"status": "ok"}