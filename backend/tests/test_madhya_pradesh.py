import pytest
from pathlib import Path
import pandas as pd
import geopandas as gpd
from fastapi.testclient import TestClient
from main import app

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "processed"
client = TestClient(app)


def test_mp_datasets_integrity():
    """Verify all processed Madhya Pradesh datasets exist and have consistent tehsil counts."""
    admin_dir = DATA_DIR / "admin"
    census_dir = DATA_DIR / "census"
    haz_dir = DATA_DIR / "hazard" / "mandal_exposure"
    vuln_dir = DATA_DIR / "vulnerability"
    cap_dir = DATA_DIR / "capacity"
    reloc_dir = DATA_DIR / "relocation"

    # 1. Admin GeoJSONs
    dist_gdf = gpd.read_file(admin_dir / "madhya_pradesh_52_districts.geojson")
    assert len(dist_gdf) == 52, f"Expected 52 districts in MP, got {len(dist_gdf)}"
    assert dist_gdf["geometry"].is_valid.all(), "Invalid geometry in MP districts"

    teh_gdf = gpd.read_file(admin_dir / "madhya_pradesh_tehsils.geojson")
    assert len(teh_gdf) == 422, f"Expected 422 tehsils in MP, got {len(teh_gdf)}"
    assert teh_gdf["mandal_id"].nunique() == 422, "Duplicate tehsil IDs"

    # 2. Census Demographics
    demo_df = pd.read_csv(census_dir / "mp_tehsil_demographics.csv")
    assert len(demo_df) == 422
    assert demo_df["population_total"].sum() > 70_000_000

    # 3. Hazard Exposure
    haz_df = pd.read_csv(haz_dir / "mp_tehsil_multi_hazard_exposure.csv")
    assert len(haz_df) == 422
    assert (haz_df["cyclone_exposure_score"] == 0.0).all(), "MP is inland, cyclone exposure must be 0"
    assert (haz_df["multi_hazard_exposure_index"] >= 0.0).all()
    assert (haz_df["multi_hazard_exposure_index"] <= 1.0).all()

    # 4. Vulnerability
    vuln_df = pd.read_csv(vuln_dir / "mp_tehsil_demographic_vulnerability.csv")
    assert len(vuln_df) == 422
    assert "priority_quadrant" in vuln_df.columns

    # 5. Capacity
    cap_df = pd.read_csv(cap_dir / "mp_tehsil_capacity_adequacy.csv")
    assert len(cap_df) == 422
    assert "capacity_condition" in cap_df.columns

    # 6. Host Zones
    host_df = pd.read_csv(cap_dir / "mp_host_zone_candidates.csv")
    assert len(host_df) > 0
    assert host_df["candidate_mandal_id"].nunique() >= 10

    # 7. Relocation
    reloc_df = pd.read_csv(reloc_dir / "mp_tehsil_relocation_priority.csv")
    assert len(reloc_df) == 422
    assert "topsis_score" in reloc_df.columns
    assert reloc_df["relocation_priority_rank"].nunique() == 422


def test_mp_api_gis():
    """Verify GIS district and tehsil endpoints for Madhya Pradesh."""
    res_d = client.get("/api/gis/districts?state_id=madhya_pradesh")
    assert res_d.status_code == 200
    data_d = res_d.json()
    assert data_d["type"] == "FeatureCollection"
    assert len(data_d["features"]) == 52

    res_m = client.get("/api/gis/mandals?state_id=madhya_pradesh")
    assert res_m.status_code == 200
    data_m = res_m.json()
    assert data_m["type"] == "FeatureCollection"
    assert len(data_m["features"]) == 422


def test_mp_api_demographics():
    """Verify demographics summary for Madhya Pradesh."""
    res = client.get("/api/demographics/summary?state_id=madhya_pradesh")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 422
    assert data["total_population"] > 70_000_000


def test_mp_api_hazard():
    """Verify hazard summary and inland adaptation for Madhya Pradesh."""
    res = client.get("/api/hazard/summary?state_id=madhya_pradesh")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 422
    assert data["storm_surge_included"] is False
    assert "Inland" in data["storm_surge_exclusion_reason"]


def test_mp_api_vulnerability():
    """Verify vulnerability summary and GeoJSON for Madhya Pradesh."""
    res = client.get("/api/vulnerability/summary?state_id=madhya_pradesh")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 422
    assert 0.0 <= data["mean_vulnerability_index"] <= 1.0

    res_geo = client.get("/api/vulnerability/geojson?state_id=madhya_pradesh")
    assert res_geo.status_code == 200
    data_geo = res_geo.json()
    assert data_geo["type"] == "FeatureCollection"
    assert len(data_geo["features"]) == 422


def test_mp_api_capacity():
    """Verify carrying capacity and host zones for Madhya Pradesh."""
    res = client.get("/api/capacity/adequacy/summary?state_id=madhya_pradesh")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 422

    res_hosts = client.get("/api/capacity/host-zones/MP_TEHSIL_001?state_id=madhya_pradesh")
    assert res_hosts.status_code == 200
    data_hosts = res_hosts.json()
    assert data_hosts["total_candidates"] >= 3


def test_mp_api_relocation():
    """Verify relocation prioritization for Madhya Pradesh."""
    res = client.get("/api/relocation/summary?state_id=madhya_pradesh")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 422
    assert data["total_mandals_ranked"] == 422

    res_top = client.get("/api/relocation/top?state_id=madhya_pradesh&limit=5")
    assert res_top.status_code == 200
    data_top = res_top.json()
    assert len(data_top["items"]) == 5
    assert data_top["items"][0]["mandal_id"].startswith("MP_TEHSIL_")


def test_mp_api_decision_and_action():
    """Verify decision summary and 3-horizon action plans for Madhya Pradesh."""
    res_dec = client.get("/api/decision/summary?state_id=madhya_pradesh")
    assert res_dec.status_code == 200
    data_dec = res_dec.json()
    assert data_dec["total_mandals"] == 422
    assert "top_action_mandals" in data_dec

    res_act = client.get("/api/decision/mandal/MP_TEHSIL_001/action-plan?state_id=madhya_pradesh")
    assert res_act.status_code == 200
    data_act = res_act.json()
    assert "immediate_actions" in data_act
    assert "short_term_actions" in data_act
    assert "long_term_actions" in data_act


def test_mp_api_simulation():
    """Verify What-If simulation engine on Madhya Pradesh data."""
    payload = {
        "hazard_change": 0.30,
        "population_change": 0.10,
        "capacity_change": 0.10,
        "accessibility_change": -0.10
    }
    res = client.post("/api/simulation/run?state_id=madhya_pradesh", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["total_mandals"] == 422
    assert len(data["mandals"]) == 422


def test_multi_state_regression():
    """Verify AP, TN, JK, and MP all function concurrently without collision."""
    # Andhra Pradesh
    res_ap_d = client.get("/api/gis/districts?state_id=andhra_pradesh")
    assert res_ap_d.status_code == 200
    assert len(res_ap_d.json()["features"]) == 26

    # Tamil Nadu
    res_tn_d = client.get("/api/gis/districts?state_id=tamil_nadu")
    assert res_tn_d.status_code == 200
    assert len(res_tn_d.json()["features"]) == 38

    # Jammu & Kashmir
    res_jk_d = client.get("/api/gis/districts?state_id=jammu_kashmir")
    assert res_jk_d.status_code == 200
    assert len(res_jk_d.json()["features"]) == 20

    # Madhya Pradesh
    res_mp_d = client.get("/api/gis/districts?state_id=madhya_pradesh")
    assert res_mp_d.status_code == 200
    assert len(res_mp_d.json()["features"]) == 52
