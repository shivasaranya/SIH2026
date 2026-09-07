"""
Automated Verification Suite for Tripura State Implementation in RakshaSethu
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
    print("Testing Demographics Service for Tripura...")
    summary = demographics_service.get_state_summary(state_id="tripura")
    assert summary.total_districts == 8, f"Expected 8 districts, got {summary.total_districts}"
    assert summary.total_mandals == 26, f"Expected 26 sub-divisions, got {summary.total_mandals}"
    assert summary.total_population > 0, "Population must be > 0"
    print(f"  [PASS] Districts: {summary.total_districts}, Sub-Divisions: {summary.total_mandals}, Pop: {summary.total_population:,}")

def test_gis():
    print("Testing GIS Service for Tripura...")
    districts = gis_service.get_districts_geojson(state_id="tripura")
    assert len(districts.get("features", [])) == 8, f"Expected 8 district features, got {len(districts.get('features', []))}"
    
    subdivisions = gis_service.get_mandals_geojson(state_id="tripura")
    assert len(subdivisions.get("features", [])) == 26, f"Expected 26 subdivision features, got {len(subdivisions.get('features', []))}"
    
    # District filter test
    dhalai_subds = gis_service.get_mandals_geojson(district_id="dhalai", state_id="tripura")
    assert len(dhalai_subds.get("features", [])) > 0, "Dhalai should have sub-divisions"
    print(f"  [PASS] 8 district polygons, 26 subdivision polygons verified.")

def test_hazard():
    print("Testing Hazard Service for Tripura...")
    summary = hazard_service.get_summary(state_id="tripura")
    assert summary.total_mandals == 26, f"Expected 26 units, got {summary.total_mandals}"
    assert summary.storm_surge_included is False, "Tripura must have storm_surge_included == False"
    assert "landlocked" in summary.storm_surge_exclusion_reason.lower(), "Must explain landlocked status"
    
    # Check detail
    detail = hazard_service.get_mandal_detail("TR_SUBD_001", state_id="tripura")
    assert detail is not None, "TR_SUBD_001 must exist in hazard dataset"
    assert detail.mandal_name == "Ambassa", f"Expected Ambassa, got {detail.mandal_name}"
    assert detail.storm_surge_included is False, f"Surge included must be False for landlocked Tripura, got {detail.storm_surge_included}"
    print(f"  [PASS] Hazard exposure index verified. Surge correctly marked excluded/not applicable.")

def test_vulnerability():
    print("Testing Vulnerability Service for Tripura...")
    summary = vulnerability_service.get_summary(state_id="tripura")
    assert summary.total_mandals == 26, f"Expected 26 units, got {summary.total_mandals}"
    assert summary.total_rural_population_census2011 > 0, "Total pop must be > 0"
    
    mandals = vulnerability_service.get_all_mandals(state_id="tripura")
    assert mandals.total_mandals == 26, f"Expected 26 items, got {mandals.total_mandals}"
    
    detail = vulnerability_service.get_mandal_detail("TR_SUBD_001", state_id="tripura")
    assert detail is not None, "TR_SUBD_001 detail must exist"
    print(f"  [PASS] Demographic vulnerability verified: 26 sub-divisions categorized.")

def test_capacity():
    print("Testing Capacity Service for Tripura...")
    summary = capacity_service.get_summary(state_id="tripura")
    assert summary.total_mandals == 26, f"Expected 26 units, got {summary.total_mandals}"
    
    adequacy_sum = capacity_service.get_adequacy_summary(state_id="tripura")
    assert adequacy_sum.total_mandals == 26, f"Expected 26 units, got {adequacy_sum.total_mandals}"
    
    # Host zone candidates
    host_zones = capacity_service.get_host_zones("TR_SUBD_001", state_id="tripura")
    assert host_zones.total_candidates > 0, "TR_SUBD_001 should have candidate host zones"
    print(f"  [PASS] Capacity & host zones verified. Top candidate: {host_zones.candidates[0].candidate_mandal_name} ({host_zones.candidates[0].distance_km} km).")

def test_relocation():
    print("Testing Relocation Prioritization Service for Tripura...")
    summary = relocation_service.get_summary(state_id="tripura")
    assert summary.total_mandals == 26, f"Expected 26 units, got {summary.total_mandals}"
    assert summary.total_mandals_ranked == 26, f"Expected 26 ranked units, got {summary.total_mandals_ranked}"
    assert summary.ahp_consistency_ratio < 0.10, "AHP CR must be < 0.10"
    
    top = relocation_service.get_top_prioritized(limit=5, state_id="tripura")
    assert len(top.items) == 5, f"Expected 5 top items, got {len(top.items)}"
    print(f"  [PASS] TOPSIS Relocation Ranking verified. Rank #1: {top.items[0].mandal_name} (Score: {top.items[0].topsis_score:.4f}).")

def test_simulation():
    print("Testing What-If Simulation Service for Tripura...")
    params = SimulationParameters(hazard_change=0.30, population_change=0.10, capacity_change=0.10, accessibility_change=-0.10)
    result = simulation_service.run_simulation(params, state_id="tripura")
    assert result.summary.total_mandals == 26, f"Expected 26 units, got {result.summary.total_mandals}"
    assert result.summary.total_mandals_ranked == 26, f"Expected 26 ranked units, got {result.summary.total_mandals_ranked}"
    assert len(result.mandals) == 26, f"Expected 26 output items, got {len(result.mandals)}"
    print(f"  [PASS] Simulation recalculated: Mean baseline score {result.summary.mean_baseline_score} -> Scenario score {result.summary.mean_scenario_score}.")

def test_decision():
    print("Testing Decision & Action Planning Service for Tripura...")
    gap = decision_service.get_capacity_gap_assessment("TR_SUBD_001", state_id="tripura")
    assert gap is not None, "Gap assessment must not be None"
    assert gap.mandal_name == "Ambassa", f"Expected Ambassa, got {gap.mandal_name}"
    
    plan = decision_service.get_action_plan("TR_SUBD_001", state_id="tripura")
    assert plan is not None, "Action plan must not be None"
    assert len(plan.immediate_actions) > 0 or len(plan.short_term_actions) > 0, "Action plan must have actions"
    
    # Source vs Host comparison
    # Find candidate host for TR_SUBD_001
    hosts = capacity_service.get_host_zones("TR_SUBD_001", state_id="tripura")
    cand_id = hosts.candidates[0].candidate_mandal_id
    comp = decision_service.compare_source_and_host("TR_SUBD_001", cand_id, state_id="tripura")
    assert comp is not None, "Comparison must not be None"
    assert len(comp.key_advantages) > 0, "Must have itemized key advantages"
    print(f"  [PASS] Decision Support verified. Action plan generated for Ambassa; Compared against {comp.candidate_host['mandal_name']}.")

if __name__ == "__main__":
    print("=================================================================")
    print("RUNNING COMPLETE 8-DOMAIN TRIPURA STATE VERIFICATION TEST SUITE")
    print("=================================================================")
    test_demographics()
    test_gis()
    test_hazard()
    test_vulnerability()
    test_capacity()
    test_relocation()
    test_simulation()
    test_decision()
    print("=================================================================")
    print("ALL 8 FUNCTIONAL DOMAINS PASSED VERIFICATION FOR TRIPURA!")
    print("=================================================================")
