import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_chhattisgarh_gis_endpoints():
    # Districts GeoJSON (33 Districts)
    resp = client.get("/api/gis/districts?state=chhattisgarh")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 33
    names = [f["properties"]["district_name"] for f in data["features"]]
    assert "Raipur" in names
    assert "Bilaspur" in names
    assert "Durg" in names
    assert "Bastar" in names
    assert "Rajnandgaon" in names
    assert "Korba" in names
    assert "Raigarh" in names
    assert "Surguja" in names
    assert "Dantewada" in names
    assert "Sukma" in names
    assert "Bijapur" in names
    assert "Balrampur" in names

    # Tehsils / Mandals GeoJSON (58 Tehsils)
    resp = client.get("/api/gis/mandals?state=chhattisgarh")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 58

def test_chhattisgarh_demographics_endpoints():
    # Summary
    resp = client.get("/api/demographics/summary?state=chhattisgarh")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_districts"] == 33
    assert len(data["districts"]) == 33
    assert data["total_population"] > 25000000

    # District detail breakdown
    resp = client.get("/api/demographics/district/raipur?state=chhattisgarh")
    assert resp.status_code == 200
    d_data = resp.json()
    assert d_data["district"]["district_name"] == "Raipur"
    assert len(d_data["mandals"]) >= 1

def test_chhattisgarh_hazard_endpoints():
    # Hazard summary
    resp = client.get("/api/hazard/summary?state=chhattisgarh")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 58

    # Hazard mandals
    resp = client.get("/api/hazard/mandals?state=chhattisgarh")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 58
    assert len(data["items"]) == 58

def test_chhattisgarh_vulnerability_endpoints():
    # Summary
    resp = client.get("/api/vulnerability/summary?state=chhattisgarh")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 58

    # Mandals
    resp = client.get("/api/vulnerability/mandals?state=chhattisgarh")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 58
    assert len(data["items"]) == 58

def test_chhattisgarh_capacity_endpoints():
    # Summary
    resp = client.get("/api/capacity/summary?state=chhattisgarh")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 58

    # Adequacy summary
    resp = client.get("/api/capacity/adequacy/summary?state=chhattisgarh")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 58

    # Bottlenecks
    resp = client.get("/api/capacity/bottlenecks?state=chhattisgarh")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 58

def test_chhattisgarh_relocation_endpoints():
    # Summary
    resp = client.get("/api/relocation/summary?state=chhattisgarh")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 58
    assert data["total_mandals_ranked"] == 58

    # Top
    resp = client.get("/api/relocation/top?limit=10&state=chhattisgarh")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_returned"] == 10
    assert len(data["items"]) == 10

def test_chhattisgarh_simulation_endpoints():
    payload = {
        "hazard_change": 0.20,
        "population_change": 0.10,
        "capacity_change": 0.10,
        "accessibility_change": -0.05
    }
    resp = client.post("/api/simulation/run?state=chhattisgarh", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["mandals"]) == 58

def test_chhattisgarh_decision_endpoints():
    resp = client.get("/api/decision/summary?state=chhattisgarh")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 58
    assert data["very_high_priority_count"] >= 0
