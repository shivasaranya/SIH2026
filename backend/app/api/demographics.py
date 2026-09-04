from typing import Optional
from fastapi import APIRouter, HTTPException, Path
from app.demographics.schemas import StateDemographicSummary, DistrictDetailResponse
from app.services.demographics_service import demographics_service

router = APIRouter(prefix="/demographics", tags=["Demographics"])

@router.get(
    "/summary",
    response_model=StateDemographicSummary,
    summary="Get Statewide and 26-District Demographic Summaries"
)
async def get_summary() -> StateDemographicSummary:
    """
    Returns total demographic indicators aggregated across Andhra Pradesh and broken down by the 26 modern districts.
    All data is derived from the Census of India 2011 Primary Census Abstract (PCA) crosswalk.
    """
    try:
        return demographics_service.get_state_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/district/{district_id}",
    response_model=DistrictDetailResponse,
    summary="Get Demographic Indicators and Mandal Breakdown for a Specific District"
)
async def get_district_demographics(
    district_id: str = Path(..., description="The standardized district slug, e.g., 'visakhapatnam', 'alluri_sitharama_raju'")
) -> DistrictDetailResponse:
    """
    Returns demographic indicators for the requested district along with a granular breakdown of its constituent mandals.
    """
    result = demographics_service.get_district_summary(district_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"District '{district_id}' not found in the 26-district demographic master dataset."
        )
    return result
