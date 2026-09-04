#!/usr/bin/env python3
"""
Sahayata (SIH26191) - Phase 4: Multi-Criteria Relocation Prioritization
Author: Antigravity Implementation Engineer
Date: September 2026

Implements:
1. Four orthogonal decision criteria:
   - C1: Multi-Hazard Exposure
   - C2: Evacuation Assistance Sensitivity (Census 2011: Children 0-6, Non-Workers, Household Size)
   - C3: Emergency Capacity Stress
   - C4: Evacuation Access Constraint
2. AHP Pairwise Comparison Matrix (Saaty 1-9) with strict Consistency Ratio check (CR < 0.10).
3. TOPSIS Closeness Coefficient Ranking (CC_i in [0, 1]).
4. Priority Categorization (VERY HIGH, HIGH, MODERATE, LOW, INSUFFICIENT-DATA).
5. Factor Contribution percentages & deterministic auditable explainability.
6. Demographic model comparison CSV tracking old vs new metrics.

Outputs:
- data/processed/relocation/mandal_relocation_priority.csv
- data/processed/relocation/relocation_factor_contributions.csv
- data/processed/relocation/ahp_weights.csv
- data/processed/relocation/topsis_diagnostics.csv
- data/processed/relocation/relocation_priority_summary.csv
- data/processed/relocation/ap_mandal_relocation_priority.geojson
- data/processed/vulnerability/demographic_model_comparison.csv
"""

import os
import json
from pathlib import Path
import numpy as np
import pandas as pd
import geopandas as gpd

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Input Paths
ADEQUACY_CSV = PROJECT_ROOT / "data" / "processed" / "capacity" / "mandal_capacity_adequacy.csv"
VULN_CSV = PROJECT_ROOT / "data" / "processed" / "vulnerability" / "mandal_demographic_vulnerability.csv"
HOST_CANDIDATES_CSV = PROJECT_ROOT / "data" / "processed" / "capacity" / "host_zone_candidates.csv"
ADEQUACY_GEOJSON = PROJECT_ROOT / "data" / "processed" / "capacity" / "ap_mandal_capacity_adequacy.geojson"
PREV_RELOC_CSV = PROJECT_ROOT / "data" / "processed" / "relocation" / "mandal_relocation_priority.csv"

# Output Directory
OUT_DIR = PROJECT_ROOT / "data" / "processed" / "relocation"
VULN_DIR = PROJECT_ROOT / "data" / "processed" / "vulnerability"


def compute_relocation_prioritization():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    VULN_DIR.mkdir(parents=True, exist_ok=True)
    print("==================================================")
    print("PHASE 4: MULTI-CRITERIA RELOCATION PRIORITIZATION")
    print("==================================================")

    # 1. Load Master Datasets
    print("Loading Phase 2D vulnerability and Phase 3C capacity adequacy data...")
    df_ad = pd.read_csv(ADEQUACY_CSV)
    df_vuln = pd.read_csv(VULN_CSV)[['mandal_id', 'hazard_exposure_index', 'demographic_sensitivity_index', 'priority_quadrant']]
    df_hosts = pd.read_csv(HOST_CANDIDATES_CSV)

    # Capture previous run for comparison
    df_prev = None
    if PREV_RELOC_CSV.exists():
        try:
            df_prev = pd.read_csv(PREV_RELOC_CSV)[['mandal_id', 'c2_demographic_sensitivity', 'topsis_score', 'relocation_priority_rank', 'relocation_priority_category']]
            df_prev = df_prev.rename(columns={
                'c2_demographic_sensitivity': 'old_D',
                'topsis_score': 'old_topsis_score',
                'relocation_priority_rank': 'old_rank',
                'relocation_priority_category': 'old_category'
            })
        except Exception as e:
            print(f"Note: Could not load previous relocation priority for comparison: {e}")

    merged = df_ad.merge(df_vuln, on='mandal_id', how='left')
    assert len(merged) == 696, f"Expected 696 mandals, found {len(merged)}"

    # 2. Derive 4 Orthogonal Decision Criteria
    print("Constructing 4 orthogonal decision criteria...")
    has_pop = (merged['population_total'] > 0) & (merged['mandal_area_sqkm'] > 0)

    # C1: Hazard Exposure [0, 1]
    c1_hazard = merged['hazard_exposure_index'].fillna(0.0).clip(0.0, 1.0)

    # C2: Evacuation Assistance Sensitivity [0, 1]
    c2_demography = merged['demographic_sensitivity_index'].fillna(0.0).clip(0.0, 1.0)

    # C3: Capacity Stress / Pressure [0, 1]
    cap_stress_list = []
    for _, row in merged.iterrows():
        if row['population_total'] <= 0:
            cap_stress_list.append(0.0)
            continue
        deficits = [
            1.0 - row['health_adequacy'],
            1.0 - row['water_sanitation_adequacy'],
            1.0 - row['safe_area_fraction']
        ]
        if not np.isnan(row['shelter_adequacy']):
            deficits.append(1.0 - row['shelter_adequacy'])
        cap_stress_list.append(float(np.clip(np.mean(deficits), 0.0, 1.0)))

    c3_capacity_stress = pd.Series(cap_stress_list, index=merged.index).round(4)

    # C4: Evacuation & Accessibility Constraint [0, 1]
    c4_access_constraint = (1.0 - merged['road_accessibility_score']).fillna(1.0).clip(0.0, 1.0).round(4)

    merged['c1_hazard_exposure'] = c1_hazard
    merged['c2_demographic_sensitivity'] = c2_demography
    merged['c3_capacity_stress'] = c3_capacity_stress
    merged['c4_accessibility_constraint'] = c4_access_constraint

    # 3. AHP Pairwise Comparison Matrix & Weight Derivation
    print("Deriving AHP criterion weights and computing Consistency Ratio (CR)...")
    ahp_matrix = np.array([
        [1.0,     2.0,     2.0,     3.0],
        [1.0/2.0, 1.0,     1.0,     2.0],
        [1.0/2.0, 1.0,     1.0,     2.0],
        [1.0/3.0, 1.0/2.0, 1.0/2.0, 1.0]
    ])
    criteria_names = [
        "hazard_exposure",
        "demographic_sensitivity",
        "capacity_stress",
        "accessibility_constraint"
    ]

    n_crit = len(criteria_names)
    geom_means = np.prod(ahp_matrix, axis=1) ** (1.0 / n_crit)
    weights = geom_means / np.sum(geom_means)

    # Consistency Check
    weighted_sum = np.dot(ahp_matrix, weights)
    lambda_vec = weighted_sum / weights
    lambda_max = float(np.mean(lambda_vec))
    ci = (lambda_max - n_crit) / (n_crit - 1)
    ri = 0.90
    cr = ci / ri

    print(f"AHP Criterion Weights: {dict(zip(criteria_names, [round(w, 4) for w in weights]))}")
    print(f"AHP Lambda Max: {lambda_max:.4f}, CI: {ci:.5f}, CR: {cr:.4f} ({'PASS: CR < 0.10' if cr < 0.10 else 'FAIL'})")
    assert cr < 0.10, f"AHP Consistency Ratio {cr} exceeds threshold 0.10"

    # Save AHP weights table
    df_ahp = pd.DataFrame({
        "criterion_id": ["C1", "C2", "C3", "C4"],
        "criterion_name": criteria_names,
        "weight": [round(w, 4) for w in weights],
        "weight_percent": [round(w * 100, 2) for w in weights],
        "saaty_scale_rationale": [
            "Primary physical trigger driving displacement risk",
            "Evacuation assistance sensitivity (Census 2011 baseline)",
            "Multi-factor in-situ physical resource bottleneck pressure",
            "Evacuation egress and corridor network constraint proxy"
        ]
    })
    df_ahp.to_csv(OUT_DIR / "ahp_weights.csv", index=False)

    # 4. TOPSIS Multi-Criteria Decision Analysis
    print("Executing TOPSIS ranking across all mandals...")
    pop_mask = has_pop

    X = merged.loc[pop_mask, ['c1_hazard_exposure', 'c2_demographic_sensitivity', 'c3_capacity_stress', 'c4_accessibility_constraint']].values

    # 4.1 Vector Normalization
    norm_denom = np.sqrt(np.sum(X ** 2, axis=0))
    norm_denom = np.where(norm_denom == 0, 1.0, norm_denom)
    R = X / norm_denom

    # 4.2 Weighted Normalized Decision Matrix
    V = R * weights

    # 4.3 Ideal Solutions
    A_plus = np.max(V, axis=0)
    A_minus = np.min(V, axis=0)

    # 4.4 Euclidean Distances
    D_plus = np.sqrt(np.sum((V - A_plus) ** 2, axis=1))
    D_minus = np.sqrt(np.sum((V - A_minus) ** 2, axis=1))

    # 4.5 TOPSIS Score
    total_dist = D_plus + D_minus
    CC = np.where(total_dist > 0, D_minus / total_dist, 0.0)

    merged['topsis_score'] = 0.0
    merged.loc[pop_mask, 'topsis_score'] = np.round(CC, 4)
    merged['d_plus'] = np.nan
    merged.loc[pop_mask, 'd_plus'] = np.round(D_plus, 5)
    merged['d_minus'] = np.nan
    merged.loc[pop_mask, 'd_minus'] = np.round(D_minus, 5)

    # Ranking Status
    merged['ranking_status'] = np.where(
        pop_mask,
        np.where(merged['capacity_data_completeness'] >= 0.80, 'FULL', 'PARTIAL'),
        'INSUFFICIENT_DATA'
    )

    # 5. Priority Categorization
    print("Assigning project-defined analytical priority categories...")
    valid_scores = merged.loc[pop_mask, 'topsis_score']
    p90 = float(valid_scores.quantile(0.90))
    p70 = float(valid_scores.quantile(0.70))
    p30 = float(valid_scores.quantile(0.30))

    print(f"TOPSIS Score Thresholds: P90={p90:.4f}, P70={p70:.4f}, P30={p30:.4f}")

    priority_categories = []
    for _, row in merged.iterrows():
        if row['ranking_status'] == 'INSUFFICIENT_DATA':
            priority_categories.append('INSUFFICIENT-DATA')
        else:
            sc = row['topsis_score']
            if sc >= p90:
                priority_categories.append('VERY HIGH')
            elif sc >= p70:
                priority_categories.append('HIGH')
            elif sc >= p30:
                priority_categories.append('MODERATE')
            else:
                priority_categories.append('LOW')

    merged['relocation_priority_category'] = priority_categories

    # 6. Factor Contribution Breakdown & Deterministic Explanation
    print("Computing factor contribution percentages and deterministic explainability...")
    w_hazard, w_demo, w_cap, w_access = weights

    contrib_hazard = []
    contrib_demo = []
    contrib_cap = []
    contrib_access = []
    primary_factors = []
    secondary_factors = []
    explanations = []

    for _, row in merged.iterrows():
        if row['ranking_status'] == 'INSUFFICIENT_DATA':
            contrib_hazard.append(0.0)
            contrib_demo.append(0.0)
            contrib_cap.append(0.0)
            contrib_access.append(0.0)
            primary_factors.append("NO POPULATION / INSUFFICIENT DATA")
            secondary_factors.append("N/A")
            explanations.append("Mandal is unpopulated or has zero reported census area; insufficient data for priority evaluation.")
            continue

        p_haz = w_hazard * row['c1_hazard_exposure']
        p_demo = w_demo * row['c2_demographic_sensitivity']
        p_cap = w_cap * row['c3_capacity_stress']
        p_acc = w_access * row['c4_accessibility_constraint']
        total_p = p_haz + p_demo + p_cap + p_acc

        if total_p <= 0:
            total_p = 1e-6

        pct_haz = round((p_haz / total_p) * 100.0, 1)
        pct_demo = round((p_demo / total_p) * 100.0, 1)
        pct_cap = round((p_cap / total_p) * 100.0, 1)
        pct_acc = round((p_acc / total_p) * 100.0, 1)

        contrib_hazard.append(pct_haz)
        contrib_demo.append(pct_demo)
        contrib_cap.append(pct_cap)
        contrib_access.append(pct_acc)

        factors_dict = {
            "Hazard Exposure": pct_haz,
            "Evacuation Assistance Need": pct_demo,
            "Capacity Stress": pct_cap,
            "Accessibility Constraint": pct_acc
        }
        sorted_fac = sorted(factors_dict.items(), key=lambda x: x[1], reverse=True)
        prim_fac = sorted_fac[0][0]
        sec_fac = sorted_fac[1][0]
        primary_factors.append(prim_fac)
        secondary_factors.append(sec_fac)

        cat = row['relocation_priority_category']
        sc = row['topsis_score']
        exp_text = (
            f"{cat} relocation priority (TOPSIS Score: {sc:.3f}) is primarily driven by {prim_fac.lower()} ({sorted_fac[0][1]}%) "
            f"and {sec_fac.lower()} ({sorted_fac[1][1]}%), in a {row['capacity_condition'].lower().replace('-', ' ')} capacity setting."
        )
        explanations.append(exp_text)

    merged['factor_contrib_hazard_pct'] = contrib_hazard
    merged['factor_contrib_demographic_pct'] = contrib_demo
    merged['factor_contrib_capacity_pct'] = contrib_cap
    merged['factor_contrib_accessibility_pct'] = contrib_access
    merged['primary_priority_factor'] = primary_factors
    merged['secondary_priority_factor'] = secondary_factors
    merged['priority_explanation'] = explanations

    # 7. Sort Mandals by TOPSIS Priority Score Descending
    df_sorted = merged.sort_values(by=['topsis_score', 'c1_hazard_exposure'], ascending=[False, False]).reset_index(drop=True)
    df_sorted['relocation_priority_rank'] = np.where(
        df_sorted['ranking_status'] != 'INSUFFICIENT_DATA',
        np.arange(1, len(df_sorted) + 1),
        np.nan
    )

    # 8. Save Master Outputs
    master_cols = [
        'relocation_priority_rank', 'mandal_id', 'mandal_name', 'current_district_id', 'current_district_name',
        'mandal_area_sqkm', 'population_total', 'priority_quadrant',
        # TOPSIS & Category
        'topsis_score', 'relocation_priority_category', 'ranking_status',
        # Four Criteria
        'c1_hazard_exposure', 'c2_demographic_sensitivity', 'c3_capacity_stress', 'c4_accessibility_constraint',
        # Factor Contributions
        'primary_priority_factor', 'secondary_priority_factor',
        'factor_contrib_hazard_pct', 'factor_contrib_demographic_pct', 'factor_contrib_capacity_pct', 'factor_contrib_accessibility_pct',
        'priority_explanation',
        # Capacity Context
        'capacity_condition', 'primary_bottleneck', 'capacity_data_completeness', 'is_host_zone_candidate',
        # Governance
        'data_quality', 'provenance_notes'
    ]
    df_master_out = df_sorted[master_cols]
    master_csv_path = OUT_DIR / "mandal_relocation_priority.csv"
    df_master_out.to_csv(master_csv_path, index=False)
    print(f"Written: {master_csv_path} ({len(df_master_out)} mandals)")

    # 8.2 Factor Contributions CSV
    factor_cols = [
        'mandal_id', 'mandal_name', 'current_district_name', 'relocation_priority_rank',
        'topsis_score', 'relocation_priority_category',
        'primary_priority_factor', 'secondary_priority_factor',
        'factor_contrib_hazard_pct', 'factor_contrib_demographic_pct', 'factor_contrib_capacity_pct', 'factor_contrib_accessibility_pct',
        'c1_hazard_exposure', 'c2_demographic_sensitivity', 'c3_capacity_stress', 'c4_accessibility_constraint'
    ]
    df_factors = df_sorted[factor_cols]
    factors_csv_path = OUT_DIR / "relocation_factor_contributions.csv"
    df_factors.to_csv(factors_csv_path, index=False)
    print(f"Written: {factors_csv_path}")

    # 8.3 TOPSIS Diagnostics CSV
    diag_cols = [
        'mandal_id', 'mandal_name', 'current_district_name', 'topsis_score',
        'd_plus', 'd_minus', 'ranking_status', 'c1_hazard_exposure', 'c2_demographic_sensitivity', 'c3_capacity_stress', 'c4_accessibility_constraint'
    ]
    df_diag = df_sorted[diag_cols]
    diag_csv_path = OUT_DIR / "topsis_diagnostics.csv"
    df_diag.to_csv(diag_csv_path, index=False)
    print(f"Written: {diag_csv_path}")

    # 8.4 Relocation Priority Summary CSV
    cat_counts = df_master_out['relocation_priority_category'].value_counts().to_dict()

    summary_records = [
        {"metric": "total_mandals", "value": len(df_master_out)},
        {"metric": "total_mandals_ranked", "value": int((df_master_out['ranking_status'] != 'INSUFFICIENT_DATA').sum())},
        {"metric": "mandals_very_high_priority", "value": cat_counts.get('VERY HIGH', 0)},
        {"metric": "mandals_high_priority", "value": cat_counts.get('HIGH', 0)},
        {"metric": "mandals_moderate_priority", "value": cat_counts.get('MODERATE', 0)},
        {"metric": "mandals_low_priority", "value": cat_counts.get('LOW', 0)},
        {"metric": "mandals_insufficient_data", "value": cat_counts.get('INSUFFICIENT-DATA', 0)},
        {"metric": "topsis_min_score", "value": round(float(valid_scores.min()), 4)},
        {"metric": "topsis_max_score", "value": round(float(valid_scores.max()), 4)},
        {"metric": "topsis_mean_score", "value": round(float(valid_scores.mean()), 4)},
        {"metric": "ahp_consistency_ratio", "value": round(cr, 4)},
        {"metric": "host_zone_candidates_pool_count", "value": int(df_master_out['is_host_zone_candidate'].sum())},
    ]
    df_sum = pd.DataFrame(summary_records)
    sum_csv_path = OUT_DIR / "relocation_priority_summary.csv"
    df_sum.to_csv(sum_csv_path, index=False)
    print(f"Written: {sum_csv_path}")

    # 8.5 Spatial GeoJSON
    gdf_haz = gpd.read_file(ADEQUACY_GEOJSON)
    gdf_out = gdf_haz[['mandal_id', 'geometry']].merge(df_master_out, on='mandal_id')
    gdf_out['geometry'] = gdf_out['geometry'].make_valid()
    geojson_path = OUT_DIR / "ap_mandal_relocation_priority.geojson"
    gdf_out.to_file(geojson_path, driver='GeoJSON')
    print(f"Written: {geojson_path} ({len(gdf_out)} features)")

    # 8.6 Generate Demographic Model Comparison CSV
    if df_prev is not None:
        df_comp = df_master_out[['mandal_id', 'mandal_name', 'current_district_name', 'c2_demographic_sensitivity', 'topsis_score', 'relocation_priority_rank', 'relocation_priority_category']].copy()
        df_comp = df_comp.rename(columns={
            'c2_demographic_sensitivity': 'new_D',
            'topsis_score': 'new_topsis_score',
            'relocation_priority_rank': 'new_rank',
            'relocation_priority_category': 'new_category'
        })
        df_comp = df_comp.merge(df_prev, on='mandal_id', how='left')
        df_comp['delta_D'] = (df_comp['new_D'] - df_comp['old_D']).round(4)
        df_comp['delta_topsis'] = (df_comp['new_topsis_score'] - df_comp['old_topsis_score']).round(4)
        df_comp['rank_change'] = (df_comp['old_rank'] - df_comp['new_rank']) # Positive means moved up in priority

        comp_cols = [
            'mandal_id', 'mandal_name', 'current_district_name',
            'old_D', 'new_D', 'delta_D',
            'old_topsis_score', 'new_topsis_score', 'delta_topsis',
            'old_rank', 'new_rank', 'rank_change',
            'old_category', 'new_category'
        ]
        comp_csv_path = VULN_DIR / "demographic_model_comparison.csv"
        df_comp[comp_cols].to_csv(comp_csv_path, index=False)
        print(f"Written Comparison: {comp_csv_path}")

    print("\n==================================================")
    print("PHASE 4 RELOCATION PRIORITIZATION COMPLETED")
    print("==================================================")
    print(f"Category Distribution:")
    print(df_master_out['relocation_priority_category'].value_counts())
    print(f"\nTop 10 Prioritized Mandals:")
    top10 = df_master_out.head(10)[['relocation_priority_rank', 'mandal_name', 'current_district_name', 'topsis_score', 'relocation_priority_category', 'primary_priority_factor']]
    print(top10.to_string(index=False))


if __name__ == "__main__":
    compute_relocation_prioritization()
