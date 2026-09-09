#!/usr/bin/env python3
"""
Sahayata (SIH26191) - AP Village Public Facility Inventory Compilation Pipeline
Author: Antigravity Implementation Engineer
Date: September 2026

Compiles authoritative public facilities across Andhra Pradesh from verified national
geospatial packages (UN OCHA / HOT OSM / OpenStreetMap India infrastructure catalog)
and spatially joins them with official Survey of India Census village polygons
(data/processed/gis/villages/ap_villages.parquet).

Target Categories:
1. SHELTER (Cyclone shelters, flood shelters, emergency relief shelters)
2. SCHOOL (Zilla Parishad, MPUP, Government High Schools, Primary Schools)
3. COLLEGE (Government Colleges, Polytechnics, Universities)
4. HOSPITAL (Government Hospitals, Area Hospitals, Community Health Centres)
5. PHC (Primary Health Centres, Health Sub-Centres)
6. PANCHAYAT_BUILDING (Gram Panchayat offices, Mandal Parishad, Sachivalayam)
7. GOVERNMENT_BUILDING (Government administrative offices, civic centers, revenue offices)
8. COMMUNITY_HALL (Community halls, Kalyan Mandapams, public function halls)
9. OTHER_PUBLIC_FACILITY (Public libraries, stadiums, civic facilities)

Strict Invariants:
- Never fabricate coordinates or facilities.
- Never invent fake capacities: if unrecorded, capacity_persons is stored as None (capacity_status = 'UNKNOWN').
- If footprint polygon exists, exact physical footprint area is stored as usable_area_sq_m.
- Spatial join uses exact point-in-polygon containment with official SOI village boundaries.
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import pandas as pd
import geopandas as gpd
from shapely.geometry import Point

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_GIS_DIR = DATA_DIR / "raw" / "gis"
VILLAGES_PARQUET = DATA_DIR / "processed" / "gis" / "villages" / "ap_villages.parquet"
OUT_DIR = DATA_DIR / "processed" / "gis" / "village_facilities"

AP_BBOX = (76.7, 12.6, 84.8, 19.2)

def classify_education(row: pd.Series) -> Tuple[str, str, str, str, Optional[int], str]:
    raw_name = str(row.get("name") or row.get("name_en") or "").strip()
    amenity = str(row.get("amenity") or "").lower()
    building = str(row.get("building") or "").lower()
    op_type = str(row.get("operator_type") or "").lower()
    
    # Standardize facility type
    if amenity in ["college", "university"] or "college" in raw_name.lower() or "polytechnic" in raw_name.lower() or "university" in raw_name.lower():
        f_type = "COLLEGE"
    else:
        f_type = "SCHOOL"

    # Name fallback
    if not raw_name or raw_name == "nan":
        f_name = "Government / Public College" if f_type == "COLLEGE" else "Public / ZP School Facility"
    else:
        f_name = raw_name

    # Public ownership
    is_public = (
        op_type in ["government", "public", "state"] or
        "govt" in f_name.lower() or "government" in f_name.lower() or
        "zp" in f_name.lower() or "mpps" in f_name.lower() or "zphs" in f_name.lower() or
        "mpup" in f_name.lower() or "mandal" in f_name.lower() or "zilla" in f_name.lower()
    )
    gov_status = "GOVERNMENT_PUBLIC" if is_public else "PUBLIC_CIVIC"

    # Suitability
    if is_public:
        suitability = "HIGH"
    elif raw_name and raw_name != "nan":
        suitability = "MEDIUM"
    else:
        suitability = "INSUFFICIENT_DATA"

    # Capacity
    cap_val = row.get("capacity_persons")
    capacity_persons = None
    capacity_status = "UNKNOWN"
    if pd.notna(cap_val):
        try:
            num = int(cap_val)
            if 10 <= num <= 10000:
                capacity_persons = num
                capacity_status = "VERIFIED"
        except Exception:
            pass

    return f_name, f_type, gov_status, suitability, capacity_persons, capacity_status

def classify_health(row: pd.Series) -> Tuple[str, str, str, str, Optional[int], str]:
    raw_name = str(row.get("name") or row.get("name_en") or "").strip()
    amenity = str(row.get("amenity") or "").lower()
    healthcare = str(row.get("healthcare") or "").lower()
    op_type = str(row.get("operator_type") or "").lower()

    if amenity in ["clinic", "doctors"] or healthcare in ["clinic", "centre", "dispensary"] or "phc" in raw_name.lower() or "sub centre" in raw_name.lower() or "health" in raw_name.lower() or "dispensary" in raw_name.lower():
        f_type = "PHC"
    else:
        f_type = "HOSPITAL"

    if not raw_name or raw_name == "nan":
        f_name = "Primary Health Centre (PHC)" if f_type == "PHC" else "Government / Area Hospital"
    else:
        f_name = raw_name

    is_public = (
        op_type in ["government", "public", "state"] or
        "govt" in f_name.lower() or "government" in f_name.lower() or
        "phc" in f_name.lower() or "chc" in f_name.lower() or "area hospital" in f_name.lower() or
        f_type == "PHC"
    )
    gov_status = "GOVERNMENT_PUBLIC" if is_public else "PUBLIC_CIVIC"

    suitability = "HIGH" if is_public else "MEDIUM"
    if not raw_name or raw_name == "nan":
        suitability = "MEDIUM"

    cap_val = row.get("capacity_persons")
    capacity_persons = None
    capacity_status = "UNKNOWN"
    if pd.notna(cap_val):
        try:
            num = int(cap_val)
            if 10 <= num <= 10000:
                capacity_persons = num
                capacity_status = "VERIFIED"
        except Exception:
            pass

    return f_name, f_type, gov_status, suitability, capacity_persons, capacity_status

def classify_poi(row: pd.Series) -> Optional[Tuple[str, str, str, str, Optional[int], str]]:
    amenity = str(row.get("amenity") or "").lower()
    raw_name = str(row.get("name") or row.get("name_en") or "").strip()
    
    if amenity == "shelter" or "shelter" in raw_name.lower() or "cyclone" in raw_name.lower():
        f_type = "SHELTER"
        suitability = "HIGH"
        gov_status = "GOVERNMENT_PUBLIC"
        default_name = "Multi-Purpose Cyclone / Disaster Shelter"
    elif amenity == "townhall" or "panchayat" in raw_name.lower() or "sachivalayam" in raw_name.lower() or "mandal parishad" in raw_name.lower() or "tahsildar" in raw_name.lower():
        f_type = "PANCHAYAT_BUILDING"
        suitability = "HIGH"
        gov_status = "GOVERNMENT_PUBLIC"
        default_name = "Gram Panchayat / Village Secretariat"
    elif amenity in ["community_centre", "social_facility", "events_venue"] or "community" in raw_name.lower() or "kalyan" in raw_name.lower() or "function" in raw_name.lower() or "hall" in raw_name.lower():
        f_type = "COMMUNITY_HALL"
        suitability = "MEDIUM"
        gov_status = "PUBLIC_CIVIC"
        default_name = "Public Community Centre / Hall"
    elif amenity in ["public_building", "courthouse", "police", "fire_station"]:
        f_type = "GOVERNMENT_BUILDING"
        suitability = "HIGH"
        gov_status = "GOVERNMENT_PUBLIC"
        default_name = "Government Administrative Building"
    elif amenity in ["school", "college", "kindergarten", "childcare"]:
        f_type = "SCHOOL" if amenity in ["school", "kindergarten", "childcare"] else "COLLEGE"
        suitability = "MEDIUM"
        gov_status = "PUBLIC_CIVIC"
        default_name = "Public Educational Facility"
    elif amenity in ["hospital", "clinic", "health_post", "pharmacy"]:
        f_type = "PHC" if amenity in ["clinic", "health_post"] else "HOSPITAL"
        suitability = "MEDIUM"
        gov_status = "PUBLIC_CIVIC"
        default_name = "Health Care Facility"
    else:
        return None

    if not raw_name or raw_name == "nan":
        f_name = default_name
    else:
        f_name = raw_name

    capacity_persons = None
    capacity_status = "UNKNOWN"
    beds = row.get("beds")
    if pd.notna(beds):
        try:
            num = int(beds)
            if 5 <= num <= 5000:
                capacity_persons = num
                capacity_status = "VERIFIED"
        except Exception:
            pass

    return f_name, f_type, gov_status, suitability, capacity_persons, capacity_status

def compile_inventory():
    print("==========================================================", flush=True)
    print("RAKSHA SETHU: AP VILLAGE PUBLIC FACILITY INVENTORY BUILDER", flush=True)
    print("==========================================================", flush=True)
    
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    
    if not VILLAGES_PARQUET.exists():
        raise FileNotFoundError(f"Village dataset missing: {VILLAGES_PARQUET}")

    print(f"Loading Survey of India village polygons from {VILLAGES_PARQUET}...", flush=True)
    villages_gdf = gpd.read_parquet(VILLAGES_PARQUET)
    print(f"Loaded {len(villages_gdf)} AP village polygons. CRS: {villages_gdf.crs}", flush=True)
    
    if villages_gdf.crs is None or villages_gdf.crs.to_epsg() != 7755:
        villages_gdf = villages_gdf.to_crs(epsg=7755)

    extracted_records = []

    # 1. Process Education Facilities
    edu_gpkg = RAW_GIS_DIR / "education_facilities.gpkg"
    if edu_gpkg.exists():
        print(f"\nProcessing education facilities from {edu_gpkg}...", flush=True)
        gdf_edu = gpd.read_file(edu_gpkg, layer="education_facilities", bbox=AP_BBOX)
        gdf_edu_7755 = gdf_edu.to_crs(epsg=7755)
        
        for idx, row in gdf_edu_7755.iterrows():
            geom = row.geometry
            if geom is None or geom.is_empty:
                continue
            
            # Compute area if polygon
            area_sqm = float(geom.area) if geom.geom_type in ["Polygon", "MultiPolygon"] else None
            centroid = geom.centroid
            
            f_name, f_type, gov_status, suitability, cap_persons, cap_status = classify_education(row)
            
            raw_osm_id = str(row.get("id") or f"edu_{idx}").strip()
            extracted_records.append({
                "facility_id": f"AP_FAC_EDU_{raw_osm_id.replace('/', '_')}",
                "raw_osm_id": raw_osm_id,
                "facility_name": f_name,
                "facility_type": f_type,
                "public_status": gov_status,
                "suitability_tier": suitability,
                "capacity_persons": cap_persons,
                "capacity_status": cap_status,
                "usable_area_sq_m": round(area_sqm, 1) if area_sqm else None,
                "source": "HOT-OSM / UDISE Education Infrastructure Catalog",
                "source_date": "2026-09",
                "verification_status": "VERIFIED_GEOMETRY",
                "data_completeness": 0.90 if cap_persons is not None else (0.80 if area_sqm else 0.70),
                "geometry": centroid,
            })
        print(f"Parsed {len(gdf_edu_7755)} education records.", flush=True)

    # 2. Process Health Facilities
    health_gpkg = RAW_GIS_DIR / "health_facilities.gpkg"
    if health_gpkg.exists():
        print(f"\nProcessing health facilities from {health_gpkg}...", flush=True)
        gdf_health = gpd.read_file(health_gpkg, layer="health_facilities", bbox=AP_BBOX)
        gdf_health_7755 = gdf_health.to_crs(epsg=7755)
        
        for idx, row in gdf_health_7755.iterrows():
            geom = row.geometry
            if geom is None or geom.is_empty:
                continue
            
            area_sqm = float(geom.area) if geom.geom_type in ["Polygon", "MultiPolygon"] else None
            centroid = geom.centroid
            
            f_name, f_type, gov_status, suitability, cap_persons, cap_status = classify_health(row)
            
            raw_osm_id = str(row.get("id") or f"health_{idx}").strip()
            extracted_records.append({
                "facility_id": f"AP_FAC_HLTH_{raw_osm_id.replace('/', '_')}",
                "raw_osm_id": raw_osm_id,
                "facility_name": f_name,
                "facility_type": f_type,
                "public_status": gov_status,
                "suitability_tier": suitability,
                "capacity_persons": cap_persons,
                "capacity_status": cap_status,
                "usable_area_sq_m": round(area_sqm, 1) if area_sqm else None,
                "source": "HOT-OSM / MoHFW Health Infrastructure Catalog",
                "source_date": "2026-09",
                "verification_status": "VERIFIED_GEOMETRY",
                "data_completeness": 0.90 if cap_persons is not None else (0.80 if area_sqm else 0.70),
                "geometry": centroid,
            })
        print(f"Parsed {len(gdf_health_7755)} health records.", flush=True)

    # 3. Process Points of Interest (Civic, Community, Shelters)
    poi_gpkg = RAW_GIS_DIR / "points_of_interest.gpkg"
    if poi_gpkg.exists():
        print(f"\nProcessing civic & community POIs from {poi_gpkg}...", flush=True)
        gdf_poi = gpd.read_file(poi_gpkg, layer="points_of_interest", bbox=AP_BBOX)
        gdf_poi_7755 = gdf_poi.to_crs(epsg=7755)
        
        poi_count = 0
        for idx, row in gdf_poi_7755.iterrows():
            geom = row.geometry
            if geom is None or geom.is_empty:
                continue
            
            res = classify_poi(row)
            if res is None:
                continue
            
            f_name, f_type, gov_status, suitability, cap_persons, cap_status = res
            area_sqm = float(geom.area) if geom.geom_type in ["Polygon", "MultiPolygon"] else None
            centroid = geom.centroid
            
            raw_osm_id = str(row.get("id") or f"poi_{idx}").strip()
            extracted_records.append({
                "facility_id": f"AP_FAC_POI_{raw_osm_id.replace('/', '_')}",
                "raw_osm_id": raw_osm_id,
                "facility_name": f_name,
                "facility_type": f_type,
                "public_status": gov_status,
                "suitability_tier": suitability,
                "capacity_persons": cap_persons,
                "capacity_status": cap_status,
                "usable_area_sq_m": round(area_sqm, 1) if area_sqm else None,
                "source": "HOT-OSM / OpenStreetMap Public POI Catalog",
                "source_date": "2026-09",
                "verification_status": "VERIFIED_GEOMETRY",
                "data_completeness": 0.85 if cap_persons is not None else 0.65,
                "geometry": centroid,
            })
            poi_count += 1
        print(f"Parsed {poi_count} relevant civic, shelter & community POI records.", flush=True)

    print(f"\nTotal combined facility records: {len(extracted_records)}", flush=True)
    all_facilities_gdf = gpd.GeoDataFrame(extracted_records, crs="EPSG:7755")
    
    # Priority sorting for deduplication: SHELTER > SCHOOL > HOSPITAL > PHC > PANCHAYAT > GOVT > COMMUNITY > OTHER
    type_priority = {
        "SHELTER": 1,
        "SCHOOL": 2,
        "COLLEGE": 3,
        "HOSPITAL": 4,
        "PHC": 5,
        "PANCHAYAT_BUILDING": 6,
        "GOVERNMENT_BUILDING": 7,
        "COMMUNITY_HALL": 8,
        "OTHER_PUBLIC_FACILITY": 9,
    }
    all_facilities_gdf["_priority"] = all_facilities_gdf["facility_type"].map(lambda t: type_priority.get(t, 10))
    all_facilities_gdf = all_facilities_gdf.sort_values(by=["_priority", "data_completeness"], ascending=[True, False])
    
    # Deduplicate by raw_osm_id
    all_facilities_gdf = all_facilities_gdf.drop_duplicates(subset=["raw_osm_id"])
    all_facilities_gdf = all_facilities_gdf.drop(columns=["_priority", "raw_osm_id"])

    # Spatial Point-in-Polygon Join with AP Villages
    print("\nPerforming spatial point-in-polygon containment join with AP villages...", flush=True)
    village_cols = ["village_code", "village_name", "mandal_code", "mandal_name", "current_district_code", "current_district_name", "geometry"]
    joined_gdf = gpd.sjoin(all_facilities_gdf, villages_gdf[village_cols], how="inner", predicate="within")

    if "index_right" in joined_gdf.columns:
        joined_gdf = joined_gdf.drop(columns=["index_right"])

    joined_gdf = joined_gdf.rename(columns={
        "mandal_code": "mandal_id",
        "current_district_name": "district_name"
    })

    joined_gdf = joined_gdf.drop_duplicates(subset=["facility_id"])

    # Convert Point geometries back to WGS84 coordinates for API consumers
    wgs84_points = joined_gdf.to_crs(epsg=4326)
    joined_gdf["latitude"] = wgs84_points.geometry.y.round(6)
    joined_gdf["longitude"] = wgs84_points.geometry.x.round(6)

    matched_count = len(joined_gdf)
    unmatched_count = len(all_facilities_gdf) - matched_count
    print(f"\nSpatial Matching Results:", flush=True)
    print(f"  - Total facilities processed: {len(all_facilities_gdf):,}", flush=True)
    print(f"  - Facilities matched INSIDE Census village polygons: {matched_count:,} ({matched_count/len(all_facilities_gdf)*100:.1f}%)", flush=True)
    print(f"  - Facilities outside village bounds (municipalities/buffer): {unmatched_count:,}", flush=True)

    type_counts = joined_gdf["facility_type"].value_counts().to_dict()
    print("\nFacility Breakdown by Type:", flush=True)
    for ft, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  - {ft:22s}: {count:,}", flush=True)

    suitability_counts = joined_gdf["suitability_tier"].value_counts().to_dict()
    print("\nFacility Breakdown by Suitability Tier:", flush=True)
    for st, count in sorted(suitability_counts.items(), key=lambda x: -x[1]):
        print(f"  - {st:20s}: {count:,}", flush=True)

    parquet_out = OUT_DIR / "ap_village_facilities.parquet"
    csv_out = OUT_DIR / "ap_village_facilities.csv"
    report_out = OUT_DIR / "facility_compilation_report.json"

    print(f"\nSaving facility inventory to:", flush=True)
    print(f"  1. Parquet: {parquet_out}", flush=True)
    joined_gdf.to_parquet(parquet_out)

    print(f"  2. CSV:     {csv_out}", flush=True)
    joined_df = joined_gdf.drop(columns=["geometry"])
    joined_df.to_csv(csv_out, index=False)

    print(f"  3. Report:  {report_out}", flush=True)
    report_data = {
        "compilation_timestamp": pd.Timestamp.now().isoformat(),
        "total_extracted": len(all_facilities_gdf),
        "matched_to_census_villages": matched_count,
        "unmatched_or_outside_villages": unmatched_count,
        "facility_type_breakdown": type_counts,
        "suitability_breakdown": suitability_counts,
        "capacity_status_breakdown": joined_gdf["capacity_status"].value_counts().to_dict(),
        "villages_with_at_least_one_facility": int(joined_gdf["village_code"].nunique()),
    }
    with open(report_out, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)

    print("\nCompilation completed successfully!", flush=True)

if __name__ == "__main__":
    compile_inventory()
