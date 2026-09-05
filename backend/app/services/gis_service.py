import json
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
from app.core.config import settings

def is_tn(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["tamil_nadu", "tn", "tamilnadu"]

class GISService:
    def __init__(self):
        self._ap_districts_geojson: Optional[Dict[str, Any]] = None
        self._ap_mandals_geojson: Optional[Dict[str, Any]] = None
        self._tn_districts_geojson: Optional[Dict[str, Any]] = None
        self._tn_mandals_geojson: Optional[Dict[str, Any]] = None

    def get_districts_geojson(self, state_id: str = "andhra_pradesh") -> Dict[str, Any]:
        if is_tn(state_id):
            if self._tn_districts_geojson is None:
                dist_path = settings.PROCESSED_ADMIN_DIR / "tamil_nadu_38_districts.geojson"
                if not dist_path.exists():
                    raise FileNotFoundError(f"Tamil Nadu districts GeoJSON not found at {dist_path}")
                with open(dist_path, "r", encoding="utf-8") as f:
                    self._tn_districts_geojson = json.load(f)
            return self._tn_districts_geojson

        # Default: Andhra Pradesh
        if self._ap_districts_geojson is None:
            dist_path = settings.PROCESSED_ADMIN_DIR / "andhra_pradesh_26_districts.geojson"
            if not dist_path.exists():
                raise FileNotFoundError(f"Districts GeoJSON not found at {dist_path}")
            with open(dist_path, "r", encoding="utf-8") as f:
                self._ap_districts_geojson = json.load(f)
        return self._ap_districts_geojson

    def get_mandals_geojson(self, district_id: Optional[str] = None, state_id: str = "andhra_pradesh") -> Dict[str, Any]:
        if is_tn(state_id):
            if self._tn_mandals_geojson is None:
                taluks_path = settings.PROCESSED_ADMIN_DIR / "tamil_nadu_taluks.geojson"
                if not taluks_path.exists():
                    taluks_path = settings.DATA_DIR / "processed" / "relocation" / "tn_taluk_relocation_priority.geojson"
                if not taluks_path.exists():
                    raise FileNotFoundError(f"Tamil Nadu taluks GeoJSON not found at {taluks_path}")
                with open(taluks_path, "r", encoding="utf-8") as f:
                    self._tn_mandals_geojson = json.load(f)

            if district_id:
                did_clean = district_id.strip().lower()
                filtered = [
                    f for f in self._tn_mandals_geojson["features"]
                    if str(f.get("properties", {}).get("current_district_id", "")).lower() == did_clean or
                       str(f.get("properties", {}).get("district_id", "")).lower() == did_clean
                ]
                return {"type": "FeatureCollection", "features": filtered}
            return self._tn_mandals_geojson

        # Default: Andhra Pradesh
        if self._ap_mandals_geojson is None:
            mand_path = settings.RAW_ADMIN_DIR / "AndhraPradesh_Mandals.geojson"
            if not mand_path.exists():
                fallback_path = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure" / "ap_mandal_multi_hazard_exposure.geojson"
                if fallback_path.exists():
                    with open(fallback_path, "r", encoding="utf-8") as f:
                        self._ap_mandals_geojson = json.load(f)
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

                self._ap_mandals_geojson = {
                    "type": "FeatureCollection",
                    "features": enriched_features
                }

        if district_id:
            did_clean = district_id.strip().lower()
            filtered_features = [
                f for f in self._ap_mandals_geojson["features"]
                if str(f.get("properties", {}).get("current_district_id", "")).lower() == did_clean
            ]
            return {
                "type": "FeatureCollection",
                "features": filtered_features
            }

        return self._ap_mandals_geojson

gis_service = GISService()
