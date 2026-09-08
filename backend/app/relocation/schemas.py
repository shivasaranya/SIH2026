from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class MandalRelocationItem(BaseModel):
    relocation_priority_rank: Optional[float] = None
    mandal_id: str
    mandal_name: str
    current_district_id: str
    current_district_name: str
    mandal_area_sqkm: float
    population_total: int
    priority_quadrant: Optional[str] = None

    # TOPSIS & Category
    topsis_score: float
    relocation_priority_category: str
    ranking_status: str

    # Four Orthogonal Criteria
    c1_hazard_exposure: float
    c2_demographic_sensitivity: float
    c3_capacity_stress: float
    c4_accessibility_constraint: float

    # Factor-Level Attribution
    primary_priority_factor: Optional[str] = "Hazard Exposure"
    secondary_priority_factor: Optional[str] = "Capacity Stress"
    factor_contrib_hazard_pct: float
    factor_contrib_demographic_pct: float
    factor_contrib_capacity_pct: float
    factor_contrib_accessibility_pct: float
    priority_explanation: Optional[str] = ""

    # Capacity & Host Context
    capacity_condition: Optional[str] = "CAPACITY-ADEQUATE"
    primary_bottleneck: Optional[str] = "health_infrastructure"
    capacity_data_completeness: Optional[float] = 1.0
    is_host_zone_candidate: Optional[bool] = False

    # Governance
    data_quality: Optional[str] = "HIGH"
    provenance_notes: Optional[str] = "Census 2011 PCA / Multi-Hazard Models"


class MandalRelocationListResponse(BaseModel):
    total_mandals: int
    items: List[MandalRelocationItem]


class TopRelocationListResponse(BaseModel):
    total_returned: int
    items: List[MandalRelocationItem]


class RelocationSummaryResponse(BaseModel):
    total_mandals: int
    total_mandals_ranked: int
    mandals_very_high_priority: int
    mandals_high_priority: int
    mandals_moderate_priority: int
    mandals_low_priority: int
    mandals_insufficient_data: int
    topsis_min_score: float
    topsis_max_score: float
    topsis_mean_score: float
    ahp_consistency_ratio: float
    host_zone_candidates_pool_count: int
    top_10_prioritized_mandals: List[Dict[str, Any]]
    governance_notice: str


class AHPWeightItem(BaseModel):
    criterion_id: str
    criterion_name: str
    weight: float
    weight_percent: float
    saaty_scale_rationale: str


class AHPWeightsResponse(BaseModel):
    criteria_count: int
    consistency_ratio: float
    consistency_status: str
    weights: List[AHPWeightItem]
    pairwise_matrix: List[List[float]]
    methodology_notes: str


class RelocationFactorItem(BaseModel):
    mandal_id: str
    mandal_name: str
    current_district_name: str
    relocation_priority_rank: Optional[float] = None
    topsis_score: float
    relocation_priority_category: str
    primary_priority_factor: Optional[str] = "Hazard Exposure"
    secondary_priority_factor: Optional[str] = "Capacity Stress"
    factor_contrib_hazard_pct: float
    factor_contrib_demographic_pct: float
    factor_contrib_capacity_pct: float
    factor_contrib_accessibility_pct: float
    c1_hazard_exposure: float
    c2_demographic_sensitivity: float
    c3_capacity_stress: float
    c4_accessibility_constraint: float


class RelocationFactorContributionsResponse(BaseModel):
    total_mandals: int
    items: List[RelocationFactorItem]
