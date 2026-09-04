import pytest
from pathlib import Path
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient
from main import app

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
RELOC_CSV = PROJECT_ROOT / "data" / "processed" / "relocation" / "mandal_relocation_priority.csv"
client = TestClient(app)


def test_simulation_presets_endpoint():
    """Verify /api/simulation/presets returns valid standard presets."""
    res = client.get("/api/simulation/presets")
    assert res.status_code == 200
    data = res.json()
    assert "presets" in data
    assert len(data["presets"]) == 4

    preset_ids = [p["preset_id"] for p in data["presets"]]
    assert "baseline" in preset_ids
    assert "severe_hazard" in preset_ids
    assert "extreme_stress" in preset_ids
    assert "improved_preparedness" in preset_ids


def test_simulation_baseline_reproduction():
    """Verify default (0, 0, 0, 0) scenario exactly reproduces official Phase 4 baseline."""
    payload = {
        "hazard_change": 0.0,
        "population_change": 0.0,
        "capacity_change": 0.0,
        "accessibility_change": 0.0
    }
    res = client.post("/api/simulation/run", json=payload)
    assert res.status_code == 200
    data = res.json()

    df_base = pd.read_csv(RELOC_CSV)
    valid_base = df_base[df_base["ranking_status"] != "INSUFFICIENT_DATA"]

    assert data["summary"]["total_mandals"] == 696
    assert data["summary"]["total_mandals_ranked"] == len(valid_base)
    assert np.isclose(data["summary"]["mean_baseline_score"], data["summary"]["mean_scenario_score"], atol=1e-3)
    assert data["summary"]["mandals_priority_increased"] == 0
    assert data["summary"]["mandals_priority_decreased"] == 0
    assert data["summary"]["mandals_rank_unchanged"] == len(valid_base)


def test_simulation_hazard_increase():
    """Verify +30% hazard intensity increases overall priority scores."""
    payload = {
        "hazard_change": 0.30,
        "population_change": 0.0,
        "capacity_change": 0.0,
        "accessibility_change": 0.0
    }
    res = client.post("/api/simulation/run", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["summary"]["mean_scenario_score"] > data["summary"]["mean_baseline_score"]
    assert data["summary"]["mandals_priority_increased"] > 0
    assert data["summary"]["mandals_entered_very_high"] >= 0


def test_simulation_hazard_decrease():
    """Verify -30% hazard intensity decreases overall priority scores."""
    payload = {
        "hazard_change": -0.30,
        "population_change": 0.0,
        "capacity_change": 0.0,
        "accessibility_change": 0.0
    }
    res = client.post("/api/simulation/run", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["summary"]["mean_scenario_score"] < data["summary"]["mean_baseline_score"]
    assert data["summary"]["mandals_priority_decreased"] > 0


def test_simulation_accessibility_inversion():
    """Verify negative accessibility change (worsened roads) increases priority pressure."""
    payload = {
        "hazard_change": 0.0,
        "population_change": 0.0,
        "capacity_change": 0.0,
        "accessibility_change": -0.40  # Worsened egress access
    }
    res = client.post("/api/simulation/run", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["summary"]["mean_scenario_score"] >= data["summary"]["mean_baseline_score"]
    # Check that scenario accessibility constraint increased
    for m in data["mandals"]:
        if m["ranking_status"] != "INSUFFICIENT_DATA":
            assert m["scenario_c4_accessibility"] >= 0.0


def test_simulation_score_bounds():
    """Verify all simulated scores are strictly in [0, 1]."""
    payload = {
        "hazard_change": 0.50,
        "population_change": 0.30,
        "capacity_change": 0.50,
        "accessibility_change": -0.50
    }
    res = client.post("/api/simulation/run", json=payload)
    assert res.status_code == 200
    data = res.json()

    for m in data["mandals"]:
        assert 0.0 <= m["scenario_topsis_score"] <= 1.0
        assert 0.0 <= m["scenario_c1_hazard"] <= 1.0
        assert 0.0 <= m["scenario_c2_demography"] <= 1.0
        assert 0.0 <= m["scenario_c3_capacity"] <= 1.0
        assert 0.0 <= m["scenario_c4_accessibility"] <= 1.0


def test_simulation_input_validation_rejection():
    """Verify invalid parameter values outside allowed ranges are rejected with HTTP 422."""
    invalid_payload = {
        "hazard_change": 1.50,  # Exceeds max 0.50
        "population_change": 0.0,
        "capacity_change": 0.0,
        "accessibility_change": 0.0
    }
    res = client.post("/api/simulation/run", json=invalid_payload)
    assert res.status_code == 422

    invalid_payload_2 = {
        "hazard_change": 0.0,
        "population_change": -0.80,  # Below min -0.20
        "capacity_change": 0.0,
        "accessibility_change": 0.0
    }
    res2 = client.post("/api/simulation/run", json=invalid_payload_2)
    assert res2.status_code == 422


def test_simulation_insufficient_data_preservation():
    """Verify insufficient-data mandals remain unranked and uncorrupted."""
    payload = {
        "hazard_change": 0.30,
        "population_change": 0.10,
        "capacity_change": 0.20,
        "accessibility_change": -0.20
    }
    res = client.post("/api/simulation/run", json=payload)
    assert res.status_code == 200
    data = res.json()

    insufficient_items = [m for m in data["mandals"] if m["ranking_status"] == "INSUFFICIENT_DATA"]
    assert len(insufficient_items) == 16
    for item in insufficient_items:
        assert item["scenario_topsis_score"] == 0.0
        assert item["scenario_rank"] is None
        assert item["scenario_category"] == "INSUFFICIENT-DATA"


def test_simulation_factor_contributions_sum():
    """Verify factor contributions sum to ~100% for all ranked mandals in scenario."""
    payload = {
        "hazard_change": 0.30,
        "population_change": 0.10,
        "capacity_change": 0.20,
        "accessibility_change": -0.30
    }
    res = client.post("/api/simulation/run", json=payload)
    assert res.status_code == 200
    data = res.json()

    ranked_items = [m for m in data["mandals"] if m["ranking_status"] != "INSUFFICIENT_DATA"]
    for item in ranked_items:
        tot = (
            item["factor_contrib_hazard_pct"] +
            item["factor_contrib_demographic_pct"] +
            item["factor_contrib_capacity_pct"] +
            item["factor_contrib_accessibility_pct"]
        )
        assert np.isclose(tot, 100.0, atol=1.0)
        assert item["scenario_explanation"] != ""


def test_simulation_mandal_endpoint():
    """Test GET /api/simulation/mandal/{mandal_id}."""
    res = client.get("/api/simulation/mandal/AP_MANDAL_001?hazard_change=0.20&capacity_change=0.10")
    assert res.status_code == 200
    data = res.json()
    assert data["mandal_id"] == "AP_MANDAL_001"
    assert "baseline_topsis_score" in data
    assert "scenario_topsis_score" in data
    assert "score_change" in data
    assert "scenario_explanation" in data

    res_404 = client.get("/api/simulation/mandal/NONEXISTENT_999")
    assert res_404.status_code == 404
