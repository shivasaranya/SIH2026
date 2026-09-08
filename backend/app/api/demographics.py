from typing import Optional
from fastapi import APIRouter, HTTPException, Path, Query
from app.demographics.schemas import (
    StateDemographicSummary,
    DistrictDetailResponse,
    MandalVillageListResponse,
)
from app.services.demographics_service import demographics_service

router = APIRouter(prefix="/demographics", tags=["Demographics"])

@router.get(
    "/summary",
    response_model=StateDemographicSummary,
    summary="Get Statewide and District Demographic Summaries"
)
async def get_summary(
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh', 'assam', or 'tamil_nadu')")
) -> StateDemographicSummary:
    """
    Returns total demographic indicators aggregated across the selected state and broken down by modern districts.
    """
    try:
        return demographics_service.get_state_summary(state_id=state_id or "andhra_pradesh")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/district/{district_id}",
    response_model=DistrictDetailResponse,
    summary="Get Demographic Indicators and Unit Breakdown for a Specific District"
)
async def get_district_demographics(
    district_id: str = Path(..., description="The standardized district slug"),
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh', 'assam', or 'tamil_nadu')")
) -> DistrictDetailResponse:
    """
    Returns demographic indicators for the requested district along with a granular breakdown of its constituent administrative units.
    """
    result = demographics_service.get_district_detail(district_id, state_id=state_id or "andhra_pradesh")
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"District '{district_id}' not found in the demographic master dataset."
        )
    return result

@router.get(
    "/mandal/{mandal_id}/villages",
    response_model=MandalVillageListResponse,
    summary="Get Census Villages for a Selected Mandal"
)
async def get_mandal_villages(
    mandal_id: str = Path(..., description="Mandal identifier (e.g., 'AP_MANDAL_188' or 'Tadepalligudem')"),
    district_id: Optional[str] = Query(None, description="Optional district slug"),
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh' or 'tamil_nadu')")
) -> MandalVillageListResponse:
    """
    Returns real Census 2011 villages for the selected mandal.
    """
    return demographics_service.get_mandal_villages(
        mandal_id=mandal_id,
        state_id=state_id or "andhra_pradesh",
        district_id=district_id
    )
