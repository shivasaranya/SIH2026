export interface DistrictProperties {
  district_id: string;
  district_name: string;
}

export interface MandalProperties {
  mandal_id?: string;
  DMNAME?: string;
  mandal_name: string;
  DNAME?: string;
  current_district_id?: string;
  current_district_name?: string;
  mandal_area_sqkm?: number;
  village_count?: number;
  population_total?: number;
  population_male?: number;
  population_female?: number;
  population_0_6?: number;
  population_0_6_male?: number;
  population_0_6_female?: number;
  population_sc?: number;
  population_st?: number;
  households?: number;
  workers?: number;
  non_workers?: number;
  adult_male_pop?: number;
  adult_female_pop?: number;
  child_pop?: number;
  female_share?: number;
  child_share_0_6?: number;
  adult_male_share?: number;
  adult_female_share?: number;
  non_worker_share?: number;
  avg_household_size?: number;
  sc_share?: number;
  st_share?: number;
  workers_share?: number;
  child_share_normalized?: number;
  non_worker_share_normalized?: number;
  avg_household_size_normalized?: number;
  female_share_normalized?: number;
  sc_share_normalized?: number;
  st_share_normalized?: number;
  low_worker_share_normalized?: number;
  demographic_sensitivity_index?: number;
  hazard_exposure_index?: number;
  flood_exposure_score?: number;
  cyclone_exposure_score?: number;
  wind_exposure_score?: number;
  steep_slope_constraint_score?: number;
  exposure_weighted_population?: number;
  vulnerability_index?: number;
  hazard_category?: string;
  vulnerability_category?: string;
  priority_quadrant?: string;
  older_persons_status?: string;
  disability_status?: string;
  demographic_data_flag?: string;
  census_year?: number;
  temporal_mismatch_note?: string;

  // Physical Carrying Capacity Component Properties
  shelter_count?: number;
  verified_shelter_capacity_persons?: number;
  unknown_capacity_shelter_count?: number;
  shelter_capacity_per_1000?: number;
  shelter_adequacy_score?: number;
  shelter_capacity_status?: string;
  school_space_capacity_proxy_persons?: number | null;
  school_space_data_status?: string;
  actual_health_beds?: number | null;
  normative_health_capacity_baseline?: number;
  normative_beds_per_1000?: number;
  health_adequacy_score?: number;
  health_capacity_status?: string;
  water_access_percent?: number;
  sanitation_coverage_percent?: number;
  water_sanitation_adequacy?: number;
  water_sanitation_score?: number;
  water_sanitation_status?: string;
  road_length_km?: number;
  road_density_km_per_km2?: number;
  road_accessibility_score?: number;
  road_accessibility_status?: string;
  safe_area_sqkm?: number;

  safe_area_fraction?: number;

  safe_area_m2_per_person?: number;
  safe_area_score?: number;
  safe_area_status?: string;

  // Phase 3C Adequacy & Bottleneck Properties
  shelter_coverage_ratio?: number;
  shelter_deficit_persons?: number;
  shelter_adequacy?: number | null;
  shelter_status?: string;
  health_adequacy?: number;
  health_status?: string;
  road_access_status?: string;
  safe_area_adequacy?: number;
  available_component_count?: number;
  capacity_data_completeness?: number;
  primary_bottleneck?: string;
  secondary_bottleneck?: string;
  bottleneck_confidence?: string;
  capacity_condition?: string;
  // Phase 4 Relocation Prioritization Properties
  topsis_score?: number;
  relocation_priority_category?: 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT-DATA';
  ranking_status?: string;
  relocation_priority_rank?: number | null;
  c1_hazard_exposure?: number;
  c2_demographic_sensitivity?: number;
  c3_capacity_stress?: number;
  c4_accessibility_constraint?: number;
  primary_priority_factor?: string;
  secondary_priority_factor?: string;
  factor_contrib_hazard_pct?: number;
  factor_contrib_demographic_pct?: number;
  factor_contrib_capacity_pct?: number;
  factor_contrib_accessibility_pct?: number;
  priority_explanation?: string;

  // Phase 5 What-If Simulation Properties
  scenario_topsis_score?: number;
  scenario_category?: string;
  scenario_rank?: number | null;
  scenario_primary_factor?: string;
  scenario_secondary_factor?: string;
  score_change?: number;
  rank_change?: number | null;
  category_change?: string;
  change_direction?: string;
  scenario_c1_hazard?: number;
  scenario_c2_demography?: number;
  scenario_c3_capacity?: number;
  scenario_c4_accessibility?: number;
  scenario_explanation?: string;

  data_quality?: string;
  provenance_notes?: string;
}


export interface GeoJsonFeature<P = any> {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any[];
  };
  properties: P;
}

export interface GeoJsonFeatureCollection<P = any> {
  type: 'FeatureCollection';
  features: GeoJsonFeature<P>[];
}

export type DemographicMetricKey =
  | 'topsis_score'
  | 'scenario_topsis_score'
  | 'priority_change'
  | 'population'
  | 'children_pct'
  | 'adult_male_pct'
  | 'adult_female_pct'
  | 'non_workers_pct'
  | 'avg_hh_size'
  | 'sc_pct'
  | 'st_pct'
  | 'vulnerability'
  | 'hazard_exposure'
  | 'demographic_sensitivity'
  | 'shelter_capacity'
  | 'road_density'
  | 'safe_area_fraction'
  | 'water_sanitation'
  | 'health_beds';

export interface DemographicMetricConfig {
  key: DemographicMetricKey;
  label: string;
  unit: string;
  description: string;
  colorScale: string[];
  domain: [number, number];
}


