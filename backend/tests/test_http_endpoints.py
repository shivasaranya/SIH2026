import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

STATES = [
    "andhra_pradesh",
    "tamil_nadu",
    "tripura",
    "telangana",
    "rajasthan",
    "madhya_pradesh",
    "karnataka",
    "goa",
    "manipur"
]

ENDPOINTS = [
    "/api/demographics/summary",
    "/api/gis/districts",
    "/api/hazard/summary",
    "/api/vulnerability/summary",
    "/api/capacity/summary",
    "/api/relocation/summary",
    "/api/decision/summary",
]

print("==========================================================")
print("TESTING HTTP REST ENDPOINTS FOR ALL 8 STATES VIA FASTAPI")
print("==========================================================")

all_passed = True

for state_id in STATES:
    print(f"\n[TESTING STATE]: {state_id}")
    for endpoint in ENDPOINTS:
        url = f"{BASE_URL}{endpoint}?state_id={state_id}"
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    raw = response.read().decode('utf-8')
                    data = json.loads(raw)
                    data_preview = str(data)[:60].replace("\n", "")
                    print(f"  [PASS] {endpoint} -> HTTP 200 OK (preview: {data_preview}...)")
                else:
                    print(f"  [FAIL] {endpoint} -> HTTP {response.status} ERROR")
                    all_passed = False
        except Exception as e:
            print(f"  [FAIL] {endpoint} -> Request failed: {e}")
            all_passed = False

if all_passed:
    print("\n==========================================================")
    print("ALL 7 STATES REST API ENDPOINTS RETURNED HTTP 200 OK!")
    print("==========================================================")
else:
    print("\nSome endpoints failed!")
