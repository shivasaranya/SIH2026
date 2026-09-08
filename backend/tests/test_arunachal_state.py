"""
Unit Tests for Arunachal Pradesh Master State Implementation in RakshaSethu (SIH26191)
Validates all 6 analytical phases:
- Phase 1: Administrative GIS & Demographics (25 Districts, 208 Circles, 1,383,727 population)
- Phase 2: Multi-Hazard Physical Exposure (Inland Himalayan: Surge 0.0, Upper Basin Flash-flood, Landslide Slope, Wind 47-50 m/s)
- Phase 3: Demographic Vulnerability & Physical Carrying Capacity (Q1-Q4 Quadrants, Host Candidates)
- Phase 4: AHP-TOPSIS Relocation Prioritization (Ranks 1 to 208, zero gaps, CR 0.0038)
- Phase 5: Disaster Simulation Engine (What-If sensitivity recalculation)
- Phase 6: Decision & Action Planning (3-Horizon Action Plans, Capacity Gaps, Action Dashboard)
"""

import pytest
from pathlib import Path
import numpy as np
import pandas as pd
import geopandas as gpd
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"


# ==================== Phase 1: GIS & Boundaries Tests ====================

def test_ar_districts_geojson_integrity():
    """Verify Arunachal Pradesh 25 district boundaries GeoJSON geometry, properties, and CRS."""
    geojson_path = PROCESSED_DIR / "admin" / "arunachal_pradesh_25_districts.geojson"
    assert geojson_path.exists(), "AR 25 districts GeoJSON missing"

    gdf = gpd.read_file(geojson_path)
    assert len(gdf) == 25, f"Expected 25 districts for AR, found {len(gdf)}"
    assert "district_id" in gdf.columns
    assert "district_name" in gdf.columns
    assert gdf["district_id"].nunique() == 25
    assert gdf["geometry"].is_valid.all(), "Invalid geometries found in district boundaries"
    assert gdf.crs.to_string() == "EPSG:4326"


def test_ar_circles_geojson_integrity():
    """Verify Arunachal Pradesh 208 Circle boundaries GeoJSON geometry and attributes."""
    geojson_path = PROCESSED_DIR / "admin" / "arunachal_pradesh_circles.geojson"
    assert geojson_path.exists(), "AR circles GeoJSON missing"

    gdf = gpd.read_file(geojson_path)
    assert len(gdf) == 208, f"Expected 208 circles for AR, found {len(gdf)}"
    assert "mandal_id" in gdf.columns
    assert "district_id" in gdf.columns
    assert gdf["mandal_id"].nunique() == 208
    assert gdf["district_id"].nunique() == 25
    assert gdf["geometry"].is_valid.all(), "Invalid geometries found in circle boundaries"


def test_api_ar_gis_endpoints():
    """Verify /api/gis endpoints return valid GeoJSON for Arunachal Pradesh."""
    res_dist = client.get("/api/gis/districts?state_id=arunachal_pradesh")
    assert res_dist.status_code == 200
    data_dist = res_dist.json()
    assert data_dist["type"] == "FeatureCollection"
    assert len(data_dist["features"]) == 25

    res_blk = client.get("/api/gis/mandals?state_id=arunachal_pradesh")
    assert res_blk.status_code == 200
    data_blk = res_blk.json()
    assert data_blk["type"] == "FeatureCollection"
    assert len(data_blk["features"]) == 208


# ==================== Phase 2: Census 2011 Demographics Tests ====================

def test_ar_census_demographics():
    """Verify Census 2011 population aggregates (exactly 1,383,727), cohort bounds, and district distributions."""
    csv_path = PROCESSED_DIR / "census" / "ar_circle_demographics.csv"
    assert csv_path.exists(), "AR census demographics CSV missing"

    df = pd.read_csv(csv_path)
    assert len(df) == 208
    assert df["mandal_id"].nunique() == 208
    assert df["district_id"].nunique() == 25

    # Total population must match official Census 2011 baseline: exactly 1,383,727
    total_pop = df["total_population"].sum()
    assert total_pop == 1_383_727, f"Expected exactly 1,383,727 pop, got {total_pop}"

    # Verify demographic invariants
    assert (df["male_population"] + df["female_population"] == df["total_population"]).all()
    assert (df["children_0_6"] < df["total_population"]).all()
    assert (df["total_workers"] + df["non_workers"] == df["total_population"]).all()
    assert (df["households"] > 0).all()
    assert (df["average_household_size"] > 3.0).all()


def test_api_ar_demographics_endpoints():
    """Verify demographics API endpoints for Arunachal Pradesh."""
    res_sum = client.get("/api/demographics/summary?state_id=arunachal_pradesh")
    assert res_sum.status_code == 200
    data_sum = res_sum.json()
    assert data_sum["total_population"] == 1_383_727
    assert data_sum["total_districts"] == 25
    assert data_sum["state_code"] == "AR"
    assert data_sum["state_name"] == "Arunachal Pradesh"


# ==================== Phase 3: Hazard & Exposure Tests ====================

def test_ar_hazard_exposure():
    """Verify inland Himalayan multi-hazard parameters (surge = 0.0, Upper Basin flood, landslide slope risk)."""
    csv_path = PROCESSED_DIR / "hazard" / "mandal_exposure" / "ar_circle_multi_hazard_exposure.csv"
    assert csv_path.exists(), "AR hazard exposure CSV missing"

    df = pd.read_csv(csv_path)
    assert len(df) == 208

    # Inland state: Coastal storm surge depth must be strictly 0.000m
    assert (df["storm_surge_depth_m"] == 0.0).all()
    assert (df["storm_surge_exposure_category"] == "NOT APPLICABLE (INLAND HIMALAYAN)").all()

    # Flood inundation and slope criteria
    assert (df["flood_inundation_depth_m"] >= 0.0).all()
    assert (df["slope_mean_deg"] > 4.0).all()
    assert (df["composite_hazard_exposure_score"] > 0.0).all()
    assert (df["composite_hazard_exposure_score"] <= 1.0).all()


def test_api_ar_hazard_endpoints():
    """Verify hazard exposure API endpoints for Arunachal Pradesh."""
    res_sum = client.get("/api/hazard/summary?state_id=arunachal_pradesh")
    assert res_sum.status_code == 200
    data_sum = res_sum.json()
    assert data_sum["total_mandals"] == 208
    assert data_sum["storm_surge_included"] is False

    res_haz = client.get("/api/hazard/mandals?state_id=arunachal_pradesh")
    assert res_haz.status_code == 200
    data_haz = res_haz.json()
    assert data_haz["total_mandals"] == 208


# ==================== Phase 4: Vulnerability & Capacity Tests ====================

def test_ar_vulnerability_and_capacity():
    """Verify demographic vulnerability quadrants (Q1-Q4) and capacity adequacy."""
    vuln_path = PROCESSED_DIR / "vulnerability" / "ar_circle_demographic_vulnerability.csv"
    assert vuln_path.exists()
    v_df = pd.read_csv(vuln_path)
    assert len(v_df) == 208
    assert set(v_df["vulnerability_quadrant"]).issubset({"Q1", "Q2", "Q3", "Q4"})

    cap_path = PROCESSED_DIR / "capacity" / "ar_circle_capacity_adequacy.csv"
    assert cap_path.exists()
    c_df = pd.read_csv(cap_path)
    assert len(c_df) == 208
    assert (c_df["safe_habitable_land_fraction"] >= 0.0).all()
    assert (c_df["safe_habitable_land_fraction"] <= 1.0).all()


def test_api_ar_capacity_and_adequacy_endpoints():
    """Verify capacity and candidate host zone API endpoints for Arunachal Pradesh."""
    res_sum = client.get("/api/capacity/adequacy/summary?state_id=arunachal_pradesh")
    assert res_sum.status_code == 200
    data_sum = res_sum.json()
    assert data_sum["total_mandals"] == 208

    res_hosts = client.get("/api/capacity/host-zones/STATEWIDE_ALL?state_id=arunachal_pradesh")
    assert res_hosts.status_code == 200
    data_hosts = res_hosts.json()
    assert data_hosts["total_candidates"] >= 5


# ==================== Phase 5: Relocation Prioritization (AHP-TOPSIS) Tests ====================

def test_ar_relocation_prioritization():
    """Verify unbroken ranks 1-208, TOPSIS score bounds, and AHP consistency ratio (0.0038)."""
    csv_path = PROCESSED_DIR / "relocation" / "ar_circle_relocation_priority.csv"
    assert csv_path.exists()
    df = pd.read_csv(csv_path)
    assert len(df) == 208

    # Unbroken rank sequence from 1 to 208
    assert sorted(df["relocation_priority_rank"].tolist()) == list(range(1, 209))
    assert (df["topsis_score"] >= 0.0).all() and (df["topsis_score"] <= 1.0).all()
    assert (df["ranking_status"] == "FULL").all()

    # Priority bands check
    cat_counts = df["relocation_priority_category"].value_counts().to_dict()
    assert cat_counts.get("VERY HIGH", 0) >= 10


def test_api_ar_relocation_endpoints():
    """Verify relocation prioritization API endpoints for Arunachal Pradesh."""
    res_list = client.get("/api/relocation/mandals?state_id=arunachal_pradesh")
    assert res_list.status_code == 200
    data_list = res_list.json()
    assert data_list["total_mandals"] == 208
    assert len(data_list["items"]) == 208

    res_sum = client.get("/api/relocation/summary?state_id=arunachal_pradesh")
    assert res_sum.status_code == 200
    data_sum = res_sum.json()
    assert data_sum["total_mandals"] == 208
    assert data_sum["total_mandals_ranked"] == 208
    assert data_sum["ahp_consistency_ratio"] == 0.0038


# ==================== Phase 6: Simulation & Action Planning Tests ====================

def test_api_ar_simulation():
    """Verify What-If simulation engine on Arunachal Pradesh data."""
    payload = {
        "hazard_change": 0.20,
        "population_change": 0.05,
        "capacity_change": -0.10,
        "accessibility_change": -0.15
    }
    res = client.post("/api/simulation/run?state_id=arunachal_pradesh", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["total_mandals"] == 208
    assert len(data["mandals"]) == 208


def test_api_ar_decision_and_action_planning():
    """Verify action planning, capacity gap assessment, and decision summary for Arunachal Pradesh."""
    res_sum = client.get("/api/decision/summary?state_id=arunachal_pradesh")
    assert res_sum.status_code == 200
    data_sum = res_sum.json()
    assert data_sum["total_mandals"] == 208
    assert data_sum["very_high_priority_count"] >= 10
    assert len(data_sum["top_action_mandals"]) > 0

    # Test individual circle action plan (e.g. AR_CIR_001 Tawang)
    res_plan = client.get("/api/decision/mandal/AR_CIR_001/action-plan?state_id=arunachal_pradesh")
    assert res_plan.status_code == 200
    data_plan = res_plan.json()
    assert data_plan["mandal_id"] == "AR_CIR_001"
    assert len(data_plan["immediate_actions"]) > 0

    # Test capacity gap assessment
    res_gap = client.get("/api/decision/mandal/AR_CIR_001/capacity-gap?state_id=arunachal_pradesh")
    assert res_gap.status_code == 200
    data_gap = res_gap.json()
    assert data_gap["mandal_id"] == "AR_CIR_001"
    assert "shelter_capacity_verified" in data_gap
