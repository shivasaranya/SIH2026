import pytest
from pathlib import Path
import pandas as pd
import geopandas as gpd
from fastapi.testclient import TestClient
from main import app

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "processed"
client = TestClient(app)


def test_jk_datasets_integrity():
    """Verify all 9 processed J&K datasets exist and have consistent tehsil counts."""
    admin_dir = DATA_DIR / "admin"
    census_dir = DATA_DIR / "census"
    haz_dir = DATA_DIR / "hazard" / "mandal_exposure"
    vuln_dir = DATA_DIR / "vulnerability"
    cap_dir = DATA_DIR / "capacity"
    reloc_dir = DATA_DIR / "relocation"

    # 1. Admin GeoJSONs
    dist_gdf = gpd.read_file(admin_dir / "jammu_kashmir_20_districts.geojson")
    assert len(dist_gdf) == 20, f"Expected 20 districts in J&K, got {len(dist_gdf)}"
    assert dist_gdf["geometry"].is_valid.all(), "Invalid geometry in J&K districts"

    teh_gdf = gpd.read_file(admin_dir / "jammu_kashmir_tehsils.geojson")
    assert len(teh_gdf) == 197, f"Expected 197 tehsils in J&K, got {len(teh_gdf)}"
    assert teh_gdf["mandal_id"].nunique() == 197, "Duplicate tehsil IDs"

    # 2. Census Demographics
    demo_df = pd.read_csv(census_dir / "jk_tehsil_demographics.csv")
    assert len(demo_df) == 197
    assert demo_df["population_total"].sum() > 10_000_000

    # 3. Hazard Exposure
    haz_df = pd.read_csv(haz_dir / "jk_tehsil_multi_hazard_exposure.csv")
    assert len(haz_df) == 197
    assert (haz_df["cyclone_exposure_score"] == 0.0).all(), "J&K should have 0 cyclone exposure"
    assert (haz_df["multi_hazard_exposure_index"] >= 0.0).all()
    assert (haz_df["multi_hazard_exposure_index"] <= 1.0).all()

    # 4. Vulnerability
    vuln_df = pd.read_csv(vuln_dir / "jk_tehsil_demographic_vulnerability.csv")
    assert len(vuln_df) == 197
    assert "priority_quadrant" in vuln_df.columns

    # 5. Capacity
    cap_df = pd.read_csv(cap_dir / "jk_tehsil_capacity_adequacy.csv")
    assert len(cap_df) == 197
    assert "capacity_condition" in cap_df.columns

    # 6. Host Zones
    host_df = pd.read_csv(cap_dir / "jk_host_zone_candidates.csv")
    assert len(host_df) > 0
    assert host_df["candidate_mandal_id"].nunique() >= 5

    # 7. Relocation
    reloc_df = pd.read_csv(reloc_dir / "jk_tehsil_relocation_priority.csv")
    assert len(reloc_df) == 197
    assert "topsis_score" in reloc_df.columns
    assert reloc_df["relocation_priority_rank"].nunique() == 197


def test_jk_api_gis():
    """Verify GIS district and tehsil endpoints for J&K."""
    res_d = client.get("/api/gis/districts?state_id=jammu_kashmir")
    assert res_d.status_code == 200
    data_d = res_d.json()
    assert data_d["type"] == "FeatureCollection"
    assert len(data_d["features"]) == 20

    res_m = client.get("/api/gis/mandals?state_id=jammu_kashmir")
    assert res_m.status_code == 200
    data_m = res_m.json()
    assert data_m["type"] == "FeatureCollection"
    assert len(data_m["features"]) == 197


def test_jk_api_demographics():
    """Verify demographics summary for J&K."""
    res = client.get("/api/demographics/summary?state_id=jammu_kashmir")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 197
    assert data["total_population"] > 10_000_000


def test_jk_api_hazard():
    """Verify hazard summary and inland adaptation for J&K."""
    res = client.get("/api/hazard/summary?state_id=jammu_kashmir")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 197
    assert data["storm_surge_included"] is False
    assert "Inland" in data["storm_surge_exclusion_reason"]


def test_jk_api_vulnerability():
    """Verify vulnerability summary and GeoJSON for J&K."""
    res = client.get("/api/vulnerability/summary?state_id=jammu_kashmir")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 197
    assert 0.0 <= data["mean_vulnerability_index"] <= 1.0

    res_geo = client.get("/api/vulnerability/geojson?state_id=jammu_kashmir")
    assert res_geo.status_code == 200
    data_geo = res_geo.json()
    assert data_geo["type"] == "FeatureCollection"
    assert len(data_geo["features"]) == 197


def test_jk_api_capacity():
    """Verify carrying capacity and host zones for J&K."""
    res = client.get("/api/capacity/adequacy/summary?state_id=jammu_kashmir")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 197

    res_hosts = client.get("/api/capacity/host-zones/JK_TEHSIL_001?state_id=jammu_kashmir")
    assert res_hosts.status_code == 200
    data_hosts = res_hosts.json()
    assert data_hosts["total_candidates"] >= 3


def test_jk_api_relocation():
    """Verify relocation prioritization for J&K."""
    res = client.get("/api/relocation/summary?state_id=jammu_kashmir")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 197
    assert data["total_mandals_ranked"] == 197

    res_top = client.get("/api/relocation/top?state_id=jammu_kashmir&limit=5")
    assert res_top.status_code == 200
    data_top = res_top.json()
    assert len(data_top["items"]) == 5
    assert data_top["items"][0]["mandal_id"].startswith("JK_TEHSIL_")


def test_jk_api_decision_and_action():
    """Verify decision dashboard and action plan for J&K."""
    res_dash = client.get("/api/decision/summary?state_id=jammu_kashmir")
    assert res_dash.status_code == 200
    data_dash = res_dash.json()
    assert data_dash["total_mandals"] == 197

    # Test single tehsil action plan and capacity gap
    tehsil_id = "JK_TEHSIL_001"
    res_gap = client.get(f"/api/decision/mandal/{tehsil_id}/capacity-gap?state_id=jammu_kashmir")
    assert res_gap.status_code == 200

    res_act = client.get(f"/api/decision/mandal/{tehsil_id}/action-plan?state_id=jammu_kashmir")
    assert res_act.status_code == 200
    data_act = res_act.json()
    assert len(data_act["immediate_actions"]) > 0 or len(data_act["short_term_actions"]) > 0
    # Responsible agency should have JKDMA or JK prefix
    agencies = [a["responsible_agency"] for a in data_act["immediate_actions"] + data_act["short_term_actions"] + data_act["long_term_actions"]]
    assert any("JK" in ag for ag in agencies)


def test_jk_api_simulation():
    """Verify scenario simulation on J&K."""
    payload = {
        "hazard_change": 0.30,
        "population_change": 0.10,
        "capacity_change": 0.10,
        "accessibility_change": -0.10
    }
    res = client.post("/api/simulation/run?state_id=jammu_kashmir", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["total_mandals"] == 197
    assert len(data["mandals"]) == 197


def test_multi_state_regression():
    """Ensure Andhra Pradesh (AP) and Tamil Nadu (TN) continue functioning identically."""
    # AP
    ap_gis = client.get("/api/gis/districts?state_id=andhra_pradesh").json()
    assert len(ap_gis["features"]) == 26
    ap_haz = client.get("/api/hazard/summary?state_id=andhra_pradesh").json()
    assert ap_haz["total_mandals"] == 696

    # TN
    tn_gis = client.get("/api/gis/districts?state_id=tamil_nadu").json()
    assert len(tn_gis["features"]) == 38
    tn_haz = client.get("/api/hazard/summary?state_id=tamil_nadu").json()
    assert tn_haz["total_mandals"] == 302
