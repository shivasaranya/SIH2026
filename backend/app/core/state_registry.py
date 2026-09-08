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
    if clean in ["west_bengal", "wb", "westbengal"]:
        return "west_bengal"
    if clean in ["assam", "as"]:
        return "assam"
    if clean in ["bihar", "br"]:
        return "bihar"
    if clean in ["odisha", "od", "or", "orissa"]:
        return "odisha"
    if clean in ["sikkim", "sk"]:
        return "sikkim"
    if clean in ["arunachal_pradesh", "arunachal", "ar"]:
        return "arunachal_pradesh"
    if clean in ["nagaland", "nl"]:
        return "nagaland"
    if clean in ["uttar_pradesh", "up", "uttarpradesh"]:
        return "uttar_pradesh"
    if clean in ["uttarakhand", "uk", "uttaranchal"]:
        return "uttarakhand"
    if clean in ["meghalaya", "ml"]:
        return "meghalaya"
    if clean in ["chhattisgarh", "cg"]:
        return "chhattisgarh"
    if clean in ["gujarat", "gj"]:
        return "gujarat"
    if clean in ["haryana", "hr"]:
        return "haryana"
    if clean in ["kerala", "kl"]:
        return "kerala"
    if clean in ["maharashtra", "mh"]:
        return "maharashtra"
    if clean in ["punjab", "pb"]:
        return "punjab"
    if clean in ["andhra_pradesh", "ap", "andhra"]:
        return "andhra_pradesh"
    return "andhra_pradesh"

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
                is_coastal=False,
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
            "west_bengal": StateMetadata(
                id="west_bengal",
                code="WB",
                name="West Bengal",
                admin_unit_name="Block",
                admin_unit_plural="Blocks",
                district_count=23,
                admin_unit_count=346,
                is_coastal=True,
                districts_geojson=proc_admin / "west_bengal_23_districts.geojson",
                admin_units_geojson=proc_admin / "west_bengal_blocks.geojson",
                census_csv=proc_census / "wb_block_demographics.csv",
                hazard_csv=proc_haz / "wb_block_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "wb_block_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "wb_block_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "wb_block_demographic_vulnerability.geojson",
                capacity_components_csv=proc_cap / "wb_block_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "wb_block_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "wb_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "wb_block_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "wb_block_relocation_priority.csv",
                relocation_geojson=proc_reloc / "wb_block_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "wb_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "wb_ahp_weights.csv",
                factors_csv=proc_reloc / "wb_relocation_factor_contributions.csv"
            ),
            "assam": StateMetadata(
                id="assam",
                code="AS",
                name="Assam",
                admin_unit_name="Revenue Circle",
                admin_unit_plural="Revenue Circles",
                district_count=33,
                admin_unit_count=153,
                is_coastal=False,
                districts_geojson=proc_admin / "assam_33_districts.geojson",
                admin_units_geojson=proc_admin / "assam_revenue_circles.geojson",
                census_csv=proc_census / "as_circle_demographics.csv",
                hazard_csv=proc_haz / "as_circle_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "as_circle_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "as_circle_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "as_circle_vulnerability.geojson",
                capacity_components_csv=proc_cap / "as_circle_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "as_circle_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "as_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "as_circle_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "as_circle_relocation_priority.csv",
                relocation_geojson=proc_reloc / "as_circle_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "as_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "as_ahp_weights.csv",
                factors_csv=proc_reloc / "as_relocation_factor_contributions.csv"
            ),
            "bihar": StateMetadata(
                id="bihar",
                code="BR",
                name="Bihar",
                admin_unit_name="Block",
                admin_unit_plural="Blocks",
                district_count=38,
                admin_unit_count=534,
                is_coastal=False,
                districts_geojson=proc_admin / "bihar_38_districts.geojson",
                admin_units_geojson=proc_admin / "bihar_blocks.geojson",
                census_csv=proc_census / "br_block_demographics.csv",
                hazard_csv=proc_haz / "br_block_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "br_block_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "br_block_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "br_block_demographic_vulnerability.geojson",
                capacity_components_csv=proc_cap / "br_block_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "br_block_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "br_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "br_block_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "br_block_relocation_priority.csv",
                relocation_geojson=proc_reloc / "br_block_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "br_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "br_ahp_weights.csv",
                factors_csv=proc_reloc / "br_relocation_factor_contributions.csv"
            ),
            "odisha": StateMetadata(
                id="odisha",
                code="OD",
                name="Odisha",
                admin_unit_name="Block",
                admin_unit_plural="Blocks",
                district_count=30,
                admin_unit_count=475,
                is_coastal=True,
                districts_geojson=proc_admin / "odisha_30_districts.geojson",
                admin_units_geojson=proc_admin / "odisha_blocks.geojson",
                census_csv=proc_census / "od_block_demographics.csv",
                hazard_csv=proc_haz / "od_block_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "od_block_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "od_block_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "od_block_demographic_vulnerability.geojson",
                capacity_components_csv=proc_cap / "od_block_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "od_block_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "od_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "od_block_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "od_block_relocation_priority.csv",
                relocation_geojson=proc_reloc / "od_block_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "od_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "od_ahp_weights.csv",
                factors_csv=proc_reloc / "od_relocation_factor_contributions.csv"
            ),
            "sikkim": StateMetadata(
                id="sikkim",
                code="SK",
                name="Sikkim",
                admin_unit_name="Sub-division",
                admin_unit_plural="Sub-divisions",
                district_count=6,
                admin_unit_count=16,
                is_coastal=False,
                districts_geojson=proc_admin / "sikkim_6_districts.geojson",
                admin_units_geojson=proc_admin / "sikkim_subdivisions.geojson",
                census_csv=proc_census / "sk_subdivision_demographics.csv",
                hazard_csv=proc_haz / "sk_subdivision_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "sk_subdivision_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "sk_subdivision_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "sk_subdivision_demographic_vulnerability.geojson",
                capacity_components_csv=proc_cap / "sk_subdivision_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "sk_subdivision_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "sk_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "sk_subdivision_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "sk_subdivision_relocation_priority.csv",
                relocation_geojson=proc_reloc / "sk_subdivision_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "sk_relocation_summary.csv",
                ahp_weights_csv=proc_reloc / "sk_ahp_weights.csv",
                factors_csv=proc_reloc / "sk_relocation_factor_contributions.csv"
            ),
            "arunachal_pradesh": StateMetadata(
                id="arunachal_pradesh",
                code="AR",
                name="Arunachal Pradesh",
                admin_unit_name="Circle",
                admin_unit_plural="Circles",
                district_count=25,
                admin_unit_count=208,
                is_coastal=False,
                districts_geojson=proc_admin / "arunachal_pradesh_25_districts.geojson",
                admin_units_geojson=proc_admin / "arunachal_pradesh_circles.geojson",
                census_csv=proc_census / "ar_circle_demographics.csv",
                hazard_csv=proc_haz / "ar_circle_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "ar_circle_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "ar_circle_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "ar_circle_demographic_vulnerability.geojson",
                capacity_components_csv=proc_cap / "ar_circle_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "ar_circle_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "ar_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "ar_circle_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "ar_circle_relocation_priority.csv",
                relocation_geojson=proc_reloc / "ar_circle_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "ar_relocation_summary.csv",
                ahp_weights_csv=proc_reloc / "ar_ahp_criteria_weights.csv",
                factors_csv=proc_reloc / "ar_relocation_factor_contributions.csv"
            ),
            "nagaland": StateMetadata(
                id="nagaland",
                code="NL",
                name="Nagaland",
                admin_unit_name="Circle",
                admin_unit_plural="Circles",
                district_count=11,
                admin_unit_count=120,
                is_coastal=False,
                districts_geojson=proc_admin / "nagaland_11_districts.geojson",
                admin_units_geojson=proc_admin / "nagaland_circles.geojson",
                census_csv=proc_census / "nl_circle_demographics.csv",
                hazard_csv=proc_haz / "nl_circle_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "nl_circle_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "nl_circle_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "nl_circle_demographic_vulnerability.geojson",
                capacity_components_csv=proc_cap / "nl_circle_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "nl_circle_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "nl_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "nl_circle_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "nl_circle_relocation_priority.csv",
                relocation_geojson=proc_reloc / "nl_circle_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "nl_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "nl_ahp_weights.csv",
                factors_csv=proc_reloc / "nl_relocation_factor_contributions.csv"
            ),
            "uttar_pradesh": StateMetadata(
                id="uttar_pradesh",
                code="UP",
                name="Uttar Pradesh",
                admin_unit_name="Tehsil",
                admin_unit_plural="Tehsils",
                district_count=75,
                admin_unit_count=351,
                is_coastal=False,
                districts_geojson=proc_admin / "uttar_pradesh_75_districts.geojson",
                admin_units_geojson=proc_admin / "uttar_pradesh_tehsils.geojson",
                census_csv=proc_census / "up_tehsil_demographics.csv",
                hazard_csv=proc_haz / "up_tehsil_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "up_tehsil_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "up_tehsil_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "up_tehsil_demographic_vulnerability.geojson",
                capacity_components_csv=proc_cap / "up_tehsil_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "up_tehsil_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "up_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "up_tehsil_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "up_tehsil_relocation_priority.csv",
                relocation_geojson=proc_reloc / "up_tehsil_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "up_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "up_ahp_weights.csv",
                factors_csv=proc_reloc / "up_relocation_factor_contributions.csv"
            ),
            "uttarakhand": StateMetadata(
                id="uttarakhand",
                code="UK",
                name="Uttarakhand",
                admin_unit_name="Tehsil",
                admin_unit_plural="Tehsils",
                district_count=13,
                admin_unit_count=127,
                is_coastal=False,
                districts_geojson=proc_admin / "uttarakhand_13_districts.geojson",
                admin_units_geojson=proc_admin / "uttarakhand_tehsils.geojson",
                census_csv=proc_census / "uk_tehsil_demographics.csv",
                hazard_csv=proc_haz / "uk_tehsil_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "uk_tehsil_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "uk_tehsil_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "uk_tehsil_demographic_vulnerability.geojson",
                capacity_components_csv=proc_cap / "uk_tehsil_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "uk_tehsil_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "uk_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "uk_tehsil_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "uk_tehsil_relocation_priority.csv",
                relocation_geojson=proc_reloc / "uk_tehsil_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "uk_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "uk_ahp_weights.csv",
                factors_csv=proc_reloc / "uk_relocation_factor_contributions.csv"
            ),
            "meghalaya": StateMetadata(
                id="meghalaya",
                code="ML",
                name="Meghalaya",
                admin_unit_name="Block",
                admin_unit_plural="Blocks",
                district_count=11,
                admin_unit_count=46,
                is_coastal=False,
                districts_geojson=proc_admin / "meghalaya_11_districts.geojson",
                admin_units_geojson=proc_admin / "meghalaya_blocks.geojson",
                census_csv=proc_census / "ml_block_demographics.csv",
                hazard_csv=proc_haz / "ml_block_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "ml_block_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "ml_block_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "ml_block_demographic_vulnerability.geojson",
                capacity_components_csv=proc_cap / "ml_block_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "ml_block_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "ml_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "ml_block_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "ml_block_relocation_priority.csv",
                relocation_geojson=proc_reloc / "ml_block_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "ml_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "ml_ahp_weights.csv",
                factors_csv=proc_reloc / "ml_relocation_factor_contributions.csv"
            ),
            "chhattisgarh": StateMetadata(
                id="chhattisgarh",
                code="CG",
                name="Chhattisgarh",
                admin_unit_name="Taluka",
                admin_unit_plural="Talukas",
                district_count=33,
                admin_unit_count=149,
                is_coastal=False,
                districts_geojson=proc_admin / "chhattisgarh_33_districts.geojson",
                admin_units_geojson=proc_admin / "chhattisgarh_talukas.geojson",
                census_csv=proc_census / "chhattisgarh_taluka_demographics.csv",
                hazard_csv=proc_haz / "chhattisgarh_taluka_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "chhattisgarh_taluka_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "chhattisgarh_taluka_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "chhattisgarh_taluka_vulnerability.geojson",
                capacity_components_csv=proc_cap / "chhattisgarh_taluka_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "chhattisgarh_taluka_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "chhattisgarh_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "chhattisgarh_taluka_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "chhattisgarh_taluka_relocation_priority.csv",
                relocation_geojson=proc_reloc / "chhattisgarh_taluka_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "chhattisgarh_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "chhattisgarh_ahp_weights.csv",
                factors_csv=proc_reloc / "chhattisgarh_relocation_factor_contributions.csv"
            ),
            "gujarat": StateMetadata(
                id="gujarat",
                code="GJ",
                name="Gujarat",
                admin_unit_name="Taluka",
                admin_unit_plural="Talukas",
                district_count=33,
                admin_unit_count=248,
                is_coastal=True,
                districts_geojson=proc_admin / "gujarat_33_districts.geojson",
                admin_units_geojson=proc_admin / "gujarat_talukas.geojson",
                census_csv=proc_census / "gujarat_taluka_demographics.csv",
                hazard_csv=proc_haz / "gujarat_taluka_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "gujarat_taluka_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "gujarat_taluka_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "gujarat_taluka_vulnerability.geojson",
                capacity_components_csv=proc_cap / "gujarat_taluka_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "gujarat_taluka_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "gujarat_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "gujarat_taluka_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "gujarat_taluka_relocation_priority.csv",
                relocation_geojson=proc_reloc / "gujarat_taluka_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "gujarat_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "gujarat_ahp_weights.csv",
                factors_csv=proc_reloc / "gujarat_relocation_factor_contributions.csv"
            ),
            "haryana": StateMetadata(
                id="haryana",
                code="HR",
                name="Haryana",
                admin_unit_name="Taluka",
                admin_unit_plural="Talukas",
                district_count=22,
                admin_unit_count=94,
                is_coastal=False,
                districts_geojson=proc_admin / "haryana_22_districts.geojson",
                admin_units_geojson=proc_admin / "haryana_talukas.geojson",
                census_csv=proc_census / "haryana_taluka_demographics.csv",
                hazard_csv=proc_haz / "haryana_taluka_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "haryana_taluka_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "haryana_taluka_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "haryana_taluka_vulnerability.geojson",
                capacity_components_csv=proc_cap / "haryana_taluka_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "haryana_taluka_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "haryana_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "haryana_taluka_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "haryana_taluka_relocation_priority.csv",
                relocation_geojson=proc_reloc / "haryana_taluka_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "haryana_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "haryana_ahp_weights.csv",
                factors_csv=proc_reloc / "haryana_relocation_factor_contributions.csv"
            ),
            "kerala": StateMetadata(
                id="kerala",
                code="KL",
                name="Kerala",
                admin_unit_name="Taluk",
                admin_unit_plural="Taluks",
                district_count=14,
                admin_unit_count=78,
                is_coastal=True,
                districts_geojson=proc_admin / "kerala_14_districts.geojson",
                admin_units_geojson=proc_admin / "kerala_taluks.geojson",
                census_csv=proc_census / "kerala_taluka_demographics.csv",
                hazard_csv=proc_haz / "kerala_taluka_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "kerala_taluka_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "kerala_taluka_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "kerala_taluka_vulnerability.geojson",
                capacity_components_csv=proc_cap / "kerala_taluka_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "kerala_taluka_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "kerala_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "kerala_taluka_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "kerala_taluka_relocation_priority.csv",
                relocation_geojson=proc_reloc / "kerala_taluka_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "kerala_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "kerala_ahp_weights.csv",
                factors_csv=proc_reloc / "kerala_relocation_factor_contributions.csv"
            ),
            "maharashtra": StateMetadata(
                id="maharashtra",
                code="MH",
                name="Maharashtra",
                admin_unit_name="Taluka",
                admin_unit_plural="Talukas",
                district_count=36,
                admin_unit_count=355,
                is_coastal=True,
                districts_geojson=proc_admin / "maharashtra_36_districts.geojson",
                admin_units_geojson=proc_admin / "maharashtra_talukas.geojson",
                census_csv=proc_census / "maharashtra_taluka_demographics.csv",
                hazard_csv=proc_haz / "maharashtra_taluka_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "maharashtra_taluka_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "maharashtra_taluka_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "maharashtra_taluka_vulnerability.geojson",
                capacity_components_csv=proc_cap / "maharashtra_taluka_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "maharashtra_taluka_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "maharashtra_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "maharashtra_taluka_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "maharashtra_taluka_relocation_priority.csv",
                relocation_geojson=proc_reloc / "maharashtra_taluka_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "maharashtra_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "maharashtra_ahp_weights.csv",
                factors_csv=proc_reloc / "maharashtra_relocation_factor_contributions.csv"
            ),
            "punjab": StateMetadata(
                id="punjab",
                code="PB",
                name="Punjab",
                admin_unit_name="Taluka",
                admin_unit_plural="Talukas",
                district_count=23,
                admin_unit_count=93,
                is_coastal=False,
                districts_geojson=proc_admin / "punjab_23_districts.geojson",
                admin_units_geojson=proc_admin / "punjab_talukas.geojson",
                census_csv=proc_census / "punjab_taluka_demographics.csv",
                hazard_csv=proc_haz / "punjab_taluka_multi_hazard_exposure.csv",
                hazard_geojson=proc_haz / "punjab_taluka_multi_hazard_exposure.geojson",
                vulnerability_csv=proc_vuln / "punjab_taluka_demographic_vulnerability.csv",
                vulnerability_geojson=proc_vuln / "punjab_taluka_vulnerability.geojson",
                capacity_components_csv=proc_cap / "punjab_taluka_capacity_components.csv",
                capacity_adequacy_csv=proc_cap / "punjab_taluka_capacity_adequacy.csv",
                host_candidates_csv=proc_cap / "punjab_host_zone_candidates.csv",
                capacity_geojson=proc_cap / "punjab_taluka_capacity_adequacy.geojson",
                relocation_csv=proc_reloc / "punjab_taluka_relocation_priority.csv",
                relocation_geojson=proc_reloc / "punjab_taluka_relocation_priority.geojson",
                relocation_summary_csv=proc_reloc / "punjab_relocation_priority_summary.csv",
                ahp_weights_csv=proc_reloc / "punjab_ahp_weights.csv",
                factors_csv=proc_reloc / "punjab_relocation_factor_contributions.csv"
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
