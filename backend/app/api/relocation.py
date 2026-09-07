from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from app.services.relocation_service import relocation_service
from app.relocation.schemas import (
    MandalRelocationListResponse,
    MandalRelocationItem,
    TopRelocationListResponse,
    RelocationSummaryResponse,
    AHPWeightsResponse,
    RelocationFactorContributionsResponse,
)
from app.capacity.schemas import HostZoneCandidateListResponse

router = APIRouter(prefix="/relocation", tags=["Relocation Prioritization (Phase 4)"])


@router.get("/summary", response_model=RelocationSummaryResponse)
def get_relocation_summary(
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh', 'tamil_nadu', or 'tripura')")
):
    """Returns statewide multi-criteria relocation prioritization summary, AHP consistency, and priority category distribution."""
    return relocation_service.get_summary(state_id=state_id or "andhra_pradesh")


@router.get("/mandals", response_model=MandalRelocationListResponse)
def get_all_mandals(
    district_id: Optional[str] = Query(None, description="Filter by district identifier"),
    priority_category: Optional[str] = Query(None, description="Filter by priority category (VERY HIGH, HIGH, MODERATE, LOW)"),
    ranking_status: Optional[str] = Query(None, description="Filter by ranking status (FULL, PARTIAL, INSUFFICIENT_DATA)"),
    primary_factor: Optional[str] = Query(None, description="Filter by primary contributing decision factor"),
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh', 'tamil_nadu', or 'tripura')"),
):
    """Returns multi-criteria relocation priority indicators, TOPSIS scores, and factor attributions for all administrative units."""
    return relocation_service.get_all_mandals(
        district_id=district_id,
        priority_category=priority_category,
        ranking_status=ranking_status,
        primary_factor=primary_factor,
        state_id=state_id or "andhra_pradesh",
    )


@router.get("/top", response_model=TopRelocationListResponse)
def get_top_prioritized_mandals(
    limit: int = Query(10, ge=1, le=100, description="Number of top prioritized units to return (default: 10)"),
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh', 'tamil_nadu', or 'tripura')")
):
    """Returns the top N highest-priority units ranked by TOPSIS closeness coefficient."""
    return relocation_service.get_top_prioritized(limit=limit, state_id=state_id or "andhra_pradesh")


@router.get("/mandal/{mandal_id}", response_model=MandalRelocationItem)
def get_mandal_relocation_detail(
    mandal_id: str,
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh', 'tamil_nadu', or 'tripura')")
):
    """Returns detailed multi-criteria relocation profile, four orthogonal criteria, and factor contribution breakdown for a specific unit."""
    res = relocation_service.get_mandal_detail(mandal_id, state_id=state_id or "andhra_pradesh")
    if not res:
        raise HTTPException(status_code=404, detail=f"Unit '{mandal_id}' not found in relocation prioritization database.")
    return res


@router.get("/factors", response_model=RelocationFactorContributionsResponse)
def get_factor_contributions(
    district_id: Optional[str] = Query(None, description="Optional district filter"),
    priority_category: Optional[str] = Query(None, description="Optional priority category filter"),
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh', 'tamil_nadu', or 'tripura')")
):
    """Returns detailed percentage factor contributions (Hazard, Demography, Capacity, Accessibility) across units."""
    return relocation_service.get_factor_contributions(
        district_id=district_id,
        priority_category=priority_category,
        state_id=state_id or "andhra_pradesh"
    )


@router.get("/weights", response_model=AHPWeightsResponse)
def get_ahp_weights(
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh', 'tamil_nadu', or 'tripura')")
):
    """Returns AHP criteria weights, Saaty pairwise comparison matrix, and Consistency Ratio (CR < 0.10) diagnostics."""
    return relocation_service.get_ahp_weights(state_id=state_id or "andhra_pradesh")


@router.get("/geojson")
def get_relocation_geojson(
    district_id: Optional[str] = Query(None, description="Optional district filter"),
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh', 'tamil_nadu', or 'tripura')")
) -> Dict[str, Any]:
    """Returns the full administrative GeoJSON enriched with TOPSIS priority scores, categories, and factor contributions."""
    return relocation_service.get_geojson(district_id=district_id, state_id=state_id or "andhra_pradesh")


@router.get("/mandal/{mandal_id}/host-zones", response_model=HostZoneCandidateListResponse)
def get_mandal_host_zones(
    mandal_id: str,
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh', 'tamil_nadu', or 'tripura')")
):
    """Returns screened candidate host zones with geodesic distances in EPSG:7755 for planning human review."""
    return relocation_service.get_host_zones_for_mandal(mandal_id, state_id=state_id or "andhra_pradesh")
