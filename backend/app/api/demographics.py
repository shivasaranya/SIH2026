from typing import Optional
from fastapi import APIRouter, HTTPException, Path, Query
from app.demographics.schemas import StateDemographicSummary, DistrictDetailResponse
from app.services.demographics_service import demographics_service

router = APIRouter(prefix="/demographics", tags=["Demographics"])

@router.get(
    "/summary",
    response_model=StateDemographicSummary,
    summary="Get Statewide and District Demographic Summaries"
)
async def get_summary(
    state: Optional[str] = Query(None, description="State identifier (e.g. 'ap', 'gujarat')")
) -> StateDemographicSummary:
    """
    Returns total demographic indicators aggregated across the selected state and broken down by districts.
    All data is derived from official Census 2011 Primary Census Abstract (PCA) datasets.
    """
    try:
        return demographics_service.get_state_summary(state=state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/district/{district_id}",
    response_model=DistrictDetailResponse,
    summary="Get Demographic Indicators and Mandal / Taluka Breakdown for a Specific District"
)
async def get_district_demographics(
    district_id: str = Path(..., description="The standardized district slug, e.g., 'visakhapatnam', 'ahmedabad'"),
    state: Optional[str] = Query(None, description="State identifier (e.g. 'ap', 'gujarat')")
) -> DistrictDetailResponse:
    """
    Returns demographic indicators for the requested district along with a granular breakdown of its constituent administrative units.
    """
    result = demographics_service.get_district_summary(district_id, state=state)
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"District '{district_id}' not found in the demographic master dataset."
        )
    return result
