import json
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.core.state_registry import get_state_key
from app.emergency.schemas import EmergencyDisaster, EmergencyDisasterCreate

class EmergencyService:
    def __init__(self):
        self._storage_path = settings.DATA_DIR / "processed" / "emergency" / "disasters.json"
        self._disasters: List[Dict[str, Any]] = []
        self._load_from_storage()

    def _load_from_storage(self):
        if self._storage_path.exists():
            try:
                with open(self._storage_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        self._disasters = data
            except Exception as e:
                print(f"[EmergencyService] Warning: Could not read storage file: {e}")
                self._disasters = []
        else:
            self._disasters = []

    def _save_to_storage(self):
        try:
            self._storage_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self._storage_path, "w", encoding="utf-8") as f:
                json.dump(self._disasters, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[EmergencyService] Warning: Could not save storage file: {e}")

    def _filter_by_time(self, item_time_str: Optional[str], time_range: Optional[str]) -> bool:
        if not time_range or time_range.lower() in ("all", "any", "live"):
            return True
        if not item_time_str:
            return True
        try:
            # Handle ISO strings with Z or timezone offset
            clean_str = item_time_str.replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            diff = now - dt

            if time_range == "6h":
                return diff <= timedelta(hours=6)
            elif time_range == "24h":
                return diff <= timedelta(hours=24)
            elif time_range == "7d":
                return diff <= timedelta(days=7)
            return True
        except Exception:
            return True

    def get_test_disasters_for_state(self, state_key: str) -> List[Dict[str, Any]]:
        """
        Only returned when test_mode=True is explicitly requested by caller.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        two_h_ago = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
        
        test_catalogue = {
            "andhra_pradesh": [
                {
                    "id": "EMERG-AP-001",
                    "disasterType": "flood",
                    "type": "flood",
                    "latitude": 16.5062,
                    "longitude": 80.6480,
                    "severity": "critical",
                    "status": "active",
                    "title": "Krishna River Flash Inundation",
                    "description": "Severe swelling of Krishna river basin causing water ingress into low-lying wards.",
                    "location": "Vijayawada Urban & Rural, NTR District",
                    "state": "andhra_pradesh",
                    "district": "NTR",
                    "affectedArea": {"type": "radius", "radiusKm": 12.5},
                    "affectedPopulation": 45000,
                    "startedAt": two_h_ago,
                    "lastUpdated": now_iso,
                    "source": "State Disaster Operations Center (SDOC) Simulation Feed",
                    "createdAt": two_h_ago,
                    "updatedAt": now_iso,
                },
                {
                    "id": "EMERG-AP-002",
                    "disasterType": "cyclone",
                    "type": "cyclone",
                    "latitude": 17.6868,
                    "longitude": 83.2185,
                    "severity": "high",
                    "status": "active",
                    "title": "Coastal Surge Alert - Visakhapatnam",
                    "description": "High velocity wind gusts and tidal surge observed near coastal fishing settlements.",
                    "location": "Visakhapatnam Coast",
                    "state": "andhra_pradesh",
                    "district": "Visakhapatnam",
                    "affectedArea": {"type": "radius", "radiusKm": 18.0},
                    "affectedPopulation": 28000,
                    "startedAt": two_h_ago,
                    "lastUpdated": now_iso,
                    "source": "IMD Radar & Coastal Warning Center",
                    "createdAt": two_h_ago,
                    "updatedAt": now_iso,
                }
            ],
            "mizoram": [
                {
                    "id": "EMERG-MZ-001",
                    "disasterType": "landslide",
                    "type": "landslide",
                    "latitude": 23.7271,
                    "longitude": 92.7176,
                    "severity": "critical",
                    "status": "active",
                    "title": "Aizawl Slope Failure & Road Blockage",
                    "description": "Major slope collapse along NH-54 arterial corridor due to incessant torrential rain.",
                    "location": "Aizawl North Hillside",
                    "state": "mizoram",
                    "district": "Aizawl",
                    "affectedArea": {"type": "radius", "radiusKm": 4.5},
                    "affectedPopulation": 6200,
                    "startedAt": two_h_ago,
                    "lastUpdated": now_iso,
                    "source": "Disaster Management & Rehabilitation Dept, Mizoram",
                    "createdAt": two_h_ago,
                    "updatedAt": now_iso,
                }
            ]
        }
        return test_catalogue.get(state_key, [])

    def get_disasters(
        self,
        state: str,
        disaster_type: Optional[str] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        district: Optional[str] = None,
        time_range: Optional[str] = None,
        test_mode: bool = False,
    ) -> List[EmergencyDisaster]:
        """
        Retrieves disasters matching state and filters.
        Strict rule: If test_mode is False and no active incidents exist in storage,
        returns an empty list (0 records). Never returns fabricated/unverified data.
        """
        target_state_key = get_state_key(state)
        
        # Source records
        records: List[Dict[str, Any]] = []
        
        # Add real/stored records
        for d in self._disasters:
            item_state_key = get_state_key(d.get("state", ""))
            if item_state_key == target_state_key:
                records.append(d)
                
        # Only inject test data if test_mode was explicitly requested
        if test_mode:
            test_items = self.get_test_disasters_for_state(target_state_key)
            records.extend(test_items)
            
        results: List[EmergencyDisaster] = []
        for r in records:
            # Type filter
            r_type = (r.get("disasterType") or r.get("type") or "").lower()
            if disaster_type and disaster_type.lower() != "all":
                if r_type != disaster_type.lower():
                    continue

            # Severity filter
            r_sev = (r.get("severity") or "").lower()
            if severity and severity.lower() != "all":
                if r_sev != severity.lower():
                    continue

            # Status filter
            r_stat = (r.get("status") or "").lower()
            if status and status.lower() != "all":
                if r_stat != status.lower():
                    continue

            # District filter
            if district and district.lower() != "all":
                r_dist = (r.get("district") or "").lower()
                if district.lower() not in r_dist:
                    continue

            # Time range filter
            time_to_check = r.get("startedAt") or r.get("lastUpdated") or r.get("createdAt")
            if not self._filter_by_time(time_to_check, time_range):
                continue

            # Ensure both disasterType and type are present
            disaster_dict = dict(r)
            if "disasterType" not in disaster_dict and "type" in disaster_dict:
                disaster_dict["disasterType"] = disaster_dict["type"]
            if "type" not in disaster_dict and "disasterType" in disaster_dict:
                disaster_dict["type"] = disaster_dict["disasterType"]

            results.append(EmergencyDisaster(**disaster_dict))

        return results

    def get_disaster_by_id(self, disaster_id: str) -> Optional[EmergencyDisaster]:
        for d in self._disasters:
            if d.get("id") == disaster_id:
                disaster_dict = dict(d)
                if "disasterType" not in disaster_dict and "type" in disaster_dict:
                    disaster_dict["disasterType"] = disaster_dict["type"]
                if "type" not in disaster_dict and "disasterType" in disaster_dict:
                    disaster_dict["type"] = disaster_dict["disasterType"]
                return EmergencyDisaster(**disaster_dict)
        return None

    def create_disaster(self, payload: EmergencyDisasterCreate) -> EmergencyDisaster:
        now_iso = datetime.now(timezone.utc).isoformat()
        disaster_id = payload.id or f"EMERG-{uuid.uuid4().hex[:8].upper()}"
        
        data_dict = payload.model_dump()
        data_dict["id"] = disaster_id
        data_dict["type"] = payload.disasterType
        data_dict["disasterType"] = payload.disasterType
        data_dict["createdAt"] = data_dict.get("createdAt") or now_iso
        data_dict["updatedAt"] = now_iso
        data_dict["lastUpdated"] = data_dict.get("lastUpdated") or now_iso
        data_dict["startedAt"] = data_dict.get("startedAt") or now_iso

        self._disasters.append(data_dict)
        self._save_to_storage()
        return EmergencyDisaster(**data_dict)

    def delete_disaster(self, disaster_id: str) -> bool:
        initial_len = len(self._disasters)
        self._disasters = [d for d in self._disasters if d.get("id") != disaster_id]
        if len(self._disasters) < initial_len:
            self._save_to_storage()
            return True
        return False

emergency_service = EmergencyService()
