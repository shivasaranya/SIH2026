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

def test_assam_districts_geojson_integrity():
    """Verify Assam 33 district boundaries GeoJSON geometry, properties, and CRS."""
    geojson_path = PROCESSED_DIR / "admin" / "assam_33_districts.geojson"
    assert geojson_path.exists(), "Assam 33 districts GeoJSON missing"

    gdf = gpd.read_file(geojson_path)
    assert len(gdf) == 33, f"Expected 33 districts for Assam, found {len(gdf)}"
    assert "district_id" in gdf.columns
    assert "district_name" in gdf.columns
    assert "area_sqkm" in gdf.columns
    assert gdf["district_id"].nunique() == 33
    assert gdf["geometry"].is_valid.all(), "Invalid geometries found in district boundaries"
    assert gdf.crs.to_string() == "EPSG:4326"


def test_assam_revenue_circles_geojson_integrity():
    """Verify Assam 153 revenue circle boundaries GeoJSON geometry and attributes."""
    geojson_path = PROCESSED_DIR / "admin" / "assam_revenue_circles.geojson"
    assert geojson_path.exists(), "Assam revenue circles GeoJSON missing"

    gdf = gpd.read_file(geojson_path)
    assert len(gdf) == 153, f"Expected 153 revenue circles for Assam, found {len(gdf)}"
    assert "mandal_id" in gdf.columns
    assert "circle_id" in gdf.columns
    assert "circle_name" in gdf.columns
    assert "current_district_id" in gdf.columns
    assert gdf["mandal_id"].nunique() == 153
    assert gdf["current_district_id"].nunique() == 33
    assert gdf["geometry"].is_valid.all(), "Invalid geometries found in revenue circle boundaries"


def test_api_assam_gis_endpoints():
    """Verify /api/gis endpoints return valid GeoJSON for Assam."""
    res_dist = client.get("/api/gis/districts?state_id=assam")
    assert res_dist.status_code == 200
    data_dist = res_dist.json()
    assert data_dist["type"] == "FeatureCollection"
    assert len(data_dist["features"]) == 33

    res_circ = client.get("/api/gis/mandals?state_id=assam")
    assert res_circ.status_code == 200
    data_circ = res_circ.json()
    assert data_circ["type"] == "FeatureCollection"
    assert len(data_circ["features"]) == 153


# ==================== Phase 2: Census 2011 Demographics Tests ====================

def test_assam_census_demographics():
    """Verify Census 2011 population aggregates (31.2M), cohort bounds, and district distributions."""
    csv_path = PROCESSED_DIR / "census" / "as_circle_demographics.csv"
    assert csv_path.exists(), "Assam census demographics CSV missing"

    df = pd.read_csv(csv_path)
    assert len(df) == 153
    assert df["mandal_id"].nunique() == 153
    assert df["current_district_id"].nunique() == 33

    # Total population must match official Census 2011 Assam baseline (~31.2 million)
    total_pop = df["population_total"].sum()
    assert 30_000_000 <= total_pop <= 33_000_000, f"Expected ~31.2M pop, got {total_pop}"

    # Verify demographic invariants
    assert (df["population_male"] + df["population_female"] == df["population_total"]).all()
    assert (df["child_population_0_6"] >= 0).all()
    assert (df["child_population_0_6"] <= df["population_total"]).all()
    assert (df["non_workers"] >= 0).all()
    assert (df["total_households"] > 0).all()


def test_api_assam_demographics_endpoints():
    """Verify /api/demographics returns state & district level summaries for Assam."""
    res = client.get("/api/demographics/summary?state_id=assam")
    assert res.status_code == 200
    data = res.json()
    assert data["state_code"] == "AS"
    assert data["state_name"] == "Assam"
    assert data["total_districts"] == 33
    assert data["total_population"] > 30_000_000


# ==================== Phase 3A: Hazard Exposure Tests ====================

def test_assam_hazard_exposure():
    """Verify inland physical hazard components (riverine flood, storm wind, landslide/slope, 0 coastal surge)."""
    csv_path = PROCESSED_DIR / "hazard" / "mandal_exposure" / "as_circle_multi_hazard_exposure.csv"
    assert csv_path.exists(), "Assam hazard exposure CSV missing"

    df = pd.read_csv(csv_path)
    assert len(df) == 153

    # Coastal surge and cyclone landfall must be explicitly 0.0 for inland Assam
    assert (df["cyclone_hazard_index"] == 0.0).all()
    assert (df["cyclone_hazard_category"] == "NOT APPLICABLE (INLAND)").all()

    # Flood recurrence, storm wind, and steep slope indices must be bounded [0, 1]
    assert (df["flood_hazard_index"] >= 0.0).all() and (df["flood_hazard_index"] <= 1.0).all()
    assert (df["wind_hazard_index"] >= 0.0).all() and (df["wind_hazard_index"] <= 1.0).all()
    assert (df["multi_hazard_exposure_index"] >= 0.0).all() and (df["multi_hazard_exposure_index"] <= 1.0).all()


def test_api_assam_hazard_endpoints():
    """Verify /api/hazard endpoints for Assam."""
    res = client.get("/api/hazard/summary?state_id=assam")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 153

    res_list = client.get("/api/hazard/mandals?state_id=assam")
    assert res_list.status_code == 200
    assert res_list.json()["total_mandals"] == 153


# ==================== Phase 3B/C: Vulnerability & Carrying Capacity Tests ====================

def test_assam_vulnerability_and_capacity():
    """Verify demographic sensitivity and physical carrying capacity components."""
    v_path = PROCESSED_DIR / "vulnerability" / "as_circle_demographic_vulnerability.csv"
    c_path = PROCESSED_DIR / "capacity" / "as_circle_capacity_components.csv"
    a_path = PROCESSED_DIR / "capacity" / "as_circle_capacity_adequacy.csv"
    h_path = PROCESSED_DIR / "capacity" / "as_host_zone_candidates.csv"

    assert v_path.exists() and c_path.exists() and a_path.exists() and h_path.exists()

    df_v = pd.read_csv(v_path)
    df_c = pd.read_csv(c_path)
    df_a = pd.read_csv(a_path)
    df_h = pd.read_csv(h_path)

    assert len(df_v) == 153
    assert len(df_c) == 153
    assert len(df_a) == 153
    assert len(df_h) > 0

    # Vulnerability bounds
    assert (df_v["demographic_sensitivity_index"] >= 0.0).all() and (df_v["demographic_sensitivity_index"] <= 1.0).all()
    valid_quads = {
        "Q1 - Highest Planning Concern",
        "Q2 - Hazard-Driven Concern",
        "Q3 - Demographic Sensitivity Concern",
        "Q4 - Lower Modeled Concern"
    }
    assert set(df_v["priority_quadrant"].unique()).issubset(valid_quads)

    # Safe habitable land headroom
    assert (df_c["safe_area_fraction"] >= 0.0).all() and (df_c["safe_area_fraction"] <= 1.0).all()
    assert (df_c["road_accessibility_score"] >= 0.0).all() and (df_c["road_accessibility_score"] <= 1.0).all()

    # Host zone candidates have low hazard and positive distance
    assert (df_h["candidate_hazard_exposure"] <= 0.40).all()
    assert (df_h["distance_km"] > 0).all()


def test_api_assam_capacity_and_adequacy_endpoints():
    """Verify /api/capacity endpoints for Assam."""
    res_sum = client.get("/api/capacity/summary?state_id=assam")
    assert res_sum.status_code == 200
    assert res_sum.json()["total_mandals"] == 153

    res_adeq = client.get("/api/capacity/adequacy/summary?state_id=assam")
    assert res_adeq.status_code == 200
    assert res_adeq.json()["total_mandals"] == 153


# ==================== Phase 4: AHP-TOPSIS Relocation Prioritization Tests ====================

def test_assam_relocation_prioritization():
    """Verify Saaty AHP weight derivation and TOPSIS rank distribution for Assam."""
    reloc_path = PROCESSED_DIR / "relocation" / "as_circle_relocation_priority.csv"
    assert reloc_path.exists()

    df = pd.read_csv(reloc_path)
    assert len(df) == 153
    assert (df["topsis_score"] >= 0.0).all() and (df["topsis_score"] <= 1.0).all()
    assert set(df["relocation_priority_category"].unique()).issubset({"VERY HIGH", "HIGH", "MODERATE", "LOW"})
    assert set(df["ranking_status"].unique()) == {"FULL"}

    # Rank consistency (1 to 153 without gaps)
    ranks = sorted(df["relocation_priority_rank"].astype(int).tolist())
    assert ranks == list(range(1, 154))


def test_api_assam_relocation_endpoints():
    """Verify /api/relocation endpoints for Assam."""
    res_sum = client.get("/api/relocation/summary?state_id=assam")
    assert res_sum.status_code == 200
    data_sum = res_sum.json()
    assert data_sum["total_mandals"] == 153
    assert data_sum["total_mandals_ranked"] == 153
    assert data_sum["ahp_consistency_ratio"] < 0.10

    res_top = client.get("/api/relocation/top?limit=5&state_id=assam")
    assert res_top.status_code == 200
    assert len(res_top.json()["items"]) == 5

    res_detail = client.get("/api/relocation/mandal/AS_CIRCLE_001?state_id=assam")
    assert res_detail.status_code == 200
    assert res_detail.json()["mandal_id"] == "AS_CIRCLE_001"


# ==================== Phase 5 & 6: Simulation & Decision Action Planning Tests ====================

def test_api_assam_simulation():
    """Verify what-if sensitivity recalculation on Assam circles."""
    payload = {
        "hazard_change": 0.30,
        "population_change": 0.10,
        "capacity_change": 0.20,
        "accessibility_change": -0.20
    }
    res = client.post("/api/simulation/run?state_id=assam", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["total_mandals"] == 153
    assert len(data["mandals"]) == 153
    assert data["summary"]["mandals_priority_increased"] > 0


def test_api_assam_decision_and_action_planning():
    """Verify 3-horizon action plans, capacity gap assessments, and state action dashboard for Assam."""
    res_dash = client.get("/api/decision/summary?state_id=assam")
    assert res_dash.status_code == 200
    dash_data = res_dash.json()
    assert dash_data["total_mandals"] == 153
    assert len(dash_data["top_action_mandals"]) > 0

    res_gap = client.get("/api/decision/mandal/AS_CIRCLE_001/capacity-gap?state_id=assam")
    assert res_gap.status_code == 200
    gap_data = res_gap.json()
    assert gap_data["mandal_id"] == "AS_CIRCLE_001"
    assert "planning_population" in gap_data

    res_act = client.get("/api/decision/mandal/AS_CIRCLE_001/action-plan?state_id=assam")
    assert res_act.status_code == 200
    act_data = res_act.json()
    assert len(act_data["immediate_actions"]) > 0 or len(act_data["short_term_actions"]) > 0
