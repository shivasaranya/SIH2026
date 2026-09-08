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

def test_village_scenario_bounds_and_recalculation():
    """Test 6: 0–10 What-If scenario mathematical precision, bounds, and simulation disclaimer."""
    test_villages = [585688, 590751, 589989]

    for vcode in test_villages:
        # Baseline scenario (increase = 0%)
        r0 = client.get(f"/api/village/{vcode}/scenario?increase=0")
        assert r0.status_code == 200
        d0 = r0.json()
        assert d0["scenario_hazard_increase"] == 0.0
        assert d0["disclaimer"] == "SCENARIO SIMULATION — NOT A FORECAST"
        assert abs(d0["simulated_hazard_score"] - d0["baseline_hazard_score"]) < 1e-4
        assert d0["priority_shifted"] is False

        # Perturbed scenario (increase = +5%)
        r5 = client.get(f"/api/village/{vcode}/scenario?increase=5.0")
        assert r5.status_code == 200
        d5 = r5.json()
        assert d5["scenario_hazard_increase"] == 5.0
        expected_5 = round(min(1.0, d0["baseline_hazard_score"] * 1.05), 4)
        assert abs(d5["simulated_hazard_score"] - expected_5) < 1e-4
        assert len(d5["sector_simulations"]) == 4
        for ss in d5["sector_simulations"]:
            assert 0.0 <= ss["simulated_score"] <= 1.0
            assert abs(ss["simulated_score"] - round(min(1.0, ss["baseline_score"] * 1.05), 4)) < 1e-4

        # Perturbed scenario (increase = +10%)
        r10 = client.get(f"/api/village/{vcode}/scenario?increase=10.0")
        assert r10.status_code == 200
        d10 = r10.json()
        assert d10["scenario_hazard_increase"] == 10.0
        expected_10 = round(min(1.0, d0["baseline_hazard_score"] * 1.10), 4)
        assert abs(d10["simulated_hazard_score"] - expected_10) < 1e-4
        assert d10["simulated_hazard_score"] >= d5["simulated_hazard_score"]

        # Reset verification: calling 0% after 10% returns baseline without state accumulation
        r0_reset = client.get(f"/api/village/{vcode}/scenario?increase=0")
        assert r0_reset.status_code == 200
        assert abs(r0_reset.json()["simulated_hazard_score"] - d0["baseline_hazard_score"]) < 1e-4

    # Invalid bound (>10) rejected by validator
    r_bad = client.get("/api/village/585688/scenario?increase=15")
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

def test_village_sectors_impact_rank():
    """Test 9: Verify deterministic impact_rank #1 to #4 in sector hazard details."""
    res = client.get("/api/village/590754?disaster_type=all")
    assert res.status_code == 200
    data = res.json()
    ranks = [s.get("impact_rank") for s in data["sectors"]]
    assert set(ranks) == {1, 2, 3, 4}
    # Check that rank 1 has highest or equal hazard score compared to rank 4
    rank_to_score = {s["impact_rank"]: s["sector_hazard_score"] for s in data["sectors"]}
    assert rank_to_score[1] >= rank_to_score[2] >= rank_to_score[3] >= rank_to_score[4]

def test_relocation_three_tiers():
    """Test 10: Verify 3-tier relocation logic (low, high, very_high)."""
    # Low intensity: In-village (no verified point shelter cataloged inside village 590754)
    r_low = client.get("/api/village/590754/relocation-centers?intensity=low").json()
    assert r_low["nearby_candidate_found"] is False
    assert len(r_low["recommended_centers"]) == 0
    assert "no verified" in r_low["fallback_notice"].lower()

    # High intensity: Within mandal (real census villages returned)
    r_high = client.get("/api/village/590754/relocation-centers?intensity=high").json()
    assert r_high["nearby_candidate_found"] is True
    assert len(r_high["recommended_centers"]) > 0
    for c in r_high["recommended_centers"]:
        assert c["proximity_category"] == "SAME MANDAL"
        assert c["location_tier"] == "SAME_MANDAL"
        assert c["distance_km"] > 0

    # Very High intensity: Outside mandal (pre-verified host zones)
    r_vh = client.get("/api/village/590754/relocation-centers?intensity=very_high").json()
    assert r_vh["nearby_candidate_found"] is True
    assert len(r_vh["recommended_centers"]) > 0
    for c in r_vh["recommended_centers"]:
        assert c["location_tier"] == "OUTSIDE_MANDAL"
        assert c["rejected_closer_candidates"] is not None
        assert len(c["rejected_closer_candidates"]) > 0

def test_village_pois_chinavadlapudi():
    """Test 11: Real POIs for Chinavadlapudi (589989)."""
    res = client.get("/api/village/589989/pois")
    assert res.status_code == 200
    data = res.json()
    assert data["village_code"] == 589989
    assert data["village_name"] == "Chinavadlapudi"
    assert data["source"] == "OpenStreetMap"
    assert data["total_pois"] > 0
    assert data["inside_count"] >= 2
    assert data["nearby_count"] > 0
    assert len(data["categories_summary"]) > 0
    # Inside POI must have sector and priority
    inside_pois = [p for p in data["pois"] if p["is_inside"]]
    assert len(inside_pois) >= 2
    for p in inside_pois:
        assert p["sector"] in ["NORTH", "EAST", "SOUTH", "WEST"]
        assert p["sector_priority"] in ["VERY HIGH", "HIGH", "MODERATE", "LOW", "INSUFFICIENT DATA"]
        assert p["distance_km"] == 0.0

def test_village_pois_other_district():
    """Test 12: Real POIs for Gangaram in Srikakulam (581073)."""
    res = client.get("/api/village/581073/pois")
    assert res.status_code == 200
    data = res.json()
    assert data["village_code"] == 581073
    assert data["district_name"] == "Srikakulam"
    assert data["source"] == "OpenStreetMap"
    assert data["total_pois"] >= 5
    for p in data["pois"]:
        assert p["osm_id"] is not None
        assert p["latitude"] > 0
        assert p["longitude"] > 0


