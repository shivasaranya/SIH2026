import json
from collections import defaultdict

def process_districts(raw_path, processed_path):
    with open(raw_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    grouped_features = defaultdict(list)
    district_metadata = {}

    for feat in data['features']:
        props = feat['properties']
        d_id = props['district_id']
        geom = feat['geometry']

        if geom['type'] == 'Polygon':
            grouped_features[d_id].append(geom['coordinates'])
        elif geom['type'] == 'MultiPolygon':
            grouped_features[d_id].extend(geom['coordinates'])

        if d_id not in district_metadata:
            district_metadata[d_id] = {
                "district_id": d_id,
                "district_name": props.get("district_name") or props.get("NEW_DIST"),
                "short_code": props.get("LINKING", ""),
                "state": "Andhra Pradesh",
                "state_code": "AP"
            }

    cleaned_features = []
    for idx, (d_id, poly_list) in enumerate(sorted(grouped_features.items()), start=1):
        feature = {
            "type": "Feature",
            "id": idx,
            "properties": district_metadata[d_id],
            "geometry": {
                "type": "MultiPolygon" if len(poly_list) > 1 else "Polygon",
                "coordinates": poly_list if len(poly_list) > 1 else poly_list[0]
            }
        }
        cleaned_features.append(feature)

    processed_data = {
        "type": "FeatureCollection",
        "name": "AndhraPradesh_26_Districts_Processed",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}
        },
        "features": cleaned_features
    }

    with open(processed_path, 'w', encoding='utf-8') as f:
        json.dump(processed_data, f)

    print(f"Processed 26 districts into {processed_path}: {len(cleaned_features)} distinct features.")

if __name__ == "__main__":
    process_districts(
        "data/raw/admin/AndhraPradesh_Districts.geojson",
        "data/processed/admin/andhra_pradesh_26_districts.geojson"
    )
