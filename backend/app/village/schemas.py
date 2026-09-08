from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class SectorHazardDetail(BaseModel):
    sector: str = Field(..., description="Cardinal sector: NORTH, EAST, SOUTH, WEST")
    area_sqkm: float = Field(..., description="Calculated area of sector in km²")
    area_pct: float = Field(..., description="Percentage of village total area")
    priority: str = Field(..., description="VERY HIGH, HIGH, MODERATE, LOW, INSUFFICIENT DATA")
    priority_reason: str = Field(..., description="Deterministic plain-English rationale for sector priority")
    flood_mean_recurrence_pct: Optional[float] = None
    flood_max_recurrence_pct: Optional[float] = None
    flood_area_affected_pct: Optional[float] = None
    flood_score: Optional[float] = None
    slope_mean_degrees: Optional[float] = None
    slope_max_degrees: Optional[float] = None
    slope_steep_area_pct: Optional[float] = None
    slope_score: Optional[float] = None
    cyclone_tracks_count_25km: Optional[int] = None
    cyclone_min_dist_km: Optional[float] = None
    wind_basic_speed_ms: Optional[float] = None
    wind_zone: Optional[str] = None
    sector_hazard_score: float = Field(..., description="Normalized composite sector hazard score in [0, 1]")
    impact_rank: Optional[int] = Field(None, description="Deterministic hazard impact ranking: 1 (highest impact) to 4 (safest)")
    geometry_geojson: Optional[Dict[str, Any]] = Field(None, description="EPSG:4326 GeoJSON Polygon geometry for sector")

class VillageGeometryResponse(BaseModel):
    village_code: int
    village_name: str
    mandal_name: str
    district_name: str
    village_area_sqkm: float
    centroid_lat: float
    centroid_lon: float
    village_boundary_geojson: Dict[str, Any]
    sectors_geojson: Dict[str, Any]
    crs: str = "EPSG:4326"

class VillageHazardResponse(BaseModel):
    village_code: int
    village_name: str
    mandal_code: str
    mandal_name: str
    district_name: str
    district_code: str
    population_total: int
    households: int
    population_0_6: Optional[int] = None
    population_sc: Optional[int] = None
    population_st: Optional[int] = None
    workers: Optional[int] = None
    non_workers: Optional[int] = None
    village_area_sqkm: float
    centroid_lat: float
    centroid_lon: float
    disaster_type: str = "all"
    dominant_hazard: str
    overall_hazard_score: float
    relocation_priority: str
    flood_summary: Dict[str, Any]
    slope_summary: Dict[str, Any]
    cyclone_summary: Dict[str, Any]
    wind_summary: Dict[str, Any]
    sectors: List[SectorHazardDetail]
    area_preservation_verified: bool
    data_provenance_note: str

class VillageScenarioRequest(BaseModel):
    hazard_increase: float = Field(0.0, ge=0.0, le=10.0, description="What-if hazard sensitivity increase in [0, 10]")

class VillageScenarioResponse(BaseModel):
    village_code: int
    village_name: str
    baseline_hazard_score: float
    scenario_hazard_increase: float
    simulated_hazard_score: float
    simulated_relocation_priority: str
    priority_shifted: bool
    simulated_population_at_risk: int
    disclaimer: str = "SCENARIO SIMULATION — NOT A FORECAST"
    explanation: str
    sector_simulations: List[Dict[str, Any]]

class VillageRelocationCandidate(BaseModel):
    center_name: str
    mandal_name: str
    district_name: str
    distance_km: float
    capacity_condition: str
    safety_status: str
    accessibility_status: str
    suitability_score: float
    suitability_tier: str
    why_recommended: str
    closer_candidate_rejection_reason: Optional[str] = None
    rank: int = 1
    proximity_category: str = "REGIONAL FALLBACK"
    location_tier: Optional[str] = Field(None, description="IN_VILLAGE, SAME_MANDAL, or OUTSIDE_MANDAL")
    rejected_closer_candidates: Optional[List[Dict[str, Any]]] = None
    capacity_total: Optional[int] = None
    capacity_available: Optional[int] = None
    intensity: Optional[str] = None
    affected_sector: Optional[str] = None
    facility_id: Optional[str] = None
    facility_type: Optional[str] = None
    public_status: Optional[str] = None
    capacity_status: Optional[str] = None
    usable_area_sq_m: Optional[float] = None
    source: Optional[str] = None
    source_date: Optional[str] = None
    verification_status: Optional[str] = None
    distance_from_sector_km: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class VillageRelocationResponse(BaseModel):
    village_code: int
    village_name: str
    origin_mandal_name: str
    origin_district_name: str
    total_candidates_evaluated: int
    recommended_centers: List[VillageRelocationCandidate]
    soft_distance_notice: str
    governance_disclaimer: str
    nearby_candidate_found: bool = False
    fallback_notice: Optional[str] = None
    message: Optional[str] = None
    planning_intensity: Optional[str] = "high"
    affected_sector: Optional[str] = None

class VillagePoiItem(BaseModel):
    osm_id: str
    name: str
    category: str
    filter_category: str
    subcategory: str
    latitude: float
    longitude: float
    is_inside: bool
    sector: Optional[str] = None
    sector_priority: Optional[str] = None
    distance_km: float = 0.0
    direction: Optional[str] = None
    source: str = "OpenStreetMap"
    address: Optional[str] = None
    opening_hours: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    emergency_verified: bool = False

class VillagePoiCategorySummary(BaseModel):
    category: str
    count: int

class VillagePoiResponse(BaseModel):
    village_code: int
    village_name: str
    mandal_name: str
    district_name: str
    search_radius_km: float
    total_pois: int
    inside_count: int
    nearby_count: int
    categories_summary: List[VillagePoiCategorySummary]
    pois: List[VillagePoiItem]
    source: str = "OpenStreetMap"
    retrieval_timestamp: str
    disclaimer: str

