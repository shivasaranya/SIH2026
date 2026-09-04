from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class MandalHazardExposureItem(BaseModel):
    mandal_id: str
    mandal_name: str
    current_district_id: str
    current_district_name: str
    mandal_area_sqkm: float
    # Flood
    mean_water_recurrence_pct: float
    max_water_recurrence_pct: float
    area_recurrence_ge_10_sqkm: float
    pct_area_recurrence_ge_10: float
    flood_exposure_score: float
    # Cyclone
    cyclone_tracks_50km_count: int
    distinct_storms_50km_count: int
    direct_landfall_tracks_50km_count: int
    distance_to_nearest_track_km: float
    track_density_per_1000sqkm: float
    cyclone_exposure_score: float
    # Wind
    basic_wind_speed_m_s: float
    risk_zone: str
    wind_exposure_score: float
    # Topography
    mean_elevation_m: float
    max_elevation_m: float
    mean_slope_deg: float
    pct_area_slope_gt_25: float
    area_slope_gt_25_sqkm: float
    steep_slope_constraint_score: float
    # Composite
    multi_hazard_exposure_index: float
    storm_surge_included: bool
    data_quality_flag: str
    processing_date: str


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
