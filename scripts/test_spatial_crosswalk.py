import json
from shapely.geometry import shape

dist_data = json.load(open('data/processed/admin/andhra_pradesh_26_districts.geojson', 'r', encoding='utf-8'))
mand_data = json.load(open('data/raw/admin/AndhraPradesh_Mandals.geojson', 'r', encoding='utf-8'))

dist_shapes = [(f['properties']['district_name'], f['properties']['district_id'], shape(f['geometry'])) for f in dist_data['features']]

matched = 0
unmatched = []
mandal_to_dist = {}

for feat in mand_data['features']:
    props = feat['properties']
    m_name = props.get('DMNAME')
    legacy_dname = props.get('DNAME')
    m_geom = shape(feat['geometry'])
    pt = m_geom.representative_point()

    found = None
    for dname, did, dgeom in dist_shapes:
        if dgeom.contains(pt):
            found = (dname, did)
            break

    # If point is right on boundary, check maximum intersection area
    if not found:
        max_area = 0
        best = None
        for dname, did, dgeom in dist_shapes:
            if dgeom.intersects(m_geom):
                iarea = dgeom.intersection(m_geom).area
                if iarea > max_area:
                    max_area = iarea
                    best = (dname, did)
        found = best

    if found:
        matched += 1
        mandal_to_dist[m_name] = {
            "current_district_name": found[0],
            "current_district_id": found[1],
            "legacy_district": legacy_dname
        }
    else:
        unmatched.append((m_name, legacy_dname))

print(f"Total mandal features: {len(mand_data['features'])}")
print(f"Matched mandals: {matched} ({(matched/len(mand_data['features']))*100:.2f}%)")
print(f"Unmatched mandals: {len(unmatched)}")
if unmatched:
    print("Unmatched mandals sample:", unmatched[:5])

# Print sample mappings
print("\nSample Mandal -> 26 District mappings:")
for k in list(mandal_to_dist.keys())[:10]:
    v = mandal_to_dist[k]
    print(f"  {k} (Legacy: {v['legacy_district']}) -> {v['current_district_name']} [{v['current_district_id']}]")
