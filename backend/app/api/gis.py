from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from app.services.gis_service import gis_service

router = APIRouter(prefix="/gis", tags=["GIS"])

@router.get("/districts", summary="Get State District Vector Boundaries")
async def get_districts(
    state: Optional[str] = Query(None, description="State identifier (e.g. 'ap', 'gujarat')")
) -> Dict[str, Any]:
    """
    Returns the standardized district GeoJSON FeatureCollection for the selected state.
    CRS: EPSG:4326 (WGS84).
    """
    try:
        return gis_service.get_districts_geojson(state=state)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mandals", summary="Get Administrative Unit Boundaries (Mandals / Talukas)")
async def get_mandals(
    district_id: Optional[str] = Query(
        None,
        description="Optional filter by district identifier"
    ),
    state: Optional[str] = Query(None, description="State identifier (e.g. 'ap', 'gujarat')")
) -> Dict[str, Any]:
    """
    Returns the mandal / taluka boundaries GeoJSON FeatureCollection for the selected state.
    """
    try:
        return gis_service.get_mandals_geojson(district_id=district_id, state=state)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
