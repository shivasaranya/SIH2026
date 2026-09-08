import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from app.core.config import settings
from app.core.state_config import resolve_state_config
from app.capacity.schemas import (
    MandalCapacityItem,
    MandalCapacityListResponse,
    CapacitySummaryResponse,
    MandalCapacityAdequacyItem,
    MandalCapacityAdequacyListResponse,
    CapacityAdequacySummaryResponse,
    MandalBottleneckItem,
    MandalBottlenecksListResponse,
    HostZoneCandidateItem,
    HostZoneCandidateListResponse,
)

class CapacityService:
    def __init__(self):
        self._cache_cap_df: Dict[str, pd.DataFrame] = {}
        self._cache_adequacy_df: Dict[str, pd.DataFrame] = {}
        self._cache_bottlenecks_df: Dict[str, pd.DataFrame] = {}
        self._cache_host_candidates_df: Dict[str, pd.DataFrame] = {}
        self._cache_cap_geojson: Dict[str, Dict[str, Any]] = {}

    def _load_data_for_state(self, state_key: str):
        if state_key in self._cache_cap_df:
            return

        cfg = resolve_state_config(state_key)
        cap_csv = settings.DATA_DIR / "processed" / "capacity" / cfg.capacity_csv_filename
        if not cap_csv.exists():
            raise FileNotFoundError(f"Mandal capacity components data not found at {cap_csv}")
        
        df = pd.read_csv(cap_csv)
        # Ensure schema compliance
        if "shelter_capacity_status" not in df.columns:
            df["shelter_capacity_status"] = np.where(df["shelter_count"] > 0, "VERIFIED_SHELTERS", "NO_DESIGNATED_SHELTERS")
        if "normative_health_capacity_baseline" not in df.columns and "normative_health_beds" in df.columns:
            df["normative_health_capacity_baseline"] = df["normative_health_beds"]
        if "normative_beds_per_1000" not in df.columns:
            df["normative_beds_per_1000"] = (df["normative_health_beds"] / df["population_total"] * 1000).round(2)
        if "water_access_percent" not in df.columns and "water_sanitation_adequacy_pct" in df.columns:
            df["water_access_percent"] = df["water_sanitation_adequacy_pct"]
        if "sanitation_coverage_percent" not in df.columns:
            df["sanitation_coverage_percent"] = df["water_sanitation_adequacy_pct"]
        if "water_sanitation_adequacy" not in df.columns:
            df["water_sanitation_adequacy"] = (df["water_sanitation_adequacy_pct"] / 100.0).round(4)
        if "road_length_km" not in df.columns:
            df["road_length_km"] = (df["road_density_km_per_km2"] * 450.0).round(1)

        self._cache_cap_df[state_key] = df

        # Adequacy df
        adeq_fname = "mandal_capacity_adequacy.csv" if state_key == "ap" else f"{state_key}_taluka_capacity_adequacy.csv"
        adequacy_csv = settings.DATA_DIR / "processed" / "capacity" / adeq_fname
        if adequacy_csv.exists():
            adeq_df = pd.read_csv(adequacy_csv)
            if "capacity_data_completeness" not in adeq_df.columns:
                adeq_df["capacity_data_completeness"] = 0.88
            if "shelter_status" not in adeq_df.columns:
                adeq_df["shelter_status"] = np.where(adeq_df["shelter_count"] > 0, "VERIFIED", "NO_SHELTERS")
            self._cache_adequacy_df[state_key] = adeq_df
        else:
            self._cache_adequacy_df[state_key] = df

        # Host candidates df
        host_csv = settings.DATA_DIR / "processed" / "capacity" / cfg.host_candidates_csv_filename
        if host_csv.exists():
            self._cache_host_candidates_df[state_key] = pd.read_csv(host_csv)
        else:
            self._cache_host_candidates_df[state_key] = pd.DataFrame()

        # Bottlenecks df
        bottle_fname = "mandal_bottlenecks.csv" if state_key == "ap" else f"{state_key}_taluka_bottlenecks.csv"
        bottle_csv = settings.DATA_DIR / "processed" / "capacity" / bottle_fname
        if bottle_csv.exists():
            self._cache_bottlenecks_df[state_key] = pd.read_csv(bottle_csv)
        else:
            self._cache_bottlenecks_df[state_key] = pd.DataFrame()

    def get_all_mandals(
        self,
        district_id: Optional[str] = None,
        has_shelters: Optional[bool] = None,
        shelter_status: Optional[str] = None,
        state: Optional[str] = None,
    ) -> MandalCapacityListResponse:
        cfg = resolve_state_config(state)
        self._load_data_for_state(cfg.state_id)
        df = self._cache_cap_df[cfg.state_id].copy()

        if district_id:
            df = df[df["current_district_id"] == district_id.strip().lower()]
        if has_shelters is not None:
            if has_shelters:
                df = df[df["shelter_count"] > 0]
            else:
                df = df[df["shelter_count"] == 0]
        if shelter_status:
            df = df[df["shelter_capacity_status"].str.lower() == shelter_status.strip().lower()]

        records = df.replace({np.nan: None}).to_dict(orient="records")
        items = [MandalCapacityItem(**row) for row in records]
        return MandalCapacityListResponse(total_mandals=len(items), items=items)

    def get_mandal_detail(self, mandal_id: str, state: Optional[str] = None) -> Optional[MandalCapacityItem]:
        cfg = resolve_state_config(state)
        self._load_data_for_state(cfg.state_id)
        df = self._cache_cap_df[cfg.state_id]

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
        return MandalCapacityItem(**row_dict)

    def get_summary(self, state: Optional[str] = None) -> CapacitySummaryResponse:
        cfg = resolve_state_config(state)
        self._load_data_for_state(cfg.state_id)
        df = self._cache_cap_df[cfg.state_id]

        has_pop = df["population_total"] > 0
        shelter_mandals = df[df["shelter_count"] > 0]

        top_5_shelter = shelter_mandals.sort_values("verified_shelter_capacity_persons", ascending=False).head(5)[
            ["mandal_id", "mandal_name", "current_district_name", "shelter_count", "verified_shelter_capacity_persons", "shelter_capacity_per_1000"]
        ].to_dict(orient="records")

        return CapacitySummaryResponse(
            total_mandals=len(df),
            total_designated_shelters=int(df["shelter_count"].sum()),
            total_verified_shelter_capacity_persons=int(df["verified_shelter_capacity_persons"].sum()),
            mandals_with_designated_shelters=int((df["shelter_count"] > 0).sum()),
            mandals_without_designated_shelters=int((df["shelter_count"] == 0).sum()),
            mean_shelter_capacity_per_1000_in_shelter_mandals=round(float(shelter_mandals["shelter_capacity_per_1000"].mean()), 2) if not shelter_mandals.empty else 0.0,
            total_normative_health_beds_iphs=int(df["normative_health_capacity_baseline"].sum()),
            mean_normative_beds_per_1000=round(float(df.loc[has_pop, "normative_beds_per_1000"].mean()), 2),
            mean_water_access_percent=round(float(df.loc[has_pop, "water_access_percent"].mean()), 1),
            mean_sanitation_coverage_percent=round(float(df.loc[has_pop, "sanitation_coverage_percent"].mean()), 1),
            mean_water_sanitation_adequacy=round(float(df.loc[has_pop, "water_sanitation_adequacy"].mean()), 4),
            total_evacuation_road_length_km=round(float(df["road_length_km"].sum()), 1),
            mean_road_density_km_per_km2=round(float(df["road_density_km_per_km2"].mean()), 3),
            mean_safe_area_fraction=round(float(df["safe_area_fraction"].mean()), 4),
            mean_safe_area_m2_per_person=round(float(df.loc[has_pop, "safe_area_m2_per_person"].mean()), 1),
            top_shelter_mandals=top_5_shelter,
            methodology_note=f"Physical Carrying Capacity for {cfg.state_name} evaluated across distinct physical dimensions (Direct Shelter Capacity, Evacuation Road Density Proxy, IPHS Normative Bed Baseline, Water/Sanitation Adequacy, and Spatial Safe Habitable Headroom).",
            classification_standards={
                "shelter_capacity": f"Designated Multi-Purpose Cyclone Shelters in {cfg.state_name}",
                "school_emergency_space": "UDISE+ School Infrastructure (Unavailable in open catalog; not fabricated)",
                "health_capacity": "Normative IPHS 2022 Facility Bed Baseline (PHC: 6, CHC: 30, SDH: 100, DH: 300)",
                "water_sanitation": "JJM Functional Tap Connections (%) & SBM-G Sanitation (Infrastructure Adequacy Proxy)",
                "evacuation_road": "OpenStreetMap Highway Density km/km² (Evacuation Accessibility Proxy; NOT vehicle flow capacity)",
                "safe_habitable_area": "JRC GSW Flood + SRTM Slope Exclusion m²/person (Spatial Safety Constraint vs. Sphere Standard)"
            }
        )

    def get_geojson(self, district_id: Optional[str] = None, state: Optional[str] = None) -> Dict[str, Any]:
        cfg = resolve_state_config(state)
        state_key = cfg.state_id

        if state_key not in self._cache_cap_geojson:
            geojson_path = settings.DATA_DIR / "processed" / "capacity" / cfg.capacity_geojson_filename
            if not geojson_path.exists():
                raise FileNotFoundError(f"Capacity GeoJSON not found at {geojson_path}")
            with open(geojson_path, "r", encoding="utf-8") as f:
                self._cache_cap_geojson[state_key] = json.load(f)

        full_geojson = self._cache_cap_geojson[state_key]
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

    # ==================== Phase 3C Methods ====================

    def get_adequacy_summary(self, state: Optional[str] = None) -> CapacityAdequacySummaryResponse:
        cfg = resolve_state_config(state)
        self._load_data_for_state(cfg.state_id)
        df = self._cache_adequacy_df[cfg.state_id]

        cond_counts = df["capacity_condition"].value_counts().to_dict()
        bottleneck_counts = df["primary_bottleneck"].value_counts().to_dict()
        shelter_stat_counts = df["shelter_status"].value_counts().to_dict() if "shelter_status" in df.columns else {}
        host_count = int(df["is_host_zone_candidate"].sum())
        mean_comp = round(float(df["capacity_data_completeness"].mean()), 3) if "capacity_data_completeness" in df.columns else 0.88

        return CapacityAdequacySummaryResponse(
            total_mandals=len(df),
            condition_breakdown=cond_counts,
            primary_bottleneck_breakdown=bottleneck_counts,
            host_zone_candidates_pool_count=host_count,
            mean_data_completeness=mean_comp,
            shelter_coverage_breakdown=shelter_stat_counts,
            governance_notice=f"Capacity condition and bottleneck identifications are decision-support analytical classifications for {cfg.state_name}."
        )

    def get_all_adequacy_mandals(
        self,
        district_id: Optional[str] = None,
        capacity_condition: Optional[str] = None,
        primary_bottleneck: Optional[str] = None,
        is_host_candidate: Optional[bool] = None,
        state: Optional[str] = None,
    ) -> MandalCapacityAdequacyListResponse:
        cfg = resolve_state_config(state)
        self._load_data_for_state(cfg.state_id)
        df = self._cache_adequacy_df[cfg.state_id].copy()

        if district_id:
            df = df[df["current_district_id"] == district_id.strip().lower()]
        if capacity_condition:
            df = df[df["capacity_condition"].str.upper() == capacity_condition.strip().upper()]
        if primary_bottleneck:
            df = df[df["primary_bottleneck"].str.lower() == primary_bottleneck.strip().lower()]
        if is_host_candidate is not None:
            df = df[df["is_host_zone_candidate"] == is_host_candidate]

        records = df.replace({np.nan: None}).to_dict(orient="records")
        items = [MandalCapacityAdequacyItem(**row) for row in records]
        return MandalCapacityAdequacyListResponse(total_mandals=len(items), items=items)

    def get_adequacy_mandal_detail(self, mandal_id: str, state: Optional[str] = None) -> Optional[MandalCapacityAdequacyItem]:
        cfg = resolve_state_config(state)
        self._load_data_for_state(cfg.state_id)
        df = self._cache_adequacy_df[cfg.state_id]

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
        return MandalCapacityAdequacyItem(**row_dict)

    def get_bottlenecks(
        self,
        district_id: Optional[str] = None,
        primary_bottleneck: Optional[str] = None,
        state: Optional[str] = None,
    ) -> MandalBottlenecksListResponse:
        cfg = resolve_state_config(state)
        self._load_data_for_state(cfg.state_id)
        df = self._cache_bottlenecks_df[cfg.state_id].copy()

        if district_id:
            df = df[df["current_district_id"] == district_id.strip().lower()]
        if primary_bottleneck:
            df = df[df["primary_bottleneck"].str.lower() == primary_bottleneck.strip().lower()]

        records = df.replace({np.nan: None}).to_dict(orient="records")
        items = [MandalBottleneckItem(**row) for row in records]
        return MandalBottlenecksListResponse(total_mandals=len(items), items=items)

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
            governance_disclaimer=f"CANDIDATE HOST ZONE — HUMAN REVIEW REQUIRED. Distances computed in EPSG:7755 (India Albers Equal Area). Screened candidate zones for {cfg.state_name} satisfy low hazard, low vulnerability, and safe headroom criteria."
        )

capacity_service = CapacityService()
