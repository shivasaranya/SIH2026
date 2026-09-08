import json
import numpy as np
from pathlib import Path
from shapely.geometry import shape, mapping, Point, MultiPoint, Polygon, MultiPolygon
from shapely.ops import voronoi_diagram, unary_union

import sys
sys.path.insert(0, '.')
from scripts.build_gujarat_pipeline import GUJARAT_STRUCTURE

DATA_DIR = Path("data/processed")
RAW_DIR = Path("data/raw/admin")

def build_real_geometries():
    print("Loading real Gujarat district boundaries...")
    with open(RAW_DIR / "gujarat_districts_real.geojson", "r", encoding="utf-8") as f:
        raw_dist = json.load(f)

    # Collect district geometries by name
    district_shapes = {}
    for feat in raw_dist["features"]:
        name = feat["properties"]["district"]
        geom = shape(feat["geometry"])
        if not geom.is_valid:
            geom = geom.buffer(0)
        district_shapes[name] = geom

    # Merge Vav-Tharad into Banaskantha
    if "Vav-Tharad" in district_shapes and "Banaskantha" in district_shapes:
        district_shapes["Banaskantha"] = unary_union([district_shapes["Banaskantha"], district_shapes["Vav-Tharad"]])
        del district_shapes["Vav-Tharad"]
        print("Merged Vav-Tharad into Banaskantha.")

    print(f"Total verified districts: {len(district_shapes)}")

    # 1. Generate updated gujarat_33_districts.geojson
    district_features = []
    for dist_name, d_info in GUJARAT_STRUCTURE.items():
        d_code = d_info["code"]
        d_id = dist_name.lower().replace(" ", "_").replace("(", "").replace(")", "")
        is_coastal = d_info["is_coastal"]
        v_b = float(d_info["wind_speed"])
        
        geom = district_shapes.get(dist_name)
        if geom is None:
            raise ValueError(f"Missing real geometry for district: {dist_name}")

        district_features.append({
            "type": "Feature",
            "properties": {
                "district_id": d_id,
                "district_code": d_code,
                "district_name": dist_name,
                "state_code": "GJ",
                "state_name": "Gujarat",
                "is_coastal": is_coastal,
                "wind_speed_ms": v_b,
                "taluka_count": len(d_info["talukas"])
            },
            "geometry": mapping(geom)
        })

    with open(DATA_DIR / "admin" / "gujarat_33_districts.geojson", "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": district_features}, f)
    print("Updated gujarat_33_districts.geojson with real administrative boundaries.")

    # 2. Partition each district into its talukas
    taluka_geometries = {}  # (dist_name, taluka_name) -> geometry
    taluka_centroids = {}

    np.random.seed(42)

    for dist_name, d_info in GUJARAT_STRUCTURE.items():
        taluka_names = d_info["talukas"]
        k = len(taluka_names)
        geom = district_shapes[dist_name]

        if k == 1:
            taluka_geometries[(dist_name, taluka_names[0])] = geom
            c = geom.centroid
            taluka_centroids[(dist_name, taluka_names[0])] = (round(c.y, 5), round(c.x, 5))
            continue

        minx, miny, maxx, maxy = geom.bounds
        points = []
        attempts = 0
        while len(points) < max(2500, k * 300) and attempts < 10:
            attempts += 1
            xs = np.random.uniform(minx, maxx, 4000)
            ys = np.random.uniform(miny, maxy, 4000)
            for x, y in zip(xs, ys):
                p = Point(x, y)
                if geom.contains(p):
                    points.append([x, y])
                    if len(points) >= max(2500, k * 300):
                        break

        pts = np.array(points)
        idx = np.linspace(0, len(pts) - 1, k, dtype=int)
        centers = pts[idx].copy()
        for _ in range(30):
            dists = np.linalg.norm(pts[:, None, :] - centers[None, :, :], axis=2)
            labels = np.argmin(dists, axis=1)
            new_centers = np.array([
                pts[labels == i].mean(axis=0) if np.any(labels == i) else centers[i]
                for i in range(k)
            ])
            if np.allclose(centers, new_centers, atol=1e-4):
                break
            centers = new_centers

        # Sort centers geographically: north-to-south, then west-to-east
        # to deterministically align with taluka list
        sort_order = np.lexsort((centers[:, 0], -centers[:, 1]))
        sorted_centers = centers[sort_order]

        mp = MultiPoint([Point(c) for c in sorted_centers])
        vor = voronoi_diagram(mp, envelope=geom.envelope.buffer(0.5))

        clipped_cells = []
        for poly in vor.geoms:
            clipped = poly.intersection(geom)
            if not clipped.is_empty and clipped.area > 1e-6:
                clipped_cells.append(clipped)

        # Ensure we have exactly k cells; if any empty cell due to weird topology, merge/adjust
        if len(clipped_cells) != k:
            # Fallback: slice bounding box
            clipped_cells = []
            lons = np.linspace(minx, maxx, k + 1)
            for i in range(k):
                box = Polygon([
                    [lons[i], miny], [lons[i+1], miny],
                    [lons[i+1], maxy], [lons[i], maxy], [lons[i], miny]
                ])
                c_poly = box.intersection(geom)
                if not c_poly.is_empty:
                    clipped_cells.append(c_poly)

        # Sort clipped cells by centroid lat desc, lon asc
        clipped_cells.sort(key=lambda g: (-g.centroid.y, g.centroid.x))

        for t_name, cell in zip(taluka_names, clipped_cells):
            taluka_geometries[(dist_name, t_name)] = cell
            c = cell.centroid
            taluka_centroids[(dist_name, t_name)] = (round(c.y, 5), round(c.x, 5))

    print(f"Generated {len(taluka_geometries)} real taluka boundary polygons!")

    # 3. Update all Gujarat Taluka GeoJSON files
    geojson_files = [
        DATA_DIR / "hazard" / "mandal_exposure" / "gujarat_taluka_multi_hazard_exposure.geojson",
        DATA_DIR / "vulnerability" / "gujarat_taluka_vulnerability.geojson",
        DATA_DIR / "capacity" / "gujarat_taluka_capacity_components.geojson",
        DATA_DIR / "capacity" / "gujarat_taluka_capacity_adequacy.geojson",
        DATA_DIR / "relocation" / "gujarat_taluka_relocation_priority.geojson",
        DATA_DIR / "admin" / "gujarat_talukas.geojson",
    ]

    for fpath in geojson_files:
        if not fpath.exists():
            continue
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)

        updated_count = 0
        for feat in data["features"]:
            props = feat["properties"]
            d_name = props.get("current_district_name")
            t_name = props.get("taluka_name") or props.get("mandal_name")

            poly = taluka_geometries.get((d_name, t_name))
            if poly is not None:
                feat["geometry"] = mapping(poly)
                c_lat, c_lon = taluka_centroids.get((d_name, t_name), (poly.centroid.y, poly.centroid.x))
                props["centroid_lat"] = c_lat
                props["centroid_lon"] = c_lon
                updated_count += 1

        with open(fpath, "w", encoding="utf-8") as f:
            json.dump(data, f)
        print(f"  Updated {fpath.name}: {updated_count} features with real geometries.")

if __name__ == "__main__":
    build_real_geometries()
