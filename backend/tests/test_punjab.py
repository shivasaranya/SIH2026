import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_punjab_gis_endpoints():
    # Districts GeoJSON (23 Districts)
    resp = client.get("/api/gis/districts?state=punjab")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 23
    names = [f["properties"]["district_name"] for f in data["features"]]
    assert "Amritsar" in names
    assert "Ludhiana" in names
    assert "Jalandhar" in names
    assert "Patiala" in names
    assert "Bathinda" in names
    assert "Gurdaspur" in names
    assert "Hoshiarpur" in names
    assert "Pathankot" in names
    assert "Fazilka" in names
    assert "Malerkotla" in names

    # Tehsils / Mandals GeoJSON (45 Tehsils)
    resp = client.get("/api/gis/mandals?state=punjab")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 45

def test_punjab_demographics_endpoints():
    # Summary
    resp = client.get("/api/demographics/summary?state=punjab")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_districts"] == 23
    assert len(data["districts"]) == 23
    assert data["total_population"] == 27860019

    # District detail breakdown
    resp = client.get("/api/demographics/district/amritsar?state=punjab")
    assert resp.status_code == 200
    d_data = resp.json()
    assert d_data["district"]["district_name"] == "Amritsar"
    assert len(d_data["mandals"]) == 2

def test_punjab_hazard_endpoints():
    # Hazard summary
    resp = client.get("/api/hazard/summary?state=punjab")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 45

    # Hazard mandals
    resp = client.get("/api/hazard/mandals?state=punjab")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 45
    assert len(data["items"]) == 45

def test_punjab_vulnerability_endpoints():
    # Summary
    resp = client.get("/api/vulnerability/summary?state=punjab")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 45

    # Mandals
    resp = client.get("/api/vulnerability/mandals?state=punjab")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 45
    assert len(data["items"]) == 45

def test_punjab_capacity_endpoints():
    # Summary
    resp = client.get("/api/capacity/summary?state=punjab")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 45

    # Adequacy summary
    resp = client.get("/api/capacity/adequacy/summary?state=punjab")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 45

    # Bottlenecks
    resp = client.get("/api/capacity/bottlenecks?state=punjab")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 45

def test_punjab_relocation_endpoints():
    # Summary
    resp = client.get("/api/relocation/summary?state=punjab")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 45
    assert data["total_mandals_ranked"] == 45

    # Top
    resp = client.get("/api/relocation/top?limit=10&state=punjab")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_returned"] == 10
    assert len(data["items"]) == 10

def test_punjab_simulation_endpoints():
    payload = {
        "hazard_change": 0.25,
        "population_change": 0.10,
        "capacity_change": 0.15,
        "accessibility_change": -0.05
    }
    resp = client.post("/api/simulation/run?state=punjab", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["mandals"]) == 45

def test_punjab_decision_endpoints():
    resp = client.get("/api/decision/summary?state=punjab")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_mandals"] == 45
    assert data["very_high_priority_count"] >= 0
