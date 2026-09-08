#!/usr/bin/env python3
"""
Sahayata (SIH26191) - Tamil Nadu Village Public Facility Inventory Compilation Pipeline
Author: Antigravity Implementation Engineer
Date: September 2026

Compiles authoritative public facilities across Tamil Nadu from verified national
geospatial packages (UN OCHA / HOT OSM / OpenStreetMap India infrastructure catalog)
and spatially joins them with official Survey of India Census village polygons
(data/processed/gis/villages/tn_villages.gpkg).
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import pandas as pd
import geopandas as gpd
import pyogrio
from shapely.geometry import Point

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_GIS_DIR = DATA_DIR / "raw" / "gis"
VILLAGES_GPKG = DATA_DIR / "processed" / "gis" / "villages" / "tn_villages.gpkg"
OUT_DIR = DATA_DIR / "processed" / "gis" / "village_facilities"

TN_BBOX = (76.15, 8.05, 80.35, 13.55)

def classify_education(row: pd.Series) -> Tuple[str, str, str, str, Optional[int], str]:
    raw_name = str(row.get("name") or row.get("name_en") or "").strip()
    amenity = str(row.get("amenity") or "").lower()
    op_type = str(row.get("operator_type") or "").lower()
    
    if amenity in ["college", "university"] or any(k in raw_name.lower() for k in ["college", "polytechnic", "university"]):
        f_type = "COLLEGE"
    else:
        f_type = "SCHOOL"

    if not raw_name or raw_name == "nan":
        f_name = "Government / Public College" if f_type == "COLLEGE" else "Public / Panchayat School Facility"
    else:
        f_name = raw_name

    is_public = (
        op_type in ["government", "public", "state"] or
        any(k in f_name.lower() for k in ["govt", "government", "panchayat", "ghss", "pups", "pums", "adi dravidar", "corporation school"])
    )
    gov_status = "GOVERNMENT_PUBLIC" if is_public else "PUBLIC_CIVIC"
    suitability = "HIGH" if is_public else ("MEDIUM" if raw_name and raw_name != "nan" else "LOW")

    return f_type, f_name, gov_status, suitability, None, "UNRECORDED"

def classify_health(row: pd.Series) -> Tuple[str, str, str, str, Optional[int], str]:
    raw_name = str(row.get("name") or row.get("name_en") or "").strip()
    amenity = str(row.get("amenity") or "").lower()
    h_type = str(row.get("healthcare") or "").lower()
    op_type = str(row.get("operator_type") or "").lower()

    if amenity == "pharmacy":
        return "PHARMACY", raw_name or "Local Pharmacy", "PRIVATE_COMMERCIAL", "LOW", None, "UNRECORDED"

    if any(k in raw_name.lower() for k in ["primary health", "phc", "hsc", "sub centre", "health sub centre", "sub-centre"]):
        f_type = "PHC"
    elif amenity in ["clinic", "doctors"] or "clinic" in raw_name.lower() or "dispensary" in raw_name.lower():
        f_type = "CLINIC"
    else:
        f_type = "HOSPITAL"

    if not raw_name or raw_name == "nan":
        f_name = "Primary Health Centre (PHC)" if f_type == "PHC" else "Hospital Facility"
    else:
        f_name = raw_name

    is_public = (
        op_type in ["government", "public", "state"] or
        any(k in f_name.lower() for k in ["govt", "government", "phc", "gh", "taluk hospital", "headquarters hospital"])
    )
    gov_status = "GOVERNMENT_PUBLIC" if is_public else "PUBLIC_CIVIC"
    suitability = "HIGH" if (is_public and f_type in ["HOSPITAL", "PHC"]) else "MEDIUM"

    return f_type, f_name, gov_status, suitability, None, "UNRECORDED"

def classify_poi(row: pd.Series) -> Optional[Tuple[str, str, str, str, Optional[int], str]]:
    raw_name = str(row.get("name") or row.get("name_en") or "").strip()
    other_tags = str(row.get("other_tags") or "").lower()

    if "community_centre" in other_tags or "community_hall" in other_tags or "kalyana mandapam" in raw_name.lower():
        f_type = "COMMUNITY_HALL"
        f_name = raw_name if raw_name and raw_name != "nan" else "Community Hall / Function Facility"
        return f_type, f_name, "PUBLIC_CIVIC", "HIGH", None, "UNRECORDED"

    if any(k in other_tags for k in ["townhall", "public_building"]) or any(k in raw_name.lower() for k in ["panchayat", "taluk office", "collectorate", "bdo office"]):
        f_type = "GOVERNMENT_BUILDING"
        f_name = raw_name if raw_name and raw_name != "nan" else "Civic / Government Office"
        return f_type, f_name, "GOVERNMENT_PUBLIC", "HIGH", None, "UNRECORDED"

    if "cyclone_shelter" in other_tags or "shelter" in other_tags or "relief camp" in raw_name.lower() or "disaster shelter" in raw_name.lower():
        f_type = "SHELTER"
        f_name = raw_name if raw_name and raw_name != "nan" else "Multipurpose Disaster Shelter"
        return f_type, f_name, "GOVERNMENT_PUBLIC", "HIGH", None, "UNRECORDED"

    return None

def compile_facilities():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    t0 = time.time()

    print(f"Loading Tamil Nadu village polygons from {VILLAGES_GPKG}...")
    gdf_villages = pyogrio.read_dataframe(VILLAGES_GPKG)
    print(f"Loaded {len(gdf_villages)} village polygons. Native CRS: {gdf_villages.crs}")

    # Prepare villages in EPSG:4326 for fast spatial join with facility points
    gdf_villages_4326 = gdf_villages[["village_code", "village_name", "mandal_code", "mandal_name", "current_district_code", "current_district_name", "geometry"]].to_crs("EPSG:4326")

    all_fac_records = []

    # 1. Education
    edu_path = RAW_GIS_DIR / "education_facilities.gpkg"
    if edu_path.exists():
        print(f"Reading Education facilities within TN bounding box {TN_BBOX}...")
        gdf_edu = pyogrio.read_dataframe(edu_path, bbox=TN_BBOX)
        print(f"Found {len(gdf_edu)} education facilities in TN bbox.")
        for idx, row in gdf_edu.iterrows():
            f_type, f_name, gov_stat, suit, cap, cap_stat = classify_education(row)
            geom = row.geometry
            pt = geom.centroid if geom.geom_type != "Point" else geom
            all_fac_records.append({
                "facility_type": f_type,
                "facility_name": f_name,
                "government_status": gov_stat,
                "shelter_suitability": suit,
                "capacity_persons": cap,
                "capacity_status": cap_stat,
                "source_layer": "osm_education",
                "latitude": round(pt.y, 6),
                "longitude": round(pt.x, 6),
                "geometry": pt,
            })

    # 2. Health
    health_path = RAW_GIS_DIR / "health_facilities.gpkg"
    if health_path.exists():
        print(f"Reading Health facilities within TN bounding box {TN_BBOX}...")
        gdf_health = pyogrio.read_dataframe(health_path, bbox=TN_BBOX)
        print(f"Found {len(gdf_health)} health facilities in TN bbox.")
        for idx, row in gdf_health.iterrows():
            f_type, f_name, gov_stat, suit, cap, cap_stat = classify_health(row)
            geom = row.geometry
            pt = geom.centroid if geom.geom_type != "Point" else geom
            all_fac_records.append({
                "facility_type": f_type,
                "facility_name": f_name,
                "government_status": gov_stat,
                "shelter_suitability": suit,
                "capacity_persons": cap,
                "capacity_status": cap_stat,
                "source_layer": "osm_health",
                "latitude": round(pt.y, 6),
                "longitude": round(pt.x, 6),
                "geometry": pt,
            })

    # 3. POIs
    poi_path = RAW_GIS_DIR / "points_of_interest.gpkg"
    if poi_path.exists():
        print(f"Reading POIs within TN bounding box {TN_BBOX}...")
        gdf_poi = pyogrio.read_dataframe(poi_path, bbox=TN_BBOX)
        print(f"Found {len(gdf_poi)} POIs in TN bbox.")
        for idx, row in gdf_poi.iterrows():
            res = classify_poi(row)
            if res is not None:
                f_type, f_name, gov_stat, suit, cap, cap_stat = res
                geom = row.geometry
                pt = geom.centroid if geom.geom_type != "Point" else geom
                all_fac_records.append({
                    "facility_type": f_type,
                    "facility_name": f_name,
                    "government_status": gov_stat,
                    "shelter_suitability": suit,
                    "capacity_persons": cap,
                    "capacity_status": cap_stat,
                    "source_layer": "osm_poi",
                    "latitude": round(pt.y, 6),
                    "longitude": round(pt.x, 6),
                    "geometry": pt,
                })

    gdf_all_fac = gpd.GeoDataFrame(all_fac_records, crs="EPSG:4326")
    print(f"Total candidate facility features collected: {len(gdf_all_fac)}")

    print("Performing spatial join with official Tamil Nadu village boundaries...")
    joined = gpd.sjoin(gdf_all_fac, gdf_villages_4326, how="inner", predicate="within")
    print(f"Spatially assigned {len(joined)} facilities to village polygons.")

    joined["facility_id"] = [f"TN_FAC_{i+1:06d}" for i in range(len(joined))]

    out_cols = [
        "facility_id", "village_code", "village_name", "mandal_code", "mandal_name",
        "current_district_code", "current_district_name", "facility_type", "facility_name",
        "government_status", "shelter_suitability", "capacity_persons", "capacity_status",
        "source_layer", "latitude", "longitude"
    ]
    df_out = joined[out_cols].copy()

    out_csv = OUT_DIR / "tn_village_facilities.csv"
    df_out.to_csv(out_csv, index=False)
    print(f"Saved {len(df_out)} facilities to {out_csv} ({os.path.getsize(out_csv)} bytes).")
    print(f"Facilities breakdown by type:\n{df_out['facility_type'].value_counts()}")
    print(f"Elapsed time: {time.time() - t0:.1f}s")

if __name__ == "__main__":
    compile_facilities()
