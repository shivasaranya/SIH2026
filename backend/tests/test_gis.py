import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_districts_geojson():
    response = client.get("/api/gis/districts")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert "features" in data
    # Exactly 26 districts
    assert len(data["features"]) == 26

    # Verify first feature schema
    feat = data["features"][0]
    assert "geometry" in feat
    assert "properties" in feat
    assert "district_id" in feat["properties"]
    assert "district_name" in feat["properties"]

def test_get_mandals_geojson():
    response = client.get("/api/gis/mandals")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 600

    # Verify modern 26-district enrichment
    feat = data["features"][0]
    props = feat["properties"]
    assert "current_district_id" in props
    assert "current_district_name" in props

def test_get_mandals_filtered_by_district():
    response = client.get("/api/gis/mandals?district_id=visakhapatnam")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 0

    for feat in data["features"]:
        assert feat["properties"]["current_district_id"] == "visakhapatnam"
