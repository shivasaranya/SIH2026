"""
Comprehensive multi-state verification script for Andhra Pradesh, Tamil Nadu, and Tripura.
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

STATES = [
    {"id": "andhra_pradesh", "name": "Andhra Pradesh", "districts": 26, "units": 696, "ranked": 680, "surge": False},
    {"id": "tamil_nadu", "name": "Tamil Nadu", "districts": 38, "units": 302, "ranked": 302, "surge": True},
    {"id": "tripura", "name": "Tripura", "districts": 8, "units": 26, "ranked": 26, "surge": False},
    {"id": "telangana", "name": "Telangana", "districts": 33, "units": 109, "ranked": 109, "surge": False},
    {"id": "rajasthan", "name": "Rajasthan", "districts": 33, "units": 198, "ranked": 198, "surge": False},
    {"id": "madhya_pradesh", "name": "Madhya Pradesh", "districts": 52, "units": 273, "ranked": 273, "surge": False},
    {"id": "karnataka", "name": "Karnataka", "districts": 31, "units": 230, "ranked": 230, "surge": True},
    {"id": "goa", "name": "Goa", "districts": 2, "units": 12, "ranked": 12, "surge": True},
    {"id": "manipur", "name": "Manipur", "districts": 16, "units": 51, "ranked": 51, "surge": False},
]

def verify_state(state):
    s_id = state["id"]
    name = state["name"]
    print(f"\nVerifying {name} ({s_id})...")
    
    # 1. Demographics
    demo = demographics_service.get_state_summary(state_id=s_id)
    assert demo.total_districts == state["districts"], f"{name}: Expected {state['districts']} districts, got {demo.total_districts}"
    print(f"  [PASS] Demographics: {demo.total_districts} districts, {demo.total_population:,} population")
    
    # 2. GIS
    dist_geojson = gis_service.get_districts_geojson(state_id=s_id)
    assert len(dist_geojson.get("features", [])) == state["districts"], f"{name}: Districts GeoJSON feature mismatch"
    unit_geojson = gis_service.get_mandals_geojson(state_id=s_id)
    assert len(unit_geojson.get("features", [])) > 0, f"{name}: Mandals GeoJSON empty"
    print(f"  [PASS] GIS: {len(dist_geojson['features'])} district polygons, {len(unit_geojson['features'])} unit polygons")
    
    # 3. Hazard
    haz = hazard_service.get_summary(state_id=s_id)
    assert haz.total_mandals == state["units"], f"{name}: Expected {state['units']} hazard units, got {haz.total_mandals}"
    assert haz.storm_surge_included == state["surge"], f"{name}: Surge mismatch"
    print(f"  [PASS] Hazard: {haz.total_mandals} units, surge_included={haz.storm_surge_included}")
    
    # 4. Vulnerability
    vuln = vulnerability_service.get_summary(state_id=s_id)
    assert vuln.total_mandals == state["units"], f"{name}: Expected {state['units']} vuln units, got {vuln.total_mandals}"
    print(f"  [PASS] Vulnerability: {vuln.total_mandals} units evaluated")
    
    # 5. Capacity
    cap = capacity_service.get_summary(state_id=s_id)
    assert cap.total_mandals == state["units"], f"{name}: Expected {state['units']} cap units, got {cap.total_mandals}"
    print(f"  [PASS] Capacity: {cap.total_mandals} units, {cap.total_designated_shelters} shelters")
    
    # 6. Relocation
    reloc = relocation_service.get_summary(state_id=s_id)
    assert reloc.total_mandals == state["units"], f"{name}: Expected {state['units']} reloc units, got {reloc.total_mandals}"
    assert reloc.total_mandals_ranked == state["ranked"], f"{name}: Expected {state['ranked']} ranked units, got {reloc.total_mandals_ranked}"
    print(f"  [PASS] Relocation Prioritization: {reloc.total_mandals_ranked} ranked units (AHP CR={reloc.ahp_consistency_ratio})")
    
    # 7. Simulation
    sim = simulation_service.run_simulation(SimulationParameters(hazard_change=0.10), state_id=s_id)
    assert sim.summary.total_mandals == state["units"], f"{name}: Simulation unit count mismatch"
    print(f"  [PASS] Simulation: Sensitivity run successful across {sim.summary.total_mandals_ranked} units")
    
    # 8. Decision
    dec = decision_service.get_action_dashboard_summary(state_id=s_id)
    assert dec.total_mandals == state["units"], f"{name}: Decision total units mismatch"
    print(f"  [PASS] Decision Dashboard: {len(dec.top_action_mandals)} top action units, {dec.candidate_host_zones_count} candidate hosts")

if __name__ == "__main__":
    print("=================================================================")
    print("RUNNING MULTI-STATE ARCHITECTURAL PARITY SUITE (AP + TN + TR)")
    print("=================================================================")
    for st in STATES:
        verify_state(st)
    print("\n=================================================================")
    print("ALL STATES (ANDHRA PRADESH, TAMIL NADU, TRIPURA) PASSED 100%!")
    print("=================================================================")
