from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.services.decision_service import decision_service
from app.decision.schemas import (
    CapacityGapAssessment,
    ActionPlanResponse,
    SourceHostComparisonResponse,
    ActionDashboardSummary,
)

router = APIRouter(prefix="/decision", tags=["Decision & Action Planning (Phase 6)"])


@router.get("/summary", response_model=ActionDashboardSummary)
def get_decision_summary(
    state_id: Optional[str] = Query(None, description="State identifier (e.g. 'andhra_pradesh', 'gujarat')"),
    state: Optional[str] = Query(None, description="State identifier alias"),
):
    """Returns statewide executive action planning summary, bottleneck distributions, and candidate host statistics."""
    target_state = state_id or state or "andhra_pradesh"
    return decision_service.get_action_dashboard_summary(state_id=target_state, state=target_state)


@router.get("/mandal/{mandal_id}/capacity-gap", response_model=CapacityGapAssessment)
def get_mandal_capacity_gap(
    mandal_id: str,
    state_id: Optional[str] = Query(None, description="State identifier (e.g. 'andhra_pradesh', 'gujarat')"),
    state: Optional[str] = Query(None, description="State identifier alias"),
):
    """Returns transparent indicative physical capacity gap assessment for a unit (shelters, beds, safe land, water, roads)."""
    target_state = state_id or state or "andhra_pradesh"
    res = decision_service.get_capacity_gap_assessment(mandal_id, state_id=target_state, state=target_state)
    if not res:
        raise HTTPException(status_code=404, detail=f"Unit '{mandal_id}' not found in capacity database.")
    return res


@router.get("/mandal/{mandal_id}/action-plan", response_model=ActionPlanResponse)
def get_mandal_action_plan(
    mandal_id: str,
    state_id: Optional[str] = Query(None, description="State identifier (e.g. 'andhra_pradesh', 'gujarat')"),
    state: Optional[str] = Query(None, description="State identifier alias"),
):
    """Returns deterministic 3-horizon action plan (Immediate, Short-Term, Long-Term) triggered by active constraints."""
    target_state = state_id or state or "andhra_pradesh"
    res = decision_service.get_action_plan(mandal_id, state_id=target_state, state=target_state)
    if not res:
        raise HTTPException(status_code=404, detail=f"Unit '{mandal_id}' not found in relocation database.")
    return res


@router.get("/mandal/{mandal_id}/compare/{host_id}", response_model=SourceHostComparisonResponse)
def compare_source_and_host_mandal(
    mandal_id: str,
    host_id: str,
    state_id: Optional[str] = Query(None, description="State identifier (e.g. 'andhra_pradesh', 'gujarat')"),
    state: Optional[str] = Query(None, description="State identifier alias"),
):
    """Returns structured side-by-side comparative analysis between a vulnerable source unit and a candidate host zone."""
    target_state = state_id or state or "andhra_pradesh"
    res = decision_service.compare_source_and_host(mandal_id, host_id, state_id=target_state, state=target_state)
    if not res:
        raise HTTPException(status_code=404, detail=f"Comparison pair ({mandal_id}, {host_id}) could not be resolved.")
    return res
