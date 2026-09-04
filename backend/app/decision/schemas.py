from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CapacityGapAssessment(BaseModel):
    mandal_id: str
    mandal_name: str
    district_name: str
    planning_population: int

    # Shelter Capacity Gap
    shelter_capacity_verified: Optional[int] = None
    shelter_deficit_persons: Optional[int] = None
    shelter_gap_status: str
    shelter_note: str

    # Health Bed Capacity Gap (IPHS 2022 Normative Standard)
    health_beds_normative: Optional[float] = None
    health_beds_deficit: Optional[float] = None
    health_gap_status: str
    health_note: str

    # Safe Land Capacity Gap (Sphere 45m²/person Standard)
    safe_area_sqkm: Optional[float] = None
    safe_area_m2_per_person: Optional[float] = None
    safe_area_deficit_sqkm: Optional[float] = None
    safe_area_gap_status: str
    safe_area_note: str

    # Water & Sanitation Adequacy Gap
    water_sanitation_adequacy: Optional[float] = None
    water_sanitation_gap_status: str
    water_note: str

    # Evacuation Road Accessibility Constraint
    road_accessibility_score: Optional[float] = None
    road_accessibility_gap_status: str
    road_note: str

    overall_gap_summary: str
    data_limitations_notice: str


class ActionPlanItem(BaseModel):
    action_id: str
    horizon: str  # 'IMMEDIATE_EMERGENCY', 'SHORT_TERM_MITIGATION', 'LONG_TERM_PLANNING'
    category: str  # 'EVACUATION_ACCESS', 'SHELTER', 'HEALTH_MEDICAL', 'WATER_SANITATION', 'SAFE_LAND_SITING', 'FEASIBILITY_STUDY'
    title: str
    description: str
    trigger_condition: str
    priority_level: str  # 'CRITICAL', 'HIGH', 'MEDIUM'
    responsible_agency: str


class ActionPlanResponse(BaseModel):
    mandal_id: str
    mandal_name: str
    district_name: str
    relocation_priority_category: str
    primary_bottleneck: str
    secondary_bottleneck: str
    immediate_actions: List[ActionPlanItem]
    short_term_actions: List[ActionPlanItem]
    long_term_actions: List[ActionPlanItem]
    governance_disclaimer: str


class SourceHostComparisonResponse(BaseModel):
    source_mandal: Dict[str, Any]
    candidate_host: Dict[str, Any]
    distance_km: float
    key_advantages: List[str]
    key_concerns_or_bottlenecks: List[str]
    missing_or_unverified_information: List[str]
    human_validation_notice: str


class ActionDashboardSummary(BaseModel):
    total_mandals: int
    very_high_priority_count: int
    high_priority_count: int
    capacity_constrained_count: int
    capacity_severely_constrained_count: int
    candidate_host_zones_count: int
    insufficient_data_count: int
    top_action_mandals: List[Dict[str, Any]]
    top_capacity_bottlenecks: Dict[str, int]
    top_candidate_hosts: List[Dict[str, Any]]
    governance_disclaimer: str
