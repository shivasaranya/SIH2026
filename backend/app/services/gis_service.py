import json
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
from app.core.config import settings

def resolve_state_key(state_id: Optional[str]) -> str:
    if not state_id:
        return "andhra_pradesh"
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    if clean in ["odisha", "od", "or", "orissa"]:
        return "odisha"
    if clean in ["west_bengal", "wb", "westbengal", "bengal"]:
        return "west_bengal"
    if clean in ["bihar", "br"]:
        return "bihar"
    if clean in ["assam", "as"]:
        return "assam"
    if clean in ["tamil_nadu", "tn", "tamilnadu"]:
        return "tamil_nadu"
    if clean in ["uttar_pradesh", "up", "uttarpradesh"]:
        return "uttar_pradesh"
    if clean in ["uttarakhand", "uk", "uttaranchal"]:
        return "uttarakhand"
    if clean in ["sikkim", "sk"]:
        return "sikkim"
    if clean in ["arunachal_pradesh", "arunachal", "ar"]:
        return "arunachal_pradesh"
    if clean in ["nagaland", "nl"]:
        return "nagaland"
    if clean in ["meghalaya", "ml"]:
        return "meghalaya"
    return "andhra_pradesh"

class GISService:
    def __init__(self):
        self._districts_geojson_cache: Dict[str, Dict[str, Any]] = {}
        self._mandals_geojson_cache: Dict[str, Dict[str, Any]] = {}

    def get_districts_geojson(self, state_id: str = "andhra_pradesh") -> Dict[str, Any]:
        key = resolve_state_key(state_id)
        if key in self._districts_geojson_cache:
            return self._districts_geojson_cache[key]

        if key == "odisha":
            dist_path = settings.PROCESSED_ADMIN_DIR / "odisha_30_districts.geojson"
            if not dist_path.exists():
                raise FileNotFoundError(f"Odisha districts GeoJSON not found at {dist_path}")
            with open(dist_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._districts_geojson_cache[key] = data
            return data

        if key == "west_bengal":
            dist_path = settings.PROCESSED_ADMIN_DIR / "west_bengal_23_districts.geojson"
            if not dist_path.exists():
                raise FileNotFoundError(f"West Bengal districts GeoJSON not found at {dist_path}")
            with open(dist_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._districts_geojson_cache[key] = data
            return data

        if key == "bihar":
            dist_path = settings.PROCESSED_ADMIN_DIR / "bihar_38_districts.geojson"
            if not dist_path.exists():
                raise FileNotFoundError(f"Bihar districts GeoJSON not found at {dist_path}")
            with open(dist_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._districts_geojson_cache[key] = data
            return data

        if key == "assam":
            dist_path = settings.PROCESSED_ADMIN_DIR / "assam_33_districts.geojson"
            if not dist_path.exists():
                raise FileNotFoundError(f"Assam districts GeoJSON not found at {dist_path}")
            with open(dist_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._districts_geojson_cache[key] = data
            return data

        if key == "tamil_nadu":
            dist_path = settings.PROCESSED_ADMIN_DIR / "tamil_nadu_38_districts.geojson"
            if not dist_path.exists():
                raise FileNotFoundError(f"Tamil Nadu districts GeoJSON not found at {dist_path}")
            with open(dist_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._districts_geojson_cache[key] = data
            return data

        if key == "uttar_pradesh":
            dist_path = settings.PROCESSED_ADMIN_DIR / "uttar_pradesh_75_districts.geojson"
            if not dist_path.exists():
                raise FileNotFoundError(f"Uttar Pradesh districts GeoJSON not found at {dist_path}")
            with open(dist_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._districts_geojson_cache[key] = data
            return data

        if key == "uttarakhand":
            dist_path = settings.PROCESSED_ADMIN_DIR / "uttarakhand_13_districts.geojson"
            if not dist_path.exists():
                raise FileNotFoundError(f"Uttarakhand districts GeoJSON not found at {dist_path}")
            with open(dist_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._districts_geojson_cache[key] = data
            return data

        if key == "sikkim":
            dist_path = settings.PROCESSED_ADMIN_DIR / "sikkim_6_districts.geojson"
            if not dist_path.exists():
                raise FileNotFoundError(f"Sikkim districts GeoJSON not found at {dist_path}")
            with open(dist_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._districts_geojson_cache[key] = data
            return data
        if key == "arunachal_pradesh":
            dist_path = settings.PROCESSED_ADMIN_DIR / "arunachal_pradesh_25_districts.geojson"
            if not dist_path.exists():
                raise FileNotFoundError(f"Arunachal Pradesh districts GeoJSON not found at {dist_path}")
            with open(dist_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._districts_geojson_cache[key] = data
            return data

        if key == "nagaland":
            dist_path = settings.PROCESSED_ADMIN_DIR / "nagaland_11_districts.geojson"
            if not dist_path.exists():
                raise FileNotFoundError(f"Nagaland districts GeoJSON not found at {dist_path}")
            with open(dist_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._districts_geojson_cache[key] = data
            return data

        if key == "meghalaya":
            dist_path = settings.PROCESSED_ADMIN_DIR / "meghalaya_11_districts.geojson"
            if not dist_path.exists():
                raise FileNotFoundError(f"Meghalaya districts GeoJSON not found at {dist_path}")
            with open(dist_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._districts_geojson_cache[key] = data
            return data

        # Default: Andhra Pradesh
        dist_path = settings.PROCESSED_ADMIN_DIR / "andhra_pradesh_26_districts.geojson"
        if not dist_path.exists():
            raise FileNotFoundError(f"Districts GeoJSON not found at {dist_path}")
        with open(dist_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self._districts_geojson_cache[key] = data
        return data

    def get_mandals_geojson(self, district_id: Optional[str] = None, state_id: str = "andhra_pradesh") -> Dict[str, Any]:
        key = resolve_state_key(state_id)

        if key not in self._mandals_geojson_cache:
            if key == "odisha":
                blocks_path = settings.PROCESSED_ADMIN_DIR / "odisha_blocks.geojson"
                if not blocks_path.exists():
                    blocks_path = settings.DATA_DIR / "processed" / "relocation" / "od_block_relocation_priority.geojson"
                if not blocks_path.exists():
                    raise FileNotFoundError(f"Odisha blocks GeoJSON not found at {blocks_path}")
                with open(blocks_path, "r", encoding="utf-8") as f:
                    self._mandals_geojson_cache[key] = json.load(f)

            elif key == "west_bengal":
                blocks_path = settings.PROCESSED_ADMIN_DIR / "west_bengal_blocks.geojson"
                if not blocks_path.exists():
                    blocks_path = settings.DATA_DIR / "processed" / "relocation" / "wb_block_relocation_priority.geojson"
                if not blocks_path.exists():
                    raise FileNotFoundError(f"West Bengal blocks GeoJSON not found at {blocks_path}")
                with open(blocks_path, "r", encoding="utf-8") as f:
                    self._mandals_geojson_cache[key] = json.load(f)

            elif key == "bihar":
                blocks_path = settings.PROCESSED_ADMIN_DIR / "bihar_blocks.geojson"
                if not blocks_path.exists():
                    blocks_path = settings.DATA_DIR / "processed" / "relocation" / "br_block_relocation_priority.geojson"
                if not blocks_path.exists():
                    raise FileNotFoundError(f"Bihar blocks GeoJSON not found at {blocks_path}")
                with open(blocks_path, "r", encoding="utf-8") as f:
                    self._mandals_geojson_cache[key] = json.load(f)

            elif key == "assam":
                units_path = settings.PROCESSED_ADMIN_DIR / "assam_revenue_circles.geojson"
                if not units_path.exists():
                    units_path = settings.DATA_DIR / "processed" / "relocation" / "as_circle_relocation_priority.geojson"
                if not units_path.exists():
                    raise FileNotFoundError(f"Assam revenue circles GeoJSON not found at {units_path}")
                with open(units_path, "r", encoding="utf-8") as f:
                    self._mandals_geojson_cache[key] = json.load(f)

            elif key == "tamil_nadu":
                taluks_path = settings.PROCESSED_ADMIN_DIR / "tamil_nadu_taluks.geojson"
                if not taluks_path.exists():
                    taluks_path = settings.DATA_DIR / "processed" / "relocation" / "tn_taluk_relocation_priority.geojson"
                if not taluks_path.exists():
                    raise FileNotFoundError(f"Tamil Nadu taluks GeoJSON not found at {taluks_path}")
                with open(taluks_path, "r", encoding="utf-8") as f:
                    self._mandals_geojson_cache[key] = json.load(f)

            elif key == "uttar_pradesh":
                tehsils_path = settings.PROCESSED_ADMIN_DIR / "uttar_pradesh_tehsils.geojson"
                if not tehsils_path.exists():
                    tehsils_path = settings.DATA_DIR / "processed" / "relocation" / "up_tehsil_relocation_priority.geojson"
                if not tehsils_path.exists():
                    raise FileNotFoundError(f"Uttar Pradesh tehsils GeoJSON not found at {tehsils_path}")
                with open(tehsils_path, "r", encoding="utf-8") as f:
                    self._mandals_geojson_cache[key] = json.load(f)

            elif key == "uttarakhand":
                tehsils_path = settings.PROCESSED_ADMIN_DIR / "uttarakhand_tehsils.geojson"
                if not tehsils_path.exists():
                    tehsils_path = settings.DATA_DIR / "processed" / "relocation" / "uk_tehsil_relocation_priority.geojson"
                if not tehsils_path.exists():
                    raise FileNotFoundError(f"Uttarakhand tehsils GeoJSON not found at {tehsils_path}")
                with open(tehsils_path, "r", encoding="utf-8") as f:
                    self._mandals_geojson_cache[key] = json.load(f)

            elif key == "sikkim":
                subdiv_path = settings.PROCESSED_ADMIN_DIR / "sikkim_subdivisions.geojson"
                if not subdiv_path.exists():
                    subdiv_path = settings.DATA_DIR / "processed" / "relocation" / "sk_subdivision_relocation_priority.geojson"
                if not subdiv_path.exists():
                    raise FileNotFoundError(f"Sikkim sub-divisions GeoJSON not found at {subdiv_path}")
                with open(subdiv_path, "r", encoding="utf-8") as f:
                    self._mandals_geojson_cache[key] = json.load(f)

            elif key == "arunachal_pradesh":
                circle_path = settings.PROCESSED_ADMIN_DIR / "arunachal_pradesh_circles.geojson"
                if not circle_path.exists():
                    circle_path = settings.DATA_DIR / "processed" / "relocation" / "ar_circle_relocation_priority.geojson"
                if not circle_path.exists():
                    raise FileNotFoundError(f"Arunachal Pradesh circles GeoJSON not found at {circle_path}")
                with open(circle_path, "r", encoding="utf-8") as f:
                    self._mandals_geojson_cache[key] = json.load(f)

            elif key == "nagaland":
                circle_path = settings.PROCESSED_ADMIN_DIR / "nagaland_circles.geojson"
                if not circle_path.exists():
                    circle_path = settings.DATA_DIR / "processed" / "relocation" / "nl_circle_relocation_priority.geojson"
                if not circle_path.exists():
                    raise FileNotFoundError(f"Nagaland circles GeoJSON not found at {circle_path}")
                with open(circle_path, "r", encoding="utf-8") as f:
                    self._mandals_geojson_cache[key] = json.load(f)

            elif key == "meghalaya":
                blocks_path = settings.PROCESSED_ADMIN_DIR / "meghalaya_blocks.geojson"
                if not blocks_path.exists():
                    blocks_path = settings.DATA_DIR / "processed" / "relocation" / "ml_block_relocation_priority.geojson"
                if not blocks_path.exists():
                    raise FileNotFoundError(f"Meghalaya blocks GeoJSON not found at {blocks_path}")
                with open(blocks_path, "r", encoding="utf-8") as f:
                    self._mandals_geojson_cache[key] = json.load(f)

            else:
                # Default: Andhra Pradesh
                mand_path = settings.RAW_ADMIN_DIR / "AndhraPradesh_Mandals.geojson"
                if not mand_path.exists():
                    fallback_path = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure" / "ap_mandal_multi_hazard_exposure.geojson"
                    if fallback_path.exists():
                        with open(fallback_path, "r", encoding="utf-8") as f:
                            self._mandals_geojson_cache[key] = json.load(f)
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

                    self._mandals_geojson_cache[key] = {
                        "type": "FeatureCollection",
                        "features": enriched_features
                    }

        state_geojson = self._mandals_geojson_cache[key]

        if district_id:
            did_clean = district_id.strip().lower()
            filtered_features = [
                f for f in state_geojson["features"]
                if str(f.get("properties", {}).get("current_district_id", "")).lower() == did_clean or
                   str(f.get("properties", {}).get("district_id", "")).lower() == did_clean
            ]
            return {
                "type": "FeatureCollection",
                "features": filtered_features
            }

        return state_geojson

gis_service = GISService()
