export interface SectorHazardDetail {
  sector: 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';
  area_sqkm: number;
  area_pct: number;
  priority: 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT DATA';
  priority_reason: string;
  flood_mean_recurrence_pct?: number;
  flood_max_recurrence_pct?: number;
  flood_area_affected_pct?: number;
  flood_score?: number;
  slope_mean_degrees?: number;
  slope_max_degrees?: number;
  slope_steep_area_pct?: number;
  slope_score?: number;
  cyclone_tracks_count_25km?: number;
  cyclone_min_dist_km?: number;
  wind_basic_speed_ms?: number;
  wind_zone?: string;
  sector_hazard_score: number;
  geometry_geojson?: any;
}

export interface VillageGeometryResponse {
  village_code: number;
  village_name: string;
  mandal_name: string;
  district_name: string;
  village_area_sqkm: number;
  centroid_lat: number;
  centroid_lon: number;
  village_boundary_geojson: any;
  sectors_geojson: any;
  crs: string;
}

export interface VillageHazardResponse {
  village_code: number;
  village_name: string;
  mandal_code: string;
  mandal_name: string;
  district_name: string;
  district_code: string;
  population_total: number;
  households: number;
  village_area_sqkm: number;
  centroid_lat: number;
  centroid_lon: number;
  disaster_type: string;
  dominant_hazard: string;
  overall_hazard_score: number;
  relocation_priority: 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'LOW';
  flood_summary: {
    valid_pixels: number;
    mean_rec: number;
    max_rec: number;
    pct_affected: number;
    score: number;
    status: string;
  };
  slope_summary: {
    valid_pixels: number;
    mean_slope: number;
    max_slope: number;
    pct_steep: number;
    score: number;
    status: string;
  };
  cyclone_summary: {
    tracks_count: number;
    min_dist_km: number;
    score: number;
    status: string;
  };
  wind_summary: {
    speed_ms: number;
    zone: string;
    score: number;
    status: string;
  };
  sectors: SectorHazardDetail[];
  area_preservation_verified: boolean;
  data_provenance_note: string;
}

export interface VillageScenarioResponse {
  village_code: number;
  village_name: string;
  baseline_hazard_score: number;
  scenario_hazard_increase: number;
  simulated_hazard_score: number;
  simulated_relocation_priority: string;
  priority_shifted: boolean;
  simulated_population_at_risk: number;
  disclaimer: string;
  explanation: string;
  sector_simulations: {
    sector: string;
    baseline_score: number;
    simulated_score: number;
    simulated_priority: string;
    priority_shifted: boolean;
  }[];
}

export interface RejectedCloserCandidate {
  mandal_name: string;
  district_name: string;
  distance_km: number;
  safe_area_fraction: number;
  capacity_condition: string;
  rejection_reason: string;
}

export interface VillageRelocationCandidate {
  center_name: string;
  mandal_name: string;
  district_name: string;
  distance_km: number;
  capacity_condition: string;
  safety_status: string;
  accessibility_status: string;
  suitability_score: number;
  suitability_tier: string;
  why_recommended: string;
  closer_candidate_rejection_reason?: string;
  rank?: number;
  proximity_category?: 'NEARBY / SAME MANDAL' | 'ADJACENT MANDAL' | 'SAME DISTRICT' | 'REGIONAL FALLBACK';
  rejected_closer_candidates?: RejectedCloserCandidate[];
}

export interface VillageRelocationResponse {
  village_code: number;
  village_name: string;
  origin_mandal_name: string;
  origin_district_name: string;
  total_candidates_evaluated: number;
  recommended_centers: VillageRelocationCandidate[];
  soft_distance_notice: string;
  governance_disclaimer: string;
  nearby_candidate_found?: boolean;
  fallback_notice?: string;
}
