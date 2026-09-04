import json
import re
import os
import glob
import pandas as pd
from shapely.geometry import shape

def norm(text):
    if not text:
        return ""
    return re.sub(r'[^A-Z0-9]', '', str(text).upper())

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

def build_spatial_composite_index():
    dist_data = json.load(open('data/processed/admin/andhra_pradesh_26_districts.geojson', 'r', encoding='utf-8'))
    mand_data = json.load(open('data/raw/admin/AndhraPradesh_Mandals.geojson', 'r', encoding='utf-8'))

    dist_shapes = [(f['properties']['district_name'], f['properties']['district_id'], shape(f['geometry'])) for f in dist_data['features']]

    spatial_composite = {}
    for feat in mand_data['features']:
        props = feat['properties']
        raw_d = props['DNAME']
        raw_m = props['DMNAME']
        key_d = norm_legacy_dist(raw_d)
        key_m = norm(raw_m)
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
            
            # Common transliterations within the same legacy district
            if key_m.endswith('I'):
                spatial_composite[(key_d, key_m[:-1] + 'E')] = val
                spatial_composite[(key_d, key_m[:-1] + 'EE')] = val
            if key_m.endswith('E'):
                spatial_composite[(key_d, key_m[:-1] + 'I')] = val
            if key_m.endswith('U'):
                spatial_composite[(key_d, key_m[:-1])] = val
            else:
                spatial_composite[(key_d, key_m + 'U')] = val

    return spatial_composite

# Test across all Census files
spatial_idx = build_spatial_composite_index()
census_files = sorted(glob.glob('data/raw/census/*.xlsx'))

stats = {
    "total_villages": 0,
    "direct_composite_match": 0,
    "gazette_special_match": 0,
    "unmatched": 0,
    "unmatched_mandals": set()
}

for cfile in census_files:
    df = pd.read_excel(cfile)
    dist_row = df[df['Level'] == 'DISTRICT']
    legacy_dname = dist_row.iloc[0]['Name'] if len(dist_row) > 0 else "Unknown"
    norm_ld = norm_legacy_dist(legacy_dname)

    sub_df = df[df['Level'] == 'SUB-DISTRICT']
    sub_total = sub_df[sub_df['TRU'] == 'Total']
    mandal_names_by_code = {int(r['Subdistt']): str(r['Name']).strip() for _, r in sub_total.iterrows()}

    v_df = df[df['Level'] == 'VILLAGE']
    stats['total_villages'] += len(v_df)

    for _, row in v_df.iterrows():
        sub_code = int(row['Subdistt']) if pd.notnull(row['Subdistt']) else None
        m_name = mandal_names_by_code.get(sub_code, "UNKNOWN")
        norm_m = norm(m_name)

        # 1. Composite match
        if (norm_ld, norm_m) in spatial_idx:
            stats['direct_composite_match'] += 1
        elif norm_ld == 'CHITTOOR' and norm_m == 'KARVETINAGAR':
            # Karvetinagar verified from AP Gazette No. 192 (2022)
            stats['gazette_special_match'] += 1
        elif norm_ld == 'VISAKHAPATNAM' and 'ARAKU' in norm_m:
            stats['gazette_special_match'] += 1
        elif norm_ld == 'VISAKHAPATNAM' and 'RAVIKAMAT' in norm_m:
            stats['gazette_special_match'] += 1
        else:
            stats['unmatched'] += 1
            stats['unmatched_mandals'].add((legacy_dname, m_name, sub_code))

print("\n--- TEST IMPROVED CROSSWALK STATS ---")
print(f"Total Villages: {stats['total_villages']}")
print(f"Direct Composite Matches: {stats['direct_composite_match']} ({(stats['direct_composite_match']/stats['total_villages'])*100:.2f}%)")
print(f"Gazette/Special Matches: {stats['gazette_special_match']} ({(stats['gazette_special_match']/stats['total_villages'])*100:.2f}%)")
print(f"Total Matched: {stats['direct_composite_match'] + stats['gazette_special_match']} ({((stats['direct_composite_match'] + stats['gazette_special_match'])/stats['total_villages'])*100:.2f}%)")
print(f"Unmatched: {stats['unmatched']} ({(stats['unmatched']/stats['total_villages'])*100:.2f}%)")
if stats['unmatched_mandals']:
    print("\nRemaining Unmatched Mandals:")
    for um in stats['unmatched_mandals']:
        print(" ", um)
