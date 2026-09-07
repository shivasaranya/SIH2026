import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
import pandas as pd
from app.core.config import settings
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

MANDAL_ALIASES = {
    ('alluri_sitharama_raju', 'ARUKUVALLEY'): 'ARAKUVALLEY',
    ('alluri_sitharama_raju', 'GKVEEDHI'): 'GUDEMKOTHAVEEDHI',
    ('alluri_sitharama_raju', 'MUNCHINGIPUTTU'): 'MUNCHINGIPUTTU',
    ('alluri_sitharama_raju', 'PEDABAYALU'): 'PEDABAYALU',
    ('anakapalli', 'ANAKAPALLI'): 'ANAKAPALLE',
    ('anakapalli', 'NAKKAPALLI'): 'NAKKAPALLE',
    ('anakapalli', 'RAVIKAMATAM'): 'RAVIKAMATHAM',
    ('eluru', 'UNGUTUR'): 'UNGUTURU',
    ('palnadu', 'SAVALYAPURAM'): 'SAVALYAPURAM',
    ('palnadu', 'CHILAKALURIPET'): 'CHILAKALURIPET',
    ('bapatla', 'CHERUKUPALLE'): 'CHERUKUPALLE',
    ('annamayya', 'VAYALPAD'): 'VALMIKIPURAM',
    ('vizianagaram', 'REGIDIAMADALAVALASA'): 'REGIDIAMADALAVALASA',
    ('anakapalli', 'DEVARAPALLE'): 'DEVARAPALLE',
    ('parvathipuram_manyam', 'SEETHANAGARAM'): 'SEETHANAGARAM',
    ('anakapalli', 'KKOTAPADU'): 'KKOTAPADU',
    ('alluri_sitharama_raju', 'GMADUGULA'): 'GMADUGULA',
    ('alluri_sitharama_raju', 'YRAMAVARAM'): 'YRAMAVARAM',
    ('east_godavari', 'RAJAHMUNDRYRURAL'): 'RAJAHMUNDRYRURAL',
    ('east_godavari', 'SEETHANAGARAM'): 'SEETHANAGARAM',
}

def is_tn(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["tamil_nadu", "tn", "tamilnadu"]

def is_mizoram(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["mizoram", "mz", "mizo"]

class DemographicsService:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._village_df: Optional[pd.DataFrame] = None
        self._reloc_df: Optional[pd.DataFrame] = None

    def _get_state_key(self, state_id: Optional[str]) -> str:
        if is_mizoram(state_id):
            return "mz"
        if is_tn(state_id):
            return "tn"
        return "ap"

    def _load_data(self, state_id: Optional[str] = "andhra_pradesh"):
        key = self._get_state_key(state_id)
        if key in self._cache:
            return self._cache[key]

        if key == "mz":
            csv_path = settings.PROCESSED_CENSUS_DIR / "mizoram_rd_block_demographics.csv"
            state_name = "Mizoram"
            state_code = "MZ"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "block_id"
            m_name_col = "block_name"
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
            hh = int(grp['households'].sum())
            p06 = int(grp['population_0_6'].sum())
            sc = int(grp['population_sc'].sum()) if 'population_sc' in grp.columns else int(pop * 0.20)
            st = int(grp['population_st'].sum()) if 'population_st' in grp.columns else int(pop * 0.01)
            workers = int(grp['workers'].sum())
            villages = int(len(grp))
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
                data_source="Census of India 2011 Primary Census Abstract"
            )
            district_list.append(d_summary)
            district_summaries[str(did)] = d_summary

            # Mandal breakdown
            mandal_grp = grp.groupby([m_code_col, m_name_col])
            mandal_list: List[MandalDemographicSummary] = []
            for (mid, mname), m_sub in mandal_grp:
                mpop = int(m_sub['population_total'].sum())
                mhh = int(m_sub['households'].sum())
                mp06 = int(m_sub['population_0_6'].sum())
                msc = int(m_sub['population_sc'].sum()) if 'population_sc' in m_sub.columns else int(mpop * 0.20)
                mst = int(m_sub['population_st'].sum()) if 'population_st' in m_sub.columns else int(mpop * 0.01)
                mwork = int(m_sub['workers'].sum())
                mvill = int(len(m_sub))
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
        tot_hh = int(df['households'].sum())
        tot_p06 = int(df['population_0_6'].sum())
        tot_sc = int(df['population_sc'].sum()) if 'population_sc' in df.columns else int(tot_pop * 0.20)
        tot_st = int(df['population_st'].sum()) if 'population_st' in df.columns else int(tot_pop * 0.01)
        tot_work = int(df['workers'].sum())

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
            total_villages=int(len(df)),
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
            return MandalVillageListResponse(
                mandal_id=mandal_id,
                mandal_name=mandal_id,
                district_name="",
                district_code="",
                total_villages=0,
                villages=[],
                has_village_data=False,
                note="Village data unavailable for this unit (Taluk-level Census dataset active)."
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

        # 1. Resolve mandal from reloc_df
        resolved_mid = clean_query
        resolved_mname = clean_query
        resolved_did = re.sub(r'[^a-z0-9]+', '_', district_id.strip().lower()).strip('_') if district_id else ""
        resolved_dname = ""
        sub = pd.DataFrame()

        if self._reloc_df is not None and not self._reloc_df.empty:
            # Match by exact mandal_id
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

        # 2. Fallback: match directly against df_vill if not resolved via reloc_df
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

        # Sort villages alphabetically
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
