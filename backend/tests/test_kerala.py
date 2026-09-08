import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_kerala_gis_endpoints():
    # Districts GeoJSON
    resp = client.get("/api/gis/districts?state=kerala")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 14
    names = [f["properties"]["district_name"] for f in data["features"]]
    assert "Wayanad" in names
    assert "Alappuzha" in names
    assert "Idukki" in names

    # Talukas / Mandals GeoJSON
    resp = client.get("/api/gis/mandals?state=kerala")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 61

def test_kerala_demographics_endpoints():
    # Summary
    resp = client.get("/api/demographics/summary?state=kerala")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_districts"] == 14
    assert len(data["districts"]) == 14
    assert data["total_population"] == 33406061

    # District detail breakdown
    resp = client.get("/api/demographics/district/wayanad?state=kerala")
    assert resp.status_code == 200
    d_data = resp.json()
    assert d_data["district"]["district_name"] == "Wayanad"
    assert len(d_data["mandals"]) == 3

def test_kerala_hazard_endpoints():
    # Hazard summary
    resp = client.get("/api/hazard/summary?state=kerala")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 61

    # Hazard mandals
    resp = client.get("/api/hazard/mandals?state=kerala")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 61
    assert len(data["items"]) == 61

def test_kerala_vulnerability_endpoints():
    # Summary
    resp = client.get("/api/vulnerability/summary?state=kerala")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 61

    # Mandals
    resp = client.get("/api/vulnerability/mandals?state=kerala")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 61
    assert len(data["items"]) == 61

def test_kerala_capacity_endpoints():
    # Summary
    resp = client.get("/api/capacity/summary?state=kerala")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 61

    # Adequacy summary
    resp = client.get("/api/capacity/adequacy/summary?state=kerala")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 61

    # Bottlenecks
    resp = client.get("/api/capacity/bottlenecks?state=kerala")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 61

def test_kerala_relocation_endpoints():
    # Summary
    resp = client.get("/api/relocation/summary?state=kerala")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 61
    assert data["total_mandals_ranked"] == 61

    # Top
    resp = client.get("/api/relocation/top?limit=10&state=kerala")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_returned"] == 10
    assert len(data["items"]) == 10

def test_kerala_simulation_endpoints():
    payload = {
        "hazard_change": 0.30,
        "population_change": 0.10,
        "capacity_change": 0.10,
        "accessibility_change": -0.10
    }
    resp = client.post("/api/simulation/run?state=kerala", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["mandals"]) == 61

def test_kerala_decision_endpoints():
    resp = client.get("/api/decision/summary?state=kerala")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 61
    assert data["very_high_priority_count"] >= 0
