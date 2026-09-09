import pytest
from app.services.village_spatial_service import village_spatial_service

def test_tamil_nadu_village_relocation_state_isolation():
    """Verify that Tamil Nadu village relocation candidates are strictly within Tamil Nadu."""
    tn_village_code = 629683  # Athipattu, Chengalpattu, Tamil Nadu

    for intensity in ["high", "very_high"]:
        res = village_spatial_service.get_relocation_centers(tn_village_code, intensity=intensity)
        assert res is not None, f"Expected response for TN village {tn_village_code} at {intensity}"
        assert res.total_candidates_evaluated > 0, f"Expected evaluated candidates for {intensity}"
        assert len(res.recommended_centers) > 0, f"Expected recommended centers for {intensity}"

        for c in res.recommended_centers:
            # Candidates must be in Tamil Nadu districts, never AP
            ap_districts = {
                "srikakulam", "vizianagaram", "parvathipuram manyam", "alluri sitharama raju",
                "visakhapatnam", "anakapalli", "kakinada", "konaseema", "east godavari",
                "west godavari", "eluru", "krishna", "ntr", "guntur", "bapatla", "palnadu",
                "prakasam", "sri potti sriramulu nellore", "nellore", "kurnool", "nandyal",
                "anantapur", "sri sathya sai", "ysr", "kadapa", "annamayya", "chittoor", "tirupati"
            }
            cand_dist = c.district_name.lower().strip()
            assert cand_dist not in ap_districts, (
                f"State isolation leak: TN village received candidate '{c.center_name}' "
                f"located in AP district '{c.district_name}' ({c.distance_km} km away)"
            )


def test_andhra_pradesh_village_relocation_state_isolation():
    """Verify that Andhra Pradesh village relocation candidates are strictly within Andhra Pradesh."""
    ap_village_code = 597069  # Cheruvu Mundara Khandriga, Chittoor, AP

    for intensity in ["high", "very_high"]:
        res = village_spatial_service.get_relocation_centers(ap_village_code, intensity=intensity)
        assert res is not None, f"Expected response for AP village {ap_village_code} at {intensity}"
        assert res.total_candidates_evaluated > 0, f"Expected evaluated candidates for {intensity}"
        assert len(res.recommended_centers) > 0, f"Expected recommended centers for {intensity}"

        for c in res.recommended_centers:
            # Candidate must not be in TN districts
            tn_districts = {
                "chengalputtu", "chengalpattu", "chennai", "tiruvallur", "kancheepuram",
                "ranipet", "vellore", "tirupathur", "tiruvannamalai", "villupuram",
                "kallakurichi", "cuddalore", "salem", "dharmapuri", "krishnagiri",
                "erode", "tiruppur", "coimbatore", "nilgiris", "dindigul", "karur",
                "tiruchirappalli", "perambalur", "ariyalur", "thanjavur", "tiruvarur",
                "nagapattinam", "mayiladuthurai", "pudukkottai", "sivaganga", "madurai",
                "theni", "virudhunagar", "ramanathapuram", "thoothukkudi", "tirunelveli",
                "tenkasi", "kanniyakumari"
            }
            cand_dist = c.district_name.lower().strip()
            assert cand_dist not in tn_districts, (
                f"State isolation leak: AP village received candidate '{c.center_name}' "
                f"located in TN district '{c.district_name}'"
            )
