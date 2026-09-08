import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services.village_spatial_service import village_spatial_service

test_villages = [
    (590754, "Janakavarampanguluru / Panguluru"),
    (588288, "Unagatla"),
    (581335, "Peddabammidi"),
    (591143, "Alavalapadu"),
]

print("==================================================")
print("TESTING AP VILLAGE FACILITY SERVICE INTEGRATION")
print("==================================================")

for vcode, label in test_villages:
    print(f"\n--- Testing Village {vcode} ({label}) ---")
    
    # 1. LOW INTENSITY (Within Village)
    resp_low = village_spatial_service.get_relocation_centers(vcode, intensity="low", sector="NORTH")
    print(f"LOW INTENSITY (NORTH sector): Total evaluated: {resp_low.total_candidates_evaluated}, Message: {resp_low.message}")
    for c in resp_low.recommended_centers[:3]:
        print(f"  #{c.rank} {c.center_name} [{c.suitability_tier}]")
        print(f"     Type: {c.facility_type} | Dist: {c.distance_km} km | Cap: {c.capacity_condition}")
        print(f"     Why: {c.why_recommended}")
        if c.closer_candidate_rejection_reason:
            print(f"     Rejection Note: {c.closer_candidate_rejection_reason}")

    # 2. Test Different Sector (e.g. SOUTH)
    resp_low_south = village_spatial_service.get_relocation_centers(vcode, intensity="low", sector="SOUTH")
    print(f"LOW INTENSITY (SOUTH sector):")
    for c in resp_low_south.recommended_centers[:2]:
        print(f"  #{c.rank} {c.center_name} -> Dist: {c.distance_km} km from SOUTH sector")

    # 3. HIGH INTENSITY (Within Mandal)
    resp_high = village_spatial_service.get_relocation_centers(vcode, intensity="high", sector="NORTH")
    print(f"HIGH INTENSITY: Recommended: {len(resp_high.recommended_centers)} centers. #1: {resp_high.recommended_centers[0].center_name if resp_high.recommended_centers else 'None'}")

    # 4. VERY HIGH INTENSITY (Outside Mandal)
    resp_vhigh = village_spatial_service.get_relocation_centers(vcode, intensity="very_high", sector="NORTH")
    print(f"VERY HIGH INTENSITY: Recommended: {len(resp_vhigh.recommended_centers)} centers. #1: {resp_vhigh.recommended_centers[0].center_name if resp_vhigh.recommended_centers else 'None'}")

# Test a village with NO facilities
print("\n--- Testing Village with NO facilities ---")
all_v_with_facs = set(village_spatial_service._facilities_gdf["village_code"].astype(int).unique())
all_v_codes = set(village_spatial_service._villages_gdf["village_code"].astype(int).unique())
empty_v_codes = list(all_v_codes - all_v_with_facs)

if empty_v_codes:
    empty_code = empty_v_codes[0]
    resp_empty = village_spatial_service.get_relocation_centers(empty_code, intensity="low")
    print(f"Village {empty_code} (Zero facilities):")
    print(f"  Message: {resp_empty.message}")
    print(f"  Total evaluated: {resp_empty.total_candidates_evaluated}")
    print(f"  Recommended centers count: {len(resp_empty.recommended_centers)}")
    assert resp_empty.message == "No verified in-village facility available in connected datasets."
    assert len(resp_empty.recommended_centers) == 0
    print("  [PASS] Clean honest fallback verified!")
