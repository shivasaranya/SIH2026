from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, status
from app.services.emergency_service import emergency_service
from app.emergency.schemas import (
    EmergencyDisaster,
    EmergencyDisasterCreate,
    EmergencyDisasterListResponse,
)
from app.core.state_registry import get_state_key

router = APIRouter(prefix="/emergency", tags=["Emergency Map"])

@router.get(
    "/disasters",
    response_model=EmergencyDisasterListResponse,
    summary="Get Emergency Disasters for State with Filtering"
)
async def get_emergency_disasters(
    state: Optional[str] = Query("andhra_pradesh", description="Target state identifier or name"),
    state_id: Optional[str] = Query(None, description="Alternative state_id parameter"),
    disaster_type: Optional[str] = Query(None, description="Filter by disaster type (e.g. flood, cyclone, landslide)"),
    type: Optional[str] = Query(None, description="Alias for disaster_type"),
    severity: Optional[str] = Query(None, description="Filter by severity: critical, high, medium, low, warning"),
    status: Optional[str] = Query(None, description="Filter by status: active, monitoring, resolved, or all"),
    district: Optional[str] = Query(None, description="Filter by district name or substring"),
    time_range: Optional[str] = Query(None, description="Time range filter: live, 6h, 24h, 7d, all"),
    test_mode: bool = Query(False, description="Explicit test mode flag. If false, returns strictly real records or 0."),
):
    """
    Returns live disaster events for the given state.
    Strict rule: Returns zero records when there are no active disasters in storage,
    unless test_mode=True is explicitly specified.
    """
    resolved_state = state_id or state or "andhra_pradesh"
    selected_type = disaster_type or type

    disasters = emergency_service.get_disasters(
        state=resolved_state,
        disaster_type=selected_type,
        severity=severity,
        status=status,
        district=district,
        time_range=time_range,
        test_mode=test_mode,
    )

    return EmergencyDisasterListResponse(
        total=len(disasters),
        state=get_state_key(resolved_state),
        disasters=disasters,
        items=disasters,
    )

@router.get(
    "/disasters/{disaster_id}",
    response_model=EmergencyDisaster,
    summary="Get Single Disaster Event by ID"
)
async def get_disaster_by_id(disaster_id: str):
    item = emergency_service.get_disaster_by_id(disaster_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency disaster with ID '{disaster_id}' not found."
        )
    return item

@router.post(
    "/disasters",
    response_model=EmergencyDisaster,
    status_code=status.HTTP_201_CREATED,
    summary="Register a Verified Emergency Disaster"
)
async def create_emergency_disaster(payload: EmergencyDisasterCreate):
    return emergency_service.create_disaster(payload)

@router.delete(
    "/disasters/{disaster_id}",
    summary="Remove a Disaster Event"
)
async def delete_emergency_disaster(disaster_id: str):
    success = emergency_service.delete_disaster(disaster_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disaster '{disaster_id}' not found."
        )
    return {"status": "success", "message": f"Disaster '{disaster_id}' removed."}
