from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SimulationParameters(BaseModel):
    hazard_change: float = Field(
        default=0.0,
        ge=-0.30,
        le=0.50,
        description="Hazard intensity multiplier (-0.30 to +0.50). Sensitivity proxy for multi-hazard severity."
    )
    population_change: float = Field(
        default=0.0,
        ge=-0.20,
        le=0.30,
        description="Population pressure multiplier (-0.20 to +0.30). Modifies in-situ capacity demand."
    )
    capacity_change: float = Field(
        default=0.0,
        ge=-0.30,
        le=0.50,
        description="Capacity stress multiplier (-0.30 to +0.50). Modifies health, shelter, and safe land bottleneck strain."
    )
    accessibility_change: float = Field(
        default=0.0,
        ge=-0.50,
        le=0.50,
        description="Evacuation accessibility multiplier (-0.50 to +0.50). Positive values reduce evacuation constraint; negative values increase constraint."
    )


class SimulationPresetItem(BaseModel):
    preset_id: str
    preset_name: str
    description: str
    parameters: SimulationParameters
    disclaimer: str


class SimulationPresetsResponse(BaseModel):
    presets: List[SimulationPresetItem]


class MandalSimulationComparisonItem(BaseModel):
    mandal_id: str
    mandal_name: str
    current_district_id: str
    current_district_name: str
    ranking_status: str

    # Baseline Profile
    baseline_topsis_score: float
    baseline_rank: Optional[float] = None
    baseline_category: str
    baseline_primary_factor: str

    # Scenario Profile
    scenario_topsis_score: float
    scenario_rank: Optional[float] = None
    scenario_category: str
    scenario_primary_factor: str
    scenario_secondary_factor: str

    # Delat Metrics
    score_change: float
    rank_change: Optional[float] = None  # Positive means moved UP in relocation priority
    category_change: str  # 'INCREASED', 'DECREASED', 'UNCHANGED'
    change_direction: str  # 'PRIORITY INCREASED', 'PRIORITY DECREASED', 'NO SIGNIFICANT CHANGE'

    # Scenario Four Criteria
    scenario_c1_hazard: float
    scenario_c2_demography: float
    scenario_c3_capacity: float
    scenario_c4_accessibility: float

    # Scenario Factor Contribution Percentages
    factor_contrib_hazard_pct: float
    factor_contrib_demographic_pct: float
    factor_contrib_capacity_pct: float
    factor_contrib_accessibility_pct: float

    scenario_explanation: str


class SimulationSummaryMetrics(BaseModel):
    total_mandals: int
    total_mandals_ranked: int
    mean_baseline_score: float
    mean_scenario_score: float
    score_change_mean: float

    # Movement Counts
    mandals_priority_increased: int  # score_change > +0.02
    mandals_priority_decreased: int  # score_change < -0.02
    mandals_no_significant_change: int

    # Rank Movements
    mandals_rank_improved: int  # Rank moved higher (more critical)
    mandals_rank_worsened: int  # Rank moved lower (less critical)
    mandals_rank_unchanged: int

    # Category Shifts
    category_shifts: Dict[str, Dict[str, int]]
    baseline_category_distribution: Dict[str, int]
    scenario_category_distribution: Dict[str, int]
    mandals_entered_very_high: int
    mandals_left_very_high: int

    # Extreme Shifts
    max_score_increase: Dict[str, Any]
    max_score_decrease: Dict[str, Any]
    max_rank_up: Dict[str, Any]
    max_rank_down: Dict[str, Any]


class SimulationRunResponse(BaseModel):
    parameters: SimulationParameters
    summary: SimulationSummaryMetrics
    top_10_baseline: List[Dict[str, Any]]
    top_10_scenario: List[Dict[str, Any]]
    top_10_increased_priority: List[Dict[str, Any]]
    top_10_decreased_priority: List[Dict[str, Any]]
    mandals: List[MandalSimulationComparisonItem]
    governance_disclaimer: str
