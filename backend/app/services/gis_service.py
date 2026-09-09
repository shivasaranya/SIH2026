import json
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
from app.core.config import settings
from app.core.state_registry import state_registry, get_state_key

def resolve_state_key(state_id: Optional[str]) -> str:
    return get_state_key(state_id)


class GISService:
    def __init__(self):
        self._cached_districts: Dict[str, Dict[str, Any]] = {}
        self._cached_mandals: Dict[str, Dict[str, Any]] = {}

    def get_districts_geojson(self, state_id: Optional[str] = "andhra_pradesh", state: Optional[str] = None) -> Dict[str, Any]:
        key = resolve_state_key(state_id or state)
        if key in self._cached_districts:
            return self._cached_districts[key]

        DISTRICT_FILES = {
            "andhra_pradesh": "andhra_pradesh_26_districts.geojson",
            "odisha": "odisha_30_districts.geojson",
            "west_bengal": "west_bengal_23_districts.geojson",
            "bihar": "bihar_38_districts.geojson",
            "assam": "assam_33_districts.geojson",
            "tamil_nadu": "tamil_nadu_38_districts.geojson",
            "uttar_pradesh": "uttar_pradesh_75_districts.geojson",
            "uttarakhand": "uttarakhand_13_districts.geojson",
            "sikkim": "sikkim_6_districts.geojson",
            "arunachal_pradesh": "arunachal_pradesh_25_districts.geojson",
            "nagaland": "nagaland_11_districts.geojson",
            "meghalaya": "meghalaya_11_districts.geojson",
            "gujarat": "gujarat_33_districts.geojson",
            "kerala": "kerala_14_districts.geojson",
            "maharashtra": "maharashtra_35_districts.geojson",
            "haryana": "haryana_22_districts.geojson",
            "punjab": "punjab_23_districts.geojson",
            "chhattisgarh": "chhattisgarh_33_districts.geojson",
            "jammu_kashmir": "jammu_kashmir_20_districts.geojson",
            "jammu_and_kashmir": "jammu_and_kashmir_districts.geojson",
            "madhya_pradesh": "madhya_pradesh_districts.geojson",
            "mizoram": "mizoram_11_districts.geojson",
            "himachal_pradesh": "himachal_pradesh_12_districts.geojson",
            "rajasthan": "rajasthan_33_districts.geojson",
            "karnataka": "karnataka_districts.geojson",
            "telangana": "telangana_districts.geojson",
            "jharkhand": "jharkhand_districts.geojson",
            "goa": "goa_districts.geojson",
            "delhi": "delhi_districts.geojson",
            "tripura": "tripura_districts.geojson",
            "ladakh": "ladakh_districts.geojson",
            "manipur": "manipur_districts.geojson",
        }

        dist_path = None
        state_meta = state_registry.get_state(key)
        if state_meta and state_meta.districts_geojson and state_meta.districts_geojson.exists():
            dist_path = state_meta.districts_geojson
        else:
            filename = DISTRICT_FILES.get(key, f"{key}_districts.geojson")
            dist_path = settings.PROCESSED_ADMIN_DIR / filename
            if not dist_path.exists():
                dist_path = settings.PROCESSED_ADMIN_DIR / f"{key}.geojson"

        if not dist_path or not dist_path.exists():
            dist_path = settings.PROCESSED_ADMIN_DIR / "andhra_pradesh_26_districts.geojson"

        with open(dist_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self._cached_districts[key] = data
        return data

    def get_mandals_geojson(self, district_id: Optional[str] = None, state_id: Optional[str] = "andhra_pradesh", state: Optional[str] = None) -> Dict[str, Any]:
        key = resolve_state_key(state_id or state)

        if key not in self._cached_mandals:
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

            elif key == "mizoram":
                blocks_path = settings.PROCESSED_ADMIN_DIR / "mizoram_rd_blocks.geojson"
                if not blocks_path.exists():
                    blocks_path = settings.DATA_DIR / "processed" / "relocation" / "mizoram_subdistrict_relocation_priority.geojson"
                if not blocks_path.exists():
                    raise FileNotFoundError(f"Mizoram RD Blocks GeoJSON not found at {blocks_path}")
                with open(blocks_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "jammu_kashmir":
                tehsils_path = settings.PROCESSED_ADMIN_DIR / "jammu_kashmir_tehsils.geojson"
                if not tehsils_path.exists():
                    tehsils_path = settings.DATA_DIR / "processed" / "relocation" / "jk_tehsil_relocation_priority.geojson"
                if not tehsils_path.exists():
                    raise FileNotFoundError(f"Jammu and Kashmir tehsils GeoJSON not found at {tehsils_path}")
                with open(tehsils_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "madhya_pradesh":
                tehsils_path = settings.PROCESSED_ADMIN_DIR / "madhya_pradesh_tehsils.geojson"
                if not tehsils_path.exists():
                    tehsils_path = settings.DATA_DIR / "processed" / "relocation" / "mp_tehsil_relocation_priority.geojson"
                if not tehsils_path.exists():
                    raise FileNotFoundError(f"Madhya Pradesh tehsils GeoJSON not found at {tehsils_path}")
                with open(tehsils_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "himachal_pradesh":
                tehsils_path = settings.PROCESSED_ADMIN_DIR / "himachal_pradesh_tehsils.geojson"
                if not tehsils_path.exists():
                    tehsils_path = settings.DATA_DIR / "processed" / "relocation" / "hp_tehsil_relocation_priority.geojson"
                if not tehsils_path.exists():
                    raise FileNotFoundError(f"Himachal Pradesh tehsils GeoJSON not found at {tehsils_path}")
                with open(tehsils_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "odisha":
                blocks_path = settings.PROCESSED_ADMIN_DIR / "odisha_blocks.geojson"
                if not blocks_path.exists():
                    blocks_path = settings.DATA_DIR / "processed" / "relocation" / "od_block_relocation_priority.geojson"
                if not blocks_path.exists():
                    raise FileNotFoundError(f"Odisha blocks GeoJSON not found at {blocks_path}")
                with open(blocks_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "west_bengal":
                blocks_path = settings.PROCESSED_ADMIN_DIR / "west_bengal_blocks.geojson"
                if not blocks_path.exists():
                    blocks_path = settings.DATA_DIR / "processed" / "relocation" / "wb_block_relocation_priority.geojson"
                if not blocks_path.exists():
                    raise FileNotFoundError(f"West Bengal blocks GeoJSON not found at {blocks_path}")
                with open(blocks_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "bihar":
                blocks_path = settings.PROCESSED_ADMIN_DIR / "bihar_blocks.geojson"
                if not blocks_path.exists():
                    blocks_path = settings.DATA_DIR / "processed" / "relocation" / "br_block_relocation_priority.geojson"
                if not blocks_path.exists():
                    raise FileNotFoundError(f"Bihar blocks GeoJSON not found at {blocks_path}")
                with open(blocks_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "assam":
                units_path = settings.PROCESSED_ADMIN_DIR / "assam_revenue_circles.geojson"
                if not units_path.exists():
                    units_path = settings.DATA_DIR / "processed" / "relocation" / "as_circle_relocation_priority.geojson"
                if not units_path.exists():
                    raise FileNotFoundError(f"Assam revenue circles GeoJSON not found at {units_path}")
                with open(units_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "tamil_nadu":
                taluks_path = settings.PROCESSED_ADMIN_DIR / "tamil_nadu_taluks.geojson"
                if not taluks_path.exists():
                    taluks_path = settings.DATA_DIR / "processed" / "relocation" / "tn_taluk_relocation_priority.geojson"
                if not taluks_path.exists():
                    raise FileNotFoundError(f"Tamil Nadu taluks GeoJSON not found at {taluks_path}")
                with open(taluks_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "uttar_pradesh":
                tehsils_path = settings.PROCESSED_ADMIN_DIR / "uttar_pradesh_tehsils.geojson"
                if not tehsils_path.exists():
                    tehsils_path = settings.DATA_DIR / "processed" / "relocation" / "up_tehsil_relocation_priority.geojson"
                if not tehsils_path.exists():
                    raise FileNotFoundError(f"Uttar Pradesh tehsils GeoJSON not found at {tehsils_path}")
                with open(tehsils_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "uttarakhand":
                tehsils_path = settings.PROCESSED_ADMIN_DIR / "uttarakhand_tehsils.geojson"
                if not tehsils_path.exists():
                    tehsils_path = settings.DATA_DIR / "processed" / "relocation" / "uk_tehsil_relocation_priority.geojson"
                if not tehsils_path.exists():
                    raise FileNotFoundError(f"Uttarakhand tehsils GeoJSON not found at {tehsils_path}")
                with open(tehsils_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "sikkim":
                subdiv_path = settings.PROCESSED_ADMIN_DIR / "sikkim_subdivisions.geojson"
                if not subdiv_path.exists():
                    subdiv_path = settings.DATA_DIR / "processed" / "relocation" / "sk_subdivision_relocation_priority.geojson"
                if not subdiv_path.exists():
                    raise FileNotFoundError(f"Sikkim sub-divisions GeoJSON not found at {subdiv_path}")
                with open(subdiv_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "arunachal_pradesh":
                circle_path = settings.PROCESSED_ADMIN_DIR / "arunachal_pradesh_circles.geojson"
                if not circle_path.exists():
                    circle_path = settings.DATA_DIR / "processed" / "relocation" / "ar_circle_relocation_priority.geojson"
                if not circle_path.exists():
                    raise FileNotFoundError(f"Arunachal Pradesh circles GeoJSON not found at {circle_path}")
                with open(circle_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "nagaland":
                circle_path = settings.PROCESSED_ADMIN_DIR / "nagaland_circles.geojson"
                if not circle_path.exists():
                    circle_path = settings.DATA_DIR / "processed" / "relocation" / "nl_circle_relocation_priority.geojson"
                if not circle_path.exists():
                    raise FileNotFoundError(f"Nagaland circles GeoJSON not found at {circle_path}")
                with open(circle_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "meghalaya":
                blocks_path = settings.PROCESSED_ADMIN_DIR / "meghalaya_blocks.geojson"
                if not blocks_path.exists():
                    blocks_path = settings.DATA_DIR / "processed" / "relocation" / "ml_block_relocation_priority.geojson"
                if not blocks_path.exists():
                    raise FileNotFoundError(f"Meghalaya blocks GeoJSON not found at {blocks_path}")
                with open(blocks_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "gujarat":
                mand_path = settings.PROCESSED_ADMIN_DIR / "gujarat_talukas.geojson"
                if not mand_path.exists():
                    mand_path = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure" / "gujarat_taluka_multi_hazard_exposure.geojson"
                if not mand_path.exists():
                    raise FileNotFoundError(f"Gujarat talukas GeoJSON not found at {mand_path}")
                with open(mand_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "kerala":
                mand_path = settings.PROCESSED_ADMIN_DIR / "kerala_taluks.geojson"
                if not mand_path.exists():
                    mand_path = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure" / "kerala_taluka_multi_hazard_exposure.geojson"
                if not mand_path.exists():
                    raise FileNotFoundError(f"Kerala taluks GeoJSON not found at {mand_path}")
                with open(mand_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "maharashtra":
                mand_path = settings.PROCESSED_ADMIN_DIR / "maharashtra_talukas.geojson"
                if not mand_path.exists():
                    mand_path = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure" / "maharashtra_taluka_multi_hazard_exposure.geojson"
                if not mand_path.exists():
                    raise FileNotFoundError(f"Maharashtra talukas GeoJSON not found at {mand_path}")
                with open(mand_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "haryana":
                mand_path = settings.PROCESSED_ADMIN_DIR / "haryana_tehsils.geojson"
                if not mand_path.exists():
                    mand_path = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure" / "haryana_taluka_multi_hazard_exposure.geojson"
                if not mand_path.exists():
                    raise FileNotFoundError(f"Haryana tehsils GeoJSON not found at {mand_path}")
                with open(mand_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "punjab":
                mand_path = settings.PROCESSED_ADMIN_DIR / "punjab_tehsils.geojson"
                if not mand_path.exists():
                    mand_path = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure" / "punjab_taluka_multi_hazard_exposure.geojson"
                if not mand_path.exists():
                    raise FileNotFoundError(f"Punjab tehsils GeoJSON not found at {mand_path}")
                with open(mand_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "chhattisgarh":
                mand_path = settings.PROCESSED_ADMIN_DIR / "chhattisgarh_tehsils.geojson"
                if not mand_path.exists():
                    mand_path = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure" / "chhattisgarh_taluka_multi_hazard_exposure.geojson"
                if not mand_path.exists():
                    raise FileNotFoundError(f"Chhattisgarh tehsils GeoJSON not found at {mand_path}")
                with open(mand_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif key == "rajasthan":
                mand_path = settings.PROCESSED_ADMIN_DIR / "rajasthan_tehsils.geojson"
                if not mand_path.exists():
                    mand_path = settings.DATA_DIR / "processed" / "relocation" / "rajasthan_tehsil_relocation_priority.geojson"
                with open(mand_path, "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            elif (settings.PROCESSED_ADMIN_DIR / f"{key}_units.geojson").exists():
                with open(settings.PROCESSED_ADMIN_DIR / f"{key}_units.geojson", "r", encoding="utf-8") as f:
                    self._cached_mandals[key] = json.load(f)

            else:
                # Default fallback using state_registry or district boundaries
                try:
                    state_meta = state_registry.get_state(key)
                    units_path = state_meta.admin_units_geojson or state_meta.relocation_geojson
                    if units_path and units_path.exists():
                        with open(units_path, "r", encoding="utf-8") as f:
                            self._cached_mandals[key] = json.load(f)
                    else:
                        self._cached_mandals[key] = self.get_districts_geojson(state_id=key)
                except Exception:
                    self._cached_mandals[key] = self.get_districts_geojson(state_id=key)

        full_geojson = self._cached_mandals[key]

        if district_id:
            did_clean = district_id.strip().lower()
            filtered = [
                f for f in full_geojson.get("features", [])
                if str(f.get("properties", {}).get("current_district_id", "")).lower() == did_clean or
                   str(f.get("properties", {}).get("district_id", "")).lower() == did_clean or
                   str(f.get("properties", {}).get("district_code", "")).lower() == did_clean or
                   str(f.get("properties", {}).get("current_district_code", "")).lower() == did_clean or
                   str(f.get("properties", {}).get("current_district_name", "")).lower() == did_clean or
                   str(f.get("properties", {}).get("district_name", "")).lower() == did_clean
            ]
            return {"type": "FeatureCollection", "features": filtered}

        return full_geojson

gis_service = GISService()
