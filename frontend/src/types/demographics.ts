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

export interface VillageItem {
  village_code: string | number;
  village_name: string;
  mandal_name: string;
  mandal_code?: string | number;
  district_name: string;
  district_code: string;
  population_total: number;
  households: number;
  population_male?: number;
  population_female?: number;
  population_0_6?: number;
  population_sc?: number;
  population_st?: number;
  workers?: number;
  non_workers?: number;
  data_year: number;
  has_geometry: boolean;
  geometry_note: string;
}

export interface MandalVillageListResponse {
  mandal_id: string;
  mandal_name: string;
  district_name: string;
  district_code: string;
  total_villages: number;
  villages: VillageItem[];
  has_village_data: boolean;
  note?: string;
}
