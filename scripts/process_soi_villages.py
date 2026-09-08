#!/usr/bin/env python3
"""
Sahayata (SIH26191) - Process Survey of India (SOI) AP Village Boundaries
Author: Antigravity Implementation Engineer
Date: September 2026

Ingests verified Survey of India (SOI) / NWIC AP village boundaries (EPSG:7755),
joins 100% with Census 2011 demographics dataset on exact village_code,
validates topologies using shapely.make_valid, pre-computes centroids, bounds,
and writes optimized spatial outputs in data/processed/gis/villages/.
"""

import os
import sys
import json
from pathlib import Path
import numpy as np
import pandas as pd
import geopandas as gpd
import pyogrio
from shapely.geometry import shape, MultiPolygon, Polygon
from shapely.validation import make_valid

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_GEOJSON = PROJECT_ROOT / "scratch" / "vb_soi_ap.GeoJSON"
CENSUS_CSV = PROJECT_ROOT / "data" / "processed" / "census" / "ap_village_demographics.csv"
OUT_DIR = PROJECT_ROOT / "data" / "processed" / "gis" / "villages"

def process_villages():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Loading Census 2011 demographics from {CENSUS_CSV}...")
    df_census = pd.read_csv(CENSUS_CSV)
    df_census["village_code"] = pd.to_numeric(df_census["village_code"].astype(str).str.strip(), errors="coerce").astype(int)
    census_codes = set(df_census["village_code"])
    print(f"Loaded {len(df_census)} Census 2011 village records.")

    print(f"Reading Survey of India (SOI) GeoJSON from {RAW_GEOJSON} via pyogrio...")
    gdf_soi = pyogrio.read_dataframe(RAW_GEOJSON)
    print(f"Read {len(gdf_soi)} features. Native CRS: {gdf_soi.crs}")

    gdf_soi["vlcode_int"] = pd.to_numeric(gdf_soi["vlcode"].astype(str).str.strip(), errors="coerce")
    gdf_matched = gdf_soi[gdf_soi["vlcode_int"].isin(census_codes)].copy()
    gdf_matched["village_code"] = gdf_matched["vlcode_int"].astype(int)
    print(f"Matched {len(gdf_matched)} features to Census villages.")

    # Deduplicate in case of multi-part village fragments by merging geometries under same village_code
    print("Harmonizing multi-part village geometries...")
    dissolved_geoms = {}
    soi_props = {}
    for idx, row in gdf_matched.iterrows():
        vcode = row["village_code"]
        geom = row.geometry
        if not geom.is_valid:
            geom = make_valid(geom)
        if vcode not in dissolved_geoms:
            dissolved_geoms[vcode] = geom
            soi_props[vcode] = row
        else:
            dissolved_geoms[vcode] = dissolved_geoms[vcode].union(geom)

    print(f"Total unique consolidated villages: {len(dissolved_geoms)} (Expect 17,039)")
    assert len(dissolved_geoms) == 17039, f"Expected 17039 villages, got {len(dissolved_geoms)}"

    records = []
    for vcode, geom in dissolved_geoms.items():
        if geom.geom_type == "Polygon":
            geom = MultiPolygon([geom])
        elif geom.geom_type != "MultiPolygon":
            # In case union created GeometryCollection, extract polygons
            polys = [p for p in geom.geoms if p.geom_type in ("Polygon", "MultiPolygon")]
            flat_polys = []
            for p in polys:
                if p.geom_type == "Polygon":
                    flat_polys.append(p)
                else:
                    flat_polys.extend(p.geoms)
            geom = MultiPolygon(flat_polys)

        c = geom.centroid
        minx, miny, maxx, maxy = geom.bounds
        area_sqkm = round(geom.area / 1e6, 4)

        records.append({
            "village_code": vcode,
            "geometry": geom,
            "centroid_x_7755": round(c.x, 2),
            "centroid_y_7755": round(c.y, 2),
            "minx_7755": round(minx, 2),
            "miny_7755": round(miny, 2),
            "maxx_7755": round(maxx, 2),
            "maxy_7755": round(maxy, 2),
            "village_area_sqkm": area_sqkm,
        })

    gdf_final = gpd.GeoDataFrame(records, crs="EPSG:7755")
    
    # Merge demographic attributes
    gdf_final = gdf_final.merge(
        df_census[[
            "village_code", "village_name", "mandal_code", "mandal_name",
            "current_district_code", "current_district_name", "population_total",
            "households", "population_0_6", "population_sc", "population_st",
            "workers", "non_workers"
        ]],
        on="village_code",
        how="left"
    )

    # Compute EPSG:4326 centroid coordinates for map centering
    centroids_geom = gpd.GeoDataFrame(geometry=gdf_final.geometry.centroid, crs="EPSG:7755").to_crs("EPSG:4326")
    gdf_final["centroid_lon"] = centroids_geom.geometry.x.round(6)
    gdf_final["centroid_lat"] = centroids_geom.geometry.y.round(6)

    # 1. Save master GeoParquet file (EPSG:7755)
    out_parquet = OUT_DIR / "ap_villages.parquet"
    print(f"Writing master GeoParquet to {out_parquet}...")
    gdf_final.to_parquet(out_parquet, index=False)
    print(f"GeoParquet written successfully ({os.path.getsize(out_parquet)} bytes).")

    # 2. Save OGC GeoPackage with spatial index
    out_gpkg = OUT_DIR / "ap_villages.gpkg"
    print(f"Writing OGC GeoPackage to {out_gpkg}...")
    pyogrio.write_dataframe(gdf_final, out_gpkg, driver="GPKG", spatial_index=True)
    print(f"GeoPackage written successfully ({os.path.getsize(out_gpkg)} bytes).")

    # 3. Save lightweight lookup index (no heavy geometry, for instant metadata lookups)
    out_index_csv = OUT_DIR / "ap_villages_index.csv"
    print(f"Writing village metadata index to {out_index_csv}...")
    df_index = gdf_final.drop(columns=["geometry"])
    df_index.to_csv(out_index_csv, index=False)
    print(f"Index written successfully ({os.path.getsize(out_index_csv)} bytes).")

    print("\n[SUCCESS] Survey of India village spatial data processed and verified 100%!")

if __name__ == "__main__":
    process_villages()
