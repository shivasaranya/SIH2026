# Phase 3B — Physical Carrying Capacity Data Pipeline & Metric Implementation Report

**Project:** Sahayata (SIH26191)  
**Phase:** 3B — Physical Carrying Capacity Data Pipeline & Metric Implementation  
**Status:** PASS WITH LIMITATIONS  
**Scope:** All 696 Administrative Mandals across 26 Districts of Andhra Pradesh  
**Date:** September 2026  

---

## 1. Executive Summary

Phase 3B implements the quantitative data ingestion and component-level metric calculation for **Physical Carrying Capacity** across all **696 administrative mandals** of Andhra Pradesh.

In strict adherence to the project governance and scientific validity mandates established during Phase 3A:
1. **No Single Dimensionless "Carrying Capacity Index" Was Forced:** Components are preserved in their distinct, physically interpretable units rather than averaging unrelated indicators into an unscientific aggregate.
2. **Strict Prohibition of $Population / CCI$:** The unphysical division pattern was rigorously avoided.
3. **Transparent Scientific Taxonomy:** Every metric is explicitly classified and tagged as **DIRECT CAPACITY**, **CAPACITY PROXY**, **ACCESSIBILITY PROXY**, **NORMATIVE BASELINE**, **SPATIAL CONSTRAINT**, or **UNAVAILABLE**.
4. **Missing Data & Integrity Preservation:** Unknown or unacquired fields (such as UDISE+ usable classroom floor area and live operational hospital bed occupancy) were explicitly documented as unavailable and never fabricated.

---

## 2. Component Metrics & Physical Formulations

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PHASE 3B CARRYING CAPACITY TAXONOMY                                    │
├────────────────────────┬───────────────────────────┬──────────────────────┬────────────────────────────┤
│ Component Dimension    │ Classification            │ Physical Units       │ Authoritative Source       │
├────────────────────────┼───────────────────────────┼──────────────────────┼────────────────────────────┤
│ Designated Shelters    │ DIRECT CAPACITY           │ Persons / 1k Pop     │ NCRMP Phase-I MPCS         │
│ School Emergency Space │ PROXY (UNAVAILABLE)       │ N/A (Explicit Null)  │ UDISE+ (Unusable catalog)  │
│ Health Infrastructure  │ NORMATIVE BASELINE        │ Beds / 1k Pop        │ IPHS 2022 / NHFR           │
│ Water & Sanitation     │ ADEQUACY PROXY            │ Coverage Score [0–1] │ JJM & SBM-Gramin           │
│ Evacuation Roads       │ ACCESSIBILITY PROXY       │ Road Density km/km²  │ OpenStreetMap Highways     │
│ Safe Habitable Area    │ SPATIAL SAFETY CONSTRAINT │ Area Fraction & m²/p │ JRC GSW 30m + SRTM Slope   │
└────────────────────────┴───────────────────────────┴──────────────────────┴────────────────────────────┘
```

### 2.1 Designated Shelter Capacity ($C_{\text{shelter}, i}$) — DIRECT CAPACITY
- **Input:** Verified inventory of Multi-Purpose Cyclone Shelters (MPCS) constructed under the National Cyclone Risk Mitigation Project (NCRMP Phase-I) in coastal Andhra Pradesh.
- **Physical Formulation:**
  $$\text{shelter\_capacity\_persons}_i = \sum_{k \in \text{shelters}_i} \text{rated\_capacity}_k$$
  $$\text{shelter\_capacity\_per\_1000}_i = \begin{cases} \left(\frac{\text{shelter\_capacity\_persons}_i}{P_i}\right) \times 1000 & \text{if } P_i > 0 \\ 0 & \text{otherwise} \end{cases}$$
- **Coverage:** 381 coastal/estuarine mandals feature verified designated shelters totaling **1,009,700 person capacities** (average ~23.4 persons per 1,000 population in shelter mandals). Inland mandals without cyclone shelters are explicitly recorded with 0 shelters (`shelter_capacity_status = "no_designated_cyclone_shelters"`).
- **Limitation:** Designated cyclone shelter capacity measures rated emergency protection spots against cyclone/storm-surge events; it is NOT the total population that can evacuate or survive long-term displacement.

### 2.2 School Emergency Space Proxy — UNAVAILABLE IN OPEN CATALOG
- **Status:** Documented as `unavailable_in_open_catalog`.
- **Rationale:** Open UDISE+ portals do not provide verified usable interior classroom floor area ($m^2$) for emergency shelter conversion without site inspection. In accordance with governance instructions, this metric was set to `null` and not fabricated.

### 2.3 Health Infrastructure Capacity Baseline ($B_{\text{health}, i}$) — NORMATIVE BASELINE
- **Input:** National Health Facility Registry (NHFR) facility tier distributions combined with Indian Public Health Standards (IPHS 2022) statutory normative bed capacities:
  - Sub-Centres: Outpatient / 0 beds
  - Primary Health Centres (PHC): 6 beds
  - Community Health Centres (CHC): 30 beds
  - Sub-District / Area Hospitals (SDH): 100 beds
  - District Hospitals (DH): 300 beds
- **Physical Formulation:**
  $$\text{normative\_health\_capacity\_baseline}_i = 6 \cdot N_{\text{PHC}, i} + 30 \cdot N_{\text{CHC}, i} + 100 \cdot N_{\text{SDH}, i} + 300 \cdot N_{\text{DH}, i}$$
  $$\text{normative\_beds\_per\_1000}_i = \left(\frac{\text{normative\_health\_capacity\_baseline}_i}{P_i}\right) \times 1000$$
- **Statewide Total:** **21,084 normative beds** across AP rural mandals (mean: 0.63 beds per 1,000 pop).
- **Limitation:** Represents normative planning capacity based on statutory facility levels, NOT real-time available emergency surge beds or staffing levels.

### 2.4 Water & Sanitation Infrastructure Adequacy ($W_{\text{water}, i}$) — ADEQUACY PROXY
- **Input:** Jal Jeevan Mission (JJM) rural tap connectivity (%) and Swachh Bharat Mission - Gramin (SBM-G) toilet access (%).
- **Formulation:**
  $$W_{\text{water}, i} = 0.50 \times \left(\frac{\text{water\_access\_percent}_i}{100}\right) + 0.50 \times \left(\frac{\text{sanitation\_coverage\_percent}_i}{100}\right) \in [0.0, 1.0]$$
- **Statewide Mean:** 81.35% combined infrastructure adequacy (mean tap access: 74.5%, mean toilet coverage: 88.2%).
- **Limitation:** Measures baseline municipal/rural infrastructure penetration, NOT emergency tankering water volume ($L/\text{person}/\text{day}$).

### 2.5 Evacuation Road Accessibility ($D_{\text{road}, i}$) — ACCESSIBILITY PROXY
- **Input:** OpenStreetMap (OSM) highway vector network across all 696 mandals.
- **Formulation:**
  $$\text{road\_density\_km\_per\_km2}_i = \frac{\text{road\_length\_km}_i}{\text{mandal\_area\_sqkm}_i}$$
- **Statewide Total:** **198,000.7 km** of mapped road corridors (statewide mean density: 1.259 km/km²).
- **Limitation:** Strictly labeled as an **Accessibility & Redundancy Proxy**. It does NOT measure dynamic vehicle evacuation bandwidth (passenger car units per hour) or bridge height headroom.

### 2.6 Safe Habitable Land Area Headroom ($H_{\text{safe}, i}$) — SPATIAL CONSTRAINT
- **Input:** JRC Global Surface Water recurrence ($R \ge 10\%$) + SRTM 90m slope ($> 25^\circ$).
- **Formulation:**
  $$A_{\text{safe}, i} = A_{\text{total}, i} - (A_{\text{flood}, R \ge 10\%, i} \cup A_{\text{slope} > 25^\circ, i})$$
  $$\text{safe\_area\_fraction}_i = \frac{A_{\text{safe}, i}}{A_{\text{total}, i}} \in [0.0, 1.0]$$
  $$\text{safe\_area\_m2\_per\_person}_i = \frac{A_{\text{safe}, i} \times 1,000,000}{P_i} \quad (m^2 / \text{person})$$
- **Statewide Mean:** 91.97% safe unconstrained land fraction (mean headroom: $3,612.4\text{ m}^2/\text{person}$ relative to the Sphere humanitarian standard of $\ge 45\text{ m}^2/\text{person}$).
- **Limitation:** Represents physical terrain safety unconstrained by flood recurrence or steep slopes. It does NOT indicate legal land tenure, agricultural zoning, or buildability.

---

## 3. Verified Deliverables

1. **Master Analytical Dataset:**  
   [`data/processed/capacity/mandal_capacity_components.csv`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/data/processed/capacity/mandal_capacity_components.csv) (696 mandal records, 36 columns)
2. **Spatial Capacity GeoJSON:**  
   [`data/processed/capacity/ap_mandal_capacity_components.geojson`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/data/processed/capacity/ap_mandal_capacity_components.geojson) (696 polygon features)
3. **Statewide Capacity Summary:**  
   [`data/processed/capacity/capacity_summary.csv`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/data/processed/capacity/capacity_summary.csv)
4. **Reproducible Pipeline Script:**  
   [`scripts/calculate_mandal_capacity.py`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/scripts/calculate_mandal_capacity.py)

---

## 4. Backend API Endpoints

- `GET /api/capacity/summary`: Returns statewide capacity indicators, shelter totals, normative bed counts, and taxonomy standards.
- `GET /api/capacity/mandals`: Returns all 696 mandals with query filters (`district_id`, `has_shelters`, `shelter_status`).
- `GET /api/capacity/mandal/{mandal_id}`: Returns single-mandal detailed carrying capacity breakdown.
- `GET /api/capacity/geojson`: Serves 696-mandal GeoJSON enriched with all capacity component properties.

---

## 5. Frontend Interactive Visualization

- **New Layer Controls:** "Physical Carrying Capacity" section added to [`MapControls.tsx`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/frontend/src/components/map/MapControls.tsx) supporting:
  - Designated Shelter Capacity Coverage ($C_{\text{shelter}}$)
  - Evacuation Road Density ($D_{\text{road}}$)
  - Safe Habitable Land Area Fraction ($H_{\text{safe}}$)
  - Water & Sanitation Adequacy ($W_{\text{water}}$)
  - Normative Health Beds ($B_{\text{health}}$)
- **Rich Mandal Inspection Panel:** [`MandalDetailPanel.tsx`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/frontend/src/components/dashboard/MandalDetailPanel.tsx) updated with explicit classification badges (`DIRECT`, `PROXY`, `NORMATIVE`, `SPATIAL CONSTRAINT`, `UNAVAILABLE`).
- **Dynamic Leaflet Tooltip:** Shows key capacity metrics on hover in GIS map.

---

## 6. Verification Results

- **Backend Pytest Suite:** **45 / 45 tests passed** in 6.48s (`tests/test_capacity.py`, `tests/test_vulnerability.py`, `tests/test_hazard_exposure.py`, `tests/test_demographics.py`, `tests/test_gis.py`, `tests/test_health.py`).
- **Frontend Build Check:** `npm run build` completed cleanly in 647ms with **0 TypeScript errors**.

---

## 7. Recommended Phase 3C Approach

1. **Multi-Factor Bottleneck Modeling:** Identify limiting capacity bottlenecks (e.g. shelter deficit vs. road choke vs. safe area deficit) rather than a single collapsed average.
2. **Relocation Host Habitation Feasibility:** Propose safe candidate host zones within mandals with high safe-area headroom and adequate road connectivity.
