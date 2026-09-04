from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from app.services.gis_service import gis_service

router = APIRouter(prefix="/gis", tags=["GIS"])

@router.get("/districts", summary="Get 26 Andhra Pradesh District Vector Boundaries")
async def get_districts() -> Dict[str, Any]:
    """
    Returns the standardized 26-district GeoJSON FeatureCollection for Andhra Pradesh.
    - Sourced from official AP Reorganization Gazette notifications (April 4, 2022).
    - CRS: EPSG:4326 (WGS84).
    """
    try:
        return gis_service.get_districts_geojson()
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mandals", summary="Get Andhra Pradesh Mandal Boundaries")
async def get_mandals(
    district_id: Optional[str] = Query(
        None,
        description="Optional filter by current 26-district identifier (e.g. 'alluri_sitharama_raju', 'anakapalli')"
    )
) -> Dict[str, Any]:
    """
    Returns the mandal boundaries GeoJSON FeatureCollection.
    Each feature is enriched with modern 26-district parentage (current_district_id, current_district_name).
    """
    try:
        return gis_service.get_mandals_geojson(district_id=district_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
