from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from app.services.capacity_service import capacity_service
from app.capacity.schemas import (
    MandalCapacityListResponse,
    MandalCapacityItem,
    CapacitySummaryResponse,
    MandalCapacityAdequacyListResponse,
    MandalCapacityAdequacyItem,
    CapacityAdequacySummaryResponse,
    HostZoneCandidateListResponse,
)

router = APIRouter(prefix="/capacity", tags=["Physical Carrying Capacity"])


# ==================== Base Endpoints ====================

@router.get("/summary", response_model=CapacitySummaryResponse)
def get_capacity_summary(
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh' or 'tamil_nadu')")
):
    """Returns statewide physical carrying-capacity component summary and shelter coverage statistics."""
    return capacity_service.get_summary(state_id=state_id or "andhra_pradesh")


@router.get("/mandals", response_model=MandalCapacityListResponse)
def get_all_mandals(
    district_id: Optional[str] = Query(None, description="Optional district identifier filter"),
    has_shelters: Optional[bool] = Query(None, description="Filter for units with designated cyclone shelters"),
    shelter_status: Optional[str] = Query(None, description="Filter by shelter status"),
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh' or 'tamil_nadu')"),
):
    """Returns physical carrying-capacity indicators for all administrative units, with optional filters."""
    return capacity_service.get_all_mandals(
        district_id=district_id,
        has_shelters=has_shelters,
        shelter_status=shelter_status,
        state_id=state_id or "andhra_pradesh",
    )


@router.get("/mandal/{mandal_id}", response_model=MandalCapacityItem)
def get_mandal_capacity(
    mandal_id: str,
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh' or 'tamil_nadu')")
):
    """Returns detailed carrying-capacity components and quality flags for a specific unit by ID or name."""
    res = capacity_service.get_mandal_detail(mandal_id, state_id=state_id or "andhra_pradesh")
    if not res:
        raise HTTPException(status_code=404, detail=f"Unit '{mandal_id}' not found in capacity database.")
    return res


@router.get("/geojson")
def get_capacity_geojson(
    district_id: Optional[str] = Query(None, description="Optional district identifier filter"),
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh' or 'tamil_nadu')")
) -> Dict[str, Any]:
    """Returns the full administrative GeoJSON enriched with all physical carrying capacity attributes."""
    return capacity_service.get_geojson(district_id=district_id, state_id=state_id or "andhra_pradesh")


# ==================== Adequacy & Bottleneck Endpoints ====================

@router.get("/adequacy/summary", response_model=CapacityAdequacySummaryResponse)
def get_capacity_adequacy_summary(
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh' or 'tamil_nadu')")
):
    """Returns statewide breakdown of capacity conditions, primary bottlenecks, and host zone candidate statistics."""
    return capacity_service.get_adequacy_summary(state_id=state_id or "andhra_pradesh")


@router.get("/adequacy/mandals", response_model=MandalCapacityAdequacyListResponse)
def get_all_adequacy_mandals(
    district_id: Optional[str] = Query(None, description="Optional district filter"),
    shelter_status: Optional[str] = Query(None, description="Filter by shelter status"),
    health_status: Optional[str] = Query(None, description="Filter by health status"),
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh' or 'tamil_nadu')"),
):
    """Returns capacity adequacy and condition indicators for all administrative units."""
    return capacity_service.get_adequacy_mandals(
        district_id=district_id,
        shelter_status=shelter_status,
        health_status=health_status,
        state_id=state_id or "andhra_pradesh",
    )


@router.get("/adequacy/mandal/{mandal_id}", response_model=MandalCapacityAdequacyItem)
def get_mandal_adequacy_detail(
    mandal_id: str,
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh' or 'tamil_nadu')")
):
    """Returns detailed capacity adequacy profile for a specific unit."""
    res = capacity_service.get_adequacy_mandal_detail(mandal_id, state_id=state_id or "andhra_pradesh")
    if not res:
        raise HTTPException(status_code=404, detail=f"Unit '{mandal_id}' not found in capacity adequacy database.")
    return res


@router.get("/adequacy/geojson")
def get_capacity_adequacy_geojson(
    district_id: Optional[str] = Query(None, description="Optional district filter"),
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh' or 'tamil_nadu')")
) -> Dict[str, Any]:
    """Returns the capacity adequacy GeoJSON."""
    return capacity_service.get_adequacy_geojson(district_id=district_id, state_id=state_id or "andhra_pradesh")


@router.get("/host-zones/{mandal_id}", response_model=HostZoneCandidateListResponse)
def get_host_zones_for_mandal(
    mandal_id: str,
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh' or 'tamil_nadu')")
):
    """Returns screened candidate host zones with geodesic distances in EPSG:7755 for a given source unit."""
    return capacity_service.get_host_zones(mandal_id, state_id=state_id or "andhra_pradesh")
