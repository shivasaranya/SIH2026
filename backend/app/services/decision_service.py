from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from app.core.config import settings
from app.core.state_config import resolve_state_config
from app.decision.schemas import (
    CapacityGapAssessment,
    ActionPlanItem,
    ActionPlanResponse,
    SourceHostComparisonResponse,
    ActionDashboardSummary,
)

class DecisionService:
    def __init__(self):
        self._cache_reloc_df: Dict[str, pd.DataFrame] = {}
        self._cache_cap_df: Dict[str, pd.DataFrame] = {}
        self._cache_hosts_df: Dict[str, pd.DataFrame] = {}

    def _load_data_for_state(self, state_key: str):
        if state_key in self._cache_reloc_df:
            return

        cfg = resolve_state_config(state_key)
        reloc_csv = settings.DATA_DIR / "processed" / "relocation" / cfg.relocation_priority_csv_filename
        cap_csv = settings.DATA_DIR / "processed" / "capacity" / (
            "mandal_capacity_adequacy.csv" if state_key == "ap" else "gujarat_taluka_capacity_adequacy.csv"
        )
        hosts_csv = settings.DATA_DIR / "processed" / "capacity" / cfg.host_candidates_csv_filename

        if not reloc_csv.exists() or not cap_csv.exists():
            raise FileNotFoundError(f"Required processed datasets not found for {state_key}.")

        self._cache_reloc_df[state_key] = pd.read_csv(reloc_csv)
        self._cache_cap_df[state_key] = pd.read_csv(cap_csv)
        if hosts_csv.exists():
            self._cache_hosts_df[state_key] = pd.read_csv(hosts_csv)
        else:
            self._cache_hosts_df[state_key] = pd.DataFrame()

    def _find_mandal(self, df: pd.DataFrame, mandal_id: str) -> Optional[pd.Series]:
        target = mandal_id.strip().upper()
        match = df[(df["mandal_id"].str.upper() == target) | (df["mandal_name"].str.upper() == target)]
        if match.empty and "taluka_id" in df.columns:
            match = df[(df["taluka_id"].str.upper() == target) | (df["taluka_name"].str.upper() == target)]
        if not match.empty:
            return match.iloc[0]
        return None

    def get_capacity_gap_assessment(self, mandal_id: str, state: Optional[str] = None) -> Optional[CapacityGapAssessment]:
        cfg = resolve_state_config(state)
        state_key = cfg.state_id
        self._load_data_for_state(state_key)

        r_row = self._find_mandal(self._cache_reloc_df[state_key], mandal_id)
        c_row = self._find_mandal(self._cache_cap_df[state_key], mandal_id)

        if r_row is None or c_row is None:
            return None

        pop = int(c_row.get("population_total", 0))
        m_id = str(c_row.get("mandal_id", mandal_id))
        m_name = str(c_row.get("mandal_name", "Unknown"))
        d_name = str(c_row.get("current_district_name", "Unknown"))

        # 1. Shelter Gap
        shelter_cap = c_row.get("verified_shelter_capacity_persons")
        shelter_gap_persons = None
        if pd.isna(shelter_cap) or shelter_cap is None or int(shelter_cap) == 0:
            if c_row.get("is_coastal", False):
                shelter_gap_status = "DEFICIT_IDENTIFIED"
                indicative_shelter_need = int(pop * 0.15)
                shelter_gap_persons = indicative_shelter_need
                shelter_cap_val = 0
                shelter_note = f"Coastal area requires designated emergency shelter capacity. Indicative deficit: {shelter_gap_persons:,} persons."
            else:
                shelter_gap_status = "NON_APPLICABLE_OR_INSUFFICIENT_DATA"
                shelter_note = "Inland area with zero designated cyclone multi-purpose shelters."
                shelter_cap_val = None
        else:
            shelter_cap_val = int(shelter_cap)
            indicative_shelter_need = int(pop * 0.15)
            shelter_gap_persons = max(0, indicative_shelter_need - shelter_cap_val)
            shelter_gap_status = "DEFICIT_IDENTIFIED" if shelter_gap_persons > 0 else "ADEQUATE"
            shelter_note = f"Verified capacity: {shelter_cap_val:,} persons. Indicative planning deficit: {shelter_gap_persons:,} persons."

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
            f"{cfg.admin_unit_singular} {m_name} ({d_name}) has an indicative planning population of {pop:,}. "
            f"The primary physical infrastructure bottleneck is {p_bot}. "
            f"Key deficits include: Health ({health_gap_status}), Safe Land ({safe_gap_status}), and Water/Sanitation ({water_gap_status})."
        )

        notice = (
            f"INDICATIVE PLANNING ESTIMATE ONLY for {cfg.state_name}. Gaps represent normative benchmarking (IPHS 2022 / Sphere Project) "
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

    def get_action_plan(self, mandal_id: str, state: Optional[str] = None) -> Optional[ActionPlanResponse]:
        cfg = resolve_state_config(state)
        state_key = cfg.state_id
        self._load_data_for_state(state_key)

        r_row = self._find_mandal(self._cache_reloc_df[state_key], mandal_id)
        c_row = self._find_mandal(self._cache_cap_df[state_key], mandal_id)

        if r_row is None or c_row is None:
            return None

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
                    description=f"Deploy local engineers to verify culverts, bridge clearances, and evacuation routes in {m_name}.",
                    trigger_condition=f"Accessibility constraint ({acc_constraint:.2f}) exceeds threshold 0.30.",
                    priority_level="CRITICAL" if reloc_cat == "VERY HIGH" else "HIGH",
                    responsible_agency=f"{cfg.state_name} Roads & Buildings Department / District Police"
                )
            )
            short_term.append(
                ActionPlanItem(
                    action_id="ACT_ST_ACCESS_01",
                    horizon="SHORT_TERM_MITIGATION",
                    category="EVACUATION_ACCESS",
                    title="All-Weather Road Reinforcement & Raising",
                    description="Prioritize elevating flood-prone road causeways connecting low-lying habitations to major highways.",
                    trigger_condition="High road vulnerability to seasonal inundation.",
                    priority_level="HIGH",
                    responsible_agency=f"{cfg.state_name} Panchayat Raj & Rural Development"
                )
            )

        if haz_exp > 0.40:
            immediate.append(
                ActionPlanItem(
                    action_id="ACT_IMM_HAZ_01",
                    horizon="IMMEDIATE_EMERGENCY",
                    category="SHELTER",
                    title="Pre-Monsoon Multipurpose Shelter Readiness Check",
                    description=f"Inspect backup generator power, emergency food rations, and sanitation supplies in designated relief shelters in {m_name}.",
                    trigger_condition=f"Hazard exposure index ({haz_exp:.2f}) exceeds high risk threshold 0.40.",
                    priority_level="CRITICAL",
                    responsible_agency=f"{cfg.state_code} SDMA / Revenue Department"
                )
            )

        if demo_sens > 0.35:
            immediate.append(
                ActionPlanItem(
                    action_id="ACT_IMM_DEMO_01",
                    horizon="IMMEDIATE_EMERGENCY",
                    category="FEASIBILITY_STUDY",
                    title="Priority Evacuation Roster for Vulnerable Households",
                    description="Compile village-level rosters of children (0–6), women, SC/ST households, and non-worker dependents for early assisted evacuation.",
                    trigger_condition=f"Demographic sensitivity index ({demo_sens:.2f}) reflects high vulnerable cohort concentrations.",
                    priority_level="CRITICAL",
                    responsible_agency="Women & Child Welfare / Anganwadi Network"
                )
            )

        if "HEALTH" in primary_bot.upper():
            short_term.append(
                ActionPlanItem(
                    action_id="ACT_ST_HEALTH_01",
                    horizon="SHORT_TERM_MITIGATION",
                    category="HEALTH_MEDICAL",
                    title="Pre-position Mobile Medical Units & Essential Drug Kits",
                    description=f"Establish pre-identified medical referral corridors to secondary care hospitals in adjacent safer {cfg.admin_unit_plural.lower()}.",
                    trigger_condition="Primary physical constraint is Health Bed & Facility Adequacy.",
                    priority_level="HIGH",
                    responsible_agency=f"{cfg.state_name} Health & Family Welfare Department"
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
                    responsible_agency="School Education Department / Disaster Cell"
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
                    responsible_agency="Rural Water Supply & Sanitation (GWSSB / RWS&S)"
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
                    trigger_condition=f"{cfg.admin_unit_singular} categorized as {reloc_cat} relocation priority (TOPSIS Score: {r_row.get('topsis_score', 0):.3f}).",
                    priority_level="CRITICAL" if reloc_cat == "VERY HIGH" else "HIGH",
                    responsible_agency="District Collectorate (Revenue) / Town Planning"
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
                    description="Enhance storm drainage channels, coastal green belts, and building code enforcement for existing habitations.",
                    trigger_condition=f"{cfg.admin_unit_singular} categorized as {reloc_cat} priority (suitable for in-situ protection).",
                    priority_level="MEDIUM",
                    responsible_agency="District Administration / Irrigation & Water Resources"
                )
            )

        disclaimer = (
            f"DECISION SUPPORT RECOMMENDATIONS ONLY for {cfg.state_name}. These suggested actions are deterministically triggered "
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

    def compare_source_and_host(self, source_id: str, host_id: str, state: Optional[str] = None) -> Optional[SourceHostComparisonResponse]:
        cfg = resolve_state_config(state)
        state_key = cfg.state_id
        self._load_data_for_state(state_key)

        s_reloc = self._find_mandal(self._cache_reloc_df[state_key], source_id)
        s_cap = self._find_mandal(self._cache_cap_df[state_key], source_id)
        h_reloc = self._find_mandal(self._cache_reloc_df[state_key], host_id)
        h_cap = self._find_mandal(self._cache_cap_df[state_key], host_id)

        if s_reloc is None or s_cap is None or h_reloc is None or h_cap is None:
            return None

        s_mid = str(s_reloc.get("mandal_id") or s_reloc.get("taluka_id"))
        h_mid = str(h_reloc.get("mandal_id") or h_reloc.get("taluka_id"))
        
        hosts_df = self._cache_hosts_df[state_key]
        dist_km = 0.0
        if not hosts_df.empty:
            if "source_mandal_id" in hosts_df.columns:
                target_col = "candidate_mandal_id" if "candidate_mandal_id" in hosts_df.columns else "host_candidate_id"
                dist_col = "distance_km" if "distance_km" in hosts_df.columns else "geodesic_distance_km"
                pair = hosts_df[
                    (hosts_df["source_mandal_id"] == s_mid) &
                    (hosts_df[target_col] == h_mid)
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
            concerns.append(f"Candidate host is currently categorized as CONSTRAINED; influx requires secondary facility expansion.")
        if host_data["primary_bottleneck"] != "N/A":
            concerns.append(f"Host's existing limiting component is {host_data['primary_bottleneck'].replace('_', ' ').upper()}.")

        missing_info: List[str] = [
            "Legal land tenure, agricultural zonation, and municipal water expansion capacity require local revenue verification."
        ]

        notice = (
            f"CANDIDATE HOST ZONE — HUMAN VALIDATION REQUIRED for {cfg.state_name}. This comparison provides decision support for "
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

    def get_action_dashboard_summary(self, state: Optional[str] = None) -> ActionDashboardSummary:
        cfg = resolve_state_config(state)
        state_key = cfg.state_id
        self._load_data_for_state(state_key)

        df_r = self._cache_reloc_df[state_key].copy()
        df_c = self._cache_cap_df[state_key].copy()
        hosts_df = self._cache_hosts_df[state_key]

        pop_mask = df_r["ranking_status"] != "INSUFFICIENT_DATA"
        df_valid = df_r[pop_mask]

        vh_cnt = int((df_r["relocation_priority_category"] == "VERY HIGH").sum())
        h_cnt = int((df_r["relocation_priority_category"] == "HIGH").sum())
        cap_constr_cnt = int(((df_c["capacity_condition"] == "CAPACITY-CONSTRAINED") | (df_c["capacity_condition"] == "CONSTRAINED")).sum())
        cap_sev_cnt = int(((df_c["capacity_condition"] == "CAPACITY-SEVERELY-CONSTRAINED") | (df_c["capacity_condition"] == "SEVERELY_CONSTRAINED")).sum())
        
        host_target_col = "candidate_mandal_id" if "candidate_mandal_id" in hosts_df.columns else "host_candidate_id" if "host_candidate_id" in hosts_df.columns else None
        host_cnt = hosts_df[host_target_col].nunique() if (not hosts_df.empty and host_target_col) else 0
        insuf_cnt = int((~pop_mask).sum())

        top_action = df_valid.sort_values(by=["topsis_score", "population_total"], ascending=[False, False]).head(10)[
            ["mandal_id", "mandal_name", "current_district_name", "population_total", "topsis_score", "relocation_priority_category", "primary_priority_factor", "primary_bottleneck"]
        ].to_dict(orient="records")

        bot_dist = df_valid["primary_bottleneck"].value_counts().to_dict()

        top_hosts = []
        if not hosts_df.empty and host_target_col:
            name_col = "candidate_mandal_name" if "candidate_mandal_name" in hosts_df.columns else "host_candidate_name"
            top_hosts_df = hosts_df.groupby([host_target_col, name_col]).size().reset_index(name="source_mandals_served")
            top_hosts = top_hosts_df.sort_values(by="source_mandals_served", ascending=False).head(10).to_dict(orient="records")

        disclaimer = (
            f"STATEWIDE ACTION DASHBOARD — DECISION SUPPORT PROTOTYPE ({cfg.state_name}). Aggregates multi-criteria relocation priorities, "
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
