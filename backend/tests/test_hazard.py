import pytest
from pathlib import Path
import json
import numpy as np
import geopandas as gpd
try:
    import rasterio
except ImportError:
    rasterio = None

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PROC_HAZARD_DIR = PROJECT_ROOT / "data" / "processed" / "hazard"


def test_wind_hazard_dataset():
    """Verify 26-district BMTPC / BIS IS 875 wind hazard layer."""
    geojson_path = PROC_HAZARD_DIR / "wind" / "ap_district_wind_hazard.geojson"
    csv_path = PROC_HAZARD_DIR / "wind" / "ap_district_wind_hazard.csv"

    assert geojson_path.exists(), "Wind GeoJSON not found"
    assert csv_path.exists(), "Wind CSV not found"

    gdf = gpd.read_file(geojson_path)
    assert len(gdf) == 26, f"Expected exactly 26 districts, got {len(gdf)}"

    required_fields = ["district_id", "district_name", "basic_wind_speed_m_s", "risk_zone"]
    for field in required_fields:
        assert field in gdf.columns, f"Missing required field {field}"

    assert gdf["basic_wind_speed_m_s"].isna().sum() == 0, "Found NaN in basic wind speed"
    assert gdf["basic_wind_speed_m_s"].min() >= 44.0, "Wind speed below physical minimum"
    assert gdf["basic_wind_speed_m_s"].max() <= 50.0, "Wind speed above physical maximum"


def test_cyclone_tracks_dataset():
    """Verify NOAA IBTrACS Bay of Bengal tracks filtered to AP impact zone."""
    geojson_path = PROC_HAZARD_DIR / "cyclone" / "ap_bay_of_bengal_tracks.geojson"
    summary_csv = PROC_HAZARD_DIR / "cyclone" / "ap_cyclone_events_summary.csv"

    assert geojson_path.exists(), "Cyclone GeoJSON not found"
    assert summary_csv.exists(), "Cyclone summary CSV not found"

    gdf = gpd.read_file(geojson_path)
    assert len(gdf) > 1000, f"Expected >1000 cyclone track segments, got {len(gdf)}"
    assert "intersects_ap_land" in gdf.columns, "Missing intersects_ap_land flag"

    land_crossings = gdf["intersects_ap_land"].sum()
    assert land_crossings >= 500, f"Expected >=500 land crossings, got {land_crossings}"

    for geom_type in gdf.geom_type.unique():
        assert geom_type in ["LineString", "MultiLineString"], f"Unexpected geometry type: {geom_type}"


def test_flood_recurrence_raster():
    """Verify EC JRC 30m flood recurrence raster metadata and bounds."""
    if rasterio is None:
        pytest.skip("rasterio not installed in local test environment")

    tif_path = PROC_HAZARD_DIR / "flood" / "ap_water_recurrence.tif"
    if not tif_path.exists():
        pytest.skip("Flood recurrence GeoTIFF not found in local test environment")

    with rasterio.open(tif_path) as src:
        assert str(src.crs).upper() == "EPSG:4326"
        assert src.nodata == 255
        assert src.count == 1
        assert src.width > 20000
        assert src.height > 20000

        # Read small window to verify valid pixel values
        win = rasterio.windows.Window(15000, 15000, 500, 500)
        data = src.read(1, window=win)
        valid = data[data != 255]
        if len(valid) > 0:
            assert valid.min() >= 0
            assert valid.max() <= 100


def test_dem_raster():
    """Verify SRTM 90m DEM raster metadata and physical elevation bounds."""
    if rasterio is None:
        pytest.skip("rasterio not installed in local test environment")

    tif_path = PROC_HAZARD_DIR / "elevation" / "ap_dem_90m.tif"
    if not tif_path.exists():
        pytest.skip("DEM GeoTIFF not found in local test environment")

    with rasterio.open(tif_path) as src:
        assert str(src.crs).upper() == "EPSG:4326"
        assert src.nodata == -32768
        assert src.count == 1

        # Read center window
        win = rasterio.windows.Window(src.width // 2, src.height // 2, 500, 500)
        data = src.read(1, window=win)
        valid = data[data != -32768]
        if len(valid) > 0:
            assert valid.min() >= -100.0, f"Impossible elevation min: {valid.min()}"
            assert valid.max() <= 2000.0, f"Impossible elevation max: {valid.max()}"


def test_slope_raster():
    """Verify terrain slope derived in India Albers Equal Area (EPSG:7755)."""
    if rasterio is None:
        pytest.skip("rasterio not installed in local test environment")

    tif_path = PROC_HAZARD_DIR / "slope" / "ap_slope_degrees.tif"
    if not tif_path.exists():
        pytest.skip("Slope GeoTIFF not found in local test environment")

    with rasterio.open(tif_path) as src:
        assert "7755" in str(src.crs), f"Expected EPSG:7755, got {src.crs}"
        assert src.nodata == -9999.0

        # Verify pixel slope range (0 to 90 degrees)
        win = rasterio.windows.Window(src.width // 2, src.height // 2, 500, 500)
        data = src.read(1, window=win)
        valid = data[(data != -9999.0) & (~np.isnan(data))]
        if len(valid) > 0:
            assert valid.min() >= 0.0, f"Slope < 0 deg: {valid.min()}"
            assert valid.max() <= 90.0, f"Slope > 90 deg: {valid.max()}"
