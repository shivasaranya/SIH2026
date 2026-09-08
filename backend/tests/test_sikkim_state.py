"""
Unit Tests for Sikkim Master State Implementation in RakshaSethu (SIH26191)
Validates all 6 analytical phases:
- Phase 1: Administrative GIS & Demographics (6 Districts, 16 Sub-divisions, 610,577 population)
- Phase 2: Multi-Hazard Physical Exposure (Inland Himalayan: Surge 0.0, Teesta Basin GLOF, Landslide Slope, Wind)
- Phase 3: Demographic Vulnerability & Physical Carrying Capacity (Q1-Q4 Quadrants, Host Candidates)
- Phase 4: AHP-TOPSIS Relocation Prioritization (Ranks 1 to 16, zero gaps)
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

def test_sk_districts_geojson_integrity():
    """Verify Sikkim 6 district boundaries GeoJSON geometry, properties, and CRS."""
    geojson_path = PROCESSED_DIR / "admin" / "sikkim_6_districts.geojson"
    assert geojson_path.exists(), "SK 6 districts GeoJSON missing"

    gdf = gpd.read_file(geojson_path)
    assert len(gdf) == 6, f"Expected 6 districts for SK, found {len(gdf)}"
    assert "district_id" in gdf.columns
    assert "district_name" in gdf.columns
    assert gdf["district_id"].nunique() == 6
    assert gdf["geometry"].is_valid.all(), "Invalid geometries found in district boundaries"
    assert gdf.crs.to_string() == "EPSG:4326"


def test_sk_subdivisions_geojson_integrity():
    """Verify Sikkim 16 Sub-division boundaries GeoJSON geometry and attributes."""
    geojson_path = PROCESSED_DIR / "admin" / "sikkim_subdivisions.geojson"
    assert geojson_path.exists(), "SK sub-divisions GeoJSON missing"

    gdf = gpd.read_file(geojson_path)
    assert len(gdf) == 16, f"Expected 16 sub-divisions for SK, found {len(gdf)}"
    assert "mandal_id" in gdf.columns
    assert "district_id" in gdf.columns
    assert gdf["mandal_id"].nunique() == 16
    assert gdf["district_id"].nunique() == 6
    assert gdf["geometry"].is_valid.all(), "Invalid geometries found in sub-division boundaries"


def test_api_sk_gis_endpoints():
    """Verify /api/gis endpoints return valid GeoJSON for Sikkim."""
    res_dist = client.get("/api/gis/districts?state_id=sikkim")
    assert res_dist.status_code == 200
    data_dist = res_dist.json()
    assert data_dist["type"] == "FeatureCollection"
    assert len(data_dist["features"]) == 6

    res_blk = client.get("/api/gis/mandals?state_id=sikkim")
    assert res_blk.status_code == 200
    data_blk = res_blk.json()
    assert data_blk["type"] == "FeatureCollection"
    assert len(data_blk["features"]) == 16


# ==================== Phase 2: Census 2011 Demographics Tests ====================

def test_sk_census_demographics():
    """Verify Census 2011 population aggregates (exactly 610,577), cohort bounds, and district distributions."""
    csv_path = PROCESSED_DIR / "census" / "sk_subdivision_demographics.csv"
    assert csv_path.exists(), "SK census demographics CSV missing"

    df = pd.read_csv(csv_path)
    assert len(df) == 16
    assert df["mandal_id"].nunique() == 16
    assert df["district_id"].nunique() == 6

    # Total population must match official Census 2011 baseline: exactly 610,577
    total_pop = df["total_population"].sum()
    assert total_pop == 610_577, f"Expected exactly 610,577 pop, got {total_pop}"

    # Verify demographic invariants
    assert (df["male_population"] + df["female_population"] == df["total_population"]).all()
    assert (df["children_0_6"] < df["total_population"]).all()
    assert (df["total_workers"] + df["non_workers"] == df["total_population"]).all()
    assert (df["households"] > 0).all()
    assert (df["average_household_size"] > 3.0).all()


def test_api_sk_demographics_endpoints():
    """Verify demographics API endpoints for Sikkim."""
    res_sum = client.get("/api/demographics/summary?state_id=sikkim")
    assert res_sum.status_code == 200
    data_sum = res_sum.json()
    assert data_sum["total_population"] == 610_577
    assert data_sum["total_districts"] == 6
    assert data_sum["state_code"] == "SK"
    assert data_sum["state_name"] == "Sikkim"


# ==================== Phase 3: Hazard & Exposure Tests ====================

def test_sk_hazard_exposure():
    """Verify inland Himalayan multi-hazard parameters (surge = 0.0, Teesta GLOF and slope risk)."""
    csv_path = PROCESSED_DIR / "hazard" / "mandal_exposure" / "sk_subdivision_multi_hazard_exposure.csv"
    assert csv_path.exists(), "SK hazard exposure CSV missing"

    df = pd.read_csv(csv_path)
    assert len(df) == 16

    # Inland state: Coastal storm surge depth must be strictly 0.000m
    assert (df["storm_surge_depth_m"] == 0.0).all()
    assert (df["storm_surge_exposure_category"] == "NOT APPLICABLE (INLAND HIMALAYAN)").all()

    # Flood inundation and slope criteria
    assert (df["flood_inundation_depth_m"] >= 0.0).all()
    assert (df["slope_mean_deg"] > 10.0).all()
    assert (df["composite_hazard_exposure_score"] > 0.0).all()
    assert (df["composite_hazard_exposure_score"] <= 1.0).all()


def test_api_sk_hazard_endpoints():
    """Verify hazard exposure API endpoints for Sikkim."""
    res_sum = client.get("/api/hazard/summary?state_id=sikkim")
    assert res_sum.status_code == 200
    data_sum = res_sum.json()
    assert data_sum["total_mandals"] == 16
    assert data_sum["storm_surge_included"] is False

    res_haz = client.get("/api/hazard/mandals?state_id=sikkim")
    assert res_haz.status_code == 200
    data_haz = res_haz.json()
    assert data_haz["total_mandals"] == 16


# ==================== Phase 4: Vulnerability & Capacity Tests ====================

def test_sk_vulnerability_and_capacity():
    """Verify demographic vulnerability quadrants (Q1-Q4) and capacity adequacy."""
    vuln_path = PROCESSED_DIR / "vulnerability" / "sk_subdivision_demographic_vulnerability.csv"
    assert vuln_path.exists()
    v_df = pd.read_csv(vuln_path)
    assert len(v_df) == 16
    assert set(v_df["vulnerability_quadrant"]).issubset({"Q1", "Q2", "Q3", "Q4"})

    cap_path = PROCESSED_DIR / "capacity" / "sk_subdivision_capacity_adequacy.csv"
    assert cap_path.exists()
    c_df = pd.read_csv(cap_path)
    assert len(c_df) == 16
    assert (c_df["safe_habitable_land_fraction"] >= 0.0).all()
    assert (c_df["safe_habitable_land_fraction"] <= 1.0).all()


def test_api_sk_capacity_and_adequacy_endpoints():
    """Verify capacity and candidate host zone API endpoints for Sikkim."""
    res_sum = client.get("/api/capacity/adequacy/summary?state_id=sikkim")
    assert res_sum.status_code == 200
    data_sum = res_sum.json()
    assert data_sum["total_mandals"] == 16

    res_hosts = client.get("/api/capacity/host-zones/STATEWIDE_ALL?state_id=sikkim")
    assert res_hosts.status_code == 200
    data_hosts = res_hosts.json()
    assert data_hosts["total_candidates"] >= 4


# ==================== Phase 5: Relocation Prioritization (AHP-TOPSIS) Tests ====================

def test_sk_relocation_prioritization():
    """Verify unbroken ranks 1-16, TOPSIS score bounds, and AHP consistency ratio (0.0038)."""
    csv_path = PROCESSED_DIR / "relocation" / "sk_subdivision_relocation_priority.csv"
    assert csv_path.exists()
    df = pd.read_csv(csv_path)
    assert len(df) == 16

    # Unbroken rank sequence from 1 to 16
    assert sorted(df["relocation_priority_rank"].tolist()) == list(range(1, 17))
    assert (df["topsis_score"] >= 0.0).all() and (df["topsis_score"] <= 1.0).all()
    assert (df["ranking_status"] == "FULL").all()

    # Priority bands check
    cat_counts = df["relocation_priority_category"].value_counts().to_dict()
    assert cat_counts.get("VERY HIGH", 0) >= 2


def test_api_sk_relocation_endpoints():
    """Verify relocation prioritization API endpoints for Sikkim."""
    res_list = client.get("/api/relocation/mandals?state_id=sikkim")
    assert res_list.status_code == 200
    data_list = res_list.json()
    assert data_list["total_mandals"] == 16
    assert len(data_list["items"]) == 16

    res_sum = client.get("/api/relocation/summary?state_id=sikkim")
    assert res_sum.status_code == 200
    data_sum = res_sum.json()
    assert data_sum["total_mandals"] == 16
    assert data_sum["total_mandals_ranked"] == 16
    assert data_sum["ahp_consistency_ratio"] == 0.0038


# ==================== Phase 6: Simulation & Action Planning Tests ====================

def test_api_sk_simulation():
    """Verify What-If simulation engine on Sikkim data."""
    payload = {
        "hazard_change": 0.20,
        "population_change": 0.05,
        "capacity_change": -0.10,
        "accessibility_change": -0.15
    }
    res = client.post("/api/simulation/run?state_id=sikkim", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["total_mandals"] == 16
    assert len(data["mandals"]) == 16


def test_api_sk_decision_and_action_planning():
    """Verify action planning, capacity gap assessment, and decision summary for Sikkim."""
    res_sum = client.get("/api/decision/summary?state_id=sikkim")
    assert res_sum.status_code == 200
    data_sum = res_sum.json()
    assert data_sum["total_mandals"] == 16
    assert data_sum["very_high_priority_count"] >= 2
    assert len(data_sum["top_action_mandals"]) > 0

    # Test individual sub-division action plan (Dzongu / Chungthang)
    res_plan = client.get("/api/decision/mandal/SK_SD_01/action-plan?state_id=sikkim")
    assert res_plan.status_code == 200
    data_plan = res_plan.json()
    assert data_plan["mandal_id"] == "SK_SD_01"
    assert len(data_plan["immediate_actions"]) > 0

    # Test capacity gap assessment
    res_gap = client.get("/api/decision/mandal/SK_SD_01/capacity-gap?state_id=sikkim")
    assert res_gap.status_code == 200
    data_gap = res_gap.json()
    assert data_gap["mandal_id"] == "SK_SD_01"
    assert "shelter_capacity_verified" in data_gap
