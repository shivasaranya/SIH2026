import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app
import pandas as pd

client = TestClient(app)

print("=== 1. CODE OVERLAP & DATA INTEGRITY ===")
df_ap = pd.read_csv(backend_dir.parent / "data/processed/gis/villages/ap_villages_index.csv")
df_tn = pd.read_csv(backend_dir.parent / "data/processed/gis/villages/tn_villages_index.csv")
ap_codes = set(df_ap["village_code"].astype(str))
tn_codes = set(df_tn["village_code"].astype(str))
overlap = ap_codes.intersection(tn_codes)
print(f"AP count: {len(df_ap)}, TN count: {len(df_tn)}, Code Overlap: {len(overlap)}")
assert len(overlap) == 0, "No cross-state village code overlap allowed!"

ap_code = int(df_ap.iloc[0]["village_code"])
ap_name = df_ap.iloc[0]["village_name"]
tn_code = int(df_tn.iloc[0]["village_code"])
tn_name = df_tn.iloc[0]["village_name"]

print(f"AP sample village: {ap_code} ({ap_name})")
print(f"TN sample village: {tn_code} ({tn_name})")

print("\n=== 2. AP VILLAGE ENDPOINTS ===")
endpoints = ["", "/geometry", "/hazards", "/sectors", "/scenario?increase=2.5", "/relocation-centers", "/pois"]
for ep in endpoints:
    url = f"/api/village/{ap_code}{ep}"
    r = client.get(url)
    label = ep if ep else "/summary"
    print(f"AP {label}: HTTP {r.status_code}")
    assert r.status_code == 200, f"AP endpoint {label} failed with {r.status_code}"

print("\n=== 3. TN VILLAGE ENDPOINTS ===")
for ep in endpoints:
    url = f"/api/village/{tn_code}{ep}"
    r = client.get(url)
    label = ep if ep else "/summary"
    print(f"TN {label}: HTTP {r.status_code}")
    assert r.status_code == 200, f"TN endpoint {label} failed with {r.status_code}"

print("\n=== 4. TN DETAIL VERIFICATION ===")
r_tn = client.get(f"/api/village/{tn_code}")
d_tn = r_tn.json()
print(f"TN Village Name: {d_tn.get('village_name')}")
print(f"TN District Name: {d_tn.get('district_name')}")
print(f"TN Sub-district Name: {d_tn.get('subdistrict_name')}")
print(f"TN Population: {d_tn.get('population_total')}")
print(f"TN Sectors: {len(d_tn.get('sectors', []))}")
print(f"TN Area Preservation: {d_tn.get('area_preservation_verified')}")
print(f"TN Hazard Composite: {d_tn.get('composite_hazard_score')}")

print("\n=== 5. DEMOGRAPHICS & SEARCH INTEGRITY ===")
# AP mandal search
r_ap_mandal = client.get("/api/demographics/mandal/AP_MANDAL_001/villages?state_id=andhra_pradesh")
print(f"AP mandal villages: {r_ap_mandal.status_code}, count={r_ap_mandal.json().get('total_villages')}")
assert r_ap_mandal.status_code == 200 and r_ap_mandal.json().get("total_villages") > 0

# TN taluk search
r_tn_taluk = client.get("/api/demographics/mandal/TN_TALUK_001/villages?state_id=tamil_nadu")
print(f"TN taluk villages: {r_tn_taluk.status_code}, count={r_tn_taluk.json().get('total_villages')}")
assert r_tn_taluk.status_code == 200 and r_tn_taluk.json().get("total_villages") == 38

print("\n=== ALL REGRESSION & VALIDATION AUDITS PASSED ===")
