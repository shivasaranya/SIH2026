from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.services.village_spatial_service import village_spatial_service
from app.village.schemas import (
    VillageGeometryResponse,
    VillageHazardResponse,
    VillageScenarioResponse,
    VillageRelocationResponse,
)

router = APIRouter(prefix="/village", tags=["Village Spatial Hazard"])

@router.get("/{village_id}", response_model=VillageHazardResponse)
async def get_village_summary(
    village_id: int,
    disaster_type: str = Query("all", description="Disaster filter: flood, cyclone, wind, slope, all")
):
    """Retrieve full spatial hazard and demographic analysis for a selected village."""
    res = village_spatial_service.get_village_hazards(village_id, disaster_type=disaster_type)
    if res is None:
        raise HTTPException(status_code=404, detail=f"Village with code {village_id} not found.")
    return res

@router.get("/{village_id}/geometry", response_model=VillageGeometryResponse)
async def get_village_geometry(village_id: int):
    """Retrieve Leaflet-compatible GeoJSON boundaries and four cardinal sectors (N/E/S/W)."""
    res = village_spatial_service.get_village_geometry(village_id)
    if res is None:
        raise HTTPException(status_code=404, detail=f"Village geometry for code {village_id} not found.")
    return res

@router.get("/{village_id}/hazards", response_model=VillageHazardResponse)
async def get_village_hazards(
    village_id: int,
    disaster_type: str = Query("all", description="Disaster filter: flood, cyclone, wind, slope, all")
):
    """Retrieve sector-by-sector real raster hazard intersections."""
    res = village_spatial_service.get_village_hazards(village_id, disaster_type=disaster_type)
    if res is None:
        raise HTTPException(status_code=404, detail=f"Village with code {village_id} not found.")
    return res

@router.get("/{village_id}/sectors")
async def get_village_sectors(
    village_id: int,
    disaster_type: str = Query("all", description="Disaster filter: flood, cyclone, wind, slope, all")
):
    """Retrieve cardinal sector geometries and hazard metrics."""
    res = village_spatial_service.get_village_hazards(village_id, disaster_type=disaster_type)
    if res is None:
        raise HTTPException(status_code=404, detail=f"Village with code {village_id} not found.")
    return {
        "village_code": res.village_code,
        "village_name": res.village_name,
        "disaster_type": res.disaster_type,
        "sectors": res.sectors,
        "area_preservation_verified": res.area_preservation_verified
    }

@router.get("/{village_id}/scenario", response_model=VillageScenarioResponse)
async def get_village_scenario(
    village_id: int,
    increase: float = Query(0.0, ge=0.0, le=10.0, description="What-if hazard sensitivity increase (0 to 10)")
):
    """Run 0–10 what-if sensitivity simulation for the selected village."""
    res = village_spatial_service.run_scenario(village_id, increase=increase)
    if res is None:
        raise HTTPException(status_code=404, detail=f"Village with code {village_id} not found.")
    return res

@router.get("/{village_id}/relocation-centers", response_model=VillageRelocationResponse)
async def get_village_relocation_centers(
    village_id: int,
    limit: int = Query(5, ge=1, le=10, description="Max recommended centers to return")
):
    """Retrieve ranked candidate host relocation centers with transparent audit rationale."""
    res = village_spatial_service.get_relocation_centers(village_id, limit=limit)
    if res is None:
        raise HTTPException(status_code=404, detail=f"Village with code {village_id} not found.")
    return res
