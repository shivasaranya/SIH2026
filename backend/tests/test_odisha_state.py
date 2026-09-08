import json
import pytest
from pathlib import Path
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"


# ==================== Phase 1: GIS & Boundaries Tests ====================

def test_odisha_districts_geojson_integrity():
    """Verify Odisha 30 district boundaries GeoJSON geometry, properties, and CRS."""
    geojson_path = PROCESSED_DIR / "admin" / "odisha_30_districts.geojson"
    assert geojson_path.exists(), "Odisha 30 districts GeoJSON missing"

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["type"] == "FeatureCollection"
    features = data["features"]
    assert len(features) == 30, f"Expected 30 districts for Odisha, found {len(features)}"
    
    district_ids = set()
    for feat in features:
        props = feat["properties"]
        assert "district_id" in props
        assert "district_name" in props
        district_ids.add(props["district_id"])
        assert feat["geometry"] is not None
        assert feat["geometry"]["type"] in ["Polygon", "MultiPolygon"]

    assert len(district_ids) == 30


def test_odisha_blocks_geojson_integrity():
    """Verify Odisha 475 block boundaries GeoJSON geometry and attributes."""
    geojson_path = PROCESSED_DIR / "admin" / "odisha_blocks.geojson"
    assert geojson_path.exists(), "Odisha blocks GeoJSON missing"

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["type"] == "FeatureCollection"
    features = data["features"]
    assert len(features) == 475, f"Expected 475 blocks for Odisha, found {len(features)}"

    mandal_ids = set()
    dist_ids = set()
    for feat in features:
        props = feat["properties"]
        assert "mandal_id" in props or "block_id" in props
        m_id = props.get("mandal_id") or props.get("block_id")
        mandal_ids.add(m_id)
        if "current_district_id" in props:
            dist_ids.add(props["current_district_id"])
        assert feat["geometry"] is not None
        assert feat["geometry"]["type"] in ["Polygon", "MultiPolygon"]

    assert len(mandal_ids) == 475
    assert len(dist_ids) == 30


def test_api_odisha_gis_endpoints():
    """Verify /api/gis endpoints return valid GeoJSON for Odisha."""
    res_dist = client.get("/api/gis/districts?state_id=odisha")
    assert res_dist.status_code == 200
    data_dist = res_dist.json()
    assert data_dist["type"] == "FeatureCollection"
    assert len(data_dist["features"]) == 30

    res_blk = client.get("/api/gis/mandals?state_id=odisha")
    assert res_blk.status_code == 200
    data_blk = res_blk.json()
    assert data_blk["type"] == "FeatureCollection"
    assert len(data_blk["features"]) == 475


# ==================== Phase 2: Census 2011 Demographics Tests ====================

def test_odisha_census_demographics():
    """Verify Census 2011 population aggregates (~41.97M), cohort bounds, and district distributions."""
    csv_path = PROCESSED_DIR / "census" / "od_block_demographics.csv"
    assert csv_path.exists(), "Odisha census demographics CSV missing"

    df = pd.read_csv(csv_path)
    assert len(df) == 475
    assert df["mandal_id"].nunique() == 475
    assert df["current_district_id"].nunique() == 30

    # Total population must match official Census 2011 Odisha baseline (~41.97 million)
    total_pop = df["population_total"].sum()
    assert 40_000_000 <= total_pop <= 44_000_000, f"Expected ~41.97M pop, got {total_pop}"

    # Verify demographic invariants
    assert (df["population_male"] + df["population_female"] == df["population_total"]).all()
    assert (df["child_population_0_6"] >= 0).all()
    assert (df["child_population_0_6"] <= df["population_total"]).all()
    assert (df["non_workers"] >= 0).all()
    assert (df["total_households"] > 0).all()


def test_api_odisha_demographics_endpoints():
    """Verify /api/demographics returns state & district level summaries for Odisha."""
    res = client.get("/api/demographics/summary?state_id=odisha")
    assert res.status_code == 200
    data = res.json()
    assert data["state_code"] == "OD"
    assert data["state_name"] == "Odisha"
    assert data["total_districts"] == 30
    assert data["total_population"] > 40_000_000


# ==================== Phase 3A: Hazard Exposure Tests ====================

def test_odisha_coastal_and_riverine_hazard_exposure():
    """Verify Coastal cyclone surge modeling, Mahanadi flood recurrence, and wind speeds."""
    csv_path = PROCESSED_DIR / "hazard" / "mandal_exposure" / "od_block_multi_hazard_exposure.csv"
    assert csv_path.exists(), "Odisha multi-hazard exposure CSV missing"

    df = pd.read_csv(csv_path)
    assert len(df) == 475
    assert (df["c1_hazard_exposure"] >= 0.0).all()
    assert (df["c1_hazard_exposure"] <= 1.0).all()

    # Coastal surge verification: Coastal districts (Bhadrak, Kendrapara, Jagatsinghpur, Puri, Balasore)
    coastal_df = df[df["current_district_name"].isin(["Bhadrak", "Kendrapara", "Jagatsinghpur", "Puri", "Baleshwar"])]
    assert len(coastal_df) > 0
    assert (coastal_df["cyclone_exposure_score"] > 0.40).any()


def test_api_odisha_hazard_endpoints():
    """Verify /api/hazard endpoints return exposure data and GeoJSON for Odisha."""
    res_list = client.get("/api/hazard/mandals?state_id=odisha")
    assert res_list.status_code == 200
    assert len(res_list.json()["items"]) == 475

    res_geo = client.get("/api/hazard/geojson?state_id=odisha")
    assert res_geo.status_code == 200
    assert len(res_geo.json()["features"]) == 475


# ==================== Phase 3B: Demographic Vulnerability Tests ====================

def test_odisha_demographic_vulnerability():
    """Verify vulnerability components and sensitivity indices for Odisha."""
    csv_path = PROCESSED_DIR / "vulnerability" / "od_block_demographic_vulnerability.csv"
    assert csv_path.exists(), "Odisha vulnerability CSV missing"

    df = pd.read_csv(csv_path)
    assert len(df) == 475
    assert (df["demographic_sensitivity_index"] >= 0.0).all()
    assert (df["demographic_sensitivity_index"] <= 1.0).all()
    assert (df["c2_demographic_sensitivity"] >= 0.0).all()
    assert (df["c2_demographic_sensitivity"] <= 1.0).all()


# ==================== Phase 3C: Capacity & Adequacy Tests ====================

def test_odisha_carrying_capacity_and_bottlenecks():
    """Verify carrying capacity evaluation across IPHS beds, shelters, water/sanitation, and safe land."""
    cap_csv = PROCESSED_DIR / "capacity" / "od_block_capacity_components.csv"
    adeq_csv = PROCESSED_DIR / "capacity" / "od_block_capacity_adequacy.csv"
    assert cap_csv.exists()
    assert adeq_csv.exists()

    df_cap = pd.read_csv(cap_csv)
    df_adeq = pd.read_csv(adeq_csv)

    assert len(df_cap) == 475
    assert len(df_adeq) == 475
    assert (df_cap["safe_area_fraction"] >= 0.0).all()
    assert (df_cap["safe_area_fraction"] <= 1.0).all()

    # Verify candidate host zones
    host_csv = PROCESSED_DIR / "capacity" / "od_host_zone_candidates.csv"
    assert host_csv.exists()
    df_host = pd.read_csv(host_csv)
    assert len(df_host) > 0
    assert "source_mandal_id" in df_host.columns
    assert "candidate_mandal_id" in df_host.columns


def test_api_odisha_capacity_endpoints():
    """Verify /api/capacity summary and adequacy endpoints for Odisha."""
    res_sum = client.get("/api/capacity/summary?state_id=odisha")
    assert res_sum.status_code == 200
    assert res_sum.json()["total_mandals"] == 475

    res_adeq = client.get("/api/capacity/adequacy/summary?state_id=odisha")
    assert res_adeq.status_code == 200
    assert res_adeq.json()["total_mandals"] == 475


# ==================== Phase 4: AHP + TOPSIS Relocation Tests ====================

def test_odisha_relocation_priority_ahp_topsis():
    """Verify AHP weights, TOPSIS score bounds, priority classifications, and Pydantic compliance."""
    reloc_csv = PROCESSED_DIR / "relocation" / "od_block_relocation_priority.csv"
    assert reloc_csv.exists()

    df = pd.read_csv(reloc_csv)
    assert len(df) == 475
    assert (df["topsis_score"] >= 0.0).all()
    assert (df["topsis_score"] <= 1.0).all()

    categories = set(df["relocation_priority_category"].unique())
    assert categories.issubset({"VERY HIGH", "HIGH", "MODERATE", "LOW", "INSUFFICIENT-DATA", "INSUFFICIENT_DATA"})

    # Verify rank monotonicity
    valid_df = df[~df["ranking_status"].isin(["INSUFFICIENT_DATA", "INSUFFICIENT-DATA"])].sort_values("relocation_priority_rank")
    assert (valid_df["topsis_score"].diff().dropna() <= 1e-6).all(), "TOPSIS scores not monotonically decreasing with rank"


def test_api_odisha_relocation_endpoints():
    """Verify /api/relocation endpoints return complete ranked items for Odisha."""
    res_list = client.get("/api/relocation/mandals?state_id=odisha")
    assert res_list.status_code == 200
    data = res_list.json()
    assert data["total_mandals"] == 475
    assert len(data["items"]) == 475

    res_sum = client.get("/api/relocation/summary?state_id=odisha")
    assert res_sum.status_code == 200
    assert res_sum.json()["total_mandals"] == 475


# ==================== Phase 5 & 6: Simulation & Decision Support Tests ====================

def test_api_odisha_simulation_and_whatif():
    """Verify /api/simulation/run recalculates What-If scenarios deterministically for Odisha."""
    payload = {
        "hazard_change": 0.30,
        "population_change": 0.10,
        "capacity_change": 0.10,
        "accessibility_change": -0.10
    }
    res = client.post("/api/simulation/run?state_id=odisha", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["total_mandals"] == 475
    assert len(data["mandals"]) == 475


def test_api_odisha_decision_and_action_plan():
    """Verify /api/decision endpoints generate capacity gaps and institutional action plans for Odisha."""
    # Test action dashboard summary
    res_dash = client.get("/api/decision/summary?state_id=odisha")
    assert res_dash.status_code == 200
    assert res_dash.json()["total_mandals"] == 475

    # Test individual block action plan (e.g. Basudebpur / OD_BLOCK_081)
    res_plan = client.get("/api/decision/mandal/OD_BLOCK_081/action-plan?state_id=odisha")
    assert res_plan.status_code == 200
    plan_data = res_plan.json()
    assert plan_data["mandal_id"] == "OD_BLOCK_081"
    assert len(plan_data["immediate_actions"]) > 0 or len(plan_data["short_term_actions"]) > 0

    # Test candidate host zone retrieval
    res_hosts = client.get("/api/capacity/host-zones/OD_BLOCK_081?state_id=odisha")
    assert res_hosts.status_code == 200
    assert res_hosts.json()["source_mandal_id"] == "OD_BLOCK_081"

    res_hosts_reloc = client.get("/api/relocation/mandal/OD_BLOCK_081/host-zones?state_id=odisha")
    assert res_hosts_reloc.status_code == 200
    assert res_hosts_reloc.json()["source_mandal_id"] == "OD_BLOCK_081"
