import urllib.request
import json
import os
from pathlib import Path

DATA_RAW_ADMIN = Path("data/raw/admin/tamil_nadu")
DATA_RAW_ADMIN.mkdir(parents=True, exist_ok=True)

adm2_path = DATA_RAW_ADMIN / "india_adm2.geojson"
adm3_path = DATA_RAW_ADMIN / "india_adm3.geojson"

headers = {'User-Agent': 'Mozilla/5.0'}

if not adm2_path.exists():
    print("Downloading ADM2 (Districts)...")
    url = "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IND/ADM2/geoBoundaries-IND-ADM2_simplified.geojson"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=60) as r, open(adm2_path, "wb") as f:
        f.write(r.read())
    print(f"Saved {adm2_path} ({adm2_path.stat().st_size / 1024 / 1024:.2f} MB)")
else:
    print(f"ADM2 exists ({adm2_path.stat().st_size / 1024 / 1024:.2f} MB)")

with open(adm2_path, "r", encoding="utf-8") as f:
    adm2 = json.load(f)

print(f"Total ADM2 features: {len(adm2['features'])}")
sample_props = adm2['features'][0]['properties']
print("ADM2 sample props:", sample_props)

tn_districts = []
for feat in adm2['features']:
    props = feat['properties']
    # Check shapeGroup, shapeName, or parent
    text = json.dumps(props).lower()
    if 'tamil nadu' in text or 'tamilnadu' in text or props.get('shapeGroup') == 'IND':
        # Let's inspect how Tamil Nadu is represented
        pass

print("Inspecting unique states in ADM2...")
states = set()
for feat in adm2['features']:
    props = feat['properties']
    for k, v in props.items():
        if isinstance(v, str) and ('tamil' in v.lower() or 'pradesh' in v.lower()):
            states.add((k, v))
print("Matched state props:", states)
