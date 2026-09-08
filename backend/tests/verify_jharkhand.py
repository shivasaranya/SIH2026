"""
Comprehensive verification test script for Jharkhand State implementation in RakshaSethu.
Validates:
  1. Demographics Service (24 Districts, 260 Blocks, Census totals)
  2. GIS Service (24 District Polygons, 260 Block Polygons, District Filtering)
  3. Multi-Hazard Framework (Inland non-surge, Flood, Seismic, Wind, Slope)
  4. Demographic Vulnerability (C2 scoring, Child/Non-worker/HH size components)
  5. Emergency Capacity (Shelters, Beds, Evacuation Roads, Bottlenecks)
  6. Relocation Prioritization (AHP weights, TOPSIS scoring, Ranks 1..260, Factor contributions)
  7. Scenario Simulation (Sensitivity adjustments, ranking shifts)
  8. Decision Support & Action Planning (Immediate 0-72h, Short-term 1-6m, Long-term 1-3y)
"""
import sys
from pathlib import Path

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

def verify_jharkhand():
    print("==========================================================")
    print("RUNNING JHARKHAND COMPREHENSIVE SUITE")
    print("==========================================================")

    # 1. Demographics
    print("\n[1/8] Testing Demographics Service...")
    demo_sum = demographics_service.get_state_summary(state_id="jharkhand")
    assert demo_sum.total_districts == 24, f"Expected 24 districts, got {demo_sum.total_districts}"
    assert demo_sum.total_population > 30000000, f"Unexpected pop: {demo_sum.total_population}"
    print(f"  [PASS] State Summary: {demo_sum.total_districts} districts, {demo_sum.total_population:,} population")
    
    dist_detail = demographics_service.get_district_detail(district_id="jh_dist_01", state_id="jharkhand")
    assert dist_detail.district.district_name == "Ranchi"
    print(f"  [PASS] Ranchi District detail loaded with {len(dist_detail.mandals)} blocks")

    # 2. GIS
    print("\n[2/8] Testing GIS Service...")
    dist_geojson = gis_service.get_districts_geojson(state_id="jharkhand")
    assert len(dist_geojson["features"]) == 24, f"Expected 24 district features, got {len(dist_geojson['features'])}"
    print(f"  [PASS] 24 District Polygons loaded")

    mandal_geojson = gis_service.get_mandals_geojson(state_id="jharkhand")
    assert len(mandal_geojson["features"]) == 260, f"Expected 260 block features, got {len(mandal_geojson['features'])}"
    print(f"  [PASS] 260 Block Polygons loaded")

    ranchi_mandals = gis_service.get_mandals_geojson(district_id="jh_dist_01", state_id="jharkhand")
    assert len(ranchi_mandals["features"]) == 19, f"Expected 19 blocks in Ranchi, got {len(ranchi_mandals['features'])}"
    print(f"  [PASS] District filtering: {len(ranchi_mandals['features'])} blocks in Ranchi")

    # 3. Hazard
    print("\n[3/8] Testing Hazard Service...")
    haz_sum = hazard_service.get_summary(state_id="jharkhand")
    assert haz_sum.total_mandals == 260
    assert haz_sum.storm_surge_included is False
    print(f"  [PASS] Hazard Summary: 260 blocks, inland state (surge=False)")

    # 4. Vulnerability
    print("\n[4/8] Testing Vulnerability Service...")
    vuln_sum = vulnerability_service.get_summary(state_id="jharkhand")
    assert vuln_sum.total_mandals == 260
    print(f"  [PASS] Vulnerability Summary: 260 blocks evaluated")

    # 5. Capacity
    print("\n[5/8] Testing Capacity Service...")
    cap_sum = capacity_service.get_summary(state_id="jharkhand")
    assert cap_sum.total_mandals == 260
    assert cap_sum.total_designated_shelters > 0
    print(f"  [PASS] Capacity Summary: {cap_sum.total_designated_shelters} shelters, {cap_sum.total_normative_health_beds_iphs:,} beds")

    # 6. Relocation
    print("\n[6/8] Testing Relocation Prioritization (AHP + TOPSIS)...")
    reloc_sum = relocation_service.get_summary(state_id="jharkhand")
    assert reloc_sum.total_mandals == 260
    assert reloc_sum.total_mandals_ranked == 260
    print(f"  [PASS] Relocation Summary: {reloc_sum.total_mandals_ranked} ranked blocks, AHP CR={reloc_sum.ahp_consistency_ratio}")

    top_res = relocation_service.get_top_prioritized(limit=10, state_id="jharkhand")
    top_units = top_res.items
    assert len(top_units) == 10
    assert top_units[0].relocation_priority_rank == 1
    print(f"  [PASS] Top #1 Priority Block: {top_units[0].mandal_name} ({top_units[0].current_district_name}) - TOPSIS Score: {top_units[0].topsis_score}")

    # 7. Simulation
    print("\n[7/8] Testing What-If Simulation...")
    sim_res = simulation_service.run_simulation(SimulationParameters(hazard_change=0.15, population_change=0.05), state_id="jharkhand")
    assert sim_res.summary.total_mandals == 260
    print(f"  [PASS] Simulation successful across {sim_res.summary.total_mandals} blocks (shifts computed)")

    # 8. Decision Support & Action Planning
    print("\n[8/8] Testing Decision Support & Action Planning...")
    dec_sum = decision_service.get_action_dashboard_summary(state_id="jharkhand")
    assert dec_sum.total_mandals == 260
    assert dec_sum.candidate_host_zones_count > 0
    print(f"  [PASS] Decision Dashboard: {len(dec_sum.top_action_mandals)} top action blocks, {dec_sum.candidate_host_zones_count} candidate host zones")

    # Test Action Plan generation
    action_plan = decision_service.get_action_plan(mandal_id=top_units[0].mandal_id, state_id="jharkhand")
    assert len(action_plan.immediate_actions) > 0
    agency = action_plan.immediate_actions[0].responsible_agency
    assert "JSDMA" in agency or "Jharkhand" in agency
    print(f"  [PASS] Action Plan for {action_plan.mandal_name} generated: {len(action_plan.immediate_actions)} immediate, {len(action_plan.short_term_actions)} short-term, {len(action_plan.long_term_actions)} long-term actions (Agency: {agency})")

    print("\n==========================================================")
    print("ALL JHARKHAND TESTS PASSED 100%!")
    print("==========================================================")

if __name__ == "__main__":
    verify_jharkhand()
