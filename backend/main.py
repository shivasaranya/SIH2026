import sys
from pathlib import Path

# Ensure backend directory is in sys.path
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


@app.get("/", summary="Root Index")
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} Decision-Support Platform",
        "sih_problem": settings.SIH_CODE,
        "pilot": settings.PILOT_STATE,
        "phase": "PHASE 0 — PROJECT FOUNDATION",
        "docs": "/docs",
        "health": "/api/health"
    }


@app.get("/health", summary="Health Check")
async def health_check():
    return {
        "status": "ok",
        "project": settings.APP_NAME,
        "version": settings.VERSION,
        "supported_states": ["andhra_pradesh", "assam", "bihar", "tamil_nadu", "west_bengal", "odisha", "uttar_pradesh", "uttarakhand", "sikkim", "arunachal_pradesh", "nagaland", "meghalaya"]
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.DEBUG,
    )
