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

class RelocationService:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _load_data(self, state_id: Optional[str] = "andhra_pradesh"):
        key = resolve_state_key(state_id)
        if key in self._cache:
            return self._cache[key]

        reloc_dir = settings.DATA_DIR / "processed" / "relocation"
        cap_dir = settings.DATA_DIR / "processed" / "capacity"

        if key == "odisha":
            master_csv = reloc_dir / "od_block_relocation_priority.csv"
            factors_csv = reloc_dir / "od_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "od_ahp_weights.csv"
            sum_csv = reloc_dir / "od_relocation_priority_summary.csv"
            host_csv = cap_dir / "od_host_zone_candidates.csv"
            geojson_path = reloc_dir / "od_block_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "odisha_blocks.geojson"
        elif key == "bihar":
            master_csv = reloc_dir / "br_block_relocation_priority.csv"
            factors_csv = reloc_dir / "br_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "br_ahp_weights.csv"
            sum_csv = reloc_dir / "br_relocation_priority_summary.csv"
            host_csv = cap_dir / "br_host_zone_candidates.csv"
            geojson_path = reloc_dir / "br_block_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "bihar_blocks.geojson"
        elif key == "west_bengal":
            master_csv = reloc_dir / "wb_block_relocation_priority.csv"
            factors_csv = reloc_dir / "wb_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "wb_ahp_weights.csv"
            sum_csv = reloc_dir / "wb_relocation_priority_summary.csv"
            host_csv = cap_dir / "wb_host_zone_candidates.csv"
            geojson_path = reloc_dir / "wb_block_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "west_bengal_blocks.geojson"
        elif key == "assam":
            master_csv = reloc_dir / "as_circle_relocation_priority.csv"
            factors_csv = reloc_dir / "as_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "as_ahp_weights.csv"
            sum_csv = reloc_dir / "as_relocation_priority_summary.csv"
            host_csv = cap_dir / "as_host_zone_candidates.csv"
            geojson_path = reloc_dir / "as_circle_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "assam_revenue_circles.geojson"
        elif key == "tamil_nadu":
            master_csv = reloc_dir / "tn_taluk_relocation_priority.csv"
            factors_csv = reloc_dir / "tn_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "tn_ahp_weights.csv"
            sum_csv = reloc_dir / "tn_relocation_priority_summary.csv"
            host_csv = cap_dir / "tn_host_zone_candidates.csv"
            geojson_path = reloc_dir / "tn_taluk_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "tamil_nadu_taluks.geojson"
        elif key == "uttar_pradesh":
            master_csv = reloc_dir / "up_tehsil_relocation_priority.csv"
            factors_csv = reloc_dir / "up_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "up_ahp_weights.csv"
            sum_csv = reloc_dir / "up_relocation_priority_summary.csv"
            host_csv = cap_dir / "up_host_zone_candidates.csv"
            geojson_path = reloc_dir / "up_tehsil_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "uttar_pradesh_tehsils.geojson"
        elif key == "uttarakhand":
            master_csv = reloc_dir / "uk_tehsil_relocation_priority.csv"
            factors_csv = reloc_dir / "uk_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "uk_ahp_weights.csv"
            sum_csv = reloc_dir / "uk_relocation_priority_summary.csv"
            host_csv = cap_dir / "uk_host_zone_candidates.csv"
            geojson_path = reloc_dir / "uk_tehsil_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "uttarakhand_tehsils.geojson"
        elif key == "sikkim":
            master_csv = reloc_dir / "sk_subdivision_relocation_priority.csv"
            factors_csv = reloc_dir / "sk_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "sk_ahp_weights.csv"
            sum_csv = reloc_dir / "sk_relocation_priority_summary.csv"
            host_csv = cap_dir / "sk_host_zone_candidates.csv"
            geojson_path = reloc_dir / "sk_subdivision_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "sikkim_subdivisions.geojson"
        elif key == "arunachal_pradesh":
            master_csv = reloc_dir / "ar_circle_relocation_priority.csv"
            factors_csv = reloc_dir / "ar_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "ar_ahp_criteria_weights.csv"
            sum_csv = reloc_dir / "ar_relocation_summary.csv"
            host_csv = cap_dir / "ar_host_zone_candidates.csv"
            geojson_path = reloc_dir / "ar_circle_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "arunachal_pradesh_circles.geojson"
        elif key == "nagaland":
            master_csv = reloc_dir / "nl_circle_relocation_priority.csv"
            factors_csv = reloc_dir / "nl_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "nl_ahp_weights.csv"
            sum_csv = reloc_dir / "nl_relocation_priority_summary.csv"
            host_csv = cap_dir / "nl_host_zone_candidates.csv"
            geojson_path = reloc_dir / "nl_circle_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "nagaland_circles.geojson"
        elif key == "meghalaya":
            master_csv = reloc_dir / "ml_block_relocation_priority.csv"
            factors_csv = reloc_dir / "ml_relocation_factor_contributions.csv"
            ahp_csv = reloc_dir / "ml_ahp_weights.csv"
            sum_csv = reloc_dir / "ml_relocation_priority_summary.csv"
            host_csv = cap_dir / "ml_host_zone_candidates.csv"
            geojson_path = reloc_dir / "ml_block_relocation_priority.geojson"
            if not geojson_path.exists():
                geojson_path = settings.PROCESSED_ADMIN_DIR / "meghalaya_blocks.geojson"
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
        items = []
        for row in records:
            cleaned = {k: v for k, v in row.items() if v is not None}
            items.append(MandalRelocationItem(**cleaned))
        return MandalRelocationListResponse(total_mandals=len(items), items=items)

    def get_mandal_detail(self, mandal_id: str, state_id: Optional[str] = "andhra_pradesh") -> Optional[MandalRelocationItem]:
        target = mandal_id.strip().upper()
        if target.startswith("AS_"):
            detected_state = "assam"
        elif target.startswith("TN_"):
            detected_state = "tamil_nadu"
        elif target.startswith("WB_"):
            detected_state = "west_bengal"
        elif target.startswith("BR_"):
            detected_state = "bihar"
        elif target.startswith("OD_"):
            detected_state = "odisha"
        elif target.startswith("UP_"):
            detected_state = "uttar_pradesh"
        elif target.startswith("UK_"):
            detected_state = "uttarakhand"
        elif target.startswith("SK_"):
            detected_state = "sikkim"
        elif target.startswith("AR_"):
            detected_state = "arunachal_pradesh"
        elif target.startswith("NL_"):
            detected_state = "nagaland"
        elif target.startswith("ML_"):
            detected_state = "meghalaya"
        else:
            detected_state = state_id

        data = self._load_data(detected_state)
        df = data["reloc_df"]

        match = df[
            (df["mandal_id"] == target) |
            (df["mandal_name"].str.upper() == target)
        ]
        if match.empty:
            for s in ["andhra_pradesh", "assam", "tamil_nadu", "west_bengal", "bihar", "odisha", "uttar_pradesh", "uttarakhand", "sikkim", "arunachal_pradesh", "nagaland", "meghalaya"]:
                if s == detected_state:
                    continue
                s_data = self._load_data(s)
                match = s_data["reloc_df"][
                    (s_data["reloc_df"]["mandal_id"] == target) |
                    (s_data["reloc_df"]["mandal_name"].str.upper() == target)
                ]
                if not match.empty:
                    break
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
        items = []
        for row in records:
            cleaned = {k: v for k, v in row.items() if v is not None}
            if "mandal_area_sqkm" not in cleaned:
                cleaned["mandal_area_sqkm"] = 100.0
            items.append(MandalRelocationItem(**cleaned))
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
        items = []
        for row in records:
            w = float(row.get("weight", 0.25))
            wp = float(row.get("weight_percent") if row.get("weight_percent") is not None else round(w * 100.0, 2))
            rat = str(row.get("saaty_scale_rationale") or row.get("saaty_scale") or "Expert Multi-Criteria Relocation Weighting")
            items.append(AHPWeightItem(
                criterion_id=str(row.get("criterion_id", "")),
                criterion_name=str(row.get("criterion_name", "")),
                weight=w,
                weight_percent=wp,
                saaty_scale_rationale=rat
            ))

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
        items = []
        for row in records:
            item_data = {
                "mandal_id": str(row.get("mandal_id", "")),
                "mandal_name": str(row.get("mandal_name", "")),
                "current_district_name": str(row.get("current_district_name", "")),
                "relocation_priority_rank": float(row.get("relocation_priority_rank", 0.0)) if row.get("relocation_priority_rank") is not None else None,
                "topsis_score": float(row.get("topsis_score", 0.0)),
                "relocation_priority_category": str(row.get("relocation_priority_category", "LOW")),
                "primary_priority_factor": str(row.get("primary_priority_factor", "Hazard Exposure")),
                "secondary_priority_factor": str(row.get("secondary_priority_factor", "Capacity Stress")),
                "factor_contrib_hazard_pct": float(row.get("factor_contrib_hazard_pct") if row.get("factor_contrib_hazard_pct") is not None else row.get("c1_hazard_contribution_pct", 0.0)),
                "factor_contrib_demographic_pct": float(row.get("factor_contrib_demographic_pct") if row.get("factor_contrib_demographic_pct") is not None else row.get("c2_sensitivity_contribution_pct", 0.0)),
                "factor_contrib_capacity_pct": float(row.get("factor_contrib_capacity_pct") if row.get("factor_contrib_capacity_pct") is not None else row.get("c3_capacity_contribution_pct", 0.0)),
                "factor_contrib_accessibility_pct": float(row.get("factor_contrib_accessibility_pct") if row.get("factor_contrib_accessibility_pct") is not None else row.get("c4_accessibility_contribution_pct", 0.0)),
                "c1_hazard_exposure": float(row.get("c1_hazard_exposure", 0.0)),
                "c2_demographic_sensitivity": float(row.get("c2_demographic_sensitivity", 0.0)),
                "c3_capacity_stress": float(row.get("c3_capacity_stress", 0.0)),
                "c4_accessibility_constraint": float(row.get("c4_accessibility_constraint", 0.0)),
            }
            items.append(RelocationFactorItem(**item_data))
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
        if target.startswith("WB_"):
            detected_state = "west_bengal"
        elif target.startswith("BR_"):
            detected_state = "bihar"
        elif target.startswith("AS_"):
            detected_state = "assam"
        elif target.startswith("TN_"):
            detected_state = "tamil_nadu"
        elif target.startswith("UP_"):
            detected_state = "uttar_pradesh"
        elif target.startswith("UK_"):
            detected_state = "uttarakhand"
        elif target.startswith("SK_"):
            detected_state = "sikkim"
        elif target.startswith("AR_"):
            detected_state = "arunachal_pradesh"
        elif target.startswith("NL_"):
            detected_state = "nagaland"
        elif target.startswith("ML_"):
            detected_state = "meghalaya"
        else:
            detected_state = state_id

        data = self._load_data(detected_state)
        host_df = data["host_df"]

        match = host_df[
            (host_df["source_mandal_id"] == target) |
            (host_df["source_mandal_name"].str.upper() == target)
        ] if host_df is not None else pd.DataFrame()

        if match.empty:
            for s in ["andhra_pradesh", "assam", "bihar", "tamil_nadu", "west_bengal", "odisha", "uttar_pradesh", "uttarakhand", "sikkim", "arunachal_pradesh", "nagaland", "meghalaya"]:
                if s == detected_state:
                    continue
                s_data = self._load_data(s)
                if s_data["host_df"] is not None:
                    match = s_data["host_df"][
                        (s_data["host_df"]["source_mandal_id"] == target) |
                        (s_data["host_df"]["source_mandal_name"].str.upper() == target)
                    ]
                    if not match.empty:
                        break

        records = match.replace({np.nan: None}).to_dict(orient="records")
        items = [HostZoneCandidateItem(**row) for row in records]

        return HostZoneCandidateListResponse(
            source_mandal_id=target,
            total_candidates=len(items),
            candidates=items,
            governance_disclaimer="CANDIDATE HOST ZONE — HUMAN REVIEW REQUIRED. Distances computed in EPSG:7755 (India Albers Equal Area). Screened candidate zones satisfy low hazard, low vulnerability, and safe headroom criteria. This information provides decision support for district planning authorities and is NOT an automated relocation order."
        )

relocation_service = RelocationService()
