export interface DistrictDemographicSummary {
  district_id: string;
  district_name: string;
  total_population: number;
  total_households: number;
  children_0_6: number;
  children_0_6_pct: number;
  sc_population: number;
  sc_pct: number;
  st_population: number;
  st_pct: number;
  workers: number;
  village_count: number;
  mandal_count: number;
  data_year: number;
  data_source: string;
}

export interface StateDemographicSummary {
  state_name: string;
  state_code: string;
  data_year: number;
  data_source: string;
  total_population: number;
  total_households: number;
  total_children_0_6: number;
  total_children_0_6_pct: number;
  total_sc: number;
  total_sc_pct: number;
  total_st: number;
  total_st_pct: number;
  total_workers: number;
  total_villages: number;
  total_districts: number;
  districts: DistrictDemographicSummary[];
}

export interface MandalDemographicSummary {
  mandal_code: number;
  mandal_name: string;
  current_district_id: string;
  current_district_name: string;
  total_population: number;
  total_households: number;
  children_0_6: number;
  children_0_6_pct: number;
  sc_population: number;
  sc_pct: number;
  st_population: number;
  st_pct: number;
  workers: number;
  village_count: number;
}

export interface DistrictDetailResponse {
  district: DistrictDemographicSummary;
  mandals: MandalDemographicSummary[];
}
