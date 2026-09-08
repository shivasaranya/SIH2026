import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
from app.core.config import settings
from app.core.state_registry import state_registry, get_state_key
from app.hazard.schemas import (
    MandalHazardExposureItem,
    MandalExposureListResponse,
    HazardSummaryResponse,
)

def resolve_state_key(state_id: Optional[str]) -> str:
    return get_state_key(state_id)
class HazardService:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _get_state_key(self, state_id: Optional[str]) -> str:
        return get_state_key(state_id)

    def _load_data(self, state_id: Optional[str] = "andhra_pradesh"):
        key = self._get_state_key(state_id)
        if key in self._cache:
            return self._cache[key]

        meta = state_registry.get_state(key)
        csv_path = meta.hazard_csv
        geojson_path = meta.hazard_geojson
        if not meta.is_coastal:
            surge_included = False
            surge_reason = f"Inland {meta.name}: Direct coastal storm surge is Not Applicable (0.0). Inland models applied."
        elif key == "tamil_nadu":
            surge_included = True
            surge_reason = "None"
        else:
            surge_included = False
            surge_reason = "Open-access coastal surge inundation layer requires dynamic hydrodynamic modeling (e.g. ADCIRC). Historical tropical storm buffers applied as proxy."

        if not csv_path or not csv_path.exists():
            raise FileNotFoundError(f"Hazard data for {key} not found at {csv_path}")

        df = pd.read_csv(csv_path)

        # Standardize column naming if needed
        if "mandal_id" not in df.columns:
            for cand in ["taluka_id", "block_id", "circle_id", "tehsil_id", "subdivision_id"]:
                if cand in df.columns:
                    df["mandal_id"] = df[cand]
                    break

        if "mandal_name" not in df.columns:
            for cand in ["taluka_name", "block_name", "circle_name", "tehsil_name", "subdivision_name"]:
                if cand in df.columns:
                    df["mandal_name"] = df[cand]
                    break

        data = {
            "exposure_df": df,
            "geojson_path": geojson_path,
            "surge_included": surge_included,
            "surge_reason": surge_reason,
            "geojson": None
        }
        self._cache[key] = data
        return data

    def get_all_mandals(self, district_id: Optional[str] = None, state_id: Optional[str] = None, state: Optional[str] = None) -> MandalExposureListResponse:
        data = self._load_data(state_id or state or "andhra_pradesh")
        df = data["exposure_df"]

        if district_id:
            did_clean = district_id.strip().lower()
            if "current_district_id" in df.columns:
                df = df[df["current_district_id"].astype(str).str.lower() == did_clean]
            elif "district_id" in df.columns:
                df = df[df["district_id"].astype(str).str.lower() == did_clean]

        items = []
        for row in df.to_dict(orient="records"):
            # Ensure required schema fields exist with defaults
            clean_row = dict(row)
            if "mandal_id" not in clean_row:
                clean_row["mandal_id"] = str(row.get("circle_id", row.get("tehsil_id", row.get("block_id", row.get("subdivision_id", row.get("taluk_id", ""))))))
            if "mandal_name" not in clean_row:
                clean_row["mandal_name"] = str(row.get("circle_name", row.get("tehsil_name", row.get("block_name", row.get("subdivision_name", row.get("taluk_name", ""))))))
            if "current_district_id" not in clean_row:
                clean_row["current_district_id"] = str(row.get("district_id", ""))
            if "current_district_name" not in clean_row:
                clean_row["current_district_name"] = str(row.get("district_name", ""))
            if "mandal_area_sqkm" not in clean_row:
                clean_row["mandal_area_sqkm"] = float(row.get("area_sqkm", 0.0))
            if "multi_hazard_exposure_index" not in clean_row:
                clean_row["multi_hazard_exposure_index"] = float(row.get("c1_hazard_exposure", row.get("composite_hazard_index", row.get("composite_hazard_score", 0.0))))

            items.append(MandalHazardExposureItem(**clean_row))

        return MandalExposureListResponse(total_mandals=len(items), items=items)

    def get_mandal_detail(self, mandal_id: str, state_id: Optional[str] = None, state: Optional[str] = None) -> Optional[MandalHazardExposureItem]:
        target = mandal_id.strip().upper()
        # Find which state this unit belongs to
        detected_state = state_id
        for sk, smeta in state_registry.states.items():
            if target.startswith(f"{smeta.code}_"):
                detected_state = sk
                break

        data = self._load_data(detected_state)
        df = data["exposure_df"]

        id_col = "mandal_id" if "mandal_id" in df.columns else ("block_id" if "block_id" in df.columns else "circle_id")
        name_col = "mandal_name" if "mandal_name" in df.columns else ("block_name" if "block_name" in df.columns else "circle_name")

        match = df[
            (df[id_col].astype(str).str.upper() == target) |
            (df[name_col].astype(str).str.upper() == target)
        ]
        if match.empty:
            # Try other states in registry
            for sk in state_registry.states.keys():
                if sk == detected_state:
                    continue
                other_data = self._load_data(sk)
                odf = other_data["exposure_df"]
                oid = "mandal_id" if "mandal_id" in odf.columns else ("block_id" if "block_id" in odf.columns else "circle_id")
                oname = "mandal_name" if "mandal_name" in odf.columns else ("block_name" if "block_name" in odf.columns else "circle_name")
                match = odf[
                    (odf[oid].astype(str).str.upper() == target) |
                    (odf[oname].astype(str).str.upper() == target)
                ]
                if not match.empty:
                    break

        if match.empty:
            for s in ["andhra_pradesh", "assam", "tamil_nadu", "bihar", "west_bengal", "odisha", "uttar_pradesh", "uttarakhand", "sikkim", "arunachal_pradesh", "nagaland", "meghalaya", "gujarat", "kerala", "maharashtra", "haryana", "punjab", "chhattisgarh", "mizoram", "himachal_pradesh"]:
                if s == detected_state:
                    continue
                s_data = self._load_data(s)
                s_df = s_data["exposure_df"]
                match = s_df[
                    (s_df["mandal_id"].astype(str).str.upper() == target) |
                    (s_df["mandal_name"].astype(str).str.upper() == target)
                ]
                if not match.empty:
                    break
        if match.empty:
            return None

        row = match.iloc[0].to_dict()
        clean_row = dict(row)
        if "mandal_id" not in clean_row:
            clean_row["mandal_id"] = str(row.get("circle_id", row.get("tehsil_id", row.get("block_id", row.get("subdivision_id", row.get("taluk_id", ""))))))
        if "mandal_name" not in clean_row:
            clean_row["mandal_name"] = str(row.get("circle_name", row.get("tehsil_name", row.get("block_name", row.get("subdivision_name", row.get("taluk_name", ""))))))
        if "current_district_id" not in clean_row:
            clean_row["current_district_id"] = str(row.get("district_id", ""))
        if "current_district_name" not in clean_row:
            clean_row["current_district_name"] = str(row.get("district_name", ""))
        if "mandal_area_sqkm" not in clean_row:
            clean_row["mandal_area_sqkm"] = float(row.get("area_sqkm", 0.0))
        if "multi_hazard_exposure_index" not in clean_row:
            clean_row["multi_hazard_exposure_index"] = float(row.get("c1_hazard_exposure", row.get("composite_hazard_index", row.get("composite_hazard_score", 0.0))))

        return MandalHazardExposureItem(**clean_row)

    def get_summary(self, state_id: Optional[str] = None, state: Optional[str] = None) -> HazardSummaryResponse:
        data = self._load_data(state_id or state or "andhra_pradesh")
        df = data["exposure_df"]

        idx_col = "multi_hazard_exposure_index" if "multi_hazard_exposure_index" in df.columns else ("c1_hazard_exposure" if "c1_hazard_exposure" in df.columns else "composite_hazard_score")
        indices = df[idx_col]
        high_count = int((indices >= 0.50).sum())
        mod_count = int(((indices >= 0.25) & (indices < 0.50)).sum())
        low_count = int((indices < 0.25).sum())

        id_col = "mandal_id" if "mandal_id" in df.columns else ("block_id" if "block_id" in df.columns else "circle_id")
        name_col = "mandal_name" if "mandal_name" in df.columns else ("block_name" if "block_name" in df.columns else "circle_name")
        dist_col = "current_district_name" if "current_district_name" in df.columns else "district_name"

        top_df = df.sort_values(idx_col, ascending=False).head(5)
        top_5 = []
        for _, r in top_df.iterrows():
            top_5.append({
                "mandal_id": str(r.get(id_col, "")),
                "mandal_name": str(r.get(name_col, "")),
                "current_district_name": str(r.get(dist_col, "")),
                "multi_hazard_exposure_index": float(r.get(idx_col, 0.0))
            })

        return HazardSummaryResponse(
            total_mandals=len(df),
            mean_exposure_index=round(float(indices.mean()), 4),
            min_exposure_index=round(float(indices.min()), 4),
            max_exposure_index=round(float(indices.max()), 4),
            exposure_distribution={
                "High Hazard (>= 0.50)": high_count,
                "Moderate Hazard (0.25 - 0.50)": mod_count,
                "Low Hazard (< 0.25)": low_count,
            },
            top_exposed_mandals=top_5,
            storm_surge_included=data["surge_included"],
            storm_surge_exclusion_reason=data["surge_reason"],
            methodology_note="Calculated using verified open hazard datasets: JRC Global Surface Water 30m, NOAA IBTrACS Bay of Bengal tracks, BMTPC IS 875 wind speeds, and CGIAR SRTM 90m slope."
        )

    def get_geojson(self, district_id: Optional[str] = None, state_id: Optional[str] = None, state: Optional[str] = None) -> Dict[str, Any]:
        data = self._load_data(state_id or state or "andhra_pradesh")
        if data["geojson"] is None:
            geojson_path = data["geojson_path"]
            if not geojson_path or not geojson_path.exists():
                raise FileNotFoundError(f"Hazard GeoJSON not found at {geojson_path}")
            with open(geojson_path, "r", encoding="utf-8") as f:
                data["geojson"] = json.load(f)

        if not district_id:
            return data["geojson"]

        target_did = district_id.strip().lower()
        filtered = [
            feat for feat in data["geojson"].get("features", [])
            if str(feat.get("properties", {}).get("current_district_id", feat.get("properties", {}).get("district_id", ""))).lower() == target_did
        ]
        return {
            "type": "FeatureCollection",
            "features": filtered
        }

hazard_service = HazardService()

