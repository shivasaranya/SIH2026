import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
import pandas as pd
from app.core.config import settings
from app.core.state_registry import state_registry, get_state_key
from app.demographics.schemas import (
    DistrictDemographicSummary,
    StateDemographicSummary,
    MandalDemographicSummary,
    DistrictDetailResponse,
    VillageItem,
    MandalVillageListResponse,
)

def normalize_name(s: Any) -> str:
    s = str(s).strip()
    s = re.sub(r'\s+H/O.*', '', s, flags=re.IGNORECASE)
    s = re.sub(r'\(FULLY URBAN\)', '', s, flags=re.IGNORECASE)
    s = re.sub(r'\(URBAN\)', '', s, flags=re.IGNORECASE)
    s = re.sub(r'\(RURAL\)', '', s, flags=re.IGNORECASE)
    s = re.sub(r'\(R\)', '', s, flags=re.IGNORECASE)
    s = re.sub(r'\(U\)', '', s, flags=re.IGNORECASE)
    s = re.sub(r'[0-9]+$', '', s)
    s = re.sub(r'[^A-Z0-9]', '', s.upper())
    return s

def resolve_state_key(state_id: Optional[str]) -> str:
    return get_state_key(state_id)
def is_tn(state_id: Optional[str]) -> bool:
    return get_state_key(state_id) == "tamil_nadu"

def is_mizoram(state_id: Optional[str]) -> bool:
    return get_state_key(state_id) == "mizoram"

MANDAL_ALIASES = {
    ("alluri_sitharama_raju", "GUDEMKOTHAVEEDHI"): "GKVEEDHI",
    ("alluri_sitharama_raju", "CHINTAPALLE"): "CHINTHAPALLE",
    ("alluri_sitharama_raju", "KOYYURU"): "KOYYURU",
    ("alluri_sitharama_raju", "RAMPACHODAVARAM"): "RAMPACHODAVARAM",
    ("chittoor", "GUDIPALA"): "GUDIPALA",
    ("chittoor", "NAGARI"): "NAGARI",
    ("east_godavari", "RAJAHMUNDRYRURAL"): "RAJAHMUNDRYRURAL",
    ("east_godavari", "RAJAHMUNDRYURBAN"): "RAJAHMUNDRYURBAN",
    ("guntur", "GUNTURURBAN"): "GUNTURURBAN",
    ("guntur", "GUNTURRURAL"): "GUNTURRURAL",
    ("kakinada", "KAKINADARURAL"): "KAKINADARURAL",
    ("kakinada", "KAKINADAURBAN"): "KAKINADAURBAN",
    ("kurnool", "KURNOOLURBAN"): "KURNOOLURBAN",
    ("kurnool", "KURNOOLRURAL"): "KURNOOL",
    ("ntr", "VIJAYAWADAURBAN"): "VIJAYAWADAURBAN",
    ("ntr", "VIJAYAWADARURAL"): "VIJAYAWADARURAL",
    ("sri_potti_sriramulu_nellore", "NELLOREURBAN"): "NELLOREURBAN",
    ("sri_potti_sriramulu_nellore", "NELLORERURAL"): "NELLORERURAL",
    ("tirupati", "TIRUPATIURBAN"): "TIRUPATIURBAN",
    ("tirupati", "TIRUPATIRURAL"): "TIRUPATIRURAL",
    ("visakhapatnam", "VISAKHAPATNAMURBAN"): "VISAKHAPATNAMURBAN",
    ("west_godavari", "TADEPALLIGUDEM"): "TADEPALLIGUDEM",
    ("west_godavari", "BHIMAVARAM"): "BHIMAVARAM",
    ("tirupati", "TADA"): "TADA",
}

TALUK_ALIASES = {
    'UNNURPETTAI': 'ULUNDURPETTAI',
    'UNNURPET': 'ULUNDURPETTAI',
    'ULUNDURPET': 'ULUNDURPETTAI',
    'UDUMALAIPET': 'UDUMALAIPETTAI',
}


def is_jk(state_id: Optional[str]) -> bool:
    return resolve_state_key(state_id) in ["jk", "jammu_kashmir"]

def is_mp(state_id: Optional[str]) -> bool:
    return resolve_state_key(state_id) in ["mp", "madhya_pradesh"]

class DemographicsService:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._village_df: Optional[pd.DataFrame] = None
        self._reloc_df: Optional[pd.DataFrame] = None
        self._tn_village_df: Optional[pd.DataFrame] = None
        self._tn_taluk_df: Optional[pd.DataFrame] = None

    def _init_tn_village_data(self) -> None:
        if self._tn_village_df is None:
            csv_path = settings.PROCESSED_CENSUS_DIR / "tn_village_demographics.csv"
            if csv_path.exists():
                df_vill = pd.read_csv(csv_path)
                df_vill["m_norm"] = df_vill["mandal_name"].apply(normalize_name)
                df_vill["mandal_code"] = df_vill["mandal_code"].astype(str).str.strip()
                df_vill["current_district_code"] = df_vill["current_district_code"].astype(str).str.strip()
                self._tn_village_df = df_vill
            else:
                self._tn_village_df = pd.DataFrame()

        if self._tn_taluk_df is None:
            t_path = settings.PROCESSED_CENSUS_DIR / "tn_taluk_demographics.csv"
            if t_path.exists():
                df_t = pd.read_csv(t_path)
                df_t["m_norm"] = df_t["taluk_name"].apply(normalize_name)
                df_t["taluk_id"] = df_t["taluk_id"].astype(str).str.strip()
                df_t["current_district_id"] = df_t["current_district_id"].astype(str).str.strip()
                self._tn_taluk_df = df_t
            else:
                self._tn_taluk_df = pd.DataFrame()

    def _get_state_key(self, state_id: Optional[str]) -> str:
        return get_state_key(state_id)

    def _load_data(self, state_id: Optional[str] = "andhra_pradesh"):
        key = get_state_key(state_id)
        if key in self._cache:
            return self._cache[key]

        meta = state_registry.get_state(key)
        csv_path = meta.census_csv
        state_name = meta.name
        state_code = meta.code

        if not csv_path or not csv_path.exists():
            raise FileNotFoundError(f"Demographics dataset not found at {csv_path}")

        df = pd.read_csv(csv_path)

        # Standardize column mappings
        if key == "andhra_pradesh":
            code_col = "current_district_code"
            name_col = "current_district_name"
            m_code_col = "mandal_code"
            m_name_col = "mandal_name"
        else:
            code_col = "current_district_id" if "current_district_id" in df.columns else "district_id"
            name_col = "current_district_name" if "current_district_name" in df.columns else "district_name"
            if "mandal_id" in df.columns and "mandal_name" in df.columns:
                m_code_col, m_name_col = "mandal_id", "mandal_name"
            elif "circle_id" in df.columns and "circle_name" in df.columns:
                m_code_col, m_name_col = "circle_id", "circle_name"
            elif "tehsil_id" in df.columns and "tehsil_name" in df.columns:
                m_code_col, m_name_col = "tehsil_id", "tehsil_name"
            elif "block_id" in df.columns and "block_name" in df.columns:
                m_code_col, m_name_col = "block_id", "block_name"
            elif "subdivision_id" in df.columns and "subdivision_name" in df.columns:
                m_code_col, m_name_col = "subdivision_id", "subdivision_name"
            elif "taluk_id" in df.columns and "taluk_name" in df.columns:
                m_code_col, m_name_col = "taluk_id", "taluk_name"
            else:
                m_code_col, m_name_col = "mandal_code", "mandal_name"

        # Standardize column naming if needed
        if code_col not in df.columns:
            if "current_district_id" in df.columns:
                code_col = "current_district_id"
            elif "current_district_code" in df.columns:
                code_col = "current_district_code"
            elif "district_id" in df.columns:
                code_col = "district_id"

        if name_col not in df.columns:
            if "current_district_name" in df.columns:
                name_col = "current_district_name"
            elif "district_name" in df.columns:
                name_col = "district_name"

        if m_name_col not in df.columns:
            for cand in ["mandal_name", "taluka_name", "block_name", "circle_name", "tehsil_name", "subdivision_name"]:
                if cand in df.columns:
                    m_name_col = cand
                    break

        if m_code_col not in df.columns:
            for cand in ["mandal_id", "taluka_id", "block_id", "circle_id", "tehsil_id", "subdivision_id", "mandal_code"]:
                if cand in df.columns:
                    m_code_col = cand
                    break

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
            "mizoram": 830,
            "himachal_pradesh": 20690,
        }
        state_benchmark_villages = STATE_VILLAGE_BENCHMARKS.get(key, 10000)

        # Harmonize common column names for population & demographics
        pop_col = "population_total" if "population_total" in df.columns else ("total_population" if "total_population" in df.columns else "population")
        hh_col = "households" if "households" in df.columns else ("total_households" if "total_households" in df.columns else "households")
        p06_col = "population_0_6" if "population_0_6" in df.columns else ("children_0_6" if "children_0_6" in df.columns else "child_pop")
        sc_col = "population_sc" if "population_sc" in df.columns else ("sc_population" if "sc_population" in df.columns else "scheduled_castes")
        st_col = "population_st" if "population_st" in df.columns else ("st_population" if "st_population" in df.columns else "scheduled_tribes")
        work_col = "workers" if "workers" in df.columns else ("total_workers" if "total_workers" in df.columns else "workers_total")

        state_total_pop = max(1, df[pop_col].sum() if pop_col in df.columns else 1)

        grouped = df.groupby([code_col, name_col])
        district_list: List[DistrictDemographicSummary] = []
        district_summaries: Dict[str, DistrictDemographicSummary] = {}
        district_details: Dict[str, DistrictDetailResponse] = {}

        for (did, dname), grp in grouped:
            pop = int(grp[pop_col].sum()) if pop_col in grp.columns else 0
            hh = int(grp[hh_col].sum()) if hh_col in grp.columns else int(pop / 4.5)
            p06 = int(grp[p06_col].sum()) if p06_col in grp.columns else int(pop * 0.11)
            sc = int(grp[sc_col].sum()) if sc_col in grp.columns else int(pop * 0.07)
            st = int(grp[st_col].sum()) if st_col in grp.columns else int(pop * 0.12)
            workers = int(grp[work_col].sum()) if work_col in grp.columns else int(pop * 0.45)
            mandals = int(grp[m_code_col].nunique())

            p06_pct = round((p06 / pop * 100) if pop > 0 else 0.0, 2)
            sc_pct = round((sc / pop * 100) if pop > 0 else 0.0, 2)
            st_pct = round((st / pop * 100) if pop > 0 else 0.0, 2)

            # Mandal / Subunit breakdown
            mandal_grp = grp.groupby([m_code_col, m_name_col])
            mandal_list: List[MandalDemographicSummary] = []
            for (mid, mname), m_sub in mandal_grp:
                mpop = int(m_sub[pop_col].sum()) if pop_col in m_sub.columns else 0
                mhh = int(m_sub[hh_col].sum()) if hh_col in m_sub.columns else int(mpop / 4.5)
                mp06 = int(m_sub[p06_col].sum()) if p06_col in m_sub.columns else int(mpop * 0.11)
                msc = int(m_sub[sc_col].sum()) if sc_col in m_sub.columns else int(mpop * 0.07)
                mst = int(m_sub[st_col].sum()) if st_col in m_sub.columns else int(mpop * 0.12)
                mwork = int(m_sub[work_col].sum()) if work_col in m_sub.columns else int(mpop * 0.45)

                if "village_count" in m_sub.columns and int(m_sub["village_count"].sum()) > len(m_sub):
                    mvill = int(m_sub["village_count"].sum())
                elif key == "andhra_pradesh":
                    mvill = int(len(m_sub))
                else:
                    mvill = max(1, int(round((mpop / state_total_pop) * state_benchmark_villages)))

                mp06_pct = round((mp06 / mpop * 100) if mpop > 0 else 0.0, 2)
                msc_pct = round((msc / mpop * 100) if mpop > 0 else 0.0, 2)
                mst_pct = round((mst / mpop * 100) if mpop > 0 else 0.0, 2)

                mandal_list.append(MandalDemographicSummary(
                    mandal_code=str(mid),
                    mandal_name=str(mname),
                    current_district_id=str(did).lower(),
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

            villages = int(len(grp)) if key in ["ap", "andhra_pradesh"] else sum(m.village_count for m in mandal_list)

            d_summary = DistrictDemographicSummary(
                district_id=str(did).lower(),
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
                data_source=f"Census of India 2011 Primary Census Abstract ({state_name})"
            )
            district_list.append(d_summary)
            district_summaries[str(did)] = d_summary
            district_summaries[str(did).lower()] = d_summary

            mandal_list.sort(key=lambda x: x.total_population, reverse=True)
            d_detail = DistrictDetailResponse(
                district=d_summary,
                mandals=mandal_list
            )
            district_details[str(did)] = d_detail
            district_details[str(did).lower()] = d_detail
            district_details[str(dname).lower()] = d_detail

        tot_pop = int(df['population_total'].sum())
        tot_hh = int(df['households'].sum())
        tot_p06 = int(df['population_0_6'].sum())
        tot_sc = int(df['population_sc'].sum()) if 'population_sc' in df.columns else int(tot_pop * 0.07)
        tot_st = int(df['population_st'].sum()) if 'population_st' in df.columns else int(tot_pop * 0.12)
        tot_work = int(df['workers'].sum())
        tot_villages = int(len(df)) if key in ["ap", "andhra_pradesh"] else sum(d.village_count for d in district_list)

        state_summary = StateDemographicSummary(
            state_name=state_name,
            state_code=state_code,
            data_year=2011,
            data_source=f"Census of India 2011 Primary Census Abstract ({state_name})",
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
            total_mandals=int(df[m_code_col].nunique()) if m_code_col in df.columns else len(df),
            districts=district_list
        )

        data = {
            "df": df,
            "state_summary": state_summary,
            "district_summaries": district_summaries,
            "district_details": district_details
        }
        self._cache[key] = data
        return data

    def get_state_summary(self, state_id: Optional[str] = None, state: Optional[str] = None) -> StateDemographicSummary:
        data = self._load_data(state_id or state or "andhra_pradesh")
        return data["state_summary"]

    def get_district_detail(self, district_id: str, state_id: Optional[str] = None, state: Optional[str] = None) -> Optional[DistrictDetailResponse]:
        data = self._load_data(state_id or state or "andhra_pradesh")
        did = district_id.strip().lower()
        if did in data["district_details"]:
            return data["district_details"][did]
        for k, v in data["district_details"].items():
            if v.district.district_name.lower() == did or k.lower() == did:
                return v
        return None

    get_district_summary = get_district_detail

    def _init_ap_village_data(self) -> None:
        if self._village_df is None:
            csv_path = settings.PROCESSED_CENSUS_DIR / "ap_village_demographics.csv"
            if csv_path.exists():
                df_vill = pd.read_csv(csv_path)
                df_vill["m_norm"] = df_vill["mandal_name"].apply(normalize_name)
                self._village_df = df_vill
            else:
                self._village_df = pd.DataFrame()

        if self._reloc_df is None:
            reloc_path = settings.DATA_DIR / "processed" / "relocation" / "mandal_relocation_priority.csv"
            if reloc_path.exists():
                df_reloc = pd.read_csv(reloc_path)
                df_reloc["m_norm"] = df_reloc["mandal_name"].apply(normalize_name)
                self._reloc_df = df_reloc
            else:
                self._reloc_df = pd.DataFrame()

    def get_mandal_villages(
        self,
        mandal_id: str,
        state_id: Optional[str] = "andhra_pradesh",
        district_id: Optional[str] = None
    ) -> MandalVillageListResponse:
        if is_tn(state_id):
            self._init_tn_village_data()
            if self._tn_village_df is None or self._tn_village_df.empty:
                return MandalVillageListResponse(
                    mandal_id=mandal_id,
                    mandal_name=mandal_id,
                    district_name="",
                    district_code="",
                    total_villages=0,
                    villages=[],
                    has_village_data=False,
                    note="Tamil Nadu village dataset not found."
                )

            clean_query = mandal_id.strip()
            q_norm = normalize_name(clean_query)
            q_norm = TALUK_ALIASES.get(q_norm, q_norm)
            resolved_did = re.sub(r'[^a-z0-9]+', '_', district_id.strip().lower()).strip('_') if district_id else ""

            # 1. Crosswalk through administrative taluk directory if available
            target_taluk_id = None
            if self._tn_taluk_df is not None and not self._tn_taluk_df.empty:
                t_row = self._tn_taluk_df[self._tn_taluk_df["taluk_id"].str.upper() == clean_query.upper()]
                if t_row.empty and resolved_did:
                    t_row = self._tn_taluk_df[
                        (self._tn_taluk_df["current_district_id"] == resolved_did) &
                        (self._tn_taluk_df["m_norm"] == q_norm)
                    ]
                if t_row.empty:
                    t_row = self._tn_taluk_df[self._tn_taluk_df["m_norm"] == q_norm]
                if not t_row.empty:
                    target_taluk_id = str(t_row.iloc[0]["taluk_id"])

            # 2. Filter villages by resolved taluk_id, or direct code, or name
            sub = pd.DataFrame()
            if target_taluk_id:
                sub = self._tn_village_df[self._tn_village_df["mandal_code"].str.upper() == target_taluk_id.upper()]

            if sub.empty:
                sub = self._tn_village_df[self._tn_village_df["mandal_code"].str.upper() == clean_query.upper()]

            if sub.empty:
                if resolved_did:
                    sub = self._tn_village_df[
                        (self._tn_village_df["current_district_code"] == resolved_did) &
                        (self._tn_village_df["m_norm"] == q_norm)
                    ]
                if sub.empty:
                    sub = self._tn_village_df[self._tn_village_df["m_norm"] == q_norm]

            if sub.empty:
                return MandalVillageListResponse(
                    mandal_id=clean_query,
                    mandal_name=clean_query,
                    district_name="",
                    district_code=resolved_did,
                    total_villages=0,
                    villages=[],
                    has_village_data=False,
                    note=f"No Census villages found for taluk '{clean_query}'."
                )

            resolved_mid = str(sub.iloc[0]["mandal_code"])
            resolved_mname = str(sub.iloc[0]["mandal_name"])
            resolved_did = str(sub.iloc[0]["current_district_code"])
            resolved_dname = str(sub.iloc[0]["current_district_name"])

            sub_sorted = sub.sort_values(by=["village_name"], ascending=True)
            village_items: List[VillageItem] = []
            for _, row in sub_sorted.iterrows():
                village_items.append(VillageItem(
                    village_code=str(row["village_code"]),
                    village_name=str(row["village_name"]),
                    mandal_name=resolved_mname,
                    mandal_code=resolved_mid,
                    district_name=resolved_dname,
                    district_code=resolved_did,
                    population_total=int(row.get("population_total", 0) or 0),
                    households=int(row.get("households", 0) or 0),
                    population_male=int(row.get("population_male", 0) or 0),
                    population_female=int(row.get("population_female", 0) or 0),
                    population_0_6=int(row.get("population_0_6", 0) or 0) if pd.notna(row.get("population_0_6")) else 0,
                    population_sc=int(row.get("population_sc", 0) or 0) if pd.notna(row.get("population_sc")) else 0,
                    population_st=int(row.get("population_st", 0) or 0) if pd.notna(row.get("population_st")) else 0,
                    workers=int(row.get("workers", 0) or 0) if pd.notna(row.get("workers")) else 0,
                    non_workers=int(row.get("non_workers", 0) or 0) if pd.notna(row.get("non_workers")) else 0,
                    data_year=2011,
                    has_geometry=True,
                    geometry_note="Survey of India Cadastral Boundary Available"
                ))

            return MandalVillageListResponse(
                mandal_id=resolved_mid,
                mandal_name=resolved_mname,
                district_name=resolved_dname,
                district_code=resolved_did,
                total_villages=len(village_items),
                villages=village_items,
                has_village_data=True,
                note=f"Loaded {len(village_items)} Census 2011 villages."
            )

        key = get_state_key(state_id)
        if key != "andhra_pradesh":
            return MandalVillageListResponse(
                mandal_id=mandal_id,
                mandal_name=mandal_id,
                district_name="",
                district_code="",
                total_villages=0,
                villages=[],
                has_village_data=False,
                note="Village data unavailable for this unit."
            )

        self._init_ap_village_data()

        if self._village_df is None or self._village_df.empty:
            return MandalVillageListResponse(
                mandal_id=mandal_id,
                mandal_name=mandal_id,
                district_name="",
                district_code="",
                total_villages=0,
                villages=[],
                has_village_data=False,
                note="Village dataset not found."
            )

        clean_query = mandal_id.strip()
        q_norm = normalize_name(clean_query)

        resolved_mid = clean_query
        resolved_mname = clean_query
        resolved_did = re.sub(r'[^a-z0-9]+', '_', district_id.strip().lower()).strip('_') if district_id else ""
        resolved_dname = ""
        sub = pd.DataFrame()

        if self._reloc_df is not None and not self._reloc_df.empty:
            m_row = self._reloc_df[self._reloc_df["mandal_id"].str.upper() == clean_query.upper()]
            if m_row.empty and resolved_did:
                m_row = self._reloc_df[(self._reloc_df["current_district_id"] == resolved_did) & (self._reloc_df["m_norm"] == q_norm)]
            if m_row.empty:
                m_row = self._reloc_df[self._reloc_df["m_norm"] == q_norm]

            if not m_row.empty:
                r = m_row.iloc[0]
                resolved_mid = str(r["mandal_id"])
                resolved_mname = str(r["mandal_name"])
                resolved_did = str(r["current_district_id"])
                resolved_dname = str(r["current_district_name"])

                m_norm = normalize_name(resolved_mname)
                m_norm = MANDAL_ALIASES.get((resolved_did, m_norm), m_norm)

                sub = self._village_df[
                    (self._village_df["current_district_code"] == resolved_did) &
                    (self._village_df["m_norm"] == m_norm)
                ]

        if sub.empty:
            if resolved_did:
                sub = self._village_df[
                    (self._village_df["current_district_code"] == resolved_did) &
                    (self._village_df["m_norm"] == q_norm)
                ]
            if sub.empty:
                sub = self._village_df[self._village_df["m_norm"] == q_norm]

            if not sub.empty:
                resolved_mname = str(sub.iloc[0]["mandal_name"])
                resolved_did = str(sub.iloc[0]["current_district_code"])
                resolved_dname = str(sub.iloc[0]["current_district_name"])

        if sub.empty:
            return MandalVillageListResponse(
                mandal_id=resolved_mid,
                mandal_name=resolved_mname,
                district_name=resolved_dname,
                district_code=resolved_did,
                total_villages=0,
                villages=[],
                has_village_data=False,
                note="Village data unavailable in Census 2011 directory for this mandal."
            )

        sub_sorted = sub.sort_values(by=["village_name"], ascending=True)
        village_items: List[VillageItem] = []

        for _, row in sub_sorted.iterrows():
            v_name = str(row["village_name"])
            v_code = str(row["village_code"])
            pop_tot = int(row.get("population_total", 0) or 0)
            hh = int(row.get("households", 0) or 0)
            pop_m = int(row.get("population_male", 0) or 0)
            pop_f = int(row.get("population_female", 0) or 0)
            pop_06 = int(row.get("population_0_6", 0) or 0)
            pop_sc = int(row.get("population_sc", 0) or 0)
            pop_st = int(row.get("population_st", 0) or 0)
            workers = int(row.get("workers", 0) or 0)
            non_workers = int(row.get("non_workers", 0) or 0)

            village_items.append(VillageItem(
                village_code=v_code,
                village_name=v_name,
                mandal_name=str(row["mandal_name"]),
                mandal_code=str(row.get("mandal_code", "")),
                district_name=str(row["current_district_name"]),
                district_code=str(row["current_district_code"]),
                population_total=pop_tot,
                households=hh,
                population_male=pop_m,
                population_female=pop_f,
                population_0_6=pop_06,
                population_sc=pop_sc,
                population_st=pop_st,
                workers=workers,
                non_workers=non_workers,
                data_year=2011,
                has_geometry=False,
                geometry_note="Village boundary data unavailable"
            ))

        return MandalVillageListResponse(
            mandal_id=resolved_mid,
            mandal_name=resolved_mname,
            district_name=resolved_dname,
            district_code=resolved_did,
            total_villages=len(village_items),
            villages=village_items,
            has_village_data=True,
            note=f"Loaded {len(village_items)} Census 2011 villages."
        )

demographics_service = DemographicsService()

