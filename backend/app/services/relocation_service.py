import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from app.core.config import settings
from app.core.state_config import resolve_state_config
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

class RelocationService:
    def __init__(self):
        self._cache_reloc_df: Dict[str, pd.DataFrame] = {}
        self._cache_factors_df: Dict[str, pd.DataFrame] = {}
        self._cache_ahp_df: Dict[str, pd.DataFrame] = {}
        self._cache_host_candidates_df: Dict[str, pd.DataFrame] = {}
        self._cache_reloc_geojson: Dict[str, Dict[str, Any]] = {}

    def _load_data_for_state(self, state_key: str):
        if state_key in self._cache_reloc_df:
            return

        cfg = resolve_state_config(state_key)
        reloc_dir = settings.DATA_DIR / "processed" / "relocation"
        master_csv = reloc_dir / cfg.relocation_priority_csv_filename
        if not master_csv.exists():
            raise FileNotFoundError(f"Relocation priority dataset not found at {master_csv}")
        self._cache_reloc_df[state_key] = pd.read_csv(master_csv)

        factors_csv = reloc_dir / cfg.relocation_factors_csv_filename
        if factors_csv.exists():
            self._cache_factors_df[state_key] = pd.read_csv(factors_csv)
        else:
            self._cache_factors_df[state_key] = self._cache_reloc_df[state_key]

        ahp_csv = reloc_dir / cfg.ahp_weights_csv_filename
        if ahp_csv.exists():
            self._cache_ahp_df[state_key] = pd.read_csv(ahp_csv)
        else:
            self._cache_ahp_df[state_key] = pd.DataFrame([
                {"criterion_code": "C1", "criterion_name": "Hazard Exposure", "weight": 0.4231, "percentage": 42.31, "rank": 1},
                {"criterion_code": "C2", "criterion_name": "Demographic Sensitivity", "weight": 0.2274, "percentage": 22.74, "rank": 2},
                {"criterion_code": "C3", "criterion_name": "Capacity Stress", "weight": 0.2274, "percentage": 22.74, "rank": 3},
                {"criterion_code": "C4", "criterion_name": "Accessibility Constraint", "weight": 0.1221, "percentage": 12.21, "rank": 4},
            ])

        host_csv = settings.DATA_DIR / "processed" / "capacity" / cfg.host_candidates_csv_filename
        if host_csv.exists():
            self._cache_host_candidates_df[state_key] = pd.read_csv(host_csv)
        else:
            self._cache_host_candidates_df[state_key] = pd.DataFrame()

    def get_all_mandals(
        self,
        district_id: Optional[str] = None,
        priority_category: Optional[str] = None,
        ranking_status: Optional[str] = None,
        primary_factor: Optional[str] = None,
        state: Optional[str] = None,
    ) -> MandalRelocationListResponse:
        cfg = resolve_state_config(state)
        self._load_data_for_state(cfg.state_id)
        df = self._cache_reloc_df[cfg.state_id].copy()

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

    def get_mandal_detail(self, mandal_id: str, state: Optional[str] = None) -> Optional[MandalRelocationItem]:
        cfg = resolve_state_config(state)
        self._load_data_for_state(cfg.state_id)
        df = self._cache_reloc_df[cfg.state_id]

        target = mandal_id.strip().upper()
        match = df[
            (df["mandal_id"] == target) |
            (df["mandal_name"].str.upper() == target)
        ]
        if match.empty and "taluka_id" in df.columns:
            match = df[
                (df["taluka_id"] == target) |
                (df["taluka_name"].str.upper() == target)
            ]
        if match.empty:
            return None
        row_dict = match.iloc[0].replace({np.nan: None}).to_dict()
        return MandalRelocationItem(**row_dict)

    def get_top_prioritized(self, limit: int = 10, state: Optional[str] = None) -> TopRelocationListResponse:
        cfg = resolve_state_config(state)
        self._load_data_for_state(cfg.state_id)
        df = self._cache_reloc_df[cfg.state_id]

        ranked = df[df["ranking_status"] != "INSUFFICIENT_DATA"]
        top_df = ranked.sort_values(by="topsis_score", ascending=False).head(limit)
        records = top_df.replace({np.nan: None}).to_dict(orient="records")
        items = [MandalRelocationItem(**row) for row in records]
        return TopRelocationListResponse(total_returned=len(items), items=items)

    def get_summary(self, state: Optional[str] = None) -> RelocationSummaryResponse:
        cfg = resolve_state_config(state)
        self._load_data_for_state(cfg.state_id)
        df = self._cache_reloc_df[cfg.state_id]

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
            host_zone_candidates_pool_count=int(df["is_host_zone_candidate"].sum()) if "is_host_zone_candidate" in df.columns else 0,
            top_10_prioritized_mandals=top_10,
            governance_notice=f"Multi-Criteria Relocation Prioritization provides transparent mathematical decision support (AHP weight derivation + TOPSIS ranking) for disaster management authorities in {cfg.state_name}. It does NOT mandate or order population relocations."
        )

    def get_ahp_weights(self, state: Optional[str] = None) -> AHPWeightsResponse:
        cfg = resolve_state_config(state)
        self._load_data_for_state(cfg.state_id)
        records = self._cache_ahp_df[cfg.state_id].to_dict(orient="records")
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
            methodology_notes=f"AHP criteria weights for {cfg.state_name}: Hazard Exposure (0.4231), Demographic Sensitivity (0.2274), Capacity Stress (0.2274), Accessibility Constraint (0.1221)."
        )

    def get_factor_contributions(
        self,
        district_id: Optional[str] = None,
        priority_category: Optional[str] = None,
        state: Optional[str] = None,
    ) -> RelocationFactorContributionsResponse:
        cfg = resolve_state_config(state)
        self._load_data_for_state(cfg.state_id)
        df = self._cache_factors_df[cfg.state_id].copy()

        if district_id:
            df = df[df["current_district_id"] == district_id.strip().lower()]
        if priority_category:
            df = df[df["relocation_priority_category"].str.upper() == priority_category.strip().upper()]

        records = df.replace({np.nan: None}).to_dict(orient="records")
        items = [RelocationFactorItem(**row) for row in records]
        return RelocationFactorContributionsResponse(total_mandals=len(items), items=items)

    def get_geojson(self, district_id: Optional[str] = None, state: Optional[str] = None) -> Dict[str, Any]:
        cfg = resolve_state_config(state)
        state_key = cfg.state_id

        if state_key not in self._cache_reloc_geojson:
            geojson_path = settings.DATA_DIR / "processed" / "relocation" / cfg.relocation_geojson_filename
            if not geojson_path.exists():
                raise FileNotFoundError(f"Relocation GeoJSON not found at {geojson_path}")
            with open(geojson_path, "r", encoding="utf-8") as f:
                self._cache_reloc_geojson[state_key] = json.load(f)

        full_geojson = self._cache_reloc_geojson[state_key]
        if not district_id:
            return full_geojson

        target_did = district_id.strip().lower()
        filtered = [
            feat for feat in full_geojson.get("features", [])
            if str(feat.get("properties", {}).get("current_district_id", "")).lower() == target_did
        ]
        return {
            "type": "FeatureCollection",
            "features": filtered
        }

    def get_host_zones_for_mandal(self, mandal_id: str, state: Optional[str] = None) -> HostZoneCandidateListResponse:
        cfg = resolve_state_config(state)
        self._load_data_for_state(cfg.state_id)
        df = self._cache_host_candidates_df[cfg.state_id]

        target = mandal_id.strip().upper()
        match = pd.DataFrame()
        if not df.empty and "source_mandal_id" in df.columns:
            match = df[
                (df["source_mandal_id"] == target) |
                (df["source_mandal_name"].str.upper() == target)
            ]

        records = match.replace({np.nan: None}).to_dict(orient="records") if not match.empty else []
        items = [HostZoneCandidateItem(**row) for row in records]

        return HostZoneCandidateListResponse(
            source_mandal_id=target,
            total_candidates=len(items),
            candidates=items,
            governance_disclaimer=f"CANDIDATE HOST ZONE — HUMAN REVIEW REQUIRED. Distances computed in EPSG:7755 (India Albers Equal Area). Screened candidate zones satisfy low hazard, low vulnerability, and safe headroom criteria in {cfg.state_name}."
        )

relocation_service = RelocationService()
