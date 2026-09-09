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
    MandalBottlenecksListResponse,
    HostZoneCandidateListResponse,
)

router = APIRouter(prefix="/capacity", tags=["Physical Carrying Capacity"])


# ==================== Base Endpoints ====================

@router.get("/summary", response_model=CapacitySummaryResponse)
def get_capacity_summary(
    state_id: Optional[str] = Query(None, description="State identifier (e.g. 'andhra_pradesh', 'gujarat')"),
    state: Optional[str] = Query(None, description="State identifier alias"),
):
    """Returns statewide physical carrying-capacity component summary and shelter coverage statistics."""
    target_state = state_id or state or "andhra_pradesh"
    return capacity_service.get_summary(state_id=target_state, state=target_state)


@router.get("/mandals", response_model=MandalCapacityListResponse)
def get_all_mandals(
    district_id: Optional[str] = Query(None, description="Optional district identifier filter"),
    has_shelters: Optional[bool] = Query(None, description="Filter for units with designated cyclone shelters"),
    shelter_status: Optional[str] = Query(None, description="Filter by shelter status"),
    state_id: Optional[str] = Query(None, description="State identifier (e.g. 'andhra_pradesh', 'gujarat')"),
    state: Optional[str] = Query(None, description="State identifier alias"),
):
    """Returns physical carrying-capacity indicators for all administrative units, with optional filters."""
    target_state = state_id or state or "andhra_pradesh"
    return capacity_service.get_all_mandals(
        district_id=district_id,
        has_shelters=has_shelters,
        shelter_status=shelter_status,
        state_id=target_state,
        state=target_state,
    )


@router.get("/mandal/{mandal_id}", response_model=MandalCapacityItem)
def get_mandal_capacity(
    mandal_id: str,
    state_id: Optional[str] = Query(None, description="State identifier (e.g. 'andhra_pradesh', 'gujarat')"),
    state: Optional[str] = Query(None, description="State identifier alias"),
):
    """Returns detailed carrying-capacity components and quality flags for a specific unit by ID or name."""
    target_state = state_id or state or "andhra_pradesh"
    res = capacity_service.get_mandal_detail(mandal_id, state_id=target_state, state=target_state)
    if not res:
        raise HTTPException(status_code=404, detail=f"Unit '{mandal_id}' not found in capacity database.")
    return res


@router.get("/geojson")
def get_capacity_geojson(
    district_id: Optional[str] = Query(None, description="Optional district identifier filter"),
    state_id: Optional[str] = Query(None, description="State identifier (e.g. 'andhra_pradesh', 'gujarat')"),
    state: Optional[str] = Query(None, description="State identifier alias"),
) -> Dict[str, Any]:
    """Returns the full administrative GeoJSON enriched with all physical carrying capacity attributes."""
    target_state = state_id or state or "andhra_pradesh"
    return capacity_service.get_geojson(district_id=district_id, state_id=target_state, state=target_state)


# ==================== Adequacy & Bottleneck Endpoints ====================

@router.get("/adequacy/summary", response_model=CapacityAdequacySummaryResponse)
def get_capacity_adequacy_summary(
    state_id: Optional[str] = Query(None, description="State identifier (e.g. 'andhra_pradesh', 'gujarat')"),
    state: Optional[str] = Query(None, description="State identifier alias"),
):
    """Returns statewide breakdown of capacity conditions, primary bottlenecks, and host zone candidate statistics."""
    target_state = state_id or state or "andhra_pradesh"
    return capacity_service.get_adequacy_summary(state_id=target_state, state=target_state)


@router.get("/adequacy/mandals", response_model=MandalCapacityAdequacyListResponse)
def get_all_adequacy_mandals(
    district_id: Optional[str] = Query(None, description="Optional district filter"),
    shelter_status: Optional[str] = Query(None, description="Filter by shelter status"),
    health_status: Optional[str] = Query(None, description="Filter by health status"),
    capacity_condition: Optional[str] = Query(None, description="Filter by condition (e.g. 'CAPACITY-ADEQUATE', 'CAPACITY-CONSTRAINED', 'CAPACITY-SEVERELY-CONSTRAINED')"),
    primary_bottleneck: Optional[str] = Query(None, description="Filter by primary bottleneck (e.g. 'health_infrastructure', 'shelter_capacity', 'road_accessibility', 'water_sanitation')"),
    is_host_candidate: Optional[bool] = Query(None, description="Filter for units in candidate host zone pool"),
    state_id: Optional[str] = Query(None, description="State identifier (e.g. 'andhra_pradesh', 'gujarat')"),
    state: Optional[str] = Query(None, description="State identifier alias"),
):
    """Returns capacity adequacy, bottleneck rankings, and condition indicators for all administrative units."""
    target_state = state_id or state or "andhra_pradesh"
    return capacity_service.get_adequacy_mandals(
        district_id=district_id,
        shelter_status=shelter_status,
        health_status=health_status,
        capacity_condition=capacity_condition,
        primary_bottleneck=primary_bottleneck,
        is_host_candidate=is_host_candidate,
        state_id=target_state,
        state=target_state,
    )


@router.get("/bottlenecks", response_model=MandalBottlenecksListResponse)
def get_all_bottlenecks(
    district_id: Optional[str] = Query(None, description="Optional district filter"),
    primary_bottleneck: Optional[str] = Query(None, description="Filter by limiting resource bottleneck"),
    state_id: Optional[str] = Query(None, description="State identifier (e.g. 'andhra_pradesh', 'gujarat')"),
    state: Optional[str] = Query(None, description="State identifier alias"),
):
    """Returns administrative unit limiting resource bottleneck rankings and component adequacy scores."""
    target_state = state_id or state or "andhra_pradesh"
    return capacity_service.get_bottlenecks(
        district_id=district_id,
        primary_bottleneck=primary_bottleneck,
        state_id=target_state,
        state=target_state,
    )


@router.get("/adequacy/mandal/{mandal_id}", response_model=MandalCapacityAdequacyItem)
def get_mandal_adequacy_detail(
    mandal_id: str,
    state_id: Optional[str] = Query(None, description="State identifier (e.g. 'andhra_pradesh', 'gujarat')"),
    state: Optional[str] = Query(None, description="State identifier alias"),
):
    """Returns detailed capacity adequacy profile for a specific unit."""
    target_state = state_id or state or "andhra_pradesh"
    res = capacity_service.get_adequacy_mandal_detail(mandal_id, state_id=target_state, state=target_state)
    if not res:
        raise HTTPException(status_code=404, detail=f"Unit '{mandal_id}' not found in capacity adequacy database.")
    return res


@router.get("/adequacy/geojson")
def get_capacity_adequacy_geojson(
    district_id: Optional[str] = Query(None, description="Optional district filter"),
    state_id: Optional[str] = Query(None, description="State identifier (e.g. 'andhra_pradesh', 'gujarat')"),
    state: Optional[str] = Query(None, description="State identifier alias"),
) -> Dict[str, Any]:
    """Returns the capacity adequacy GeoJSON."""
    target_state = state_id or state or "andhra_pradesh"
    return capacity_service.get_adequacy_geojson(district_id=district_id, state_id=target_state, state=target_state)


@router.get("/host-zones/{mandal_id}", response_model=HostZoneCandidateListResponse)
def get_host_zones_for_mandal(
    mandal_id: str,
    state_id: Optional[str] = Query(None, description="State identifier (e.g. 'andhra_pradesh', 'gujarat')"),
    state: Optional[str] = Query(None, description="State identifier alias"),
):
    """Returns screened candidate host zones with geodesic distances in EPSG:7755 for a given source unit."""
    target_state = state_id or state or "andhra_pradesh"
    return capacity_service.get_host_zones(mandal_id, state_id=target_state, state=target_state)
