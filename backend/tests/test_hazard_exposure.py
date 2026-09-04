import pytest
from pathlib import Path
import pandas as pd
import geopandas as gpd
from fastapi.testclient import TestClient
from main import app

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
EXP_DIR = PROJECT_ROOT / "data" / "processed" / "hazard" / "mandal_exposure"
client = TestClient(app)


def test_mandal_exposure_dataset_integrity():
    """Verify master mandal exposure CSV has exactly 696 records with zero duplicates."""
    csv_path = EXP_DIR / "mandal_multi_hazard_exposure.csv"
    assert csv_path.exists(), "Master mandal exposure CSV not found"

    df = pd.read_csv(csv_path)
    assert len(df) == 696, f"Expected exactly 696 mandal records, got {len(df)}"
    assert df["mandal_id"].nunique() == 696, "Duplicate mandal_id detected"

    # Multi-Hazard Exposure Index H_i bounds
    hi = df["multi_hazard_exposure_index"]
    assert hi.min() >= 0.0, f"Negative H_i detected: {hi.min()}"
    assert hi.max() <= 1.0, f"H_i exceeds 1.0: {hi.max()}"

    # Flood percentage bounds
    assert df["mean_water_recurrence_pct"].min() >= 0.0
    assert df["mean_water_recurrence_pct"].max() <= 100.0
    assert df["pct_area_recurrence_ge_10"].min() >= 0.0
    assert df["pct_area_recurrence_ge_10"].max() <= 100.0

    # Wind speed bounds
    assert df["basic_wind_speed_m_s"].min() >= 44.0
    assert df["basic_wind_speed_m_s"].max() <= 50.0

    # Cyclone metrics
    assert df["cyclone_tracks_50km_count"].min() >= 0
    assert df["distance_to_nearest_track_km"].min() >= 0.0

    # Terrain slope
    assert df["mean_slope_deg"].min() >= 0.0
    assert df["pct_area_slope_gt_25"].min() >= 0.0
    assert df["pct_area_slope_gt_25"].max() <= 100.0


def test_mandal_exposure_individual_csv_files():
    """Verify individual CSV files exist for each hazard domain with 696 records."""
    files = [
        "mandal_flood_exposure.csv",
        "mandal_cyclone_exposure.csv",
        "mandal_wind_exposure.csv",
        "mandal_terrain_exposure.csv",
    ]
    for f in files:
        p = EXP_DIR / f
        assert p.exists(), f"File {f} not found"
        df = pd.read_csv(p)
        assert len(df) == 696, f"Expected 696 rows in {f}, got {len(df)}"
        assert df["mandal_id"].nunique() == 696, f"Duplicate mandal_id in {f}"


def test_mandal_exposure_geojson_integrity():
    """Verify master GeoJSON retains valid geometries and 696 features."""
    geojson_path = EXP_DIR / "ap_mandal_multi_hazard_exposure.geojson"
    assert geojson_path.exists(), "Master GeoJSON not found"

    gdf = gpd.read_file(geojson_path)
    assert len(gdf) == 696, f"Expected 696 features in GeoJSON, got {len(gdf)}"
    assert gdf["mandal_id"].nunique() == 696, "Duplicate mandal_id in GeoJSON"
    assert "multi_hazard_exposure_index" in gdf.columns
    assert gdf["geometry"].is_valid.all(), "Invalid geometries detected in mandal GeoJSON"


def test_api_hazard_summary():
    """Test GET /api/hazard/summary."""
    res = client.get("/api/hazard/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 696
    assert 0.0 <= data["mean_exposure_index"] <= 1.0
    assert len(data["top_exposed_mandals"]) == 5
    assert data["storm_surge_included"] is False


def test_api_hazard_mandals_all():
    """Test GET /api/hazard/mandals."""
    res = client.get("/api/hazard/mandals")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] == 696
    assert len(data["items"]) == 696


def test_api_hazard_mandals_filtered():
    """Test GET /api/hazard/mandals?district_id=tirupati."""
    res = client.get("/api/hazard/mandals?district_id=tirupati")
    assert res.status_code == 200
    data = res.json()
    assert data["total_mandals"] > 0
    for item in data["items"]:
        assert item["current_district_id"] == "tirupati"


def test_api_hazard_mandal_detail():
    """Test GET /api/hazard/mandal/{mandal_id}."""
    res = client.get("/api/hazard/mandal/AP_MANDAL_001")
    assert res.status_code == 200
    data = res.json()
    assert data["mandal_id"] == "AP_MANDAL_001"
    assert "multi_hazard_exposure_index" in data


def test_api_hazard_mandal_not_found():
    """Test GET /api/hazard/mandal/INVALID_ID returns 404."""
    res = client.get("/api/hazard/mandal/INVALID_MANDAL_ID_999")
    assert res.status_code == 404


def test_api_hazard_geojson():
    """Test GET /api/hazard/geojson."""
    res = client.get("/api/hazard/geojson")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 696


def test_mandal_exposure_quality_invariants():
    """Audit invariants: zero nulls, zero infs, strict [0, 1] component bounds, exact formula match."""
    import numpy as np
    csv_path = EXP_DIR / "mandal_multi_hazard_exposure.csv"
    df = pd.read_csv(csv_path)

    # 1. Zero nulls / NaNs
    assert df.isna().sum().sum() == 0, f"Found {df.isna().sum().sum()} null values in CSV"

    # 2. Zero infinities
    num_cols = df.select_dtypes(include=[np.number]).columns
    assert not np.isinf(df[num_cols]).any().any(), "Found infinite values in numeric columns"

    # 3. Component bounds [0, 1]
    for comp in ["flood_exposure_score", "cyclone_exposure_score", "wind_exposure_score", "steep_slope_constraint_score"]:
        assert df[comp].min() >= 0.0, f"{comp} below 0"
        assert df[comp].max() <= 1.0, f"{comp} above 1"

    # 4. Exact formula match: H_i = 0.40*flood + 0.30*cyclone + 0.20*wind + 0.10*slope
    expected_hi = (
        0.40 * df["flood_exposure_score"] +
        0.30 * df["cyclone_exposure_score"] +
        0.20 * df["wind_exposure_score"] +
        0.10 * df["steep_slope_constraint_score"]
    ).round(4)
    assert np.allclose(df["multi_hazard_exposure_index"], expected_hi, atol=1e-4), "H_i deviates from formula"

    # 5. Wind speed values in {44, 47, 50}
    assert set(df["basic_wind_speed_m_s"].unique()).issubset({44.0, 47.0, 50.0})
    expected_wind = ((df["basic_wind_speed_m_s"] - 44.0) / 6.0).round(4)
    assert np.allclose(df["wind_exposure_score"], expected_wind, atol=1e-4)

    # 6. All 26 districts mapped
    assert df["current_district_id"].nunique() == 26
    assert df["current_district_id"].isna().sum() == 0
