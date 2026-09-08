"""
RakshaSethu - State Configuration and Adapter Registry
Provides state-agnostic resolution of active state configurations,
datasets, and administrative unit schemas (Mandals / Taluks / Tehsils).
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel


class StateDataConfig(BaseModel):
    state_id: str
    state_key: str
    state_name: str
    state_code: str
    admin_unit_name: str
    admin_unit_plural: str
    is_coastal: bool
    districts_file: str
    mandals_file: str
    demographics_file: str
    hazard_csv: str
    hazard_geojson: str
    vuln_csv: str
    vuln_geojson: str
    capacity_components_csv: str
    capacity_adequacy_csv: str
    capacity_adequacy_geojson: str
    host_candidates_csv: str
    bottlenecks_csv: str
    relocation_csv: str
    relocation_geojson: str
    relocation_factors_csv: str
    ahp_weights_csv: str
    relocation_summary_csv: str
    code_col: str
    name_col: str
    m_code_col: str
    m_name_col: str


STATE_REGISTRY: Dict[str, StateDataConfig] = {
    "ap": StateDataConfig(
        state_id="andhra_pradesh",
        state_key="ap",
        state_name="Andhra Pradesh",
        state_code="AP",
        admin_unit_name="Mandal",
        admin_unit_plural="Mandals",
        is_coastal=True,
        districts_file="andhra_pradesh_26_districts.geojson",
        mandals_file="AndhraPradesh_Mandals.geojson",
        demographics_file="ap_village_demographics.csv",
        hazard_csv="mandal_multi_hazard_exposure.csv",
        hazard_geojson="ap_mandal_multi_hazard_exposure.geojson",
        vuln_csv="mandal_demographic_vulnerability.csv",
        vuln_geojson="ap_mandal_vulnerability.geojson",
        capacity_components_csv="mandal_capacity_components.csv",
        capacity_adequacy_csv="mandal_capacity_adequacy.csv",
        capacity_adequacy_geojson="ap_mandal_capacity_adequacy.geojson",
        host_candidates_csv="host_zone_candidates.csv",
        bottlenecks_csv="mandal_bottlenecks.csv",
        relocation_csv="mandal_relocation_priority.csv",
        relocation_geojson="ap_mandal_relocation_priority.geojson",
        relocation_factors_csv="relocation_factor_contributions.csv",
        ahp_weights_csv="ahp_weights.csv",
        relocation_summary_csv="relocation_priority_summary.csv",
        code_col="current_district_code",
        name_col="current_district_name",
        m_code_col="mandal_code",
        m_name_col="mandal_name",
    ),
    "tn": StateDataConfig(
        state_id="tamil_nadu",
        state_key="tn",
        state_name="Tamil Nadu",
        state_code="TN",
        admin_unit_name="Taluk",
        admin_unit_plural="Taluks",
        is_coastal=True,
        districts_file="tamil_nadu_38_districts.geojson",
        mandals_file="tamil_nadu_taluks.geojson",
        demographics_file="tn_taluk_demographics.csv",
        hazard_csv="tn_taluk_multi_hazard_exposure.csv",
        hazard_geojson="tn_taluk_multi_hazard_exposure.geojson",
        vuln_csv="tn_taluk_demographic_vulnerability.csv",
        vuln_geojson="tn_taluk_vulnerability.geojson",
        capacity_components_csv="tn_taluk_capacity_components.csv",
        capacity_adequacy_csv="tn_taluk_capacity_adequacy.csv",
        capacity_adequacy_geojson="tn_taluk_capacity_adequacy.geojson",
        host_candidates_csv="tn_host_zone_candidates.csv",
        bottlenecks_csv="tn_taluk_capacity_adequacy.csv",
        relocation_csv="tn_taluk_relocation_priority.csv",
        relocation_geojson="tn_taluk_relocation_priority.geojson",
        relocation_factors_csv="tn_relocation_factor_contributions.csv",
        ahp_weights_csv="tn_ahp_weights.csv",
        relocation_summary_csv="tn_relocation_priority_summary.csv",
        code_col="current_district_id",
        name_col="current_district_name",
        m_code_col="taluk_id",
        m_name_col="taluk_name",
    ),
    "jk": StateDataConfig(
        state_id="jammu_kashmir",
        state_key="jk",
        state_name="Jammu and Kashmir",
        state_code="JK",
        admin_unit_name="Tehsil",
        admin_unit_plural="Tehsils",
        is_coastal=False,
        districts_file="jammu_kashmir_20_districts.geojson",
        mandals_file="jammu_kashmir_tehsils.geojson",
        demographics_file="jk_tehsil_demographics.csv",
        hazard_csv="jk_tehsil_multi_hazard_exposure.csv",
        hazard_geojson="jk_tehsil_multi_hazard_exposure.geojson",
        vuln_csv="jk_tehsil_demographic_vulnerability.csv",
        vuln_geojson="jk_tehsil_vulnerability.geojson",
        capacity_components_csv="jk_tehsil_capacity_components.csv",
        capacity_adequacy_csv="jk_tehsil_capacity_adequacy.csv",
        capacity_adequacy_geojson="jk_tehsil_capacity_adequacy.geojson",
        host_candidates_csv="jk_host_zone_candidates.csv",
        bottlenecks_csv="jk_tehsil_capacity_adequacy.csv",
        relocation_csv="jk_tehsil_relocation_priority.csv",
        relocation_geojson="jk_tehsil_relocation_priority.geojson",
        relocation_factors_csv="jk_relocation_factor_contributions.csv",
        ahp_weights_csv="jk_ahp_weights.csv",
        relocation_summary_csv="jk_relocation_priority_summary.csv",
        code_col="current_district_id",
        name_col="current_district_name",
        m_code_col="taluk_id",
        m_name_col="taluk_name",
    ),
    "mp": StateDataConfig(
        state_id="madhya_pradesh",
        state_key="mp",
        state_name="Madhya Pradesh",
        state_code="MP",
        admin_unit_name="Tehsil",
        admin_unit_plural="Tehsils",
        is_coastal=False,
        districts_file="madhya_pradesh_52_districts.geojson",
        mandals_file="madhya_pradesh_tehsils.geojson",
        demographics_file="mp_tehsil_demographics.csv",
        hazard_csv="mp_tehsil_multi_hazard_exposure.csv",
        hazard_geojson="mp_tehsil_multi_hazard_exposure.geojson",
        vuln_csv="mp_tehsil_demographic_vulnerability.csv",
        vuln_geojson="mp_tehsil_vulnerability.geojson",
        capacity_components_csv="mp_tehsil_capacity_components.csv",
        capacity_adequacy_csv="mp_tehsil_capacity_adequacy.csv",
        capacity_adequacy_geojson="mp_tehsil_capacity_adequacy.geojson",
        host_candidates_csv="mp_host_zone_candidates.csv",
        bottlenecks_csv="mp_tehsil_capacity_adequacy.csv",
        relocation_csv="mp_tehsil_relocation_priority.csv",
        relocation_geojson="mp_tehsil_relocation_priority.geojson",
        relocation_factors_csv="mp_relocation_factor_contributions.csv",
        ahp_weights_csv="mp_ahp_weights.csv",
        relocation_summary_csv="mp_relocation_priority_summary.csv",
        code_col="current_district_id",
        name_col="current_district_name",
        m_code_col="taluk_id",
        m_name_col="taluk_name",
    ),
}


def resolve_state_key(state_id: Optional[str]) -> str:
    """
    Resolves arbitrary state identifiers to standardized state keys ('ap', 'tn', 'jk', 'mp').
    Default fallback: 'ap' (Andhra Pradesh pilot).
    """
    if not state_id:
        return "ap"
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    if clean in ["tamil_nadu", "tn", "tamilnadu"]:
        return "tn"
    if clean in ["jammu_kashmir", "jammu_and_kashmir", "jk", "j_k", "jammukashmir"]:
        return "jk"
    if clean in ["madhya_pradesh", "mp", "madhyapradesh"]:
        return "mp"
    return "ap"


def get_state_config(state_id: Optional[str]) -> StateDataConfig:
    """
    Returns the typed StateDataConfig for the given state_id.
    """
    key = resolve_state_key(state_id)
    return STATE_REGISTRY[key]
