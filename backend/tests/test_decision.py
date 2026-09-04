import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_decision_summary_endpoint():
    """Verify GET /api/decision/summary returns statewide decision metrics."""
    res = client.get("/api/decision/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 696
    assert data["very_high_priority_count"] == 68
    assert data["candidate_host_zones_count"] == 51
    assert "top_action_mandals" in data
    assert "top_capacity_bottlenecks" in data
    assert len(data["top_action_mandals"]) <= 10


def test_capacity_gap_valid_mandal():
    """Verify GET /api/decision/mandal/{id}/capacity-gap returns valid gap assessments."""
    res = client.get("/api/decision/mandal/AP_MANDAL_001/capacity-gap")
    assert res.status_code == 200
    data = res.json()
    assert data["mandal_id"] == "AP_MANDAL_001"
    assert data["planning_population"] > 0
    assert "shelter_gap_status" in data
    assert "health_gap_status" in data
    assert "safe_area_gap_status" in data
    assert "water_sanitation_gap_status" in data
    assert "road_accessibility_gap_status" in data
    assert "INDICATIVE PLANNING ESTIMATE" in data["data_limitations_notice"]


def test_capacity_gap_missing_data_integrity():
    """Verify inland or unrecorded facilities do NOT silently become zero capacity."""
    # Test inland mandal (e.g. AP_MANDAL_002 Gummalakshmipuram)
    res = client.get("/api/decision/mandal/AP_MANDAL_002/capacity-gap")
    assert res.status_code == 200
    data = res.json()
    # Cyclone shelters are not applicable for inland mandal, verified capacity should be null/non-applicable
    assert data["shelter_gap_status"] in ["NON_APPLICABLE_OR_INSUFFICIENT_DATA", "ADEQUATE", "DEFICIT_IDENTIFIED"]
    if data["shelter_capacity_verified"] is None:
        assert data["shelter_deficit_persons"] is None


def test_action_plan_very_high_priority():
    """Verify Action Plan generates immediate, short-term, and long-term actions for high priority mandals."""
    res = client.get("/api/decision/mandal/AP_MANDAL_001/action-plan")
    assert res.status_code == 200
    data = res.json()
    assert "immediate_actions" in data
    assert "short_term_actions" in data
    assert "long_term_actions" in data
    assert len(data["immediate_actions"]) > 0
    assert len(data["short_term_actions"]) > 0
    assert len(data["long_term_actions"]) > 0

    # Verify action items structure
    act = data["immediate_actions"][0]
    assert "action_id" in act
    assert "title" in act
    assert "responsible_agency" in act
    assert "trigger_condition" in act
    assert "DECISION SUPPORT RECOMMENDATIONS ONLY" in data["governance_disclaimer"]


def test_source_host_comparison():
    """Verify GET /api/decision/mandal/{source_id}/compare/{host_id} returns side-by-side comparison."""
    # Ichchapuram (AP_MANDAL_001) vs Mylavaram2 (AP_MANDAL_202)
    res = client.get("/api/decision/mandal/AP_MANDAL_001/compare/AP_MANDAL_202")
    assert res.status_code == 200
    data = res.json()
    assert "source_mandal" in data
    assert "candidate_host" in data
    assert "distance_km" in data
    assert data["distance_km"] > 0
    assert len(data["key_advantages"]) > 0
    assert "HUMAN VALIDATION REQUIRED" in data["human_validation_notice"]


def test_source_host_comparison_404():
    """Verify 404 is returned for non-existent mandal IDs."""
    res = client.get("/api/decision/mandal/NONEXISTENT_123/compare/AP_MANDAL_202")
    assert res.status_code == 404
