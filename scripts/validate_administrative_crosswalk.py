import os
import pandas as pd

def validate_crosswalk_file(filepath):
    print("="*60)
    print(f"VALIDATING ADMINISTRATIVE CROSSWALK: {filepath}")
    print("="*60)

    if not os.path.exists(filepath):
        print(f"Error: File does not exist: {filepath}")
        return False

    df = pd.read_csv(filepath)
    total = len(df)
    print(f"Total Crosswalk Rows: {total}")

    # Check required columns
    expected_cols = [
        "village_code", "village_name", "legacy_district_code", "legacy_district_name",
        "mandal_code", "mandal_name", "current_district_code", "current_district_name",
        "match_method", "match_confidence", "validation_status", "source", "notes"
    ]
    missing_cols = [c for c in expected_cols if c not in df.columns]
    print(f"Missing Required Columns: {missing_cols}")

    # Unique check
    unique_v = df['village_code'].nunique()
    print(f"Unique Village Codes: {unique_v} (Duplicates: {total - unique_v})")

    # Status breakdown
    print("\nValidation Status:")
    for status, count in df['validation_status'].value_counts().items():
        print(f"  {status}: {count} ({(count/total)*100:.2f}%)")

    # Match Confidence
    print("\nMatch Confidence:")
    for conf, count in df['match_confidence'].value_counts().items():
        print(f"  {conf}: {count} ({(count/total)*100:.2f}%)")

    # Match Method
    print("\nMatch Method:")
    for m, count in df['match_method'].value_counts().items():
        print(f"  {m}: {count} ({(count/total)*100:.2f}%)")

    # Check 26 current districts represented
    curr_districts = df['current_district_name'].dropna().unique()
    print(f"\nCurrent 26 Districts Represented: {len(curr_districts)}")

    # Check for empty current district when status is VERIFIED
    verified_missing = df[(df['validation_status'] == 'VERIFIED') & (df['current_district_name'].isnull() | (df['current_district_name'] == ''))]
    print(f"Verified Records Missing Current District: {len(verified_missing)}")

    print("\nSample Crosswalk Records:")
    print(df[['village_name', 'mandal_name', 'legacy_district_name', 'current_district_name', 'validation_status']].head(5))

    return True

if __name__ == "__main__":
    validate_crosswalk_file("data/processed/census/ap_administrative_crosswalk.csv")
