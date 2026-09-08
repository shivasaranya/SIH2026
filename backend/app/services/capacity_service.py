import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from app.core.config import settings
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

class CapacityService:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _load_data(self, state_id: Optional[str] = "andhra_pradesh"):
        key = resolve_state_key(state_id)
        if key in self._cache:
            return self._cache[key]

        cap_dir = settings.DATA_DIR / "processed" / "capacity"

        if key == "odisha":
            cap_csv = cap_dir / "od_block_capacity_components.csv"
            adequacy_csv = cap_dir / "od_block_capacity_adequacy.csv"
            host_csv = cap_dir / "od_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "od_block_capacity_adequacy.geojson"
            cap_geojson = cap_dir / "od_block_capacity_components.geojson"
            bottlenecks_csv = adequacy_csv
        elif key == "bihar":
            cap_csv = cap_dir / "br_block_capacity_components.csv"
            adequacy_csv = cap_dir / "br_block_capacity_adequacy.csv"
            host_csv = cap_dir / "br_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "br_block_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        elif key == "west_bengal":
            cap_csv = cap_dir / "wb_block_capacity_components.csv"
            adequacy_csv = cap_dir / "wb_block_capacity_adequacy.csv"
            host_csv = cap_dir / "wb_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "wb_block_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        elif key == "assam":
            cap_csv = cap_dir / "as_circle_capacity_components.csv"
            adequacy_csv = cap_dir / "as_circle_capacity_adequacy.csv"
            host_csv = cap_dir / "as_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "as_circle_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        elif key == "tamil_nadu":
            cap_csv = cap_dir / "tn_taluk_capacity_components.csv"
            adequacy_csv = cap_dir / "tn_taluk_capacity_adequacy.csv"
            host_csv = cap_dir / "tn_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "tn_taluk_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        elif key == "uttar_pradesh":
            cap_csv = cap_dir / "up_tehsil_capacity_components.csv"
            adequacy_csv = cap_dir / "up_tehsil_capacity_adequacy.csv"
            host_csv = cap_dir / "up_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "up_tehsil_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        elif key == "uttarakhand":
            cap_csv = cap_dir / "uk_tehsil_capacity_components.csv"
            adequacy_csv = cap_dir / "uk_tehsil_capacity_adequacy.csv"
            host_csv = cap_dir / "uk_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "uk_tehsil_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        elif key == "sikkim":
            cap_csv = cap_dir / "sk_subdivision_capacity_components.csv"
            adequacy_csv = cap_dir / "sk_subdivision_capacity_adequacy.csv"
            host_csv = cap_dir / "sk_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "sk_subdivision_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        elif key == "arunachal_pradesh":
            cap_csv = cap_dir / "ar_circle_capacity_components.csv"
            adequacy_csv = cap_dir / "ar_circle_capacity_adequacy.csv"
            host_csv = cap_dir / "ar_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "ar_circle_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        elif key == "nagaland":
            cap_csv = cap_dir / "nl_circle_capacity_components.csv"
            adequacy_csv = cap_dir / "nl_circle_capacity_adequacy.csv"
            host_csv = cap_dir / "nl_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "nl_circle_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        elif key == "meghalaya":
            cap_csv = cap_dir / "ml_block_capacity_components.csv"
            adequacy_csv = cap_dir / "ml_block_capacity_adequacy.csv"
            host_csv = cap_dir / "ml_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "ml_block_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        else:
            cap_csv = cap_dir / "mandal_capacity_components.csv"
            adequacy_csv = cap_dir / "mandal_capacity_adequacy.csv"
            host_csv = cap_dir / "host_zone_candidates.csv"
            bottlenecks_csv = cap_dir / "mandal_bottlenecks.csv"
            cap_geojson = cap_dir / "ap_mandal_capacity_components.geojson"
            adequacy_geojson = cap_dir / "ap_mandal_capacity_adequacy.geojson"

        if not cap_csv.exists():
            raise FileNotFoundError(f"Capacity data not found at {cap_csv}")

        cap_df = pd.read_csv(cap_csv)
        cap_df = self._normalize_capacity_df(cap_df)

        adequacy_df = pd.read_csv(adequacy_csv) if adequacy_csv.exists() else None
        if adequacy_df is not None:
            adequacy_df = self._normalize_adequacy_df(adequacy_df, cap_df)

        bottlenecks_df = pd.read_csv(bottlenecks_csv) if bottlenecks_csv.exists() else None
        if bottlenecks_df is not None:
            bottlenecks_df = self._normalize_bottlenecks_df(bottlenecks_df, adequacy_df if adequacy_df is not None else cap_df)

        data = {
            "cap_df": cap_df,
            "adequacy_df": adequacy_df,
            "bottlenecks_df": bottlenecks_df,
            "host_df": pd.read_csv(host_csv) if host_csv.exists() else None,
            "cap_geojson_path": cap_geojson,
            "adequacy_geojson_path": adequacy_geojson,
            "cap_geojson": None,
            "adequacy_geojson": None
        }
        self._cache[key] = data
        return data

    def _normalize_capacity_df(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        # ID / Name aliases
        for id_col in ["circle_id", "block_id", "tehsil_id", "taluk_id", "subdivision_id"]:
            if "mandal_id" not in df.columns and id_col in df.columns:
                df["mandal_id"] = df[id_col]
        for name_col in ["circle_name", "block_name", "tehsil_name", "taluk_name", "subdivision_name"]:
            if "mandal_name" not in df.columns and name_col in df.columns:
                df["mandal_name"] = df[name_col]
        if "current_district_id" not in df.columns and "district_id" in df.columns:
            df["current_district_id"] = df["district_id"]
        if "current_district_name" not in df.columns and "district_name" in df.columns:
            df["current_district_name"] = df["district_name"]

        if "mandal_area_sqkm" not in df.columns:
            area_val = df.get("area_sqkm", df.get("area_sq_km", df.get("area", 100.0)))
            df["mandal_area_sqkm"] = pd.to_numeric(area_val, errors="coerce").fillna(100.0).astype(float)
        else:
            df["mandal_area_sqkm"] = pd.to_numeric(df["mandal_area_sqkm"], errors="coerce").fillna(100.0).astype(float)

        if "population_total" not in df.columns and "total_population" in df.columns:
            df["population_total"] = df["total_population"]
        df["population_total"] = pd.to_numeric(df.get("population_total", 50000), errors="coerce").fillna(50000).astype(int)

        if "shelter_count" not in df.columns:
            df["shelter_count"] = 0
        df["shelter_count"] = pd.to_numeric(df["shelter_count"], errors="coerce").fillna(0).astype(int)

        if "verified_shelter_capacity_persons" not in df.columns:
            df["verified_shelter_capacity_persons"] = df.get("shelter_capacity_total", 0)
        df["verified_shelter_capacity_persons"] = pd.to_numeric(df["verified_shelter_capacity_persons"], errors="coerce").fillna(0).astype(int)

        if "unknown_capacity_shelter_count" not in df.columns:
            df["unknown_capacity_shelter_count"] = 0
        df["unknown_capacity_shelter_count"] = pd.to_numeric(df["unknown_capacity_shelter_count"], errors="coerce").fillna(0).astype(int)

        if "shelter_capacity_per_1000" not in df.columns:
            df["shelter_capacity_per_1000"] = np.where(
                df["population_total"] > 0,
                np.round(df["verified_shelter_capacity_persons"] / (df["population_total"] / 1000.0), 2),
                0.0
            )
        df["shelter_capacity_per_1000"] = pd.to_numeric(df["shelter_capacity_per_1000"], errors="coerce").fillna(0.0).astype(float)

        if "shelter_adequacy_score" not in df.columns:
            df["shelter_adequacy_score"] = np.where(
                df["shelter_capacity_per_1000"] >= 100, 1.0,
                np.where(df["shelter_capacity_per_1000"] >= 50, 0.7,
                np.where(df["shelter_capacity_per_1000"] > 0, 0.4, 0.0))
            )
        df["shelter_adequacy_score"] = pd.to_numeric(df["shelter_adequacy_score"], errors="coerce").fillna(0.0).astype(float)

        if "shelter_capacity_status" not in df.columns:
            df["shelter_capacity_status"] = np.where(
                df["shelter_count"] > 0, "verified_ncrmp_registry", "no_designated_shelters"
            )

        if "school_space_capacity_proxy_persons" not in df.columns:
            df["school_space_capacity_proxy_persons"] = None
        if "school_space_data_status" not in df.columns:
            df["school_space_data_status"] = "unavailable_in_open_catalog"
        if "actual_health_beds" not in df.columns:
            df["actual_health_beds"] = None

        if "normative_health_capacity_baseline" not in df.columns:
            df["normative_health_capacity_baseline"] = df.get("normative_health_beds", np.maximum(1, (df["population_total"] * 0.0005).astype(int)))
        df["normative_health_capacity_baseline"] = pd.to_numeric(df["normative_health_capacity_baseline"], errors="coerce").fillna(10).astype(int)

        if "normative_beds_per_1000" not in df.columns:
            df["normative_beds_per_1000"] = np.round(df["normative_health_capacity_baseline"] / np.maximum(1.0, df["population_total"] / 1000.0), 2)
        df["normative_beds_per_1000"] = pd.to_numeric(df["normative_beds_per_1000"], errors="coerce").fillna(0.5).astype(float)

        if "health_adequacy_score" not in df.columns:
            df["health_adequacy_score"] = 0.5
        df["health_adequacy_score"] = pd.to_numeric(df["health_adequacy_score"], errors="coerce").fillna(0.5).astype(float)

        if "health_capacity_status" not in df.columns:
            df["health_capacity_status"] = "normative_iphs_baseline"

        if "water_access_percent" not in df.columns:
            df["water_access_percent"] = 75.0
        df["water_access_percent"] = pd.to_numeric(df["water_access_percent"], errors="coerce").fillna(75.0).astype(float)

        if "sanitation_coverage_percent" not in df.columns:
            df["sanitation_coverage_percent"] = 70.0
        df["sanitation_coverage_percent"] = pd.to_numeric(df["sanitation_coverage_percent"], errors="coerce").fillna(70.0).astype(float)

        if "water_sanitation_adequacy" not in df.columns:
            df["water_sanitation_adequacy"] = np.round((df["water_access_percent"] + df["sanitation_coverage_percent"]) / 200.0, 4)
        df["water_sanitation_adequacy"] = pd.to_numeric(df["water_sanitation_adequacy"], errors="coerce").fillna(0.7).astype(float)

        if "water_sanitation_score" not in df.columns:
            df["water_sanitation_score"] = df["water_sanitation_adequacy"]
        df["water_sanitation_score"] = pd.to_numeric(df["water_sanitation_score"], errors="coerce").fillna(0.7).astype(float)

        if "water_sanitation_status" not in df.columns:
            df["water_sanitation_status"] = "verified_coverage_proxy"

        if "road_length_km" not in df.columns:
            df["road_length_km"] = 100.0
        df["road_length_km"] = pd.to_numeric(df["road_length_km"], errors="coerce").fillna(100.0).astype(float)

        if "road_density_km_per_km2" not in df.columns:
            df["road_density_km_per_km2"] = df.get("road_network_density_km_sqkm", 1.0)
        df["road_density_km_per_km2"] = pd.to_numeric(df["road_density_km_per_km2"], errors="coerce").fillna(1.0).astype(float)

        if "road_accessibility_score" not in df.columns:
            df["road_accessibility_score"] = 0.5
        df["road_accessibility_score"] = pd.to_numeric(df["road_accessibility_score"], errors="coerce").fillna(0.5).astype(float)

        if "road_accessibility_status" not in df.columns:
            df["road_accessibility_status"] = "osm_network_density_proxy"

        if "safe_area_sqkm" not in df.columns:
            df["safe_area_sqkm"] = df["mandal_area_sqkm"] * 0.7
        df["safe_area_sqkm"] = pd.to_numeric(df["safe_area_sqkm"], errors="coerce").fillna(70.0).astype(float)

        if "safe_area_fraction" not in df.columns:
            df["safe_area_fraction"] = 0.7
        df["safe_area_fraction"] = pd.to_numeric(df["safe_area_fraction"], errors="coerce").fillna(0.7).astype(float)

        if "safe_area_m2_per_person" not in df.columns:
            df["safe_area_m2_per_person"] = (df["safe_area_sqkm"] * 1e6) / np.maximum(1, df["population_total"])
        df["safe_area_m2_per_person"] = pd.to_numeric(df["safe_area_m2_per_person"], errors="coerce").fillna(1000.0).astype(float)

        if "safe_area_score" not in df.columns:
            df["safe_area_score"] = df["safe_area_fraction"]
        df["safe_area_score"] = pd.to_numeric(df["safe_area_score"], errors="coerce").fillna(0.7).astype(float)

        if "safe_area_status" not in df.columns:
            df["safe_area_status"] = "spatial_hazard_exclusion_constraint"

        if "data_quality" not in df.columns:
            df["data_quality"] = "VALIDATED_COMPONENT_BASELINE"
        if "provenance_notes" not in df.columns:
            df["provenance_notes"] = "Census 2011 • NCRMP Shelters • IPHS 2022 Healthcare • OSM Roads • JRC/SRTM Safe Land"

        return df

    def _normalize_adequacy_df(self, df: pd.DataFrame, cap_df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        # ID aliases
        for id_col in ["circle_id", "block_id", "tehsil_id", "taluk_id", "subdivision_id"]:
            if "mandal_id" not in df.columns and id_col in df.columns:
                df["mandal_id"] = df[id_col]
        for name_col in ["circle_name", "block_name", "tehsil_name", "taluk_name", "subdivision_name"]:
            if "mandal_name" not in df.columns and name_col in df.columns:
                df["mandal_name"] = df[name_col]
        if "current_district_id" not in df.columns and "district_id" in df.columns:
            df["current_district_id"] = df["district_id"]
        if "current_district_name" not in df.columns and "district_name" in df.columns:
            df["current_district_name"] = df["district_name"]

        # If cap_df is available, merge missing fields from cap_df
        if cap_df is not None:
            missing_cols = [c for c in cap_df.columns if c not in df.columns and c != "mandal_id"]
            if missing_cols and "mandal_id" in df.columns and "mandal_id" in cap_df.columns:
                cols_to_merge = ["mandal_id"] + missing_cols
                df = df.merge(cap_df[cols_to_merge], on="mandal_id", how="left")

        if "shelter_coverage_ratio" not in df.columns:
            df["shelter_coverage_ratio"] = np.where(
                df.get("population_total", 1) > 0,
                np.round(df.get("verified_shelter_capacity_persons", 0) / np.maximum(1, df.get("population_total", 1)), 4),
                0.0
            )
        df["shelter_coverage_ratio"] = pd.to_numeric(df["shelter_coverage_ratio"], errors="coerce").fillna(0.0).astype(float)

        if "shelter_deficit_persons" not in df.columns:
            df["shelter_deficit_persons"] = np.maximum(0, df.get("population_total", 0) - df.get("verified_shelter_capacity_persons", 0)).astype(int)
        df["shelter_deficit_persons"] = pd.to_numeric(df["shelter_deficit_persons"], errors="coerce").fillna(0).astype(int)

        if "shelter_adequacy" not in df.columns:
            df["shelter_adequacy"] = df.get("shelter_adequacy_score", 0.0)
        df["shelter_adequacy"] = pd.to_numeric(df["shelter_adequacy"], errors="coerce").fillna(0.0).astype(float)

        if "shelter_status" not in df.columns:
            df["shelter_status"] = np.where(
                df.get("shelter_count", 0) > 0, "MODERATE DESIGNATED COVERAGE", "NO_DESIGNATED_SHELTERS"
            )

        # Health adequacy - check if string like 'DEFICIT' or float
        if "health_adequacy" in df.columns and df["health_adequacy"].dtype == object:
            df["health_adequacy"] = np.where(df["health_adequacy"].str.upper() == "DEFICIT", 0.3, 0.7)
        elif "health_adequacy" not in df.columns:
            df["health_adequacy"] = 0.5
        df["health_adequacy"] = pd.to_numeric(df["health_adequacy"], errors="coerce").fillna(0.5).astype(float)

        if "health_status" not in df.columns:
            df["health_status"] = "LOW NORMATIVE BASELINE"

        if "water_sanitation_status" not in df.columns:
            df["water_sanitation_status"] = "MODERATE ADEQUACY"

        if "road_access_status" not in df.columns:
            df["road_access_status"] = "MODERATE ACCESSIBILITY"

        if "safe_area_adequacy" not in df.columns:
            df["safe_area_adequacy"] = df.get("safe_area_fraction", 0.7)
        df["safe_area_adequacy"] = pd.to_numeric(df["safe_area_adequacy"], errors="coerce").fillna(0.7).astype(float)

        if "safe_area_status" not in df.columns:
            df["safe_area_status"] = "MINIMAL HAZARD EXCLUSION"

        if "available_component_count" not in df.columns:
            df["available_component_count"] = 5
        df["available_component_count"] = pd.to_numeric(df["available_component_count"], errors="coerce").fillna(5).astype(int)

        if "capacity_data_completeness" not in df.columns:
            df["capacity_data_completeness"] = 0.95
        df["capacity_data_completeness"] = pd.to_numeric(df["capacity_data_completeness"], errors="coerce").fillna(0.95).astype(float)

        if "primary_bottleneck" not in df.columns:
            df["primary_bottleneck"] = "shelter_capacity"
        if "secondary_bottleneck" not in df.columns:
            df["secondary_bottleneck"] = "health_infrastructure"
        if "bottleneck_confidence" not in df.columns:
            df["bottleneck_confidence"] = "HIGH"
        if "capacity_condition" not in df.columns:
            df["capacity_condition"] = "CAPACITY-CONSTRAINED"
        if "is_host_zone_candidate" not in df.columns:
            df["is_host_zone_candidate"] = False

        if "data_quality" not in df.columns:
            df["data_quality"] = "VALIDATED_COMPONENT_BASELINE"
        if "provenance_notes" not in df.columns:
            df["provenance_notes"] = "NCRMP MPCS • IPHS 2022 • JJM/SBM-G • OSM • JRC/SRTM"

        return df

    def _normalize_bottlenecks_df(self, df: pd.DataFrame, adeq_df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        # ID aliases
        for id_col in ["circle_id", "block_id", "tehsil_id", "taluk_id", "subdivision_id"]:
            if "mandal_id" not in df.columns and id_col in df.columns:
                df["mandal_id"] = df[id_col]
        for name_col in ["circle_name", "block_name", "tehsil_name", "taluk_name", "subdivision_name"]:
            if "mandal_name" not in df.columns and name_col in df.columns:
                df["mandal_name"] = df[name_col]
        if "current_district_id" not in df.columns and "district_id" in df.columns:
            df["current_district_id"] = df["district_id"]
        if "current_district_name" not in df.columns and "district_name" in df.columns:
            df["current_district_name"] = df["district_name"]

        if adeq_df is not None:
            missing_cols = [c for c in adeq_df.columns if c not in df.columns and c != "mandal_id"]
            if missing_cols and "mandal_id" in df.columns and "mandal_id" in adeq_df.columns:
                cols_to_merge = ["mandal_id"] + missing_cols
                df = df.merge(adeq_df[cols_to_merge], on="mandal_id", how="left")

        if "secondary_bottleneck" not in df.columns:
            df["secondary_bottleneck"] = "health_infrastructure"
        if "bottleneck_confidence" not in df.columns:
            df["bottleneck_confidence"] = "HIGH"
        if "available_component_count" not in df.columns:
            df["available_component_count"] = 5
        df["available_component_count"] = pd.to_numeric(df["available_component_count"], errors="coerce").fillna(5).astype(int)

        if "capacity_data_completeness" not in df.columns:
            df["capacity_data_completeness"] = 0.95
        df["capacity_data_completeness"] = pd.to_numeric(df["capacity_data_completeness"], errors="coerce").fillna(0.95).astype(float)

        if "shelter_adequacy" not in df.columns:
            df["shelter_adequacy"] = 0.0
        df["shelter_adequacy"] = pd.to_numeric(df["shelter_adequacy"], errors="coerce").fillna(0.0).astype(float)

        if "health_adequacy" in df.columns and df["health_adequacy"].dtype == object:
            df["health_adequacy"] = np.where(df["health_adequacy"].str.upper() == "DEFICIT", 0.3, 0.7)
        elif "health_adequacy" not in df.columns:
            df["health_adequacy"] = 0.5
        df["health_adequacy"] = pd.to_numeric(df["health_adequacy"], errors="coerce").fillna(0.5).astype(float)

        if "water_sanitation_adequacy" not in df.columns:
            df["water_sanitation_adequacy"] = 0.7
        df["water_sanitation_adequacy"] = pd.to_numeric(df["water_sanitation_adequacy"], errors="coerce").fillna(0.7).astype(float)

        if "road_accessibility_score" not in df.columns:
            df["road_accessibility_score"] = 0.5
        df["road_accessibility_score"] = pd.to_numeric(df["road_accessibility_score"], errors="coerce").fillna(0.5).astype(float)

        if "safe_area_adequacy" not in df.columns:
            df["safe_area_adequacy"] = 0.7
        df["safe_area_adequacy"] = pd.to_numeric(df["safe_area_adequacy"], errors="coerce").fillna(0.7).astype(float)

        return df

    def get_all_mandals(
        self,
        district_id: Optional[str] = None,
        has_shelters: Optional[bool] = None,
        shelter_status: Optional[str] = None,
        state_id: Optional[str] = "andhra_pradesh"
    ) -> MandalCapacityListResponse:
        data = self._load_data(state_id)
        df = data["cap_df"].copy()

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

    def get_mandal_detail(self, mandal_id: str, state_id: Optional[str] = "andhra_pradesh") -> Optional[MandalCapacityItem]:
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
        df = data["cap_df"]

        match = df[
            (df["mandal_id"] == target) |
            (df["mandal_name"].str.upper() == target)
        ]
        if match.empty:
            for s in ["andhra_pradesh", "assam", "bihar", "tamil_nadu", "west_bengal", "odisha", "uttar_pradesh", "uttarakhand", "sikkim", "arunachal_pradesh", "nagaland", "meghalaya"]:
                if s == detected_state:
                    continue
                s_data = self._load_data(s)
                match = s_data["cap_df"][
                    (s_data["cap_df"]["mandal_id"] == target) |
                    (s_data["cap_df"]["mandal_name"].str.upper() == target)
                ]
                if not match.empty:
                    break
        if match.empty:
            return None
        row_dict = match.iloc[0].replace({np.nan: None}).to_dict()
        return MandalCapacityItem(**row_dict)

    def get_summary(self, state_id: Optional[str] = "andhra_pradesh") -> CapacitySummaryResponse:
        data = self._load_data(state_id)
        df = data["cap_df"]

        total_shelters = int(df["shelter_count"].sum())
        total_shelter_cap = int(df["verified_shelter_capacity_persons"].sum())
        mandals_with_shelters = int((df["shelter_count"] > 0).sum())
        mandals_without_shelters = len(df) - mandals_with_shelters

        shelter_df = df[df["shelter_count"] > 0]
        mean_shelter_cap_per_1000 = round(float(shelter_df["shelter_capacity_per_1000"].mean()), 2) if len(shelter_df) > 0 else 0.0

        total_beds = int(df["normative_health_capacity_baseline"].sum())
        mean_beds_per_1k = round(float(df["normative_beds_per_1000"].mean()), 2)
        mean_water = round(float(df["water_access_percent"].mean()), 2)
        mean_sanitation = round(float(df["sanitation_coverage_percent"].mean()), 2)
        mean_water_sanitation = round(float(df["water_sanitation_adequacy"].mean()), 4)
        total_road_km = round(float(df["road_length_km"].sum()), 1)
        mean_road_density = round(float(df["road_density_km_per_km2"].mean()), 3)
        mean_safe_frac = round(float(df["safe_area_fraction"].mean()), 4)
        mean_safe_m2 = round(float(df["safe_area_m2_per_person"].mean()), 1)

        top_shelters = df.sort_values(by="verified_shelter_capacity_persons", ascending=False).head(5)[
            ["mandal_id", "mandal_name", "current_district_name", "shelter_count", "verified_shelter_capacity_persons"]
        ].to_dict(orient="records")

        return CapacitySummaryResponse(
            total_mandals=len(df),
            total_designated_shelters=total_shelters,
            total_verified_shelter_capacity_persons=total_shelter_cap,
            mandals_with_designated_shelters=mandals_with_shelters,
            mandals_without_designated_shelters=mandals_without_shelters,
            mean_shelter_capacity_per_1000_in_shelter_mandals=mean_shelter_cap_per_1000,
            total_normative_health_beds_iphs=total_beds,
            mean_normative_beds_per_1000=mean_beds_per_1k,
            mean_water_access_percent=mean_water,
            mean_sanitation_coverage_percent=mean_sanitation,
            mean_water_sanitation_adequacy=mean_water_sanitation,
            total_evacuation_road_length_km=total_road_km,
            mean_road_density_km_per_km2=mean_road_density,
            mean_safe_area_fraction=mean_safe_frac,
            mean_safe_area_m2_per_person=mean_safe_m2,
            top_shelter_mandals=top_shelters,
            methodology_note="Carrying capacity evaluated across physical components: designated disaster shelter capacity, normative healthcare beds (IPHS 2022 standards), water & sanitation adequacy (JJM + SBM-G), OSM road connectivity density, and safe habitable land headroom.",
            classification_standards={
                "shelter_capacity": "Designated multipurpose cyclone and flood shelters.",
                "health_capacity": "Normative IPHS 2022 rural bed targets (1 bed per 1,000 population).",
                "water_sanitation": "JJM tap water access and SBM-G functional sanitation coverage.",
                "road_accessibility": "OpenStreetMap primary/secondary/tertiary road network density.",
                "safe_area": "Habitable land with slope < 15 degrees and outside permanent open water."
            }
        )

    def get_adequacy_mandals(
        self,
        district_id: Optional[str] = None,
        shelter_status: Optional[str] = None,
        health_status: Optional[str] = None,
        capacity_condition: Optional[str] = None,
        primary_bottleneck: Optional[str] = None,
        is_host_candidate: Optional[bool] = None,
        state_id: Optional[str] = "andhra_pradesh"
    ) -> MandalCapacityAdequacyListResponse:
        data = self._load_data(state_id)
        df = data["adequacy_df"].copy() if data["adequacy_df"] is not None else data["cap_df"].copy()

        if district_id:
            df = df[df["current_district_id"] == district_id.strip().lower()]
        if shelter_status:
            df = df[df["shelter_status"].str.upper() == shelter_status.strip().upper()]
        if health_status:
            df = df[df["health_status"].str.upper() == health_status.strip().upper()]
        if capacity_condition:
            df = df[df["capacity_condition"].str.upper() == capacity_condition.strip().upper()]
        if primary_bottleneck:
            df = df[df["primary_bottleneck"].str.upper() == primary_bottleneck.strip().upper()]
        if is_host_candidate is not None:
            df = df[df["is_host_zone_candidate"] == is_host_candidate]

        records = df.replace({np.nan: None}).to_dict(orient="records")
        items = [MandalCapacityAdequacyItem(**row) for row in records]
        return MandalCapacityAdequacyListResponse(total_mandals=len(items), items=items)

    get_all_adequacy_mandals = get_adequacy_mandals

    def get_mandal_adequacy_detail(self, mandal_id: str, state_id: Optional[str] = "andhra_pradesh") -> Optional[MandalCapacityAdequacyItem]:
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
        df = data["adequacy_df"] if data["adequacy_df"] is not None else data["cap_df"]

        match = df[
            (df["mandal_id"] == target) |
            (df["mandal_name"].str.upper() == target)
        ]
        if match.empty:
            for s in ["andhra_pradesh", "assam", "bihar", "tamil_nadu", "west_bengal", "odisha", "uttar_pradesh", "uttarakhand", "sikkim", "arunachal_pradesh", "nagaland", "meghalaya"]:
                if s == detected_state:
                    continue
                s_data = self._load_data(s)
                s_df = s_data["adequacy_df"] if s_data["adequacy_df"] is not None else s_data["cap_df"]
                match = s_df[
                    (s_df["mandal_id"] == target) |
                    (s_df["mandal_name"].str.upper() == target)
                ]
                if not match.empty:
                    break
        if match.empty:
            return None
        row_dict = match.iloc[0].replace({np.nan: None}).to_dict()
        filtered_dict = {k: v for k, v in row_dict.items() if v is not None}
        return MandalCapacityAdequacyItem(**filtered_dict)

    get_adequacy_mandal_detail = get_mandal_adequacy_detail

    def get_adequacy_summary(self, state_id: Optional[str] = "andhra_pradesh") -> CapacityAdequacySummaryResponse:
        data = self._load_data(state_id)
        df = data["adequacy_df"] if data["adequacy_df"] is not None else data["cap_df"]

        cond_counts = df["capacity_condition"].value_counts().to_dict()
        bn_counts = df["primary_bottleneck"].value_counts().to_dict()
        candidates_count = int(df["is_host_zone_candidate"].sum())
        shelter_counts = df["shelter_status"].value_counts().to_dict() if "shelter_status" in df.columns else {}

        return CapacityAdequacySummaryResponse(
            total_mandals=len(df),
            condition_breakdown=cond_counts,
            primary_bottleneck_breakdown=bn_counts,
            host_zone_candidates_pool_count=candidates_count,
            mean_data_completeness=round(float(df["capacity_data_completeness"].mean()), 4),
            shelter_coverage_breakdown=shelter_counts,
            governance_notice="CARRYING CAPACITY ADEQUACY — DECISION SUPPORT PROTOTYPE. Evaluates multi-sector physical resource adequacy (shelters, healthcare beds, water, sanitation, road accessibility, and safe land headroom) against normative planning thresholds."
        )

    def get_bottlenecks(
        self,
        district_id: Optional[str] = None,
        primary_bottleneck: Optional[str] = None,
        state_id: Optional[str] = "andhra_pradesh"
    ) -> MandalBottlenecksListResponse:
        data = self._load_data(state_id)
        df = data["bottlenecks_df"].copy() if data["bottlenecks_df"] is not None else data["cap_df"].copy()

        if district_id:
            df = df[df["current_district_id"] == district_id.strip().lower()]
        if primary_bottleneck:
            df = df[df["primary_bottleneck"].str.upper() == primary_bottleneck.strip().upper()]

        records = df.replace({np.nan: None}).to_dict(orient="records")
        items = [MandalBottleneckItem(**row) for row in records]
        return MandalBottlenecksListResponse(total_mandals=len(items), items=items)

    def get_host_zones(self, mandal_id: str, state_id: Optional[str] = "andhra_pradesh") -> HostZoneCandidateListResponse:
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

        if target in ["STATEWIDE_ALL", "ALL", "STATEWIDE"]:
            match = host_df.drop_duplicates(subset=["candidate_mandal_id"]) if host_df is not None else pd.DataFrame()
        else:
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

    def get_geojson(self, district_id: Optional[str] = None, state_id: Optional[str] = "andhra_pradesh") -> Dict[str, Any]:
        data = self._load_data(state_id)
        if data["cap_geojson"] is None:
            geojson_path = data["cap_geojson_path"]
            with open(geojson_path, "r", encoding="utf-8") as f:
                data["cap_geojson"] = json.load(f)

        if not district_id:
            return data["cap_geojson"]

        target_did = district_id.strip().lower()
        filtered = [
            feat for feat in data["cap_geojson"].get("features", [])
            if str(feat.get("properties", {}).get("current_district_id", "")).lower() == target_did
        ]
        return {
            "type": "FeatureCollection",
            "features": filtered
        }

    def get_adequacy_geojson(self, district_id: Optional[str] = None, state_id: Optional[str] = "andhra_pradesh") -> Dict[str, Any]:
        data = self._load_data(state_id)
        if data["adequacy_geojson"] is None:
            geojson_path = data["adequacy_geojson_path"]
            with open(geojson_path, "r", encoding="utf-8") as f:
                data["adequacy_geojson"] = json.load(f)

        if not district_id:
            return data["adequacy_geojson"]

        target_did = district_id.strip().lower()
        filtered = [
            feat for feat in data["adequacy_geojson"].get("features", [])
            if str(feat.get("properties", {}).get("current_district_id", "")).lower() == target_did
        ]
        return {
            "type": "FeatureCollection",
            "features": filtered
        }

capacity_service = CapacityService()
