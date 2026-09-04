import json
from shapely.geometry import shape

dist_data = json.load(open('data/processed/admin/andhra_pradesh_26_districts.geojson', 'r', encoding='utf-8'))
mand_data = json.load(open('data/raw/admin/AndhraPradesh_Mandals.geojson', 'r', encoding='utf-8'))

dist_shapes = [(f['properties']['district_name'], f['properties']['district_id'], shape(f['geometry'])) for f in dist_data['features']]

targets = ['SEETHANAGARAM1', 'SEETHANAGARAM2', 'DEVARAPALLE1', 'DEVARAPALLE2', 'YELAMANCHILI1', 'YELAMANCHILI2', 'RAVIKAMATAM', 'ARUKU VALLEY']

for feat in mand_data['features']:
    props = feat['properties']
    dm = props['DMNAME']
    if dm in targets:
        mgeom = shape(feat['geometry'])
        pt = mgeom.representative_point()
        found = None
        for dname, did, dgeom in dist_shapes:
            if dgeom.contains(pt):
                found = (dname, did)
                break
        if not found:
            for dname, did, dgeom in dist_shapes:
                if dgeom.intersects(mgeom):
                    found = (dname, did)
                    break
        print(f"Legacy Dist: {props['DNAME']} | Mandal: {dm} -> Current 26-District: {found[0]} [{found[1]}]")
