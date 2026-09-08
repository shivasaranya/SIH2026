from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional, List, Any
from app.core.config import settings

@dataclass
class StateMetadata:
    id: str
    code: str
    name: str
    admin_unit_name: str
    admin_unit_plural: str
    district_count: int
    admin_unit_count: int
    is_coastal: bool = False
    districts_geojson: Path = None
    admin_units_geojson: Path = None
    census_csv: Path = None
    hazard_csv: Path = None
    hazard_geojson: Path = None
    vulnerability_csv: Path = None
    vulnerability_geojson: Path = None
    capacity_components_csv: Path = None
    capacity_adequacy_csv: Path = None
    host_candidates_csv: Path = None
    capacity_geojson: Path = None
    relocation_csv: Path = None
    relocation_geojson: Path = None
    relocation_summary_csv: Path = None
    ahp_weights_csv: Path = None
    factors_csv: Path = None

def get_state_key(state_id: Optional[str]) -> str:
    if not state_id:
        return "andhra_pradesh"
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    if clean in ["mizoram", "mz", "mizo"]:
        return "mizoram"
    if clean in ["tamil_nadu", "tn", "tamilnadu"]:
        return "tamil_nadu"
    if clean in ["himachal_pradesh", "hp", "himachal"]:
        return "himachal_pradesh"
    if clean in ["jammu_kashmir", "jammu_and_kashmir", "jk", "j_k", "jammukashmir"]:
        return "jammu_kashmir"
    if clean in ["madhya_pradesh", "mp", "madhyapradesh"]:
        return "madhya_pradesh"
    return "andhra_pradesh"

def is_jk(state_id: Optional[str]) -> bool:
    return get_state_key(state_id) == "jammu_kashmir"

def is_mp(state_id: Optional[str]) -> bool:
    return get_state_key(state_id) == "madhya_pradesh"

class StateRegistry:
    def __init__(self):
        root = settings.DATA_DIR
        proc_admin = root / "processed" / "admin"
        raw_admin = root / "raw" / "admin"
        proc_census = root / "processed" / "census"
        proc_haz = root / "processed" / "hazard" / "mandal_exposure"
        proc_vuln = root / "processed" / "vulnerability"
        proc_cap = root / "processed" / "capacity"
        proc_reloc = root / "processed" / "relocation"

        self.states: Dict[str, StateMetadata] = {
            "andhra_pradesh": StateMetadata(
                id="andhra_pradesh",
                code="AP",
                name="Andhra Pradesh",
                admin_unit_name="Mandal",
                admin_unit_plural="Mandals",
                district_count=26,
                admin_unit_count=696,
                is_coastal=True,
                districts_geojson=proc_admin / "andhra_pradesh_26_districts.geojson",
                admin_units_geojson=raw_admin / "AndhraPradesh_Mandals.geojson",
                census_csv=proc_census / "ap_village_demographics.csv",
                hazard_csv=proc_haz / "mandal_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "ap_mandal_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "mandal_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "ap_mandal_vulnerability.geojson",
                capacity_components_csv=proc_cap / "mandal_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "mandal_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "host_zone_candidates.csv",
                capacity_geojson=proc_cap / "ap_mandal_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "mandal_relocation_priority.csv",
                relocation_geojson=proc_reloc / "ap_mandal_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "ahp_weights.csv",
                factors_csv=proc_reloc / "relocation_factor_contributions.csv"
            ),
            "tamil_nadu": StateMetadata(
                id="tamil_nadu",
                code="TN",
                name="Tamil Nadu",
                admin_unit_name="Taluk",
                admin_unit_plural="Taluks",
                district_count=38,
                admin_unit_count=302,
                is_coastal=True,
                districts_geojson=proc_admin / "tamil_nadu_38_districts.geojson",
                admin_units_geojson=proc_admin / "tamil_nadu_taluks.geojson",
                census_csv=proc_census / "tn_taluk_demographics.csv",
                hazard_csv=proc_haz / "tn_taluk_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "tn_taluk_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "tn_taluk_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "tn_taluk_vulnerability.geojson",
                capacity_components_csv=proc_cap / "tn_taluk_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "tn_taluk_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "tn_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "tn_taluk_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "tn_taluk_relocation_priority.csv",
                relocation_geojson=proc_reloc / "tn_taluk_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "tn_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "tn_ahp_weights.csv",
                factors_csv=proc_reloc / "tn_relocation_factor_contributions.csv"
            ),
            "mizoram": StateMetadata(
                id="mizoram",
                code="MZ",
                name="Mizoram",
                admin_unit_name="R.D. Block",
                admin_unit_plural="R.D. Blocks",
                district_count=11,
                admin_unit_count=26,
                is_coastal=False,
                districts_geojson=proc_admin / "mizoram_11_districts.geojson",
                admin_units_geojson=proc_admin / "mizoram_rd_blocks.geojson",
                census_csv=proc_census / "mizoram_rd_block_demographics.csv",
                hazard_csv=proc_haz / "mizoram_subdistrict_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "mizoram_subdistrict_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "mizoram_subdistrict_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "mizoram_subdistrict_vulnerability.geojson",
                capacity_components_csv=proc_cap / "mizoram_subdistrict_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "mizoram_subdistrict_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "mizoram_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "mizoram_subdistrict_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "mizoram_subdistrict_relocation_priority.csv",
                relocation_geojson=proc_reloc / "mizoram_subdistrict_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "mizoram_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "mizoram_ahp_weights.csv",
                factors_csv=proc_reloc / "mizoram_relocation_factor_contributions.csv"
            ),
            "himachal_pradesh": StateMetadata(
                id="himachal_pradesh",
                code="HP",
                name="Himachal Pradesh",
                admin_unit_name="Tehsil",
                admin_unit_plural="Tehsils",
                district_count=12,
                admin_unit_count=172,
                is_coastal=False,
                districts_geojson=proc_admin / "himachal_pradesh_12_districts.geojson",
                admin_units_geojson=proc_admin / "himachal_pradesh_tehsils.geojson",
                census_csv=proc_census / "hp_tehsil_demographics.csv",
                hazard_csv=proc_haz / "hp_tehsil_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "hp_tehsil_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "hp_tehsil_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "hp_tehsil_vulnerability.geojson",
                capacity_components_csv=proc_cap / "hp_tehsil_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "hp_tehsil_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "hp_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "hp_tehsil_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "hp_tehsil_relocation_priority.csv",
                relocation_geojson=proc_reloc / "hp_tehsil_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "hp_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "hp_ahp_weights.csv",
                factors_csv=proc_reloc / "hp_relocation_factor_contributions.csv"
            ),
            "jammu_kashmir": StateMetadata(
                id="jammu_kashmir",
                code="JK",
                name="Jammu and Kashmir",
                admin_unit_name="Tehsil",
                admin_unit_plural="Tehsils",
                district_count=20,
                admin_unit_count=197,
                is_coastal=False,
                districts_geojson=proc_admin / "jammu_kashmir_20_districts.geojson",
                admin_units_geojson=proc_admin / "jammu_kashmir_tehsils.geojson",
                census_csv=proc_census / "jk_tehsil_demographics.csv",
                hazard_csv=proc_haz / "jk_tehsil_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "jk_tehsil_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "jk_tehsil_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "jk_tehsil_vulnerability.geojson",
                capacity_components_csv=proc_cap / "jk_tehsil_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "jk_tehsil_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "jk_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "jk_tehsil_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "jk_tehsil_relocation_priority.csv",
                relocation_geojson=proc_reloc / "jk_tehsil_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "jk_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "jk_ahp_weights.csv",
                factors_csv=proc_reloc / "jk_relocation_factor_contributions.csv"
            ),
            "madhya_pradesh": StateMetadata(
                id="madhya_pradesh",
                code="MP",
                name="Madhya Pradesh",
                admin_unit_name="Tehsil",
                admin_unit_plural="Tehsils",
                district_count=52,
                admin_unit_count=422,
                is_coastal=False,
                districts_geojson=proc_admin / "madhya_pradesh_52_districts.geojson",
                admin_units_geojson=proc_admin / "madhya_pradesh_tehsils.geojson",
                census_csv=proc_census / "mp_tehsil_demographics.csv",
                hazard_csv=proc_haz / "mp_tehsil_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "mp_tehsil_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "mp_tehsil_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "mp_tehsil_vulnerability.geojson",
                capacity_components_csv=proc_cap / "mp_tehsil_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "mp_tehsil_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "mp_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "mp_tehsil_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "mp_tehsil_relocation_priority.csv",
                relocation_geojson=proc_reloc / "mp_tehsil_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "mp_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "mp_ahp_weights.csv",
                factors_csv=proc_reloc / "mp_relocation_factor_contributions.csv"
            )
        }

    def get_state(self, state_id: Optional[str]) -> StateMetadata:
        key = get_state_key(state_id)
        return self.states.get(key, self.states["andhra_pradesh"])

    def list_states(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": s.id,
                "code": s.code,
                "name": s.name,
                "admin_unit_name": s.admin_unit_name,
                "admin_unit_plural": s.admin_unit_plural,
                "district_count": s.district_count,
                "admin_unit_count": s.admin_unit_count,
                "is_coastal": s.is_coastal,
            }
            for s in self.states.values()
        ]

state_registry = StateRegistry()
