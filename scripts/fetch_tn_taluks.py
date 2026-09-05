import urllib.request
import json
from pathlib import Path
import geopandas as gpd

DATA_RAW_ADMIN = Path("data/raw/admin/tamil_nadu")
DATA_RAW_ADMIN.mkdir(parents=True, exist_ok=True)
adm3_path = DATA_RAW_ADMIN / "india_adm3.geojson"

headers = {'User-Agent': 'Mozilla/5.0'}

if not adm3_path.exists():
    print("Downloading ADM3 (Taluks/Sub-districts)...")
    url = "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IND/ADM3/geoBoundaries-IND-ADM3_simplified.geojson"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=120) as r, open(adm3_path, "wb") as f:
        f.write(r.read())
    print(f"Saved {adm3_path} ({adm3_path.stat().st_size / 1024 / 1024:.2f} MB)")
else:
    print(f"ADM3 exists ({adm3_path.stat().st_size / 1024 / 1024:.2f} MB)")

print("Reading states and ADM3...")
states = gpd.read_file('data/processed/admin/india_states.geojson')
tn_state = states[states['NAME_1'] == 'Tamil Nadu']

adm3 = gpd.read_file(adm3_path)
print(f"Total ADM3 features: {len(adm3)}")

# Spatial join to find TN taluks
joined = gpd.sjoin(adm3, tn_state[['geometry']], how='inner', predicate='intersects')

tn_taluks = []
for idx, row in joined.iterrows():
    inter = row.geometry.intersection(tn_state.geometry.values[0])
    # Keep units with majority area inside TN (exclude external overlap)
    if inter.area / row.geometry.area > 0.5:
        tn_taluks.append(idx)

tn_gdf = adm3.loc[tn_taluks].copy()
print(f"Extracted {len(tn_gdf)} Tamil Nadu taluks!")
print("Sample taluk names:", tn_gdf['shapeName'].head(15).tolist())
