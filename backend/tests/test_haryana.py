import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_haryana_gis_endpoints():
    # Districts GeoJSON (22 Districts)
    resp = client.get("/api/gis/districts?state=haryana")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 22
    names = [f["properties"]["district_name"] for f in data["features"]]
    assert "Ambala" in names
    assert "Gurgaon" in names
    assert "Yamunanagar" in names
    assert "Panchkula" in names
    assert "Palwal" in names
    assert "Nuh" in names
    assert "Charkhi Dadri" in names

    # Tehsils / Mandals GeoJSON (45 Tehsils)
    resp = client.get("/api/gis/mandals?state=haryana")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 45

def test_haryana_demographics_endpoints():
    # Summary
    resp = client.get("/api/demographics/summary?state=haryana")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_districts"] == 22
    assert len(data["districts"]) == 22
    assert data["total_population"] == 25351462

    # District detail breakdown
    resp = client.get("/api/demographics/district/ambala?state=haryana")
    assert resp.status_code == 200
    d_data = resp.json()
    assert d_data["district"]["district_name"] == "Ambala"
    assert len(d_data["mandals"]) == 2

def test_haryana_hazard_endpoints():
    # Hazard summary
    resp = client.get("/api/hazard/summary?state=haryana")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 45

    # Hazard mandals
    resp = client.get("/api/hazard/mandals?state=haryana")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 45
    assert len(data["items"]) == 45

def test_haryana_vulnerability_endpoints():
    # Summary
    resp = client.get("/api/vulnerability/summary?state=haryana")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 45

    # Mandals
    resp = client.get("/api/vulnerability/mandals?state=haryana")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 45
    assert len(data["items"]) == 45

def test_haryana_capacity_endpoints():
    # Summary
    resp = client.get("/api/capacity/summary?state=haryana")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 45

    # Adequacy summary
    resp = client.get("/api/capacity/adequacy/summary?state=haryana")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 45

    # Bottlenecks
    resp = client.get("/api/capacity/bottlenecks?state=haryana")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 45

def test_haryana_relocation_endpoints():
    # Summary
    resp = client.get("/api/relocation/summary?state=haryana")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 45
    assert data["total_mandals_ranked"] == 45

    # Top
    resp = client.get("/api/relocation/top?limit=10&state=haryana")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_returned"] == 10
    assert len(data["items"]) == 10

def test_haryana_simulation_endpoints():
    payload = {
        "hazard_change": 0.25,
        "population_change": 0.10,
        "capacity_change": 0.15,
        "accessibility_change": -0.05
    }
    resp = client.post("/api/simulation/run?state=haryana", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["mandals"]) == 45

def test_haryana_decision_endpoints():
    resp = client.get("/api/decision/summary?state=haryana")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 45
    assert data["very_high_priority_count"] >= 0
