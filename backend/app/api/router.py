from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.gis import router as gis_router
from app.api.demographics import router as demographics_router
from app.api.hazard import router as hazard_router
from app.api.vulnerability import router as vulnerability_router
from app.api.capacity import router as capacity_router
from app.api.relocation import router as relocation_router
from app.api.simulation import router as simulation_router
from app.api.decision import router as decision_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(gis_router, tags=["GIS"])
api_router.include_router(demographics_router, tags=["Demographics"])
api_router.include_router(hazard_router, tags=["Hazard Exposure"])
api_router.include_router(vulnerability_router, tags=["Population Vulnerability"])
api_router.include_router(capacity_router, tags=["Physical Carrying Capacity"])
api_router.include_router(relocation_router, tags=["Relocation Prioritization (Phase 4)"])
api_router.include_router(simulation_router, tags=["What-If Disaster Simulation (Phase 5)"])
api_router.include_router(decision_router, tags=["Decision & Action Planning (Phase 6)"])
