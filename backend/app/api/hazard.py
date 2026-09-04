from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from app.services.hazard_service import hazard_service
from app.hazard.schemas import MandalExposureListResponse, MandalHazardExposureItem, HazardSummaryResponse

router = APIRouter(prefix="/hazard", tags=["Hazard Exposure"])


@router.get("/summary", response_model=HazardSummaryResponse)
def get_hazard_summary():
    """Returns statewide mandal-level multi-hazard exposure statistical summary."""
    return hazard_service.get_summary()


@router.get("/mandals", response_model=MandalExposureListResponse)
def get_all_mandals(
    district_id: Optional[str] = Query(None, description="Optional 26-district identifier to filter mandals (e.g. 'eluru', 'tirupati')")
):
    """Returns multi-hazard exposure metrics for all 696 mandals, with optional district filter."""
    return hazard_service.get_all_mandals(district_id=district_id)


@router.get("/mandal/{mandal_id}", response_model=MandalHazardExposureItem)
def get_mandal_exposure(mandal_id: str):
    """Returns detailed multi-hazard exposure metrics for a specific mandal by ID or name."""
    res = hazard_service.get_mandal_detail(mandal_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Mandal '{mandal_id}' not found in exposure database.")
    return res


@router.get("/geojson")
def get_mandal_exposure_geojson(
    district_id: Optional[str] = Query(None, description="Optional 26-district identifier to filter GeoJSON features")
) -> Dict[str, Any]:
    """Returns the full 696-mandal GeoJSON enriched with all hazard exposure attributes."""
    return hazard_service.get_geojson(district_id=district_id)
