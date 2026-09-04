export interface SimulationParameters {
  hazard_change: number;
  population_change: number;
  capacity_change: number;
  accessibility_change: number;
}

export interface SimulationPresetItem {
  preset_id: string;
  preset_name: string;
  description: string;
  parameters: SimulationParameters;
  disclaimer: string;
}

export interface SimulationPresetsResponse {
  presets: SimulationPresetItem[];
}

export interface MandalSimulationComparisonItem {
  mandal_id: string;
  mandal_name: string;
  current_district_id: string;
  current_district_name: string;
  ranking_status: string;

  // Baseline Profile
  baseline_topsis_score: number;
  baseline_rank: number | null;
  baseline_category: string;
  baseline_primary_factor: string;

  // Scenario Profile
  scenario_topsis_score: number;
  scenario_rank: number | null;
  scenario_category: string;
  scenario_primary_factor: string;
  scenario_secondary_factor: string;

  // Delta Metrics
  score_change: number;
  rank_change: number | null;
  category_change: 'INCREASED' | 'DECREASED' | 'UNCHANGED';
  change_direction: 'PRIORITY INCREASED' | 'PRIORITY DECREASED' | 'NO SIGNIFICANT CHANGE';

  // Scenario Criteria
  scenario_c1_hazard: number;
  scenario_c2_demography: number;
  scenario_c3_capacity: number;
  scenario_c4_accessibility: number;

  // Scenario Factor Contributions
  factor_contrib_hazard_pct: number;
  factor_contrib_demographic_pct: number;
  factor_contrib_capacity_pct: number;
  factor_contrib_accessibility_pct: number;

  scenario_explanation: string;
}

export interface SimulationSummaryMetrics {
  total_mandals: number;
  total_mandals_ranked: number;
  mean_baseline_score: number;
  mean_scenario_score: number;
  score_change_mean: number;

  mandals_priority_increased: number;
  mandals_priority_decreased: number;
  mandals_no_significant_change: number;

  mandals_rank_improved: number;
  mandals_rank_worsened: number;
  mandals_rank_unchanged: number;

  category_shifts: Record<string, Record<string, number>>;
  baseline_category_distribution: Record<string, number>;
  scenario_category_distribution: Record<string, number>;
  mandals_entered_very_high: number;
  mandals_left_very_high: number;

  max_score_increase: {
    mandal_id: string;
    mandal_name: string;
    district_name: string;
    score_change: number;
    baseline_score: number;
    scenario_score: number;
  };
  max_score_decrease: {
    mandal_id: string;
    mandal_name: string;
    district_name: string;
    score_change: number;
    baseline_score: number;
    scenario_score: number;
  };
  max_rank_up: {
    mandal_id: string;
    mandal_name: string;
    district_name: string;
    rank_change: number;
    baseline_rank: number;
    scenario_rank: number;
  };
  max_rank_down: {
    mandal_id: string;
    mandal_name: string;
    district_name: string;
    rank_change: number;
    baseline_rank: number;
    scenario_rank: number;
  };
}

export interface SimulationRunResponse {
  parameters: SimulationParameters;
  summary: SimulationSummaryMetrics;
  top_10_baseline: Array<Record<string, any>>;
  top_10_scenario: Array<Record<string, any>>;
  top_10_increased_priority: Array<Record<string, any>>;
  top_10_decreased_priority: Array<Record<string, any>>;
  mandals: MandalSimulationComparisonItem[];
  governance_disclaimer: string;
}
