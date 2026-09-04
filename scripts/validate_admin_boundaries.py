import json
import os
import sys

def validate_geojson(filepath, expected_type=None):
    print(f"\n{'='*60}")
    print(f"VALIDATING: {filepath}")
    print(f"{'='*60}")

    if not os.path.exists(filepath):
        print(f"ERROR: File not found: {filepath}")
        return False

    file_size_mb = os.path.getsize(filepath) / (1024 * 1024)
    print(f"File Size: {file_size_mb:.2f} MB")

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print("File opens successfully as valid JSON.")
    except Exception as e:
        print(f"ERROR reading JSON: {e}")
        return False

    geo_type = data.get("type")
    print(f"Root GeoJSON Type: {geo_type}")
    if geo_type != "FeatureCollection":
        print("ERROR: Expected FeatureCollection root.")
        return False

    features = data.get("features", [])
    feature_count = len(features)
    print(f"Total Feature Count: {feature_count}")

    # Geometry types and bounding box
    geometry_types = set()
    invalid_geoms = 0
    all_lons = []
    all_lats = []
    districts = set()
    mandals = set()
    ids = []
    missing_ids = 0

    def extract_coords(coords):
        # Recursively extract lat/lons
        if isinstance(coords[0], (int, float)):
            all_lons.append(coords[0])
            all_lats.append(coords[1])
        else:
            for sub in coords:
                extract_coords(sub)

    for idx, feat in enumerate(features):
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        gtype = geom.get("type")
        geometry_types.add(gtype)

        # ID checks
        d_id = props.get("district_id") or props.get("OBJECTID") or props.get("OBJECTID_1")
        if d_id:
            ids.append(str(d_id).strip())
        else:
            missing_ids += 1

        # District names
        d_name = props.get("district_name") or props.get("NEW_DIST") or props.get("DNAME")
        if d_name:
            districts.add(str(d_name).strip())

        # Mandal names
        m_name = props.get("DMNAME") or props.get("mandal_name") or props.get("MANDAL")
        if m_name:
            mandals.add(str(m_name).strip())

        # Validate geometry coordinates
        coords = geom.get("coordinates")
        if not coords or len(coords) == 0:
            invalid_geoms += 1
        else:
            try:
                extract_coords(coords)
            except Exception:
                invalid_geoms += 1

    duplicate_ids = len(ids) - len(set(ids))

    print(f"Geometry Types Present: {list(geometry_types)}")
    print(f"Invalid Geometries Count: {invalid_geoms}")
    print(f"Missing IDs Count: {missing_ids}")
    print(f"Duplicate IDs Count: {duplicate_ids}")

    if all_lons and all_lats:
        min_lon, max_lon = min(all_lons), max(all_lons)
        min_lat, max_lat = min(all_lats), max(all_lats)
        print(f"Bounding Box: Min Lon={min_lon:.4f}, Min Lat={min_lat:.4f}, Max Lon={max_lon:.4f}, Max Lat={max_lat:.4f}")

        # Andhra Pradesh geographic extent check:
        # Longitude: ~76.7° E to ~84.8° E
        # Latitude: ~12.6° N to ~19.2° N
        covers_ap = (76.0 <= min_lon <= 78.0) and (84.0 <= max_lon <= 85.5) and (12.0 <= min_lat <= 13.5) and (18.5 <= max_lat <= 20.0)
        print(f"Covers Andhra Pradesh completely: {covers_ap}")
    else:
        print("Bounding Box: None (No coordinates extracted)")

    if districts:
        print(f"District Count: {len(districts)}")
        sorted_districts = sorted(list(districts))
        print("District Names Sample (first 10):", sorted_districts[:10])
        if len(districts) == 26:
            print(">>> VERIFIED 26-DISTRICT COMPATIBILITY: Exactly 26 districts present! <<<")
        else:
            print(f">>> Note: Contains {len(districts)} district entities. <<<")

    if mandals:
        print(f"Mandal Count: {len(mandals)}")
        sorted_mandals = sorted(list(mandals))
        print("Mandal Names Sample (first 5):", sorted_mandals[:5])

    return True

if __name__ == "__main__":
    validate_geojson("data/raw/admin/AndhraPradesh_Districts.geojson")
    validate_geojson("data/processed/admin/andhra_pradesh_26_districts.geojson")
    validate_geojson("data/raw/admin/AndhraPradesh_Mandals.geojson")
