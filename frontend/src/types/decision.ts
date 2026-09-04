export interface CapacityGapAssessment {
  mandal_id: string;
  mandal_name: string;
  district_name: string;
  planning_population: number;

  shelter_capacity_verified: number | null;
  shelter_deficit_persons: number | null;
  shelter_gap_status: string;
  shelter_note: string;

  health_beds_normative: number | null;
  health_beds_deficit: number | null;
  health_gap_status: string;
  health_note: string;

  safe_area_sqkm: number | null;
  safe_area_m2_per_person: number | null;
  safe_area_deficit_sqkm: number | null;
  safe_area_gap_status: string;
  safe_area_note: string;

  water_sanitation_adequacy: number | null;
  water_sanitation_gap_status: string;
  water_note: string;

  road_accessibility_score: number | null;
  road_accessibility_gap_status: string;
  road_note: string;

  overall_gap_summary: string;
  data_limitations_notice: string;
}

export interface ActionPlanItem {
  action_id: string;
  horizon: 'IMMEDIATE_EMERGENCY' | 'SHORT_TERM_MITIGATION' | 'LONG_TERM_PLANNING';
  category: string;
  title: string;
  description: string;
  trigger_condition: string;
  priority_level: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  responsible_agency: string;
}

export interface ActionPlanResponse {
  mandal_id: string;
  mandal_name: string;
  district_name: string;
  relocation_priority_category: string;
  primary_bottleneck: string;
  secondary_bottleneck: string;
  immediate_actions: ActionPlanItem[];
  short_term_actions: ActionPlanItem[];
  long_term_actions: ActionPlanItem[];
  governance_disclaimer: string;
}

export interface SourceHostComparisonResponse {
  source_mandal: Record<string, any>;
  candidate_host: Record<string, any>;
  distance_km: number;
  key_advantages: string[];
  key_concerns_or_bottlenecks: string[];
  missing_or_unverified_information: string[];
  human_validation_notice: string;
}

export interface ActionDashboardSummary {
  total_mandals: number;
  very_high_priority_count: number;
  high_priority_count: number;
  capacity_constrained_count: number;
  capacity_severely_constrained_count: number;
  candidate_host_zones_count: number;
  insufficient_data_count: number;
  top_action_mandals: Array<Record<string, any>>;
  top_capacity_bottlenecks: Record<string, number>;
  top_candidate_hosts: Array<Record<string, any>>;
  governance_disclaimer: string;
}
