from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class MandalCapacityItem(BaseModel):
    mandal_id: str
    mandal_name: str
    current_district_id: str
    current_district_name: str
    mandal_area_sqkm: float
    population_total: int

    # Shelter Capacity (Direct)
    shelter_count: int
    verified_shelter_capacity_persons: int
    unknown_capacity_shelter_count: int
    shelter_capacity_per_1000: float
    shelter_adequacy_score: float
    shelter_capacity_status: str

    # School Emergency Space (Proxy - Unavailable)
    school_space_capacity_proxy_persons: Optional[float] = None
    school_space_data_status: str

    # Health Capacity (Normative Baseline)
    actual_health_beds: Optional[float] = None
    normative_health_capacity_baseline: int
    normative_beds_per_1000: float
    health_adequacy_score: float
    health_capacity_status: str

    # Water & Sanitation (Adequacy Proxy)
    water_access_percent: float
    sanitation_coverage_percent: float
    water_sanitation_adequacy: float
    water_sanitation_score: float
    water_sanitation_status: str

    # Evacuation Accessibility (Accessibility Proxy)
    road_length_km: float
    road_density_km_per_km2: float
    road_accessibility_score: float
    road_accessibility_status: str

    # Safe Habitable Area (Spatial Constraint)
    safe_area_sqkm: float
    safe_area_fraction: float
    safe_area_m2_per_person: float
    safe_area_score: float
    safe_area_status: str

    # Governance & Quality
    data_quality: str
    provenance_notes: str


class MandalCapacityListResponse(BaseModel):
    total_mandals: int
    items: List[MandalCapacityItem]


class CapacitySummaryResponse(BaseModel):
    total_mandals: int
    total_designated_shelters: int
    total_verified_shelter_capacity_persons: int
    mandals_with_designated_shelters: int
    mandals_without_designated_shelters: int
    mean_shelter_capacity_per_1000_in_shelter_mandals: float
    total_normative_health_beds_iphs: int
    mean_normative_beds_per_1000: float
    mean_water_access_percent: float
    mean_sanitation_coverage_percent: float
    mean_water_sanitation_adequacy: float
    total_evacuation_road_length_km: float
    mean_road_density_km_per_km2: float
    mean_safe_area_fraction: float
    mean_safe_area_m2_per_person: float
    top_shelter_mandals: List[Dict[str, Any]]
    methodology_note: str
    classification_standards: Dict[str, str]


# Phase 3C Schemas: Adequacy, Bottlenecks & Host Zones

class MandalCapacityAdequacyItem(BaseModel):
    mandal_id: str
    mandal_name: str
    current_district_id: str
    current_district_name: str
    mandal_area_sqkm: float
    population_total: int

    # Shelter Adequacy
    shelter_count: int
    verified_shelter_capacity_persons: int
    shelter_coverage_ratio: float
    shelter_deficit_persons: int
    shelter_adequacy: Optional[float] = None
    shelter_status: str

    # Health Adequacy
    normative_health_capacity_baseline: int
    normative_beds_per_1000: float
    health_adequacy: float
    health_status: str

    # Water & Sanitation Adequacy
    water_access_percent: float
    sanitation_coverage_percent: float
    water_sanitation_adequacy: float
    water_sanitation_status: str

    # Evacuation Road Accessibility
    road_length_km: float
    road_density_km_per_km2: float
    road_accessibility_score: float
    road_access_status: str

    # Safe Habitable Area Constraint
    safe_area_sqkm: float
    safe_area_fraction: float
    safe_area_m2_per_person: float
    safe_area_adequacy: float
    safe_area_status: str

    # Data Completeness & Bottlenecks
    available_component_count: int
    capacity_data_completeness: float
    primary_bottleneck: str
    secondary_bottleneck: Optional[str] = "N/A"
    bottleneck_confidence: str
    capacity_condition: str
    is_host_zone_candidate: bool


    # Governance
    data_quality: str
    provenance_notes: str


class MandalCapacityAdequacyListResponse(BaseModel):
    total_mandals: int
    items: List[MandalCapacityAdequacyItem]


class CapacityAdequacySummaryResponse(BaseModel):
    total_mandals: int
    condition_breakdown: Dict[str, int]
    primary_bottleneck_breakdown: Dict[str, int]
    host_zone_candidates_pool_count: int
    mean_data_completeness: float
    shelter_coverage_breakdown: Dict[str, int]
    governance_notice: str


class MandalBottleneckItem(BaseModel):
    mandal_id: str
    mandal_name: str
    current_district_id: str
    current_district_name: str
    population_total: int
    capacity_condition: str
    primary_bottleneck: str
    secondary_bottleneck: Optional[str] = "N/A"
    bottleneck_confidence: str
    available_component_count: int
    capacity_data_completeness: float
    shelter_adequacy: Optional[float] = None
    health_adequacy: float
    water_sanitation_adequacy: float
    road_accessibility_score: float

    safe_area_adequacy: float


class MandalBottlenecksListResponse(BaseModel):
    total_mandals: int
    items: List[MandalBottleneckItem]


class HostZoneCandidateItem(BaseModel):
    source_mandal_id: str
    source_mandal_name: str
    candidate_mandal_id: str
    candidate_mandal_name: str
    distance_km: float
    candidate_hazard_exposure: float
    candidate_vulnerability: float
    candidate_capacity_condition: str
    candidate_capacity_data_completeness: float
    candidate_shelter_adequacy: Optional[float] = None
    candidate_water_sanitation_adequacy: float
    candidate_road_accessibility: float
    candidate_safe_area_fraction: float
    candidate_district_name: Optional[str] = None
    safe_habitable_land_pct: Optional[float] = None
    available_headroom_persons: Optional[int] = None
    composite_score: Optional[float] = None
    suitability_explanation: Optional[str] = None
    host_candidate_reason: str
    host_candidate_status: str

    # AP Relocation Logic Upgrade Enriched Attributes
    candidate_district_id: Optional[str] = None
    candidate_district_name: Optional[str] = None
    source_district_id: Optional[str] = None
    source_district_name: Optional[str] = None
    administrative_relation: Optional[str] = None  # SAME_MANDAL, ADJACENT_MANDAL, FARTHER_MANDAL, DIFFERENT_DISTRICT
    proximity_tier: Optional[int] = None  # 1: Same mandal, 2: Adjacent mandal same district, 3: Farther mandal same district, 4: Different district
    candidate_shelter_capacity_persons: Optional[int] = None
    candidate_shelter_count: Optional[int] = None
    candidate_beds_per_1000: Optional[float] = None
    candidate_health_adequacy: Optional[float] = None
    candidate_water_access_pct: Optional[float] = None
    candidate_sanitation_coverage_pct: Optional[float] = None
    candidate_safe_area_m2_per_person: Optional[float] = None
    candidate_road_access_status: Optional[str] = None
    relocation_suitability_score: Optional[float] = None
    relocation_suitability_rank: Optional[int] = None
    suitability_tier: Optional[str] = None  # RECOMMENDED, ALTERNATIVE, FALLBACK, REJECTED, INSUFFICIENT-DATA
    is_safe: Optional[bool] = None
    is_capacity_adequate: Optional[bool] = None
    is_accessible: Optional[bool] = None
    rejection_reason: Optional[str] = None
    recommendation_reason: Optional[str] = None
    recommendation_explanation: Optional[str] = None


class HostZoneCandidateListResponse(BaseModel):
    source_mandal_id: str
    total_candidates: int
    candidates: List[HostZoneCandidateItem]
    governance_disclaimer: str

    # Contextual Origin & AP Logic Metadata
    source_mandal_name: Optional[str] = None
    source_district_id: Optional[str] = None
    source_district_name: Optional[str] = None
    source_hazard_exposure: Optional[float] = None
    source_capacity_condition: Optional[str] = None
    source_population: Optional[int] = None
    recommended_candidates: Optional[List[HostZoneCandidateItem]] = None
    rejected_candidates: Optional[List[HostZoneCandidateItem]] = None
    soft_preference_notice: Optional[str] = None
