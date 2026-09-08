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

def resolve_state_key(state_id: Optional[str]) -> str:
    if not state_id:
        return "andhra_pradesh"
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    if clean in ["odisha", "od", "or", "orissa"]:
        return "odisha"
    if clean in ["assam", "as"]:
        return "assam"
    if clean in ["bihar", "br"]:
        return "bihar"
    if clean in ["tamil_nadu", "tn", "tamilnadu"]:
        return "tamil_nadu"
    if clean in ["west_bengal", "wb", "westbengal"]:
        return "west_bengal"
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

class HazardService:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _load_data(self, state_id: Optional[str] = "andhra_pradesh"):
        key = resolve_state_key(state_id)
        if key in self._cache:
            return self._cache[key]

        haz_dir = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure"

        if key == "odisha":
            csv_path = haz_dir / "od_block_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "od_block_multi_hazard_exposure.geojson"
            surge_included = True
            surge_reason = "Odisha coastal belt (Balasore, Bhadrak, Kendrapara, Jagatsinghpur, Puri, Ganjam) models peak tropical cyclone storm surge (3.0-5.5m) and Mahanadi/Brahmani riverine flood recurrence."
        elif key == "bihar":
            csv_path = haz_dir / "br_block_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "br_block_multi_hazard_exposure.geojson"
            surge_included = False
            surge_reason = "Inland northern state: Direct coastal storm surge is Not Applicable (0.0). Recurrent riverine flood inundation across Kosi, Gandak, Bagmati, and Ganga basins & BIS IS 875 wind models applied."
        elif key == "west_bengal":
            csv_path = haz_dir / "wb_block_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "wb_block_multi_hazard_exposure.geojson"
            surge_included = True
            surge_reason = "Sundarbans coastal zones (South 24 Parganas, North 24 Parganas, Purba Medinipur) model 2.5–6.0m peak cyclone surge. Inland blocks apply Gangetic and Teesta/Torsa riverine flood recurrence."
        elif key == "assam":
            csv_path = haz_dir / "as_circle_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "as_circle_multi_hazard_exposure.geojson"
            surge_included = False
            surge_reason = "Inland northeast state: Direct coastal storm surge is Not Applicable (0.0). Brahmaputra and Barak riverine flood inundation recurrence & severe storm wind models applied."
        elif key == "tamil_nadu":
            csv_path = haz_dir / "tn_taluk_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "tn_taluk_multi_hazard_exposure.geojson"
            surge_included = True
            surge_reason = "None"
        elif key == "uttar_pradesh":
            csv_path = haz_dir / "up_tehsil_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "up_tehsil_multi_hazard_exposure.geojson"
            surge_included = False
            surge_reason = "Inland northern state: Direct coastal storm surge is Not Applicable (0.0). Recurrent riverine flood inundation across Ganga, Yamuna, Ghaghara, Rapti, and Ramganga river basins & BIS IS 875 wind models applied."
        elif key == "uttarakhand":
            csv_path = haz_dir / "uk_tehsil_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "uk_tehsil_multi_hazard_exposure.geojson"
            surge_included = False
            surge_reason = "Inland Himalayan state: Direct coastal storm surge is Not Applicable (0.0). Trans-Himalayan flash flood / GLOF recurrence across Bhagirathi, Alaknanda, and Mandakini basins, high-relief slope/landslide constraints, and BIS IS 875 wind models applied."
        elif key == "sikkim":
            csv_path = haz_dir / "sk_subdivision_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "sk_subdivision_multi_hazard_exposure.geojson"
            surge_included = False
            surge_reason = "Inland Eastern Himalayan state: Direct coastal storm surge is Not Applicable (0.0). Teesta basin Glacial Lake Outburst Floods (GLOF), catastrophic flash flood runoff, steep mountain slope landslide hazards, and BIS IS 875 wind models applied."
        elif key == "arunachal_pradesh":
            csv_path = haz_dir / "ar_circle_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "ar_circle_multi_hazard_exposure.geojson"
            surge_included = False
            surge_reason = "Inland Eastern Himalayan state: Direct coastal storm surge is Not Applicable (0.0). Major river basin flash flood & landslide dam-burst risks (Siang, Subansiri, Kameng, Dibang, Lohit), steep mountain slope landslide hazards, and BIS IS 875 wind models applied."
        elif key == "nagaland":
            csv_path = haz_dir / "nl_circle_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "nl_circle_multi_hazard_exposure.geojson"
            surge_included = False
            surge_reason = "Inland northeastern state: Direct coastal storm surge is Not Applicable (0.0). Naga Hills steep mountain slope landslide hazards, Dhansiri-Doyang-Dikhu-Tizu riverine & flash flood recurrence, and BIS IS 875 wind models applied."
        elif key == "meghalaya":
            csv_path = haz_dir / "ml_block_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "ml_block_multi_hazard_exposure.geojson"
            surge_included = False
            surge_reason = "Inland hill state atop Shillong Plateau: Direct coastal storm surge is Not Applicable (0.0). Cherrapunji/Mawsynram extreme rainfall, southern escarpment flash flood & landslide susceptibility, northern riverine flood recurrence, and BIS IS 875 (55 m/s) wind models applied."
        else:
            csv_path = haz_dir / "mandal_multi_hazard_exposure.csv"
            geojson_path = haz_dir / "ap_mandal_multi_hazard_exposure.geojson"
            surge_included = False
            surge_reason = "Open-access coastal surge inundation layer requires dynamic hydrodynamic modeling (e.g. ADCIRC). Historical tropical storm buffers applied as proxy."

        if not csv_path.exists():
            raise FileNotFoundError(f"Hazard data not found at {csv_path}")

        data = {
            "exposure_df": pd.read_csv(csv_path),
            "geojson_path": geojson_path,
            "surge_included": surge_included,
            "surge_reason": surge_reason,
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
        if target.startswith("AS_"):
            detected_state = "assam"
        elif target.startswith("TN_"):
            detected_state = "tamil_nadu"
        elif target.startswith("SK_"):
            detected_state = "sikkim"
        elif target.startswith("AR_"):
            detected_state = "arunachal_pradesh"
        elif target.startswith("NL_"):
            detected_state = "nagaland"
        elif target.startswith("ML_"):
            detected_state = "meghalaya"
        else:
            detected_state = state_id

        data = self._load_data(detected_state)
        df = data["exposure_df"]

        match = df[
            (df["mandal_id"] == target) |
            (df["mandal_name"].str.upper() == target)
        ]
        if match.empty:
            for s in ["andhra_pradesh", "assam", "tamil_nadu", "bihar", "west_bengal", "odisha", "uttar_pradesh", "uttarakhand", "sikkim", "arunachal_pradesh", "nagaland", "meghalaya"]:
                if s == detected_state:
                    continue
                s_data = self._load_data(s)
                match = s_data["exposure_df"][
                    (s_data["exposure_df"]["mandal_id"] == target) |
                    (s_data["exposure_df"]["mandal_name"].str.upper() == target)
                ]
                if not match.empty:
                    break
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
            storm_surge_exclusion_reason=data["surge_reason"],
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
