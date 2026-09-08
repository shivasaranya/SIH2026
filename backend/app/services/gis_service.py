import json
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
from app.core.config import settings
from app.core.state_config import resolve_state_config

class GISService:
    def __init__(self):
        self._cache_districts: Dict[str, Dict[str, Any]] = {}
        self._cache_mandals: Dict[str, Dict[str, Any]] = {}

    def get_districts_geojson(self, state: Optional[str] = None) -> Dict[str, Any]:
        cfg = resolve_state_config(state)
        state_key = cfg.state_id
        
        if state_key not in self._cache_districts:
            dist_path = settings.PROCESSED_ADMIN_DIR / cfg.districts_geojson_filename
            if not dist_path.exists():
                raise FileNotFoundError(f"Districts GeoJSON not found at {dist_path}")
            with open(dist_path, "r", encoding="utf-8") as f:
                self._cache_districts[state_key] = json.load(f)
                
        return self._cache_districts[state_key]

    def get_mandals_geojson(self, district_id: Optional[str] = None, state: Optional[str] = None) -> Dict[str, Any]:
        cfg = resolve_state_config(state)
        state_key = cfg.state_id
        
        if state_key not in self._cache_mandals:
            if state_key == "ap":
                mand_path = settings.RAW_ADMIN_DIR / "AndhraPradesh_Mandals.geojson"
                fallback_path = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure" / "ap_mandal_multi_hazard_exposure.geojson"
                if not mand_path.exists() and fallback_path.exists():
                    with open(fallback_path, "r", encoding="utf-8") as f:
                        self._cache_mandals[state_key] = json.load(f)
                elif mand_path.exists():
                    with open(mand_path, "r", encoding="utf-8") as f:
                        raw_mandals = json.load(f)

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

                    self._cache_mandals[state_key] = {
                        "type": "FeatureCollection",
                        "features": enriched_features
                    }
                else:
                    raise FileNotFoundError(f"Mandals GeoJSON not found at {mand_path} or {fallback_path}")
            else:
                # Other states (e.g. Gujarat)
                mand_path = settings.PROCESSED_ADMIN_DIR / cfg.admin_units_geojson_filename
                if not mand_path.exists():
                    fallback_path = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure" / cfg.hazard_geojson_filename
                    if fallback_path.exists():
                        mand_path = fallback_path
                    else:
                        raise FileNotFoundError(f"Admin units GeoJSON not found at {mand_path}")
                with open(mand_path, "r", encoding="utf-8") as f:
                    self._cache_mandals[state_key] = json.load(f)

        full_geojson = self._cache_mandals[state_key]
        if district_id:
            did_clean = district_id.strip().lower()
            filtered_features = [
                f for f in full_geojson.get("features", [])
                if str(f.get("properties", {}).get("current_district_id", "")).lower() == did_clean
            ]
            return {
                "type": "FeatureCollection",
                "features": filtered_features
            }

        return full_geojson

gis_service = GISService()
