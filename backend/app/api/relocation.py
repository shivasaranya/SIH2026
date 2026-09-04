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
def get_relocation_summary():
    """Returns statewide multi-criteria relocation prioritization summary, AHP consistency, and priority category distribution."""
    return relocation_service.get_summary()


@router.get("/mandals", response_model=MandalRelocationListResponse)
def get_all_mandals(
    district_id: Optional[str] = Query(None, description="Filter by 26-district identifier"),
    priority_category: Optional[str] = Query(None, description="Filter by priority category (VERY HIGH, HIGH, MODERATE, LOW)"),
    ranking_status: Optional[str] = Query(None, description="Filter by ranking status (FULL, PARTIAL, INSUFFICIENT_DATA)"),
    primary_factor: Optional[str] = Query(None, description="Filter by primary contributing decision factor"),
):
    """Returns multi-criteria relocation priority indicators, TOPSIS scores, and factor attributions for all 696 mandals."""
    return relocation_service.get_all_mandals(
        district_id=district_id,
        priority_category=priority_category,
        ranking_status=ranking_status,
        primary_factor=primary_factor,
    )


@router.get("/top", response_model=TopRelocationListResponse)
def get_top_prioritized_mandals(
    limit: int = Query(10, ge=1, le=100, description="Number of top prioritized mandals to return (default: 10)")
):
    """Returns the top N highest-priority mandals ranked by TOPSIS closeness coefficient."""
    return relocation_service.get_top_prioritized(limit=limit)


@router.get("/mandal/{mandal_id}", response_model=MandalRelocationItem)
def get_mandal_relocation_detail(mandal_id: str):
    """Returns detailed multi-criteria relocation profile, four orthogonal criteria, and factor contribution breakdown for a specific mandal."""
    res = relocation_service.get_mandal_detail(mandal_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Mandal '{mandal_id}' not found in relocation prioritization database.")
    return res


@router.get("/factors", response_model=RelocationFactorContributionsResponse)
def get_factor_contributions(
    district_id: Optional[str] = Query(None, description="Optional district filter"),
    priority_category: Optional[str] = Query(None, description="Optional priority category filter"),
):
    """Returns detailed percentage factor contributions (Hazard, Demography, Capacity, Accessibility) across mandals."""
    return relocation_service.get_factor_contributions(
        district_id=district_id,
        priority_category=priority_category,
    )


@router.get("/weights", response_model=AHPWeightsResponse)
def get_ahp_weights():
    """Returns AHP criteria weights, Saaty pairwise comparison matrix, and Consistency Ratio (CR < 0.10) diagnostics."""
    return relocation_service.get_ahp_weights()


@router.get("/geojson")
def get_relocation_geojson(
    district_id: Optional[str] = Query(None, description="Optional district filter")
) -> Dict[str, Any]:
    """Returns the full 696-mandal GeoJSON enriched with TOPSIS priority scores, categories, and factor contributions."""
    return relocation_service.get_geojson(district_id=district_id)


@router.get("/mandal/{mandal_id}/host-zones", response_model=HostZoneCandidateListResponse)
def get_mandal_host_zones(mandal_id: str):
    """Returns screened candidate host zones with geodesic distances in EPSG:7755 for planning human review."""
    return relocation_service.get_host_zones_for_mandal(mandal_id)
