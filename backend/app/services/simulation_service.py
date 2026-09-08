from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from app.core.config import settings
from app.simulation.schemas import (
    SimulationParameters,
    SimulationPresetItem,
    SimulationPresetsResponse,
    MandalSimulationComparisonItem,
    SimulationSummaryMetrics,
    SimulationRunResponse,
)

# Official Phase 4 AHP Weights
AHP_WEIGHTS = np.array([0.4231, 0.2274, 0.2274, 0.1221])

# Baseline Quantile Category Thresholds
THRESH_P90 = 0.6082
THRESH_P70 = 0.5271
THRESH_P30 = 0.3075

PRESETS = [
    SimulationPresetItem(
        preset_id="baseline",
        preset_name="Baseline Planning State",
        description="Official Phase 4 baseline conditions with zero parameter perturbation.",
        parameters=SimulationParameters(hazard_change=0.0, population_change=0.0, capacity_change=0.0, accessibility_change=0.0),
        disclaimer="Standard Phase 4 baseline state."
    ),
    SimulationPresetItem(
        preset_id="severe_hazard",
        preset_name="Severe Hazard Intensification",
        description="Monsoon/cyclone surge scenario with +30% hazard intensity, +10% population load, +10% capacity stress, and -10% evacuation road accessibility.",
        parameters=SimulationParameters(hazard_change=0.30, population_change=0.10, capacity_change=0.10, accessibility_change=-0.10),
        disclaimer="Illustrative sensitivity scenario — not a physical rainfall or storm surge forecast."
    ),
    SimulationPresetItem(
        preset_id="extreme_stress",
        preset_name="Compound Extreme Disaster Stress",
        description="Compound disaster scenario with +50% hazard surge, +20% displaced population load, +30% critical infrastructure capacity constraint, and -30% road washouts/accessibility degradation.",
        parameters=SimulationParameters(hazard_change=0.50, population_change=0.20, capacity_change=0.30, accessibility_change=-0.30),
        disclaimer="Stress-test scenario for extreme contingency planning — not a live flood prediction."
    ),
    SimulationPresetItem(
        preset_id="improved_preparedness",
        preset_name="Enhanced Mitigation & Upgraded Access",
        description="Mitigation planning scenario evaluating the impact of -30% capacity stress (e.g. expanded hospital beds/shelters) and +30% improved evacuation road corridors.",
        parameters=SimulationParameters(hazard_change=0.0, population_change=0.0, capacity_change=-0.30, accessibility_change=0.30),
        disclaimer="Hypothetical infrastructure enhancement scenario."
    ),
]


def resolve_state_key(state_id: Optional[str]) -> str:
    if not state_id:
        return "andhra_pradesh"
    clean = state_id.strip().lower().replace("-", "_").replace(" ", "_")
    if clean in ["andhra_pradesh", "ap", "andhrapradesh"]:
        return "andhra_pradesh"
    if clean in ["mizoram", "mz", "mizo"]:
        return "mizoram"
    if clean in ["himachal_pradesh", "hp", "himachal"]:
        return "himachal_pradesh"
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


class SimulationService:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _get_state_key(self, state_id: Optional[str]) -> str:
        return resolve_state_key(state_id)

    # Map state key -> relocation priority CSV filename
    _STATE_CSV_MAP: Dict[str, str] = {
        "andhra_pradesh":   "mandal_relocation_priority.csv",
        "mizoram":          "mizoram_subdistrict_relocation_priority.csv",
        "himachal_pradesh": "hp_tehsil_relocation_priority.csv",
        "tamil_nadu":       "tn_taluk_relocation_priority.csv",
        "assam":            "as_circle_relocation_priority.csv",
        "bihar":            "br_block_relocation_priority.csv",
        "west_bengal":      "wb_block_relocation_priority.csv",
        "odisha":           "od_block_relocation_priority.csv",
        "uttar_pradesh":    "up_tehsil_relocation_priority.csv",
        "uttarakhand":      "uk_tehsil_relocation_priority.csv",
        "sikkim":           "sk_subdivision_relocation_priority.csv",
        "arunachal_pradesh":"ar_circle_relocation_priority.csv",
        "nagaland":         "nl_circle_relocation_priority.csv",
        "meghalaya":        "ml_block_relocation_priority.csv",
    }

    def _load_data(self, state_id: Optional[str] = "andhra_pradesh"):
        key = resolve_state_key(state_id)
        if key in self._cache:
            return self._cache[key]

        reloc_dir = settings.DATA_DIR / "processed" / "relocation"
        csv_name = self._STATE_CSV_MAP.get(key, "mandal_relocation_priority.csv")
        master_csv = reloc_dir / csv_name

        if not master_csv.exists():
            raise FileNotFoundError(f"Relocation priority dataset not found at {master_csv}")
        master_df = pd.read_csv(master_csv)

        valid_df = master_df[master_df["ranking_status"] != "INSUFFICIENT_DATA"]
        X_base = valid_df[['c1_hazard_exposure', 'c2_demographic_sensitivity', 'c3_capacity_stress', 'c4_accessibility_constraint']].values
        norm_denom_base = np.sqrt(np.sum(X_base ** 2, axis=0))
        norm_denom_base = np.where(norm_denom_base == 0, 1.0, norm_denom_base)

        V_base = (X_base / norm_denom_base) * AHP_WEIGHTS
        a_plus_base = np.max(V_base, axis=0)
        a_minus_base = np.min(V_base, axis=0)

        data = {
            "master_df": master_df,
            "norm_denom_base": norm_denom_base,
            "a_plus_base": a_plus_base,
            "a_minus_base": a_minus_base
        }
        self._cache[key] = data
        return data

    def get_presets(self) -> SimulationPresetsResponse:
        return SimulationPresetsResponse(presets=PRESETS)

    def run_simulation(self, params: SimulationParameters, state_id: Optional[str] = "andhra_pradesh") -> SimulationRunResponse:
        state_data = self._load_data(state_id)
        df = state_data["master_df"].copy()
        norm_denom_base = state_data["norm_denom_base"]
        a_plus_base = state_data["a_plus_base"]
        a_minus_base = state_data["a_minus_base"]

        pop_mask = df["ranking_status"] != "INSUFFICIENT_DATA"
        df_valid = df[pop_mask].copy()

        # 1. Deterministic Scenario Criterion Transformation
        is_baseline = (
            params.hazard_change == 0.0 and
            params.population_change == 0.0 and
            params.capacity_change == 0.0 and
            params.accessibility_change == 0.0
        )

        h_base = df_valid["c1_hazard_exposure"].values
        d_base = df_valid["c2_demographic_sensitivity"].values
        c_base = df_valid["c3_capacity_stress"].values
        e_base = df_valid["c4_accessibility_constraint"].values

        # Hazard: clipped multiplier
        h_scen = np.clip(h_base * (1.0 + params.hazard_change), 0.0, 1.0)

        # Demography: baseline preserved (societal composition does not shift linearly)
        d_scen = d_base

        # Capacity Stress: modified by capacity_change and population pressure load
        c_scen = np.clip(c_base * (1.0 + params.capacity_change + 0.5 * params.population_change), 0.0, 1.0)

        # Accessibility Constraint: inverted (negative accessibility change increases constraint)
        e_scen = np.clip(e_base * (1.0 - params.accessibility_change), 0.0, 1.0)

        # 2. TOPSIS Recalculation Engine
        X_scen = np.column_stack([h_scen, d_scen, c_scen, e_scen])

        # Normalize relative to baseline reference scale to allow true comparative sensitivity
        R_scen = X_scen / norm_denom_base
        V_scen = R_scen * AHP_WEIGHTS

        if is_baseline:
            CC_scen = df_valid["topsis_score"].values
            df_valid["scenario_topsis_score"] = CC_scen
            df_valid["scenario_rank"] = df_valid["relocation_priority_rank"].astype(int).values
            df_valid["scenario_category"] = df_valid["relocation_priority_category"].values
        else:
            D_plus = np.sqrt(np.sum((V_scen - a_plus_base) ** 2, axis=1))
            D_minus = np.sqrt(np.sum((V_scen - a_minus_base) ** 2, axis=1))

            total_dist = D_plus + D_minus
            CC_scen = np.where(total_dist > 0, D_minus / total_dist, 0.0)
            CC_scen = np.round(CC_scen, 4)

            df_valid["scenario_topsis_score"] = CC_scen
            df_valid["scenario_rank"] = df_valid["scenario_topsis_score"].rank(ascending=False, method="min").astype(int)

            thresh_p90 = df_valid["topsis_score"].quantile(0.90)
            thresh_p70 = df_valid["topsis_score"].quantile(0.70)
            thresh_p30 = df_valid["topsis_score"].quantile(0.30)

            def assign_scen_category(score):
                if score >= thresh_p90:
                    return "VERY HIGH"
                elif score >= thresh_p70:
                    return "HIGH"
                elif score >= thresh_p30:
                    return "MODERATE"
                else:
                    return "LOW"

            df_valid["scenario_category"] = df_valid["scenario_topsis_score"].apply(assign_scen_category)

        # 4. Deltas and Explanations
        if is_baseline:
            df_valid["score_change"] = 0.0
            df_valid["rank_change"] = 0
            df_valid["category_change"] = "NO_CHANGE"
            df_valid["change_direction"] = "UNCHANGED"
        else:
            df_valid["score_change"] = np.round(df_valid["scenario_topsis_score"] - df_valid["topsis_score"], 4)
            df_valid["rank_change"] = df_valid["relocation_priority_rank"].astype(int) - df_valid["scenario_rank"].astype(int)

            def get_cat_change(row):
                b = row["relocation_priority_category"]
                s = row["scenario_category"]
                if b == s:
                    return "NO_CHANGE"
                order = {"LOW": 1, "MODERATE": 2, "HIGH": 3, "VERY HIGH": 4}
                if order.get(s, 0) > order.get(b, 0):
                    return f"ESCALATED_{b}_TO_{s}"
                else:
                    return f"DEESCALATED_{b}_TO_{s}"

            df_valid["category_change"] = df_valid.apply(get_cat_change, axis=1)

            def get_direction(sc):
                if sc > 0.001:
                    return "INCREASED"
                elif sc < -0.001:
                    return "DECREASED"
                else:
                    return "UNCHANGED"

            df_valid["change_direction"] = df_valid["score_change"].apply(get_direction)

        # Itemized Scenario Factor Contributions
        V_sum = np.sum(V_scen, axis=1, keepdims=True)
        V_sum = np.where(V_sum == 0, 1.0, V_sum)
        V_pct = np.round((V_scen / V_sum) * 100.0, 1)

        df_valid["factor_contrib_hazard_pct"] = V_pct[:, 0]
        df_valid["factor_contrib_demographic_pct"] = V_pct[:, 1]
        df_valid["factor_contrib_capacity_pct"] = V_pct[:, 2]
        df_valid["factor_contrib_accessibility_pct"] = V_pct[:, 3]

        criterion_names = [
            "Hazard Exposure",
            "Demographic Sensitivity",
            "Capacity Stress",
            "Accessibility Constraint"
        ]

        def get_scen_factors(row_pct):
            pairs = list(zip(criterion_names, row_pct))
            pairs.sort(key=lambda x: x[1], reverse=True)
            return pairs[0][0], pairs[1][0]

        factors_scen = [get_scen_factors(V_pct[i]) for i in range(len(df_valid))]
        df_valid["scenario_primary_factor"] = [f[0] for f in factors_scen]
        df_valid["scenario_secondary_factor"] = [f[1] for f in factors_scen]

        df_valid["scenario_c1_hazard"] = np.round(h_scen, 4)
        df_valid["scenario_c2_demography"] = np.round(d_scen, 4)
        df_valid["scenario_c3_capacity"] = np.round(c_scen, 4)
        df_valid["scenario_c4_accessibility"] = np.round(e_scen, 4)

        # Deterministic Explanations
        explanations = []
        for _, r in df_valid.iterrows():
            m_name = r["mandal_name"]
            d_name = r["current_district_name"]
            b_cat = r["relocation_priority_category"]
            s_cat = r["scenario_category"]
            b_sc = r["topsis_score"]
            s_sc = r["scenario_topsis_score"]
            sc_diff = r["score_change"]
            rk_diff = r["rank_change"]
            prim = r["scenario_primary_factor"]
            prim_pct = r["factor_contrib_hazard_pct"] if prim == "Hazard Exposure" else (
                r["factor_contrib_demographic_pct"] if prim == "Demographic Sensitivity" else (
                    r["factor_contrib_capacity_pct"] if prim == "Capacity Stress" else r["factor_contrib_accessibility_pct"]
                )
            )

            sign = "+" if sc_diff >= 0 else ""
            rank_str = f"climbed {rk_diff} ranks" if rk_diff > 0 else (f"dropped {abs(rk_diff)} ranks" if rk_diff < 0 else "rank unchanged")

            if b_cat == s_cat:
                txt = (
                    f"Under simulated conditions, {m_name} ({d_name}) remains in the {s_cat} priority category "
                    f"with a score shift of {sign}{sc_diff:.4f} (from {b_sc:.4f} to {s_sc:.4f}, {rank_str}). "
                    f"Prioritization is primarily driven by {prim} ({prim_pct:.1f}% contribution)."
                )
            else:
                txt = (
                    f"Under simulated conditions, {m_name} ({d_name}) shifts from {b_cat} to {s_cat} priority "
                    f"(score changed by {sign}{sc_diff:.4f} to {s_sc:.4f}, {rank_str}). "
                    f"The primary driver under this scenario is {prim} ({prim_pct:.1f}% contribution)."
                )
            explanations.append(txt)

        df_valid["scenario_explanation"] = explanations

        # 5. Handle Insufficient Data Mandals
        df_insufficient = df[~pop_mask].copy()
        if not df_insufficient.empty:
            df_insufficient["scenario_topsis_score"] = 0.0
            df_insufficient["scenario_rank"] = np.nan
            df_insufficient["scenario_category"] = "INSUFFICIENT-DATA"
            df_insufficient["scenario_primary_factor"] = "INSUFFICIENT_DATA"
            df_insufficient["scenario_secondary_factor"] = "INSUFFICIENT_DATA"
            df_insufficient["score_change"] = 0.0
            df_insufficient["rank_change"] = np.nan
            df_insufficient["category_change"] = "NO_CHANGE"
            df_insufficient["change_direction"] = "UNCHANGED"
            df_insufficient["scenario_c1_hazard"] = df_insufficient["c1_hazard_exposure"].fillna(0.0)
            df_insufficient["scenario_c2_demography"] = 0.0
            df_insufficient["scenario_c3_capacity"] = 0.0
            df_insufficient["scenario_c4_accessibility"] = df_insufficient["c4_accessibility_constraint"].fillna(0.0)
            df_insufficient["factor_contrib_hazard_pct"] = 0.0
            df_insufficient["factor_contrib_demographic_pct"] = 0.0
            df_insufficient["factor_contrib_capacity_pct"] = 0.0
            df_insufficient["factor_contrib_accessibility_pct"] = 0.0
            df_insufficient["scenario_explanation"] = "Insufficient population data to evaluate scenario sensitivity."

        # Combine
        df_combined = pd.concat([df_valid, df_insufficient], ignore_index=True)

        # 6. Summary Metrics Computation
        base_cat_dist = df["relocation_priority_category"].value_counts().to_dict()
        scen_cat_dist = df_combined["scenario_category"].value_counts().to_dict()

        shifts = {}
        for b_cat in ["VERY HIGH", "HIGH", "MODERATE", "LOW"]:
            shifts[b_cat] = {}
            for s_cat in ["VERY HIGH", "HIGH", "MODERATE", "LOW"]:
                count = int(((df_valid["relocation_priority_category"] == b_cat) & (df_valid["scenario_category"] == s_cat)).sum())
                shifts[b_cat][s_cat] = count

        entered_vh = int(((df_valid["relocation_priority_category"] != "VERY HIGH") & (df_valid["scenario_category"] == "VERY HIGH")).sum())
        left_vh = int(((df_valid["relocation_priority_category"] == "VERY HIGH") & (df_valid["scenario_category"] != "VERY HIGH")).sum())

        max_sc_inc_row = df_valid.sort_values(by="score_change", ascending=False).iloc[0]
        max_sc_dec_row = df_valid.sort_values(by="score_change", ascending=True).iloc[0]
        max_rk_up_row = df_valid.sort_values(by="rank_change", ascending=False).iloc[0]
        max_rk_dn_row = df_valid.sort_values(by="rank_change", ascending=True).iloc[0]

        summary = SimulationSummaryMetrics(
            total_mandals=len(df_combined),
            total_mandals_ranked=len(df_valid),
            mean_baseline_score=round(float(df_valid["topsis_score"].mean()), 4),
            mean_scenario_score=round(float(df_valid["scenario_topsis_score"].mean()), 4),
            score_change_mean=round(float(df_valid["score_change"].mean()), 4),
            mandals_priority_increased=int((df_valid["score_change"] > 0.02).sum()),
            mandals_priority_decreased=int((df_valid["score_change"] < -0.02).sum()),
            mandals_no_significant_change=int(((df_valid["score_change"] >= -0.02) & (df_valid["score_change"] <= 0.02)).sum()),
            mandals_rank_improved=int((df_valid["rank_change"] > 0).sum()),
            mandals_rank_worsened=int((df_valid["rank_change"] < 0).sum()),
            mandals_rank_unchanged=int((df_valid["rank_change"] == 0).sum()),
            category_shifts=shifts,
            baseline_category_distribution=base_cat_dist,
            scenario_category_distribution=scen_cat_dist,
            mandals_entered_very_high=entered_vh,
            mandals_left_very_high=left_vh,
            max_score_increase={
                "mandal_id": max_sc_inc_row["mandal_id"],
                "mandal_name": max_sc_inc_row["mandal_name"],
                "district_name": max_sc_inc_row["current_district_name"],
                "score_change": max_sc_inc_row["score_change"],
                "baseline_score": max_sc_inc_row["topsis_score"],
                "scenario_score": max_sc_inc_row["scenario_topsis_score"]
            },
            max_score_decrease={
                "mandal_id": max_sc_dec_row["mandal_id"],
                "mandal_name": max_sc_dec_row["mandal_name"],
                "district_name": max_sc_dec_row["current_district_name"],
                "score_change": max_sc_dec_row["score_change"],
                "baseline_score": max_sc_dec_row["topsis_score"],
                "scenario_score": max_sc_dec_row["scenario_topsis_score"]
            },
            max_rank_up={
                "mandal_id": max_rk_up_row["mandal_id"],
                "mandal_name": max_rk_up_row["mandal_name"],
                "district_name": max_rk_up_row["current_district_name"],
                "rank_change": int(max_rk_up_row["rank_change"]),
                "baseline_rank": int(max_rk_up_row["relocation_priority_rank"]),
                "scenario_rank": int(max_rk_up_row["scenario_rank"])
            },
            max_rank_down={
                "mandal_id": max_rk_dn_row["mandal_id"],
                "mandal_name": max_rk_dn_row["mandal_name"],
                "district_name": max_rk_dn_row["current_district_name"],
                "rank_change": int(max_rk_dn_row["rank_change"]),
                "baseline_rank": int(max_rk_dn_row["relocation_priority_rank"]),
                "scenario_rank": int(max_rk_dn_row["scenario_rank"])
            }
        )

        top_base = df_valid.sort_values(by="relocation_priority_rank", ascending=True).head(10)[
            ["mandal_id", "mandal_name", "current_district_name", "topsis_score", "relocation_priority_category", "relocation_priority_rank"]
        ].to_dict(orient="records")

        top_scen = df_valid.sort_values(by="scenario_rank", ascending=True).head(10)[
            ["mandal_id", "mandal_name", "current_district_name", "scenario_topsis_score", "scenario_category", "scenario_rank", "score_change", "rank_change"]
        ].to_dict(orient="records")

        top_inc = df_valid.sort_values(by="score_change", ascending=False).head(10)[
            ["mandal_id", "mandal_name", "current_district_name", "topsis_score", "scenario_topsis_score", "score_change", "relocation_priority_rank", "scenario_rank", "rank_change"]
        ].to_dict(orient="records")

        top_dec = df_valid.sort_values(by="score_change", ascending=True).head(10)[
            ["mandal_id", "mandal_name", "current_district_name", "topsis_score", "scenario_topsis_score", "score_change", "relocation_priority_rank", "scenario_rank", "rank_change"]
        ].to_dict(orient="records")

        items = []
        for _, row in df_combined.iterrows():
            items.append(
                MandalSimulationComparisonItem(
                    mandal_id=row["mandal_id"],
                    mandal_name=row["mandal_name"],
                    current_district_id=row["current_district_id"],
                    current_district_name=row["current_district_name"],
                    ranking_status=row["ranking_status"],
                    baseline_topsis_score=float(row["topsis_score"]),
                    baseline_rank=float(row["relocation_priority_rank"]) if not np.isnan(row["relocation_priority_rank"]) else None,
                    baseline_category=row["relocation_priority_category"],
                    baseline_primary_factor=row["primary_priority_factor"],
                    scenario_topsis_score=float(row["scenario_topsis_score"]),
                    scenario_rank=float(row["scenario_rank"]) if not np.isnan(row["scenario_rank"]) else None,
                    scenario_category=row["scenario_category"],
                    scenario_primary_factor=row["scenario_primary_factor"],
                    scenario_secondary_factor=row["scenario_secondary_factor"],
                    score_change=float(row["score_change"]),
                    rank_change=float(row["rank_change"]) if not np.isnan(row["rank_change"]) else None,
                    category_change=row["category_change"],
                    change_direction=row["change_direction"],
                    scenario_c1_hazard=float(row["scenario_c1_hazard"]),
                    scenario_c2_demography=float(row["scenario_c2_demography"]),
                    scenario_c3_capacity=float(row["scenario_c3_capacity"]),
                    scenario_c4_accessibility=float(row["scenario_c4_accessibility"]),
                    factor_contrib_hazard_pct=float(row["factor_contrib_hazard_pct"]),
                    factor_contrib_demographic_pct=float(row["factor_contrib_demographic_pct"]),
                    factor_contrib_capacity_pct=float(row["factor_contrib_capacity_pct"]),
                    factor_contrib_accessibility_pct=float(row["factor_contrib_accessibility_pct"]),
                    scenario_explanation=row["scenario_explanation"],
                )
            )

        return SimulationRunResponse(
            parameters=params,
            summary=summary,
            top_10_baseline=top_base,
            top_10_scenario=top_scen,
            top_10_increased_priority=top_inc,
            top_10_decreased_priority=top_dec,
            mandals=items,
            governance_disclaimer="SCENARIO SIMULATION — NOT A DISASTER FORECAST. All outputs represent deterministic mathematical sensitivity recalculations (AHP+TOPSIS) over precomputed baseline indicators. Results serve strictly as decision support for disaster management authorities and do not constitute government relocation orders or emergency evacuation directives."
        )

    def get_mandal_simulation(self, mandal_id: str, params: SimulationParameters, state_id: Optional[str] = "andhra_pradesh") -> Optional[MandalSimulationComparisonItem]:
        target = mandal_id.strip().upper()
        if target.startswith("BR_"):
            detected_state = "bihar"
        elif target.startswith("AS_"):
            detected_state = "assam"
        elif target.startswith("TN_"):
            detected_state = "tamil_nadu"
        elif target.startswith("WB_"):
            detected_state = "west_bengal"
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
        else:
            detected_state = state_id

        run_res = self.run_simulation(params, state_id=detected_state)
        for item in run_res.mandals:
            if item.mandal_id.upper() == target or item.mandal_name.upper() == target:
                return item

        for s in ["andhra_pradesh", "mizoram", "himachal_pradesh", "tamil_nadu", "assam", "bihar", "west_bengal", "odisha", "uttar_pradesh", "uttarakhand", "sikkim", "arunachal_pradesh", "nagaland", "meghalaya"]:
            if s == detected_state:
                continue
            run_res_s = self.run_simulation(params, state_id=s)
            for item in run_res_s.mandals:
                if item.mandal_id.upper() == target or item.mandal_name.upper() == target:
                    return item
        return None


simulation_service = SimulationService()
