import os
import glob
import pandas as pd
import json

census_files = sorted(glob.glob('data/raw/census/*.xlsx'))
print(f"Total Census PCA files found: {len(census_files)}")

# Collect all sub-districts from Census files
census_mandals = []
census_villages_count = 0

for cfile in census_files:
    filename = os.path.basename(cfile)
    df = pd.read_excel(cfile)
    
    # Sub-districts
    sub_df = df[df['Level'] == 'SUB-DISTRICT'][['State', 'District', 'Subdistt', 'Name', 'TRU']].drop_duplicates()
    sub_total = sub_df[sub_df['TRU'] == 'Total']
    
    # Villages
    v_df = df[df['Level'] == 'VILLAGE']
    census_villages_count += len(v_df)
    
    for _, row in sub_total.iterrows():
        census_mandals.append({
            "state_code": row['State'],
            "legacy_dist_code": row['District'],
            "mandal_code": row['Subdistt'],
            "mandal_name": str(row['Name']).strip().upper(),
            "source_file": filename
        })

print(f"Total Census Mandals extracted: {len(census_mandals)}")
print(f"Total Census Villages extracted across all 13 files: {census_villages_count}")

# Check sample Census mandals
print("\nSample Census Mandals (first 10):")
for m in census_mandals[:10]:
    print(f"  [{m['mandal_code']}] {m['mandal_name']} (Legacy Dist: {m['legacy_dist_code']})")
