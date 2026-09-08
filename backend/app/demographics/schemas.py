from typing import List, Optional, Union
from pydantic import BaseModel, Field

class DistrictDemographicSummary(BaseModel):
    district_id: str
    district_name: str
    total_population: int
    total_households: int
    children_0_6: int
    children_0_6_pct: float
    sc_population: int
    sc_pct: float
    st_population: int
    st_pct: float
    workers: int
    village_count: int
    mandal_count: int
    data_year: int = 2011
    data_source: str = "Census of India 2011 Primary Census Abstract"

class StateDemographicSummary(BaseModel):
    state_name: str = "Andhra Pradesh"
    state_code: str = "AP"
    data_year: int = 2011
    data_source: str = "Census of India 2011 Primary Census Abstract"
    total_population: int
    total_households: int
    total_children_0_6: int
    total_children_0_6_pct: float
    total_sc: int
    total_sc_pct: float
    total_st: int
    total_st_pct: float
    total_workers: int
    total_villages: int
    total_districts: int
    total_mandals: Optional[int] = None
    districts: List[DistrictDemographicSummary]

class MandalDemographicSummary(BaseModel):
    mandal_code: Union[int, str]
    mandal_name: str
    current_district_id: str
    current_district_name: str
    total_population: int
    total_households: int
    children_0_6: int
    children_0_6_pct: float
    sc_population: int
    sc_pct: float
    st_population: int
    st_pct: float
    workers: int
    village_count: int

class DistrictDetailResponse(BaseModel):
    district: DistrictDemographicSummary
    mandals: List[MandalDemographicSummary]

class VillageItem(BaseModel):
    village_code: Union[int, str]
    village_name: str
    mandal_name: str
    mandal_code: Optional[Union[int, str]] = None
    district_name: str
    district_code: str
    population_total: int
    households: int
    population_male: Optional[int] = 0
    population_female: Optional[int] = 0
    population_0_6: Optional[int] = 0
    population_sc: Optional[int] = 0
    population_st: Optional[int] = 0
    workers: Optional[int] = 0
    non_workers: Optional[int] = 0
    data_year: int = 2011
    has_geometry: bool = False
    geometry_note: str = "Village boundary data unavailable"

class MandalVillageListResponse(BaseModel):
    mandal_id: str
    mandal_name: str
    district_name: str
    district_code: str
    total_villages: int
    villages: List[VillageItem]
    has_village_data: bool
    note: Optional[str] = None
