import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
from app.core.config import settings
from app.hazard.schemas import (
    MandalHazardExposureItem,
    MandalExposureListResponse,
    HazardSummaryResponse,
)


class HazardService:
    def __init__(self):
        self._exposure_df: Optional[pd.DataFrame] = None
        self._exposure_geojson: Optional[Dict[str, Any]] = None

    def _load_data(self):
        if self._exposure_df is not None:
            return

        csv_path = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure" / "mandal_multi_hazard_exposure.csv"
        if not csv_path.exists():
            raise FileNotFoundError(f"Mandal exposure data not found at {csv_path}")

        self._exposure_df = pd.read_csv(csv_path)

    def get_all_mandals(self, district_id: Optional[str] = None) -> MandalExposureListResponse:
        self._load_data()
        df = self._exposure_df

        if district_id:
            df = df[df["current_district_id"] == district_id.strip().lower()]

        items = [MandalHazardExposureItem(**row) for row in df.to_dict(orient="records")]
        return MandalExposureListResponse(total_mandals=len(items), items=items)

    def get_mandal_detail(self, mandal_id: str) -> Optional[MandalHazardExposureItem]:
        self._load_data()
        target = mandal_id.strip().upper()
        # Search by mandal_id (e.g. AP_MANDAL_001) or by mandal_name
        match = self._exposure_df[
            (self._exposure_df["mandal_id"] == target) |
            (self._exposure_df["mandal_name"].str.upper() == target)
        ]
        if match.empty:
            return None
        return MandalHazardExposureItem(**match.iloc[0].to_dict())

    def get_summary(self) -> HazardSummaryResponse:
        self._load_data()
        df = self._exposure_df

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
            methodology_note="Bounded multi-hazard exposure index H_i in [0, 1] synthesized from Flood (40%), Cyclone (30%), Wind (20%), and Topographic Slope constraint (10%)."
        )

    def get_geojson(self, district_id: Optional[str] = None) -> Dict[str, Any]:
        if self._exposure_geojson is None:
            geojson_path = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure" / "ap_mandal_multi_hazard_exposure.geojson"
            if not geojson_path.exists():
                raise FileNotFoundError(f"Mandal exposure GeoJSON not found at {geojson_path}")
            with open(geojson_path, "r", encoding="utf-8") as f:
                self._exposure_geojson = json.load(f)

        if not district_id:
            return self._exposure_geojson

        target_did = district_id.strip().lower()
        filtered_features = [
            f for f in self._exposure_geojson.get("features", [])
            if str(f.get("properties", {}).get("current_district_id", "")).lower() == target_did
        ]
        return {
            "type": "FeatureCollection",
            "features": filtered_features
        }


hazard_service = HazardService()
