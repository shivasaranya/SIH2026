#!/usr/bin/env python3
"""
Sahayata (SIH26191) - Phase 3C: Capacity Adequacy, Bottleneck Analysis & Host-Zone Screening
Author: Antigravity Implementation Engineer
Date: September 2026

Implements:
1. Component-level Capacity Adequacy metrics & status classifications.
2. Physical Bottleneck Engine identifying limiting resources (Primary & Secondary Bottlenecks).
3. Capacity Condition analytical categorization.
4. Candidate Host-Zone Screening with projected geodesic distance (EPSG:7755 India Albers).

Outputs:
- data/processed/capacity/mandal_capacity_adequacy.csv
- data/processed/capacity/mandal_bottlenecks.csv
- data/processed/capacity/host_zone_candidates.csv
- data/processed/capacity/ap_mandal_capacity_adequacy.geojson
"""

import os
import json
from pathlib import Path
import numpy as np
import pandas as pd
import geopandas as gpd

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Input Paths
CAP_CSV = PROJECT_ROOT / "data" / "processed" / "capacity" / "mandal_capacity_components.csv"
VULN_CSV = PROJECT_ROOT / "data" / "processed" / "vulnerability" / "mandal_demographic_vulnerability.csv"
CAP_GEOJSON = PROJECT_ROOT / "data" / "processed" / "capacity" / "ap_mandal_capacity_components.geojson"

# Output Directory
OUT_DIR = PROJECT_ROOT / "data" / "processed" / "capacity"


def compute_capacity_adequacy_and_bottlenecks():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print("==================================================")
    print("PHASE 3C: CAPACITY ADEQUACY & BOTTLENECK ENGINE")
    print("==================================================")

    # 1. Load Datasets
    print("Loading Phase 3B capacity components and Phase 2D vulnerability data...")
    df_cap = pd.read_csv(CAP_CSV)
    df_vuln = pd.read_csv(VULN_CSV)[['mandal_id', 'hazard_exposure_index', 'demographic_sensitivity_index', 'vulnerability_index', 'priority_quadrant']]
    merged = df_cap.merge(df_vuln, on='mandal_id', how='left')
    assert len(merged) == 696, f"Expected 696 mandals, found {len(merged)}"

    has_pop = merged['population_total'] > 0

    # 2. Component Adequacy & Status Classifications

    # 2.1 Shelter Adequacy & Deficit
    print("Computing designated shelter adequacy and coverage ratio...")
    shelter_coverage_ratio = np.where(
        has_pop,
        (merged['verified_shelter_capacity_persons'] / merged['population_total']).round(4),
        0.0
    )
    shelter_deficit_persons = np.where(
        has_pop,
        np.maximum(0, merged['population_total'] - merged['verified_shelter_capacity_persons']),
        0
    )
    # Benchmark: 15% designated cyclone shelter coverage in coastal high-risk zone
    shelter_adequacy = np.where(
        merged['shelter_count'] > 0,
        np.clip(shelter_coverage_ratio / 0.15, 0.0, 1.0).round(4),
        np.nan  # NaN for mandals with no verified designated shelters to avoid penalizing inland areas
    )
    shelter_status = []
    for _, row in merged.iterrows():
        cnt = row['shelter_count']
        ratio = (row['verified_shelter_capacity_persons'] / row['population_total']) if row['population_total'] > 0 else 0
        if cnt == 0:
            shelter_status.append("NO VERIFIED SHELTER CAPACITY")
        elif ratio >= 0.10:
            shelter_status.append("ADEQUATE DESIGNATED COVERAGE")
        elif ratio >= 0.03:
            shelter_status.append("MODERATE DESIGNATED COVERAGE")
        else:
            shelter_status.append("LOW DESIGNATED COVERAGE")

    merged['shelter_coverage_ratio'] = shelter_coverage_ratio
    merged['shelter_deficit_persons'] = shelter_deficit_persons
    merged['shelter_adequacy'] = shelter_adequacy
    merged['shelter_status'] = shelter_status

    # 2.2 Health Adequacy & Status (Normative IPHS Baseline)
    print("Evaluating normative health bed adequacy baseline...")
    # Benchmark: 2.0 normative beds per 1,000 population (IPHS 2022 rural planning standard)
    health_adequacy = np.where(
        has_pop,
        np.clip(merged['normative_beds_per_1000'] / 2.0, 0.0, 1.0).round(4),
        0.0
    )
    health_status = []
    for _, row in merged.iterrows():
        beds_1k = row['normative_beds_per_1000']
        if row['population_total'] <= 0:
            health_status.append("NO POPULATION")
        elif beds_1k >= 1.20:
            health_status.append("ADEQUATE NORMATIVE BASELINE")
        elif beds_1k >= 0.60:
            health_status.append("MODERATE NORMATIVE BASELINE")
        else:
            health_status.append("LOW NORMATIVE BASELINE")

    merged['health_adequacy'] = health_adequacy
    merged['health_status'] = health_status

    # 2.3 Water & Sanitation Adequacy & Status
    print("Evaluating water and sanitation adequacy proxy...")
    water_sanitation_status = []
    for _, row in merged.iterrows():
        ws = row['water_sanitation_adequacy']
        if ws >= 0.85:
            water_sanitation_status.append("HIGH ADEQUACY")
        elif ws >= 0.70:
            water_sanitation_status.append("MODERATE ADEQUACY")
        else:
            water_sanitation_status.append("LOW ADEQUACY")

    merged['water_sanitation_status'] = water_sanitation_status

    # 2.4 Evacuation Road Accessibility & Status
    print("Evaluating evacuation road network accessibility...")
    road_access_status = []
    for _, row in merged.iterrows():
        dens = row['road_density_km_per_km2']
        if dens >= 1.50:
            road_access_status.append("HIGH ACCESSIBILITY")
        elif dens >= 0.90:
            road_access_status.append("MODERATE ACCESSIBILITY")
        else:
            road_access_status.append("LOW ACCESSIBILITY")

    merged['road_accessibility'] = merged['road_accessibility_score']
    merged['road_access_status'] = road_access_status

    # 2.5 Safe Habitable Area Adequacy & Status
    print("Evaluating safe habitable area spatial constraints...")
    safe_area_adequacy = merged['safe_area_fraction'].clip(0.0, 1.0).round(4)
    safe_area_status = []
    for _, row in merged.iterrows():
        frac = row['safe_area_fraction']
        if frac >= 0.90:
            safe_area_status.append("MINIMAL HAZARD EXCLUSION")
        elif frac >= 0.75:
            safe_area_status.append("MODERATE HAZARD EXCLUSION")
        else:
            safe_area_status.append("HIGH HAZARD EXCLUSION")

    merged['safe_area_adequacy'] = safe_area_adequacy
    merged['safe_area_status'] = safe_area_status

    # 3. Physical Bottleneck Identification
    print("Executing Physical Bottleneck Identification Engine...")
    primary_bottlenecks = []
    secondary_bottlenecks = []
    bottleneck_confidences = []
    available_counts = []
    data_completenesses = []
    capacity_conditions = []

    for _, row in merged.iterrows():
        pop = row['population_total']
        if pop <= 0:
            primary_bottlenecks.append("NO POPULATION")
            secondary_bottlenecks.append("N/A")
            bottleneck_confidences.append("LOW")
            available_counts.append(0)
            data_completenesses.append(0.0)
            capacity_conditions.append("INSUFFICIENT-DATA")
            continue

        # Collect available evaluated components
        components = {}
        # Health
        components['health_infrastructure'] = row['health_adequacy']
        # Water & Sanitation
        components['water_sanitation'] = row['water_sanitation_adequacy']
        # Road Accessibility
        components['road_accessibility'] = row['road_accessibility_score']
        # Safe Habitable Area
        components['safe_habitable_area'] = row['safe_area_adequacy']

        # Shelter: only include if shelter data is verified
        if not np.isnan(row['shelter_adequacy']):
            components['shelter_capacity'] = row['shelter_adequacy']

        n_avail = len(components)
        completeness = round(n_avail / 5.0, 2)

        # Sort components by score ascending (lowest score = primary bottleneck)
        sorted_comps = sorted(components.items(), key=lambda x: x[1])

        prim = sorted_comps[0][0]
        sec = sorted_comps[1][0] if len(sorted_comps) > 1 else "N/A"
        prim_score = sorted_comps[0][1]
        mean_score = np.mean([v for _, v in sorted_comps])

        # Confidence
        if completeness >= 0.80:
            conf = "HIGH"
        elif completeness >= 0.60:
            conf = "MODERATE"
        else:
            conf = "LOW"

        # Capacity Condition (Analytical categorization)
        if prim_score >= 0.70 and mean_score >= 0.80:
            condition = "CAPACITY-ADEQUATE"
        elif prim_score < 0.35 or row['safe_area_fraction'] < 0.70:
            condition = "CAPACITY-SEVERELY-CONSTRAINED"
        else:
            condition = "CAPACITY-CONSTRAINED"

        primary_bottlenecks.append(prim)
        secondary_bottlenecks.append(sec)
        bottleneck_confidences.append(conf)
        available_counts.append(n_avail)
        data_completenesses.append(completeness)
        capacity_conditions.append(condition)

    merged['primary_bottleneck'] = primary_bottlenecks
    merged['secondary_bottleneck'] = secondary_bottlenecks
    merged['bottleneck_confidence'] = bottleneck_confidences
    merged['available_component_count'] = available_counts
    merged['capacity_data_completeness'] = data_completenesses
    merged['capacity_condition'] = capacity_conditions

    # 4. Host-Zone Candidate Screening
    print("Screening candidate host zones using geodesic distance in EPSG:7755...")
    gdf_haz = gpd.read_file(CAP_GEOJSON)
    # Project to India Albers Equal Area (EPSG:7755) for accurate metric distance calculation
    gdf_7755 = gdf_haz[['mandal_id', 'geometry']].to_crs(epsg=7755)
    gdf_7755['centroid'] = gdf_7755.geometry.centroid
    gdf_7755 = gdf_7755.merge(merged, on='mandal_id')


    # Screening criteria for candidate host mandals:
    # 1. Low hazard exposure (H_i < 0.30)
    # 2. Low/Moderate vulnerability (V_i < 0.35)
    # 3. Capacity condition NOT severely constrained
    # 4. Safe area fraction >= 0.85 and headroom >= 500 m²/person
    # 5. Data completeness >= 0.80
    host_mask = (
        (gdf_7755['hazard_exposure_index'] < 0.30) &
        (gdf_7755['vulnerability_index'] < 0.35) &
        (gdf_7755['capacity_condition'].isin(['CAPACITY-ADEQUATE', 'CAPACITY-CONSTRAINED'])) &
        (gdf_7755['safe_area_fraction'] >= 0.85) &
        (gdf_7755['safe_area_m2_per_person'] >= 500) &
        (gdf_7755['capacity_data_completeness'] >= 0.80)
    )

    candidate_host_pool = gdf_7755[host_mask].copy()
    print(f"Candidate host pool size: {len(candidate_host_pool)} mandals meeting safety & headroom criteria.")

    merged['is_host_zone_candidate'] = merged['mandal_id'].isin(candidate_host_pool['mandal_id'])

    # Build Host Zone Candidate Matching Table (top 3 nearest candidates per source mandal)
    host_records = []
    for _, src_row in gdf_7755.iterrows():
        src_id = src_row['mandal_id']
        src_name = src_row['mandal_name']
        src_geom = src_row['centroid']

        # Exclude self from candidate pool
        pool_other = candidate_host_pool[candidate_host_pool['mandal_id'] != src_id].copy()
        if pool_other.empty:
            continue

        # Calculate planar distance in kilometers using EPSG:7755
        pool_other['dist_km'] = pool_other['centroid'].distance(src_geom) / 1000.0

        # Sort by distance and take top 3 nearest candidates in statewide host pool
        top_candidates = pool_other.sort_values('dist_km').head(3)


        for _, cand_row in top_candidates.iterrows():
            cand_id = cand_row['mandal_id']
            cand_name = cand_row['mandal_name']
            dist = round(float(cand_row['dist_km']), 1)
            haz = round(float(cand_row['hazard_exposure_index']), 3)
            vuln = round(float(cand_row['vulnerability_index']), 3)
            cond = cand_row['capacity_condition']
            comp = cand_row['capacity_data_completeness']
            shelter_ad = round(float(cand_row['shelter_adequacy']), 3) if not np.isnan(cand_row['shelter_adequacy']) else None
            ws_ad = round(float(cand_row['water_sanitation_adequacy']), 3)
            road_ad = round(float(cand_row['road_accessibility_score']), 3)
            safe_frac = round(float(cand_row['safe_area_fraction']), 3)

            reason = f"Low hazard ({haz:.3f}) + High safe headroom ({safe_frac:.1%}) + Proximity ({dist} km)"
            status = "CANDIDATE HOST ZONE — HUMAN REVIEW REQUIRED"

            host_records.append({
                "source_mandal_id": src_id,
                "source_mandal_name": src_name,
                "candidate_mandal_id": cand_id,
                "candidate_mandal_name": cand_name,
                "distance_km": dist,
                "candidate_hazard_exposure": haz,
                "candidate_vulnerability": vuln,
                "candidate_capacity_condition": cond,
                "candidate_capacity_data_completeness": comp,
                "candidate_shelter_adequacy": shelter_ad,
                "candidate_water_sanitation_adequacy": ws_ad,
                "candidate_road_accessibility": road_ad,
                "candidate_safe_area_fraction": safe_frac,
                "host_candidate_reason": reason,
                "host_candidate_status": status
            })

    df_host_candidates = pd.DataFrame(host_records)

    # 5. Output Datasets Generation

    # 5.1 mandal_capacity_adequacy.csv
    adequacy_cols = [
        'mandal_id', 'mandal_name', 'current_district_id', 'current_district_name',
        'mandal_area_sqkm', 'population_total',
        'shelter_count', 'verified_shelter_capacity_persons', 'shelter_coverage_ratio',
        'shelter_deficit_persons', 'shelter_adequacy', 'shelter_status',
        'normative_health_capacity_baseline', 'normative_beds_per_1000', 'health_adequacy', 'health_status',
        'water_access_percent', 'sanitation_coverage_percent', 'water_sanitation_adequacy', 'water_sanitation_status',
        'road_length_km', 'road_density_km_per_km2', 'road_accessibility_score', 'road_access_status',
        'safe_area_sqkm', 'safe_area_fraction', 'safe_area_m2_per_person', 'safe_area_adequacy', 'safe_area_status',
        'available_component_count', 'capacity_data_completeness',
        'primary_bottleneck', 'secondary_bottleneck', 'bottleneck_confidence',
        'capacity_condition', 'is_host_zone_candidate', 'data_quality', 'provenance_notes'
    ]
    df_adequacy_out = merged[adequacy_cols]
    adequacy_csv_path = OUT_DIR / "mandal_capacity_adequacy.csv"
    df_adequacy_out.to_csv(adequacy_csv_path, index=False)
    print(f"Written: {adequacy_csv_path} ({len(df_adequacy_out)} rows)")

    # 5.2 mandal_bottlenecks.csv
    bottleneck_cols = [
        'mandal_id', 'mandal_name', 'current_district_id', 'current_district_name',
        'population_total', 'capacity_condition',
        'primary_bottleneck', 'secondary_bottleneck', 'bottleneck_confidence',
        'available_component_count', 'capacity_data_completeness',
        'shelter_adequacy', 'health_adequacy', 'water_sanitation_adequacy',
        'road_accessibility_score', 'safe_area_adequacy'
    ]
    df_bottlenecks = merged[bottleneck_cols]
    bottleneck_csv_path = OUT_DIR / "mandal_bottlenecks.csv"
    df_bottlenecks.to_csv(bottleneck_csv_path, index=False)
    print(f"Written: {bottleneck_csv_path} ({len(df_bottlenecks)} rows)")

    # 5.3 host_zone_candidates.csv
    host_csv_path = OUT_DIR / "host_zone_candidates.csv"
    df_host_candidates.to_csv(host_csv_path, index=False)
    print(f"Written: {host_csv_path} ({len(df_host_candidates)} candidate pairs)")

    # 5.4 GeoJSON with adequacy and bottleneck properties
    gdf_out = gdf_haz[['mandal_id', 'geometry']].merge(df_adequacy_out, on='mandal_id')
    gdf_out['geometry'] = gdf_out['geometry'].make_valid()
    geojson_path = OUT_DIR / "ap_mandal_capacity_adequacy.geojson"
    gdf_out.to_file(geojson_path, driver='GeoJSON')
    print(f"Written: {geojson_path} ({len(gdf_out)} features)")

    print("\n==================================================")
    print("PHASE 3C EXECUTION COMPLETED")
    print("==================================================")
    print(f"Capacity Condition Breakdown:")
    print(merged['capacity_condition'].value_counts())
    print(f"\nPrimary Bottleneck Breakdown:")
    print(merged['primary_bottleneck'].value_counts())
    print(f"\nCandidate Host Mandals Pool: {merged['is_host_zone_candidate'].sum()} mandals")


if __name__ == "__main__":
    compute_capacity_adequacy_and_bottlenecks()
