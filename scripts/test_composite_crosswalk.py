import json
import re
from shapely.geometry import shape

def norm(text):
    if not text:
        return ""
    # strip non-alphanumeric, uppercase, remove numbers at end like 1 or 2 if part of GIS label
    s = re.sub(r'[^A-Z0-9]', '', str(text).upper())
    return s

def norm_legacy_dist(dname):
    s = norm(dname)
    if 'VISHAK' in s or 'VISAKH' in s: return 'VISAKHAPATNAM'
    if 'KADAPA' in s or 'CUDDAPAH' in s or 'YSR' in s: return 'YSR'
    if 'NELLORE' in s: return 'NELLORE'
    if 'ANANTA' in s: return 'ANANTAPUR'
    if 'SRIKAKU' in s: return 'SRIKAKULAM'
    if 'VIZIANA' in s: return 'VIZIANAGARAM'
    if 'EAST' in s and 'GODAVARI' in s: return 'EASTGODAVARI'
    if 'WEST' in s and 'GODAVARI' in s: return 'WESTGODAVARI'
    if 'KRISHNA' in s: return 'KRISHNA'
    if 'GUNTUR' in s: return 'GUNTUR'
    if 'PRAKASAM' in s: return 'PRAKASAM'
    if 'KURNOOL' in s: return 'KURNOOL'
    if 'CHITTOOR' in s: return 'CHITTOOR'
    return s

# Load data
dist_data = json.load(open('data/processed/admin/andhra_pradesh_26_districts.geojson', 'r', encoding='utf-8'))
mand_data = json.load(open('data/raw/admin/AndhraPradesh_Mandals.geojson', 'r', encoding='utf-8'))

dist_shapes = [(f['properties']['district_name'], f['properties']['district_id'], shape(f['geometry'])) for f in dist_data['features']]

# Build composite key dictionary: (norm_legacy_dist, norm_mandal) -> current_26_district
spatial_composite = {}
for feat in mand_data['features']:
    props = feat['properties']
    raw_d = props['DNAME']
    raw_m = props['DMNAME']
    key_d = norm_legacy_dist(raw_d)
    key_m = norm(raw_m)
    # also strip trailing digit if any (e.g. SEETHANAGARAM1 -> SEETHANAGARAM)
    key_m_clean = re.sub(r'[0-9]+$', '', key_m)

    mgeom = shape(feat['geometry'])
    pt = mgeom.representative_point()

    found = None
    for dname, did, dgeom in dist_shapes:
        if dgeom.contains(pt):
            found = (dname, did)
            break
    if not found:
        max_area = 0
        best = None
        for dname, did, dgeom in dist_shapes:
            if dgeom.intersects(mgeom):
                iarea = dgeom.intersection(mgeom).area
                if iarea > max_area:
                    max_area = iarea
                    best = (dname, did)
        found = best

    if found:
        val = {
            "current_district_name": found[0],
            "current_district_id": found[1],
            "raw_dname": raw_d,
            "raw_dmname": raw_m
        }
        spatial_composite[(key_d, key_m)] = val
        spatial_composite[(key_d, key_m_clean)] = val

print(f"Total spatial composite entries: {len(spatial_composite)}")

# Test on the sample problem mandals:
test_cases = [
    ("CHITTOOR", "ROMPICHERLA"),
    ("GUNTUR", "ROMPICHERLA"),
    ("CHITTOOR", "GANGAVARAM"),
    ("EASTGODAVARI", "GANGAVARAM"),
    ("KURNOOL", "GUDUR"),
    ("KRISHNA", "GUDUR"),
    ("NELLORE", "GUDUR"),
    ("ANANTAPUR", "ATMAKUR"),
    ("KURNOOL", "ATMAKUR"),
    ("NELLORE", "ATMAKUR"),
    ("VISAKHAPATNAM", "ARUKUVALLEY"),
    ("VISAKHAPATNAM", "RAVIKAMATAM"),
    ("VIZIANAGARAM", "SEETHANAGARAM"),
    ("EASTGODAVARI", "SEETHANAGARAM"),
    ("VISAKHAPATNAM", "DEVARAPALLE"),
    ("WESTGODAVARI", "DEVARAPALLE"),
    ("VISAKHAPATNAM", "YELAMANCHILI"),
    ("WESTGODAVARI", "YELAMANCHILI"),
]

print("\nVerifying Disambiguation Test Cases:")
for ld, lm in test_cases:
    res = spatial_composite.get((ld, lm))
    if res:
        print(f"  ({ld}, {lm}) -> {res['current_district_name']} [{res['current_district_id']}]")
    else:
        print(f"  ({ld}, {lm}) -> NOT FOUND")
