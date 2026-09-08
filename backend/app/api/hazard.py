from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from app.services.hazard_service import hazard_service
from app.hazard.schemas import MandalExposureListResponse, MandalHazardExposureItem, HazardSummaryResponse

router = APIRouter(prefix="/hazard", tags=["Hazard Exposure"])


@router.get("/summary", response_model=HazardSummaryResponse)
def get_hazard_summary(
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh', 'assam', or 'tamil_nadu')")
):
    """Returns statewide multi-hazard exposure statistical summary."""
    return hazard_service.get_summary(state_id=state_id or "andhra_pradesh")


@router.get("/mandals", response_model=MandalExposureListResponse)
def get_all_mandals(
    district_id: Optional[str] = Query(None, description="Optional district identifier to filter units"),
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh', 'assam', or 'tamil_nadu')")
):
    """Returns multi-hazard exposure metrics for all administrative units, with optional district filter."""
    return hazard_service.get_all_mandals(district_id=district_id, state_id=state_id or "andhra_pradesh")


@router.get("/mandal/{mandal_id}", response_model=MandalHazardExposureItem)
def get_mandal_exposure(
    mandal_id: str,
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh', 'assam', or 'tamil_nadu')")
):
    """Returns detailed multi-hazard exposure metrics for a specific unit by ID or name."""
    res = hazard_service.get_mandal_detail(mandal_id, state_id=state_id or "andhra_pradesh")
    if not res:
        raise HTTPException(status_code=404, detail=f"Unit '{mandal_id}' not found in exposure database.")
    return res


@router.get("/geojson")
def get_mandal_exposure_geojson(
    district_id: Optional[str] = Query(None, description="Optional district identifier to filter GeoJSON features"),
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh', 'assam', or 'tamil_nadu')")
) -> Dict[str, Any]:
    """Returns the full administrative GeoJSON enriched with all hazard exposure attributes."""
    return hazard_service.get_geojson(district_id=district_id, state_id=state_id or "andhra_pradesh")
