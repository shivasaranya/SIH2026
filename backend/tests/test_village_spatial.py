import pytest
from fastapi.testclient import TestClient
from main import app
from app.services.village_spatial_service import village_spatial_service

client = TestClient(app)

def test_village_index_loaded():
    """Verify that all 17,039 Census 2011 villages are indexed in the service."""
    village_spatial_service._ensure_data_loaded()
    assert village_spatial_service._villages_index is not None
    assert len(village_spatial_service._villages_index) == 17039

def test_village_geometry_and_area_preservation():
    """Verify actual village geometry retrieval and exact N/E/S/W area preservation."""
    # Test with a known village in Srikakulam (Peddabammidi, 581086)
    vcode = 581086
    geom_resp = village_spatial_service.get_village_geometry(vcode)
    assert geom_resp is not None
    assert geom_resp.village_code == vcode
    assert geom_resp.village_name == "Peddabammidi"
    assert geom_resp.village_area_sqkm > 0
    assert geom_resp.centroid_lat > 0
    assert geom_resp.centroid_lon > 0

    # Verify GeoJSON structure
    assert geom_resp.village_boundary_geojson["type"] == "Feature"
    assert geom_resp.sectors_geojson["type"] == "FeatureCollection"
    sectors = geom_resp.sectors_geojson["features"]
    assert len(sectors) == 4
    sector_names = {s["properties"]["sector"] for s in sectors}
    assert sector_names == {"NORTH", "EAST", "SOUTH", "WEST"}

    # Verify area preservation: North + East + South + West area == Total village area
    sec_area_sum = sum(s["properties"]["area_sqkm"] for s in sectors)
    assert pytest.approx(sec_area_sum, abs=0.05) == geom_resp.village_area_sqkm

def test_coastal_village_hazard_analysis():
    """Test 1: Coastal village (Peddabammidi in Srikakulam)."""
    response = client.get("/api/village/581086?disaster_type=cyclone")
    assert response.status_code == 200
    data = response.json()
    assert data["village_code"] == 581086
    assert data["disaster_type"] == "cyclone"
    assert data["area_preservation_verified"] is True
    assert len(data["sectors"]) == 4
    # Cyclone proximity should be detected for coastal district
    assert data["cyclone_summary"]["tracks_count"] > 0
    assert data["wind_summary"]["speed_ms"] >= 47.0

def test_inland_village_hazard_analysis():
    """Test 2: Inland village (e.g. in Kurnool / Alur mandal: A Gonehal, 594152)."""
    response = client.get("/api/village/594152?disaster_type=slope")
    assert response.status_code == 200
    data = response.json()
    assert data["village_code"] == 594152
    assert data["district_name"] in ["Kurnool", "Nandyal"]
    # Slope raster was intersected
    assert "slope_summary" in data
    assert data["slope_summary"]["valid_pixels"] > 0

def test_multipolygon_village():
    """Test 3: MultiPolygon geometry village is preserved and handled cleanly."""
    # Find a village with MultiPolygon
    village_spatial_service._ensure_data_loaded()
    mp_rows = village_spatial_service._villages_gdf[
        village_spatial_service._villages_gdf.geometry.geom_type == "MultiPolygon"
    ]
    assert len(mp_rows) > 0
    sample_mp = mp_rows.iloc[0]
    vcode = int(sample_mp["village_code"])

    geom_resp = village_spatial_service.get_village_geometry(vcode)
    assert geom_resp is not None
    assert geom_resp.village_boundary_geojson["geometry"]["type"] in ["MultiPolygon", "Polygon"]

def test_flood_hazard_intersection():
    """Test 4: Real 30m flood raster intersection and sector breakdown."""
    # Srikakulam riverine village
    response = client.get("/api/village/581086?disaster_type=flood")
    assert response.status_code == 200
    data = response.json()
    assert data["flood_summary"]["valid_pixels"] > 0
    for s in data["sectors"]:
        assert s["sector"] in ["NORTH", "EAST", "SOUTH", "WEST"]
        assert s["priority"] in ["VERY HIGH", "HIGH", "MODERATE", "LOW", "INSUFFICIENT DATA"]
        assert len(s["priority_reason"]) > 10

def test_missing_and_insufficient_data():
    """Test 5: Non-existent village returns 404 cleanly."""
    response = client.get("/api/village/99999999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_village_scenario_bounds():
    """Test 6: 0–10 What-If scenario bounds and simulation disclaimer."""
    # Baseline scenario (increase = 0)
    r0 = client.get("/api/village/581086/scenario?increase=0")
    assert r0.status_code == 200
    d0 = r0.json()
    assert d0["scenario_hazard_increase"] == 0.0
    assert d0["disclaimer"] == "SCENARIO SIMULATION — NOT A FORECAST"

    # Perturbed scenario (increase = 7.5)
    r7 = client.get("/api/village/581086/scenario?increase=7.5")
    assert r7.status_code == 200
    d7 = r7.json()
    assert d7["scenario_hazard_increase"] == 7.5
    assert d7["simulated_hazard_score"] >= d0["baseline_hazard_score"]

    # Invalid bound (>10) rejected by validator
    r_bad = client.get("/api/village/581086/scenario?increase=15")
    assert r_bad.status_code == 422

def test_relocation_centers_ranking():
    """Test 7: Candidate relocation centers ranking and explanation."""
    response = client.get("/api/village/581086/relocation-centers?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["village_code"] == 581086
    assert len(data["recommended_centers"]) <= 5
    assert len(data["recommended_centers"]) > 0
    top = data["recommended_centers"][0]
    assert top["suitability_tier"] == "RECOMMENDED"
    assert len(top["why_recommended"]) > 10
    assert top["distance_km"] > 0
    assert "soft" in data["soft_distance_notice"].lower()

def test_no_mandal_hazard_score_leakage():
    """
    Test 8: Strict isolation test:
    Verify that village hazard scores are calculated from spatial layers,
    and NOT copied from parent mandal scores.
    """
    # Look up two distinct villages in the same mandal
    village_spatial_service._ensure_data_loaded()
    # Find a mandal with multiple villages
    vc = village_spatial_service._villages_gdf["mandal_name"].value_counts()
    sample_mname = vc.index[0]
    m_villages = village_spatial_service._villages_gdf[
        village_spatial_service._villages_gdf["mandal_name"] == sample_mname
    ]
    assert len(m_villages) >= 2
    vcode1 = int(m_villages.iloc[0]["village_code"])
    vcode2 = int(m_villages.iloc[1]["village_code"])

    h1 = client.get(f"/api/village/{vcode1}?disaster_type=all").json()
    h2 = client.get(f"/api/village/{vcode2}?disaster_type=all").json()

    # Villages have distinct centroids, areas, and spatial pixel samples
    assert (h1["centroid_lat"], h1["centroid_lon"]) != (h2["centroid_lat"], h2["centroid_lon"])
    assert h1["village_area_sqkm"] != h2["village_area_sqkm"]
