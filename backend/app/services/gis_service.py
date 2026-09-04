import json
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
from app.core.config import settings

class GISService:
    def __init__(self):
        self._districts_geojson: Optional[Dict[str, Any]] = None
        self._mandals_geojson: Optional[Dict[str, Any]] = None
        self._mandal_to_current_dist: Optional[Dict[str, Dict[str, str]]] = None

    def _load_crosswalk_mapping(self):
        if self._mandal_to_current_dist is not None:
            return

        cw_path = settings.PROCESSED_CENSUS_DIR / "ap_administrative_crosswalk.csv"
        if not cw_path.exists():
            raise FileNotFoundError(f"Administrative crosswalk not found at {cw_path}")

        cw_df = pd.read_csv(cw_path)
        # Build mapping: (legacy_district_name.upper(), mandal_name.upper()) -> {current_district_id, current_district_name}
        mapping = {}
        for _, row in cw_df[['legacy_district_name', 'mandal_name', 'current_district_code', 'current_district_name']].drop_duplicates().iterrows():
            ld = str(row['legacy_district_name']).strip().upper()
            mn = str(row['mandal_name']).strip().upper()
            mapping[(ld, mn)] = {
                "current_district_id": str(row['current_district_code']),
                "current_district_name": str(row['current_district_name'])
            }
        self._mandal_to_current_dist = mapping

    def get_districts_geojson(self) -> Dict[str, Any]:
        if self._districts_geojson is None:
            dist_path = settings.PROCESSED_ADMIN_DIR / "andhra_pradesh_26_districts.geojson"
            if not dist_path.exists():
                raise FileNotFoundError(f"Districts GeoJSON not found at {dist_path}")
            with open(dist_path, "r", encoding="utf-8") as f:
                self._districts_geojson = json.load(f)
        return self._districts_geojson

    def get_mandals_geojson(self, district_id: Optional[str] = None) -> Dict[str, Any]:
        if self._mandals_geojson is None:
            mand_path = settings.RAW_ADMIN_DIR / "AndhraPradesh_Mandals.geojson"
            if not mand_path.exists():
                fallback_path = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure" / "ap_mandal_multi_hazard_exposure.geojson"
                if fallback_path.exists():
                    with open(fallback_path, "r", encoding="utf-8") as f:
                        self._mandals_geojson = json.load(f)
                else:
                    raise FileNotFoundError(f"Mandals GeoJSON not found at {mand_path} or {fallback_path}")
            else:
                with open(mand_path, "r", encoding="utf-8") as f:
                    raw_mandals = json.load(f)

                # Preload crosswalk
                cw_path = settings.PROCESSED_CENSUS_DIR / "ap_village_demographics.csv"
                demo_df = pd.read_csv(cw_path)
                # Create a lookup for mandal parent
                m_lookup = {}
                for _, r in demo_df[['mandal_name', 'current_district_code', 'current_district_name', 'legacy_district_name']].drop_duplicates().iterrows():
                    m_lookup[str(r['mandal_name']).strip().upper()] = (str(r['current_district_code']), str(r['current_district_name']))

                enriched_features = []
                for feat in raw_mandals.get("features", []):
                    props = dict(feat.get("properties", {}))
                    raw_mname = str(props.get("DMNAME", "")).strip()
                    # Clean trailing digits from shapefile label if any
                    clean_mname = raw_mname.rstrip("1234567890").strip().upper()

                    curr_id = ""
                    curr_name = ""
                    if raw_mname.upper() in m_lookup:
                        curr_id, curr_name = m_lookup[raw_mname.upper()]
                    elif clean_mname in m_lookup:
                        curr_id, curr_name = m_lookup[clean_mname]

                    # Update feature properties with verified modern 26-district hierarchy
                    props["mandal_name"] = raw_mname
                    props["current_district_id"] = curr_id
                    props["current_district_name"] = curr_name

                    enriched_feat = dict(feat)
                    enriched_feat["properties"] = props
                    enriched_features.append(enriched_feat)

                self._mandals_geojson = {
                    "type": "FeatureCollection",
                    "features": enriched_features
                }

        if district_id:
            did_clean = district_id.strip().lower()
            filtered_features = [
                f for f in self._mandals_geojson["features"]
                if f["properties"].get("current_district_id") == did_clean
            ]
            return {
                "type": "FeatureCollection",
                "features": filtered_features
            }

        return self._mandals_geojson

gis_service = GISService()
