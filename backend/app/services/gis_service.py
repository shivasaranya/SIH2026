import json
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
from app.core.config import settings
from app.core.state_registry import state_registry, get_state_key

class GISService:
    def __init__(self):
        self._cached_districts: Dict[str, Dict[str, Any]] = {}
        self._cached_mandals: Dict[str, Dict[str, Any]] = {}

    def get_districts_geojson(self, state_id: str = "andhra_pradesh") -> Dict[str, Any]:
        key = get_state_key(state_id)
        if key in self._cached_districts:
            return self._cached_districts[key]

        state_meta = state_registry.get_state(key)
        dist_path = state_meta.districts_geojson

        if not dist_path or not dist_path.exists():
            raise FileNotFoundError(f"Districts GeoJSON for {key} not found at {dist_path}")

        with open(dist_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self._cached_districts[key] = data
        return data

    def get_mandals_geojson(self, district_id: Optional[str] = None, state_id: str = "andhra_pradesh") -> Dict[str, Any]:
        key = get_state_key(state_id)

        if key not in self._cached_mandals:
            state_meta = state_registry.get_state(key)

            if key == "andhra_pradesh":
                mand_path = settings.RAW_ADMIN_DIR / "AndhraPradesh_Mandals.geojson"
                if not mand_path.exists():
                    fallback_path = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure" / "ap_mandal_multi_hazard_exposure.geojson"
                    if fallback_path.exists():
                        with open(fallback_path, "r", encoding="utf-8") as f:
                            self._cached_mandals[key] = json.load(f)
                    else:
                        raise FileNotFoundError(f"Mandals GeoJSON not found at {mand_path} or {fallback_path}")
                else:
                    with open(mand_path, "r", encoding="utf-8") as f:
                        raw_mandals = json.load(f)

                    # Preload crosswalk
                    cw_path = settings.PROCESSED_CENSUS_DIR / "ap_village_demographics.csv"
                    demo_df = pd.read_csv(cw_path)
                    m_lookup = {}
                    for _, r in demo_df[['mandal_name', 'current_district_code', 'current_district_name', 'legacy_district_name']].drop_duplicates().iterrows():
                        m_lookup[str(r['mandal_name']).strip().upper()] = (str(r['current_district_code']), str(r['current_district_name']))

                    enriched_features = []
                    for feat in raw_mandals.get("features", []):
                        props = dict(feat.get("properties", {}))
                        raw_mname = str(props.get("DMNAME", "")).strip()
                        clean_mname = raw_mname.rstrip("1234567890").strip().upper()

                        curr_id = ""
                        curr_name = ""
                        if raw_mname.upper() in m_lookup:
                            curr_id, curr_name = m_lookup[raw_mname.upper()]
                        elif clean_mname in m_lookup:
                            curr_id, curr_name = m_lookup[clean_mname]

                        props["mandal_name"] = raw_mname
                        props["current_district_id"] = curr_id
                        props["current_district_name"] = curr_name

                        enriched_feat = dict(feat)
                        enriched_feat["properties"] = props
                        enriched_features.append(enriched_feat)

                    self._cached_mandals[key] = {
                        "type": "FeatureCollection",
                        "features": enriched_features
                    }

            else:
                units_path = state_meta.admin_units_geojson
                if not units_path or not units_path.exists():
                    # Fallback to relocation priority geojson
                    units_path = state_meta.relocation_geojson
                if not units_path or not units_path.exists():
                    raise FileNotFoundError(f"Admin units GeoJSON for {key} not found at {units_path}")

                with open(units_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

        full_geojson = self._cached_mandals[key]

        if district_id:
            did_clean = district_id.strip().lower()
            filtered = [
                f for f in full_geojson.get("features", [])
                if str(f.get("properties", {}).get("current_district_id", "")).lower() == did_clean or
                   str(f.get("properties", {}).get("district_id", "")).lower() == did_clean or
                   str(f.get("properties", {}).get("district_code", "")).lower() == did_clean or
                   str(f.get("properties", {}).get("current_district_code", "")).lower() == did_clean
            ]
            return {"type": "FeatureCollection", "features": filtered}

        return full_geojson

gis_service = GISService()
