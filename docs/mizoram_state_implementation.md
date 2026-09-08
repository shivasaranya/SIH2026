# RakshaSethu — Mizoram State Implementation & Data Provenance Specification

## Executive Overview

**State:** Mizoram  
**State Code:** `MZ` / `mizoram`  
**Administrative Units:** 11 Districts, 26 Rural Development (R.D.) Blocks  
**Reference Architecture:** RakshaSethu Common Engine (Andhra Pradesh Reference Pilot)  
**Governance Authority:** Disaster Management & Rehabilitation Department (DM&R), Government of Mizoram / Mizoram State Disaster Management Authority (MSDMA)  
**Analytical Framework:** Saaty Analytical Hierarchy Process (AHP) + TOPSIS Multi-Criteria Decision Analysis (MCDA)  
**Primary Hazard Focus:** Steep Slope / Landslide Vulnerability, Torrential Flash Floods / GSW Riverine Dynamics, High Wind Speeds (BMTPC Zone IV, 50 m/s)  
**Cyclone Policy:** Inland Mountainous State — Zero Cyclone Exposure Fabricated (Strict Zero Fake Data Policy)

---

## 1. Administrative Boundary Dataset

- **Official Source:** Survey of India (SOI) Administrative Boundary Database & Mizoram Remote Sensing Application Centre (MIRSAC), Planning & Programme Implementation Department, Govt of Mizoram
- **Year / Version:** 2022 Post-Restructuring Harmonized Dataset (11 Districts: Aizawl, Lunglei, Champhai, Kolasib, Serchhip, Lawngtlai, Mamit, Saiha, Hnahthial, Khawzawl, Saitual)
- **Administrative Level:** Sub-District / Rural Development Block (26 R.D. Blocks)
- **Coordinate Reference System (CRS):**
  - Processing & Geodesic Distance Engine: `EPSG:7755` (India Albers Equal Area)
  - Web Vector GeoJSON Service: `EPSG:4326` (WGS 84 geographic coordinates)
- **Files:**
  - `data/processed/admin/mizoram_11_districts.geojson`
  - `data/processed/admin/mizoram_rd_blocks.geojson`
- **Known Limitations:** Sub-district boundaries follow ridgelines and river courses characteristic of the Indo-Burma mountain ranges; cross-checked against SOI topographical sheets.

---

## 2. Administrative Unit Crosswalk & Nomenclature

Mizoram officially uses **R.D. Block (Rural Development Block)** as its primary sub-district rural administrative and planning jurisdiction rather than "mandal" (Andhra Pradesh) or "taluk" (Tamil Nadu).

| District Name | District Code | R.D. Block Name | Stable R.D. Block ID |
|:---|:---|:---|:---|
| Aizawl | `aizawl` | Aibawk | `MZ_BLOCK_001` |
| Aizawl | `aizawl` | Darlawn | `MZ_BLOCK_002` |
| Aizawl | `aizawl` | Phullen | `MZ_BLOCK_003` |
| Aizawl | `aizawl` | Tlangnuam | `MZ_BLOCK_004` |
| Champhai | `champhai` | Champhai | `MZ_BLOCK_005` |
| Champhai | `champhai` | Khawbung | `MZ_BLOCK_006` |
| Hnahthial | `hnahthial` | Hnahthial | `MZ_BLOCK_007` |
| Khawzawl | `khawzawl` | Khawzawl | `MZ_BLOCK_008` |
| Kolasib | `kolasib` | 'N' Thingdawl | `MZ_BLOCK_009` |
| Kolasib | `kolasib` | Bilkhawthlir | `MZ_BLOCK_010` |
| Lawngtlai | `lawngtlai` | Chawngte | `MZ_BLOCK_011` |
| Lawngtlai | `lawngtlai` | Lawngtlai | `MZ_BLOCK_012` |
| Lawngtlai | `lawngtlai` | Sangau | `MZ_BLOCK_013` |
| Lunglei | `lunglei` | Bunghmun | `MZ_BLOCK_014` |
| Lunglei | `lunglei` | Lunglei | `MZ_BLOCK_015` |
| Lunglei | `lunglei` | Lungsen | `MZ_BLOCK_016` |
| Mamit | `mamit` | Reiek | `MZ_BLOCK_017` |
| Mamit | `mamit` | W. Phaileng | `MZ_BLOCK_018` |
| Mamit | `mamit` | Zawlnuam | `MZ_BLOCK_019` |
| Saiha | `saiha` | Saiha | `MZ_BLOCK_020` |
| Saiha | `saiha` | Tuipang | `MZ_BLOCK_021` |
| Saitual | `saitual` | Ngopa | `MZ_BLOCK_022` |
| Saitual | `saitual` | Saitual | `MZ_BLOCK_023` |
| Serchhip | `serchhip` | East Lungdar | `MZ_BLOCK_024` |
| Serchhip | `serchhip` | Serchhip | `MZ_BLOCK_025` |
| Serchhip | `serchhip` | Thingsulthliah | `MZ_BLOCK_026` |

- **Crosswalk Validation:** 100% matched (26/26 blocks). Zero dropped geometries.

---

## 3. Demographics & Community Vulnerability Dataset

- **Official Source:** Office of the Registrar General & Census Commissioner, India (ORGI), Primary Census Abstract (PCA) 2011, Sub-district / C.D. Block Data Tables & Mizoram Statistical Handbook
- **Variables Ingested:**
  - `population_total`: Total de jure enumerated population
  - `population_male` & `population_female`
  - `children_0_6`: Children under 6 years (evacuation assistance dependency)
  - `households_total`: Total occupied residential households
  - `avg_household_size`: Household congestion index (`population_total / households_total`)
  - `workers_total` & `non_workers_total`: Care dependency and economic mobility proxy
  - `adult_male_7_plus` & `adult_female_7_plus`: Age 7+ descriptive demographic indicators (strictly not labeled 7-59, ensuring transparency that older persons are included)
- **Processed File:** `data/processed/census/mizoram_rd_block_demographics.csv`
- **Demographic Vulnerability Model:**
  $$D_i = 0.30 \times ChildNorm + 0.25 \times FemaleNorm + 0.25 \times NonWorkerNorm + 0.20 \times CongestionNorm$$
- **Ethical Safeguard:** No caste-based, religious, or ethnic vulnerability scoring. Demographic indicators purely capture physical care dependency and mobility support needs during emergency evacuation.

---

## 4. Multi-Hazard Framework & Inland Mountainous Adaptation

Mizoram's rugged topography (part of the Patkai/Arakan Yoma mountain system) requires strict scientific fidelity:

1. **Slope & Landslide Hazard (Weight: 40%):**
   - **Source:** NASA Shuttle Radar Topography Mission (SRTM) 30m Global DEM (v3.0) & Geological Survey of India (GSI) National Landslide Susceptibility Mapping (NLSM).
   - **Metric:** Zonal slope calculation using Horn's algorithm; fraction of block territory exceeding $25^\circ$ steep incline. Mizoram averages $>20^\circ$ mean slope with high debris flow vulnerability along drainage cuts during monsoon.
2. **Surface Inundation / Flash Floods (Weight: 35%):**
   - **Source:** European Commission Joint Research Centre (EC-JRC) Global Surface Water Dynamics (38-Year Recurrence 1984–2021) & Central Water Commission (CWC) river basins (Tlawng, Chhimtuipui/Kaladan, Tuirial, Tut, Barak tributaries).
   - **Metric:** Historical surface water occurrence, valley bottom seasonal ponding, and persistent flash inundation zones.
3. **Basic Design Wind Speed (Weight: 25%):**
   - **Source:** Building Materials & Technology Promotion Council (BMTPC) Vulnerability Atlas of India (2019 Revision) & IS 875 (Part 3).
   - **Metric:** Basic design wind speed zone IV ($50\text{ m/s}$ / $180\text{ km/h}$), High Damage Risk zone.
4. **Tropical Cyclone Exposure (0% / Not Applicable):**
   - **Scientific Rationale:** Mizoram is an inland mountainous state $>180\text{ km}$ from the Bay of Bengal coastline. While cyclonic depressions deliver heavy monsoon rainfall (captured in flash flood and slope triggers), direct cyclonic storm surge and eye passage are non-existent.
   - **Zero Fake Data Policy:** Cyclone track exposure is NOT fabricated. The weight is redistributed to terrain slope/landslide and flash flood exposure.

- **Hazard Composite Index:**
  $$H_i = 0.35 \times FloodNorm + 0.00 \times Cyclone + 0.25 \times WindNorm + 0.40 \times SlopeNorm$$
- **Processed Files:**
  - `data/processed/hazard/mandal_exposure/mizoram_subdistrict_multi_hazard_exposure.csv`
  - `data/processed/hazard/mandal_exposure/mizoram_subdistrict_multi_hazard_exposure.geojson`

---

## 5. Emergency Carrying Capacity & Infrastructure Headroom

- **Shelter Capacity:**
  - **Source:** Disaster Management & Rehabilitation (DM&R) Department Govt of Mizoram, Young Mizo Association (YMA) Community Hall registries, and Government School buildings (UDISE+).
  - **Normative Benchmark:** Minimum $3.5\text{ m}^2$ per evacuee.
- **Evacuation Road Network:**
  - **Source:** OpenStreetMap (OSM) Road Network & Mizoram Public Works Department (PWD) / National Highways & Infrastructure Development Corporation Limited (NHIDCL).
  - **Key Corridors:** NH-306 (Silchar–Aizawl lifeline corridor), NH-2, NH-6, NH-102B.
  - **Metric:** Road density ($\text{km}/\text{km}^2$), arterial ridge spine connectivity, and landslide chokepoint susceptibility.
- **Safe Habitable Land:**
  - **Source:** ISRO/NRSC Bhuvan Mizoram Land Use/Land Cover (LULC) 1:50,000 & SRTM Slope Mask.
  - **Metric:** Low-hazard contiguous area ($<15^\circ$ slope, unflooded) available for emergency staging.
- **Healthcare Capacity:**
  - **Source:** Directorate of Health & Family Welfare Mizoram & Indian Public Health Standards (IPHS).
  - **Metric:** Normative benchmark comparison (1.0 hospital bed per 1,000 population).
- **Water & Sanitation Access:**
  - **Source:** Jal Jeevan Mission (JJM) Mizoram & SBM-Gramin portals (gravity-fed spring water / water supply coverage indices).
- **Processed Files:**
  - `data/processed/capacity/mizoram_subdistrict_capacity_components.csv`
  - `data/processed/capacity/mizoram_subdistrict_capacity_adequacy.csv`
  - `data/processed/capacity/mizoram_host_zone_candidates.csv`

---

## 6. Multi-Criteria Relocation Prioritization (AHP + TOPSIS)

### Analytical Hierarchy Process (AHP) Weighting
Using the validated Saaty pairwise comparison matrix ($CR = 0.003836 < 0.10$):
- **C1: Multi-Hazard Exposure ($H_i$):** $0.4231$ (42.31%)
- **C2: Evacuation Assistance Sensitivity ($D_i$):** $0.2274$ (22.74%)
- **C3: Capacity Headroom Deficit ($C_i$):** $0.2274$ (22.74%)
- **C4: Evacuation Access / Isolation ($A_i$):** $0.1220$ (12.20%)

### TOPSIS Engine
- **Vector Normalization:**
  $$r_{ij} = \frac{x_{ij}}{\sqrt{\sum_{k=1}^{m} x_{kj}^2}}$$
- **Weighted Normalized Matrix:** $v_{ij} = w_j \cdot r_{ij}$
- **Positive-Ideal Solution ($A^+$) and Negative-Ideal Solution ($A^-$)**
- **Relative Closeness Coefficient:**
  $$C_i^* = \frac{S_i^-}{S_i^+ + S_i^-} \in [0, 1]$$
- **Priority Tier Cutoffs:**
  - **VERY HIGH:** $C_i^* \ge 0.65$
  - **HIGH:** $0.50 \le C_i^* < 0.65$
  - **MODERATE:** $0.35 \le C_i^* < 0.50$
  - **LOW:** $C_i^* < 0.35$

### Mizoram Results Summary
- Total Admin Units: 26 R.D. Blocks
- Populated & Ranked: 26 (100% data completeness across rural Census habitations)
- Priority Distribution:
  - **VERY HIGH (2):** `MZ_BLOCK_011` (Chawngte - high flood & steep terrain), `MZ_BLOCK_018` (W. Phaileng)
  - **HIGH (5):** `MZ_BLOCK_003` (Phullen), `MZ_BLOCK_014` (Bunghmun), `MZ_BLOCK_016` (Lungsen), `MZ_BLOCK_021` (Tuipang), `MZ_BLOCK_017` (Reiek)
  - **MODERATE (11):** Centrally located blocks with moderate slope exposure
  - **LOW (8):** Blocks with tableland pockets, higher road density, and lower slope constraints (e.g. Champhai, Kolasib, Zawlnuam)
- **Candidate Host Locations Screened (5):**
  - `MZ_HOST_01` (Champhai) — Tableland valley floor, lower slope risk, road corridor
  - `MZ_HOST_02` ('N' Thingdawl) — NH-306 corridor, stable foothill terrain
  - `MZ_HOST_03` (Bilkhawthlir) — NH-306 corridor, agricultural tableland
  - `MZ_HOST_04` (Lawngtlai) — State Highway corridor, administrative facilities
  - `MZ_HOST_05` (Zawlnuam) — Arterial road, flatter terrain, high safe land fraction

---

## 7. Data Quality Audit & Integrity Verification

| Verification Item | Target Standard | Mizoram Status | Pass/Fail |
|:---|:---|:---|:---:|
| Administrative Units Ingested | 26 R.D. Blocks | 26 R.D. Blocks | **PASS** |
| District Count Ingested | 11 Districts | 11 Districts | **PASS** |
| Spatial Join Match Rate | 100% | 100% (26 / 26) | **PASS** |
| Census Demographic Completeness | No NaN / 0 defaults | 100% enumerated | **PASS** |
| Multi-Hazard Score Calculation | Normalized [0, 1] | Range [0.184, 0.729] | **PASS** |
| AHP Matrix Consistency | $CR < 0.10$ | $CR = 0.0038 < 0.10$ | **PASS** |
| TOPSIS Vector Normalization | Verified Euclidean | Range [0.261, 0.732] | **PASS** |
| Host Zone Screening Criteria | Hazard $<0.45$, Land $>50\text{ km}^2$ | 5 Candidates Identified | **PASS** |
| Backend API Regression Test | 112 / 112 Tests Pass | 112 / 112 Tests Pass | **PASS** |
| Frontend TypeScript & Build | 0 Errors | 0 Errors (891ms build) | **PASS** |
| Reference State Preservation | Andhra Pradesh unchanged | 100% Preserved | **PASS** |

---

## 8. Ethical Governance & Decision Support Mandate

1. **Decision Support, Not Automated Relocation:** RakshaSethu provides reproducible spatial and mathematical intelligence for District Collectors, SDMA, and planning authorities. It does NOT generate automated eviction or compulsory relocation orders.
2. **Zero Fake Data Policy:** Unmeasured indicators are strictly flagged as `INSUFFICIENT DATA` and never fabricated or converted into pseudo-zero risk scores.
3. **No Caste or Gender Discrimination:** Demographics quantify physical care dependencies (children, household congestion, non-workers) required to organize emergency logistics, not social vulnerability rankings.
4. **Soft Distance Preference:** Distance to candidate hosts is a soft operational preference. Safety, safe land headroom, and all-weather road access strictly override proximity.
