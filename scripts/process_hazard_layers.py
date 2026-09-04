#!/usr/bin/env python3
"""
Sahayata (SIH26191) - Phase 2B: Hazard Data Acquisition & Spatial Harmonization
Author: Antigravity Implementation Engineer
Date: September 2026

This script performs reproducible, modular acquisition and harmonization for:
1. Cyclone Hazard: NOAA / WMO IBTrACS Bay of Bengal tracks
2. Wind Hazard: BMTPC / BIS IS 875 (Part 3) 26-district basic wind speeds
3. Flood Recurrence: EC JRC Global Surface Water (30m) water recurrence
4. Topography / Elevation: CGIAR-CSI SRTM seamless 90m elevation
5. Terrain Slope: Geospatially correct slope derivation in India Albers Equal Area (EPSG:7755)

All outputs retain full data provenance, valid geometries, and explicit CRS documentation.
"""

import os
import sys
import json
import zipfile
import urllib.request
from pathlib import Path

import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import shape, box
import rasterio
from rasterio.merge import merge
from rasterio.mask import mask
from rasterio.warp import calculate_default_transform, reproject, Resampling

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Input administrative boundary
AP_DISTRICTS_GEOJSON = PROJECT_ROOT / "data" / "processed" / "admin" / "andhra_pradesh_26_districts.geojson"
AP_MANDALS_GEOJSON = PROJECT_ROOT / "data" / "raw" / "admin" / "AndhraPradesh_Mandals.geojson"

# Raw directories
RAW_HAZARD_DIR = PROJECT_ROOT / "data" / "raw" / "hazard"
RAW_CYCLONE_DIR = RAW_HAZARD_DIR / "cyclone"
RAW_WIND_DIR = RAW_HAZARD_DIR / "wind"
RAW_FLOOD_DIR = RAW_HAZARD_DIR / "flood"
RAW_ELEV_DIR = RAW_HAZARD_DIR / "elevation"

# Processed directories
PROC_HAZARD_DIR = PROJECT_ROOT / "data" / "processed" / "hazard"
PROC_CYCLONE_DIR = PROC_HAZARD_DIR / "cyclone"
PROC_WIND_DIR = PROC_HAZARD_DIR / "wind"
PROC_FLOOD_DIR = PROC_HAZARD_DIR / "flood"
PROC_ELEV_DIR = PROC_HAZARD_DIR / "elevation"
PROC_SLOPE_DIR = PROC_HAZARD_DIR / "slope"

# Authoritative URLs
URLS = {
    "ibtracs_lines_zip": "https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/shapefile/IBTrACS.NI.list.v04r01.lines.zip",
    "gsw_recurrence_70E_20N": "https://storage.googleapis.com/global-surface-water/downloads2021/recurrence/recurrence_70E_20Nv1_4_2021.tif",
    "gsw_recurrence_80E_20N": "https://storage.googleapis.com/global-surface-water/downloads2021/recurrence/recurrence_80E_20Nv1_4_2021.tif",
    "srtm_52_09": "https://srtm.csi.cgiar.org/wp-content/uploads/files/srtm_5x5/TIFF/srtm_52_09.zip",
    "srtm_52_10": "https://srtm.csi.cgiar.org/wp-content/uploads/files/srtm_5x5/TIFF/srtm_52_10.zip",
    "srtm_53_09": "https://srtm.csi.cgiar.org/wp-content/uploads/files/srtm_5x5/TIFF/srtm_53_09.zip",
    "srtm_53_10": "https://srtm.csi.cgiar.org/wp-content/uploads/files/srtm_5x5/TIFF/srtm_53_10.zip",
}

# BMTPC / BIS IS 875 (Part 3: 2015) Basic Wind Speed (Vb in m/s) for AP 26 Districts
BMTPC_WIND_ZONES_AP = [
    {"district_id": "alluri_sitharama_raju", "district_name": "Alluri Sitharama Raju", "basic_wind_speed_m_s": 50.0, "risk_zone": "Zone I - Very High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "anakapalli", "district_name": "Anakapalli", "basic_wind_speed_m_s": 50.0, "risk_zone": "Zone I - Very High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "ananthapuramu", "district_name": "Ananthapuramu", "basic_wind_speed_m_s": 44.0, "risk_zone": "Zone III - Moderate Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "annamayya", "district_name": "Annamayya", "basic_wind_speed_m_s": 47.0, "risk_zone": "Zone II - High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "bapatla", "district_name": "Bapatla", "basic_wind_speed_m_s": 50.0, "risk_zone": "Zone I - Very High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "chittoor", "district_name": "Chittoor", "basic_wind_speed_m_s": 47.0, "risk_zone": "Zone II - High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "dr_b_r_ambedkar_konaseema", "district_name": "Dr. B.R. Ambedkar Konaseema", "basic_wind_speed_m_s": 50.0, "risk_zone": "Zone I - Very High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "east_godavari", "district_name": "East Godavari", "basic_wind_speed_m_s": 50.0, "risk_zone": "Zone I - Very High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "eluru", "district_name": "Eluru", "basic_wind_speed_m_s": 50.0, "risk_zone": "Zone I - Very High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "guntur", "district_name": "Guntur", "basic_wind_speed_m_s": 47.0, "risk_zone": "Zone II - High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "kakinada", "district_name": "Kakinada", "basic_wind_speed_m_s": 50.0, "risk_zone": "Zone I - Very High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "krishna", "district_name": "Krishna", "basic_wind_speed_m_s": 50.0, "risk_zone": "Zone I - Very High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "kurnool", "district_name": "Kurnool", "basic_wind_speed_m_s": 44.0, "risk_zone": "Zone III - Moderate Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "nandyal", "district_name": "Nandyal", "basic_wind_speed_m_s": 47.0, "risk_zone": "Zone II - High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "ntr", "district_name": "NTR", "basic_wind_speed_m_s": 47.0, "risk_zone": "Zone II - High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "palnadu", "district_name": "Palnadu", "basic_wind_speed_m_s": 47.0, "risk_zone": "Zone II - High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "parvathipuram_manyam", "district_name": "Parvathipuram Manyam", "basic_wind_speed_m_s": 50.0, "risk_zone": "Zone I - Very High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "prakasam", "district_name": "Prakasam", "basic_wind_speed_m_s": 50.0, "risk_zone": "Zone I - Very High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "sri_potti_sriramulu_nellore", "district_name": "Sri Potti Sriramulu Nellore", "basic_wind_speed_m_s": 50.0, "risk_zone": "Zone I - Very High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "sri_sathya_sai", "district_name": "Sri Sathya Sai", "basic_wind_speed_m_s": 44.0, "risk_zone": "Zone III - Moderate Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "srikakulam", "district_name": "Srikakulam", "basic_wind_speed_m_s": 50.0, "risk_zone": "Zone I - Very High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "tirupati", "district_name": "Tirupati", "basic_wind_speed_m_s": 50.0, "risk_zone": "Zone I - Very High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "visakhapatnam", "district_name": "Visakhapatnam", "basic_wind_speed_m_s": 50.0, "risk_zone": "Zone I - Very High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "vizianagaram", "district_name": "Vizianagaram", "basic_wind_speed_m_s": 50.0, "risk_zone": "Zone I - Very High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "west_godavari", "district_name": "West Godavari", "basic_wind_speed_m_s": 50.0, "risk_zone": "Zone I - Very High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
    {"district_id": "ysr_kadapa", "district_name": "YSR Kadapa", "basic_wind_speed_m_s": 47.0, "risk_zone": "Zone II - High Damage Risk", "source_standard": "IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas"},
]


def create_directories():
    """Create all required raw and processed hazard directory structures."""
    for d in [
        RAW_CYCLONE_DIR, RAW_WIND_DIR, RAW_FLOOD_DIR, RAW_ELEV_DIR,
        PROC_CYCLONE_DIR, PROC_WIND_DIR, PROC_FLOOD_DIR, PROC_ELEV_DIR, PROC_SLOPE_DIR
    ]:
        d.mkdir(parents=True, exist_ok=True)
    print("Directories initialized.")


def download_file(url: str, dest: Path, min_bytes: int = 1024):
    """Download a remote file if not already present with verified size."""
    if dest.exists() and dest.stat().st_size >= min_bytes:
        print(f"  [Cached] {dest.name} ({dest.stat().st_size / (1024*1024):.2f} MB)")
        return
    print(f"  [Downloading] {url} -> {dest.name} ...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req, timeout=120) as resp, open(dest, "wb") as out_file:
        chunk_size = 1024 * 1024
        while True:
            chunk = resp.read(chunk_size)
            if not chunk:
                break
            out_file.write(chunk)
    print(f"  [Saved] {dest.name} ({dest.stat().st_size / (1024*1024):.2f} MB)")


def process_wind_hazard():
    """Process BMTPC / BIS IS 875 Wind Hazard data and join to 26 AP districts."""
    print("\n--- Processing Wind Hazard Layer ---")
    raw_csv = RAW_WIND_DIR / "bmtpc_is875_wind_zones_ap.csv"
    df_wind = pd.DataFrame(BMTPC_WIND_ZONES_AP)
    df_wind.to_csv(raw_csv, index=False)
    print(f"Raw wind table written: {raw_csv.name} ({len(df_wind)} records)")

    # Join with AP 26 Districts GeoJSON
    gdf_districts = gpd.read_file(AP_DISTRICTS_GEOJSON)
    assert len(gdf_districts) == 26, f"Expected 26 districts, found {len(gdf_districts)}"

    gdf_wind = gdf_districts.merge(df_wind, on=["district_id", "district_name"], how="left")
    assert gdf_wind["basic_wind_speed_m_s"].isna().sum() == 0, "Null basic wind speed detected in join"
    assert len(gdf_wind) == 26, "District count changed after merge"

    # Export Processed GeoJSON and CSV
    proc_geojson = PROC_WIND_DIR / "ap_district_wind_hazard.geojson"
    proc_csv = PROC_WIND_DIR / "ap_district_wind_hazard.csv"
    gdf_wind.to_file(proc_geojson, driver="GeoJSON")
    gdf_wind.drop(columns=["geometry"]).to_csv(proc_csv, index=False)

    print(f"Processed wind GeoJSON written: {proc_geojson.name}")
    print(f"Processed wind CSV written: {proc_csv.name}")
    return gdf_wind


def process_cyclone_hazard():
    """Download, inspect, filter, and harmonize NOAA IBTrACS Bay of Bengal tracks."""
    print("\n--- Processing Cyclone Tracks Layer ---")
    raw_zip = RAW_CYCLONE_DIR / "IBTrACS.NI.list.v04r01.lines.zip"
    download_file(URLS["ibtracs_lines_zip"], raw_zip, min_bytes=100000)

    # Extract shapefile
    extract_dir = RAW_CYCLONE_DIR / "lines_extracted"
    extract_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(raw_zip, "r") as z:
        z.extractall(extract_dir)

    shp_files = list(extract_dir.glob("*.shp"))
    assert len(shp_files) > 0, "No shapefile found in extracted zip"
    shp_path = shp_files[0]
    print(f"Reading IBTrACS raw shapefile: {shp_path.name}")

    gdf_all = gpd.read_file(shp_path)
    print(f"Total North Indian Ocean tracks: {len(gdf_all)} features")

    # Load AP boundary to create a coastal relevance bounding zone
    gdf_districts = gpd.read_file(AP_DISTRICTS_GEOJSON)
    ap_total_geom = gdf_districts.union_all()

    # Reproject AP boundary to India Albers Equal Area (EPSG:7755) to compute a precise 150 km buffer
    gdf_ap_proj = gpd.GeoDataFrame(geometry=[ap_total_geom], crs="EPSG:4326").to_crs("EPSG:7755")
    ap_buffer_150km_proj = gdf_ap_proj.geometry.buffer(150000).iloc[0]  # 150 km buffer in meters
    ap_buffer_150km = gpd.GeoDataFrame(geometry=[ap_buffer_150km_proj], crs="EPSG:7755").to_crs("EPSG:4326").geometry.iloc[0]

    # Filter to tracks intersecting the 150 km Andhra Pradesh impact zone
    gdf_filtered = gdf_all[gdf_all.geometry.intersects(ap_buffer_150km)].copy()
    print(f"Filtered tracks within 150 km of AP: {len(gdf_filtered)} features")

    # Add explicit AP coastal landfall/intersection flag
    gdf_filtered["intersects_ap_land"] = gdf_filtered.geometry.intersects(ap_total_geom)
    land_crossers = gdf_filtered["intersects_ap_land"].sum()
    print(f"Tracks making direct landfall or crossing AP land: {land_crossers}")

    # Export Processed GeoJSON
    proc_geojson = PROC_CYCLONE_DIR / "ap_bay_of_bengal_tracks.geojson"
    gdf_filtered.to_file(proc_geojson, driver="GeoJSON")
    print(f"Processed AP cyclone tracks written: {proc_geojson.name}")

    # Save summary CSV
    summary_df = gdf_filtered.drop(columns=["geometry"])
    summary_csv = PROC_CYCLONE_DIR / "ap_cyclone_events_summary.csv"
    summary_df.to_csv(summary_csv, index=False)
    print(f"Cyclone events summary CSV written: {summary_csv.name}")

    return gdf_filtered


def process_flood_hazard():
    """Download, inspect, mosaic, and clip EC JRC Global Surface Water 30m Water Recurrence (20N tiles covering 10-20N)."""
    print("\n--- Processing Flood Recurrence Layer ---")
    tile_70 = RAW_FLOOD_DIR / "recurrence_70E_20Nv1_4_2021.tif"
    tile_80 = RAW_FLOOD_DIR / "recurrence_80E_20Nv1_4_2021.tif"

    download_file(URLS["gsw_recurrence_70E_20N"], tile_70, min_bytes=10000000)
    download_file(URLS["gsw_recurrence_80E_20N"], tile_80, min_bytes=10000000)

    # Load AP 26 Districts boundary for clipping
    gdf_districts = gpd.read_file(AP_DISTRICTS_GEOJSON)
    ap_total_geom = gdf_districts.union_all()
    ap_geom = [ap_total_geom]

    # Merge tiles with bounding box crop
    print("Mosaicing JRC Water Recurrence tiles...")
    src_files_to_mosaic = [rasterio.open(tile_70), rasterio.open(tile_80)]
    
    # Clip directly during merge using bounds of AP
    ap_bounds = gdf_districts.total_bounds  # [minx, miny, maxx, maxy]
    print(f"AP Total Bounds: {ap_bounds}")
    
    mosaic_data, out_trans = merge(src_files_to_mosaic, bounds=tuple(ap_bounds))
    out_meta = src_files_to_mosaic[0].meta.copy()
    out_meta.update({
        "driver": "GTiff",
        "height": mosaic_data.shape[1],
        "width": mosaic_data.shape[2],
        "transform": out_trans,
        "compress": "deflate",
        "nodata": 255
    })
    for s in src_files_to_mosaic:
        s.close()

    temp_mosaic = RAW_FLOOD_DIR / "temp_gsw_mosaic.tif"
    with rasterio.open(temp_mosaic, "w", **out_meta) as dest:
        dest.write(mosaic_data)

    print("Clipping flood recurrence raster precisely to Andhra Pradesh boundary polygon...")
    with rasterio.open(temp_mosaic) as src:
        out_image, out_transform = mask(src, ap_geom, crop=True, nodata=255)
        out_meta_clipped = src.meta.copy()
        out_meta_clipped.update({
            "driver": "GTiff",
            "height": out_image.shape[1],
            "width": out_image.shape[2],
            "transform": out_transform,
            "nodata": 255,
            "compress": "deflate",
            "tiled": True,
            "blockxsize": 256,
            "blockysize": 256
        })

    proc_tif = PROC_FLOOD_DIR / "ap_water_recurrence.tif"
    with rasterio.open(proc_tif, "w", **out_meta_clipped) as dest:
        dest.write(out_image)
        dest.update_tags(
            title="Andhra Pradesh Surface Water Recurrence (1984-2021)",
            source="EC JRC / Google Global Surface Water v1.4",
            resolution="30m (approx 0.0002778 deg)",
            crs="EPSG:4326",
            description="Observed surface-water occurrence/recurrence during 1984-2021 used as flood exposure proxy. Not a real-time flood forecast.",
            nodata="255",
            valid_range="0 to 100 percent"
        )

    if temp_mosaic.exists():
        temp_mosaic.unlink()

    print(f"Processed AP flood recurrence raster written: {proc_tif.name} ({proc_tif.stat().st_size / (1024*1024):.2f} MB)")
    print(f"  Dimensions: {out_image.shape[2]} x {out_image.shape[1]}, Bands: {out_image.shape[0]}")
    return proc_tif


def process_elevation_and_slope():
    """Download, inspect, mosaic, clip CGIAR SRTM 90m DEM, and derive terrain slope."""
    print("\n--- Processing Elevation & Terrain Slope Layers ---")
    raw_tifs = []
    for key in ["srtm_52_09", "srtm_52_10", "srtm_53_09", "srtm_53_10"]:
        zip_path = RAW_ELEV_DIR / f"{key}.zip"
        download_file(URLS[key], zip_path, min_bytes=500000)
        with zipfile.ZipFile(zip_path, "r") as z:
            for item in z.namelist():
                if item.endswith(".tif") and not item.startswith("__"):
                    extracted = RAW_ELEV_DIR / item
                    if not extracted.exists():
                        z.extract(item, RAW_ELEV_DIR)
                    raw_tifs.append(extracted)

    # De-duplicate
    raw_tifs = list(set(raw_tifs))
    print(f"SRTM tiles extracted: {len(raw_tifs)} files")

    # Load AP boundary
    gdf_districts = gpd.read_file(AP_DISTRICTS_GEOJSON)
    ap_geom = [gdf_districts.union_all()]
    ap_bounds = gdf_districts.total_bounds

    # Mosaic SRTM tiles with bounds crop
    src_files = [rasterio.open(t) for t in raw_tifs]
    mosaic_data, out_trans = merge(src_files, bounds=tuple(ap_bounds))
    out_meta = src_files[0].meta.copy()
    out_meta.update({
        "driver": "GTiff",
        "height": mosaic_data.shape[1],
        "width": mosaic_data.shape[2],
        "transform": out_trans,
        "compress": "deflate",
        "nodata": -32768
    })
    for s in src_files:
        s.close()

    temp_dem = RAW_ELEV_DIR / "temp_dem_mosaic.tif"
    with rasterio.open(temp_dem, "w", **out_meta) as dest:
        dest.write(mosaic_data)

    # Clip to AP polygon in EPSG:4326
    with rasterio.open(temp_dem) as src:
        out_image, out_transform = mask(src, ap_geom, crop=True, nodata=-32768)
        dem_meta = src.meta.copy()
        dem_meta.update({
            "driver": "GTiff",
            "height": out_image.shape[1],
            "width": out_image.shape[2],
            "transform": out_transform,
            "nodata": -32768,
            "compress": "deflate",
            "tiled": True,
            "blockxsize": 256,
            "blockysize": 256
        })

    proc_dem_tif = PROC_ELEV_DIR / "ap_dem_90m.tif"
    with rasterio.open(proc_dem_tif, "w", **dem_meta) as dest:
        dest.write(out_image)
        dest.update_tags(
            title="Andhra Pradesh Digital Elevation Model (SRTM 90m)",
            source="CGIAR-CSI SRTM v4.1 / NASA",
            resolution="90m (approx 0.0008333 deg)",
            crs="EPSG:4326",
            vertical_units="meters above MSL",
            nodata="-32768"
        )

    if temp_dem.exists():
        temp_dem.unlink()

    print(f"Processed AP DEM written: {proc_dem_tif.name} ({proc_dem_tif.stat().st_size / (1024*1024):.2f} MB)")

    # -------------------------------------------------------------------------
    # Derive Slope in Degrees using Geospatially Correct Method (EPSG:7755)
    # -------------------------------------------------------------------------
    print("Deriving terrain slope using India Albers Equal Area (EPSG:7755)...")
    # Reproject DEM to EPSG:7755 so horizontal units are metric (meters), matching elevation in meters
    dst_crs = "EPSG:7755"
    with rasterio.open(proc_dem_tif) as src:
        transform, width, height = calculate_default_transform(
            src.crs, dst_crs, src.width, src.height, *src.bounds, resolution=90.0
        )
        kwargs = src.meta.copy()
        kwargs.update({
            "crs": dst_crs,
            "transform": transform,
            "width": width,
            "height": height,
            "nodata": -32768
        })

        dem_proj = np.empty((height, width), dtype=np.float32)
        reproject(
            source=rasterio.band(src, 1),
            destination=dem_proj,
            src_transform=src.transform,
            src_crs=src.crs,
            dst_transform=transform,
            dst_crs=dst_crs,
            resampling=Resampling.bilinear,
            dst_nodata=-32768
        )

    # Compute physical gradient on metric grid: dx = 90m, dy = 90m
    dx = abs(transform[0])  # pixel width in meters
    dy = abs(transform[4])  # pixel height in meters

    valid_mask = (dem_proj != -32768) & (~np.isnan(dem_proj))
    dem_clean = np.where(valid_mask, dem_proj, np.nan)

    # 2nd-order central difference gradient
    grad_y, grad_x = np.gradient(dem_clean, dy, dx)
    slope_rad = np.arctan(np.sqrt(grad_x**2 + grad_y**2))
    slope_deg = np.degrees(slope_rad)
    slope_out = np.where(valid_mask & (~np.isnan(slope_deg)), slope_deg, -9999.0).astype(np.float32)

    kwargs.update({
        "dtype": "float32",
        "nodata": -9999.0,
        "compress": "deflate"
    })

    proc_slope_tif = PROC_SLOPE_DIR / "ap_slope_degrees.tif"
    with rasterio.open(proc_slope_tif, "w", **kwargs) as dest:
        dest.write(slope_out, 1)
        dest.update_tags(
            title="Andhra Pradesh Terrain Slope in Degrees",
            source="Derived from CGIAR-CSI SRTM 90m via central difference gradient",
            horizontal_crs="EPSG:7755 (India Albers Equal Area)",
            horizontal_resolution="90m",
            slope_units="degrees (0 to 90)",
            nodata="-9999.0",
            notes="Calculated using metric grid projection. Used as a localized terrain/landslide constraint, not a probability."
        )

    print(f"Processed AP Slope raster written: {proc_slope_tif.name} ({proc_slope_tif.stat().st_size / (1024*1024):.2f} MB)")
    return proc_dem_tif, proc_slope_tif


def main():
    print("==================================================")
    print("SAHAYATA (SIH26191) - PHASE 2B HAZARD PROCESSING")
    print("==================================================")
    create_directories()

    gdf_wind = process_wind_hazard()
    gdf_cyclone = process_cyclone_hazard()
    proc_flood = process_flood_hazard()
    proc_dem, proc_slope = process_elevation_and_slope()

    print("\n==================================================")
    print("PHASE 2B PROCESSING COMPLETED SUCCESSFULLY")
    print("==================================================")
    print(f"1. Wind Hazard: {len(gdf_wind)} districts processed with BMTPC Vb values.")
    print(f"2. Cyclone Tracks: {len(gdf_cyclone)} Bay of Bengal tracks filtered to AP impact zone.")
    print(f"3. Flood Recurrence: {proc_flood.name} mosaiced and clipped to AP.")
    print(f"4. Digital Elevation Model: {proc_dem.name} clipped to AP.")
    print(f"5. Terrain Slope: {proc_slope.name} derived in EPSG:7755.")


if __name__ == "__main__":
    main()
