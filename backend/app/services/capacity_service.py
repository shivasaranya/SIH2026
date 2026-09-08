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

class CapacityService:
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

        cap_dir = settings.DATA_DIR / "processed" / "capacity"

        if key == "jh":
            cap_csv = cap_dir / "jh_blocks_capacity_adequacy.csv"
            adequacy_csv = cap_dir / "jh_blocks_capacity_adequacy.csv"
            host_csv = cap_dir / "jh_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "jh_blocks_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        elif key == "mn":
            cap_csv = cap_dir / "mn_subdivisions_capacity_adequacy.csv"
            adequacy_csv = cap_dir / "mn_subdivisions_capacity_adequacy.csv"
            host_csv = cap_dir / "mn_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "mn_subdivisions_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        elif key == "ga":
            cap_csv = cap_dir / "ga_taluks_capacity_adequacy.csv"
            adequacy_csv = cap_dir / "ga_taluks_capacity_adequacy.csv"
            host_csv = cap_dir / "ga_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "ga_taluks_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        elif key == "ka":
            cap_csv = cap_dir / "ka_taluks_capacity_adequacy.csv"
            adequacy_csv = cap_dir / "ka_taluks_capacity_adequacy.csv"
            host_csv = cap_dir / "ka_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "ka_taluks_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        elif key == "mp":
            cap_csv = cap_dir / "mp_tehsils_capacity_components.csv"
            adequacy_csv = cap_dir / "mp_tehsils_capacity_adequacy.csv"
            host_csv = cap_dir / "mp_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "mp_tehsils_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        elif key == "rj":
            cap_csv = cap_dir / "rj_tehsils_capacity_components.csv"
            adequacy_csv = cap_dir / "rj_tehsils_capacity_adequacy.csv"
            host_csv = cap_dir / "rj_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "rj_tehsils_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        elif key == "tg":
            cap_csv = cap_dir / "tg_mandal_capacity_components.csv"
            adequacy_csv = cap_dir / "tg_mandal_capacity_adequacy.csv"
            host_csv = cap_dir / "tg_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "tg_mandal_capacity_adequacy.geojson"
            cap_geojson = adequacy_geojson
            bottlenecks_csv = adequacy_csv
        elif key == "tr":
            cap_csv = cap_dir / "tr_subdivision_capacity_components.csv"
            adequacy_csv = cap_dir / "tr_subdivision_capacity_adequacy.csv"
            host_csv = cap_dir / "tr_host_zone_candidates.csv"
            adequacy_geojson = cap_dir / "tr_subdivision_capacity_adequacy.geojson"
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
        if target.startswith("TR_"):
            detected_state = "tripura"
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
        if match.empty and detected_state != "tripura":
            tr_data = self._load_data("tripura")
            match = tr_data["cap_df"][
                (tr_data["cap_df"]["mandal_id"] == target) |
                (tr_data["cap_df"]["mandal_name"].str.upper() == target)
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
        if target.startswith("TR_"):
            detected_state = "tripura"
        elif target.startswith("TN_"):
            detected_state = "tamil_nadu"
        else:
            detected_state = state_id

        data = self._load_data(detected_state)
        df = data["adequacy_df"]

        match = df[
            (df["mandal_id"] == target) |
            (df["mandal_name"].str.upper() == target)
        ]
        if match.empty and detected_state != "tripura":
            tr_data = self._load_data("tripura")
            match = tr_data["adequacy_df"][
                (tr_data["adequacy_df"]["mandal_id"] == target) |
                (tr_data["adequacy_df"]["mandal_name"].str.upper() == target)
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

        cond_counts = df["capacity_condition"].value_counts().to_dict()
        bottleneck_counts = df["primary_bottleneck"].value_counts().to_dict()
        shelter_stat_counts = df["shelter_status"].value_counts().to_dict()
        host_count = int(df["is_host_zone_candidate"].sum())
        mean_comp = round(float(df["capacity_data_completeness"].mean()), 3)

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
        target = mandal_id.strip().upper()
        if target.startswith("TR_") or (state_id and is_tr(state_id)):
            detected_state = "tripura"
        elif target.startswith("TN_") or (state_id and is_tn(state_id)):
            detected_state = "tamil_nadu"
        else:
            detected_state = state_id

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
            governance_disclaimer="CANDIDATE HOST ZONE — HUMAN REVIEW REQUIRED. Distances computed in EPSG:7755 (India Albers Equal Area)."
        )

capacity_service = CapacityService()
