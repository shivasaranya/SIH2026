import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_demographics_summary():
    response = client.get("/api/demographics/summary")
    assert response.status_code == 200
    data = response.json()

    assert data["state_name"] == "Andhra Pradesh"
    assert data["state_code"] == "AP"
    assert data["data_year"] == 2011
    assert data["total_population"] == 34776389
    assert data["total_villages"] == 17039
    assert data["total_districts"] == 26
    assert len(data["districts"]) == 26

    # Verify fields for a district
    dist = data["districts"][0]
    assert "district_id" in dist
    assert "district_name" in dist
    assert dist["total_population"] > 0
    assert dist["village_count"] > 0
    assert 0 <= dist["sc_pct"] <= 100
    assert 0 <= dist["st_pct"] <= 100
    assert 0 <= dist["children_0_6_pct"] <= 100

def test_get_district_detail_valid():
    response = client.get("/api/demographics/district/alluri_sitharama_raju")
    assert response.status_code == 200
    data = response.json()

    assert "district" in data
    assert "mandals" in data
    assert data["district"]["district_id"] == "alluri_sitharama_raju"
    assert data["district"]["district_name"] == "Alluri Sitharama Raju"
    assert len(data["mandals"]) > 0

    # Verify mandal item schema
    m = data["mandals"][0]
    assert "mandal_code" in m
    assert "mandal_name" in m
    assert m["total_population"] > 0
    assert m["village_count"] > 0

def test_get_district_detail_invalid():
    response = client.get("/api/demographics/district/non_existent_district_123")
    assert response.status_code == 404
