"""
Automated Verification Suite for Rajasthan State Implementation in RakshaSethu
Tests all 8 functional domains across the platform backend services.
"""
import sys
from pathlib import Path

# Ensure backend directory is in path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.demographics_service import demographics_service
from app.services.gis_service import gis_service
from app.services.hazard_service import hazard_service
from app.services.vulnerability_service import vulnerability_service
from app.services.capacity_service import capacity_service
from app.services.relocation_service import relocation_service
from app.services.simulation_service import simulation_service
from app.simulation.schemas import SimulationParameters
from app.services.decision_service import decision_service

def test_demographics():
    print("Testing Demographics Service for Rajasthan...")
    summary = demographics_service.get_state_summary(state_id="rajasthan")
    assert summary.total_districts == 33, f"Expected 33 districts, got {summary.total_districts}"
    assert summary.total_mandals == 198, f"Expected 198 tehsils, got {summary.total_mandals}"
    assert summary.total_population > 60000000, f"Expected > 60M pop, got {summary.total_population}"
    print(f"  [PASS] Districts: {summary.total_districts}, Tehsils: {summary.total_mandals}, Pop: {summary.total_population:,}")

def test_gis():
    print("Testing GIS Service for Rajasthan...")
    districts = gis_service.get_districts_geojson(state_id="rajasthan")
    assert len(districts.get("features", [])) == 33, f"Expected 33 district features, got {len(districts.get('features', []))}"
    
    mandals = gis_service.get_mandals_geojson(state_id="rajasthan")
    assert len(mandals.get("features", [])) == 198, f"Expected 198 tehsil features, got {len(mandals.get('features', []))}"
    
    # District filter test
    jaipur_mandals = gis_service.get_mandals_geojson(district_id="rj_dist_16", state_id="rajasthan")
    assert len(jaipur_mandals.get("features", [])) > 0, "Jaipur should have tehsils"
    print(f"  [PASS] 33 district polygons, 198 tehsil polygons verified.")

def test_hazard():
    print("Testing Hazard Service for Rajasthan...")
    summary = hazard_service.get_summary(state_id="rajasthan")
    assert summary.total_mandals == 198, f"Expected 198 units, got {summary.total_mandals}"
    assert summary.storm_surge_included is False, "Rajasthan must have storm_surge_included == False"
    assert "landlocked" in summary.storm_surge_exclusion_reason.lower(), "Must explain landlocked status"
    
    # Check detail
    detail = hazard_service.get_mandal_detail("RJ_TEHSIL_001", state_id="rajasthan")
    assert detail is not None, "RJ_TEHSIL_001 must exist in hazard dataset"
    assert detail.storm_surge_included is False, f"Surge included must be False for landlocked Rajasthan, got {detail.storm_surge_included}"
    print(f"  [PASS] Hazard exposure index verified. Surge correctly marked excluded/not applicable.")

def test_vulnerability():
    print("Testing Vulnerability Service for Rajasthan...")
    summary = vulnerability_service.get_summary(state_id="rajasthan")
    assert summary.total_mandals == 198, f"Expected 198 units, got {summary.total_mandals}"
    assert summary.total_rural_population_census2011 > 0, "Total pop must be > 0"
    
    mandals = vulnerability_service.get_all_mandals(state_id="rajasthan")
    assert mandals.total_mandals == 198, f"Expected 198 items, got {mandals.total_mandals}"
    
    detail = vulnerability_service.get_mandal_detail("RJ_TEHSIL_001", state_id="rajasthan")
    assert detail is not None, "RJ_TEHSIL_001 detail must exist"
    print(f"  [PASS] Demographic vulnerability verified: 198 tehsils categorized.")

def test_capacity():
    print("Testing Capacity Service for Rajasthan...")
    summary = capacity_service.get_summary(state_id="rajasthan")
    assert summary.total_mandals == 198, f"Expected 198 units, got {summary.total_mandals}"
    
    adequacy_sum = capacity_service.get_adequacy_summary(state_id="rajasthan")
    assert adequacy_sum.total_mandals == 198, f"Expected 198 units, got {adequacy_sum.total_mandals}"
    
    # Host zone candidates
    host_zones = capacity_service.get_host_zones("RJ_TEHSIL_001", state_id="rajasthan")
    assert host_zones.total_candidates > 0, "RJ_TEHSIL_001 should have candidate host zones"
    print(f"  [PASS] Capacity & host zones verified. Top candidate: {host_zones.candidates[0].candidate_mandal_name} ({host_zones.candidates[0].distance_km} km).")

def test_relocation():
    print("Testing Relocation Prioritization Service for Rajasthan...")
    summary = relocation_service.get_summary(state_id="rajasthan")
    assert summary.total_mandals == 198, f"Expected 198 units, got {summary.total_mandals}"
    assert summary.total_mandals_ranked == 198, f"Expected 198 ranked units, got {summary.total_mandals_ranked}"
    assert summary.ahp_consistency_ratio < 0.10, "AHP CR must be < 0.10"
    
    top = relocation_service.get_top_prioritized(limit=5, state_id="rajasthan")
    assert len(top.items) == 5, f"Expected 5 top items, got {len(top.items)}"
    print(f"  [PASS] TOPSIS Relocation Ranking verified. Rank #1: {top.items[0].mandal_name} (Score: {top.items[0].topsis_score:.4f}).")

def test_simulation():
    print("Testing What-If Simulation Service for Rajasthan...")
    params = SimulationParameters(hazard_change=0.30, population_change=0.10, capacity_change=0.10, accessibility_change=-0.10)
    result = simulation_service.run_simulation(params, state_id="rajasthan")
    assert result.summary.total_mandals == 198, f"Expected 198 units, got {result.summary.total_mandals}"
    assert result.summary.total_mandals_ranked == 198, f"Expected 198 ranked units, got {result.summary.total_mandals_ranked}"
    assert len(result.mandals) == 198, f"Expected 198 output items, got {len(result.mandals)}"
    print(f"  [PASS] Simulation recalculated: Mean baseline score {result.summary.mean_baseline_score:.4f} -> Scenario score {result.summary.mean_scenario_score:.4f}.")

def test_decision():
    print("Testing Decision Support & Action Plan for Rajasthan...")
    action_plan = decision_service.get_action_plan("RJ_TEHSIL_001", state_id="rajasthan")
    assert action_plan is not None, "RJ_TEHSIL_001 action plan must exist"
    assert len(action_plan.immediate_actions) > 0 or len(action_plan.short_term_actions) > 0, "Action plan must have actions"
    
    gap = decision_service.get_capacity_gap_assessment("RJ_TEHSIL_001", state_id="rajasthan")
    assert gap is not None, "RJ_TEHSIL_001 capacity gap must exist"
    
    dash = decision_service.get_action_dashboard_summary(state_id="rajasthan")
    assert dash.total_mandals == 198, f"Expected 198 units, got {dash.total_mandals}"
    print(f"  [PASS] Decision service verified: Action plan generated for {action_plan.mandal_name} ({action_plan.district_name}).")

def run_all():
    print("==========================================================")
    print("RUNNING RAJASTHAN INTEGRATION & VALIDATION TEST SUITE")
    print("==========================================================")
    test_demographics()
    test_gis()
    test_hazard()
    test_vulnerability()
    test_capacity()
    test_relocation()
    test_simulation()
    test_decision()
    print("==========================================================")
    print("ALL RAJASTHAN SUITES PASSED 100%!")
    print("==========================================================")

if __name__ == "__main__":
    run_all()
