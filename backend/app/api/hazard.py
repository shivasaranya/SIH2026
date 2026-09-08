from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from app.services.hazard_service import hazard_service
from app.hazard.schemas import MandalExposureListResponse, MandalHazardExposureItem, HazardSummaryResponse

router = APIRouter(prefix="/hazard", tags=["Hazard Exposure"])

@router.get("/summary", response_model=HazardSummaryResponse)
def get_hazard_summary(
    state: Optional[str] = Query(None, description="State identifier (e.g. 'ap', 'gujarat')")
):
    """Returns statewide multi-hazard exposure statistical summary."""
    return hazard_service.get_summary(state=state)

@router.get("/mandals", response_model=MandalExposureListResponse)
def get_all_mandals(
    district_id: Optional[str] = Query(None, description="Optional district identifier to filter administrative units"),
    state: Optional[str] = Query(None, description="State identifier (e.g. 'ap', 'gujarat')")
):
    """Returns multi-hazard exposure metrics for all administrative units with optional district filter."""
    return hazard_service.get_all_mandals(district_id=district_id, state=state)

@router.get("/mandal/{mandal_id}", response_model=MandalHazardExposureItem)
def get_mandal_exposure(
    mandal_id: str,
    state: Optional[str] = Query(None, description="State identifier (e.g. 'ap', 'gujarat')")
):
    """Returns detailed multi-hazard exposure metrics for a specific administrative unit by ID or name."""
    res = hazard_service.get_mandal_detail(mandal_id, state=state)
    if not res:
        raise HTTPException(status_code=404, detail=f"Unit '{mandal_id}' not found in exposure database.")
    return res

@router.get("/geojson")
def get_mandal_exposure_geojson(
    district_id: Optional[str] = Query(None, description="Optional district identifier to filter GeoJSON features"),
    state: Optional[str] = Query(None, description="State identifier (e.g. 'ap', 'gujarat')")
) -> Dict[str, Any]:
    """Returns the full administrative GeoJSON enriched with all hazard exposure attributes."""
    return hazard_service.get_geojson(district_id=district_id, state=state)
