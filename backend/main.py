from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import sys
import os

# Ensure root paths are accessible for imports if run from inside backend
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from backend.api.routes import router as api_router
from backend.services.ml_service import load_model

logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load ML model once into memory
    logging.info("Starting up Asteria Backend...")
    load_model()
    yield
    # Shutdown sequence
    logging.info("Shutting down Asteria Backend...")

app = FastAPI(
    title="Project Asteria API",
    description="Backend API for Near-Earth Object Risk & Valuation Analyzer",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
frontend_url = os.getenv("FRONTEND_URL")
origins = [frontend_url] if frontend_url else ["*"]
# Allow localhost for local development
if "http://localhost:3000" not in origins and frontend_url:
    origins.append("http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root API router
app.include_router(api_router, prefix="/api")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Project Asteria"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
