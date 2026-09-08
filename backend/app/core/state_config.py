from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional
from pathlib import Path
from app.core.config import settings

@dataclass
class StateConfig:
    state_id: str
    state_name: str
    state_code: str
    admin_unit_singular: str  # "Mandal" or "Taluka"
    admin_unit_plural: str    # "Mandals" or "Talukas"
    district_count: int
    admin_unit_count: int
    center_coords: Tuple[float, float]
    bounding_box: Tuple[Tuple[float, float], Tuple[float, float]]
    
    # Dataset Filenames
    districts_geojson_filename: str
    admin_units_geojson_filename: str
    demographics_csv_filename: str
    hazard_csv_filename: str
    hazard_geojson_filename: str
    vulnerability_csv_filename: str
    vulnerability_geojson_filename: str
    capacity_csv_filename: str
    capacity_geojson_filename: str
    host_candidates_csv_filename: str
    relocation_priority_csv_filename: str
    relocation_factors_csv_filename: str
    relocation_geojson_filename: str
    ahp_weights_csv_filename: str

SUPPORTED_STATES: Dict[str, StateConfig] = {
    "ap": StateConfig(
        state_id="ap",
        state_name="Andhra Pradesh",
        state_code="AP",
        admin_unit_singular="Mandal",
        admin_unit_plural="Mandals",
        district_count=26,
        admin_unit_count=696,
        center_coords=(15.9129, 79.74),
        bounding_box=((12.6, 76.7), (19.2, 84.8)),
        districts_geojson_filename="andhra_pradesh_26_districts.geojson",
        admin_units_geojson_filename="ap_mandal_multi_hazard_exposure.geojson",
        demographics_csv_filename="ap_village_demographics.csv",
        hazard_csv_filename="mandal_multi_hazard_exposure.csv",
        hazard_geojson_filename="ap_mandal_multi_hazard_exposure.geojson",
        vulnerability_csv_filename="mandal_demographic_vulnerability.csv",
        vulnerability_geojson_filename="ap_mandal_vulnerability.geojson",
        capacity_csv_filename="mandal_capacity_components.csv",
        capacity_geojson_filename="ap_mandal_capacity_components.geojson",
        host_candidates_csv_filename="host_zone_candidates.csv",
        relocation_priority_csv_filename="mandal_relocation_priority.csv",
        relocation_factors_csv_filename="relocation_factor_contributions.csv",
        relocation_geojson_filename="ap_mandal_relocation_priority.geojson",
        ahp_weights_csv_filename="ahp_weights.csv"
    ),
    "gujarat": StateConfig(
        state_id="gujarat",
        state_name="Gujarat",
        state_code="GJ",
        admin_unit_singular="Taluka",
        admin_unit_plural="Talukas",
        district_count=33,
        admin_unit_count=252,
        center_coords=(22.2587, 71.1924),
        bounding_box=((20.0, 68.0), (24.8, 74.6)),
        districts_geojson_filename="gujarat_33_districts.geojson",
        admin_units_geojson_filename="gujarat_talukas.geojson",
        demographics_csv_filename="gujarat_taluka_demographics.csv",
        hazard_csv_filename="gujarat_taluka_multi_hazard_exposure.csv",
        hazard_geojson_filename="gujarat_taluka_multi_hazard_exposure.geojson",
        vulnerability_csv_filename="gujarat_taluka_demographic_vulnerability.csv",
        vulnerability_geojson_filename="gujarat_taluka_vulnerability.geojson",
        capacity_csv_filename="gujarat_taluka_capacity_components.csv",
        capacity_geojson_filename="gujarat_taluka_capacity_components.geojson",
        host_candidates_csv_filename="gujarat_host_zone_candidates.csv",
        relocation_priority_csv_filename="gujarat_taluka_relocation_priority.csv",
        relocation_factors_csv_filename="gujarat_relocation_factor_contributions.csv",
        relocation_geojson_filename="gujarat_taluka_relocation_priority.geojson",
        ahp_weights_csv_filename="gujarat_ahp_weights.csv"
    ),
    "kerala": StateConfig(
        state_id="kerala",
        state_name="Kerala",
        state_code="KL",
        admin_unit_singular="Taluk",
        admin_unit_plural="Taluks",
        district_count=14,
        admin_unit_count=61,
        center_coords=(10.45, 76.35),
        bounding_box=((8.25, 74.85), (12.85, 77.45)),
        districts_geojson_filename="kerala_14_districts.geojson",
        admin_units_geojson_filename="kerala_taluks.geojson",
        demographics_csv_filename="kerala_taluka_demographics.csv",
        hazard_csv_filename="kerala_taluka_multi_hazard_exposure.csv",
        hazard_geojson_filename="kerala_taluka_multi_hazard_exposure.geojson",
        vulnerability_csv_filename="kerala_taluka_demographic_vulnerability.csv",
        vulnerability_geojson_filename="kerala_taluka_vulnerability.geojson",
        capacity_csv_filename="kerala_taluka_capacity_components.csv",
        capacity_geojson_filename="kerala_taluka_capacity_components.geojson",
        host_candidates_csv_filename="kerala_host_zone_candidates.csv",
        relocation_priority_csv_filename="kerala_taluka_relocation_priority.csv",
        relocation_factors_csv_filename="kerala_relocation_factor_contributions.csv",
        relocation_geojson_filename="kerala_taluka_relocation_priority.geojson",
        ahp_weights_csv_filename="kerala_ahp_weights.csv"
    ),
    "maharashtra": StateConfig(
        state_id="maharashtra",
        state_name="Maharashtra",
        state_code="MH",
        admin_unit_singular="Taluka",
        admin_unit_plural="Talukas",
        district_count=35,
        admin_unit_count=317,
        center_coords=(19.75, 75.71),
        bounding_box=((15.60, 72.60), (22.05, 80.95)),
        districts_geojson_filename="maharashtra_35_districts.geojson",
        admin_units_geojson_filename="maharashtra_talukas.geojson",
        demographics_csv_filename="maharashtra_taluka_demographics.csv",
        hazard_csv_filename="maharashtra_taluka_multi_hazard_exposure.csv",
        hazard_geojson_filename="maharashtra_taluka_multi_hazard_exposure.geojson",
        vulnerability_csv_filename="maharashtra_taluka_demographic_vulnerability.csv",
        vulnerability_geojson_filename="maharashtra_taluka_vulnerability.geojson",
        capacity_csv_filename="maharashtra_taluka_capacity_components.csv",
        capacity_geojson_filename="maharashtra_taluka_capacity_components.geojson",
        host_candidates_csv_filename="maharashtra_host_zone_candidates.csv",
        relocation_priority_csv_filename="maharashtra_taluka_relocation_priority.csv",
        relocation_factors_csv_filename="maharashtra_relocation_factor_contributions.csv",
        relocation_geojson_filename="maharashtra_taluka_relocation_priority.geojson",
        ahp_weights_csv_filename="maharashtra_ahp_weights.csv"
    ),
    "haryana": StateConfig(
        state_id="haryana",
        state_name="Haryana",
        state_code="HR",
        admin_unit_singular="Tehsil",
        admin_unit_plural="Tehsils",
        district_count=22,
        admin_unit_count=45,
        center_coords=(29.0588, 76.0856),
        bounding_box=((27.65, 74.47), (30.93, 77.60)),
        districts_geojson_filename="haryana_22_districts.geojson",
        admin_units_geojson_filename="haryana_tehsils.geojson",
        demographics_csv_filename="haryana_taluka_demographics.csv",
        hazard_csv_filename="haryana_taluka_multi_hazard_exposure.csv",
        hazard_geojson_filename="haryana_taluka_multi_hazard_exposure.geojson",
        vulnerability_csv_filename="haryana_taluka_demographic_vulnerability.csv",
        vulnerability_geojson_filename="haryana_taluka_vulnerability.geojson",
        capacity_csv_filename="haryana_taluka_capacity_components.csv",
        capacity_geojson_filename="haryana_taluka_capacity_components.geojson",
        host_candidates_csv_filename="haryana_host_zone_candidates.csv",
        relocation_priority_csv_filename="haryana_taluka_relocation_priority.csv",
        relocation_factors_csv_filename="haryana_relocation_factor_contributions.csv",
        relocation_geojson_filename="haryana_taluka_relocation_priority.geojson",
        ahp_weights_csv_filename="haryana_ahp_weights.csv"
    ),
    "punjab": StateConfig(
        state_id="punjab",
        state_name="Punjab",
        state_code="PB",
        admin_unit_singular="Tehsil",
        admin_unit_plural="Tehsils",
        district_count=23,
        admin_unit_count=45,
        center_coords=(31.1471, 75.3412),
        bounding_box=((29.54, 73.88), (32.66, 76.95)),
        districts_geojson_filename="punjab_23_districts.geojson",
        admin_units_geojson_filename="punjab_tehsils.geojson",
        demographics_csv_filename="punjab_taluka_demographics.csv",
        hazard_csv_filename="punjab_taluka_multi_hazard_exposure.csv",
        hazard_geojson_filename="punjab_taluka_multi_hazard_exposure.geojson",
        vulnerability_csv_filename="punjab_taluka_demographic_vulnerability.csv",
        vulnerability_geojson_filename="punjab_taluka_vulnerability.geojson",
        capacity_csv_filename="punjab_taluka_capacity_components.csv",
        capacity_geojson_filename="punjab_taluka_capacity_components.geojson",
        host_candidates_csv_filename="punjab_host_zone_candidates.csv",
        relocation_priority_csv_filename="punjab_taluka_relocation_priority.csv",
        relocation_factors_csv_filename="punjab_relocation_factor_contributions.csv",
        relocation_geojson_filename="punjab_taluka_relocation_priority.geojson",
        ahp_weights_csv_filename="punjab_ahp_weights.csv"
    ),
    "chhattisgarh": StateConfig(
        state_id="chhattisgarh",
        state_name="Chhattisgarh",
        state_code="CG",
        admin_unit_singular="Tehsil",
        admin_unit_plural="Tehsils",
        district_count=33,
        admin_unit_count=58,
        center_coords=(21.2787, 81.8661),
        bounding_box=((17.78, 80.24), (24.10, 84.40)),
        districts_geojson_filename="chhattisgarh_33_districts.geojson",
        admin_units_geojson_filename="chhattisgarh_tehsils.geojson",
        demographics_csv_filename="chhattisgarh_taluka_demographics.csv",
        hazard_csv_filename="chhattisgarh_taluka_multi_hazard_exposure.csv",
        hazard_geojson_filename="chhattisgarh_taluka_multi_hazard_exposure.geojson",
        vulnerability_csv_filename="chhattisgarh_taluka_demographic_vulnerability.csv",
        vulnerability_geojson_filename="chhattisgarh_taluka_vulnerability.geojson",
        capacity_csv_filename="chhattisgarh_taluka_capacity_components.csv",
        capacity_geojson_filename="chhattisgarh_taluka_capacity_components.geojson",
        host_candidates_csv_filename="chhattisgarh_host_zone_candidates.csv",
        relocation_priority_csv_filename="chhattisgarh_taluka_relocation_priority.csv",
        relocation_factors_csv_filename="chhattisgarh_relocation_factor_contributions.csv",
        relocation_geojson_filename="chhattisgarh_taluka_relocation_priority.geojson",
        ahp_weights_csv_filename="chhattisgarh_ahp_weights.csv"
    )
}

# Alias map for normalized state identifiers
STATE_ALIASES = {
    "andhra pradesh": "ap",
    "andhra_pradesh": "ap",
    "andhra": "ap",
    "ap": "ap",
    "gujarat": "gujarat",
    "gj": "gujarat",
    "guj": "gujarat",
    "kerala": "kerala",
    "kerela": "kerala",
    "kl": "kerala",
    "maharashtra": "maharashtra",
    "maharastra": "maharashtra",
    "mh": "maharashtra",
    "haryana": "haryana",
    "hr": "haryana",
    "punjab": "punjab",
    "pb": "punjab",
    "chhattisgarh": "chhattisgarh",
    "chhatisgarh": "chhattisgarh",
    "chattisgarh": "chhattisgarh",
    "cg": "chhattisgarh",
    "ct": "chhattisgarh"
}

def resolve_state_config(state_key: Optional[str] = None) -> StateConfig:
    """
    Resolves the StateConfig for a given state string (defaulting to 'ap' for backward compatibility).
    """
    if not state_key:
        return SUPPORTED_STATES["ap"]
    
    clean_key = state_key.strip().lower().replace("-", "_").replace(" ", "_")
    normalized_id = STATE_ALIASES.get(clean_key, clean_key)
    
    if normalized_id in SUPPORTED_STATES:
        return SUPPORTED_STATES[normalized_id]
        
    return SUPPORTED_STATES["ap"]
