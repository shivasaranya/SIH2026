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

class CapacityService:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _get_state_key(self, state_id: Optional[str]) -> str:
        return "tn" if is_tn(state_id) else "ap"

    def _load_data(self, state_id: Optional[str] = "andhra_pradesh"):
        key = self._get_state_key(state_id)
        if key in self._cache:
            return self._cache[key]

        cap_dir = settings.DATA_DIR / "processed" / "capacity"

        if key == "tn":
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
            "adequacy_geojson": None
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
        detected_state = "tamil_nadu" if target.startswith("TN_") else state_id
        data = self._load_data(detected_state)
        df = data["cap_df"]

        match = df[
            (df["mandal_id"] == target) |
            (df["mandal_name"].str.upper() == target)
        ]
        if match.empty and detected_state != "tamil_nadu":
            tn_data = self._load_data("tamil_nadu")
            match = tn_data["cap_df"][
                (tn_data["cap_df"]["mandal_id"] == target) |
                (tn_data["cap_df"]["mandal_name"].str.upper() == target)
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
                "health": "IPHS Community Health Standard baseline",
                "wash": "JJM & SBM-G administrative indicators",
                "road": "PMGSY road network clearance",
                "safe_area": "Non-inundation / non-steep land fraction"
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
        if match.empty and detected_state != "tamil_nadu":
            tn_data = self._load_data("tamil_nadu")
            match = tn_data["adequacy_df"][
                (tn_data["adequacy_df"]["mandal_id"] == target) |
                (tn_data["adequacy_df"]["mandal_name"].str.upper() == target)
            ]
        if match.empty:
            return None
        return MandalCapacityAdequacyItem(**match.iloc[0].replace({np.nan: None}).to_dict())

    def get_adequacy_summary(self, state_id: Optional[str] = "andhra_pradesh") -> CapacityAdequacySummaryResponse:
        data = self._load_data(state_id)
        df = data["adequacy_df"]

        deficit_mandals = df[df["shelter_deficit_persons"] > 0]
        deficit_by_dist = df.groupby("current_district_name")["shelter_deficit_persons"].sum().to_dict()

        return CapacityAdequacySummaryResponse(
            total_mandals=len(df),
            mandals_with_shelter_deficit=len(deficit_mandals),
            mandals_shelter_adequate=len(df) - len(deficit_mandals),
            total_shelter_deficit_persons=int(df["shelter_deficit_persons"].sum()),
            shelter_deficit_by_district=deficit_by_dist,
            mandals_health_deficit=int((df["health_status"] == "DEFICIT").sum()),
            mandals_safe_area_constrained=int((df["safe_area_status"] == "CONSTRAINED").sum()),
            mandals_road_access_constrained=int((df["road_access_status"] == "MODERATE").sum()),
            methodology_note="Carrying capacity stress evaluates population relief headroom against emergency infrastructure standards."
        )

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
        target = mandal_id.strip().upper()
        detected_state = "tamil_nadu" if (target.startswith("TN_") or state_id == "tamil_nadu") else state_id
        data = self._load_data(detected_state)
        df = data["host_df"]

        if "ALL" in target or "STATEWIDE" in target:
            unique_candidates = df.drop_duplicates(subset=["candidate_mandal_id"]).copy()
            records = unique_candidates.replace({np.nan: None}).to_dict(orient="records")
            items = [HostZoneCandidateItem(**row) for row in records]
            return HostZoneCandidateListResponse(
                source_mandal_id=target,
                total_candidates=len(items),
                candidates=items,
                governance_disclaimer="CANDIDATE HOST ZONE — HUMAN REVIEW REQUIRED. Distances computed in EPSG:7755 (India Albers Equal Area)."
            )

        match = df[
            (df["source_mandal_id"] == target) |
            (df["source_mandal_name"].str.upper() == target)
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
            governance_disclaimer="CANDIDATE HOST ZONE — HUMAN REVIEW REQUIRED. Distances computed in EPSG:7755 (India Albers Equal Area)."
        )

capacity_service = CapacityService()
