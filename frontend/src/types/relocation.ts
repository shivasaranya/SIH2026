export interface MandalRelocationItem {
  relocation_priority_rank: number | null;
  mandal_id: string;
  mandal_name: string;
  current_district_id: string;
  current_district_name: string;
  mandal_area_sqkm: number;
  population_total: number;
  priority_quadrant: string | null;

  // TOPSIS & Category
  topsis_score: number;
  relocation_priority_category: 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT-DATA';
  ranking_status: 'FULL' | 'PARTIAL' | 'INSUFFICIENT_DATA';

  // Four Orthogonal Criteria
  c1_hazard_exposure: number;
  c2_demographic_sensitivity: number;
  c3_capacity_stress: number;
  c4_accessibility_constraint: number;

  // Factor-Level Attribution
  primary_priority_factor: string;
  secondary_priority_factor: string;
  factor_contrib_hazard_pct: number;
  factor_contrib_demographic_pct: number;
  factor_contrib_capacity_pct: number;
  factor_contrib_accessibility_pct: number;
  priority_explanation: string;

  // Capacity & Host Context
  capacity_condition: string;
  primary_bottleneck: string;
  capacity_data_completeness: number;
  is_host_zone_candidate: boolean;

  // Governance
  data_quality: string;
  provenance_notes: string;
}

export interface MandalRelocationListResponse {
  total_mandals: number;
  items: MandalRelocationItem[];
}

export interface TopRelocationListResponse {
  total_returned: number;
  items: MandalRelocationItem[];
}

export interface RelocationSummaryResponse {
  total_mandals: number;
  total_mandals_ranked: number;
  mandals_very_high_priority: number;
  mandals_high_priority: number;
  mandals_moderate_priority: number;
  mandals_low_priority: number;
  mandals_insufficient_data: number;
  topsis_min_score: number;
  topsis_max_score: number;
  topsis_mean_score: number;
  ahp_consistency_ratio: number;
  host_zone_candidates_pool_count: number;
  top_10_prioritized_mandals: Array<{
    relocation_priority_rank: number;
    mandal_id: string;
    mandal_name: string;
    current_district_name: string;
    topsis_score: number;
    relocation_priority_category: string;
    primary_priority_factor: string;
  }>;
  governance_notice: string;
}

export interface AHPWeightItem {
  criterion_id: string;
  criterion_name: string;
  weight: number;
  weight_percent: number;
  saaty_scale_rationale: string;
}

export interface AHPWeightsResponse {
  criteria_count: number;
  consistency_ratio: number;
  consistency_status: string;
  weights: AHPWeightItem[];
  pairwise_matrix: number[][];
  methodology_notes: string;
}

export interface RelocationFactorItem {
  mandal_id: string;
  mandal_name: string;
  current_district_name: string;
  relocation_priority_rank: number | null;
  topsis_score: number;
  relocation_priority_category: string;
  primary_priority_factor: string;
  secondary_priority_factor: string;
  factor_contrib_hazard_pct: number;
  factor_contrib_demographic_pct: number;
  factor_contrib_capacity_pct: number;
  factor_contrib_accessibility_pct: number;
  c1_hazard_exposure: number;
  c2_demographic_sensitivity: number;
  c3_capacity_stress: number;
  c4_accessibility_constraint: number;
}

export interface RelocationFactorContributionsResponse {
  total_mandals: number;
  items: RelocationFactorItem[];
}
