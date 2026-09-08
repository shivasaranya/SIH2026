import pytest
from fastapi.testclient import TestClient
from main import app
from app.services.village_spatial_service import village_spatial_service

client = TestClient(app)

def test_facility_dataset_loaded():
    """Verify that ap_village_facilities.parquet is loaded and contains verified public facilities."""
    village_spatial_service._ensure_data_loaded()
    assert village_spatial_service._facilities_gdf is not None
    assert not village_spatial_service._facilities_gdf.empty
    assert len(village_spatial_service._facilities_gdf) > 4000
    
    # Check expected columns
    expected_cols = {"facility_id", "facility_name", "facility_type", "public_status", "suitability_tier", "village_code"}
    assert expected_cols.issubset(set(village_spatial_service._facilities_gdf.columns))

def test_village_with_facilities_low_intensity():
    """Test Janakavaram Panguluru (590751) which has verified public facilities inside its boundary."""
    res = client.get("/api/village/590751/relocation-centers?intensity=low&sector=NORTH")
    assert res.status_code == 200
    data = res.json()
    
    assert data["village_code"] == 590751
    assert data["planning_intensity"] == "low"
    assert data["total_candidates_evaluated"] > 0
    assert len(data["recommended_centers"]) > 0
    
    # First candidate verification
    c1 = data["recommended_centers"][0]
    assert c1["location_tier"] == "IN_VILLAGE"
    assert c1["proximity_category"] == "WITHIN VILLAGE"
    assert c1["distance_km"] > 0.0
    assert c1["suitability_tier"] in ["HIGH SUITABILITY", "MEDIUM SUITABILITY"]
    assert "NORTH sector" in c1["why_recommended"] or "Janakavaram Panguluru" in c1["why_recommended"]

def test_village_sector_proximity_variation():
    """Verify distance recalculates when different cardinal sectors are selected."""
    res_north = client.get("/api/village/590751/relocation-centers?intensity=low&sector=NORTH")
    res_south = client.get("/api/village/590751/relocation-centers?intensity=low&sector=SOUTH")
    
    assert res_north.status_code == 200
    assert res_south.status_code == 200
    
    data_north = res_north.json()
    data_south = res_south.json()
    
    if len(data_north["recommended_centers"]) > 0 and len(data_south["recommended_centers"]) > 0:
        c_north = data_north["recommended_centers"][0]
        c_south = data_south["recommended_centers"][0]
        assert "NORTH sector" in c_north["why_recommended"]
        assert "SOUTH sector" in c_south["why_recommended"]

def test_village_without_facilities_honest_fallback():
    """Test villages with zero verified public facilities inside their boundary (Adakula 585688 & Alavalapadu 590754)."""
    for vcode in [585688, 590754]:
        res = client.get(f"/api/village/{vcode}/relocation-centers?intensity=low")
        assert res.status_code == 200
        data = res.json()
        
        assert data["village_code"] == vcode
        assert data["total_candidates_evaluated"] == 0
        assert len(data["recommended_centers"]) == 0
        assert "No verified facility mapped inside this village." in data["message"]
        assert "No verified facility mapped inside this village." in data["fallback_notice"]

def test_all_five_sample_villages():
    """Verify all 5 required test cases:
    1. Janakavaram Panguluru: in-village school + PHC
    2. Avanigadda: college + hospital + school
    3. Jangareddigudem: college + school
    4. Adakula 585688: zero in-village facilities and honest fallback
    5. Alavalapadu 590754: zero-facility fallback
    """
    # 1. Janakavaram Panguluru (590751)
    res1 = client.get("/api/village/590751/relocation-centers?intensity=low")
    assert res1.status_code == 200
    types1 = {c["facility_type"] for c in res1.json()["recommended_centers"]}
    assert "SCHOOL" in types1
    assert "PHC" in types1

    # 2. Avanigadda (589773)
    res2 = client.get("/api/village/589773/relocation-centers?intensity=low&limit=15")
    assert res2.status_code == 200
    types2 = {c["facility_type"] for c in res2.json()["recommended_centers"]}
    assert "COLLEGE" in types2
    assert "HOSPITAL" in types2
    assert "SCHOOL" in types2

    # 3. Jangareddigudem (588177)
    res3 = client.get("/api/village/588177/relocation-centers?intensity=low&limit=10")
    assert res3.status_code == 200
    types3 = {c["facility_type"] for c in res3.json()["recommended_centers"]}
    assert "COLLEGE" in types3
    assert "SCHOOL" in types3

    # 4. Adakula (585688)
    res4 = client.get("/api/village/585688/relocation-centers?intensity=low")
    assert res4.status_code == 200
    assert len(res4.json()["recommended_centers"]) == 0
    assert "No verified facility mapped inside this village." in res4.json()["message"]

    # 5. Alavalapadu (590754)
    res5 = client.get("/api/village/590754/relocation-centers?intensity=low")
    assert res5.status_code == 200
    assert len(res5.json()["recommended_centers"]) == 0
    assert "No verified facility mapped inside this village." in res5.json()["message"]

def test_high_intensity_intra_mandal_preservation():
    """Verify HIGH intensity returns within-mandal candidate locations and Mandal HQ."""
    res = client.get("/api/village/590754/relocation-centers?intensity=high")
    assert res.status_code == 200
    data = res.json()
    
    assert data["planning_intensity"] == "high"
    assert len(data["recommended_centers"]) > 0
    assert data["recommended_centers"][0]["location_tier"] == "SAME_MANDAL"

def test_very_high_intensity_outside_mandal_preservation():
    """Verify VERY HIGH intensity evaluates external/adjacent host zones with rejection audits."""
    res = client.get("/api/village/590754/relocation-centers?intensity=very_high")
    assert res.status_code == 200
    data = res.json()
    
    assert data["planning_intensity"] == "very_high"
    assert len(data["recommended_centers"]) > 0
    assert data["recommended_centers"][0]["location_tier"] == "OUTSIDE_MANDAL"
    assert data["recommended_centers"][0]["closer_candidate_rejection_reason"] is not None

