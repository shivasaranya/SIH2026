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


class RelocationService:
    def __init__(self):
        self._reloc_df: Optional[pd.DataFrame] = None
        self._factors_df: Optional[pd.DataFrame] = None
        self._ahp_df: Optional[pd.DataFrame] = None
        self._diag_df: Optional[pd.DataFrame] = None
        self._summary_df: Optional[pd.DataFrame] = None
        self._host_candidates_df: Optional[pd.DataFrame] = None
        self._reloc_geojson: Optional[Dict[str, Any]] = None

    def _load_data(self):
        if self._reloc_df is not None:
            return

        reloc_dir = settings.DATA_DIR / "processed" / "relocation"
        master_csv = reloc_dir / "mandal_relocation_priority.csv"
        if not master_csv.exists():
            raise FileNotFoundError(f"Relocation priority dataset not found at {master_csv}")
        self._reloc_df = pd.read_csv(master_csv)

        factors_csv = reloc_dir / "relocation_factor_contributions.csv"
        if factors_csv.exists():
            self._factors_df = pd.read_csv(factors_csv)

        ahp_csv = reloc_dir / "ahp_weights.csv"
        if ahp_csv.exists():
            self._ahp_df = pd.read_csv(ahp_csv)

        diag_csv = reloc_dir / "topsis_diagnostics.csv"
        if diag_csv.exists():
            self._diag_df = pd.read_csv(diag_csv)

        sum_csv = reloc_dir / "relocation_priority_summary.csv"
        if sum_csv.exists():
            self._summary_df = pd.read_csv(sum_csv)

        host_csv = settings.DATA_DIR / "processed" / "capacity" / "host_zone_candidates.csv"
        if host_csv.exists():
            self._host_candidates_df = pd.read_csv(host_csv)

    def get_all_mandals(
        self,
        district_id: Optional[str] = None,
        priority_category: Optional[str] = None,
        ranking_status: Optional[str] = None,
        primary_factor: Optional[str] = None,
    ) -> MandalRelocationListResponse:
        self._load_data()
        df = self._reloc_df.copy()

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

    def get_mandal_detail(self, mandal_id: str) -> Optional[MandalRelocationItem]:
        self._load_data()
        target = mandal_id.strip().upper()
        match = self._reloc_df[
            (self._reloc_df["mandal_id"] == target) |
            (self._reloc_df["mandal_name"].str.upper() == target)
        ]
        if match.empty:
            return None
        row_dict = match.iloc[0].replace({np.nan: None}).to_dict()
        return MandalRelocationItem(**row_dict)

    def get_top_prioritized(self, limit: int = 10) -> TopRelocationListResponse:
        self._load_data()
        ranked = self._reloc_df[self._reloc_df["ranking_status"] != "INSUFFICIENT_DATA"]
        top_df = ranked.sort_values(by="topsis_score", ascending=False).head(limit)
        records = top_df.replace({np.nan: None}).to_dict(orient="records")
        items = [MandalRelocationItem(**row) for row in records]
        return TopRelocationListResponse(total_returned=len(items), items=items)

    def get_summary(self) -> RelocationSummaryResponse:
        self._load_data()
        df = self._reloc_df
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

    def get_ahp_weights(self) -> AHPWeightsResponse:
        self._load_data()
        records = self._ahp_df.to_dict(orient="records")
        items = [AHPWeightItem(**row) for row in records]

        # Saaty 1-9 Pairwise Matrix
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
    ) -> RelocationFactorContributionsResponse:
        self._load_data()
        df = self._factors_df.copy()

        if district_id:
            # Merge district_id from reloc_df
            df = df.merge(self._reloc_df[['mandal_id', 'current_district_id']], on='mandal_id', how='left')
            df = df[df["current_district_id"] == district_id.strip().lower()]
        if priority_category:
            df = df[df["relocation_priority_category"].str.upper() == priority_category.strip().upper()]

        records = df.replace({np.nan: None}).to_dict(orient="records")
        items = [RelocationFactorItem(**row) for row in records]
        return RelocationFactorContributionsResponse(total_mandals=len(items), items=items)

    def get_geojson(self, district_id: Optional[str] = None) -> Dict[str, Any]:
        if self._reloc_geojson is None:
            geojson_path = settings.DATA_DIR / "processed" / "relocation" / "ap_mandal_relocation_priority.geojson"
            if not geojson_path.exists():
                raise FileNotFoundError(f"Relocation GeoJSON not found at {geojson_path}")
            with open(geojson_path, "r", encoding="utf-8") as f:
                self._reloc_geojson = json.load(f)

        if not district_id:
            return self._reloc_geojson

        target_did = district_id.strip().lower()
        filtered = [
            feat for feat in self._reloc_geojson.get("features", [])
            if str(feat.get("properties", {}).get("current_district_id", "")).lower() == target_did
        ]
        return {
            "type": "FeatureCollection",
            "features": filtered
        }

    def get_host_zones_for_mandal(self, mandal_id: str) -> HostZoneCandidateListResponse:
        self._load_data()
        target = mandal_id.strip().upper()

        match = self._host_candidates_df[
            (self._host_candidates_df["source_mandal_id"] == target) |
            (self._host_candidates_df["source_mandal_name"].str.upper() == target)
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
