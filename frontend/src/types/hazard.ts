export interface MandalHazardExposureItem {
  mandal_id: string;
  mandal_name: string;
  current_district_id: string;
  current_district_name: string;
  mandal_area_sqkm: number;
  mean_water_recurrence_pct: number;
  max_water_recurrence_pct: number;
  area_recurrence_ge_10_sqkm: number;
  pct_area_recurrence_ge_10: number;
  flood_exposure_score: number;
  cyclone_tracks_50km_count: number;
  distinct_storms_50km_count: number;
  direct_landfall_tracks_50km_count: number;
  distance_to_nearest_track_km: number;
  track_density_per_1000sqkm: number;
  cyclone_exposure_score: number;
  basic_wind_speed_m_s: number;
  risk_zone: string;
  wind_exposure_score: number;
  mean_elevation_m: number;
  max_elevation_m: number;
  mean_slope_deg: number;
  pct_area_slope_gt_25: number;
  area_slope_gt_25_sqkm: number;
  steep_slope_constraint_score: number;
  multi_hazard_exposure_index: number;
  storm_surge_included: boolean;
  data_quality_flag: string;
  processing_date: string;
}

export type MandalHazardItem = MandalHazardExposureItem;
