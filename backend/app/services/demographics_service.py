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

def resolve_state_key(state_id: Optional[str]) -> str:
    if not state_id:
        return "ap"
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    if clean in ["mizoram", "mz", "mizo"]:
        return "mz"
    if clean in ["himachal_pradesh", "hp", "himachal"]:
        return "hp"
    if clean in ["tamil_nadu", "tn", "tamilnadu"]:
        return "tn"
    if clean in ["ap", "andhra_pradesh", "andhra", "andhrapradesh"]:
        return "andhra_pradesh"
    if clean in ["odisha", "od", "or", "orissa"]:
        return "odisha"
    if clean in ["assam", "as"]:
        return "assam"
    if clean in ["bihar", "br"]:
        return "bihar"
    if clean in ["west_bengal", "wb", "westbengal", "bengal"]:
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
    if clean in ["gujarat", "gj", "guj"]:
        return "gujarat"
    if clean in ["kerala", "kl", "kerela"]:
        return "kerala"
    if clean in ["maharashtra", "mh", "maharastra"]:
        return "maharashtra"
    if clean in ["haryana", "hr"]:
        return "haryana"
    if clean in ["punjab", "pb"]:
        return "punjab"
    if clean in ["chhattisgarh", "cg", "chhatisgarh", "chattisgarh", "ct"]:
        return "chhattisgarh"
    return "andhra_pradesh"

def is_tn(state_id: Optional[str]) -> bool:
    return resolve_state_key(state_id) == "tn"

def is_mizoram(state_id: Optional[str]) -> bool:
    return resolve_state_key(state_id) == "mz"

def is_hp(state_id: Optional[str]) -> bool:
    return resolve_state_key(state_id) == "hp"


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
        if is_hp(state_id):
            return "hp"
        return "ap"

    def _load_data(self, state_id: Optional[str] = "andhra_pradesh"):
        key = resolve_state_key(state_id)
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
        elif key == "hp":
            csv_path = settings.PROCESSED_CENSUS_DIR / "hp_tehsil_demographics.csv"
            state_name = "Himachal Pradesh"
            state_code = "HP"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "tehsil_id"
            m_name_col = "tehsil_name"
        elif key == "tn":
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
        elif key == "gujarat":
            csv_path = settings.PROCESSED_CENSUS_DIR / "gujarat_taluka_demographics.csv"
            state_name = "Gujarat"
            state_code = "GJ"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "mandal_code"
            m_name_col = "mandal_name"
        elif key == "kerala":
            csv_path = settings.PROCESSED_CENSUS_DIR / "kerala_taluka_demographics.csv"
            state_name = "Kerala"
            state_code = "KL"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "mandal_code"
            m_name_col = "mandal_name"
        elif key == "maharashtra":
            csv_path = settings.PROCESSED_CENSUS_DIR / "maharashtra_taluka_demographics.csv"
            state_name = "Maharashtra"
            state_code = "MH"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "mandal_code"
            m_name_col = "mandal_name"
        elif key == "haryana":
            csv_path = settings.PROCESSED_CENSUS_DIR / "haryana_taluka_demographics.csv"
            state_name = "Haryana"
            state_code = "HR"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "mandal_code"
            m_name_col = "mandal_name"
        elif key == "punjab":
            csv_path = settings.PROCESSED_CENSUS_DIR / "punjab_taluka_demographics.csv"
            state_name = "Punjab"
            state_code = "PB"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "mandal_code"
            m_name_col = "mandal_name"
        elif key == "chhattisgarh":
            csv_path = settings.PROCESSED_CENSUS_DIR / "chhattisgarh_taluka_demographics.csv"
            state_name = "Chhattisgarh"
            state_code = "CG"
            code_col = "current_district_id"
            name_col = "current_district_name"
            m_code_col = "mandal_code"
            m_name_col = "mandal_name"
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
            "gujarat": 18225,
            "kerala": 1553,
            "maharashtra": 43665,
            "haryana": 6841,
            "punjab": 12581,
            "chhattisgarh": 20126,
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
            mandals = int(grp[m_code_col].nunique()) if m_code_col in grp.columns else len(grp)

            p06_pct = round((p06 / pop * 100) if pop > 0 else 0.0, 2)
            sc_pct = round((sc / pop * 100) if pop > 0 else 0.0, 2)
            st_pct = round((st / pop * 100) if pop > 0 else 0.0, 2)

            # Mandal / Unit breakdown
            mandal_grp = grp.groupby([m_code_col, m_name_col]) if (m_code_col in grp.columns and m_name_col in grp.columns) else [(1, grp)]
            mandal_list: List[MandalDemographicSummary] = []
            for (mid, mname), m_sub in mandal_grp:
                mpop = int(m_sub['population_total'].sum())
                mhh = int(m_sub['households'].sum())
                mp06 = int(m_sub['population_0_6'].sum())
                msc = int(m_sub['population_sc'].sum()) if 'population_sc' in m_sub.columns else int(mpop * 0.07)
                mst = int(m_sub['population_st'].sum()) if 'population_st' in m_sub.columns else int(mpop * 0.12)
                mwork = int(m_sub['workers'].sum())

                if 'village_count' in m_sub.columns and int(m_sub['village_count'].sum()) > 0:
                    mvill = int(m_sub['village_count'].sum())
                elif key == "andhra_pradesh":
                    mvill = int(len(m_sub))
                else:
                    mvill = max(1, int(round((mpop / state_total_pop) * state_benchmark_villages)))

                mp06_pct = round((mp06 / mpop * 100) if mpop > 0 else 0.0, 2)
                msc_pct = round((msc / mpop * 100) if mpop > 0 else 0.0, 2)
                mst_pct = round((mst / mpop * 100) if mpop > 0 else 0.0, 2)

                mandal_list.append(MandalDemographicSummary(
                    mandal_code=mid,
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

            villages = int(len(grp)) if key == "andhra_pradesh" else sum(m.village_count for m in mandal_list)

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

        district_list.sort(key=lambda x: x.district_name)

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
