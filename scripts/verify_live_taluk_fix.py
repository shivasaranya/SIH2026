import urllib.request
import json
import time

base = 'http://127.0.0.1:8000/api/demographics/mandal'

def get(path):
    req = urllib.request.Request(f'{base}/{path}')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

# 1. Ulundurpettai by ID
r1 = get('TN_TALUK_065/villages?state_id=tamil_nadu&district_id=kallakurichi')
print('1. TN_TALUK_065 (Ulundurpettai):')
print('   total_villages:', r1.get('total_villages'), 'has_data:', r1.get('has_village_data'))
print('   mandal_name:', r1.get('mandal_name'), 'note:', r1.get('note'))
sample = r1.get('villages', [])[0] if r1.get('villages') else {}
print('   sample village:', sample.get('village_name'), 'code:', sample.get('village_code'), 'pop:', sample.get('population_total'))

# 2. Unnurpettai by name/alias
r2 = get('Unnurpettai/villages?state_id=tamil_nadu')
print('\n2. Unnurpettai (name/alias):')
print('   total_villages:', r2.get('total_villages'), 'mandal_name:', r2.get('mandal_name'))

# 3. 4+ other TN taluks
taluks = [
    ('TN_TALUK_001', 'Andimadam'),
    ('TN_TALUK_009', 'Walajabad'),
    ('TN_TALUK_030', 'Tittakudi'),
    ('TN_TALUK_057', 'Perundurai'),
    ('TN_TALUK_265', 'Udumalaipettai')
]
print('\n3. Other TN Taluks:')
for tid, name in taluks:
    res = get(f'{tid}/villages?state_id=tamil_nadu')
    print(f'   {tid} ({name}): total_villages = {res.get("total_villages")}, has_data = {res.get("has_village_data")}')

# 4. AP village lookup regression
print('\n4. AP Regression:')
r_ap1 = get('AP_MANDAL_001/villages?state_id=andhra_pradesh')
print('   AP_MANDAL_001: total_villages =', r_ap1.get('total_villages'), 'has_data =', r_ap1.get('has_village_data'))

r_ap2 = get('Tadepalligudem/villages?district_id=West+Godavari')
print('   Tadepalligudem: total_villages =', r_ap2.get('total_villages'), 'has_data =', r_ap2.get('has_village_data'))

# 5. Spatial Hazard Analysis on sample TN village
vcode = sample.get('village_code')
if vcode:
    req_v = urllib.request.Request(f'http://127.0.0.1:8000/api/village/{vcode}')
    with urllib.request.urlopen(req_v) as resp:
        v_res = json.loads(resp.read().decode('utf-8'))
        print(f'\n5. TN Village {vcode} Analysis:')
        print('   village_name:', v_res.get('village_name'), 'sectors count:', len(v_res.get('sectors', [])))
        print('   area_preservation_verified:', v_res.get('area_preservation_verified'))

print('\n=== ALL CHECKS COMPLETE ===')
