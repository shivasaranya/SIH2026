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


class CapacityService:
    def __init__(self):
        self._cap_df: Optional[pd.DataFrame] = None
        self._adequacy_df: Optional[pd.DataFrame] = None
        self._bottlenecks_df: Optional[pd.DataFrame] = None
        self._host_candidates_df: Optional[pd.DataFrame] = None
        self._cap_geojson: Optional[Dict[str, Any]] = None
        self._adequacy_geojson: Optional[Dict[str, Any]] = None

    def _load_data(self):
        if self._cap_df is not None:
            return

        cap_csv = settings.DATA_DIR / "processed" / "capacity" / "mandal_capacity_components.csv"
        if not cap_csv.exists():
            raise FileNotFoundError(f"Mandal capacity components data not found at {cap_csv}")
        self._cap_df = pd.read_csv(cap_csv)

        adequacy_csv = settings.DATA_DIR / "processed" / "capacity" / "mandal_capacity_adequacy.csv"
        if adequacy_csv.exists():
            self._adequacy_df = pd.read_csv(adequacy_csv)

        bottlenecks_csv = settings.DATA_DIR / "processed" / "capacity" / "mandal_bottlenecks.csv"
        if bottlenecks_csv.exists():
            self._bottlenecks_df = pd.read_csv(bottlenecks_csv)

        host_csv = settings.DATA_DIR / "processed" / "capacity" / "host_zone_candidates.csv"
        if host_csv.exists():
            self._host_candidates_df = pd.read_csv(host_csv)

    def get_all_mandals(
        self,
        district_id: Optional[str] = None,
        has_shelters: Optional[bool] = None,
        shelter_status: Optional[str] = None,
    ) -> MandalCapacityListResponse:
        self._load_data()
        df = self._cap_df.copy()

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

    def get_mandal_detail(self, mandal_id: str) -> Optional[MandalCapacityItem]:
        self._load_data()
        target = mandal_id.strip().upper()
        match = self._cap_df[
            (self._cap_df["mandal_id"] == target) |
            (self._cap_df["mandal_name"].str.upper() == target)
        ]
        if match.empty:
            return None
        row_dict = match.iloc[0].replace({np.nan: None}).to_dict()
        return MandalCapacityItem(**row_dict)

    def get_summary(self) -> CapacitySummaryResponse:
        self._load_data()
        df = self._cap_df
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
            methodology_note="Physical Carrying Capacity is evaluated across distinct physical dimensions (Direct Shelter Capacity, Evacuation Road Density Proxy, IPHS Normative Bed Baseline, Water/Sanitation Adequacy, and Spatial Safe Habitable Headroom). In accordance with Phase 3 standards, unphysical dimensionless divisions (Population / CCI) are explicitly rejected.",
            classification_standards={
                "shelter_capacity": "NCRMP Phase-I Multi-Purpose Cyclone Shelters (Direct Engineering Design Persons)",
                "school_emergency_space": "UDISE+ School Infrastructure (Unavailable in open catalog; not fabricated)",
                "health_capacity": "Normative IPHS 2022 Facility Bed Baseline (PHC: 6, CHC: 30, SDH: 100, DH: 300)",
                "water_sanitation": "JJM Functional Tap Connections (%) & SBM-G Sanitation (Infrastructure Adequacy Proxy)",
                "evacuation_road": "OpenStreetMap Highway Density km/km² (Evacuation Accessibility Proxy; NOT vehicle flow capacity)",
                "safe_habitable_area": "JRC GSW Flood + SRTM Slope Exclusion m²/person (Spatial Safety Constraint vs. Sphere Standard)"
            }
        )

    def get_geojson(self, district_id: Optional[str] = None) -> Dict[str, Any]:
        if self._cap_geojson is None:
            geojson_path = settings.DATA_DIR / "processed" / "capacity" / "ap_mandal_capacity_components.geojson"
            if not geojson_path.exists():
                raise FileNotFoundError(f"Capacity GeoJSON not found at {geojson_path}")
            with open(geojson_path, "r", encoding="utf-8") as f:
                self._cap_geojson = json.load(f)

        if not district_id:
            return self._cap_geojson

        target_did = district_id.strip().lower()
        filtered = [
            feat for feat in self._cap_geojson.get("features", [])
            if str(feat.get("properties", {}).get("current_district_id", "")).lower() == target_did
        ]
        return {
            "type": "FeatureCollection",
            "features": filtered
        }

    # ==================== Phase 3C Methods ====================

    def get_adequacy_summary(self) -> CapacityAdequacySummaryResponse:
        self._load_data()
        df = self._adequacy_df
        if df is None:
            raise FileNotFoundError("Mandal capacity adequacy data not loaded.")

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

    def get_all_adequacy_mandals(
        self,
        district_id: Optional[str] = None,
        capacity_condition: Optional[str] = None,
        primary_bottleneck: Optional[str] = None,
        is_host_candidate: Optional[bool] = None,
    ) -> MandalCapacityAdequacyListResponse:
        self._load_data()
        df = self._adequacy_df.copy()

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

    def get_adequacy_mandal_detail(self, mandal_id: str) -> Optional[MandalCapacityAdequacyItem]:
        self._load_data()
        target = mandal_id.strip().upper()
        match = self._adequacy_df[
            (self._adequacy_df["mandal_id"] == target) |
            (self._adequacy_df["mandal_name"].str.upper() == target)
        ]
        if match.empty:
            return None
        row_dict = match.iloc[0].replace({np.nan: None}).to_dict()
        return MandalCapacityAdequacyItem(**row_dict)

    def get_bottlenecks(
        self,
        district_id: Optional[str] = None,
        primary_bottleneck: Optional[str] = None,
    ) -> MandalBottlenecksListResponse:
        self._load_data()
        df = self._bottlenecks_df.copy()

        if district_id:
            df = df[df["current_district_id"] == district_id.strip().lower()]
        if primary_bottleneck:
            df = df[df["primary_bottleneck"].str.lower() == primary_bottleneck.strip().lower()]

        records = df.replace({np.nan: None}).to_dict(orient="records")
        items = [MandalBottleneckItem(**row) for row in records]
        return MandalBottlenecksListResponse(total_mandals=len(items), items=items)

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
            governance_disclaimer="CANDIDATE HOST ZONE — HUMAN REVIEW REQUIRED. Distances computed in EPSG:7755 (India Albers Equal Area). This list presents screened candidate zones with lower hazard and adequate headroom for planning authorities; it is NOT an approved relocation order."
        )


capacity_service = CapacityService()
