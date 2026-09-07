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

class HazardService:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _get_state_key(self, state_id: Optional[str]) -> str:
        if is_mn(state_id):
            return "mn"
        if is_ga(state_id):
            return "ga"
        if is_ka(state_id):
            return "ka"
        if is_mp(state_id):
            return "mp"
        if is_rj(state_id):
            return "rj"
        if is_tg(state_id):
            return "tg"
        if is_tr(state_id):
            return "tr"
        if is_tn(state_id):
            return "tn"
        return "ap"

    def _load_data(self, state_id: Optional[str] = "andhra_pradesh"):
        key = self._get_state_key(state_id)
        if key in self._cache:
            return self._cache[key]

        haz_dir = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure"

        if key == "mn":
            csv_path = haz_dir / "mn_subdivisions_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "mn_subdivisions_multi_hazard_exposure.geojson"
            surge_included = False
            exclusion_reason = "Manipur is an inland northeastern state; coastal storm surge is NOT_APPLICABLE. Hazard framework incorporates riverine flood & wetland inundation (Imphal, Thoubal, Iril, Barak basins, Loktak Lake), steep terrain landslide susceptibility (SRTM DEM, GSI), Zone V severe seismicity (BIS IS 1893), and high wind (IS 875 Vb=55 m/s)."
        elif key == "ga":
            csv_path = haz_dir / "ga_taluks_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "ga_taluks_multi_hazard_exposure.geojson"
            surge_included = True
            exclusion_reason = "None"
        elif key == "ka":
            csv_path = haz_dir / "ka_taluks_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "ka_taluks_multi_hazard_exposure.geojson"
            surge_included = True
            exclusion_reason = "None"
        elif key == "mp":
            csv_path = haz_dir / "mp_tehsils_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "mp_tehsils_multi_hazard_exposure.geojson"
            surge_included = False
            exclusion_reason = "Madhya Pradesh is a landlocked central state; coastal storm surge is NOT_APPLICABLE. Hazard framework focuses on riverine flood (Narmada, Chambal, Betwa, Son basins), wind hazard (IS 875 Vb=44 m/s), Vindhya/Satpura slope constraints, and seismicity (BIS IS 1893 Zone II/III)."
        elif key == "rj":
            csv_path = haz_dir / "rj_tehsils_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "rj_tehsils_multi_hazard_exposure.geojson"
            surge_included = False
            exclusion_reason = "Rajasthan is a landlocked arid/semi-arid state; coastal storm surge and cyclone tracks are NOT_APPLICABLE. Hazard framework incorporates riverine/flash flood (Chambal, Luni, Banas, Ghaggar), extreme heat/aridity, high wind/dust storms (IS 875 Vb=47 m/s), Aravalli slope constraints, and seismicity (BIS IS 1893 Zone II/III/IV)."
        elif key == "tg":
            csv_path = haz_dir / "tg_mandal_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "tg_mandal_multi_hazard_exposure.geojson"
            surge_included = False
            exclusion_reason = "Telangana is a landlocked state; coastal storm surge is NOT_APPLICABLE. Hazard model focuses on riverine flood (Godavari & Krishna basins), wind hazard (IS 875 Vb=44 m/s), slope constraints, and seismicity (BIS IS 1893 Zone II/III)."
        elif key == "tr":
            csv_path = haz_dir / "tr_subdivision_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "tr_subdivision_multi_hazard_exposure.geojson"
            surge_included = False
            exclusion_reason = "Tripura is a landlocked northeastern state; storm surge is NOT_APPLICABLE. Hazard model focuses on riverine/flash flood, landslide susceptibility (GSI), Zone V seismicity (BIS), and high wind (IS 875)."
        elif key == "tn":
            csv_path = haz_dir / "tn_taluk_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "tn_taluk_multi_hazard_exposure.geojson"
            surge_included = True
            exclusion_reason = "None"
        else:
            csv_path = haz_dir / "mandal_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "ap_mandal_multi_hazard_exposure.geojson"
            surge_included = False
            exclusion_reason = "Open-access coastal surge inundation layer requires dynamic hydrodynamic modeling (e.g. ADCIRC). Historical tropical storm buffers applied as proxy."

        if not csv_path.exists():
            raise FileNotFoundError(f"Hazard data not found at {csv_path}")

        data = {
            "exposure_df": pd.read_csv(csv_path),
            "geojson_path": geojson_path,
            "surge_included": surge_included,
            "exclusion_reason": exclusion_reason,
            "geojson": None
        }
        self._cache[key] = data
        return data

    def get_all_mandals(self, district_id: Optional[str] = None, state_id: Optional[str] = "andhra_pradesh") -> MandalExposureListResponse:
        data = self._load_data(state_id)
        df = data["exposure_df"]

        if district_id:
            df = df[df["current_district_id"] == district_id.strip().lower()]

        items = [MandalHazardExposureItem(**row) for row in df.to_dict(orient="records")]
        return MandalExposureListResponse(total_mandals=len(items), items=items)

    def get_mandal_detail(self, mandal_id: str, state_id: Optional[str] = "andhra_pradesh") -> Optional[MandalHazardExposureItem]:
        target = mandal_id.strip().upper()
        if target.startswith("TR_"):
            detected_state = "tripura"
        elif target.startswith("TN_"):
            detected_state = "tamil_nadu"
        else:
            detected_state = state_id

        data = self._load_data(detected_state)
        df = data["exposure_df"]

        match = df[
            (df["mandal_id"] == target) |
            (df["mandal_name"].str.upper() == target)
        ]
        if match.empty and detected_state != "tripura":
            tr_data = self._load_data("tripura")
            match = tr_data["exposure_df"][
                (tr_data["exposure_df"]["mandal_id"] == target) |
                (tr_data["exposure_df"]["mandal_name"].str.upper() == target)
            ]
        if match.empty and detected_state != "tamil_nadu":
            tn_data = self._load_data("tamil_nadu")
            match = tn_data["exposure_df"][
                (tn_data["exposure_df"]["mandal_id"] == target) |
                (tn_data["exposure_df"]["mandal_name"].str.upper() == target)
            ]
        if match.empty:
            return None
        return MandalHazardExposureItem(**match.iloc[0].to_dict())

    def get_summary(self, state_id: Optional[str] = "andhra_pradesh") -> HazardSummaryResponse:
        data = self._load_data(state_id)
        df = data["exposure_df"]

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
                "High Hazard (>= 0.50)": high_count,
                "Moderate Hazard (0.25 - 0.50)": mod_count,
                "Low Hazard (< 0.25)": low_count,
            },
            top_exposed_mandals=top_5,
            storm_surge_included=data["surge_included"],
            storm_surge_exclusion_reason=data.get("exclusion_reason", "None" if data["surge_included"] else "Excluded"),
            methodology_note="Calculated using verified open hazard datasets: JRC Global Surface Water 30m, NOAA IBTrACS Bay of Bengal tracks, BMTPC IS 875 wind speeds, and CGIAR SRTM 90m slope."
        )

    def get_geojson(self, district_id: Optional[str] = None, state_id: Optional[str] = "andhra_pradesh") -> Dict[str, Any]:
        data = self._load_data(state_id)
        if data["geojson"] is None:
            geojson_path = data["geojson_path"]
            with open(geojson_path, "r", encoding="utf-8") as f:
                data["geojson"] = json.load(f)

        if not district_id:
            return data["geojson"]

        target_did = district_id.strip().lower()
        filtered = [
            feat for feat in data["geojson"].get("features", [])
            if str(feat.get("properties", {}).get("current_district_id", "")).lower() == target_did
        ]
        return {
            "type": "FeatureCollection",
            "features": filtered
        }

hazard_service = HazardService()
