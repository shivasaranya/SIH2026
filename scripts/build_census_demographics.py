import os
import glob
import re
import json
import pandas as pd
from shapely.geometry import shape

def normalize_name(name):
    if not name:
        return ""
    return re.sub(r'[^A-Z0-9]', '', str(name).upper())

# Common transliteration aliases between Census 2011 and AP GIS shapefiles
KNOWN_SPELLING_ALIASES = {
    "ARAKUVALLEY": "ARAKU",
    "GUDEMKOTHAVEEDHI": "GKVEEDHI",
    "DEVARAPALLE": "DEVARAPALLI",
    "ANAKAPALLE": "ANAKAPALLI",
    "YELAMANCHILI": "ELAMANCHILI",
    "NAKKAPALLE": "NAKKAPALLI",
    "ROLUGUNTA": "ROLUGUNTA",
    "BUTCHAYYAPETA": "BUCHAYYAPETA",
    "GANTYADA": "GANTYADA",
    "SEETHANAGARAM": "SITANAGARAM",
    "BOGHAPURAM": "BHOGAPURAM",
    "KOMARADA": "KOMARADA",
    "MAREDUMILLI": "MAREDUMILLI",
    "RAMPACHODAVARAM": "RAMPACHODAVARAM",
    "YETAPAKA": "ETAPAKA",
    "CHINTUR": "CHINTOOR",
    "VARARAMACHANDRAPURAM": "VR PURAM",
    "KUNAVARAM": "KOONAVARAM",
    "KOVVUR": "KOVVURU",
    "UNDRAJAVARAM": "UNDRAJAVARAM",
    "NIDADAVOLE": "NIDADAVOLE",
    "TADEPALLIGUDEM": "TADEPALLIGUDEM",
    "BHAIMAVARAM": "BHIMAVARAM",
    "VIJAYAWADAURBAN": "VIJAYAWADA",
    "VIJAYAWADARURAL": "VIJAYAWADA RURAL",
    "VISAKHAPATNAMURBAN": "VISAKHAPATNAM",
    "VISAKHAPATNAMRURAL": "VISAKHAPATNAM RURAL",
    "GUNTURURBAN": "GUNTUR",
    "GUNTURRURAL": "GUNTUR RURAL",
    "KURNOOLURBAN": "KURNOOL",
    "KURNOOLRURAL": "KURNOOL RURAL",
    "NELLOREURBAN": "NELLORE",
    "NELLORERURAL": "NELLORE RURAL",
}

def build_spatial_crosswalk():
    print("Building spatial mandal crosswalk from 26-district vectors...")
    dist_data = json.load(open('data/processed/admin/andhra_pradesh_26_districts.geojson', 'r', encoding='utf-8'))
    mand_data = json.load(open('data/raw/admin/AndhraPradesh_Mandals.geojson', 'r', encoding='utf-8'))

    dist_shapes = [(f['properties']['district_name'], f['properties']['district_id'], shape(f['geometry'])) for f in dist_data['features']]

    spatial_mandal_map = {}
    for feat in mand_data['features']:
        props = feat['properties']
        raw_mname = str(props.get('DMNAME', '')).strip()
        norm_mname = normalize_name(raw_mname)
        m_geom = shape(feat['geometry'])
        pt = m_geom.representative_point()

        found = None
        for dname, did, dgeom in dist_shapes:
            if dgeom.contains(pt):
                found = (dname, did)
                break
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
            spatial_mandal_map[norm_mname] = {
                "current_district_name": found[0],
                "current_district_id": found[1],
                "raw_mname": raw_mname
            }

    print(f"Mapped {len(spatial_mandal_map)} unique spatial mandals to 26 districts.")
    return spatial_mandal_map

def process_census_pca():
    spatial_map = build_spatial_crosswalk()
    census_files = sorted(glob.glob('data/raw/census/*.xlsx'))

    all_village_records = []

    for cfile in census_files:
        filename = os.path.basename(cfile)
        print(f"Processing Census file: {filename}...")
        df = pd.read_excel(cfile)

        # 1. District Name
        dist_row = df[df['Level'] == 'DISTRICT']
        legacy_dist_name = dist_row.iloc[0]['Name'] if len(dist_row) > 0 else "Unknown"

        # 2. Sub-district mapping dictionary (Subdistt Code -> Mandal Name)
        sub_df = df[df['Level'] == 'SUB-DISTRICT']
        sub_total = sub_df[sub_df['TRU'] == 'Total']
        mandal_names_by_code = {}
        for _, row in sub_total.iterrows():
            mandal_names_by_code[int(row['Subdistt'])] = str(row['Name']).strip()

        # 3. Villages
        v_df = df[df['Level'] == 'VILLAGE']
        print(f"  Extracted {len(v_df)} village records for district {legacy_dist_name}")

        for _, row in v_df.iterrows():
            sub_code = int(row['Subdistt']) if pd.notnull(row['Subdistt']) else None
            m_name = mandal_names_by_code.get(sub_code, "UNKNOWN")
            norm_m = normalize_name(m_name)

            curr_dname = ""
            curr_did = ""
            status = "UNMATCHED_MANDAL"

            if norm_m in spatial_map:
                curr_dname = spatial_map[norm_m]['current_district_name']
                curr_did = spatial_map[norm_m]['current_district_id']
                status = "MATCHED_DIRECT"
            elif norm_m in KNOWN_SPELLING_ALIASES:
                alias = KNOWN_SPELLING_ALIASES[norm_m]
                norm_alias = normalize_name(alias)
                if norm_alias in spatial_map:
                    curr_dname = spatial_map[norm_alias]['current_district_name']
                    curr_did = spatial_map[norm_alias]['current_district_id']
                    status = "MATCHED_ALIAS_NEEDS_VALIDATION"
            else:
                # Substring / partial word fallback check
                for sm_norm, sm_val in spatial_map.items():
                    if len(norm_m) >= 5 and (norm_m in sm_norm or sm_norm in norm_m):
                        curr_dname = sm_val['current_district_name']
                        curr_did = sm_val['current_district_id']
                        status = "MATCHED_ALIAS_NEEDS_VALIDATION"
                        break

            all_village_records.append({
                "village_code": str(row['Town/Village']).strip(),
                "village_name": str(row['Name']).strip(),
                "legacy_district_code": int(row['District']),
                "legacy_district_name": legacy_dist_name,
                "mandal_code": sub_code,
                "mandal_name": m_name,
                "population_total": int(row['TOT_P']) if pd.notnull(row['TOT_P']) else 0,
                "population_male": int(row['TOT_M']) if pd.notnull(row['TOT_M']) else 0,
                "population_female": int(row['TOT_F']) if pd.notnull(row['TOT_F']) else 0,
                "population_0_6": int(row['P_06']) if pd.notnull(row['P_06']) else 0,
                "population_0_6_male": int(row['M_06']) if pd.notnull(row.get('M_06')) else 0,
                "population_0_6_female": int(row['F_06']) if pd.notnull(row.get('F_06')) else 0,
                "population_sc": int(row['P_SC']) if pd.notnull(row['P_SC']) else 0,
                "population_st": int(row['P_ST']) if pd.notnull(row['P_ST']) else 0,
                "households": int(row['No_HH']) if pd.notnull(row['No_HH']) else 0,
                "workers": int(row['TOT_WORK_P']) if pd.notnull(row['TOT_WORK_P']) else 0,
                "non_workers": int(row['NON_WORK_P']) if pd.notnull(row.get('NON_WORK_P')) else (int(row['TOT_P']) - int(row['TOT_WORK_P']) if pd.notnull(row.get('TOT_P')) and pd.notnull(row.get('TOT_WORK_P')) else 0),
                "current_district_code": curr_did,
                "current_district_name": curr_dname,
                "crosswalk_status": status,
                "data_year": 2011,
                "source": "Office of the Registrar General & Census Commissioner, India (Census 2011 Primary Census Abstract)"
            })

    output_csv = "data/processed/census/ap_village_demographics.csv"
    res_df = pd.DataFrame(all_village_records)
    res_df.to_csv(output_csv, index=False, encoding='utf-8')
    print(f"\nSuccessfully generated {output_csv} with {len(res_df)} total records.")

    # Summary
    print("\nCrosswalk Match Breakdown:")
    print(res_df['crosswalk_status'].value_counts(normalize=True).mul(100).round(2).astype(str) + '%')
    print(res_df['crosswalk_status'].value_counts())

if __name__ == "__main__":
    process_census_pca()
