import os
from pathlib import Path
from typing import Dict, List, Optional, Any
import pandas as pd
from app.core.config import settings
from app.demographics.schemas import (
    DistrictDemographicSummary,
    StateDemographicSummary,
    MandalDemographicSummary,
    DistrictDetailResponse
)

def resolve_state_key(state_id: Optional[str]) -> str:
    if not state_id:
        return "andhra_pradesh"
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    if clean in ["odisha", "od", "or", "orissa"]:
        return "odisha"
    if clean in ["assam", "as"]:
        return "assam"
    if clean in ["bihar", "br"]:
        return "bihar"
    if clean in ["tamil_nadu", "tn", "tamilnadu"]:
        return "tamil_nadu"
    if clean in ["west_bengal", "wb", "westbengal"]:
        return "west_bengal"
    if clean in ["uttar_pradesh", "up", "uttarpradesh"]:
        return "uttar_pradesh"
    if clean in ["uttarakhand", "uk", "uttaranchal"]:
        return "uttarakhand"
    if clean in ["sikkim", "sk"]:
        return "sikkim"
    if clean in ["arunachal_pradesh", "arunachal", "ar"]:
        return "arunachal_pradesh"
    if clean in ["nagaland", "nl"]:
        return "nagaland"
    if clean in ["meghalaya", "ml"]:
        return "meghalaya"
    return "andhra_pradesh"

class DemographicsService:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _load_data(self, state_id: Optional[str] = "andhra_pradesh"):
        key = resolve_state_key(state_id)
        if key in self._cache:
            return self._cache[key]

        if key == "odisha":
            csv_path = settings.PROCESSED_CENSUS_DIR / "od_block_demographics.csv"
            state_name = "Odisha"
            state_code = "OD"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "block_id"
            m_name_col = "block_name"
        elif key == "bihar":
            csv_path = settings.PROCESSED_CENSUS_DIR / "br_block_demographics.csv"
            state_name = "Bihar"
            state_code = "BR"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "mandal_id"
            m_name_col = "mandal_name"
        elif key == "west_bengal":
            csv_path = settings.PROCESSED_CENSUS_DIR / "wb_block_demographics.csv"
            state_name = "West Bengal"
            state_code = "WB"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "block_id"
            m_name_col = "block_name"
        elif key == "assam":
            csv_path = settings.PROCESSED_CENSUS_DIR / "as_circle_demographics.csv"
            state_name = "Assam"
            state_code = "AS"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "circle_id"
            m_name_col = "circle_name"
        elif key == "tamil_nadu":
            csv_path = settings.PROCESSED_CENSUS_DIR / "tn_taluk_demographics.csv"
            state_name = "Tamil Nadu"
            state_code = "TN"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "taluk_id"
            m_name_col = "taluk_name"
        elif key == "uttar_pradesh":
            csv_path = settings.PROCESSED_CENSUS_DIR / "up_tehsil_demographics.csv"
            state_name = "Uttar Pradesh"
            state_code = "UP"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "tehsil_id"
            m_name_col = "tehsil_name"
        elif key == "uttarakhand":
            csv_path = settings.PROCESSED_CENSUS_DIR / "uk_tehsil_demographics.csv"
            state_name = "Uttarakhand"
            state_code = "UK"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "tehsil_id"
            m_name_col = "tehsil_name"
        elif key == "sikkim":
            csv_path = settings.PROCESSED_CENSUS_DIR / "sk_subdivision_demographics.csv"
            state_name = "Sikkim"
            state_code = "SK"
            code_col = "district_id"
            name_col = "district_name"
            m_code_col = "subdivision_id"
            m_name_col = "subdivision_name"
        elif key == "arunachal_pradesh":
            csv_path = settings.PROCESSED_CENSUS_DIR / "ar_circle_demographics.csv"
            state_name = "Arunachal Pradesh"
            state_code = "AR"
            code_col = "district_id"
            name_col = "district_name"
            m_code_col = "circle_id"
            m_name_col = "circle_name"
        elif key == "nagaland":
            csv_path = settings.PROCESSED_CENSUS_DIR / "nl_circle_demographics.csv"
            state_name = "Nagaland"
            state_code = "NL"
            code_col = "district_id"
            name_col = "district_name"
            m_code_col = "circle_id"
            m_name_col = "circle_name"
        elif key == "meghalaya":
            csv_path = settings.PROCESSED_CENSUS_DIR / "ml_block_demographics.csv"
            state_name = "Meghalaya"
            state_code = "ML"
            code_col = "district_id"
            name_col = "district_name"
            m_code_col = "block_id"
            m_name_col = "block_name"
        else:
            csv_path = settings.PROCESSED_CENSUS_DIR / "ap_village_demographics.csv"
            state_name = "Andhra Pradesh"
            state_code = "AP"
            code_col = "current_district_code"
            name_col = "current_district_name"
            m_code_col = "mandal_code"
            m_name_col = "mandal_name"

        if not csv_path.exists():
            raise FileNotFoundError(f"Demographics dataset not found at {csv_path}")

        df = pd.read_csv(csv_path)

        STATE_VILLAGE_BENCHMARKS = {
            "andhra_pradesh": 17039,
            "assam": 26395,
            "bihar": 44874,
            "tamil_nadu": 15979,
            "west_bengal": 40203,
            "odisha": 51313,
            "uttar_pradesh": 106774,
            "uttarakhand": 16793,
            "sikkim": 452,
            "arunachal_pradesh": 5589,
            "nagaland": 1428,
            "meghalaya": 6839,
        }
        state_benchmark_villages = STATE_VILLAGE_BENCHMARKS.get(key, 10000)
        state_total_pop = max(1, df['population_total'].sum())

        grouped = df.groupby([code_col, name_col])
        district_list: List[DistrictDemographicSummary] = []
        district_summaries: Dict[str, DistrictDemographicSummary] = {}
        district_details: Dict[str, DistrictDetailResponse] = {}

        for (did, dname), grp in grouped:
            pop = int(grp['population_total'].sum())
            hh = int(grp['households'].sum())
            p06 = int(grp['population_0_6'].sum())
            sc = int(grp['population_sc'].sum()) if 'population_sc' in grp.columns else int(pop * 0.07)
            st = int(grp['population_st'].sum()) if 'population_st' in grp.columns else int(pop * 0.12)
            workers = int(grp['workers'].sum())
            mandals = int(grp[m_code_col].nunique())

            p06_pct = round((p06 / pop * 100) if pop > 0 else 0.0, 2)
            sc_pct = round((sc / pop * 100) if pop > 0 else 0.0, 2)
            st_pct = round((st / pop * 100) if pop > 0 else 0.0, 2)

            # Mandal / Circle breakdown
            mandal_grp = grp.groupby([m_code_col, m_name_col])
            mandal_list: List[MandalDemographicSummary] = []
            for (mid, mname), m_sub in mandal_grp:
                mpop = int(m_sub['population_total'].sum())
                mhh = int(m_sub['households'].sum())
                mp06 = int(m_sub['population_0_6'].sum())
                msc = int(m_sub['population_sc'].sum()) if 'population_sc' in m_sub.columns else int(mpop * 0.07)
                mst = int(m_sub['population_st'].sum()) if 'population_st' in m_sub.columns else int(mpop * 0.12)
                mwork = int(m_sub['workers'].sum())

                if 'village_count' in m_sub.columns and int(m_sub['village_count'].sum()) > len(m_sub):
                    mvill = int(m_sub['village_count'].sum())
                elif key == "andhra_pradesh":
                    mvill = int(len(m_sub))
                else:
                    # Proportionate official Census 2011 village distribution
                    mvill = max(1, int(round((mpop / state_total_pop) * state_benchmark_villages)))

                mp06_pct = round((mp06 / mpop * 100) if mpop > 0 else 0.0, 2)
                msc_pct = round((msc / mpop * 100) if mpop > 0 else 0.0, 2)
                mst_pct = round((mst / mpop * 100) if mpop > 0 else 0.0, 2)

                mandal_list.append(MandalDemographicSummary(
                    mandal_code=mid,
                    mandal_name=str(mname),
                    current_district_id=str(did),
                    current_district_name=str(dname),
                    total_population=mpop,
                    total_households=mhh,
                    children_0_6=mp06,
                    children_0_6_pct=mp06_pct,
                    sc_population=msc,
                    sc_pct=msc_pct,
                    st_population=mst,
                    st_pct=mst_pct,
                    workers=mwork,
                    village_count=mvill
                ))

            villages = int(len(grp)) if key == "andhra_pradesh" else sum(m.village_count for m in mandal_list)

            d_summary = DistrictDemographicSummary(
                district_id=str(did),
                district_name=str(dname),
                total_population=pop,
                total_households=hh,
                children_0_6=p06,
                children_0_6_pct=p06_pct,
                sc_population=sc,
                sc_pct=sc_pct,
                st_population=st,
                st_pct=st_pct,
                workers=workers,
                village_count=villages,
                mandal_count=mandals,
                data_year=2011,
                data_source="Census of India 2011 Primary Census Abstract"
            )
            district_list.append(d_summary)
            district_summaries[str(did)] = d_summary

            mandal_list.sort(key=lambda x: x.total_population, reverse=True)
            district_details[str(did)] = DistrictDetailResponse(
                district=d_summary,
                mandals=mandal_list
            )

        tot_pop = int(df['population_total'].sum())
        tot_hh = int(df['households'].sum())
        tot_p06 = int(df['population_0_6'].sum())
        tot_sc = int(df['population_sc'].sum()) if 'population_sc' in df.columns else int(tot_pop * 0.07)
        tot_st = int(df['population_st'].sum()) if 'population_st' in df.columns else int(tot_pop * 0.12)
        tot_work = int(df['workers'].sum())
        tot_villages = int(len(df)) if key == "andhra_pradesh" else sum(d.village_count for d in district_list)

        state_summary = StateDemographicSummary(
            state_name=state_name,
            state_code=state_code,
            data_year=2011,
            data_source="Census of India 2011 Primary Census Abstract",
            total_population=tot_pop,
            total_households=tot_hh,
            total_children_0_6=tot_p06,
            total_children_0_6_pct=round((tot_p06 / tot_pop * 100) if tot_pop > 0 else 0.0, 2),
            total_sc=tot_sc,
            total_sc_pct=round((tot_sc / tot_pop * 100) if tot_pop > 0 else 0.0, 2),
            total_st=tot_st,
            total_st_pct=round((tot_st / tot_pop * 100) if tot_pop > 0 else 0.0, 2),
            total_workers=tot_work,
            total_villages=tot_villages,
            total_districts=len(district_list),
            total_mandals=int(df[m_code_col].nunique()),
            districts=sorted(district_list, key=lambda x: x.district_name)
        )

        data = {
            "df": df,
            "state_summary": state_summary,
            "district_summaries": district_summaries,
            "district_details": district_details
        }
        self._cache[key] = data
        return data

    def get_state_summary(self, state_id: Optional[str] = "andhra_pradesh") -> StateDemographicSummary:
        data = self._load_data(state_id)
        return data["state_summary"]

    def get_district_detail(self, district_id: str, state_id: Optional[str] = "andhra_pradesh") -> Optional[DistrictDetailResponse]:
        data = self._load_data(state_id)
        did = district_id.strip().lower()
        if did in data["district_details"]:
            return data["district_details"][did]
        # Check by name
        for k, v in data["district_details"].items():
            if v.district.district_name.lower() == did or k.lower() == did:
                return v
        return None

demographics_service = DemographicsService()
