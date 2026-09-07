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

def test_get_mandal_villages_tadepalligudem():
    response = client.get("/api/demographics/mandal/AP_MANDAL_188/villages")
    assert response.status_code == 200
    data = response.json()
    assert data["mandal_id"] == "AP_MANDAL_188"
    assert data["mandal_name"] == "TADEPALLIGUDEM"
    assert data["district_name"] == "West Godavari"
    assert data["total_villages"] == 18
    assert data["has_village_data"] is True
    assert len(data["villages"]) == 18
    # Alphabetically sorted
    assert data["villages"][0]["village_name"] == "Apparaopeta"
    # Village properties
    v0 = data["villages"][0]
    assert "village_code" in v0
    assert "population_total" in v0
    assert v0["has_geometry"] is False
    assert v0["geometry_note"] == "Village boundary data unavailable"

def test_get_mandal_villages_tada_and_kurnool():
    res_tada = client.get("/api/demographics/mandal/AP_MANDAL_652/villages")
    assert res_tada.status_code == 200
    assert res_tada.json()["total_villages"] == 24

    res_kurnool = client.get("/api/demographics/mandal/AP_MANDAL_373/villages")
    assert res_kurnool.status_code == 200
    assert res_kurnool.json()["total_villages"] == 18

def test_get_mandal_villages_urban_zero_villages():
    response = client.get("/api/demographics/mandal/AP_MANDAL_110/villages")
    assert response.status_code == 200
    data = response.json()
    assert data["total_villages"] == 0
    assert data["has_village_data"] is False
    assert "unavailable" in data["note"].lower()

def test_get_mandal_villages_tn_graceful():
    response = client.get("/api/demographics/mandal/TN_TALUK_001/villages?state_id=tamil_nadu")
    assert response.status_code == 200
    data = response.json()
    assert data["total_villages"] == 0
    assert data["has_village_data"] is False

def test_get_mandal_villages_by_name_and_district():
    response = client.get("/api/demographics/mandal/Tadepalligudem/villages?district_id=West+Godavari")
    assert response.status_code == 200
    data = response.json()
    assert data["total_villages"] == 18
    assert data["mandal_name"].upper() == "TADEPALLIGUDEM"
    assert len(data["villages"]) == 18
