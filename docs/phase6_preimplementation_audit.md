# Phase 6 — Pre-Implementation Audit Report

**Project:** Sahayata (SIH26191)  
**Phase:** 6 — Decision & Action Planning  
**Audit Type:** Pre-Implementation Readiness & Data Audit  
**Date:** September 2026  

---

## 1. Existing Source-Mandal Data Availability Matrix

All 696 administrative mandals across 26 districts of Andhra Pradesh were audited across their constituent indicators:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PHASE 6 DATA AVAILABILITY AUDIT MATRIX                                 │
├────────────────────┬───────────────────────────────────────┬──────────────┬────────────────────────────┤
│ Domain             │ Attribute / Indicator                 │ Status       │ Source & Granularity       │
├────────────────────┼───────────────────────────────────────┼──────────────┼────────────────────────────┤
│ Administrative     │ mandal_id, mandal_name, district      │ AVAILABLE    │ SoI / AP GIS (696 mandals) │
│                    │ geometry & planar centroid (EPSG:7755)│ AVAILABLE    │ EPSG:7755 Albers Equal Area│
├────────────────────┼───────────────────────────────────────┼──────────────┼────────────────────────────┤
│ Multi-Hazard       │ Multi-Hazard Exposure Index (H_i)     │ AVAILABLE    │ Phase 2C Exposure Engine   │
│                    │ Flood component, Cyclone component    │ AVAILABLE    │ JRC / Dartmouth / NCRMP    │
│                    │ Wind & Slope Instability components   │ AVAILABLE    │ IMD Wind & SRTM 30m Slope  │
├────────────────────┼───────────────────────────────────────┼──────────────┼────────────────────────────┤
│ Demographic        │ Total Population, Households          │ AVAILABLE    │ Census 2011 PCA            │
│                    │ Child (0-6), Female, SC, ST, Workers  │ AVAILABLE    │ Census 2011 PCA            │
│                    │ Demographic Sensitivity Index (D_i)   │ AVAILABLE    │ Phase 2D Normalized Model  │
├────────────────────┼───────────────────────────────────────┼──────────────┼────────────────────────────┤
│ Physical Capacity  │ Cyclone Shelter Capacity & Coverage   │ AVAILABLE*   │ NCRMP Phase-I (Coastal)    │
│                    │ Normative Health Beds & Baseline      │ AVAILABLE    │ IPHS 2022 Guidelines       │
│                    │ Water & Sanitation Adequacy           │ AVAILABLE    │ JJM & SBM-G State Portals  │
│                    │ Road Accessibility Proxy (km/km²)     │ AVAILABLE    │ OSM / NRDMS Road Density   │
│                    │ Safe Habitable Area Fraction (S_i)    │ AVAILABLE    │ Slope (<15°) & Flood Excl. │
│                    │ Primary & Secondary Bottlenecks       │ AVAILABLE    │ Phase 3C Limiting Engine   │
│                    │ Capacity Condition Classification     │ AVAILABLE    │ Phase 3C (Adequate/Constr.)│
├────────────────────┼───────────────────────────────────────┼──────────────┼────────────────────────────┤
│ Relocation Priority│ AHP Criterion Weights & Consistency CR│ AVAILABLE    │ Phase 4 Saaty Matrix       │
│                    │ TOPSIS Relative Closeness Score (CC_i)│ AVAILABLE    │ Phase 4 Decision Analysis  │
│                    │ Analytical Priority Band (4 Quantiles)│ AVAILABLE    │ Phase 4 Quantile Model     │
│                    │ Factor Contribution Percentages       │ AVAILABLE    │ Phase 4 Pressure Breakdown │
│                    │ Deterministic Explanation String      │ AVAILABLE    │ Phase 4 Template Engine    │
├────────────────────┼───────────────────────────────────────┼──────────────┼────────────────────────────┤
│ Scenario Simulation│ Scenario Multipliers (H, Pop, C, A)   │ AVAILABLE    │ Phase 5 Sliders & Presets  │
│                    │ Simulated TOPSIS Score & Rank Delta   │ AVAILABLE    │ Phase 5 Comparative TOPSIS │
│                    │ Scenario Factor Contribution & Text   │ AVAILABLE    │ Phase 5 Template Engine    │
└────────────────────┴───────────────────────────────────────┴──────────────┴────────────────────────────┘
* Note: Cyclone shelters are applicable to coastal/cyclone-exposed mandals; inland mandals have explicit non-applicable flags.
```

---

## 2. Existing Host-Zone Data Audit

1. **Precomputed Candidate Pairs:** `data/processed/capacity/host_zone_candidates.csv` contains **2,088 screened candidate pairs** mapping each source mandal to nearest qualifying host zones.
2. **Distinct Candidate Host Pool:** Exactly **51 unique candidate host mandals** meet all Phase 3C physical safety and headroom constraints:
   - Hazard Exposure $H_i < 0.30$
   - Vulnerability $V_i < 0.35$
   - Safe Habitable Land Fraction $\ge 85.0\%$
   - Safe Land Headroom $\ge 500\text{ m}^2/\text{person}$
   - Data Completeness $\ge 80.0\%$
3. **Metric Geodesic Distances:** Computed in **EPSG:7755 (India Albers Equal Area)** directly connecting polygon centroids.
4. **Conclusion:** Host zone candidate data is valid, structured, and reusable. Phase 6 will directly consume this layer without creating conflicting secondary methodologies.

---

## 3. Data Governance & Limitation Rules

- **Census 2011 Baseline:** Demographic indicators reflect Census 2011 Primary Census Abstract.
- **Normative Capacity vs. Live Occupancy:** Health bed capacity reflects IPHS planning standards; shelter capacity reflects static designated capacities.
- **Road Network as Accessibility Proxy:** Road density represents egress corridor availability, not real-time traffic flow.
- **Candidate Host Status:** All host zone recommendations are strictly labeled `"CANDIDATE HOST ZONE — HUMAN REVIEW REQUIRED"`. The platform does **NOT** issue automated relocation orders.

---

## 4. Phase 6 Proposed Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 6 ARCHITECTURE & WORKFLOW                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   [Source Mandal Assessment]                                                           │
│   - Multi-Criteria Relocation Rank (Phase 4 TOPSIS)                                    │
│   - Factor Attribution Pressure (Hazard / Demography / Capacity / Accessibility)       │
│   - Primary & Secondary Infrastructure Bottlenecks (Phase 3C)                          │
│                                      │                                                 │
│                                      ▼                                                 │
│   [Indicative Capacity Gap Analysis]                                                   │
│   - Planning Population Baseline (Census 2011)                                         │
│   - Indicative Deficits: Shelter Persons, Health Beds (IPHS), Safe Land (Sphere Std)   │
│   - Explicit Missing-Data Preservation (No silent zero estimation)                     │
│                                      │                                                 │
│                                      ▼                                                 │
│   [Candidate Host Zone Screening & Comparison]                                         │
│   - Screened 51 Safe Host Candidates (EPSG:7755 Geodesic Distance)                     │
│   - Transparent Rule-Based Ranking (Distance, Hazard, Safe Headroom, Data Complete)    │
│   - Side-by-Side Source vs Host Comparison (Advantages, Deficits, Missing Info)        │
│                                      │                                                 │
│                                      ▼                                                 │
│   [3-Horizon Deterministic Action Plan]                                                │
│   - Immediate / Emergency Preparedness (Corridors, Early Warning, Temp Shelters)       │
│   - Short-Term Mitigation (JJM Water Points, Medical Referral Routes, Shelter Retrofit)│
│   - Long-Term Planning (Safe-Zone Land Siting, Regional Host Facility Expansion)       │
│                                      │                                                 │
│                                      ▼                                                 │
│   [Phase 5 Scenario Dynamic Linkage]                                                   │
│   - Real-time Baseline vs Scenario Comparison                                          │
│   - Dynamic Action Plan Adaptation under Simulated Compound Stress                     │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Summary of Endpoints to Implement in Phase 6

To provide complete decision support without duplicate routes:
- `GET /api/relocation/mandal/{mandal_id}/assessment` — Comprehensive relocation, capacity, and bottleneck profile.
- `GET /api/relocation/mandal/{mandal_id}/capacity-gap` — Transparent indicative capacity gap calculation with explicit missing data flags.
- `GET /api/relocation/mandal/{mandal_id}/action-plan` — Deterministic 3-horizon action suggestions triggered by active bottlenecks and hazard constraints.
- `GET /api/relocation/mandal/{mandal_id}/hosts` — Ranked candidate host zones with comparative metrics.
- `GET /api/relocation/mandal/{mandal_id}/compare/{host_id}` — Detailed side-by-side Source vs Candidate Host comparison.
- `GET /api/relocation/action-dashboard` — Statewide decision support and action planning summary.
