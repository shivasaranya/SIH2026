from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from app.services.gis_service import gis_service

router = APIRouter(prefix="/gis", tags=["GIS"])

@router.get("/districts", summary="Get State District Vector Boundaries")
async def get_districts(
    state_id: Optional[str] = Query(None, description="State identifier (e.g. 'andhra_pradesh', 'gujarat', 'odisha')"),
    state: Optional[str] = Query(None, description="State identifier alias (e.g. 'ap', 'gujarat')")
) -> Dict[str, Any]:
    """
    Returns the standardized district GeoJSON FeatureCollection for the selected state.
    CRS: EPSG:4326 (WGS84).
    """
    try:
        resolved = state_id or state or "andhra_pradesh"
        print(f"[GIS API] get_districts called with state_id='{state_id}', state='{state}' -> resolved='{resolved}'")
        return gis_service.get_districts_geojson(state_id=resolved)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mandals", summary="Get Administrative Unit Boundaries (Mandals / Talukas / Blocks)")
async def get_mandals(
    district_id: Optional[str] = Query(
        None,
        description="Optional filter by district identifier"
    ),
    state_id: Optional[str] = Query(None, description="State identifier"),
    state: Optional[str] = Query(None, description="State identifier alias")
) -> Dict[str, Any]:
    """
    Returns the administrative unit boundaries GeoJSON FeatureCollection.
    """
    try:
        return gis_service.get_mandals_geojson(district_id=district_id, state_id=state_id or state or "andhra_pradesh")
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
