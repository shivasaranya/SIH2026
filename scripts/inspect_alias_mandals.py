import pandas as pd

df = pd.read_csv('data/processed/census/ap_village_demographics.csv')
alias_df = df[df['crosswalk_status'] == 'MATCHED_ALIAS_NEEDS_VALIDATION']

print(f"Total alias matched records: {len(alias_df)}")
print("\nUnique mandals in alias matches:")
alias_mandals = alias_df[['legacy_district_name', 'mandal_name', 'mandal_code', 'current_district_name']].drop_duplicates()
print(f"Count of unique alias mandals: {len(alias_mandals)}")
for _, r in alias_mandals.iterrows():
    m_villages = len(alias_df[(alias_df['mandal_code'] == r['mandal_code']) & (alias_df['legacy_district_name'] == r['legacy_district_name'])])
    print(f"  Legacy: {r['legacy_district_name']} | Mandal: [{r['mandal_code']}] {r['mandal_name']} -> Current: {r['current_district_name']} ({m_villages} villages)")
