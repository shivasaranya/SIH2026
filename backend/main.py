import sys
from pathlib import Path

# Ensure backend directory is in sys.path so 'app' imports work regardless of working directory
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router

app = FastAPI(
    title=f"{settings.APP_NAME} Decision-Support API",
    description=(
        "Backend API for Sahayata — Intelligent Identification of Hazard-Based "
        "Red Zones, Carrying Capacity Assessment, and Immediate Relocation Needs "
        "for Vulnerable Habitations (Smart India Hackathon 2026, SIH26191)."
    ),
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(api_router, prefix="/api")


@app.get("/health", summary="Direct Health Check")
async def health():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "supported_states": ["andhra_pradesh", "tamil_nadu", "mizoram", "himachal_pradesh"]
    }

@app.get("/", summary="Root Index")
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} Decision-Support Platform",
        "sih_problem": settings.SIH_CODE,
        "pilot": settings.PILOT_STATE,
        "supported_states": ["andhra_pradesh", "tamil_nadu", "mizoram"],
        "phase": "PHASE 0 — PROJECT FOUNDATION",
        "docs": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.DEBUG,
    )
