from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from app.core.config import settings
from app.decision.schemas import (
    CapacityGapAssessment,
    ActionPlanItem,
    ActionPlanResponse,
    SourceHostComparisonResponse,
    ActionDashboardSummary,
)

from app.core.state_registry import state_registry, get_state_key

def resolve_state_key(state_id: Optional[str]) -> str:
    return get_state_key(state_id)

def is_mizoram(state_id: Optional[str]) -> bool:
    return get_state_key(state_id) == "mizoram"

def is_hp(state_id: Optional[str]) -> bool:
    return get_state_key(state_id) == "himachal_pradesh"

def is_jk(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["jammu_kashmir", "jammu_and_kashmir", "jk", "j_k", "jammukashmir"]

def is_mp(state_id: Optional[str]) -> bool:
    if not state_id:
        return False
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    return clean in ["madhya_pradesh", "mp", "madhyapradesh"]
class DecisionService:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _normalize_df(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        for id_col in ["circle_id", "block_id", "tehsil_id", "taluk_id", "taluka_id", "subdivision_id"]:
            if "mandal_id" not in df.columns and id_col in df.columns:
                df["mandal_id"] = df[id_col]
        for name_col in ["circle_name", "block_name", "tehsil_name", "taluk_name", "taluka_name", "subdivision_name"]:
            if "mandal_name" not in df.columns and name_col in df.columns:
                df["mandal_name"] = df[name_col]
        if "population_total" not in df.columns and "total_population" in df.columns:
            df["population_total"] = df["total_population"]
        if "current_district_name" not in df.columns and "district_name" in df.columns:
            df["current_district_name"] = df["district_name"]
        if "current_district_id" not in df.columns and "district_id" in df.columns:
            df["current_district_id"] = df["district_id"]
        return df

    def _get_state_key(self, state_id: Optional[str]) -> str:
        return get_state_key(state_id)

    def _load_data(self, state_id: Optional[str] = "andhra_pradesh"):
        key = get_state_key(state_id)
        if key in self._cache:
            return self._cache[key]

        meta = state_registry.get_state(key)
        reloc_csv = meta.relocation_csv
        cap_csv = meta.capacity_adequacy_csv
        hosts_csv = meta.host_candidates_csv

        reloc_dir = settings.DATA_DIR / "processed" / "relocation"
        cap_dir = settings.DATA_DIR / "processed" / "capacity"

        if not reloc_csv or not reloc_csv.exists():
            reloc_csv = reloc_dir / f"{key}_relocation_priority.csv" if (reloc_dir / f"{key}_relocation_priority.csv").exists() else reloc_dir / "mandal_relocation_priority.csv"
        if not cap_csv or not cap_csv.exists():
            cap_csv = cap_dir / f"{key}_capacity_adequacy.csv" if (cap_dir / f"{key}_capacity_adequacy.csv").exists() else cap_dir / "mandal_capacity_adequacy.csv"
        if not hosts_csv or not hosts_csv.exists():
            hosts_csv = cap_dir / f"{key}_host_zone_candidates.csv" if (cap_dir / f"{key}_host_zone_candidates.csv").exists() else cap_dir / "host_zone_candidates.csv"

        if not reloc_csv or not cap_csv or not hosts_csv or not reloc_csv.exists() or not cap_csv.exists() or not hosts_csv.exists():
            raise FileNotFoundError(f"Required processed datasets (relocation, capacity, host_candidates) not found for {key}.")

        data = {
            "reloc_df": self._normalize_df(pd.read_csv(reloc_csv)),
            "cap_df": self._normalize_df(pd.read_csv(cap_csv)),
            "hosts_df": pd.read_csv(hosts_csv)
        }
        self._cache[key] = data
        return data

    def _find_mandal(self, df: pd.DataFrame, mandal_id: str) -> Optional[pd.Series]:
        target = mandal_id.strip().upper()
        match = df[(df["mandal_id"].astype(str).str.upper() == target) | (df["mandal_name"].astype(str).str.upper() == target)]
        if match.empty and "taluka_id" in df.columns:
            match = df[(df["taluka_id"].astype(str).str.upper() == target) | (df["taluka_name"].astype(str).str.upper() == target)]
        if not match.empty:
            return match.iloc[0]
        return None

    def get_capacity_gap_assessment(
        self,
        mandal_id: str,
        state_id: Optional[str] = None,
        state: Optional[str] = None,
    ) -> Optional[CapacityGapAssessment]:
        target = mandal_id.strip().upper()
        if target.startswith("WB_"):
            detected_state = "west_bengal"
        elif target.startswith("BR_"):
            detected_state = "bihar"
        elif target.startswith("AS_"):
            detected_state = "assam"
        elif target.startswith("TN_"):
            detected_state = "tamil_nadu"
        elif target.startswith("OD_"):
            detected_state = "odisha"
        elif target.startswith("UP_"):
            detected_state = "uttar_pradesh"
        elif target.startswith("UK_"):
            detected_state = "uttarakhand"
        elif target.startswith("SK_"):
            detected_state = "sikkim"
        elif target.startswith("AR_"):
            detected_state = "arunachal_pradesh"
        elif target.startswith("NL_"):
            detected_state = "nagaland"
        elif target.startswith("ML_"):
            detected_state = "meghalaya"
        elif target.startswith("MZ_"):
            detected_state = "mizoram"
        elif target.startswith("HP_"):
            detected_state = "himachal_pradesh"
        elif target.startswith("JK_"):
            detected_state = "jammu_kashmir"
        elif target.startswith("MP_"):
            detected_state = "madhya_pradesh"
        elif target.startswith("GJ_"):
            detected_state = "gujarat"
        elif target.startswith("KL_"):
            detected_state = "kerala"
        elif target.startswith("MH_"):
            detected_state = "maharashtra"
        elif target.startswith("HR_"):
            detected_state = "haryana"
        elif target.startswith("PB_"):
            detected_state = "punjab"
        elif target.startswith("CG_"):
            detected_state = "chhattisgarh"
        else:
            detected_state = state_id or state or "andhra_pradesh"

        data = self._load_data(detected_state)
        r_row = self._find_mandal(data["reloc_df"], mandal_id)
        c_row = self._find_mandal(data["cap_df"], mandal_id)

        if r_row is None or c_row is None:
            all_states = [
                "andhra_pradesh", "mizoram", "himachal_pradesh", "jammu_kashmir", "madhya_pradesh",
                "tamil_nadu", "assam", "bihar", "west_bengal", "odisha", "uttar_pradesh",
                "uttarakhand", "sikkim", "arunachal_pradesh", "nagaland", "meghalaya",
                "gujarat", "kerala", "maharashtra", "haryana", "punjab", "chhattisgarh"
            ]
            for s in all_states:
                if s == detected_state:
                    continue
                try:
                    s_data = self._load_data(s)
                    r_row = self._find_mandal(s_data["reloc_df"], mandal_id) or r_row
                    c_row = self._find_mandal(s_data["cap_df"], mandal_id) or c_row
                    if r_row is not None and c_row is not None:
                        break
                except Exception:
                    pass

        if r_row is None or c_row is None:
            return None

        pop = int(c_row.get("population_total", 0))
        m_id = str(c_row.get("mandal_id", mandal_id))
        m_name = str(c_row.get("mandal_name", "Unknown"))
        d_name = str(c_row.get("current_district_name", "Unknown"))

        # 1. Shelter Gap
        shelter_cap = c_row.get("verified_shelter_capacity_persons")
        shelter_gap_persons = None
        if pd.isna(shelter_cap) or shelter_cap is None:
            shelter_gap_status = "NON_APPLICABLE_OR_INSUFFICIENT_DATA"
            shelter_note = "No designated cyclone multi-purpose shelters recorded; inland riverine or non-cyclone zone."
            shelter_cap_val = None
        else:
            shelter_cap_val = int(shelter_cap)
            indicative_shelter_need = int(pop * 0.15)
            shelter_gap_persons = max(0, indicative_shelter_need - shelter_cap_val)
            shelter_gap_status = "DEFICIT_IDENTIFIED" if shelter_gap_persons > 0 else "ADEQUATE"
            shelter_note = f"Verified capacity: {shelter_cap_val:,} persons. Indicative planning deficit (15% surge/flood target): {shelter_gap_persons:,} persons."

        # 2. Health Bed Gap
        normative_bed_target = round((pop / 1000.0) * 1.0, 1)
        actual_beds = c_row.get("normative_health_capacity_baseline") or c_row.get("normative_health_beds")
        if pd.isna(actual_beds) or actual_beds is None:
            health_beds_norm = None
            health_deficit = None
            health_gap_status = "INSUFFICIENT_DATA"
            health_note = "Health bed inventory data unavailable."
        else:
            health_beds_norm = float(actual_beds)
            health_deficit = max(0.0, round(normative_bed_target - health_beds_norm, 1))
            health_gap_status = "DEFICIT_IDENTIFIED" if health_deficit > 0 else "ADEQUATE"
            health_note = f"Baseline beds: {health_beds_norm:.0f}. Normative requirement (1 bed/1k): {normative_bed_target:.0f}. Gap: {health_deficit:.0f} beds."

        # 3. Safe Land Gap
        safe_sqkm = c_row.get("safe_area_sqkm") or (c_row.get("safe_area_fraction", 0.9) * 350.0)
        safe_m2_per_person = c_row.get("safe_area_m2_per_person")
        if pd.isna(safe_m2_per_person) or safe_m2_per_person is None or pop <= 0:
            safe_sqkm_val = None
            safe_m2_val = None
            safe_deficit_sqkm = None
            safe_gap_status = "INSUFFICIENT_DATA"
            safe_note = "Safe habitable land area not computed."
        else:
            safe_sqkm_val = round(float(safe_sqkm), 2)
            safe_m2_val = round(float(safe_m2_per_person), 1)
            sphere_required_sqkm = (pop * 45.0) / 1_000_000.0
            safe_deficit_sqkm = max(0.0, round(sphere_required_sqkm - safe_sqkm_val, 2))
            safe_gap_status = "DEFICIT_IDENTIFIED" if safe_deficit_sqkm > 0 else "ADEQUATE"
            safe_note = f"Safe habitable land: {safe_sqkm_val} km² ({safe_m2_val:.0f} m²/person). Sphere minimum standard: {sphere_required_sqkm:.2f} km²."

        # 4. Water & Sanitation Adequacy
        water_score = c_row.get("water_sanitation_adequacy") or (c_row.get("water_sanitation_adequacy_pct", 85.0) / 100.0)
        water_score_val = round(float(water_score), 3)
        water_gap_status = "DEFICIT_IDENTIFIED" if water_score_val < 0.70 else "ADEQUATE"
        water_note = f"Composite water and sanitation coverage score: {water_score_val * 100:.1f}%."

        # 5. Evacuation Accessibility Constraint
        road_score = c_row.get("road_accessibility_score") or min(1.0, float(c_row.get("road_density_km_per_km2", 1.2)) / 2.0)
        road_score_val = round(float(road_score), 3)
        road_gap_status = "CONSTRAINT_IDENTIFIED" if road_score_val < 0.50 else "ADEQUATE"
        road_note = f"Road density accessibility score: {road_score_val * 100:.1f}%."

        p_bot = str(r_row.get("primary_bottleneck", "health_infrastructure")).replace("_", " ").upper()
        overall_summary = (
            f"Administrative unit {m_name} ({d_name}) has an indicative planning population of {pop:,}. "
            f"The primary physical infrastructure bottleneck is {p_bot}. "
            f"Key deficits include: Health ({health_gap_status}), Safe Land ({safe_gap_status}), and Water/Sanitation ({water_gap_status})."
        )

        notice = (
            "INDICATIVE PLANNING ESTIMATE ONLY. Gaps represent normative benchmarking (IPHS 2022 / Sphere Project) "
            "over Census 2011 baseline data. Ground verification by district disaster authorities is mandatory."
        )

        return CapacityGapAssessment(
            mandal_id=m_id,
            mandal_name=m_name,
            district_name=d_name,
            planning_population=pop,
            shelter_capacity_verified=shelter_cap_val,
            shelter_deficit_persons=shelter_gap_persons,
            shelter_gap_status=shelter_gap_status,
            shelter_note=shelter_note,
            health_beds_normative=health_beds_norm,
            health_beds_deficit=health_deficit,
            health_gap_status=health_gap_status,
            health_note=health_note,
            safe_area_sqkm=safe_sqkm_val,
            safe_area_m2_per_person=safe_m2_val,
            safe_area_deficit_sqkm=safe_deficit_sqkm,
            safe_area_gap_status=safe_gap_status,
            safe_area_note=safe_note,
            water_sanitation_adequacy=water_score_val,
            water_sanitation_gap_status=water_gap_status,
            water_note=water_note,
            road_accessibility_score=road_score_val,
            road_accessibility_gap_status=road_gap_status,
            road_note=road_note,
            overall_gap_summary=overall_summary,
            data_limitations_notice=notice
        )

    def get_action_plan(
        self,
        mandal_id: str,
        state_id: Optional[str] = None,
        state: Optional[str] = None,
    ) -> Optional[ActionPlanResponse]:
        target = mandal_id.strip().upper()
        if target.startswith("WB_"):
            detected_state = "west_bengal"
        elif target.startswith("BR_"):
            detected_state = "bihar"
        elif target.startswith("AS_"):
            detected_state = "assam"
        elif target.startswith("TN_"):
            detected_state = "tamil_nadu"
        elif target.startswith("OD_"):
            detected_state = "odisha"
        elif target.startswith("UP_"):
            detected_state = "uttar_pradesh"
        elif target.startswith("UK_"):
            detected_state = "uttarakhand"
        elif target.startswith("SK_"):
            detected_state = "sikkim"
        elif target.startswith("AR_"):
            detected_state = "arunachal_pradesh"
        elif target.startswith("NL_"):
            detected_state = "nagaland"
        elif target.startswith("ML_"):
            detected_state = "meghalaya"
        elif target.startswith("MZ_"):
            detected_state = "mizoram"
        elif target.startswith("HP_"):
            detected_state = "himachal_pradesh"
        elif target.startswith("JK_"):
            detected_state = "jammu_kashmir"
        elif target.startswith("MP_"):
            detected_state = "madhya_pradesh"
        elif target.startswith("GJ_"):
            detected_state = "gujarat"
        elif target.startswith("KL_"):
            detected_state = "kerala"
        elif target.startswith("MH_"):
            detected_state = "maharashtra"
        elif target.startswith("HR_"):
            detected_state = "haryana"
        elif target.startswith("PB_"):
            detected_state = "punjab"
        elif target.startswith("CG_"):
            detected_state = "chhattisgarh"
        else:
            detected_state = state_id or state or "andhra_pradesh"

        data = self._load_data(detected_state)
        r_row = self._find_mandal(data["reloc_df"], mandal_id)
        c_row = self._find_mandal(data["cap_df"], mandal_id)

        if r_row is None or c_row is None:
            all_states = [
                "andhra_pradesh", "mizoram", "himachal_pradesh", "jammu_kashmir", "madhya_pradesh",
                "tamil_nadu", "assam", "bihar", "west_bengal", "odisha", "uttar_pradesh",
                "uttarakhand", "sikkim", "arunachal_pradesh", "nagaland", "meghalaya",
                "gujarat", "kerala", "maharashtra", "haryana", "punjab", "chhattisgarh"
            ]
            for s in all_states:
                if s == detected_state:
                    continue
                try:
                    s_data = self._load_data(s)
                    r_row = self._find_mandal(s_data["reloc_df"], mandal_id) or r_row
                    c_row = self._find_mandal(s_data["cap_df"], mandal_id) or c_row
                    if r_row is not None and c_row is not None:
                        detected_state = s
                        break
                except Exception:
                    pass

        if r_row is None or c_row is None:
            return None

        state_key = resolve_state_key(detected_state)
        sdma_agency = "State Disaster Management Authority / Revenue Department"
        pwd_agency = "Roads & Buildings Department / District Police"
        health_agency = "Health, Medical & Family Welfare Department"
        wcd_agency = "Women Development & Child Welfare / Anganwadi Network"
        irrigation_agency = "District Administration / Irrigation & Water Resources"
        rws_agency = "Rural Water Supply & Sanitation"
        edu_agency = "School Education Department / Disaster Management Cell"
        rural_agency = "Department of Rural Development & Panchayati Raj"

        if state_key == "bihar":
            sdma_agency = "BSDMA / Disaster Management Department, Bihar"
            pwd_agency = "Bihar RWD / Road Construction Dept / Bihar Police"
            health_agency = "Health Department, Government of Bihar"
            wcd_agency = "Social Welfare Department, Bihar / ICDS Anganwadi"
            irrigation_agency = "Water Resources Department (WRD), Bihar"
            rws_agency = "Public Health Engineering Department (PHED), Bihar"
            edu_agency = "Education Department, Government of Bihar"
        elif state_key == "west_bengal":
            sdma_agency = "WBDMD / Disaster Management & Civil Defence Dept, West Bengal"
            pwd_agency = "West Bengal PWD / Irrigation & Waterways Dept / WB Police"
            health_agency = "Department of Health & Family Welfare, Government of West Bengal"
            wcd_agency = "Department of Women & Child Development and Social Welfare, WB / ICDS"
            irrigation_agency = "Irrigation & Waterways Department (I&WD), West Bengal"
            rws_agency = "Public Health Engineering Department (PHED), West Bengal"
            edu_agency = "School Education Department, Government of West Bengal"
        elif state_key == "assam":
            sdma_agency = "ASDMA / Revenue & Disaster Management Dept"
            pwd_agency = "Assam PWD (Roads) / District Police"
            health_agency = "Health & Family Welfare Department, Assam"
            wcd_agency = "Women & Child Development, Assam / Anganwadi Network"
            irrigation_agency = "Assam Water Resources Department / District Administration"
            rws_agency = "Public Health Engineering Department (PHED), Assam"
            edu_agency = "Elementary / Secondary Education Department, Assam"
        elif state_key == "tamil_nadu":
            sdma_agency = "TNSDMA / Revenue Administration"
            pwd_agency = "TN Highways & Minor Ports / Police"
            health_agency = "TN Health & Family Welfare Department"
            wcd_agency = "Social Welfare & Women Empowerment Dept, TN"
            irrigation_agency = "TN Water Resources Department"
            rws_agency = "TWAD Board / Rural Development & Panchayat Raj"
            edu_agency = "School Education Department, TN"
        elif state_key == "sikkim":
            sdma_agency = "SSDMA / Land Revenue & Disaster Management Dept, Sikkim"
            pwd_agency = "Sikkim Roads & Bridges Dept / BRO Swastik / Sikkim Police"
            health_agency = "Health & Family Welfare Department, Government of Sikkim"
            wcd_agency = "Women & Child Development Department, Sikkim / ICDS"
            irrigation_agency = "Water Resources Department (WRD), Sikkim"
            rws_agency = "Rural Development Department (RDD - Drinking Water & Sanitation), Sikkim"
            edu_agency = "Education Department, Government of Sikkim"
        elif state_key == "arunachal_pradesh":
            sdma_agency = "APSDMA / Department of Disaster Management, Government of Arunachal Pradesh"
            pwd_agency = "Arunachal PWD (Highways) / Border Roads Organisation (BRO) / Police"
            health_agency = "Department of Health & Family Welfare, Government of Arunachal Pradesh"
            wcd_agency = "Department of Social Justice, Empowerment & Tribal Affairs, AP / ICDS"
            irrigation_agency = "Water Resources Department (WRD), Arunachal Pradesh"
            rws_agency = "Public Health Engineering & Water Supply Department (PHE&WS), Arunachal Pradesh"
            edu_agency = "Department of School Education, Government of Arunachal Pradesh"
        elif state_key == "nagaland":
            sdma_agency = "Nagaland State Disaster Management Authority (NSDMA) / Home Department"
            pwd_agency = "Nagaland PWD (Roads & Bridges) / Border Roads Organisation (BRO / Sewak)"
            health_agency = "Department of Health & Family Welfare, Government of Nagaland"
            wcd_agency = "Department of Social Welfare, Nagaland / Anganwadi Network"
            irrigation_agency = "Water Resources Department, Nagaland / Doyang River Basin Authority"
            rws_agency = "Public Health Engineering Department (PHED), Nagaland"
            edu_agency = "Department of School Education, Nagaland"
        elif state_key == "meghalaya":
            sdma_agency = "Meghalaya State Disaster Management Authority (MSDMA) / Revenue & Disaster Management Dept"
            pwd_agency = "Meghalaya PWD (Roads) / NHIDCL / Meghalaya Police"
            health_agency = "Department of Health & Family Welfare, Government of Meghalaya"
            wcd_agency = "Social Welfare Department, Meghalaya / ICDS Anganwadi Network"
            irrigation_agency = "Water Resources Department (WRD), Meghalaya / Soil & Water Conservation Dept"
            rws_agency = "Public Health Engineering Department (PHED), Meghalaya"
            edu_agency = "Education Department, Government of Meghalaya"
        elif state_key in ["mizoram", "mz"]:
            sdma_agency = "Disaster Management & Rehabilitation Dept (DM&R), Government of Mizoram"
            pwd_agency = "Mizoram PWD (Roads) / Border Roads Organisation (BRO Pushpak)"
            health_agency = "Health & Family Welfare Department, Government of Mizoram"
            rural_agency = "Rural Development Department, Government of Mizoram"
        elif state_key in ["jammu_kashmir", "jk"]:
            sdma_agency = "JKDMA / Department of Disaster Management, Relief, Rehabilitation & Reconstruction"
            pwd_agency = "JK PWD (R&B) / Border Roads Organisation (BRO Beacon/Sampark)"
            health_agency = "Health & Medical Education Department, UT of J&K"
            rural_agency = "Department of Rural Development & Panchayati Raj, UT of J&K"
        elif state_key in ["madhya_pradesh", "mp"]:
            sdma_agency = "Madhya Pradesh State Disaster Management Authority (MPSDMA)"
            pwd_agency = "Madhya Pradesh Public Works Department (MPPWD)"
            health_agency = "Public Health and Family Welfare Department, Madhya Pradesh"
            rural_agency = "Panchayat and Rural Development Department, Madhya Pradesh"
        else:
            sdma_agency = "State Disaster Management Authority / Revenue Department"
            pwd_agency = "Roads & Buildings Department / District Police"
            health_agency = "Health, Medical & Family Welfare Department"
            wcd_agency = "Women Development & Child Welfare / Anganwadi Network"
            irrigation_agency = "District Administration / Irrigation & Water Resources"
            rws_agency = "Rural Water Supply & Sanitation"
            edu_agency = "School Education Department / Disaster Management Cell"

        m_id = str(r_row.get("mandal_id", mandal_id))
        m_name = str(r_row.get("mandal_name", "Unknown"))
        d_name = str(r_row.get("current_district_name", "Unknown"))
        reloc_cat = str(r_row.get("relocation_priority_category", "MODERATE"))
        primary_bot = str(r_row.get("primary_bottleneck", "health_infrastructure"))
        secondary_bot = str(c_row.get("secondary_bottleneck", "N/A"))

        haz_exp = float(r_row.get("c1_hazard_exposure", 0.0))
        demo_sens = float(r_row.get("c2_demographic_sensitivity", 0.0))
        cap_stress = float(r_row.get("c3_capacity_stress", 0.0))
        acc_constraint = float(r_row.get("c4_accessibility_constraint", 0.0))

        immediate: List[ActionPlanItem] = []
        short_term: List[ActionPlanItem] = []
        long_term: List[ActionPlanItem] = []

        if acc_constraint > 0.30:
            immediate.append(
                ActionPlanItem(
                    action_id="ACT_IMM_ACCESS_01",
                    horizon="IMMEDIATE_EMERGENCY",
                    category="EVACUATION_ACCESS",
                    title="Audit Alternate Egress Corridors & Road Chokepoints",
                    description=f"Deploy local engineers to verify culverts, bridge clearances, and unpaved evacuation routes in {m_name}.",
                    trigger_condition=f"Accessibility constraint ({acc_constraint:.2f}) exceeds threshold 0.30.",
                    priority_level="CRITICAL" if reloc_cat == "VERY HIGH" else "HIGH",
                    responsible_agency=pwd_agency
                )
            )
            short_term.append(
                ActionPlanItem(
                    action_id="ACT_ST_ACCESS_01",
                    horizon="SHORT_TERM_MITIGATION",
                    category="EVACUATION_ACCESS",
                    title="All-Weather Road Reinforcement & Raising",
                    description="Prioritize elevating flood-prone road causeways connecting low-lying habitations to major arterial highways.",
                    trigger_condition="High road vulnerability to seasonal inundation or landslide disruptions.",
                    priority_level="HIGH",
                    responsible_agency=pwd_agency
                )
            )

        if haz_exp > 0.40:
            immediate.append(
                ActionPlanItem(
                    action_id="ACT_IMM_HAZ_01",
                    horizon="IMMEDIATE_EMERGENCY",
                    category="SHELTER",
                    title="Pre-Monsoon Flood & Cyclone Shelter Readiness Check",
                    description="Inspect backup generator power, emergency food rations, elevated flood platforms, and sanitation supplies in designated relief facilities.",
                    trigger_condition=f"Hazard exposure index ({haz_exp:.2f}) exceeds high risk threshold 0.40.",
                    priority_level="CRITICAL",
                    responsible_agency=sdma_agency
                )
            )

        if demo_sens > 0.35:
            immediate.append(
                ActionPlanItem(
                    action_id="ACT_IMM_DEMO_01",
                    horizon="IMMEDIATE_EMERGENCY",
                    category="FEASIBILITY_STUDY",
                    title="Priority Evacuation Roster for Vulnerable Households",
                    description="Compile village/ward-level rosters of children (0–6), women, vulnerable dependent households, and non-worker dependents for early assisted evacuation.",
                    trigger_condition=f"Demographic sensitivity index ({demo_sens:.2f}) reflects high vulnerable cohort concentrations.",
                    priority_level="CRITICAL",
                    responsible_agency=wcd_agency
                )
            )

        if "HEALTH" in primary_bot.upper():
            short_term.append(
                ActionPlanItem(
                    action_id="ACT_ST_HEALTH_01",
                    horizon="SHORT_TERM_MITIGATION",
                    category="HEALTH_MEDICAL",
                    title="Pre-position Mobile Medical Units & Essential Drug Kits",
                    description="Establish pre-identified medical referral corridors to secondary care hospitals in adjacent safer administrative units.",
                    trigger_condition="Primary physical constraint is Health Bed & Facility Adequacy.",
                    priority_level="HIGH",
                    responsible_agency=health_agency
                )
            )
        elif "SHELTER" in primary_bot.upper():
            short_term.append(
                ActionPlanItem(
                    action_id="ACT_ST_SHELTER_01",
                    horizon="SHORT_TERM_MITIGATION",
                    category="SHELTER",
                    title="Retrofit Public Schools & Community Halls for Emergency Shelter",
                    description="Conduct structural audits of robust concrete institutional buildings to supplement verified shelter capacity.",
                    trigger_condition="Primary physical constraint is Designated Cyclone/Flood Shelter Capacity.",
                    priority_level="HIGH",
                    responsible_agency=edu_agency
                )
            )
        else:
            short_term.append(
                ActionPlanItem(
                    action_id="ACT_ST_WATER_01",
                    horizon="SHORT_TERM_MITIGATION",
                    category="WATER_SANITATION",
                    title="Deploy Emergency Mobile Water Purification Units",
                    description="Secure elevated water storage tanks and distribute chlorine purification kits to flood-exposed habitations.",
                    trigger_condition="Primary physical constraint is Water Access and Sanitation Coverage.",
                    priority_level="HIGH",
                    responsible_agency=rws_agency
                )
            )

        if reloc_cat in ["VERY HIGH", "HIGH"]:
            long_term.append(
                ActionPlanItem(
                    action_id="ACT_LT_RELOC_01",
                    horizon="LONG_TERM_PLANNING",
                    category="SAFE_LAND_SITING",
                    title="Joint Revenue & GIS Micro-Siting of Candidate Host Land",
                    description=f"Initiate human validation of screened candidate host zones with safe land headroom within 30–50 km radius of {m_name}.",
                    trigger_condition=f"Administrative unit categorized as {reloc_cat} relocation priority (TOPSIS Score: {r_row.get('topsis_score', 0):.3f}).",
                    priority_level="CRITICAL" if reloc_cat == "VERY HIGH" else "HIGH",
                    responsible_agency="District Collectorate / Deputy Commissioner (Revenue) / Town & Country Planning"
                )
            )
            long_term.append(
                ActionPlanItem(
                    action_id="ACT_LT_FEAS_02",
                    horizon="LONG_TERM_PLANNING",
                    category="FEASIBILITY_STUDY",
                    title="Community Consultation & Livelihood Continuity Feasibility Study",
                    description="Conduct participatory appraisals with vulnerable habitations regarding voluntary planned relocation and livelihood protection.",
                    trigger_condition="Long-term multi-hazard risk exceeds in-situ mitigation cost-effectiveness.",
                    priority_level="HIGH",
                    responsible_agency="District Disaster Management Authority (DDMA)"
                )
            )
        else:
            long_term.append(
                ActionPlanItem(
                    action_id="ACT_LT_MITIG_01",
                    horizon="LONG_TERM_PLANNING",
                    category="SAFE_LAND_SITING",
                    title="In-Situ Risk Mitigation & Infrastructure Hardening",
                    description="Enhance storm drainage channels, riverbank embankments, and building code enforcement for existing habitations.",
                    trigger_condition=f"Administrative unit categorized as {reloc_cat} priority (suitable for in-situ protection).",
                    priority_level="MEDIUM",
                    responsible_agency=irrigation_agency
                )
            )

        disclaimer = (
            "DECISION SUPPORT RECOMMENDATIONS ONLY. These suggested actions are deterministically triggered "
            "by active physical bottlenecks and multi-hazard exposure metrics. They do NOT constitute executive relocation orders "
            "and require administrative sanction from the District Disaster Management Authority."
        )

        return ActionPlanResponse(
            mandal_id=m_id,
            mandal_name=m_name,
            district_name=d_name,
            relocation_priority_category=reloc_cat,
            primary_bottleneck=primary_bot,
            secondary_bottleneck=secondary_bot,
            immediate_actions=immediate,
            short_term_actions=short_term,
            long_term_actions=long_term,
            governance_disclaimer=disclaimer
        )

    def compare_source_and_host(
        self,
        source_id: str,
        host_id: str,
        state_id: Optional[str] = None,
        state: Optional[str] = None,
    ) -> Optional[SourceHostComparisonResponse]:
        target_s = source_id.strip().upper()
        target_h = host_id.strip().upper()
        if target_s.startswith("WB_") or target_h.startswith("WB_"):
            detected_state = "west_bengal"
        elif target_s.startswith("BR_") or target_h.startswith("BR_"):
            detected_state = "bihar"
        elif target_s.startswith("AS_") or target_h.startswith("AS_"):
            detected_state = "assam"
        elif target_s.startswith("TN_") or target_h.startswith("TN_"):
            detected_state = "tamil_nadu"
        elif target_s.startswith("OD_") or target_h.startswith("OD_"):
            detected_state = "odisha"
        elif target_s.startswith("UP_") or target_h.startswith("UP_"):
            detected_state = "uttar_pradesh"
        elif target_s.startswith("UK_") or target_h.startswith("UK_"):
            detected_state = "uttarakhand"
        elif target_s.startswith("SK_") or target_h.startswith("SK_"):
            detected_state = "sikkim"
        elif target_s.startswith("AR_") or target_h.startswith("AR_"):
            detected_state = "arunachal_pradesh"
        elif target_s.startswith("NL_") or target_h.startswith("NL_"):
            detected_state = "nagaland"
        elif target_s.startswith("ML_") or target_h.startswith("ML_"):
            detected_state = "meghalaya"
        elif target_s.startswith("MZ_") or target_h.startswith("MZ_"):
            detected_state = "mizoram"
        elif target_s.startswith("HP_") or target_h.startswith("HP_"):
            detected_state = "himachal_pradesh"
        elif target_s.startswith("JK_") or target_h.startswith("JK_"):
            detected_state = "jammu_kashmir"
        elif target_s.startswith("MP_") or target_h.startswith("MP_"):
            detected_state = "madhya_pradesh"
        elif target_s.startswith("GJ_") or target_h.startswith("GJ_"):
            detected_state = "gujarat"
        elif target_s.startswith("KL_") or target_h.startswith("KL_"):
            detected_state = "kerala"
        elif target_s.startswith("MH_") or target_h.startswith("MH_"):
            detected_state = "maharashtra"
        elif target_s.startswith("HR_") or target_h.startswith("HR_"):
            detected_state = "haryana"
        elif target_s.startswith("PB_") or target_h.startswith("PB_"):
            detected_state = "punjab"
        elif target_s.startswith("CG_") or target_h.startswith("CG_"):
            detected_state = "chhattisgarh"
        else:
            detected_state = state_id or state or "andhra_pradesh"

        data = self._load_data(detected_state)
        s_reloc = self._find_mandal(data["reloc_df"], source_id)
        s_cap = self._find_mandal(data["cap_df"], source_id)
        h_reloc = self._find_mandal(data["reloc_df"], host_id)
        h_cap = self._find_mandal(data["cap_df"], host_id)

        if s_reloc is None or s_cap is None or h_reloc is None or h_cap is None:
            all_states = [
                "andhra_pradesh", "mizoram", "himachal_pradesh", "jammu_kashmir", "madhya_pradesh",
                "tamil_nadu", "assam", "bihar", "west_bengal", "odisha", "uttar_pradesh",
                "uttarakhand", "sikkim", "arunachal_pradesh", "nagaland", "meghalaya",
                "gujarat", "kerala", "maharashtra", "haryana", "punjab", "chhattisgarh"
            ]
            for s in all_states:
                if s == detected_state:
                    continue
                try:
                    s_data = self._load_data(s)
                    s_reloc = self._find_mandal(s_data["reloc_df"], source_id) or s_reloc
                    s_cap = self._find_mandal(s_data["cap_df"], source_id) or s_cap
                    h_reloc = self._find_mandal(s_data["reloc_df"], host_id) or h_reloc
                    h_cap = self._find_mandal(s_data["cap_df"], host_id) or h_cap
                    if s_reloc is not None and s_cap is not None and h_reloc is not None and h_cap is not None:
                        data = s_data
                        break
                except Exception:
                    pass

        if s_reloc is None or s_cap is None or h_reloc is None or h_cap is None:
            return None

        # Distance lookup from host_zone_candidates.csv
        s_mid = str(s_reloc["mandal_id"])
        h_mid = str(h_reloc["mandal_id"])
        hosts_df = data["hosts_df"]
        dist_km = 0.0

        if not hosts_df.empty:
            cand_col = "candidate_mandal_id" if "candidate_mandal_id" in hosts_df.columns else "host_candidate_id"
            dist_col = "distance_km" if "distance_km" in hosts_df.columns else "geodesic_distance_km"
            if "source_mandal_id" in hosts_df.columns and cand_col in hosts_df.columns and dist_col in hosts_df.columns:
                pair = hosts_df[
                    (hosts_df["source_mandal_id"].astype(str) == s_mid) &
                    (hosts_df[cand_col].astype(str) == h_mid)
                ]
                if not pair.empty:
                    dist_km = round(float(pair.iloc[0][dist_col]), 1)

        source_data = {
            "mandal_id": s_mid,
            "mandal_name": str(s_reloc.get("mandal_name") or s_reloc.get("taluka_name")),
            "district_name": str(s_reloc.get("current_district_name")),
            "population": int(s_cap.get("population_total", 0)),
            "relocation_priority_category": str(s_reloc.get("relocation_priority_category", "N/A")),
            "relocation_priority_rank": float(s_reloc["relocation_priority_rank"]) if not pd.isna(s_reloc.get("relocation_priority_rank")) else None,
            "topsis_score": float(s_reloc["topsis_score"]),
            "hazard_exposure": float(s_reloc["c1_hazard_exposure"]),
            "demographic_sensitivity": float(s_reloc["c2_demographic_sensitivity"]),
            "capacity_condition": str(s_cap.get("capacity_condition", "N/A")),
            "primary_bottleneck": str(s_reloc.get("primary_bottleneck", "N/A")),
            "safe_area_fraction": float(s_cap.get("safe_area_fraction", 0.0)),
            "safe_area_m2_per_person": float(s_cap.get("safe_area_m2_per_person", 0.0)),
            "water_sanitation_adequacy": float(s_cap.get("water_sanitation_adequacy", 0.0)) if not pd.isna(s_cap.get("water_sanitation_adequacy")) else None,
            "road_accessibility_score": float(s_cap.get("road_accessibility_score", 0.0)) if not pd.isna(s_cap.get("road_accessibility_score")) else None,
            "data_completeness": float(s_cap.get("capacity_data_completeness", 1.0))
        }

        host_data = {
            "mandal_id": h_mid,
            "mandal_name": str(h_reloc.get("mandal_name") or h_reloc.get("taluka_name")),
            "district_name": str(h_reloc.get("current_district_name")),
            "population": int(h_cap.get("population_total", 0)),
            "relocation_priority_category": str(h_reloc.get("relocation_priority_category", "N/A")),
            "relocation_priority_rank": float(h_reloc["relocation_priority_rank"]) if not pd.isna(h_reloc.get("relocation_priority_rank")) else None,
            "topsis_score": float(h_reloc["topsis_score"]),
            "hazard_exposure": float(h_reloc["c1_hazard_exposure"]),
            "demographic_sensitivity": float(h_reloc["c2_demographic_sensitivity"]),
            "capacity_condition": str(h_cap.get("capacity_condition", "N/A")),
            "primary_bottleneck": str(h_reloc.get("primary_bottleneck", "N/A")),
            "safe_area_fraction": float(h_cap.get("safe_area_fraction", 0.0)),
            "safe_area_m2_per_person": float(h_cap.get("safe_area_m2_per_person", 0.0)),
            "water_sanitation_adequacy": float(h_cap.get("water_sanitation_adequacy", 0.0)) if not pd.isna(h_cap.get("water_sanitation_adequacy")) else None,
            "road_accessibility_score": float(h_cap.get("road_accessibility_score", 0.0)) if not pd.isna(h_cap.get("road_accessibility_score")) else None,
            "data_completeness": float(h_cap.get("capacity_data_completeness", 1.0))
        }

        advantages: List[str] = []
        haz_diff = source_data["hazard_exposure"] - host_data["hazard_exposure"]
        if haz_diff > 0.15:
            advantages.append(f"Significantly Lower Multi-Hazard Exposure ({host_data['hazard_exposure']:.2f} vs {source_data['hazard_exposure']:.2f}, -{haz_diff:.2f} reduction).")
        
        if host_data["safe_area_fraction"] >= 0.85:
            advantages.append(f"Substantial Safe Habitable Land Headroom ({host_data['safe_area_fraction']*100:.1f}% safe terrain, {host_data['safe_area_m2_per_person']:.0f} m²/person).")
        
        if dist_km > 0 and dist_km <= 60.0:
            advantages.append(f"Favorable Regional Proximity ({dist_km:.1f} km geodesic distance in EPSG:7755).")
        elif dist_km > 60.0:
            advantages.append(f"Geodesic distance: {dist_km:.1f} km.")

        concerns: List[str] = []
        if host_data["capacity_condition"] in ["CAPACITY-CONSTRAINED", "CONSTRAINED"]:
            concerns.append("Candidate host is currently categorized as CONSTRAINED; influx requires secondary facility expansion.")
        if host_data["primary_bottleneck"] != "N/A":
            concerns.append(f"Host administrative unit's existing limiting component is {host_data['primary_bottleneck'].replace('_', ' ').upper()}.")
        if (host_data["water_sanitation_adequacy"] or 1.0) < 0.75:
            concerns.append("Host administrative unit has below-average baseline water and sanitation coverage.")

        # Missing / Unverified Information
        missing_info: List[str] = []
        if pd.isna(h_cap.get("shelter_count")) or h_cap.get("shelter_count") == 0:
            missing_info.append("Inland host unit has zero designated cyclone shelters (temporary school/community facility audits required).")
        if host_data["data_completeness"] < 1.0:
            missing_info.append(f"Data completeness is {host_data['data_completeness']*100:.0f}% (certain utility inventories missing).")
        missing_info.append("Legal land tenure, agricultural zonation, and municipal water expansion capacity require local revenue verification.")

        notice = (
            "CANDIDATE HOST ZONE — HUMAN VALIDATION REQUIRED. This comparison provides decision support for "
            "disaster management authorities and does NOT represent a designated or mandatory relocation destination."
        )

        return SourceHostComparisonResponse(
            source_mandal=source_data,
            candidate_host=host_data,
            distance_km=dist_km,
            key_advantages=advantages,
            key_concerns_or_bottlenecks=concerns,
            missing_or_unverified_information=missing_info,
            human_validation_notice=notice
        )

    def get_action_dashboard_summary(
        self,
        state_id: Optional[str] = None,
        state: Optional[str] = None,
    ) -> ActionDashboardSummary:
        target_state = state_id or state or "andhra_pradesh"
        data = self._load_data(target_state)
        df_r = data["reloc_df"].copy()
        df_c = data["cap_df"].copy()
        hosts_df = data["hosts_df"].copy()

        pop_mask = df_r["ranking_status"] != "INSUFFICIENT_DATA"
        df_valid = df_r[pop_mask].copy()

        vh_cnt = int((df_r["relocation_priority_category"] == "VERY HIGH").sum())
        h_cnt = int((df_r["relocation_priority_category"] == "HIGH").sum())
        cap_constr_cnt = int(((df_c["capacity_condition"] == "CAPACITY-CONSTRAINED") | (df_c["capacity_condition"] == "CONSTRAINED")).sum())
        cap_sev_cnt = int(((df_c["capacity_condition"] == "CAPACITY-SEVERELY-CONSTRAINED") | (df_c["capacity_condition"] == "SEVERELY_CONSTRAINED")).sum())

        h_id_col = "candidate_mandal_id" if "candidate_mandal_id" in hosts_df.columns else "host_candidate_id" if "host_candidate_id" in hosts_df.columns else "candidate_host_id"
        h_name_col = "candidate_mandal_name" if "candidate_mandal_name" in hosts_df.columns else "host_candidate_name" if "host_candidate_name" in hosts_df.columns else "candidate_host_name"
        host_cnt = hosts_df[h_id_col].nunique() if (not hosts_df.empty and h_id_col in hosts_df.columns) else 0
        insuf_cnt = int((~pop_mask).sum())

        if "population_total" not in df_valid.columns and "total_population" in df_valid.columns:
            df_valid["population_total"] = df_valid["total_population"]

        # Top Action Units (Very High Priority with largest population)
        top_action = df_valid.sort_values(by=["topsis_score", "population_total"], ascending=[False, False]).head(10)[
            ["mandal_id", "mandal_name", "current_district_name", "population_total", "topsis_score", "relocation_priority_category", "primary_priority_factor", "primary_bottleneck"]
        ].to_dict(orient="records")

        bot_dist = df_valid["primary_bottleneck"].value_counts().to_dict()

        if not hosts_df.empty and h_id_col in hosts_df.columns and h_name_col in hosts_df.columns:
            top_hosts_df = hosts_df.groupby([h_id_col, h_name_col]).size().reset_index(name="source_mandals_served")
            top_hosts_df.rename(columns={h_id_col: "candidate_mandal_id", h_name_col: "candidate_mandal_name"}, inplace=True)
            top_hosts = top_hosts_df.sort_values(by="source_mandals_served", ascending=False).head(10).to_dict(orient="records")
        else:
            top_hosts = []

        disclaimer = (
            "STATEWIDE ACTION DASHBOARD — DECISION SUPPORT PROTOTYPE. Aggregates multi-criteria relocation priorities, "
            "physical carrying capacity bottlenecks, and screened candidate host zones for district planning."
        )

        return ActionDashboardSummary(
            total_mandals=len(df_r),
            very_high_priority_count=vh_cnt,
            high_priority_count=h_cnt,
            capacity_constrained_count=cap_constr_cnt,
            capacity_severely_constrained_count=cap_sev_cnt,
            candidate_host_zones_count=host_cnt,
            insufficient_data_count=insuf_cnt,
            top_action_mandals=top_action,
            top_capacity_bottlenecks=bot_dist,
            top_candidate_hosts=top_hosts,
            governance_disclaimer=disclaimer
        )

decision_service = DecisionService()
