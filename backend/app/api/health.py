from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/health", summary="System Health Check")
async def health_check():
    """
    Basic health check endpoint returning service status,
    project metadata, and pilot jurisdiction.
    """
    return {
        "status": "healthy",
        "project": settings.APP_NAME,
        "sih_problem": settings.SIH_CODE,
        "version": settings.VERSION,
        "phase": "PHASE 0 — PROJECT FOUNDATION",
        "pilot_state": settings.PILOT_STATE,
        "supported_states": ["andhra_pradesh", "tamil_nadu", "mizoram", "himachal_pradesh"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
