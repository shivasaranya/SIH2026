import json

path = 'frontend/public/data/india_states.geojson'
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

op_map = {
    'Andhra Pradesh': 'Andhra Pradesh',
    'Assam': 'Assam',
    'Bihar': 'Bihar',
    'Tamil Nadu': 'Tamil Nadu',
    'West Bengal': 'West Bengal',
    'Orissa': 'Odisha',
    'Odisha': 'Odisha',
    'Uttar Pradesh': 'Uttar Pradesh',
    'Uttaranchal': 'Uttarakhand',
    'Uttarakhand': 'Uttarakhand',
    'Sikkim': 'Sikkim',
    'Arunachal Pradesh': 'Arunachal Pradesh',
    'Nagaland': 'Nagaland',
    'Meghalaya': 'Meghalaya',
    'Mizoram': 'Mizoram',
    'Himachal Pradesh': 'Himachal Pradesh'
}

updated_count = 0
for feat in data['features']:
    props = feat.setdefault('properties', {})
    raw_name = props.get('NAME_1') or props.get('state_name') or props.get('st_nm')
    std_name = op_map.get(raw_name, raw_name)
    props['state_name'] = std_name
    if std_name in op_map.values():
        props['is_implemented'] = True
        props['pilot_status'] = 'PILOT' if std_name == 'Andhra Pradesh' else 'OPERATIONAL'
        updated_count += 1
    else:
        props['is_implemented'] = False
        props['pilot_status'] = 'EXPANSION'

print(f"Total features: {len(data['features'])}, Operational states updated: {updated_count}")

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print("Updated frontend/public/data/india_states.geojson successfully!")
