from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class MandalHazardExposureItem(BaseModel):
    mandal_id: str
    mandal_name: str
    current_district_id: str
    current_district_name: str
    mandal_area_sqkm: float
    # Flood
    mean_water_recurrence_pct: Optional[float] = 0.0
    max_water_recurrence_pct: Optional[float] = 0.0
    area_recurrence_ge_10_sqkm: Optional[float] = 0.0
    pct_area_recurrence_ge_10: Optional[float] = 0.0
    flood_exposure_score: float = 0.0
    # Cyclone
    cyclone_tracks_50km_count: Optional[int] = 0
    distinct_storms_50km_count: Optional[int] = 0
    direct_landfall_tracks_50km_count: Optional[int] = 0
    distance_to_nearest_track_km: Optional[float] = 0.0
    track_density_per_1000sqkm: Optional[float] = 0.0
    cyclone_exposure_score: float = 0.0
    # Wind
    basic_wind_speed_m_s: Optional[float] = 50.0
    risk_zone: Optional[str] = "Zone A"
    wind_exposure_score: float = 0.0
    # Topography
    mean_elevation_m: Optional[float] = 0.0
    max_elevation_m: Optional[float] = 0.0
    mean_slope_deg: Optional[float] = 0.0
    pct_area_slope_gt_25: Optional[float] = 0.0
    area_slope_gt_25_sqkm: Optional[float] = 0.0
    steep_slope_constraint_score: Optional[float] = 0.0
    slope_exposure_score: Optional[float] = 0.0
    # Composite
    multi_hazard_exposure_index: float = 0.0
    storm_surge_included: bool = False
    data_quality_flag: Optional[str] = "VERIFIED_COMPLETE"
    processing_date: Optional[str] = "2026-09-07"


class MandalExposureListResponse(BaseModel):
    total_mandals: int
    items: List[MandalHazardExposureItem]


class HazardSummaryResponse(BaseModel):
    total_mandals: int
    mean_exposure_index: float
    min_exposure_index: float
    max_exposure_index: float
    exposure_distribution: Dict[str, int]
    top_exposed_mandals: List[Dict[str, Any]]
    storm_surge_included: bool
    storm_surge_exclusion_reason: str
    methodology_note: str
