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

def is_tr(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["tripura", "tr"]

def is_tg(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["telangana", "tg", "ts"]

def is_rj(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["rajasthan", "rj"]

def is_mp(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["madhya_pradesh", "mp", "madhyapradesh"]

def is_ka(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["karnataka", "ka"]

def is_ga(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["goa", "ga"]

def is_mn(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["manipur", "mn"]

def is_jh(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["jharkhand", "jh"]

class GISService:
    def __init__(self):
        self._ap_districts_geojson: Optional[Dict[str, Any]] = None
        self._ap_mandals_geojson: Optional[Dict[str, Any]] = None
        self._tn_districts_geojson: Optional[Dict[str, Any]] = None
        self._tn_mandals_geojson: Optional[Dict[str, Any]] = None
        self._tr_districts_geojson: Optional[Dict[str, Any]] = None
        self._tr_mandals_geojson: Optional[Dict[str, Any]] = None
        self._tg_districts_geojson: Optional[Dict[str, Any]] = None
        self._tg_mandals_geojson: Optional[Dict[str, Any]] = None
        self._rj_districts_geojson: Optional[Dict[str, Any]] = None
        self._rj_mandals_geojson: Optional[Dict[str, Any]] = None
        self._mp_districts_geojson: Optional[Dict[str, Any]] = None
        self._mp_mandals_geojson: Optional[Dict[str, Any]] = None
        self._ka_districts_geojson: Optional[Dict[str, Any]] = None
        self._ka_mandals_geojson: Optional[Dict[str, Any]] = None
        self._ga_districts_geojson: Optional[Dict[str, Any]] = None
        self._ga_mandals_geojson: Optional[Dict[str, Any]] = None
        self._mn_districts_geojson: Optional[Dict[str, Any]] = None
        self._mn_mandals_geojson: Optional[Dict[str, Any]] = None
        self._jh_districts_geojson: Optional[Dict[str, Any]] = None
        self._jh_mandals_geojson: Optional[Dict[str, Any]] = None

    def get_districts_geojson(self, state_id: str = "andhra_pradesh") -> Dict[str, Any]:
        if is_jh(state_id):
            if self._jh_districts_geojson is None:
                dist_path = settings.PROCESSED_ADMIN_DIR / "jharkhand_24_districts.geojson"
                if not dist_path.exists():
                    raise FileNotFoundError(f"Jharkhand districts GeoJSON not found at {dist_path}")
                with open(dist_path, "r", encoding="utf-8") as f:
                    self._jh_districts_geojson = json.load(f)
            return self._jh_districts_geojson
        if is_mn(state_id):
            if self._mn_districts_geojson is None:
                dist_path = settings.PROCESSED_ADMIN_DIR / "manipur_16_districts.geojson"
                if not dist_path.exists():
                    raise FileNotFoundError(f"Manipur districts GeoJSON not found at {dist_path}")
                with open(dist_path, "r", encoding="utf-8") as f:
                    self._mn_districts_geojson = json.load(f)
            return self._mn_districts_geojson
        if is_ga(state_id):
            if self._ga_districts_geojson is None:
                dist_path = settings.PROCESSED_ADMIN_DIR / "goa_2_districts.geojson"
                if not dist_path.exists():
                    raise FileNotFoundError(f"Goa districts GeoJSON not found at {dist_path}")
                with open(dist_path, "r", encoding="utf-8") as f:
                    self._ga_districts_geojson = json.load(f)
            return self._ga_districts_geojson

        if is_ka(state_id):
            if self._ka_districts_geojson is None:
                dist_path = settings.PROCESSED_ADMIN_DIR / "karnataka_31_districts.geojson"
                if not dist_path.exists():
                    raise FileNotFoundError(f"Karnataka districts GeoJSON not found at {dist_path}")
                with open(dist_path, "r", encoding="utf-8") as f:
                    self._ka_districts_geojson = json.load(f)
            return self._ka_districts_geojson

        if is_mp(state_id):
            if self._mp_districts_geojson is None:
                dist_path = settings.PROCESSED_ADMIN_DIR / "madhya_pradesh_52_districts.geojson"
                if not dist_path.exists():
                    raise FileNotFoundError(f"MP districts GeoJSON not found at {dist_path}")
                with open(dist_path, "r", encoding="utf-8") as f:
                    self._mp_districts_geojson = json.load(f)
            return self._mp_districts_geojson

        if is_rj(state_id):
            if self._rj_districts_geojson is None:
                dist_path = settings.PROCESSED_ADMIN_DIR / "rajasthan_33_districts.geojson"
                if not dist_path.exists():
                    raise FileNotFoundError(f"Rajasthan districts GeoJSON not found at {dist_path}")
                with open(dist_path, "r", encoding="utf-8") as f:
                    self._rj_districts_geojson = json.load(f)
            return self._rj_districts_geojson

        if is_tg(state_id):
            if self._tg_districts_geojson is None:
                dist_path = settings.PROCESSED_ADMIN_DIR / "telangana_33_districts.geojson"
                if not dist_path.exists():
                    raise FileNotFoundError(f"Telangana districts GeoJSON not found at {dist_path}")
                with open(dist_path, "r", encoding="utf-8") as f:
                    self._tg_districts_geojson = json.load(f)
            return self._tg_districts_geojson

        if is_tr(state_id):
            if self._tr_districts_geojson is None:
                dist_path = settings.PROCESSED_ADMIN_DIR / "tripura_8_districts.geojson"
                if not dist_path.exists():
                    raise FileNotFoundError(f"Tripura districts GeoJSON not found at {dist_path}")
                with open(dist_path, "r", encoding="utf-8") as f:
                    self._tr_districts_geojson = json.load(f)
            return self._tr_districts_geojson

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
        if is_jh(state_id):
            if self._jh_mandals_geojson is None:
                mand_path = settings.PROCESSED_ADMIN_DIR / "jharkhand_blocks.geojson"
                if not mand_path.exists():
                    mand_path = settings.DATA_DIR / "processed" / "relocation" / "jh_blocks_relocation_priority.geojson"
                if not mand_path.exists():
                    raise FileNotFoundError(f"Jharkhand blocks GeoJSON not found at {mand_path}")
                with open(mand_path, "r", encoding="utf-8") as f:
                    self._jh_mandals_geojson = json.load(f)

            if district_id:
                did_clean = district_id.strip().lower().replace("-", "_").replace(" ", "_")
                filtered = [
                    f for f in self._jh_mandals_geojson["features"]
                    if str(f.get("properties", {}).get("current_district_id", "")).lower() == did_clean or
                       str(f.get("properties", {}).get("district_id", "")).lower() == did_clean or
                       str(f.get("properties", {}).get("current_district_name", "")).lower().replace(" ", "_") == did_clean or
                       str(f.get("properties", {}).get("district_name", "")).lower().replace(" ", "_") == did_clean
                ]
                return {"type": "FeatureCollection", "features": filtered}
            return self._jh_mandals_geojson

        if is_mn(state_id):
            if self._mn_mandals_geojson is None:
                mand_path = settings.PROCESSED_ADMIN_DIR / "manipur_subdivisions.geojson"
                if not mand_path.exists():
                    mand_path = settings.DATA_DIR / "processed" / "relocation" / "mn_subdivisions_relocation_priority.geojson"
                if not mand_path.exists():
                    raise FileNotFoundError(f"Manipur subdivisions GeoJSON not found at {mand_path}")
                with open(mand_path, "r", encoding="utf-8") as f:
                    self._mn_mandals_geojson = json.load(f)

            if district_id:
                did_clean = district_id.strip().lower().replace("-", "_").replace(" ", "_")
                filtered = [
                    f for f in self._mn_mandals_geojson["features"]
                    if str(f.get("properties", {}).get("current_district_id", "")).lower() == did_clean or
                       str(f.get("properties", {}).get("district_id", "")).lower() == did_clean or
                       str(f.get("properties", {}).get("current_district_name", "")).lower().replace(" ", "_") == did_clean or
                       str(f.get("properties", {}).get("district_name", "")).lower().replace(" ", "_") == did_clean
                ]
                return {"type": "FeatureCollection", "features": filtered}
            return self._mn_mandals_geojson

        if is_ga(state_id):
            if self._ga_mandals_geojson is None:
                mand_path = settings.PROCESSED_ADMIN_DIR / "goa_taluks.geojson"
                if not mand_path.exists():
                    mand_path = settings.DATA_DIR / "processed" / "relocation" / "ga_taluks_relocation_priority.geojson"
                if not mand_path.exists():
                    raise FileNotFoundError(f"Goa taluks GeoJSON not found at {mand_path}")
                with open(mand_path, "r", encoding="utf-8") as f:
                    self._ga_mandals_geojson = json.load(f)

            if district_id:
                did_clean = district_id.strip().lower().replace("-", "_").replace(" ", "_")
                filtered = [
                    f for f in self._ga_mandals_geojson["features"]
                    if str(f.get("properties", {}).get("current_district_id", "")).lower() == did_clean or
                       str(f.get("properties", {}).get("district_id", "")).lower() == did_clean or
                       str(f.get("properties", {}).get("current_district_name", "")).lower().replace(" ", "_") == did_clean or
                       str(f.get("properties", {}).get("district_name", "")).lower().replace(" ", "_") == did_clean
                ]
                return {"type": "FeatureCollection", "features": filtered}
            return self._ga_mandals_geojson

        if is_ka(state_id):
            if self._ka_mandals_geojson is None:
                mand_path = settings.PROCESSED_ADMIN_DIR / "karnataka_taluks.geojson"
                if not mand_path.exists():
                    mand_path = settings.DATA_DIR / "processed" / "relocation" / "ka_taluks_relocation_priority.geojson"
                if not mand_path.exists():
                    raise FileNotFoundError(f"Karnataka taluks GeoJSON not found at {mand_path}")
                with open(mand_path, "r", encoding="utf-8") as f:
                    self._ka_mandals_geojson = json.load(f)

            if district_id:
                did_clean = district_id.strip().lower().replace("-", "_").replace(" ", "_")
                filtered = [
                    f for f in self._ka_mandals_geojson["features"]
                    if str(f.get("properties", {}).get("current_district_id", "")).lower() == did_clean or
                       str(f.get("properties", {}).get("district_id", "")).lower() == did_clean or
                       str(f.get("properties", {}).get("current_district_name", "")).lower().replace(" ", "_") == did_clean or
                       str(f.get("properties", {}).get("district_name", "")).lower().replace(" ", "_") == did_clean
                ]
                return {"type": "FeatureCollection", "features": filtered}
            return self._ka_mandals_geojson

        if is_mp(state_id):
            if self._mp_mandals_geojson is None:
                mand_path = settings.PROCESSED_ADMIN_DIR / "madhya_pradesh_tehsils.geojson"
                if not mand_path.exists():
                    mand_path = settings.DATA_DIR / "processed" / "relocation" / "mp_tehsils_relocation_priority.geojson"
                if not mand_path.exists():
                    raise FileNotFoundError(f"MP tehsils GeoJSON not found at {mand_path}")
                with open(mand_path, "r", encoding="utf-8") as f:
                    self._mp_mandals_geojson = json.load(f)

            if district_id:
                did_clean = district_id.strip().lower().replace("-", "_").replace(" ", "_")
                filtered = [
                    f for f in self._mp_mandals_geojson["features"]
                    if str(f.get("properties", {}).get("current_district_id", "")).lower() == did_clean or
                       str(f.get("properties", {}).get("district_id", "")).lower() == did_clean or
                       str(f.get("properties", {}).get("current_district_name", "")).lower().replace(" ", "_") == did_clean
                ]
                return {"type": "FeatureCollection", "features": filtered}
            return self._mp_mandals_geojson
        if is_rj(state_id):
            if self._rj_mandals_geojson is None:
                mand_path = settings.PROCESSED_ADMIN_DIR / "rajasthan_tehsils.geojson"
                if not mand_path.exists():
                    mand_path = settings.DATA_DIR / "processed" / "relocation" / "rj_tehsils_relocation_priority.geojson"
                if not mand_path.exists():
                    raise FileNotFoundError(f"Rajasthan tehsils GeoJSON not found at {mand_path}")
                with open(mand_path, "r", encoding="utf-8") as f:
                    self._rj_mandals_geojson = json.load(f)

            if district_id:
                did_clean = district_id.strip().lower().replace("-", "_").replace(" ", "_")
                filtered = [
                    f for f in self._rj_mandals_geojson["features"]
                    if str(f.get("properties", {}).get("current_district_id", "")).lower() == did_clean or
                       str(f.get("properties", {}).get("district_id", "")).lower() == did_clean or
                       str(f.get("properties", {}).get("current_district_name", "")).lower().replace(" ", "_") == did_clean
                ]
                return {"type": "FeatureCollection", "features": filtered}
            return self._rj_mandals_geojson
        if is_tg(state_id):
            if self._tg_mandals_geojson is None:
                mand_path = settings.PROCESSED_ADMIN_DIR / "telangana_mandals.geojson"
                if not mand_path.exists():
                    mand_path = settings.DATA_DIR / "processed" / "relocation" / "tg_mandal_relocation_priority.geojson"
                if not mand_path.exists():
                    raise FileNotFoundError(f"Telangana mandals GeoJSON not found at {mand_path}")
                with open(mand_path, "r", encoding="utf-8") as f:
                    self._tg_mandals_geojson = json.load(f)

            if district_id:
                did_clean = district_id.strip().lower().replace("-", "_").replace(" ", "_")
                filtered = [
                    f for f in self._tg_mandals_geojson["features"]
                    if str(f.get("properties", {}).get("current_district_id", "")).lower() == did_clean or
                       str(f.get("properties", {}).get("district_id", "")).lower() == did_clean or
                       str(f.get("properties", {}).get("current_district_name", "")).lower().replace(" ", "_") == did_clean
                ]
                return {"type": "FeatureCollection", "features": filtered}
            return self._tg_mandals_geojson

        if is_tr(state_id):
            if self._tr_mandals_geojson is None:
                subd_path = settings.PROCESSED_ADMIN_DIR / "tripura_sub_divisions.geojson"
                if not subd_path.exists():
                    subd_path = settings.DATA_DIR / "processed" / "relocation" / "tr_subdivision_relocation_priority.geojson"
                if not subd_path.exists():
                    raise FileNotFoundError(f"Tripura sub-divisions GeoJSON not found at {subd_path}")
                with open(subd_path, "r", encoding="utf-8") as f:
                    self._tr_mandals_geojson = json.load(f)

            if district_id:
                did_clean = district_id.strip().lower().replace("-", "_").replace(" ", "_")
                filtered = [
                    f for f in self._tr_mandals_geojson["features"]
                    if str(f.get("properties", {}).get("current_district_id", "")).lower() == did_clean or
                       str(f.get("properties", {}).get("district_id", "")).lower() == did_clean or
                       str(f.get("properties", {}).get("current_district_name", "")).lower().replace(" ", "_") == did_clean
                ]
                return {"type": "FeatureCollection", "features": filtered}
            return self._tr_mandals_geojson

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
