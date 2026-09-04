import os
import pandas as pd

def validate_census_csv(filepath):
    print("="*60)
    print(f"VALIDATING CENSUS DEMOGRAPHICS: {filepath}")
    print("="*60)

    if not os.path.exists(filepath):
        print(f"Error: File does not exist: {filepath}")
        return False

    size_mb = os.path.getsize(filepath) / (1024 * 1024)
    print(f"File Size: {size_mb:.2f} MB")

    df = pd.read_csv(filepath)
    total_records = len(df)
    print(f"Total Records: {total_records}")

    # 1. Unique and Duplicate Village Codes
    unique_codes = df['village_code'].nunique()
    duplicate_codes = total_records - unique_codes
    print(f"Unique Village Codes: {unique_codes}")
    print(f"Duplicate Village Codes: {duplicate_codes}")

    # 2. Missing Identifiers and Population
    missing_vcode = df['village_code'].isnull().sum()
    missing_vname = df['village_name'].isnull().sum()
    missing_pop = df['population_total'].isnull().sum()
    print(f"Missing Village Code: {missing_vcode}")
    print(f"Missing Village Name: {missing_vname}")
    print(f"Missing Total Population: {missing_pop}")

    # 3. Negative / Impossible Demographic Values
    neg_pop = (df['population_total'] < 0).sum()
    neg_m = (df['population_male'] < 0).sum()
    neg_f = (df['population_female'] < 0).sum()
    neg_06 = (df['population_0_6'] < 0).sum()
    neg_sc = (df['population_sc'] < 0).sum()
    neg_st = (df['population_st'] < 0).sum()
    neg_hh = (df['households'] < 0).sum()
    neg_workers = (df['workers'] < 0).sum()
    total_neg = neg_pop + neg_m + neg_f + neg_06 + neg_sc + neg_st + neg_hh + neg_workers
    print(f"Negative Demographic Values: {total_neg}")

    # 4. Population Consistency: Male + Female == Total Population
    gender_diff = (df['population_male'] + df['population_female']) - df['population_total']
    gender_mismatches = (gender_diff != 0).sum()
    print(f"Population Gender Consistency Mismatches (Male + Female != Total): {gender_mismatches}")

    # 5. SC / ST vs Total Population
    sc_exceeds = (df['population_sc'] > df['population_total']).sum()
    st_exceeds = (df['population_st'] > df['population_total']).sum()
    sc_st_sum_exceeds = ((df['population_sc'] + df['population_st']) > df['population_total']).sum()
    print(f"SC > Total Population Violations: {sc_exceeds}")
    print(f"ST > Total Population Violations: {st_exceeds}")
    print(f"SC + ST > Total Population Violations: {sc_st_sum_exceeds}")

    # 6. 0-6 Population vs Total Population
    p06_exceeds = (df['population_0_6'] > df['population_total']).sum()
    print(f"0-6 Age > Total Population Violations: {p06_exceeds}")

    # 7. Administrative Entities Represented
    districts_rep = df['current_district_name'].replace('', pd.NA).dropna().nunique()
    legacy_dist_rep = df['legacy_district_name'].nunique()
    mandals_rep = df['mandal_code'].nunique()
    print(f"Legacy Districts Represented: {legacy_dist_rep}")
    print(f"Current 26 Districts Represented: {districts_rep}")
    print(f"Mandals Represented: {mandals_rep}")

    # 8. Crosswalk Match Breakdown
    status_counts = df['crosswalk_status'].value_counts()
    status_pct = df['crosswalk_status'].value_counts(normalize=True) * 100
    print("\nCrosswalk Status Breakdown:")
    for status, count in status_counts.items():
        pct = status_pct[status]
        print(f"  {status}: {count} ({pct:.2f}%)")

    matched_total = df['crosswalk_status'].str.startswith('MATCHED').sum()
    unmatched_total = (df['crosswalk_status'] == 'UNMATCHED_MANDAL').sum()
    print(f"\nTotal Crosswalk Matched: {matched_total} ({(matched_total/total_records)*100:.2f}%)")
    print(f"Total Crosswalk Unmatched: {unmatched_total} ({(unmatched_total/total_records)*100:.2f}%)")

    # 9. Total Population Summary
    tot_pop_state = df['population_total'].sum()
    tot_sc = df['population_sc'].sum()
    tot_st = df['population_st'].sum()
    tot_hh = df['households'].sum()
    print(f"\nState-Wide Aggregations:")
    print(f"  Total Rural/Village Population: {tot_pop_state:,}")
    print(f"  Total SC Population: {tot_sc:,} ({(tot_sc/tot_pop_state)*100:.2f}%)")
    print(f"  Total ST Population: {tot_st:,} ({(tot_st/tot_pop_state)*100:.2f}%)")
    print(f"  Total Households: {tot_hh:,}")

    return True

if __name__ == "__main__":
    validate_census_csv("data/processed/census/ap_village_demographics.csv")
