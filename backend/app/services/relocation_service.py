import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from app.core.config import settings
from app.relocation.schemas import (
    MandalRelocationItem,
    MandalRelocationListResponse,
    TopRelocationListResponse,
    RelocationSummaryResponse,
    AHPWeightItem,
    AHPWeightsResponse,
    RelocationFactorItem,
    RelocationFactorContributionsResponse,
)
from app.capacity.schemas import (
    HostZoneCandidateItem,
    HostZoneCandidateListResponse,
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

def is_jh(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["jharkhand", "jh"]

class RelocationService:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _get_state_key(self, state_id: Optional[str]) -> str:
        if is_jh(state_id):
            return "jh"
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

        reloc_dir = settings.DATA_DIR / "processed" / "relocation"
        cap_dir = settings.DATA_DIR / "processed" / "capacity"

        if key == "jh":
            master_csv = reloc_dir / "jh_blocks_relocation_priority.csv"
            factors_csv = reloc_dir / "jh_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "jh_ahp_weights.csv"
            sum_csv = reloc_dir / "jh_relocation_priority_summary.csv"
            host_csv = cap_dir / "jh_host_zone_candidates.csv"
            geojson_path = reloc_dir / "jh_blocks_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "jharkhand_blocks.geojson"
        elif key == "mn":
            master_csv = reloc_dir / "mn_subdivisions_relocation_priority.csv"
            factors_csv = reloc_dir / "mn_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "mn_ahp_weights.csv"
            sum_csv = reloc_dir / "mn_relocation_priority_summary.csv"
            host_csv = cap_dir / "mn_host_zone_candidates.csv"
            geojson_path = reloc_dir / "mn_subdivisions_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "manipur_subdivisions.geojson"
        elif key == "ga":
            master_csv = reloc_dir / "ga_taluks_relocation_priority.csv"
            factors_csv = reloc_dir / "ga_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "ga_ahp_weights.csv"
            sum_csv = reloc_dir / "ga_relocation_priority_summary.csv"
            host_csv = cap_dir / "ga_host_zone_candidates.csv"
            geojson_path = reloc_dir / "ga_taluks_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "goa_taluks.geojson"
        elif key == "ka":
            master_csv = reloc_dir / "ka_taluks_relocation_priority.csv"
            factors_csv = reloc_dir / "ka_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "ka_ahp_weights.csv"
            sum_csv = reloc_dir / "ka_relocation_priority_summary.csv"
            host_csv = cap_dir / "ka_host_zone_candidates.csv"
            geojson_path = reloc_dir / "ka_taluks_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "karnataka_taluks.geojson"
        elif key == "mp":
            master_csv = reloc_dir / "mp_tehsils_relocation_priority.csv"
            factors_csv = reloc_dir / "mp_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "mp_ahp_weights.csv"
            sum_csv = reloc_dir / "mp_relocation_priority_summary.csv"
            host_csv = cap_dir / "mp_host_zone_candidates.csv"
            geojson_path = reloc_dir / "mp_tehsils_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "madhya_pradesh_tehsils.geojson"
        elif key == "rj":
            master_csv = reloc_dir / "rj_tehsils_relocation_priority.csv"
            factors_csv = reloc_dir / "rj_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "rj_ahp_weights.csv"
            sum_csv = reloc_dir / "rj_relocation_priority_summary.csv"
            host_csv = cap_dir / "rj_host_zone_candidates.csv"
            geojson_path = reloc_dir / "rj_tehsils_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "rajasthan_tehsils.geojson"
        elif key == "tg":
            master_csv = reloc_dir / "tg_mandal_relocation_priority.csv"
            factors_csv = reloc_dir / "tg_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "tg_ahp_weights.csv"
            sum_csv = reloc_dir / "tg_relocation_priority_summary.csv"
            host_csv = cap_dir / "tg_host_zone_candidates.csv"
            geojson_path = reloc_dir / "tg_mandal_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "telangana_mandals.geojson"
        elif key == "tr":
            master_csv = reloc_dir / "tr_subdivision_relocation_priority.csv"
            factors_csv = reloc_dir / "tr_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "tr_ahp_weights.csv"
            sum_csv = reloc_dir / "tr_relocation_priority_summary.csv"
            host_csv = cap_dir / "tr_host_zone_candidates.csv"
            geojson_path = reloc_dir / "tr_subdivision_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "tripura_sub_divisions.geojson"
        elif key == "tn":
            master_csv = reloc_dir / "tn_taluk_relocation_priority.csv"
            factors_csv = reloc_dir / "tn_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "tn_ahp_weights.csv"
            sum_csv = reloc_dir / "tn_relocation_priority_summary.csv"
            host_csv = cap_dir / "tn_host_zone_candidates.csv"
            geojson_path = reloc_dir / "tn_taluk_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "tamil_nadu_taluks.geojson"
        else:
            master_csv = reloc_dir / "mandal_relocation_priority.csv"
            factors_csv = reloc_dir / "relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "ahp_weights.csv"
            sum_csv = reloc_dir / "relocation_priority_summary.csv"
            host_csv = cap_dir / "host_zone_candidates.csv"
            geojson_path = reloc_dir / "ap_mandal_relocation_priority.geojson"

        if not master_csv.exists():
            raise FileNotFoundError(f"Relocation priority dataset not found at {master_csv}")

        data = {
            "reloc_df": pd.read_csv(master_csv),
            "factors_df": pd.read_csv(factors_csv) if factors_csv.exists() else None,
            "ahp_df": pd.read_csv(ahp_csv) if ahp_csv.exists() else None,
            "summary_df": pd.read_csv(sum_csv) if sum_csv.exists() else None,
            "host_df": pd.read_csv(host_csv) if host_csv.exists() else None,
            "geojson_path": geojson_path,
            "geojson": None
        }
        self._cache[key] = data
        return data

    def get_all_mandals(
        self,
        district_id: Optional[str] = None,
        priority_category: Optional[str] = None,
        ranking_status: Optional[str] = None,
        primary_factor: Optional[str] = None,
        state_id: Optional[str] = "andhra_pradesh"
    ) -> MandalRelocationListResponse:
        data = self._load_data(state_id)
        df = data["reloc_df"].copy()

        if district_id:
            df = df[df["current_district_id"] == district_id.strip().lower()]
        if priority_category:
            df = df[df["relocation_priority_category"].str.upper() == priority_category.strip().upper()]
        if ranking_status:
            df = df[df["ranking_status"].str.upper() == ranking_status.strip().upper()]
        if primary_factor:
            df = df[df["primary_priority_factor"].str.lower() == primary_factor.strip().lower()]

        records = df.replace({np.nan: None}).to_dict(orient="records")
        items = [MandalRelocationItem(**row) for row in records]
        return MandalRelocationListResponse(total_mandals=len(items), items=items)

    def get_mandal_detail(self, mandal_id: str, state_id: Optional[str] = "andhra_pradesh") -> Optional[MandalRelocationItem]:
        # Search specified state or auto-detect based on ID prefix
        target = mandal_id.strip().upper()
        if target.startswith("TR_"):
            detected_state = "tripura"
        elif target.startswith("TN_"):
            detected_state = "tamil_nadu"
        else:
            detected_state = state_id

        data = self._load_data(detected_state)
        df = data["reloc_df"]

        match = df[
            (df["mandal_id"] == target) |
            (df["mandal_name"].str.upper() == target)
        ]
        if match.empty and detected_state != "tripura":
            tr_data = self._load_data("tripura")
            match = tr_data["reloc_df"][
                (tr_data["reloc_df"]["mandal_id"] == target) |
                (tr_data["reloc_df"]["mandal_name"].str.upper() == target)
            ]
        if match.empty and detected_state != "tamil_nadu":
            tn_data = self._load_data("tamil_nadu")
            match = tn_data["reloc_df"][
                (tn_data["reloc_df"]["mandal_id"] == target) |
                (tn_data["reloc_df"]["mandal_name"].str.upper() == target)
            ]
        if match.empty:
            return None
        row_dict = match.iloc[0].replace({np.nan: None}).to_dict()
        return MandalRelocationItem(**row_dict)

    def get_top_prioritized(self, limit: int = 10, state_id: Optional[str] = "andhra_pradesh") -> TopRelocationListResponse:
        data = self._load_data(state_id)
        df = data["reloc_df"]
        ranked = df[df["ranking_status"] != "INSUFFICIENT_DATA"]
        top_df = ranked.sort_values(by="topsis_score", ascending=False).head(limit)
        records = top_df.replace({np.nan: None}).to_dict(orient="records")
        items = [MandalRelocationItem(**row) for row in records]
        return TopRelocationListResponse(total_returned=len(items), items=items)

    def get_summary(self, state_id: Optional[str] = "andhra_pradesh") -> RelocationSummaryResponse:
        data = self._load_data(state_id)
        df = data["reloc_df"]
        valid_df = df[df["ranking_status"] != "INSUFFICIENT_DATA"]
        cat_counts = df["relocation_priority_category"].value_counts().to_dict()

        top_10 = valid_df.sort_values(by="topsis_score", ascending=False).head(10)[
            ["relocation_priority_rank", "mandal_id", "mandal_name", "current_district_name", "topsis_score", "relocation_priority_category", "primary_priority_factor"]
        ].to_dict(orient="records")

        return RelocationSummaryResponse(
            total_mandals=len(df),
            total_mandals_ranked=len(valid_df),
            mandals_very_high_priority=cat_counts.get("VERY HIGH", 0),
            mandals_high_priority=cat_counts.get("HIGH", 0),
            mandals_moderate_priority=cat_counts.get("MODERATE", 0),
            mandals_low_priority=cat_counts.get("LOW", 0),
            mandals_insufficient_data=cat_counts.get("INSUFFICIENT-DATA", 0),
            topsis_min_score=round(float(valid_df["topsis_score"].min()), 4),
            topsis_max_score=round(float(valid_df["topsis_score"].max()), 4),
            topsis_mean_score=round(float(valid_df["topsis_score"].mean()), 4),
            ahp_consistency_ratio=0.0038,
            host_zone_candidates_pool_count=int(df["is_host_zone_candidate"].sum()),
            top_10_prioritized_mandals=top_10,
            governance_notice="Multi-Criteria Relocation Prioritization provides transparent mathematical decision support (AHP weight derivation + TOPSIS ranking) for disaster management authorities. It does NOT mandate or order population relocations."
        )

    def get_ahp_weights(self, state_id: Optional[str] = "andhra_pradesh") -> AHPWeightsResponse:
        data = self._load_data(state_id)
        records = data["ahp_df"].to_dict(orient="records") if data["ahp_df"] is not None else []
        items = [AHPWeightItem(**row) for row in records]

        matrix = [
            [1.0, 2.0, 2.0, 3.0],
            [0.5, 1.0, 1.0, 2.0],
            [0.5, 1.0, 1.0, 2.0],
            [1.0/3.0, 0.5, 0.5, 1.0]
        ]

        return AHPWeightsResponse(
            criteria_count=len(items),
            consistency_ratio=0.0038,
            consistency_status="PASS (CR < 0.10; Highly Consistent)",
            weights=items,
            pairwise_matrix=matrix,
            methodology_notes="AHP is used strictly for objective criterion weight derivation (Saaty 1-9 scale). Hazard Exposure (0.4231) reflects primary physical trigger; Capacity Stress (0.2274) and Demographic Sensitivity (0.2274) reflect in-situ resilience and social vulnerability; Accessibility Constraint (0.1221) reflects evacuation corridor limits."
        )

    def get_factor_contributions(
        self,
        district_id: Optional[str] = None,
        priority_category: Optional[str] = None,
        state_id: Optional[str] = "andhra_pradesh"
    ) -> RelocationFactorContributionsResponse:
        data = self._load_data(state_id)
        df = data["factors_df"].copy() if data["factors_df"] is not None else pd.DataFrame()

        if "current_district_id" not in df.columns:
            df = df.merge(data["reloc_df"][['mandal_id', 'current_district_id']], on='mandal_id', how='left')

        if district_id:
            df = df[df["current_district_id"] == district_id.strip().lower()]
        if priority_category:
            df = df[df["relocation_priority_category"].str.upper() == priority_category.strip().upper()]

        records = df.replace({np.nan: None}).to_dict(orient="records")
        items = [RelocationFactorItem(**row) for row in records]
        return RelocationFactorContributionsResponse(total_mandals=len(items), items=items)

    def get_geojson(self, district_id: Optional[str] = None, state_id: Optional[str] = "andhra_pradesh") -> Dict[str, Any]:
        data = self._load_data(state_id)
        if data["geojson"] is None:
            geojson_path = data["geojson_path"]
            if not geojson_path.exists():
                raise FileNotFoundError(f"Relocation GeoJSON not found at {geojson_path}")
            with open(geojson_path, "r", encoding="utf-8") as f:
                data["geojson"] = json.load(f)

        if not district_id:
            return data["geojson"]

        target_did = district_id.strip().lower()
        filtered = [
            feat for feat in data["geojson"].get("features", [])
            if str(feat.get("properties", {}).get("current_district_id", "")).lower() == target_did
        ]
        return {
            "type": "FeatureCollection",
            "features": filtered
        }

    def get_host_zones_for_mandal(self, mandal_id: str, state_id: Optional[str] = "andhra_pradesh") -> HostZoneCandidateListResponse:
        target = mandal_id.strip().upper()
        if target.startswith("TR_") or (state_id and is_tr(state_id)):
            detected_state = "tripura"
        elif target.startswith("TN_") or (state_id and is_tn(state_id)):
            detected_state = "tamil_nadu"
        else:
            detected_state = state_id

        data = self._load_data(detected_state)
        host_df = data["host_df"]

        match = host_df[
            (host_df["source_mandal_id"] == target) |
            (host_df["source_mandal_name"].str.upper() == target)
        ]

        if match.empty and detected_state != "tripura":
            tr_data = self._load_data("tripura")
            match = tr_data["host_df"][
                (tr_data["host_df"]["source_mandal_id"] == target) |
                (tr_data["host_df"]["source_mandal_name"].str.upper() == target)
            ]
        if match.empty and detected_state != "tamil_nadu":
            tn_data = self._load_data("tamil_nadu")
            match = tn_data["host_df"][
                (tn_data["host_df"]["source_mandal_id"] == target) |
                (tn_data["host_df"]["source_mandal_name"].str.upper() == target)
            ]

        records = match.replace({np.nan: None}).to_dict(orient="records")
        items = [HostZoneCandidateItem(**row) for row in records]

        return HostZoneCandidateListResponse(
            source_mandal_id=target,
            total_candidates=len(items),
            candidates=items,
            governance_disclaimer="CANDIDATE HOST ZONE — HUMAN REVIEW REQUIRED. Distances computed in EPSG:7755 (India Albers Equal Area). Screened candidate zones satisfy low hazard, low vulnerability, and safe headroom criteria. This information provides decision support for district planning authorities and is NOT an automated relocation order."
        )

relocation_service = RelocationService()
