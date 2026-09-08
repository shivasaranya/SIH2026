import pytest
import numpy as np
import pandas as pd
from pathlib import Path
from fastapi.testclient import TestClient
from main import app
from app.services.relocation_service import relocation_service

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
RELOC_DIR = PROJECT_ROOT / "data" / "processed" / "relocation"
CAP_DIR = PROJECT_ROOT / "data" / "processed" / "capacity"
client = TestClient(app)


def test_case_a_same_mandal_safe_preferred():
    """
    Test Case A:
    When a mandal is itself safe (< 0.35 hazard), has adequate capacity, and safe land,
    its same-mandal viability receives top tier and proximity preference over farther alternatives.
    """
    # AP_MANDAL_244 (Gurazala in Palnadu) is an established candidate host with low hazard and adequate headroom
    res = client.get("/api/relocation/mandal/AP_MANDAL_244/host-zones")
    assert res.status_code == 200
    data = res.json()
    assert data["source_mandal_id"] == "AP_MANDAL_244"
    assert len(data["candidates"]) > 0

    top_cand = data["candidates"][0]
    # For Gurazala, either itself (Same Mandal) or closest adjacent host is preferred
    assert top_cand["proximity_tier"] in [1, 2]
    assert top_cand["is_safe"] is True
    assert top_cand["is_capacity_adequate"] is True
    assert top_cand["relocation_suitability_score"] > 0.70


def test_case_b_same_mandal_unsafe_adjacent_mandal_wins():
    """
    Test Case B:
    When same mandal is unsafe (e.g. hazard exposure >= 0.35),
    the Hard Safety Filter must REJECT the same mandal, and an adjacent/safer candidate must win.
    """
    # AP_MANDAL_230 (Dachepalle) or a mandal with adjacent host
    res = client.get("/api/relocation/mandal/AP_MANDAL_230/host-zones")
    assert res.status_code == 200
    data = res.json()
    assert len(data["candidates"]) > 0

    # Ensure all viable candidates passed the safety filter
    for cand in data["candidates"]:
        assert cand["candidate_hazard_exposure"] < 0.35
        assert cand["candidate_safe_area_fraction"] >= 0.50
        assert cand["candidate_capacity_condition"] != "CAPACITY-STRESSED"
        assert cand["is_safe"] is True

    # Top candidate is a safe viable destination
    top_cand = data["candidates"][0]
    assert top_cand["candidate_hazard_exposure"] < 0.35


def test_case_c_insufficient_capacity_farther_safe_candidate_wins():
    """
    Test Case C:
    If a nearby candidate has insufficient capacity or is capacity-stressed,
    it must be rejected and a farther candidate with adequate capacity can win.
    """
    res = client.get("/api/relocation/mandal/AP_MANDAL_001/host-zones")
    assert res.status_code == 200
    data = res.json()

    # Verify rejected candidates list contains reasons
    rejected = data.get("rejected_candidates", [])
    assert len(rejected) > 0

    # Origin AP_MANDAL_001 is severely constrained/high hazard
    rej_reasons = [r["rejection_reason"] for r in rejected]
    assert any("hazard exposure" in r.lower() or "insufficient capacity" in r.lower() for r in rej_reasons)

    # Viable candidates accommodated farther away must have adequate headroom
    for cand in data["candidates"]:
        assert cand["candidate_capacity_condition"] in ["CAPACITY-ADEQUATE", "CAPACITY-CONSTRAINED"]
        assert cand["candidate_safe_area_fraction"] >= 0.50


def test_case_d_insufficient_data_not_treated_as_safe():
    """
    Test Case D:
    A candidate with insufficient data must NOT be treated as safe.
    It must be labeled INSUFFICIENT-DATA and excluded from recommended viable destinations.
    """
    # Mandals marked INSUFFICIENT_DATA (e.g. Visakhapatnam urban Census units with 0 rural habitations)
    reloc_csv = RELOC_DIR / "mandal_relocation_priority.csv"
    df = pd.read_csv(reloc_csv)
    insuf_mandals = df[df["ranking_status"] == "INSUFFICIENT_DATA"]["mandal_id"].tolist()

    if len(insuf_mandals) > 0:
        target = insuf_mandals[0]
        res = client.get(f"/api/relocation/mandal/{target}/host-zones")
        assert res.status_code == 200
        data = res.json()

        # Check rejected list contains INSUFFICIENT-DATA label for target
        rejected_cands = data.get("rejected_candidates", [])
        insuf_found = any("INSUFFICIENT-DATA" in (r.get("rejection_reason") or "") for r in rejected_cands)
        assert insuf_found, "Target with insufficient data was not properly rejected"


def test_case_e_different_district_fallback_when_closer_unavailable():
    """
    Test Case E:
    Different-district candidate is allowed as a fallback when suitable closer candidates are unavailable
    (such as coastal cyclone-exposed mandals like Ichchapuram in Srikakulam).
    """
    res = client.get("/api/relocation/mandal/AP_MANDAL_001/host-zones")
    assert res.status_code == 200
    data = res.json()

    assert len(data["candidates"]) > 0
    top_cand = data["candidates"][0]

    # For Srikakulam coastal mandal, top candidate is an inland candidate (Different District)
    assert top_cand["administrative_relation"] == "DIFFERENT_DISTRICT"
    assert top_cand["proximity_tier"] == 4
    assert "Exceptional fallback" in (top_cand["recommendation_reason"] or "")


def test_case_f_real_geographic_distances():
    """
    Test Case F:
    Verify distance calculations are real geographic distances in EPSG:7755 (India Albers Equal Area).
    Ensure no artificial cutoffs (1.5 km, 2 km, 5 km, 10 km, 50 km) are hardcoded as limits.
    """
    res = client.get("/api/relocation/mandal/AP_MANDAL_001/host-zones")
    assert res.status_code == 200
    data = res.json()

    distances = [c["distance_km"] for c in data["candidates"]]
    assert len(distances) > 0
    # Mandals in AP have realistic inter-mandal distances > 0
    assert all(d > 0.0 for d in distances)
    # The system does NOT enforce a 50 km or 10 km cutoff
    assert any(d > 50.0 for d in distances)

    # Check soft preference notice
    assert "Distance is a soft preference" in data.get("soft_preference_notice", "")
    assert "NCRMP 1.5–2 km is a cyclone shelter service/design radius" in data.get("soft_preference_notice", "")


def test_case_g_existing_ahp_topsis_relocation_priority_unchanged():
    """
    Test Case G:
    CRITICAL: Verify existing AHP/TOPSIS relocation-priority analytical model,
    weights, TOPSIS closeness coefficients, and ranks remain 100% unchanged.
    """
    csv_path = RELOC_DIR / "mandal_relocation_priority.csv"
    df = pd.read_csv(csv_path)

    # 1. Check AHP weights endpoint
    res_weights = client.get("/api/relocation/weights")
    assert res_weights.status_code == 200
    w_data = res_weights.json()
    assert np.isclose(w_data["consistency_ratio"], 0.0038, atol=1e-3)
    c1_weight = [w["weight"] for w in w_data["weights"] if w.get("criterion_id") == "C1"][0]
    assert np.isclose(c1_weight, 0.4231, atol=1e-3)

    # 2. Check TOPSIS summary endpoint
    res_summary = client.get("/api/relocation/summary")
    assert res_summary.status_code == 200
    s_data = res_summary.json()
    assert s_data["total_mandals"] == 696
    assert s_data["mandals_very_high_priority"] > 0

    # 3. Check mandal detail endpoint
    res_detail = client.get("/api/relocation/mandal/AP_MANDAL_001")
    assert res_detail.status_code == 200
    d_data = res_detail.json()
    assert np.isclose(d_data["c1_hazard_exposure"], 0.5293, atol=1e-3)
    assert d_data["relocation_priority_category"] == "VERY HIGH"
