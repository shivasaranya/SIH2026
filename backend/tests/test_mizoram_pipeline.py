import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_direct_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "mizoram" in data["supported_states"]

def test_mizoram_districts_geojson():
    res = client.get("/api/gis/districts?state_id=mizoram")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 11
    d_names = [f["properties"]["district_name"] for f in data["features"]]
    assert "Aizawl" in d_names
    assert "Lunglei" in d_names
    assert "Champhai" in d_names

def test_mizoram_subdistricts_geojson():
    res = client.get("/api/gis/mandals?state_id=mizoram")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 26
    b_names = [f["properties"]["mandal_name"] for f in data["features"]]
    assert "Tlangnuam" in b_names
    assert "Bilkhawthlir" in b_names
    assert "Sangau" in b_names

def test_mizoram_demographics_summary():
    res = client.get("/api/demographics/summary?state_id=mizoram")
    assert res.status_code == 200
    data = res.json()
    assert data["state_name"] == "Mizoram"
    assert data["state_code"] == "MZ"
    assert data["total_districts"] == 11
    assert data["total_mandals"] == 26
    assert data["total_population"] > 1000000

def test_mizoram_hazard_mandals():
    res = client.get("/api/hazard/mandals?state_id=mizoram")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 26
    for item in data["items"]:
        assert 0.0 <= item["slope_exposure_score"] <= 1.0
        assert 0.0 <= item["multi_hazard_exposure_index"] <= 1.0

def test_mizoram_vulnerability_mandals():
    res = client.get("/api/vulnerability/mandals?state_id=mizoram")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 26
    for item in data["items"]:
        assert item["demographic_sensitivity_index"] > 0.0
        assert item["vulnerability_index"] > 0.0

def test_mizoram_capacity_mandals():
    res = client.get("/api/capacity/mandals?state_id=mizoram")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 26

def test_mizoram_relocation_priority():
    res = client.get("/api/relocation/mandals?state_id=mizoram")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 26
    top_ranked = [item for item in data["items"] if item["relocation_priority_rank"] == 1]
    assert len(top_ranked) == 1
    assert top_ranked[0]["relocation_priority_category"] == "VERY HIGH"

def test_mizoram_host_candidates():
    res = client.get("/api/relocation/host-zones/ALL?state_id=mizoram")
    assert res.status_code == 200
    data = res.json()
    assert data["total_candidates"] >= 1

def test_andhra_pradesh_regression():
    res = client.get("/api/demographics/summary?state_id=andhra_pradesh")
    assert res.status_code == 200
    data = res.json()
    assert data["state_name"] == "Andhra Pradesh"
    assert data["total_districts"] == 26
    assert data["total_mandals"] == 656
