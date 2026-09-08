import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
from app.core.config import settings
from app.core.state_config import resolve_state_config
from app.hazard.schemas import (
    MandalHazardExposureItem,
    MandalExposureListResponse,
    HazardSummaryResponse,
)

class HazardService:
    def __init__(self):
        self._cache_df: Dict[str, pd.DataFrame] = {}
        self._cache_geojson: Dict[str, Dict[str, Any]] = {}

    def _load_data_for_state(self, state_key: str):
        if state_key in self._cache_df:
            return

        cfg = resolve_state_config(state_key)
        csv_path = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure" / cfg.hazard_csv_filename
        if not csv_path.exists():
            raise FileNotFoundError(f"Hazard exposure data not found at {csv_path}")

        df = pd.read_csv(csv_path)
        self._cache_df[state_key] = df

    def get_all_mandals(self, district_id: Optional[str] = None, state: Optional[str] = None) -> MandalExposureListResponse:
        cfg = resolve_state_config(state)
        self._load_data_for_state(cfg.state_id)
        df = self._cache_df[cfg.state_id]

        if district_id:
            df = df[df["current_district_id"] == district_id.strip().lower()]

        items = [MandalHazardExposureItem(**row) for row in df.to_dict(orient="records")]
        return MandalExposureListResponse(total_mandals=len(items), items=items)

    def get_mandal_detail(self, mandal_id: str, state: Optional[str] = None) -> Optional[MandalHazardExposureItem]:
        cfg = resolve_state_config(state)
        self._load_data_for_state(cfg.state_id)
        df = self._cache_df[cfg.state_id]
        
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
        return MandalHazardExposureItem(**match.iloc[0].to_dict())

    def get_summary(self, state: Optional[str] = None) -> HazardSummaryResponse:
        cfg = resolve_state_config(state)
        self._load_data_for_state(cfg.state_id)
        df = self._cache_df[cfg.state_id]

        indices = df["multi_hazard_exposure_index"]
        high_count = int((indices >= 0.50).sum())
        mod_count = int(((indices >= 0.25) & (indices < 0.50)).sum())
        low_count = int((indices < 0.25).sum())

        top_5 = df.sort_values("multi_hazard_exposure_index", ascending=False).head(5)[
            ["mandal_id", "mandal_name", "current_district_name", "multi_hazard_exposure_index"]
        ].to_dict(orient="records")

        return HazardSummaryResponse(
            total_mandals=len(df),
            mean_exposure_index=round(float(indices.mean()), 4),
            min_exposure_index=round(float(indices.min()), 4),
            max_exposure_index=round(float(indices.max()), 4),
            exposure_distribution={
                "high_exposure_ge_0_50": high_count,
                "moderate_exposure_0_25_to_0_50": mod_count,
                "low_exposure_lt_0_25": low_count,
            },
            top_exposed_mandals=top_5,
            storm_surge_included=False,
            storm_surge_exclusion_reason="No open analytical storm surge layer available in Phase 2B; excluded to prevent unverified scores.",
            methodology_note=f"Bounded multi-hazard exposure index H_i in [0, 1] synthesized from Flood (40%), Cyclone (30%), Wind (20%), and Topographic Slope constraint (10%) for {cfg.state_name}."
        )

    def get_geojson(self, district_id: Optional[str] = None, state: Optional[str] = None) -> Dict[str, Any]:
        cfg = resolve_state_config(state)
        state_key = cfg.state_id

        if state_key not in self._cache_geojson:
            geojson_path = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure" / cfg.hazard_geojson_filename
            if not geojson_path.exists():
                raise FileNotFoundError(f"Hazard exposure GeoJSON not found at {geojson_path}")
            with open(geojson_path, "r", encoding="utf-8") as f:
                self._cache_geojson[state_key] = json.load(f)

        full_geojson = self._cache_geojson[state_key]
        if not district_id:
            return full_geojson

        target_did = district_id.strip().lower()
        filtered_features = [
            f for f in full_geojson.get("features", [])
            if str(f.get("properties", {}).get("current_district_id", "")).lower() == target_did
        ]
        return {
            "type": "FeatureCollection",
            "features": filtered_features
        }

hazard_service = HazardService()
