import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_maharashtra_gis_endpoints():
    # Districts GeoJSON
    resp = client.get("/api/gis/districts?state=maharashtra")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 35
    names = [f["properties"]["district_name"] for f in data["features"]]
    assert "Pune" in names
    assert "Mumbai" in names
    assert "Thane" in names
    assert "Kolhapur" in names
    assert "Nagpur" in names

    # Talukas / Mandals GeoJSON
    resp = client.get("/api/gis/mandals?state=maharashtra")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 317

def test_maharashtra_demographics_endpoints():
    # Summary
    resp = client.get("/api/demographics/summary?state=maharashtra")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_districts"] == 35
    assert len(data["districts"]) == 35
    assert data["total_population"] > 110_000_000

    # District detail breakdown
    resp = client.get("/api/demographics/district/pune?state=maharashtra")
    assert resp.status_code == 200
    d_data = resp.json()
    assert d_data["district"]["district_name"] == "Pune"
    assert len(d_data["mandals"]) == 17

def test_maharashtra_hazard_endpoints():
    # Hazard summary
    resp = client.get("/api/hazard/summary?state=maharashtra")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 317

    # Hazard mandals
    resp = client.get("/api/hazard/mandals?state=maharashtra")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 317
    assert len(data["items"]) == 317

def test_maharashtra_vulnerability_endpoints():
    # Summary
    resp = client.get("/api/vulnerability/summary?state=maharashtra")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 317

    # Mandals
    resp = client.get("/api/vulnerability/mandals?state=maharashtra")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 317
    assert len(data["items"]) == 317

def test_maharashtra_capacity_endpoints():
    # Summary
    resp = client.get("/api/capacity/summary?state=maharashtra")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 317

    # Adequacy summary
    resp = client.get("/api/capacity/adequacy/summary?state=maharashtra")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 317

    # Bottlenecks
    resp = client.get("/api/capacity/bottlenecks?state=maharashtra")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 317

def test_maharashtra_relocation_endpoints():
    # Summary
    resp = client.get("/api/relocation/summary?state=maharashtra")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 317
    assert data["total_mandals_ranked"] == 317

    # Top
    resp = client.get("/api/relocation/top?limit=10&state=maharashtra")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_returned"] == 10
    assert len(data["items"]) == 10

def test_maharashtra_simulation_endpoints():
    payload = {
        "hazard_change": 0.30,
        "population_change": 0.10,
        "capacity_change": 0.10,
        "accessibility_change": -0.10
    }
    resp = client.post("/api/simulation/run?state=maharashtra", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["mandals"]) == 317

def test_maharashtra_decision_endpoints():
    resp = client.get("/api/decision/summary?state=maharashtra")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 317
    assert data["very_high_priority_count"] >= 0
