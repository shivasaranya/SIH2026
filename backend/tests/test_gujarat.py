import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_gujarat_gis_endpoints():
    # Districts GeoJSON
    resp = client.get("/api/gis/districts?state=gujarat")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 33

    # Talukas / Mandals GeoJSON
    resp = client.get("/api/gis/mandals?state=gujarat")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 252

def test_gujarat_demographics_endpoints():
    # Summary
    resp = client.get("/api/demographics/summary?state=gujarat")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_districts"] == 33
    assert len(data["districts"]) == 33
    assert data["total_population"] > 30_000_000

    # District detail breakdown
    resp = client.get("/api/demographics/district/ahmedabad?state=gujarat")
    assert resp.status_code == 200
    d_data = resp.json()
    assert d_data["district"]["district_name"] == "Ahmedabad"
    assert len(d_data["mandals"]) == 10

def test_gujarat_hazard_endpoints():
    # Hazard summary
    resp = client.get("/api/hazard/summary?state=gujarat")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 252
    assert len(data["top_exposed_mandals"]) == 5

    # Hazard mandals
    resp = client.get("/api/hazard/mandals?state=gujarat")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 252
    assert len(data["items"]) == 252

def test_gujarat_vulnerability_endpoints():
    # Summary
    resp = client.get("/api/vulnerability/summary?state=gujarat")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 252

    # Mandals
    resp = client.get("/api/vulnerability/mandals?state=gujarat")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 252
    assert len(data["items"]) == 252

def test_gujarat_capacity_endpoints():
    # Summary
    resp = client.get("/api/capacity/summary?state=gujarat")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 252

    # Adequacy summary
    resp = client.get("/api/capacity/adequacy/summary?state=gujarat")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 252

    # Bottlenecks
    resp = client.get("/api/capacity/bottlenecks?state=gujarat")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 252

def test_gujarat_relocation_endpoints():
    # Summary
    resp = client.get("/api/relocation/summary?state=gujarat")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 252
    assert data["total_mandals_ranked"] == 252

    # Top
    resp = client.get("/api/relocation/top?limit=10&state=gujarat")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_returned"] == 10
    assert len(data["items"]) == 10

def test_gujarat_simulation_endpoints():
    # Simulation Run
    payload = {
        "hazard_change": 0.30,
        "population_change": 0.10,
        "capacity_change": 0.10,
        "accessibility_change": -0.10
    }
    resp = client.post("/api/simulation/run?state=gujarat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["mandals"]) == 252
    assert len(data["top_10_increased_priority"]) == 10

def test_gujarat_decision_endpoints():
    # Decision Summary
    resp = client.get("/api/decision/summary?state=gujarat")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 252
    assert data["very_high_priority_count"] > 0
