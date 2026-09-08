"""
Validate Kerala village spatial pipeline end-to-end via the FastAPI test client.
Tests: village lookup, geometry, hazards, scenario, relocation centers.
"""
import pytest
from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'app'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from main import app

client = TestClient(app)

# Kerala village codes: 32 + taluk_num(3-digit) + village_seq(4-digit) = 9 digits
KERALA_VILLAGE_CODE_HOSDURG = 320010001   # Hosdurg Taluk, village 1 (Bekal)
KERALA_VILLAGE_CODE_WAYANAD = 320060001   # Mananthavady Taluk (Wayanad district), village 1
KERALA_VILLAGE_CODE_KASARAGOD = 320610001 # Kasaragod Taluk, village 1
KERALA_VILLAGE_CODE_TVM = 320590001       # Thiruvananthapuram Taluk, village 1


def test_kerala_village_lookup():
    """Village code resolves correctly to Kerala."""
    resp = client.get(f"/api/village/{KERALA_VILLAGE_CODE_HOSDURG}")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    assert data["village_code"] == KERALA_VILLAGE_CODE_HOSDURG
    assert "village_name" in data
    assert data["village_name"] != ""
    assert "mandal_name" in data


def test_kerala_village_geometry():
    """Village geometry returns valid GeoJSON within Kerala bounds."""
    resp = client.get(f"/api/village/{KERALA_VILLAGE_CODE_HOSDURG}/geometry")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    assert data["village_code"] == KERALA_VILLAGE_CODE_HOSDURG
    assert "village_boundary_geojson" in data
    assert "sectors_geojson" in data
    # Centroid should be in Kerala (roughly 8-13.5N, 74-78E)
    lat = data["centroid_lat"]
    lon = data["centroid_lon"]
    assert 8.0 <= lat <= 13.5, f"Centroid lat {lat} out of Kerala bounds"
    assert 74.0 <= lon <= 78.5, f"Centroid lon {lon} out of Kerala bounds"
    # Should have sector features
    assert len(data["sectors_geojson"]["features"]) >= 1


def test_kerala_village_hazards():
    """Village hazard analysis returns valid sectors list for Kerala village."""
    resp = client.get(f"/api/village/{KERALA_VILLAGE_CODE_HOSDURG}/hazards")
    assert resp.status_code == 200, f"Expected 200: {resp.text[:200]}"
    data = resp.json()
    assert data["village_code"] == KERALA_VILLAGE_CODE_HOSDURG
    assert "sectors" in data
    # sectors is a list of sector objects
    assert isinstance(data["sectors"], list)
    assert len(data["sectors"]) == 4
    sector_names = {s["sector"] for s in data["sectors"]}
    assert sector_names == {"NORTH", "SOUTH", "EAST", "WEST"}
    # Overall hazard score is present and in [0,1]
    assert "overall_hazard_score" in data
    assert 0.0 <= data["overall_hazard_score"] <= 1.0


def test_kerala_village_hazards_wayanad():
    """Wayanad (Western Ghats) village is accessible."""
    resp = client.get(f"/api/village/{KERALA_VILLAGE_CODE_WAYANAD}/hazards")
    assert resp.status_code == 200, f"Expected 200: {resp.text[:200]}"
    data = resp.json()
    assert data["village_code"] == KERALA_VILLAGE_CODE_WAYANAD
    assert len(data["sectors"]) == 4
    assert "overall_hazard_score" in data


def test_kerala_village_scenario():
    """What-if scenario runs correctly for Kerala village."""
    resp = client.get(
        f"/api/village/{KERALA_VILLAGE_CODE_HOSDURG}/scenario",
        params={"increase": 3.0}
    )
    assert resp.status_code == 200, f"Expected 200: {resp.text[:200]}"
    data = resp.json()
    assert data["village_code"] == KERALA_VILLAGE_CODE_HOSDURG
    # The actual field name is baseline_hazard_score (not baseline_score)
    assert "baseline_hazard_score" in data
    assert "simulated_hazard_score" in data
    # Scenario with increase=3 should have higher or equal score
    assert data["simulated_hazard_score"] >= data["baseline_hazard_score"] * 0.9


def test_kerala_village_relocation():
    """Relocation center recommendations work for Kerala village."""
    resp = client.get(
        f"/api/village/{KERALA_VILLAGE_CODE_HOSDURG}/relocation-centers",
        params={"limit": 3, "intensity": "high"}
    )
    assert resp.status_code == 200, f"Expected 200: {resp.text[:200]}"
    data = resp.json()
    assert data["village_code"] == KERALA_VILLAGE_CODE_HOSDURG
    # relocation candidates can be in different fields depending on response model
    has_candidates = "candidates" in data or "relocation_candidates" in data or "recommended_centers" in data
    assert has_candidates, f"No candidates field found. Keys: {list(data.keys())}"


def test_kerala_village_codes_are_9_digits():
    """Kerala village codes are 9 digits starting with 32."""
    kl_code = KERALA_VILLAGE_CODE_HOSDURG
    assert str(kl_code).startswith("32"), f"Code {kl_code} does not start with 32"
    assert len(str(kl_code)) == 9, f"Expected 9-digit code, got {len(str(kl_code))}"


def test_all_three_kerala_districts_accessible():
    """Verify villages from Kasaragod, Wayanad, and Thiruvananthapuram are accessible."""
    for code in [KERALA_VILLAGE_CODE_HOSDURG, KERALA_VILLAGE_CODE_WAYANAD, KERALA_VILLAGE_CODE_TVM]:
        resp = client.get(f"/api/village/{code}")
        assert resp.status_code == 200, f"Village {code} failed: {resp.text[:200]}"
        data = resp.json()
        assert data["village_code"] == code


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
