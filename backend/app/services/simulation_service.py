from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from app.core.config import settings
from app.core.state_config import resolve_state_config
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
        description="Official baseline conditions with zero parameter perturbation.",
        parameters=SimulationParameters(hazard_change=0.0, population_change=0.0, capacity_change=0.0, accessibility_change=0.0),
        disclaimer="Standard baseline state."
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

class SimulationService:
    def __init__(self):
        self._cache_df: Dict[str, pd.DataFrame] = {}
        self._cache_norm_denom: Dict[str, np.ndarray] = {}
        self._cache_a_plus: Dict[str, np.ndarray] = {}
        self._cache_a_minus: Dict[str, np.ndarray] = {}

    def _load_data_for_state(self, state_key: str):
        if state_key in self._cache_df:
            return

        cfg = resolve_state_config(state_key)
        master_csv = settings.DATA_DIR / "processed" / "relocation" / cfg.relocation_priority_csv_filename
        if not master_csv.exists():
            raise FileNotFoundError(f"Relocation priority dataset not found at {master_csv}")
        
        df = pd.read_csv(master_csv)
        self._cache_df[state_key] = df

        valid_df = df[df["ranking_status"] != "INSUFFICIENT_DATA"]
        X_base = valid_df[['c1_hazard_exposure', 'c2_demographic_sensitivity', 'c3_capacity_stress', 'c4_accessibility_constraint']].values
        denom = np.sqrt(np.sum(X_base ** 2, axis=0))
        denom = np.where(denom == 0, 1.0, denom)
        self._cache_norm_denom[state_key] = denom

        V_base = (X_base / denom) * AHP_WEIGHTS
        self._cache_a_plus[state_key] = np.max(V_base, axis=0)
        self._cache_a_minus[state_key] = np.min(V_base, axis=0)

    def get_presets(self) -> SimulationPresetsResponse:
        return SimulationPresetsResponse(presets=PRESETS)

    def run_simulation(self, params: SimulationParameters, state: Optional[str] = None) -> SimulationRunResponse:
        cfg = resolve_state_config(state)
        state_key = cfg.state_id
        self._load_data_for_state(state_key)
        
        df = self._cache_df[state_key].copy()
        norm_denom = self._cache_norm_denom[state_key]
        a_plus = self._cache_a_plus[state_key]
        a_minus = self._cache_a_minus[state_key]

        pop_mask = df["ranking_status"] != "INSUFFICIENT_DATA"
        df_valid = df[pop_mask].copy()

        # 1. Deterministic Scenario Criterion Transformation
        h_base = df_valid["c1_hazard_exposure"].values
        d_base = df_valid["c2_demographic_sensitivity"].values
        c_base = df_valid["c3_capacity_stress"].values
        e_base = df_valid["c4_accessibility_constraint"].values

        h_scen = np.clip(h_base * (1.0 + params.hazard_change), 0.0, 1.0)
        d_scen = d_base
        c_scen = np.clip(c_base * (1.0 + params.capacity_change + 0.5 * params.population_change), 0.0, 1.0)
        e_scen = np.clip(e_base * (1.0 - params.accessibility_change), 0.0, 1.0)

        # 2. TOPSIS Recalculation Engine
        X_scen = np.column_stack([h_scen, d_scen, c_scen, e_scen])
        R_scen = X_scen / norm_denom
        V_scen = R_scen * AHP_WEIGHTS

        D_plus = np.sqrt(np.sum((V_scen - a_plus) ** 2, axis=1))
        D_minus = np.sqrt(np.sum((V_scen - a_minus) ** 2, axis=1))

        total_dist = D_plus + D_minus
        CC_scen = np.where(total_dist > 0, D_minus / total_dist, 0.0)
        CC_scen = np.round(CC_scen, 4)

        df_valid["scenario_topsis_score"] = CC_scen
        df_valid["scenario_c1_hazard"] = np.round(h_scen, 4)
        df_valid["scenario_c2_demography"] = np.round(d_scen, 4)
        df_valid["scenario_c3_capacity"] = np.round(c_scen, 4)
        df_valid["scenario_c4_accessibility"] = np.round(e_scen, 4)

        # 3. Scenario Ranking
        is_baseline = (
            params.hazard_change == 0.0 and
            params.population_change == 0.0 and
            params.capacity_change == 0.0 and
            params.accessibility_change == 0.0
        )
        if is_baseline:
            df_valid["scenario_rank"] = df_valid["relocation_priority_rank"].values
            df_valid["scenario_topsis_score"] = df_valid["topsis_score"].values
        else:
            df_valid = df_valid.sort_values(
                by=["scenario_topsis_score", "scenario_c1_hazard", "relocation_priority_rank"],
                ascending=[False, False, True]
            )
            df_valid["scenario_rank"] = np.arange(1, len(df_valid) + 1)

        # 4. Priority Categorization
        scenario_categories = []
        for sc in df_valid["scenario_topsis_score"].values:
            if sc >= THRESH_P90:
                scenario_categories.append("VERY HIGH")
            elif sc >= THRESH_P70:
                scenario_categories.append("HIGH")
            elif sc >= THRESH_P30:
                scenario_categories.append("MODERATE")
            else:
                scenario_categories.append("LOW")
        df_valid["scenario_category"] = scenario_categories

        # 5. Deltas & Factor Attributions
        w_haz, w_demo, w_cap, w_acc = AHP_WEIGHTS

        score_changes = []
        rank_changes = []
        cat_changes = []
        change_dirs = []
        f_haz_list = []
        f_demo_list = []
        f_cap_list = []
        f_acc_list = []
        prim_factors = []
        sec_factors = []
        explanations = []

        cat_hierarchy = {"LOW": 1, "MODERATE": 2, "HIGH": 3, "VERY HIGH": 4}

        for _, row in df_valid.iterrows():
            sc_diff = round(float(row["scenario_topsis_score"] - row["topsis_score"]), 4)
            score_changes.append(sc_diff)

            r_diff = float(row["relocation_priority_rank"] - row["scenario_rank"])
            rank_changes.append(r_diff)

            b_cat_val = cat_hierarchy.get(row["relocation_priority_category"], 0)
            s_cat_val = cat_hierarchy.get(row["scenario_category"], 0)
            if s_cat_val > b_cat_val:
                cat_changes.append("INCREASED")
            elif s_cat_val < b_cat_val:
                cat_changes.append("DECREASED")
            else:
                cat_changes.append("UNCHANGED")

            if sc_diff > 0.02:
                change_dirs.append("PRIORITY INCREASED")
            elif sc_diff < -0.02:
                change_dirs.append("PRIORITY DECREASED")
            else:
                change_dirs.append("NO SIGNIFICANT CHANGE")

            p_haz = w_haz * row["scenario_c1_hazard"]
            p_demo = w_demo * row["scenario_c2_demography"]
            p_cap = w_cap * row["scenario_c3_capacity"]
            p_acc = w_acc * row["scenario_c4_accessibility"]
            tot_p = max(1e-6, p_haz + p_demo + p_cap + p_acc)

            pct_h = round((p_haz / tot_p) * 100.0, 1)
            pct_d = round((p_demo / tot_p) * 100.0, 1)
            pct_c = round((p_cap / tot_p) * 100.0, 1)
            pct_a = round((p_acc / tot_p) * 100.0, 1)

            f_haz_list.append(pct_h)
            f_demo_list.append(pct_d)
            f_cap_list.append(pct_c)
            f_acc_list.append(pct_a)

            f_dict = {
                "Hazard Exposure": pct_h,
                "Demographic Sensitivity": pct_d,
                "Capacity Stress": pct_c,
                "Accessibility Constraint": pct_a
            }
            sorted_f = sorted(f_dict.items(), key=lambda x: x[1], reverse=True)
            prim_factors.append(sorted_f[0][0])
            sec_factors.append(sorted_f[1][0])

            m_name = row["mandal_name"]
            if sc_diff > 0.02:
                exp_text = (
                    f"Relocation priority increased (+{sc_diff:.3f}, Rank #{int(row['relocation_priority_rank'])} → #{int(row['scenario_rank'])}) "
                    f"under simulated scenario, primarily driven by {sorted_f[0][0].lower()} ({sorted_f[0][1]}%) and {sorted_f[1][0].lower()} ({sorted_f[1][1]}%)."
                )
            elif sc_diff < -0.02:
                exp_text = (
                    f"Relocation priority decreased ({sc_diff:.3f}, Rank #{int(row['relocation_priority_rank'])} → #{int(row['scenario_rank'])}) "
                    f"due to simulated mitigation/access improvements, with remaining pressure from {sorted_f[0][0].lower()} ({sorted_f[0][1]}%)."
                )
            else:
                exp_text = (
                    f"Priority remained stable (Score: {row['topsis_score']:.3f} → {row['scenario_topsis_score']:.3f}, Rank: #{int(row['scenario_rank'])}) "
                    f"with primary pressure driven by {sorted_f[0][0].lower()} ({sorted_f[0][1]}%)."
                )
            explanations.append(exp_text)

        df_valid["score_change"] = score_changes
        df_valid["rank_change"] = rank_changes
        df_valid["category_change"] = cat_changes
        df_valid["change_direction"] = change_dirs
        df_valid["factor_contrib_hazard_pct"] = f_haz_list
        df_valid["factor_contrib_demographic_pct"] = f_demo_list
        df_valid["factor_contrib_capacity_pct"] = f_cap_list
        df_valid["factor_contrib_accessibility_pct"] = f_acc_list
        df_valid["scenario_primary_factor"] = prim_factors
        df_valid["scenario_secondary_factor"] = sec_factors
        df_valid["scenario_explanation"] = explanations

        df_insufficient = df[~pop_mask].copy()
        if not df_insufficient.empty:
            df_insufficient["scenario_topsis_score"] = 0.0
            df_insufficient["scenario_rank"] = np.nan
            df_insufficient["scenario_category"] = "INSUFFICIENT-DATA"
            df_insufficient["scenario_primary_factor"] = "NO POPULATION / INSUFFICIENT DATA"
            df_insufficient["scenario_secondary_factor"] = "N/A"
            df_insufficient["score_change"] = 0.0
            df_insufficient["rank_change"] = np.nan
            df_insufficient["category_change"] = "UNCHANGED"
            df_insufficient["change_direction"] = "NO SIGNIFICANT CHANGE"
            df_insufficient["scenario_c1_hazard"] = 0.0
            df_insufficient["scenario_c2_demography"] = 0.0
            df_insufficient["scenario_c3_capacity"] = 0.0
            df_insufficient["scenario_c4_accessibility"] = 0.0
            df_insufficient["factor_contrib_hazard_pct"] = 0.0
            df_insufficient["factor_contrib_demographic_pct"] = 0.0
            df_insufficient["factor_contrib_capacity_pct"] = 0.0
            df_insufficient["factor_contrib_accessibility_pct"] = 0.0
            df_insufficient["scenario_explanation"] = "Mandal/Taluka is unpopulated or has zero reported area; excluded from simulation."
            df_combined = pd.concat([df_valid, df_insufficient], ignore_index=True)
        else:
            df_combined = df_valid

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
            governance_disclaimer=f"SCENARIO SIMULATION — NOT A DISASTER FORECAST. All outputs represent deterministic mathematical sensitivity recalculations (AHP+TOPSIS) over precomputed baseline indicators for {cfg.state_name}."
        )

    def get_mandal_simulation(self, mandal_id: str, params: SimulationParameters, state: Optional[str] = None) -> Optional[MandalSimulationComparisonItem]:
        run_res = self.run_simulation(params, state=state)
        target = mandal_id.strip().upper()
        for item in run_res.mandals:
            if item.mandal_id.upper() == target or item.mandal_name.upper() == target:
                return item
        return None

simulation_service = SimulationService()
