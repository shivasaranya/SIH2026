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

def test_west_bengal_districts_geojson_integrity():
    """Verify West Bengal 23 district boundaries GeoJSON geometry, properties, and CRS."""
    geojson_path = PROCESSED_DIR / "admin" / "west_bengal_23_districts.geojson"
    assert geojson_path.exists(), "West Bengal 23 districts GeoJSON missing"

    gdf = gpd.read_file(geojson_path)
    assert len(gdf) == 23, f"Expected 23 districts for West Bengal, found {len(gdf)}"
    assert "district_id" in gdf.columns
    assert "district_name" in gdf.columns
    assert "area_sqkm" in gdf.columns
    assert gdf["district_id"].nunique() == 23
    assert gdf["geometry"].is_valid.all(), "Invalid geometries found in district boundaries"
    assert gdf.crs.to_string() == "EPSG:4326"


def test_west_bengal_blocks_geojson_integrity():
    """Verify West Bengal 346 C.D. block boundaries GeoJSON geometry and attributes."""
    geojson_path = PROCESSED_DIR / "admin" / "west_bengal_blocks.geojson"
    assert geojson_path.exists(), "West Bengal blocks GeoJSON missing"

    gdf = gpd.read_file(geojson_path)
    assert len(gdf) == 346, f"Expected 346 blocks for West Bengal, found {len(gdf)}"
    assert "mandal_id" in gdf.columns
    assert "block_id" in gdf.columns
    assert "block_name" in gdf.columns
    assert "current_district_id" in gdf.columns
    assert gdf["mandal_id"].nunique() == 346
    assert gdf["current_district_id"].nunique() == 23
    assert gdf["geometry"].is_valid.all(), "Invalid geometries found in block boundaries"


def test_api_west_bengal_gis_endpoints():
    """Verify /api/gis endpoints return valid GeoJSON for West Bengal."""
    res_dist = client.get("/api/gis/districts?state_id=west_bengal")
    assert res_dist.status_code == 200
    data_dist = res_dist.json()
    assert data_dist["type"] == "FeatureCollection"
    assert len(data_dist["features"]) == 23

    res_blk = client.get("/api/gis/mandals?state_id=west_bengal")
    assert res_blk.status_code == 200
    data_blk = res_blk.json()
    assert data_blk["type"] == "FeatureCollection"
    assert len(data_blk["features"]) == 346


# ==================== Phase 2: Census 2011 Demographics Tests ====================

def test_west_bengal_census_demographics():
    """Verify Census 2011 population aggregates (~91.28M), cohort bounds, and district distributions."""
    csv_path = PROCESSED_DIR / "census" / "wb_block_demographics.csv"
    assert csv_path.exists(), "West Bengal census demographics CSV missing"

    df = pd.read_csv(csv_path)
    assert len(df) == 346
    assert df["mandal_id"].nunique() == 346
    assert df["current_district_id"].nunique() == 23

    # Total population must match official Census 2011 West Bengal baseline (~91.28 million)
    total_pop = df["population_total"].sum()
    assert 85_000_000 <= total_pop <= 95_000_000, f"Expected ~91.28M pop, got {total_pop}"

    # Verify demographic invariants
    assert (df["population_male"] + df["population_female"] == df["population_total"]).all()
    assert (df["child_population_0_6"] >= 0).all()
    assert (df["child_population_0_6"] <= df["population_total"]).all()
    assert (df["non_workers"] >= 0).all()
    assert (df["total_households"] > 0).all()


def test_api_west_bengal_demographics_endpoints():
    """Verify /api/demographics returns state & district level summaries for West Bengal."""
    res = client.get("/api/demographics/summary?state_id=west_bengal")
    assert res.status_code == 200
    data = res.json()
    assert data["state_code"] == "WB"
    assert data["state_name"] == "West Bengal"
    assert data["total_districts"] == 23
    assert data["total_population"] > 85_000_000


# ==================== Phase 3A: Hazard Exposure Tests ====================

def test_west_bengal_coastal_and_riverine_hazard_exposure():
    """Verify Sundarbans surge modeling, riverine flood recurrence, and BIS IS 875 wind speeds."""
    csv_path = PROCESSED_DIR / "hazard" / "mandal_exposure" / "wb_block_multi_hazard_exposure.csv"
    assert csv_path.exists(), "West Bengal multi-hazard exposure CSV missing"

    df = pd.read_csv(csv_path)
    assert len(df) == 346
    assert (df["c1_hazard_exposure"] >= 0.0).all()
    assert (df["c1_hazard_exposure"] <= 1.0).all()

    # Coastal surge verification: Sundarbans districts (South 24 Parganas, Purba Medinipur, North 24 Parganas)
    coastal_df = df[df["current_district_name"].isin(["South Twenty Four Parganas", "North Twenty Four Parganas", "Purba Medinipur"])]
    assert len(coastal_df) > 0
    assert (coastal_df["cyclone_exposure_score"] > 0.40).any()
    assert (coastal_df["storm_surge_peak_depth_meters"] > 0.0).any()


def test_api_west_bengal_hazard_endpoints():
    """Verify /api/hazard endpoints return exposure data and GeoJSON for West Bengal."""
    res_list = client.get("/api/hazard/mandals?state_id=west_bengal")
    assert res_list.status_code == 200
    assert len(res_list.json()["items"]) == 346

    res_geo = client.get("/api/hazard/geojson?state_id=west_bengal")
    assert res_geo.status_code == 200
    assert len(res_geo.json()["features"]) == 346


# ==================== Phase 3B: Demographic Vulnerability Tests ====================

def test_west_bengal_demographic_vulnerability():
    """Verify vulnerability components (child, non-worker, SC/ST, female ratios) and sensitivity indices."""
    csv_path = PROCESSED_DIR / "vulnerability" / "wb_block_demographic_vulnerability.csv"
    assert csv_path.exists(), "West Bengal vulnerability CSV missing"

    df = pd.read_csv(csv_path)
    assert len(df) == 346
    assert (df["demographic_sensitivity_index"] >= 0.0).all()
    assert (df["demographic_sensitivity_index"] <= 1.0).all()
    assert (df["c2_demographic_sensitivity"] >= 0.0).all()
    assert (df["c2_demographic_sensitivity"] <= 1.0).all()


# ==================== Phase 3C: Capacity & Adequacy Tests ====================

def test_west_bengal_carrying_capacity_and_bottlenecks():
    """Verify carrying capacity evaluation across IPHS beds, WBDMD shelters, water/sanitation, and safe land."""
    cap_csv = PROCESSED_DIR / "capacity" / "wb_block_capacity_components.csv"
    adeq_csv = PROCESSED_DIR / "capacity" / "wb_block_capacity_adequacy.csv"
    assert cap_csv.exists()
    assert adeq_csv.exists()

    df_cap = pd.read_csv(cap_csv)
    df_adeq = pd.read_csv(adeq_csv)

    assert len(df_cap) == 346
    assert len(df_adeq) == 346
    assert (df_cap["normative_health_capacity_baseline"] > 0).all()
    assert (df_cap["safe_area_fraction"] >= 0.0).all()
    assert (df_cap["safe_area_fraction"] <= 1.0).all()

    # Verify candidate host zones
    host_csv = PROCESSED_DIR / "capacity" / "wb_host_zone_candidates.csv"
    assert host_csv.exists()
    df_host = pd.read_csv(host_csv)
    assert len(df_host) > 0
    assert "source_mandal_id" in df_host.columns
    assert "candidate_mandal_id" in df_host.columns


def test_api_west_bengal_capacity_endpoints():
    """Verify /api/capacity summary and adequacy endpoints for West Bengal."""
    res_sum = client.get("/api/capacity/summary?state_id=west_bengal")
    assert res_sum.status_code == 200
    assert res_sum.json()["total_mandals"] == 346

    res_adeq = client.get("/api/capacity/adequacy/summary?state_id=west_bengal")
    assert res_adeq.status_code == 200
    assert res_adeq.json()["total_mandals"] == 346


# ==================== Phase 4: AHP + TOPSIS Relocation Tests ====================

def test_west_bengal_relocation_priority_ahp_topsis():
    """Verify AHP weights, TOPSIS score bounds, priority classifications, and Pydantic compliance."""
    reloc_csv = PROCESSED_DIR / "relocation" / "wb_block_relocation_priority.csv"
    assert reloc_csv.exists()

    df = pd.read_csv(reloc_csv)
    assert len(df) == 346
    assert (df["topsis_score"] >= 0.0).all()
    assert (df["topsis_score"] <= 1.0).all()

    categories = set(df["relocation_priority_category"].unique())
    assert categories.issubset({"VERY HIGH", "HIGH", "MODERATE", "LOW", "INSUFFICIENT-DATA"})

    # Verify rank monotonicity
    valid_df = df[df["ranking_status"] != "INSUFFICIENT_DATA"].sort_values("relocation_priority_rank")
    assert (valid_df["topsis_score"].diff().dropna() <= 1e-6).all(), "TOPSIS scores not monotonically decreasing with rank"


def test_api_west_bengal_relocation_endpoints():
    """Verify /api/relocation endpoints return complete ranked items for West Bengal."""
    res_list = client.get("/api/relocation/mandals?state_id=west_bengal")
    assert res_list.status_code == 200
    data = res_list.json()
    assert data["total_mandals"] == 346
    assert len(data["items"]) == 346

    res_sum = client.get("/api/relocation/summary?state_id=west_bengal")
    assert res_sum.status_code == 200
    assert res_sum.json()["total_mandals"] == 346


# ==================== Phase 5 & 6: Simulation & Decision Support Tests ====================

def test_api_west_bengal_simulation_and_whatif():
    """Verify /api/simulation/run recalculates What-If scenarios deterministically for West Bengal."""
    payload = {
        "hazard_change": 0.30,
        "population_change": 0.10,
        "capacity_change": 0.10,
        "accessibility_change": -0.10
    }
    res = client.post("/api/simulation/run?state_id=west_bengal", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["total_mandals"] == 346
    assert len(data["mandals"]) == 346


def test_api_west_bengal_decision_and_action_plan():
    """Verify /api/decision endpoints generate capacity gaps and institutional action plans for West Bengal."""
    # Test action dashboard summary
    res_dash = client.get("/api/decision/summary?state_id=west_bengal")
    assert res_dash.status_code == 200
    assert res_dash.json()["total_mandals"] == 346

    # Test individual block action plan (e.g. Gosaba / WB_BLOCK_318)
    res_plan = client.get("/api/decision/mandal/WB_BLOCK_318/action-plan?state_id=west_bengal")
    assert res_plan.status_code == 200
    plan_data = res_plan.json()
    assert plan_data["mandal_id"] == "WB_BLOCK_318"
    assert len(plan_data["immediate_actions"]) > 0 or len(plan_data["short_term_actions"]) > 0

    # Test candidate host zone retrieval
    res_hosts = client.get("/api/capacity/host-zones/WB_BLOCK_318?state_id=west_bengal")
    assert res_hosts.status_code == 200
    assert res_hosts.json()["source_mandal_id"] == "WB_BLOCK_318"

    res_hosts_reloc = client.get("/api/relocation/mandal/WB_BLOCK_318/host-zones?state_id=west_bengal")
    assert res_hosts_reloc.status_code == 200
    assert res_hosts_reloc.json()["source_mandal_id"] == "WB_BLOCK_318"

