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

def is_hp(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["himachal_pradesh", "hp", "himachal"]

class CapacityService:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _get_state_key(self, state_id: Optional[str]) -> str:
        if is_mizoram(state_id):
            return "mz"
        if is_tn(state_id):
            return "tn"
        if is_hp(state_id):
            return "hp"
        return "ap"

    def _load_data(self, state_id: Optional[str] = "andhra_pradesh"):
        key = self._get_state_key(state_id)
        if key in self._cache:
            return self._cache[key]

        cap_dir = settings.DATA_DIR / "processed" / "capacity"

        if key == "mz":
            cap_csv = cap_dir / "mizoram_subdistrict_capacity_components.csv"
            adequacy_csv = cap_dir / "mizoram_subdistrict_capacity_adequacy.csv"
            host_csv = cap_dir / "mizoram_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "mizoram_subdistrict_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        elif key == "hp":
            cap_csv = cap_dir / "hp_tehsil_capacity_components.csv"
            adequacy_csv = cap_dir / "hp_tehsil_capacity_adequacy.csv"
            host_csv = cap_dir / "hp_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "hp_tehsil_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        elif key == "tn":
            cap_csv = cap_dir / "tn_taluk_capacity_components.csv"
            adequacy_csv = cap_dir / "tn_taluk_capacity_adequacy.csv"
            host_csv = cap_dir / "tn_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "tn_taluk_capacity_adequacy.geojson"
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

        data = {
            "cap_df": pd.read_csv(cap_csv),
            "adequacy_df": pd.read_csv(adequacy_csv) if adequacy_csv.exists() else None,
            "bottlenecks_df": pd.read_csv(bottlenecks_csv) if bottlenecks_csv.exists() else None,
            "host_df": pd.read_csv(host_csv) if host_csv.exists() else None,
            "cap_geojson_path": cap_geojson,
            "adequacy_geojson_path": adequacy_geojson,
            "cap_geojson": None,
            "adequacy_geojson": None,
        }
        self._cache[key] = data
        return data

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
        if target.startswith("MZ_"):
            detected_state = "mizoram"
        elif target.startswith("TN_"):
            detected_state = "tamil_nadu"
        else:
            detected_state = state_id

        data = self._load_data(detected_state)
        df = data["cap_df"]

        match = df[
            (df["mandal_id"] == target) |
            (df["mandal_name"].str.upper() == target)
        ]
        if match.empty and detected_state != "tamil_nadu" and detected_state != "mizoram":
            tn_data = self._load_data("tamil_nadu")
            match = tn_data["cap_df"][
                (tn_data["cap_df"]["mandal_id"] == target) |
                (tn_data["cap_df"]["mandal_name"].str.upper() == target)
            ]
        if match.empty and detected_state != "mizoram":
            mz_data = self._load_data("mizoram")
            match = mz_data["cap_df"][
                (mz_data["cap_df"]["mandal_id"] == target) |
                (mz_data["cap_df"]["mandal_name"].str.upper() == target)
            ]
        if match.empty:
            return None
        return MandalCapacityItem(**match.iloc[0].replace({np.nan: None}).to_dict())

    def get_summary(self, state_id: Optional[str] = "andhra_pradesh") -> CapacitySummaryResponse:
        data = self._load_data(state_id)
        df = data["cap_df"]

        shelter_mandals = df[df["shelter_count"] > 0]
        top_shelter = df.sort_values(by="verified_shelter_capacity_persons", ascending=False).head(5)[
            ["mandal_id", "mandal_name", "current_district_name", "shelter_count", "verified_shelter_capacity_persons"]
        ].to_dict(orient="records")

        return CapacitySummaryResponse(
            total_mandals=len(df),
            total_designated_shelters=int(df["shelter_count"].sum()),
            total_verified_shelter_capacity_persons=int(df["verified_shelter_capacity_persons"].sum()),
            mandals_with_designated_shelters=len(shelter_mandals),
            mandals_without_designated_shelters=len(df) - len(shelter_mandals),
            mean_shelter_capacity_per_1000_in_shelter_mandals=round(float(shelter_mandals["shelter_capacity_per_1000"].mean()), 2) if len(shelter_mandals) > 0 else 0.0,
            total_normative_health_beds_iphs=int(df["normative_health_capacity_baseline"].sum()),
            mean_normative_beds_per_1000=round(float(df["normative_beds_per_1000"].mean()), 2),
            mean_water_access_percent=round(float(df["water_access_percent"].mean()), 2),
            mean_sanitation_coverage_percent=round(float(df["sanitation_coverage_percent"].mean()), 2),
            mean_water_sanitation_adequacy=round(float(df["water_sanitation_adequacy"].mean()), 4),
            total_evacuation_road_length_km=round(float(df["road_length_km"].sum()), 1),
            mean_road_density_km_per_km2=round(float(df["road_density_km_per_km2"].mean()), 2),
            mean_safe_area_fraction=round(float(df["safe_area_fraction"].mean()), 4),
            mean_safe_area_m2_per_person=round(float(df["safe_area_m2_per_person"].mean()), 1),
            top_shelter_mandals=top_shelter,
            methodology_note="Physical carrying capacity covers verified shelter facilities, IPHS normative health beds, WASH indices, PMGSY road accessibility, and non-steep/non-water safe land.",
            classification_standards={
                "shelter": "NDMA / SDMA verified disaster shelters",
                "shelter_capacity": "NCRMP Phase-I Multi-Purpose Cyclone Shelters (Direct Engineering Design Persons)",
                "school_emergency_space": "UDISE+ School Infrastructure (Unavailable in open catalog; not fabricated)",
                "health": "IPHS Community Health Standard baseline",
                "health_capacity": "Normative IPHS 2022 Facility Bed Baseline (PHC: 6, CHC: 30, SDH: 100, DH: 300)",
                "wash": "JJM & SBM-G administrative indicators",
                "water_sanitation": "JJM Functional Tap Connections (%) & SBM-G Sanitation (Infrastructure Adequacy Proxy)",
                "road": "PMGSY road network clearance",
                "evacuation_road": "OpenStreetMap Highway Density km/km² (Evacuation Accessibility Proxy; NOT vehicle flow capacity)",
                "safe_area": "Non-inundation / non-steep land fraction",
                "safe_habitable_area": "JRC GSW Flood + SRTM Slope Exclusion m²/person (Spatial Safety Constraint vs. Sphere Standard)"
            }
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
        return {"type": "FeatureCollection", "features": filtered}

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
        df = data["adequacy_df"].copy()

        if district_id:
            df = df[df["current_district_id"] == district_id.strip().lower()]
        if shelter_status:
            df = df[df["shelter_status"].str.lower() == shelter_status.strip().lower()]
        if health_status:
            df = df[df["health_status"].str.lower() == health_status.strip().lower()]
        if capacity_condition:
            df = df[df["capacity_condition"].str.upper() == capacity_condition.strip().upper()]
        if primary_bottleneck:
            df = df[df["primary_bottleneck"].str.lower() == primary_bottleneck.strip().lower()]
        if is_host_candidate is not None:
            df = df[df["is_host_zone_candidate"] == is_host_candidate]

        records = df.replace({np.nan: None}).to_dict(orient="records")
        items = [MandalCapacityAdequacyItem(**row) for row in records]
        return MandalCapacityAdequacyListResponse(total_mandals=len(items), items=items)

    def get_adequacy_mandal_detail(self, mandal_id: str, state_id: Optional[str] = "andhra_pradesh") -> Optional[MandalCapacityAdequacyItem]:
        target = mandal_id.strip().upper()
        detected_state = "tamil_nadu" if target.startswith("TN_") else state_id
        data = self._load_data(detected_state)
        df = data["adequacy_df"]

        match = df[
            (df["mandal_id"] == target) |
            (df["mandal_name"].str.upper() == target)
        ]
        if match.empty:
            for fallback_state in ["tamil_nadu", "mizoram", "andhra_pradesh"]:
                if fallback_state == detected_state:
                    continue
                fb_data = self._load_data(fallback_state)
                fb_match = fb_data["adequacy_df"][
                    (fb_data["adequacy_df"]["mandal_id"] == target) |
                    (fb_data["adequacy_df"]["mandal_name"].str.upper() == target)
                ]
                if not fb_match.empty:
                    match = fb_match
                    break
        if match.empty:
            return None
        return MandalCapacityAdequacyItem(**match.iloc[0].replace({np.nan: None}).to_dict())

    def get_adequacy_summary(self, state_id: Optional[str] = "andhra_pradesh") -> CapacityAdequacySummaryResponse:
        data = self._load_data(state_id)
        df = data["adequacy_df"]

        cond_counts = df["capacity_condition"].value_counts().to_dict() if "capacity_condition" in df.columns else (df["adequacy_tier"].value_counts().to_dict() if "adequacy_tier" in df.columns else {})
        bottleneck_counts = df["primary_bottleneck"].value_counts().to_dict() if "primary_bottleneck" in df.columns else (df["evacuation_road_bottleneck"].value_counts().to_dict() if "evacuation_road_bottleneck" in df.columns else {})
        shelter_stat_counts = df["shelter_status"].value_counts().to_dict() if "shelter_status" in df.columns else {}
        host_count = int(df["is_host_zone_candidate"].sum()) if "is_host_zone_candidate" in df.columns else (len(data["host_df"]) if data.get("host_df") is not None else 5)
        mean_comp = round(float(df["capacity_data_completeness"].mean()), 3) if "capacity_data_completeness" in df.columns else 1.0

        return CapacityAdequacySummaryResponse(
            total_mandals=len(df),
            condition_breakdown=cond_counts,
            primary_bottleneck_breakdown=bottleneck_counts,
            host_zone_candidates_pool_count=host_count,
            mean_data_completeness=mean_comp,
            shelter_coverage_breakdown=shelter_stat_counts,
            governance_notice="Capacity condition and bottleneck identifications are decision-support analytical classifications. They do NOT mandate or execute habitation relocation."
        )

    def get_bottlenecks(
        self,
        district_id: Optional[str] = None,
        primary_bottleneck: Optional[str] = None,
        state_id: Optional[str] = "andhra_pradesh"
    ) -> MandalBottlenecksListResponse:
        data = self._load_data(state_id)
        df = data["bottlenecks_df"].copy()

        if district_id:
            df = df[df["current_district_id"] == district_id.strip().lower()]
        if primary_bottleneck:
            df = df[df["primary_bottleneck"].str.lower() == primary_bottleneck.strip().lower()]

        records = df.replace({np.nan: None}).to_dict(orient="records")
        items = [MandalBottleneckItem(**row) for row in records]
        return MandalBottlenecksListResponse(total_mandals=len(items), items=items)

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
        return {"type": "FeatureCollection", "features": filtered}

    def get_host_zones(self, mandal_id: str, state_id: Optional[str] = "andhra_pradesh") -> HostZoneCandidateListResponse:
        from app.services.relocation_service import relocation_service
        return relocation_service.get_host_zones_for_mandal(mandal_id, state_id=state_id)

capacity_service = CapacityService()
