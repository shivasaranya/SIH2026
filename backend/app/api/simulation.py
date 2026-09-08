from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.services.simulation_service import simulation_service
from app.simulation.schemas import (
    SimulationParameters,
    SimulationPresetsResponse,
    SimulationRunResponse,
    MandalSimulationComparisonItem,
)

router = APIRouter(prefix="/simulation", tags=["What-If Disaster Simulation (Phase 5)"])


@router.get("/presets", response_model=SimulationPresetsResponse)
def get_simulation_presets():
    """Returns predefined What-If sensitivity scenario presets (Baseline, Severe Hazard, Extreme Stress, Improved Preparedness)."""
    return simulation_service.get_presets()


@router.post("/run", response_model=SimulationRunResponse)
def run_what_if_simulation(
    params: SimulationParameters,
    state_id: Optional[str] = Query(None, description="State identifier (e.g. 'andhra_pradesh', 'gujarat')"),
    state: Optional[str] = Query(None, description="State identifier alias"),
):
    """Executes deterministic scenario recalculation across all units using AHP+TOPSIS."""
    target_state = state_id or state or "andhra_pradesh"
    return simulation_service.run_simulation(params, state_id=target_state, state=target_state)


@router.get("/mandal/{mandal_id}", response_model=MandalSimulationComparisonItem)
def get_mandal_simulation(
    mandal_id: str,
    hazard_change: float = Query(0.0, ge=-0.30, le=0.50, description="Hazard multiplier"),
    population_change: float = Query(0.0, ge=-0.20, le=0.30, description="Population pressure multiplier"),
    capacity_change: float = Query(0.0, ge=-0.30, le=0.50, description="Capacity stress multiplier"),
    accessibility_change: float = Query(0.0, ge=-0.50, le=0.50, description="Evacuation accessibility multiplier"),
    state_id: Optional[str] = Query(None, description="State identifier (e.g. 'andhra_pradesh', 'gujarat')"),
    state: Optional[str] = Query(None, description="State identifier alias"),
):
    """Returns baseline vs scenario comparison and deterministic explanation for a specific unit."""
    target_state = state_id or state or "andhra_pradesh"
    params = SimulationParameters(
        hazard_change=hazard_change,
        population_change=population_change,
        capacity_change=capacity_change,
        accessibility_change=accessibility_change,
    )
    res = simulation_service.get_mandal_simulation(mandal_id, params, state_id=target_state, state=target_state)
    if not res:
        raise HTTPException(status_code=404, detail=f"Unit '{mandal_id}' not found in simulation database.")
    return res
