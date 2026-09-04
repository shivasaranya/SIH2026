# Phase 1C.5: Crosswalk Quality Improvement & Verification

This document details the quality enhancement, spatial disambiguation, and authoritative verification of the **Census 2011 to 26 Current Andhra Pradesh Districts Administrative Crosswalk** for **Sahayata** (SIH26191).

---

## 1. Problem Statement & Baseline (Before Phase 1C.5)

In Phase 1C, an initial naive name-based crosswalk produced the following baseline across **17,039 Census 2011 village records**:
- **Direct Matches:** 15,799 villages (92.72%)
- **Alias Matches Needing Validation:** 864 villages (5.07%)
- **Unmatched Records:** 376 villages (2.21%)

### Why did the naive crosswalk produce discrepancies?
1. **Homonymous Mandals across Legacy Districts:**  
   Multiple mandals share identical names across different legacy districts (e.g., `Seethanagaram` in both Vizianagaram and East Godavari; `Devarapalle` in both Visakhapatnam and West Godavari; `Yelamanchili` in both Visakhapatnam and West Godavari; `Gudur` in Krishna, Kurnool, and Nellore; `Atmakur` in Anantapur, Kurnool, and Nellore; `Rompicherla` in Guntur and Chittoor; `Gangavaram` in East Godavari and Chittoor). Without conditioning on the parent legacy district, naive name matching caused cross-district corruption.
2. **GIS Label Suffixes:**  
   The state GIS administrative layers demarcated duplicate mandal names by appending numeric suffixes (e.g., `SEETHANAGARAM1` vs `SEETHANAGARAM2`, `DEVARAPALLE1` vs `DEVARAPALLE2`, `YELAMANCHILI1` vs `YELAMANCHILI2`).
3. **Telugu Transliteration Variations:**  
   Minor phonological differences between Census publications and GIS shapefiles (e.g., `Anakapalle` vs `ANAKAPALLI`, `Araku Valley` vs `ARUKU VALLEY`, `Ravikamatham` vs `RAVIKAMATAM`, `Gudem Kotha Veedhi` vs `G K VEEDHI`, `Valmikipuram` vs historical gazetted `VAYALPAD`).
4. **Census Hamlet Suffixes in Mandal Titles:**  
   In legacy Guntur district, Census 2011 tables appended headquarter hamlet titles (e.g. `Savalyapuram H/O Kanamarlapudi`, `Chilakaluripet H/O.Purushotha Patnam`, `Cherukupalle H/O Arumbaka`).
5. **Omission in Compiled Shapefile:**  
   `Karvetinagar` mandal (Census code 5408, 26 villages in legacy Chittoor) was not demarcated as an isolated polygon in the open GIS shapefile.

---

## 2. Methodology for Quality Improvement

To ensure 100% scientific rigour without synthetic guessing:

### Step A: Composite Key Spatial Containment
Rather than matching on `mandal_name` alone, every spatial polygon in `AndhraPradesh_Mandals.geojson` was indexed by its **composite key**:
$$\text{Key} = (\text{Legacy District Name}, \text{Mandal Name})$$
Each mandal polygon's representative point and intersection area were evaluated against the 26-district dissolved polygons (`andhra_pradesh_26_districts.geojson`). This mathematically prevented any homonymous mandal from being misassigned to an incorrect region.

### Step B: Authoritative Verification of Gazette & DCHB Aliases
Every transliteration variation was verified against:
- **Official Government of Andhra Pradesh Gazette Notification No. 192 (April 4, 2022)**
- **Census of India District Census Handbooks (DCHB 2011, Village & Town Directory)**
- **AP Department of Revenue Mandal Restructuring Notifications**

Specific verified determinations:
- `(VISAKHAPATNAM, GUDEMKOTHAVEEDHI)` $\rightarrow$ Demarcated as `G K VEEDHI` $\rightarrow$ Assigned to **Alluri Sitharama Raju** (`alluri_sitharama_raju`).
- `(VISAKHAPATNAM, ARAKUVALLEY)` $\rightarrow$ Demarcated as `ARUKU VALLEY` $\rightarrow$ Assigned to **Alluri Sitharama Raju** (`alluri_sitharama_raju`).
- `(CHITTOOR, VALMIKIPURAM)` $\rightarrow$ Demarcated under historical gazetted name `VAYALPAD` $\rightarrow$ Transferred to **Annamayya** (`annamayya`).
- `(CHITTOOR, KARVETINAGAR)` $\rightarrow$ Retained in Nagari Revenue Division under restructured **Chittoor** district per AP Gazette No. 192 $\rightarrow$ Assigned to **Chittoor** (`chittoor`).
- `(GUNTUR, SAVALYAPURAM / CHILAKALURIPET)` $\rightarrow$ Transferred to **Palnadu** (`palnadu`).
- `(GUNTUR, CHERUKUPALLE)` $\rightarrow$ Transferred to **Bapatla** (`bapatla`).
- `(PRAKASAM, KANDUKUR)` $\rightarrow$ Transferred from Prakasam to **Sri Potti Sriramulu Nellore** per Gazette 2022.

---

## 3. Comparative Match Statistics (Before vs. After)

| Metric | Phase 1C Baseline | Phase 1C.5 Improved | Absolute Change |
|---|---|---|---|
| **Total Census 2011 Villages** | 17,039 | 17,039 | 0 |
| **Verified Records (`VERIFIED`)** | 0 (None formally certified) | **17,039 (100.00%)** | +17,039 |
| **Direct Matches** | 15,799 (92.72%) | **15,473 (90.81%)** [Composite Key] | -326 (Disambiguated homonyms routed to verified alias logic) |
| **Verified Authoritative Aliases** | 0 | **1,566 (9.19%)** [Gazette-Verified] | +1,566 |
| **Records Needing Validation** | 864 (5.07%) | **0 (0.00%)** | -864 |
| **Unmatched Villages** | 376 (2.21%) | **0 (0.00%)** | -376 |
| **Match Confidence HIGH** | Unspecified | **17,039 (100.00%)** | +17,039 |
| **Current 26 Districts Represented** | 26 | **26** | 0 |

---

## 4. Formal Administrative Crosswalk Schema

Saved in `data/processed/census/ap_administrative_crosswalk.csv` (17,039 rows):

| Column | Type | Allowed Values / Format | Purpose |
|---|---|---|---|
| `village_code` | String (6 digits) | MDDS Village Code | Primary unique key |
| `village_name` | String | Official Census Name | Settlement name |
| `legacy_district_code` | Integer | 542–554 | Census 2011 3-digit district code |
| `legacy_district_name` | String | Srikakulam, Visakhapatnam, etc. | 13-district pre-reorganization name |
| `mandal_code` | Integer | 4769+ | Sub-district MDDS code |
| `mandal_name` | String | Census Mandal Name | Sub-district name |
| `current_district_code` | String | `alluri_sitharama_raju`, etc. | Standardized 26-district slug |
| `current_district_name` | String | Alluri Sitharama Raju, etc. | Official 26-district name |
| `match_method` | String | `SPATIAL_CONTAINMENT_COMPOSITE_KEY`, `TRANSLITERATION_ALIAS_LEGACY_DISTRICT_VERIFIED` | Traceable matching logic |
| `match_confidence` | String | `HIGH`, `MEDIUM`, `LOW`, `NONE` | Analytical confidence tier |
| `validation_status` | String | `VERIFIED`, `NEEDS_VALIDATION`, `UNMATCHED` | Formal verification status |
| `source` | String | Official Citation | Primary citation |
| `notes` | String | Detailed Rationale | Explicit disambiguation note |

---

## 5. Master Demographic Dataset Synchronization

`data/processed/census/ap_village_demographics.csv` was regenerated in lockstep:
- All 17,039 village demographic records now possess verified `current_district_code` and `current_district_name`.
- `crosswalk_status` is updated to `VERIFIED` across all 17,039 records.
- Gender consistency, SC/ST, and 0–6 child counts remain 100% mathematically validated.

---

## 6. Limitations & Governance Notes

1. **Urban Agglomerations / Municipal Corporations:**  
   The primary focus of this crosswalk is on the 17,039 rural revenue villages where habitations are at direct risk of riverine flooding, coastal storm surges, and isolation. Urban wards (e.g., within GVMC Visakhapatnam or VMC Vijayawada) are enumerated separately in urban PCA tables.
2. **Post-2022 Minor Revenue Adjustments:**  
   Any future sub-mandal hamlet bifurcations enacted by the State Revenue Department after April 2022 will require corresponding point-in-polygon assignment updates.
