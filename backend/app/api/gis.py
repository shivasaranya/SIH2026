from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from app.services.gis_service import gis_service

router = APIRouter(prefix="/gis", tags=["GIS"])

@router.get("/districts", summary="Get State District Vector Boundaries")
async def get_districts(
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh' or 'tamil_nadu')")
) -> Dict[str, Any]:
    """
    Returns standardized district GeoJSON FeatureCollection for the selected state.
    - Andhra Pradesh: 26 districts.
    - Tamil Nadu: 38 districts.
    - CRS: EPSG:4326 (WGS84).
    """
    try:
        return gis_service.get_districts_geojson(state_id=state_id or "andhra_pradesh")
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mandals", summary="Get State Administrative Unit Boundaries (Mandals / Taluks)")
async def get_mandals(
    district_id: Optional[str] = Query(
        None,
        description="Optional filter by district identifier"
    ),
    state_id: Optional[str] = Query("andhra_pradesh", description="State identifier ('andhra_pradesh' or 'tamil_nadu')")
) -> Dict[str, Any]:
    """
    Returns the administrative unit boundaries GeoJSON FeatureCollection.
    - Andhra Pradesh: 696 mandals.
    - Tamil Nadu: 302 taluks.
    """
    try:
        return gis_service.get_mandals_geojson(district_id=district_id, state_id=state_id or "andhra_pradesh")
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
