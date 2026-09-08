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


# ==================== Phase 3B Base Endpoints ====================

@router.get("/summary", response_model=CapacitySummaryResponse)
def get_capacity_summary(
    state: Optional[str] = Query(None, description="State identifier (e.g. 'ap' or 'gujarat')"),
):
    """Returns statewide physical carrying-capacity component summary and shelter coverage statistics."""
    return capacity_service.get_summary(state=state)


@router.get("/mandals", response_model=MandalCapacityListResponse)
def get_all_mandals(
    district_id: Optional[str] = Query(None, description="Optional district identifier filter"),
    has_shelters: Optional[bool] = Query(None, description="Filter for mandals with designated cyclone shelters"),
    shelter_status: Optional[str] = Query(None, description="Filter by shelter status"),
    state: Optional[str] = Query(None, description="State identifier (e.g. 'ap' or 'gujarat')"),
):
    """Returns physical carrying-capacity indicators for all mandals/talukas, with optional filters."""
    return capacity_service.get_all_mandals(
        district_id=district_id,
        has_shelters=has_shelters,
        shelter_status=shelter_status,
        state=state,
    )


@router.get("/mandal/{mandal_id}", response_model=MandalCapacityItem)
def get_mandal_capacity(
    mandal_id: str,
    state: Optional[str] = Query(None, description="State identifier (e.g. 'ap' or 'gujarat')"),
):
    """Returns detailed carrying-capacity components and quality flags for a specific mandal by ID or name."""
    res = capacity_service.get_mandal_detail(mandal_id, state=state)
    if not res:
        raise HTTPException(status_code=404, detail=f"Mandal '{mandal_id}' not found in capacity database.")
    return res


@router.get("/geojson")
def get_capacity_geojson(
    district_id: Optional[str] = Query(None, description="Optional district identifier filter"),
    state: Optional[str] = Query(None, description="State identifier (e.g. 'ap' or 'gujarat')"),
) -> Dict[str, Any]:
    """Returns the full mandal/taluka GeoJSON enriched with all physical carrying capacity attributes."""
    return capacity_service.get_geojson(district_id=district_id, state=state)


# ==================== Phase 3C Adequacy & Bottleneck Endpoints ====================

@router.get("/adequacy/summary", response_model=CapacityAdequacySummaryResponse)
def get_capacity_adequacy_summary(
    state: Optional[str] = Query(None, description="State identifier (e.g. 'ap' or 'gujarat')"),
):
    """Returns statewide breakdown of capacity conditions, primary bottlenecks, and host zone candidate statistics."""
    return capacity_service.get_adequacy_summary(state=state)


@router.get("/adequacy/mandals", response_model=MandalCapacityAdequacyListResponse)
def get_all_adequacy_mandals(
    district_id: Optional[str] = Query(None, description="Optional district filter"),
    capacity_condition: Optional[str] = Query(None, description="Filter by condition (e.g. 'CAPACITY-ADEQUATE', 'CAPACITY-CONSTRAINED', 'CAPACITY-SEVERELY-CONSTRAINED')"),
    primary_bottleneck: Optional[str] = Query(None, description="Filter by primary bottleneck (e.g. 'health_infrastructure', 'shelter_capacity', 'road_accessibility', 'water_sanitation')"),
    is_host_candidate: Optional[bool] = Query(None, description="Filter for mandals in candidate host zone pool"),
    state: Optional[str] = Query(None, description="State identifier (e.g. 'ap' or 'gujarat')"),
):
    """Returns capacity adequacy, bottleneck rankings, and condition indicators for all mandals/talukas."""
    return capacity_service.get_all_adequacy_mandals(
        district_id=district_id,
        capacity_condition=capacity_condition,
        primary_bottleneck=primary_bottleneck,
        is_host_candidate=is_host_candidate,
        state=state,
    )


@router.get("/adequacy/mandal/{mandal_id}", response_model=MandalCapacityAdequacyItem)
def get_mandal_adequacy_detail(
    mandal_id: str,
    state: Optional[str] = Query(None, description="State identifier (e.g. 'ap' or 'gujarat')"),
):
    """Returns detailed capacity adequacy and bottleneck profile for a specific mandal."""
    res = capacity_service.get_adequacy_mandal_detail(mandal_id, state=state)
    if not res:
        raise HTTPException(status_code=404, detail=f"Mandal '{mandal_id}' not found in capacity adequacy database.")
    return res


@router.get("/bottlenecks", response_model=MandalBottlenecksListResponse)
def get_all_bottlenecks(
    district_id: Optional[str] = Query(None, description="Optional district filter"),
    primary_bottleneck: Optional[str] = Query(None, description="Filter by limiting resource bottleneck"),
    state: Optional[str] = Query(None, description="State identifier (e.g. 'ap' or 'gujarat')"),
):
    """Returns mandal limiting resource bottleneck rankings and component adequacy scores."""
    return capacity_service.get_bottlenecks(
        district_id=district_id,
        primary_bottleneck=primary_bottleneck,
        state=state,
    )


@router.get("/host-zones/{mandal_id}", response_model=HostZoneCandidateListResponse)
def get_host_zones_for_mandal(
    mandal_id: str,
    state: Optional[str] = Query(None, description="State identifier (e.g. 'ap' or 'gujarat')"),
):
    """Returns screened candidate host zones with geodesic distances in EPSG:7755 for a given source mandal."""
    return capacity_service.get_host_zones_for_mandal(mandal_id, state=state)

