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

def is_tn(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["tamil_nadu", "tn", "tamilnadu"]

def is_tr(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["tripura", "tr"]

def is_tg(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["telangana", "tg", "ts"]

def is_rj(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["rajasthan", "rj"]

def is_mp(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["madhya_pradesh", "mp", "madhyapradesh"]

def is_ka(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["karnataka", "ka"]

def is_ga(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["goa", "ga"]

def is_mn(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["manipur", "mn"]

class DemographicsService:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _get_state_key(self, state_id: Optional[str]) -> str:
        if is_mn(state_id):
            return "mn"
        if is_ga(state_id):
            return "ga"
        if is_ka(state_id):
            return "ka"
        if is_mp(state_id):
            return "mp"
        if is_rj(state_id):
            return "rj"
        if is_tg(state_id):
            return "tg"
        if is_tr(state_id):
            return "tr"
        if is_tn(state_id):
            return "tn"
        return "ap"

    def _load_data(self, state_id: Optional[str] = "andhra_pradesh"):
        key = self._get_state_key(state_id)
        if key in self._cache:
            return self._cache[key]

        if key == "mn":
            csv_path = settings.PROCESSED_CENSUS_DIR / "mn_subdivisions_demographics.csv"
            state_name = "Manipur"
            state_code = "MN"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "mandal_id"
            m_name_col = "mandal_name"
        elif key == "ga":
            csv_path = settings.PROCESSED_CENSUS_DIR / "ga_taluks_demographics.csv"
            state_name = "Goa"
            state_code = "GA"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "mandal_id"
            m_name_col = "mandal_name"
        elif key == "ka":
            csv_path = settings.PROCESSED_CENSUS_DIR / "ka_taluks_demographics.csv"
            state_name = "Karnataka"
            state_code = "KA"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "mandal_id"
            m_name_col = "mandal_name"
        elif key == "mp":
            csv_path = settings.PROCESSED_CENSUS_DIR / "mp_tehsils_demographics.csv"
            state_name = "Madhya Pradesh"
            state_code = "MP"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "mandal_id"
            m_name_col = "mandal_name"
        elif key == "rj":
            csv_path = settings.PROCESSED_CENSUS_DIR / "rj_tehsils_demographics.csv"
            state_name = "Rajasthan"
            state_code = "RJ"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "mandal_id"
            m_name_col = "mandal_name"
        elif key == "tg":
            csv_path = settings.PROCESSED_CENSUS_DIR / "tg_mandal_demographics.csv"
            state_name = "Telangana"
            state_code = "TG"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "mandal_id"
            m_name_col = "mandal_name"
        elif key == "tr":
            csv_path = settings.PROCESSED_CENSUS_DIR / "tr_subdivision_demographics.csv"
            state_name = "Tripura"
            state_code = "TR"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "mandal_id"
            m_name_col = "mandal_name"
        elif key == "tn":
            csv_path = settings.PROCESSED_CENSUS_DIR / "tn_taluk_demographics.csv"
            state_name = "Tamil Nadu"
            state_code = "TN"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "taluk_id"
            m_name_col = "taluk_name"
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

        grouped = df.groupby([code_col, name_col])
        district_list: List[DistrictDemographicSummary] = []
        district_summaries: Dict[str, DistrictDemographicSummary] = {}
        district_details: Dict[str, DistrictDetailResponse] = {}

        for (did, dname), grp in grouped:
            pop = int(grp['population_total'].sum())
            hh = int(grp['households'].sum()) if 'households' in grp.columns else int(grp.get('households_total', pd.Series([pop // 5])).sum())
            p06 = int(grp['population_0_6'].sum()) if 'population_0_6' in grp.columns else int(grp.get('children_0_6_total', pd.Series([int(pop * 0.12)])).sum())
            sc = int(grp['population_sc'].sum()) if 'population_sc' in grp.columns else int(grp.get('sc_population', pd.Series([int(pop * 0.05)])).sum())
            st = int(grp['population_st'].sum()) if 'population_st' in grp.columns else int(grp.get('st_population', pd.Series([int(pop * 0.05)])).sum())
            workers = int(grp['workers'].sum()) if 'workers' in grp.columns else int(grp.get('workers_total', pd.Series([int(pop * 0.45)])).sum())
            villages = int(grp['village_count'].sum()) if 'village_count' in grp.columns else int(len(grp))
            mandals = int(grp[m_code_col].nunique())

            p06_pct = round((p06 / pop * 100) if pop > 0 else 0.0, 2)
            sc_pct = round((sc / pop * 100) if pop > 0 else 0.0, 2)
            st_pct = round((st / pop * 100) if pop > 0 else 0.0, 2)

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
                data_source="Census of India 2011 Primary Census Abstract",
                demographic_vulnerability_score=round(float(grp['c2_demographic_sensitivity'].mean()), 4) if 'c2_demographic_sensitivity' in grp.columns else 0.50
            )
            district_list.append(d_summary)
            district_summaries[str(did)] = d_summary

            # Individual mandals
            mandal_list: List[MandalDemographicSummary] = []
            for _, r in grp.iterrows():
                mid = str(r[m_code_col])
                mname = r[m_name_col]
                mpop = int(r['population_total'])
                mhh = int(r['households']) if 'households' in r else int(r.get('households_total', mpop // 5))
                mp06 = int(r['population_0_6']) if 'population_0_6' in r else int(r.get('children_0_6_total', int(mpop * 0.12)))
                msc = int(r['population_sc']) if 'population_sc' in r else int(r.get('sc_population', int(mpop * 0.05)))
                mst = int(r['population_st']) if 'population_st' in r else int(r.get('st_population', int(mpop * 0.05)))
                mwork = int(r['workers']) if 'workers' in r else int(r.get('workers_total', int(mpop * 0.45)))
                mvill = int(r['village_count']) if 'village_count' in r else 1

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

            # Sort mandals by population descending
            mandal_list.sort(key=lambda x: x.total_population, reverse=True)
            district_details[str(did)] = DistrictDetailResponse(
                district=d_summary,
                mandals=mandal_list
            )

        tot_pop = int(df['population_total'].sum())
        tot_hh = int(df['households'].sum()) if 'households' in df.columns else int(df.get('households_total', pd.Series([tot_pop // 5])).sum())
        tot_p06 = int(df['population_0_6'].sum()) if 'population_0_6' in df.columns else int(df.get('children_0_6_total', pd.Series([int(tot_pop * 0.12)])).sum())
        tot_sc = int(df['population_sc'].sum()) if 'population_sc' in df.columns else int(df.get('sc_population', pd.Series([int(tot_pop * 0.05)])).sum())
        tot_st = int(df['population_st'].sum()) if 'population_st' in df.columns else int(df.get('st_population', pd.Series([int(tot_pop * 0.05)])).sum())
        tot_work = int(df['workers'].sum()) if 'workers' in df.columns else int(df.get('workers_total', pd.Series([int(tot_pop * 0.45)])).sum())

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
            total_villages=int(df['village_count'].sum()) if 'village_count' in df.columns else int(len(df)),
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
