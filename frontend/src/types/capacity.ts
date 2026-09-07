export interface MandalCapacityItem {
  mandal_id: string;
  mandal_name: string;
  current_district_id: string;
  current_district_name: string;
  mandal_area_sqkm: number;
  population_total: number;

  // Shelter Capacity (Direct)
  shelter_count: number;
  verified_shelter_capacity_persons: number;
  unknown_capacity_shelter_count: number;
  shelter_capacity_per_1000: number;
  shelter_adequacy_score: number;
  shelter_capacity_status: string;

  // School Emergency Space (Proxy - Unavailable)
  school_space_capacity_proxy_persons: number | null;
  school_space_data_status: string;

  // Health Capacity (Normative Baseline)
  actual_health_beds: number | null;
  normative_health_capacity_baseline: number;
  normative_beds_per_1000: number;
  health_adequacy_score: number;
  health_capacity_status: string;

  // Water & Sanitation (Adequacy Proxy)
  water_access_percent: number;
  sanitation_coverage_percent: number;
  water_sanitation_adequacy: number;
  water_sanitation_score: number;
  water_sanitation_status: string;

  // Evacuation Accessibility (Accessibility Proxy)
  road_length_km: number;
  road_density_km_per_km2: number;
  road_accessibility_score: number;
  road_accessibility_status: string;

  // Safe Habitable Area (Spatial Constraint)
  safe_area_sqkm: number;
  safe_area_fraction: number;
  safe_area_m2_per_person: number;
  safe_area_score: number;
  safe_area_status: string;

  // Governance & Quality
  data_quality: string;
  provenance_notes: string;
}

export interface MandalCapacityListResponse {
  total_mandals: number;
  items: MandalCapacityItem[];
}

export interface CapacitySummaryResponse {
  total_mandals: number;
  total_designated_shelters: number;
  total_verified_shelter_capacity_persons: number;
  mandals_with_designated_shelters: number;
  mandals_without_designated_shelters: number;
  mean_shelter_capacity_per_1000_in_shelter_mandals: number;
  total_normative_health_beds_iphs: number;
  mean_normative_beds_per_1000: number;
  mean_water_access_percent: number;
  mean_sanitation_coverage_percent: number;
  mean_water_sanitation_adequacy: number;
  total_evacuation_road_length_km: number;
  mean_road_density_km_per_km2: number;
  mean_safe_area_fraction: number;
  mean_safe_area_m2_per_person: number;
  top_shelter_mandals: Array<{
    mandal_id: string;
    mandal_name: string;
    current_district_name: string;
    shelter_count: number;
    verified_shelter_capacity_persons: number;
    shelter_capacity_per_1000: number;
  }>;
  methodology_note: string;
  classification_standards: Record<string, string>;
}

// Phase 3C Types

export interface MandalCapacityAdequacyItem {
  mandal_id: string;
  mandal_name: string;
  current_district_id: string;
  current_district_name: string;
  mandal_area_sqkm: number;
  population_total: number;

  // Shelter Adequacy
  shelter_count: number;
  verified_shelter_capacity_persons: number;
  shelter_coverage_ratio: number;
  shelter_deficit_persons: number;
  shelter_adequacy: number | null;
  shelter_status: string;

  // Health Adequacy
  normative_health_capacity_baseline: number;
  normative_beds_per_1000: number;
  health_adequacy: number;
  health_status: string;

  // Water & Sanitation Adequacy
  water_access_percent: number;
  sanitation_coverage_percent: number;
  water_sanitation_adequacy: number;
  water_sanitation_status: string;

  // Evacuation Road Accessibility
  road_length_km: number;
  road_density_km_per_km2: number;
  road_accessibility_score: number;
  road_access_status: string;

  // Safe Habitable Area Constraint
  safe_area_sqkm: number;
  safe_area_fraction: number;
  safe_area_m2_per_person: number;
  safe_area_adequacy: number;
  safe_area_status: string;

  // Data Completeness & Bottlenecks
  available_component_count: number;
  capacity_data_completeness: number;
  primary_bottleneck: string;
  secondary_bottleneck: string;
  bottleneck_confidence: string;
  capacity_condition: string;
  is_host_zone_candidate: boolean;

  // Governance
  data_quality: string;
  provenance_notes: string;
}

export interface MandalCapacityAdequacyListResponse {
  total_mandals: number;
  items: MandalCapacityAdequacyItem[];
}

export interface CapacityAdequacySummaryResponse {

  total_mandals: number;
  condition_breakdown: Record<string, number>;
  primary_bottleneck_breakdown: Record<string, number>;
  host_zone_candidates_pool_count: number;
  mean_data_completeness: number;
  shelter_coverage_breakdown: Record<string, number>;
  governance_notice: string;
}

export interface HostZoneCandidateItem {
  source_mandal_id: string;
  source_mandal_name: string;
  candidate_mandal_id: string;
  candidate_mandal_name: string;
  distance_km: number;
  candidate_hazard_exposure: number;
  candidate_vulnerability: number;
  candidate_capacity_condition: string;
  candidate_capacity_data_completeness: number;
  candidate_shelter_adequacy: number | null;
  candidate_water_sanitation_adequacy: number;
  candidate_road_accessibility: number;
  candidate_safe_area_fraction: number;
  host_candidate_reason: string;
  host_candidate_status: string;

  // AP Relocation Logic Upgrade Attributes
  candidate_district_id?: string;
  candidate_district_name?: string;
  source_district_id?: string;
  source_district_name?: string;
  administrative_relation?: 'SAME_MANDAL' | 'ADJACENT_MANDAL' | 'FARTHER_MANDAL' | 'DIFFERENT_DISTRICT' | string;
  proximity_tier?: number; // 1: Same mandal, 2: Adjacent mandal same district, 3: Farther mandal same district, 4: Different district
  candidate_shelter_capacity_persons?: number;
  candidate_shelter_count?: number;
  candidate_beds_per_1000?: number;
  candidate_health_adequacy?: number;
  candidate_water_access_pct?: number;
  candidate_sanitation_coverage_pct?: number;
  candidate_safe_area_m2_per_person?: number;
  candidate_road_access_status?: string;
  relocation_suitability_score?: number;
  relocation_suitability_rank?: number;
  suitability_tier?: 'RECOMMENDED' | 'ALTERNATIVE' | 'FALLBACK' | 'REJECTED' | 'INSUFFICIENT-DATA' | string;
  is_safe?: boolean | null;
  is_capacity_adequate?: boolean | null;
  is_accessible?: boolean | null;
  rejection_reason?: string;
  recommendation_reason?: string;
  recommendation_explanation?: string;
}

export interface HostZoneCandidateListResponse {
  source_mandal_id: string;
  total_candidates: number;
  candidates: HostZoneCandidateItem[];
  governance_disclaimer: string;

  // Contextual Origin & AP Logic Metadata
  source_mandal_name?: string;
  source_district_id?: string;
  source_district_name?: string;
  source_hazard_exposure?: number;
  source_capacity_condition?: string;
  source_population?: number;
  recommended_candidates?: HostZoneCandidateItem[];
  rejected_candidates?: HostZoneCandidateItem[];
  soft_preference_notice?: string;
}
