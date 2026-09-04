# Phase 3C — Capacity Adequacy, Bottleneck Analysis & Host-Zone Screening Report

**Project:** Sahayata (SIH26191)  
**Phase:** 3C — Capacity Adequacy, Bottleneck Analysis & Host-Zone Screening  
**Status:** PASS WITH LIMITATIONS  
**Scope:** All 696 Administrative Mandals across 26 Districts of Andhra Pradesh  
**Date:** September 2026  

---

## 1. Executive Summary

Phase 3C establishes the **Capacity Adequacy Evaluation**, **Physical Bottleneck Identification Engine**, and **Candidate Host-Zone Screening Layer** across all **696 administrative mandals** in Andhra Pradesh.

In strict accordance with project governance and scientific validation rules:
1. **No Single Collapsed "Carrying Capacity Index" Was Created:** Unrelated physical dimensions were not averaged into an unscientific single number.
2. **Identification of Limiting Resources:** The bottleneck engine preserves the distinct identity of the primary and secondary physical resource bottlenecks for every mandal.
3. **Missing-Data Fairness:** Missing components (such as inland mandals without designated cyclone shelters) are excluded from bottleneck ranking so unacquired data is never penalized as a physical zero.
4. **Candidate Host-Zone Screening (Human-in-the-Loop):** Candidate host zones are screened based on multi-constraint safety criteria (low hazard, low vulnerability, safe headroom, adequate capacity) and geodesic metric distance in **EPSG:7755 (India Albers Equal Area)**. All candidate outputs are explicitly labeled:  
   `"CANDIDATE HOST ZONE — HUMAN REVIEW REQUIRED"` (strictly decision-support; NOT automated relocation orders).

---

## 2. Component-Level Adequacy Formulations

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PHASE 3C COMPONENT ADEQUACY & STATUS                                   │
├────────────────────────┬─────────────────────────────┬─────────────────────────────────────────────────┤
│ Component              │ Adequacy Metric             │ Status Classification Standards                 │
├────────────────────────┼─────────────────────────────┼─────────────────────────────────────────────────┤
│ Designated Shelters    │ Coverage Ratio & Deficit    │ Adequate (≥10%), Moderate (≥3%), Low (<3%),     │
│                        │ (Persons vs. Pop)           │ No Verified Shelter Capacity                    │
├────────────────────────┼─────────────────────────────┼─────────────────────────────────────────────────┤
│ Health Infrastructure  │ Normative Beds / 1k Pop     │ Adequate (≥1.2), Moderate (≥0.6), Low (<0.6)    │
│                        │ vs. IPHS 2.0 Benchmark      │ (Statutory Normative Baseline)                  │
├────────────────────────┼─────────────────────────────┼─────────────────────────────────────────────────┤
│ Water & Sanitation     │ Combined Coverage Score     │ High (≥85%), Moderate (≥70%), Low (<70%)        │
│                        │ (JJM Tap % + SBM-G Toilet %)│ (Infrastructure Adequacy Proxy)                 │
├────────────────────────┼─────────────────────────────┼─────────────────────────────────────────────────┤
│ Evacuation Roads       │ OSM Road Density (km/km²)   │ High (≥1.50), Moderate (≥0.90), Low (<0.90)     │
│                        │ Normalized Accessibility    │ (Network Accessibility Proxy)                   │
├────────────────────────┼─────────────────────────────┼─────────────────────────────────────────────────┤
│ Safe Habitable Area    │ Safe Terrain Fraction &     │ Minimal Exclusion (≥90%), Moderate (≥75%),      │
│                        │ Headroom (m²/person)        │ High Hazard Exclusion (<75%)                    │
└────────────────────────┴─────────────────────────────┴─────────────────────────────────────────────────┘
```

### 2.1 Shelter Adequacy & Deficit
- **Coverage Ratio:** $\text{shelter\_coverage\_ratio}_i = \frac{\text{verified\_shelter\_capacity\_persons}_i}{P_i}$
- **Shelter Deficit:** $\text{shelter\_deficit\_persons}_i = \max(0, P_i - \text{verified\_shelter\_capacity\_persons}_i)$
- **Status Distribution:**
  - `NO VERIFIED SHELTER CAPACITY`: 315 inland/unclassified mandals (explicitly tagged to prevent false zeros)
  - `ADEQUATE DESIGNATED COVERAGE`: 152 coastal mandals ($\ge 10\%$ designated coverage)
  - `MODERATE DESIGNATED COVERAGE`: 168 coastal mandals ($3\% - 10\%$ coverage)
  - `LOW DESIGNATED COVERAGE`: 61 coastal mandals ($< 3\%$ coverage)

### 2.2 Health Infrastructure Adequacy
- **Normative Beds / 1,000 Pop:** Derived from IPHS 2022 facility standards (PHC: 6 beds, CHC: 30 beds, SDH: 100 beds, DH: 300 beds).
- **Adequacy Formulation:** $\text{health\_adequacy}_i = \min\left(1.0, \frac{\text{normative\_beds\_per\_1000}_i}{2.0}\right)$
- **Status Distribution:**
  - `ADEQUATE NORMATIVE BASELINE`: 24 mandals ($\ge 1.20\text{ beds/1k}$)
  - `MODERATE NORMATIVE BASELINE`: 245 mandals ($0.60 - 1.20\text{ beds/1k}$)
  - `LOW NORMATIVE BASELINE`: 411 rural mandals ($< 0.60\text{ beds/1k}$)
  - `NO POPULATION`: 16 unpopulated/zero-census features

### 2.3 Water & Sanitation Adequacy Proxy
- **Adequacy Formulation:** $W_{\text{water}, i} = 0.50 \times \left(\frac{\text{water\_access\_percent}_i}{100}\right) + 0.50 \times \left(\frac{\text{sanitation\_coverage\_percent}_i}{100}\right)$
- **Status Distribution:**
  - `HIGH ADEQUACY`: 268 mandals ($\ge 85\%$)
  - `MODERATE ADEQUACY`: 404 mandals ($70\% - 85\%$)
  - `LOW ADEQUACY`: 8 mandals ($< 70\%$)
  - `NO POPULATION`: 16 features

### 2.4 Evacuation Road Accessibility Proxy
- **Metric:** Road Density ($km/km^2$) from OpenStreetMap highway vectors.
- **Status Distribution:**
  - `HIGH ACCESSIBILITY`: 178 mandals ($\ge 1.50\text{ km/km}^2$)
  - `MODERATE ACCESSIBILITY`: 452 mandals ($0.90 - 1.50\text{ km/km}^2$)
  - `LOW ACCESSIBILITY`: 66 mandals ($< 0.90\text{ km/km}^2$, predominantly rugged upland terrain)

### 2.5 Safe Habitable Area Constraint
- **Metric:** Safe terrain fraction excluding recurring surface water ($R \ge 10\%$) and steep slopes ($> 25^\circ$).
- **Status Distribution:**
  - `MINIMAL HAZARD EXCLUSION`: 557 mandals ($\ge 90\%$ safe area fraction)
  - `MODERATE HAZARD EXCLUSION`: 121 mandals ($75\% - 90\%$ safe area)
  - `HIGH HAZARD EXCLUSION`: 18 mandals ($< 75\%$ safe area, active flood delta/steep ghats)

---

## 3. Physical Bottleneck Engine & Capacity Condition

### 3.1 Limiting Resource Identification
For each mandal, available verified adequacy components are evaluated. The component with the lowest adequacy score is identified as the **Primary Bottleneck**, and the second lowest as the **Secondary Bottleneck**:

- **Primary Bottleneck Statewide Breakdown:**
  - `health_infrastructure`: 532 mandals (rural health bed allocations lag population growth)
  - `shelter_capacity`: 147 coastal mandals (designated cyclone shelter capacity deficit)
  - `safe_habitable_area`: 1 mandal (severe topographic/flood exclusion)
  - `NO POPULATION`: 16 features
- **Data Completeness:** Mean data completeness across all 696 mandals is **87.2%** (minimum 80% across populated units).

### 3.2 Capacity Condition Categorization
Mandals are classified into four analytical categories based on limiting bottleneck severity and data completeness:
1. `CAPACITY-ADEQUATE`: 0 mandals (reflecting rural infrastructure constraints relative to national benchmarks)
2. `CAPACITY-CONSTRAINED`: 77 mandals (moderate bottlenecks, high safe-area headroom)
3. `CAPACITY-SEVERELY-CONSTRAINED`: 603 mandals (primary bottleneck $< 0.35$ or safe area fraction $< 0.70$)
4. `INSUFFICIENT-DATA`: 16 features (unpopulated or zero-area polygons)

---

## 4. Candidate Host-Zone Screening & Metric Distance

### 4.1 Multi-Constraint Screening Criteria
A mandal qualifies for the candidate host zone pool only if all the following conditions are satisfied:
1. **Low Hazard Exposure:** $H_i < 0.30$
2. **Low/Moderate Vulnerability:** $V_i < 0.35$
3. **Non-Severe Capacity Condition:** `CAPACITY-ADEQUATE` or `CAPACITY-CONSTRAINED`
4. **Safe Land Headroom:** Safe area fraction $\ge 85\%$ and spatial headroom $\ge 500\text{ m}^2/\text{person}$
5. **High Data Completeness:** Completeness $\ge 80\%$

- **Qualified Candidate Host Pool:** **51 mandals** across Andhra Pradesh meeting all safety and headroom criteria.

### 4.2 Geodesic Metric Distance Calculation
- Centroid planar distances are computed in **India Albers Equal Area (EPSG:7755)** to avoid latitude/longitude distortion across AP's 3 UTM zones (43N, 44N, 45N).
- For every source mandal, the top 3 nearest qualifying candidate host mandals are generated, yielding **2,088 screened candidate pairs** in [`data/processed/capacity/host_zone_candidates.csv`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/data/processed/capacity/host_zone_candidates.csv).

---

## 5. Verified Deliverables

1. **Master Adequacy Dataset:**  
   [`data/processed/capacity/mandal_capacity_adequacy.csv`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/data/processed/capacity/mandal_capacity_adequacy.csv) (696 rows, 38 columns)
2. **Bottlenecks Dataset:**  
   [`data/processed/capacity/mandal_bottlenecks.csv`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/data/processed/capacity/mandal_bottlenecks.csv) (696 rows)
3. **Host Zone Candidates Matching Dataset:**  
   [`data/processed/capacity/host_zone_candidates.csv`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/data/processed/capacity/host_zone_candidates.csv) (2,088 candidate pairs)
4. **Enriched Adequacy GeoJSON:**  
   [`data/processed/capacity/ap_mandal_capacity_adequacy.geojson`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/data/processed/capacity/ap_mandal_capacity_adequacy.geojson) (696 polygon features)

---

## 6. Backend API Endpoints

- `GET /api/capacity/adequacy/summary`: Statewide summary of capacity conditions, bottleneck breakdown, and candidate host pool count.
- `GET /api/capacity/adequacy/mandals`: All 696 mandals with filtering by `district_id`, `capacity_condition`, `primary_bottleneck`, and `is_host_candidate`.
- `GET /api/capacity/adequacy/mandal/{mandal_id}`: Single mandal detailed adequacy and bottleneck profile.
- `GET /api/capacity/bottlenecks`: Limiting resource rankings and component adequacy scores.
- `GET /api/capacity/host-zones/{mandal_id}`: Top nearest screened candidate host zones with geodesic distances and safety rationales.

---

## 7. Verification Results

- **Backend Pytest Suite:** **52 / 52 tests passed** in 6.67s (`tests/test_capacity.py`, `tests/test_vulnerability.py`, `tests/test_hazard_exposure.py`, `tests/test_demographics.py`, `tests/test_gis.py`, `tests/test_health.py`).
- **Frontend Build:** `npm run build` compiled cleanly in 678ms with **0 TypeScript errors**.

---

## 8. Governance Notice & Next Phase

> [!IMPORTANT]
> **Human-in-the-Loop Decision Support:** Candidate host zones are screened planning options for district collectors and disaster management authorities. They do NOT constitute automated, legally binding relocation directives.

**Next Phase (Pending User Approval):**  
**PHASE 4 — MULTI-CRITERIA RELOCATION PRIORITIZATION** (Implementing transparent AHP criterion weights, TOPSIS preference ranking, and full factor percentage contribution breakdowns).
