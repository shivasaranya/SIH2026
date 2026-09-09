import json
from shapely.geometry import shape

with open('data/processed/admin/india_states.geojson', 'r', encoding='utf-8') as f:
    st = json.load(f)

nl_geom = None
for feat in st['features']:
    if feat['properties'].get('NAME_1') == 'Nagaland':
        nl_geom = shape(feat['geometry'])
        break

with open('data/raw/admin/assam/india_adm2.geojson', 'r', encoding='utf-8') as f:
    adm2 = json.load(f)

districts = []
for feat in adm2['features']:
    g = shape(feat['geometry'])
    if g.intersects(nl_geom) and (g.intersection(nl_geom).area / g.area > 0.4):
        districts.append({'name': feat['properties']['shapeName'], 'geom': g, 'id': feat['properties']['shapeID']})

with open('data/raw/admin/assam/india_adm3.geojson', 'r', encoding='utf-8') as f:
    adm3 = json.load(f)

circles = []
for feat in adm3['features']:
    g = shape(feat['geometry'])
    if g.intersects(nl_geom) and (g.intersection(nl_geom).area / g.area > 0.4):
        best_dist = None
        max_inter = 0
        for d in districts:
            inter = g.intersection(d['geom']).area
            if inter > max_inter:
                max_inter = inter
                best_dist = d['name']
        circles.append({
            'name': feat['properties']['shapeName'],
            'id': feat['properties']['shapeID'],
            'district': best_dist,
            'lon': round(g.centroid.x, 4),
            'lat': round(g.centroid.y, 4),
            'area_sqkm': round(g.area * 111.0 * 111.0 * 0.89, 2)
        })

print(f"Total circles: {len(circles)}")
circles.sort(key=lambda x: (x['district'], x['name']))
by_dist = {}
for c in circles:
    by_dist.setdefault(c['district'], []).append(c)

for d, clist in by_dist.items():
    print(f"\nDistrict: {d} ({len(clist)} circles)")
    for c in clist:
        print(f"  {c['name']} (area={c['area_sqkm']} km2, lon={c['lon']}, lat={c['lat']})")
