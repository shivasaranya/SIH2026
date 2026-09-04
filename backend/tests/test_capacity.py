import pytest
from pathlib import Path
import numpy as np
import pandas as pd
import geopandas as gpd
from fastapi.testclient import TestClient
from main import app

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
CAP_DIR = PROJECT_ROOT / "data" / "processed" / "capacity"
client = TestClient(app)


# ==================== Phase 3B Base Tests ====================

def test_capacity_dataset_integrity():
    """Verify master carrying-capacity components dataset exists with 696 mandals."""
    csv_path = CAP_DIR / "mandal_capacity_components.csv"
    assert csv_path.exists(), "mandal_capacity_components.csv not found"

    df = pd.read_csv(csv_path)
    assert len(df) == 696, f"Expected 696 rows, found {len(df)}"
    assert df["mandal_id"].nunique() == 696, "Duplicate mandal_id found"
    assert df["current_district_id"].isna().sum() == 0, "Missing district IDs"
    assert df["current_district_id"].nunique() == 26, "District count is not 26"


def test_shelter_capacity_invariants():
    """Verify designated shelter capacity invariants and mathematical bounds."""
    csv_path = CAP_DIR / "mandal_capacity_components.csv"
    df = pd.read_csv(csv_path)

    assert (df["shelter_count"] < 0).sum() == 0, "Negative shelter count"
    assert (df["verified_shelter_capacity_persons"] < 0).sum() == 0, "Negative shelter capacity"
    assert (df["shelter_capacity_per_1000"] < 0).sum() == 0, "Negative shelter per 1k"

    has_pop = df["population_total"] > 0
    expected_per_1k = np.where(
        has_pop,
        (df["verified_shelter_capacity_persons"] / df["population_total"] * 1000.0).round(2),
        0.0
    )
    assert np.allclose(df["shelter_capacity_per_1000"], expected_per_1k, atol=1e-1)
    assert df["verified_shelter_capacity_persons"].sum() > 500000


def test_school_space_unavailability():
    """Verify school emergency space proxy is explicitly marked unavailable and not fabricated."""
    csv_path = CAP_DIR / "mandal_capacity_components.csv"
    df = pd.read_csv(csv_path)

    assert df["school_space_capacity_proxy_persons"].isna().all(), "School space capacity must not be fabricated"
    assert (df["school_space_data_status"] == "unavailable_in_open_catalog").all()


def test_health_capacity_bounds():
    """Verify normative health bed baseline and IPHS standard bounds."""
    csv_path = CAP_DIR / "mandal_capacity_components.csv"
    df = pd.read_csv(csv_path)

    assert df["actual_health_beds"].isna().all(), "Actual live beds must not be fabricated"
    assert (df["normative_health_capacity_baseline"] >= 0).all()
    assert (df["health_adequacy_score"] >= 0.0).all()
    assert (df["health_adequacy_score"] <= 1.0).all()
    assert (df["health_capacity_status"] == "normative_iphs_baseline").all()


def test_water_and_sanitation_adequacy():
    """Verify water and sanitation adequacy scores are bounded within [0, 1]."""
    csv_path = CAP_DIR / "mandal_capacity_components.csv"
    df = pd.read_csv(csv_path)

    has_pop = df["population_total"] > 0
    assert (df.loc[has_pop, "water_access_percent"] >= 0.0).all()
    assert (df.loc[has_pop, "water_access_percent"] <= 100.0).all()
    assert (df.loc[has_pop, "sanitation_coverage_percent"] >= 0.0).all()
    assert (df.loc[has_pop, "sanitation_coverage_percent"] <= 100.0).all()
    assert (df["water_sanitation_adequacy"] >= 0.0).all()
    assert (df["water_sanitation_adequacy"] <= 1.0).all()


def test_evacuation_road_density_bounds():
    """Verify road density and accessibility proxy scores are bounded."""
    csv_path = CAP_DIR / "mandal_capacity_components.csv"
    df = pd.read_csv(csv_path)

    assert (df["road_length_km"] >= 0).all()
    assert (df["road_density_km_per_km2"] >= 0).all()
    assert (df["road_accessibility_score"] >= 0.0).all()
    assert (df["road_accessibility_score"] <= 1.0).all()
    assert (df["road_accessibility_status"] == "osm_network_density_proxy").all()


def test_safe_habitable_area_headroom():
    """Verify safe area fraction and headroom bounds and formulas."""
    csv_path = CAP_DIR / "mandal_capacity_components.csv"
    df = pd.read_csv(csv_path)

    assert (df["safe_area_fraction"] >= 0.0).all()
    assert (df["safe_area_fraction"] <= 1.0).all()
    assert (df["safe_area_m2_per_person"] >= 0.0).all()
    assert (df["safe_area_score"] >= 0.0).all()
    assert (df["safe_area_score"] <= 1.0).all()
    assert (df["safe_area_sqkm"] <= df["mandal_area_sqkm"] + 0.01).all()


def test_capacity_geojson_consistency():
    """Verify GeoJSON parity with CSV and valid polygon geometries."""
    geojson_path = CAP_DIR / "ap_mandal_capacity_components.geojson"
    csv_path = CAP_DIR / "mandal_capacity_components.csv"

    assert geojson_path.exists(), "Capacity GeoJSON not found"
    gdf = gpd.read_file(geojson_path)
    df = pd.read_csv(csv_path)

    assert len(gdf) == 696, f"Expected 696 GeoJSON features, got {len(gdf)}"
    assert gdf["geometry"].is_valid.all(), "Invalid geometry in capacity GeoJSON"

    df_sorted = df.sort_values("mandal_id").reset_index(drop=True)
    gdf_sorted = gdf.sort_values("mandal_id").reset_index(drop=True)
    assert np.allclose(df_sorted["safe_area_fraction"], gdf_sorted["safe_area_fraction"])


def test_api_capacity_summary():
    """Test GET /api/capacity/summary."""
    res = client.get("/api/capacity/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 696
    assert data["total_designated_shelters"] > 0
    assert data["total_verified_shelter_capacity_persons"] > 500000
    assert data["mandals_with_designated_shelters"] > 0
    assert len(data["top_shelter_mandals"]) == 5
    assert "shelter_capacity" in data["classification_standards"]


def test_api_capacity_mandals_filter():
    """Test GET /api/capacity/mandals with query filters."""
    res = client.get("/api/capacity/mandals?district_id=srikakulam")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] > 0
    for item in data["items"]:
        assert item["current_district_id"] == "srikakulam"

    res_s = client.get("/api/capacity/mandals?has_shelters=true")
    assert res_s.status_code == 200
    data_s = res_s.json()
    assert data_s["total_mandals"] > 0
    for item in data_s["items"]:
        assert item["shelter_count"] > 0


def test_api_capacity_mandal_detail():
    """Test GET /api/capacity/mandal/{mandal_id}."""
    res = client.get("/api/capacity/mandal/AP_MANDAL_001")
    assert res.status_code == 200
    data = res.json()
    assert data["mandal_id"] == "AP_MANDAL_001"
    assert "verified_shelter_capacity_persons" in data
    assert "safe_area_fraction" in data
    assert "road_density_km_per_km2" in data

    res_404 = client.get("/api/capacity/mandal/NONEXISTENT_MANDAL_999")
    assert res_404.status_code == 404


def test_api_capacity_geojson():
    """Test GET /api/capacity/geojson."""
    res = client.get("/api/capacity/geojson")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 696


# ==================== Phase 3C Adequacy & Bottleneck Tests ====================

def test_adequacy_dataset_integrity():
    """Verify mandal_capacity_adequacy.csv integrity and required fields."""
    csv_path = CAP_DIR / "mandal_capacity_adequacy.csv"
    assert csv_path.exists(), "mandal_capacity_adequacy.csv not found"

    df = pd.read_csv(csv_path)
    assert len(df) == 696
    assert df["mandal_id"].nunique() == 696

    # Verify coverage ratio and deficit math
    has_pop = df["population_total"] > 0
    expected_ratio = np.where(
        has_pop,
        (df["verified_shelter_capacity_persons"] / df["population_total"]).round(4),
        0.0
    )
    assert np.allclose(df["shelter_coverage_ratio"], expected_ratio, atol=1e-3)

    expected_deficit = np.where(
        has_pop,
        np.maximum(0, df["population_total"] - df["verified_shelter_capacity_persons"]),
        0
    )
    assert np.array_equal(df["shelter_deficit_persons"], expected_deficit)


def test_bottleneck_identification_logic():
    """Verify physical bottleneck identification logic and missing data handling."""
    csv_path = CAP_DIR / "mandal_bottlenecks.csv"
    assert csv_path.exists(), "mandal_bottlenecks.csv not found"

    df = pd.read_csv(csv_path)
    assert len(df) == 696

    valid_conditions = {"CAPACITY-ADEQUATE", "CAPACITY-CONSTRAINED", "CAPACITY-SEVERELY-CONSTRAINED", "INSUFFICIENT-DATA"}
    assert set(df["capacity_condition"].unique()).issubset(valid_conditions)

    valid_bottlenecks = {"health_infrastructure", "shelter_capacity", "road_accessibility", "water_sanitation", "safe_habitable_area", "NO POPULATION"}
    assert set(df["primary_bottleneck"].unique()).issubset(valid_bottlenecks)

    # Mandals with 0 shelters should NOT have NaN in primary_bottleneck (missing shelter should not break engine)
    assert df["primary_bottleneck"].isna().sum() == 0


def test_host_zone_candidates():
    """Verify candidate host zone screening and EPSG:7755 geodesic distance."""
    csv_path = CAP_DIR / "host_zone_candidates.csv"
    assert csv_path.exists(), "host_zone_candidates.csv not found"

    df = pd.read_csv(csv_path)
    assert len(df) > 0

    # Distances must be positive and within Andhra Pradesh geographic span (< 1000 km)
    assert (df["distance_km"] > 0).all()
    assert (df["distance_km"] <= 1000.0).all()

    # Self-matching check (source != candidate)
    assert (df["source_mandal_id"] != df["candidate_mandal_id"]).all()

    # Candidate status banner
    assert (df["host_candidate_status"] == "CANDIDATE HOST ZONE — HUMAN REVIEW REQUIRED").all()



def test_api_capacity_adequacy_summary():
    """Test GET /api/capacity/adequacy/summary."""
    res = client.get("/api/capacity/adequacy/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 696
    assert "CAPACITY-SEVERELY-CONSTRAINED" in data["condition_breakdown"]
    assert "primary_bottleneck_breakdown" in data
    assert data["host_zone_candidates_pool_count"] > 0
    assert data["mean_data_completeness"] >= 0.80


def test_api_capacity_adequacy_mandals():
    """Test GET /api/capacity/adequacy/mandals with condition filter."""
    res = client.get("/api/capacity/adequacy/mandals?capacity_condition=CAPACITY-SEVERELY-CONSTRAINED")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] > 0
    for item in data["items"]:
        assert item["capacity_condition"] == "CAPACITY-SEVERELY-CONSTRAINED"


def test_api_capacity_bottlenecks():
    """Test GET /api/capacity/bottlenecks."""
    res = client.get("/api/capacity/bottlenecks")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 696
    assert len(data["items"]) == 696
    first = data["items"][0]
    assert "primary_bottleneck" in first
    assert "secondary_bottleneck" in first


def test_api_capacity_host_zones():
    """Test GET /api/capacity/host-zones/{mandal_id}."""
    res = client.get("/api/capacity/host-zones/AP_MANDAL_001")
    assert res.status_code == 200
    data = res.json()
    assert data["source_mandal_id"] == "AP_MANDAL_001"
    assert "candidates" in data
    assert len(data["candidates"]) > 0
    for cand in data["candidates"]:
        assert cand["distance_km"] > 0
        assert cand["host_candidate_status"] == "CANDIDATE HOST ZONE — HUMAN REVIEW REQUIRED"
