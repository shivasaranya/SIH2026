from typing import List, Optional
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
    districts: List[DistrictDemographicSummary]

class MandalDemographicSummary(BaseModel):
    mandal_code: int
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
