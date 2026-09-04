import pytest
from pathlib import Path
import numpy as np
import pandas as pd
import geopandas as gpd
from fastapi.testclient import TestClient
from main import app

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
RELOC_DIR = PROJECT_ROOT / "data" / "processed" / "relocation"
client = TestClient(app)


def test_relocation_dataset_integrity():
    """Verify master relocation prioritization dataset exists with 696 mandals."""
    csv_path = RELOC_DIR / "mandal_relocation_priority.csv"
    assert csv_path.exists(), "mandal_relocation_priority.csv not found"

    df = pd.read_csv(csv_path)
    assert len(df) == 696, f"Expected 696 rows, found {len(df)}"
    assert df["mandal_id"].nunique() == 696, "Duplicate mandal_id found"
    assert df["current_district_id"].isna().sum() == 0, "Missing district IDs"
    assert df["current_district_id"].nunique() == 26, "District count is not 26"


def test_orthogonal_criteria_bounds():
    """Verify all four orthogonal decision criteria are bounded within [0, 1]."""
    csv_path = RELOC_DIR / "mandal_relocation_priority.csv"
    df = pd.read_csv(csv_path)

    for col in ['c1_hazard_exposure', 'c2_demographic_sensitivity', 'c3_capacity_stress', 'c4_accessibility_constraint']:
        assert col in df.columns, f"Missing criterion {col}"
        assert (df[col] >= 0.0).all(), f"Negative values in {col}"
        assert (df[col] <= 1.0).all(), f"Values > 1.0 in {col}"


def test_ahp_weights_and_consistency():
    """Verify AHP weights sum to 1.0 and Consistency Ratio CR < 0.10."""
    ahp_path = RELOC_DIR / "ahp_weights.csv"
    assert ahp_path.exists(), "ahp_weights.csv not found"

    df_ahp = pd.read_csv(ahp_path)
    assert len(df_ahp) == 4
    assert np.isclose(df_ahp["weight"].sum(), 1.0, atol=1e-3)

    # API verification
    res = client.get("/api/relocation/weights")
    assert res.status_code == 200
    data = res.json()
    assert data["consistency_ratio"] < 0.10
    assert "PASS" in data["consistency_status"]


def test_topsis_scores_and_ranking():
    """Verify TOPSIS closeness coefficients are strictly in [0, 1] and ranks are unique."""
    csv_path = RELOC_DIR / "mandal_relocation_priority.csv"
    df = pd.read_csv(csv_path)

    valid = df[df["ranking_status"] != "INSUFFICIENT_DATA"]
    assert len(valid) > 0
    assert (valid["topsis_score"] >= 0.0).all()
    assert (valid["topsis_score"] <= 1.0).all()
    assert (valid["relocation_priority_rank"] > 0).all()
    assert valid["relocation_priority_rank"].nunique() == len(valid)

    # Verify sorting by score descending
    scores = valid["topsis_score"].values
    assert np.all(scores[:-1] >= scores[1:]), "Scores are not sorted descending"


def test_priority_categories_distribution():
    """Verify priority categories are assigned properly across all categories."""
    csv_path = RELOC_DIR / "mandal_relocation_priority.csv"
    df = pd.read_csv(csv_path)

    valid_cats = {"VERY HIGH", "HIGH", "MODERATE", "LOW", "INSUFFICIENT-DATA"}
    assert set(df["relocation_priority_category"].unique()).issubset(valid_cats)

    cat_counts = df["relocation_priority_category"].value_counts().to_dict()
    assert cat_counts.get("VERY HIGH", 0) > 0
    assert cat_counts.get("HIGH", 0) > 0
    assert cat_counts.get("MODERATE", 0) > 0
    assert cat_counts.get("LOW", 0) > 0


def test_factor_contributions_sum():
    """Verify factor contributions sum to ~100% for all ranked mandals."""
    csv_path = RELOC_DIR / "relocation_factor_contributions.csv"
    df = pd.read_csv(csv_path)

    valid = df[df["relocation_priority_category"] != "INSUFFICIENT-DATA"]
    total_contrib = (
        valid["factor_contrib_hazard_pct"] +
        valid["factor_contrib_demographic_pct"] +
        valid["factor_contrib_capacity_pct"] +
        valid["factor_contrib_accessibility_pct"]
    )
    assert np.allclose(total_contrib, 100.0, atol=1.0)


def test_relocation_geojson_parity():
    """Verify GeoJSON layer integrity and attribute parity."""
    geojson_path = RELOC_DIR / "ap_mandal_relocation_priority.geojson"
    assert geojson_path.exists(), "Relocation GeoJSON not found"

    gdf = gpd.read_file(geojson_path)
    assert len(gdf) == 696
    assert gdf["geometry"].is_valid.all()
    assert "topsis_score" in gdf.columns
    assert "relocation_priority_category" in gdf.columns


def test_api_relocation_summary():
    """Test GET /api/relocation/summary."""
    res = client.get("/api/relocation/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 696
    assert data["total_mandals_ranked"] > 650
    assert data["mandals_very_high_priority"] > 0
    assert data["ahp_consistency_ratio"] < 0.10
    assert len(data["top_10_prioritized_mandals"]) == 10


def test_api_relocation_mandals_filter():
    """Test GET /api/relocation/mandals with category and district filters."""
    res = client.get("/api/relocation/mandals?priority_category=VERY HIGH")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] > 0
    for item in data["items"]:
        assert item["relocation_priority_category"] == "VERY HIGH"


def test_api_relocation_top():
    """Test GET /api/relocation/top."""
    res = client.get("/api/relocation/top?limit=5")
    assert res.status_code == 200
    data = res.json()
    assert data["total_returned"] == 5
    assert len(data["items"]) == 5
    # First item must have highest score
    assert data["items"][0]["topsis_score"] >= data["items"][1]["topsis_score"]


def test_api_relocation_mandal_detail():
    """Test GET /api/relocation/mandal/{mandal_id}."""
    res = client.get("/api/relocation/mandal/AP_MANDAL_001")
    assert res.status_code == 200
    data = res.json()
    assert data["mandal_id"] == "AP_MANDAL_001"
    assert "topsis_score" in data
    assert "primary_priority_factor" in data
    assert "priority_explanation" in data


def test_api_relocation_host_zones():
    """Test GET /api/relocation/mandal/{mandal_id}/host-zones."""
    res = client.get("/api/relocation/mandal/AP_MANDAL_001/host-zones")
    assert res.status_code == 200
    data = res.json()
    assert data["source_mandal_id"] == "AP_MANDAL_001"
    assert len(data["candidates"]) > 0
    for cand in data["candidates"]:
        assert cand["distance_km"] > 0
        assert "HUMAN REVIEW REQUIRED" in cand["host_candidate_status"]
