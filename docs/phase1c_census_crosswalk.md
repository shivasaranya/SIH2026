# Phase 1C: Census 2011 Demographic Data & Administrative Crosswalk

This document records the official acquisition, structure, crosswalk methodology, and empirical validation of the **Census of India 2011 Primary Census Abstract (PCA)** for all villages across Andhra Pradesh in support of **Sahayata** (SIH26191).

---

## 1. Provenance & Distinction of Data Assets

To maintain scientific integrity, the project strictly distinguishes between the data assets utilized:

1. **Official Census of India Demographic Data:**
   - **Custodian:** Office of the Registrar General & Census Commissioner, India (Ministry of Home Affairs).
   - **Source Portal:** National Data Archive (NADA) at `https://censusindia.gov.in/nada/index.php/catalog/`.
   - **Asset:** Primary Census Abstract (Town and Village Level — Series `PC11_PCA-TV`), Tables `DDW_PCA2811` through `DDW_PCA2823`.
   - **Integrity:** Directly downloaded original government Excel sheets preserved unmodified in `data/raw/census/`.

2. **Official APSAC Administrative Geometries:**
   - **Custodian:** Andhra Pradesh Space Applications Centre (APSAC), ITE&C Dept, Govt. of AP.
   - **Asset:** OGC Web Map Services (`https://apsac.ap.gov.in/geoserver/gatishakti1/wms`) delivering live rendered boundary tiles for the 26 districts and mandals.
   - **Usage:** Serves as the authoritative visual basemap and spatial validation standard.

3. **Compiled Reorganization Vector Boundaries:**
   - **Custodian:** Government of Andhra Pradesh District Reorganization Gazette (April 4, 2022) & Election Commission of India compilation (`satishvmadala/andhrapradesh_opendata_locations`).
   - **Asset:** `data/processed/admin/andhra_pradesh_26_districts.geojson` (26 dissolved MultiPolygon features) and `data/raw/admin/AndhraPradesh_Mandals.geojson` (696 mandal polygons).

4. **Sahayata Crosswalk Engine:**
   - **Mechanism:** Dual-stage crosswalk linking Census MDDS sub-district hierarchies through spatial polygon containment against the 26 reorganized districts, with explicit traceability flags.

---

## 2. Census Datasets Acquired

Thirteen official district-level Primary Census Abstract (PCA-TV) tables covering all 13 pre-2022 districts of undivided/bifurcated Andhra Pradesh were acquired from the official Census NADA repository:

| District Code (MDDS) | Legacy District Name | Official Table ID | NADA Catalog ID | Download File Name | File Size |
|---|---|---|---|---|---|
| `2811` | Srikakulam | `PC11_PCA-TV-2811` | Catalog 6733 / Download 9810 | `DDW_PCA2811_2011_MDDS_with_UI.xlsx` | 978.7 KB |
| `2812` | Vizianagaram | `PC11_PCA-TV-2812` | Catalog 6734 / Download 9811 | `DDW_PCA2812_2011_MDDS_with_UI.xlsx` | 849.4 KB |
| `2813` | Visakhapatnam | `PC11_PCA-TV-2813` | Catalog 6735 / Download 9812 | `DDW_PCA2813_2011_MDDS_with_UI.xlsx` | 1,616.3 KB |
| `2814` | East Godavari | `PC11_PCA-TV-2814` | Catalog 6736 / Download 9813 | `DDW_PCA2814_2011_MDDS_with_UI.xlsx` | 918.5 KB |
| `2815` | West Godavari | `PC11_PCA-TV-2815` | Catalog 6737 / Download 9814 | `DDW_PCA2815_2011_MDDS_with_UI.xlsx` | 627.5 KB |
| `2816` | Krishna | `PC11_PCA-TV-2816` | Catalog 6738 / Download 9815 | `DDW_PCA2816_2011_MDDS_with_UI.xlsx` | 675.6 KB |
| `2817` | Guntur | `PC11_PCA-TV-2817` | Catalog 6739 / Download 9816 | `DDW_PCA2817_2011_MDDS_with_UI.xlsx` | 607.0 KB |
| `2818` | Prakasam | `PC11_PCA-TV-2818` | Catalog 6740 / Download 9817 | `DDW_PCA2818_2011_MDDS_with_UI.xlsx` | 689.0 KB |
| `2819` | Sri Potti Sriramulu Nellore | `PC11_PCA-TV-2819` | Catalog 6741 / Download 9818 | `DDW_PCA2819_2011_MDDS_with_UI.xlsx` | 700.2 KB |
| `2820` | Y.S.R. (Kadapa) | `PC11_PCA-TV-2820` | Catalog 6742 / Download 9819 | `DDW_PCA2820_2011_MDDS_with_UI.xlsx` | 680.2 KB |
| `2821` | Kurnool | `PC11_PCA-TV-2821` | Catalog 6743 / Download 9820 | `DDW_PCA2821_2011_MDDS_with_UI.xlsx` | 644.9 KB |
| `2822` | Anantapur | `PC11_PCA-TV-2822` | Catalog 6744 / Download 9821 | `DDW_PCA2822_2011_MDDS_with_UI.xlsx` | 675.6 KB |
| `2823` | Chittoor | `PC11_PCA-TV-2823` | Catalog 6745 / Download 9822 | `DDW_PCA2823_2011_MDDS_with_UI.xlsx` | 958.2 KB |

All 13 original files are preserved unmodified in `data/raw/census/`.

---

## 3. Administrative Identifiers (MDDS vs LGD)

> [!WARNING]
> **MDDS and LGD Codes are NOT Interchangeable.**
> - **MDDS (Metadata and Directory Services):** Created by the Registrar General of India for Census 2011. State code is 2 digits (`28`), district code is 3 digits (`542`–`554`), sub-district is 4–5 digits (`04769`+), and village code is a 6-digit numeric identifier (e.g. `579911`).
> - **LGD (Local Government Directory):** Maintained by the Ministry of Panchayati Raj for administrative governance, local panchayats, and newly formed mandals. LGD codes use an entirely different numbering system.
> - **Sahayata Policy:** The primary key for demographic enumeration remains the 6-digit MDDS village code (`village_code`).

---

## 4. Crosswalk Strategy: Census 2011 to 26 Current Districts

The challenge: Census 2011 is organized under 13 legacy districts, whereas Andhra Pradesh now comprises 26 districts (established April 4, 2022).

```
[ Census 2011 Village Record ] (Town/Village MDDS Code, Subdistt Code)
              │
              ▼
[ Census 2011 Sub-District ] (Mandal Name, Legacy District)
              │
              ▼
[ Spatial Containment against 26-District Geometries ]
  (Representative Point of Mandal Polygon inside 26-District Polygon)
              │
              ▼
[ Current 26-District Parent Assigned ]
  (current_district_code, current_district_name)
```

### Traceability Flags (`crosswalk_status`):
1. `MATCHED_DIRECT`: The mandal name normalized string matches a spatial mandal polygon that falls 100% inside one of the 26 districts.
2. `MATCHED_ALIAS_NEEDS_VALIDATION`: The mandal name matches via an explicit transliteration alias (e.g. `Anakapalle` vs `Anakapalli`, `Araku Valley` vs `Araku`). Flagged as requiring secondary validation.
3. `UNMATCHED_MANDAL`: Assigned when multiple homonymous mandals exist in different legacy districts (e.g. `Seethanagaram` in both Vizianagaram and East Godavari, `Devarapalle` in both Visakhapatnam and West Godavari), or where naming discrepancies prevent a definitive automated match. **No synthetic district is fabricated.**

---

## 5. Master Dataset Schema (`data/processed/census/ap_village_demographics.csv`)

| Field Name | Type | Description / Census Equivalent |
|---|---|---|
| `village_code` | String (6 digits) | MDDS Village Code (`Town/Village`) |
| `village_name` | String | Official census settlement name (`Name`) |
| `legacy_district_code` | Integer (3 digits) | Census 2011 District MDDS code (542–554) |
| `legacy_district_name` | String | Legacy district name (e.g., Srikakulam, Visakhapatnam) |
| `mandal_code` | Integer (4–5 digits) | Sub-district code (`Subdistt`) |
| `mandal_name` | String | Mandal name |
| `population_total` | Integer | Total resident population (`TOT_P`) |
| `population_male` | Integer | Total male population (`TOT_M`) |
| `population_female` | Integer | Total female population (`TOT_F`) |
| `population_0_6` | Integer | Child population age 0–6 (`P_06`) |
| `population_sc` | Integer | Scheduled Castes population (`P_SC`) |
| `population_st` | Integer | Scheduled Tribes population (`P_ST`) |
| `households` | Integer | Number of households (`No_HH`) |
| `workers` | Integer | Total worker population (`TOT_WORK_P`) |
| `current_district_code` | String | Normalized identifier in 26-district structure (e.g., `alluri_sitharama_raju`) |
| `current_district_name` | String | Official current district name (e.g., Alluri Sitharama Raju) |
| `crosswalk_status` | String | `MATCHED_DIRECT`, `MATCHED_ALIAS_NEEDS_VALIDATION`, or `UNMATCHED_MANDAL` |
| `data_year` | Integer | 2011 |
| `source` | String | Office of the Registrar General & Census Commissioner, India |

---

## 6. Comprehensive Validation Results

Executed via automated validation suite (`scripts/validate_census_demographics.py`):

| Metric | Result | Status |
|---|---|---|
| **Total Records** | **17,039 villages** | **PASSED** |
| **Unique Village Codes** | **17,039** | **PASSED** |
| **Duplicate Village Codes** | **0** | **PASSED** |
| **Missing Village Codes / Names** | **0** | **PASSED** |
| **Missing Population Values** | **0** | **PASSED** |
| **Negative / Impossible Demographic Values** | **0** | **PASSED** |
| **Gender Consistency (`TOT_M + TOT_F == TOT_P`)** | **0 mismatches (100.00% exact match)** | **PASSED** |
| **SC Population Violations (`P_SC <= TOT_P`)** | **0 violations** | **PASSED** |
| **ST Population Violations (`P_ST <= TOT_P`)** | **0 violations** | **PASSED** |
| **0–6 Child Population Violations (`P_06 <= TOT_P`)** | **0 violations** | **PASSED** |
| **Legacy Districts Represented** | **13** | **PASSED** |
| **Current 26 Districts Represented** | **26** | **PASSED** |
| **Mandals Represented** | **656** | **PASSED** |
| **Direct Crosswalk Matched (`MATCHED_DIRECT`)** | **15,799 records (92.72%)** | **PASSED** |
| **Alias Matched (`MATCHED_ALIAS_NEEDS_VALIDATION`)** | **864 records (5.07%)** | **FLAGGED FOR REVIEW** |
| **Unmatched Mandals (`UNMATCHED_MANDAL`)** | **376 records (2.21%)** | **DOCUMENTED** |
| **Total Crosswalk Matched** | **16,663 records (97.79%)** | **HIGH ACCURACY** |

### State-Wide Aggregate Totals (Rural / Village Level):
- **Total Village Population:** 34,776,389
- **Total Scheduled Castes (SC):** 6,750,210 (19.41%)
- **Total Scheduled Tribes (ST):** 2,293,102 (6.59%)
- **Total Rural Households:** 9,011,144

---

## 7. Analysis of Unmatched Mandals (376 Records / 2.21%)

The 376 unmatched records stem entirely from 9 homonymous or transliteration-discrepant mandals:
1. `Seethanagaram` (Vizianagaram, Code 4814) & `Seethanagaram` (East Godavari, Code 4896) — Homonymous mandal names in different legacy districts.
2. `Devarapalle` (Visakhapatnam, Code 4859) & `Devarapalle` (West Godavari, Code 4957) — Homonymous mandals.
3. `Yelamanchili` (Visakhapatnam, Code 4879) & `Yelamanchili` (West Godavari, Code 4989) — Homonymous mandals.
4. `Araku Valley` (Visakhapatnam, Code 4844) — Multi-word suffix variation.
5. `Ravikamatham` (Visakhapatnam, Code 4856) — Minor spelling difference.
6. `Karvetinagar` (Chittoor, Code 5408) — Delimitation boundary difference.

These records are preserved with their full census demographics and legacy district tags, but have `current_district_name` left unassigned and explicitly flagged `UNMATCHED_MANDAL` to avoid fabricating unverified spatial mappings.
