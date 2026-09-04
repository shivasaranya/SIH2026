import re
import os
import json

def normalize_name(name):
    if not name:
        return ""
    # uppercase, remove punctuation, remove common prefixes like 'A.', 'B.', spaces
    s = re.sub(r'[^A-Z0-9]', '', str(name).upper())
    return s

# Test matching between Census mandals and spatial mandals
import json
dist_data = json.load(open('data/processed/admin/andhra_pradesh_26_districts.geojson', 'r', encoding='utf-8'))
mand_data = json.load(open('data/raw/admin/AndhraPradesh_Mandals.geojson', 'r', encoding='utf-8'))

from shapely.geometry import shape
dist_shapes = [(f['properties']['district_name'], f['properties']['district_id'], shape(f['geometry'])) for f in dist_data['features']]

spatial_mandal_map = {}
for feat in mand_data['features']:
    props = feat['properties']
    raw_mname = props.get('DMNAME')
    norm_mname = normalize_name(raw_mname)
    m_geom = shape(feat['geometry'])
    pt = m_geom.representative_point()
    found = None
    for dname, did, dgeom in dist_shapes:
        if dgeom.contains(pt):
            found = (dname, did)
            break
    if not found:
        for dname, did, dgeom in dist_shapes:
            if dgeom.intersects(m_geom):
                found = (dname, did)
                break
    if found:
        spatial_mandal_map[norm_mname] = {
            "current_district_name": found[0],
            "current_district_id": found[1],
            "raw_mname": raw_mname
        }

print(f"Spatial unique normalized mandals: {len(spatial_mandal_map)}")

# Now test against Census mandals
import glob
import pandas as pd

census_files = sorted(glob.glob('data/raw/census/*.xlsx'))
matched_mandals = 0
unmatched_mandals = []

for cfile in census_files:
    df = pd.read_excel(cfile)
    sub_df = df[df['Level'] == 'SUB-DISTRICT']
    sub_total = sub_df[sub_df['TRU'] == 'Total']
    for _, row in sub_total.iterrows():
        c_name = row['Name']
        c_code = row['Subdistt']
        norm_c = normalize_name(c_name)
        if norm_c in spatial_mandal_map:
            matched_mandals += 1
        else:
            unmatched_mandals.append((c_code, c_name, os.path.basename(cfile)))

print(f"Census Mandals matched: {matched_mandals}/{matched_mandals + len(unmatched_mandals)} ({(matched_mandals/(matched_mandals + len(unmatched_mandals)))*100:.2f}%)")
print(f"Unmatched Census mandals: {len(unmatched_mandals)}")
if unmatched_mandals:
    print("Sample unmatched:", unmatched_mandals[:10])
