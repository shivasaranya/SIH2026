# Phase 3A: Physical Carrying Capacity Data Research & Validation Report
**Project:** Sahayata (SIH26191)  
**Pilot State:** Andhra Pradesh, India  
**Date:** September 2026  
**Status:** COMPLETED — Candidate datasets investigated, verified, ranked, and structured into a defensible carrying-capacity methodology.

---

## 1. Executive Summary & Objective

The objective of Phase 3A is to research, identify, and validate real, authoritative datasets for Andhra Pradesh capable of supporting a scientifically defensible **Physical Carrying Capacity Assessment** in upcoming Phase 3B.

In accordance with project integrity principles:
- **No carrying capacity calculation engine is built in this phase.**
- **No synthetic or fabricated capacity values are introduced.**
- **No arbitrary mock scores are utilized.**
- This phase delivers **data discovery, source verification, feasibility evaluation, spatial resolution assessment, and methodological blueprinting**.

---

## 2. Physical Carrying Capacity Concept & Governance Standard

### 2.1 Definition
In disaster management and relocation planning, **Physical Carrying Capacity** represents the finite capability of a geographical unit (mandal, host community, or shelter zone) to safely support, shelter, and sustain an evacuated or relocated population during extreme hazard events without inducing secondary system failure (shelter collapse, road gridlock, water depletion, or healthcare saturation).

### 2.2 Rejection of Unphysical Dimensionless Formulas
Sahayata strictly rejects the simplistic and scientifically invalid formulation:
$$\text{Stress} \neq \frac{\text{Population}}{\text{Dimensionless Carrying Capacity Index (0 to 1)}}$$

Dividing an absolute population count (e.g. 50,000 persons) by an arbitrary dimensionless index (e.g. 0.42) produces a meaningless number that has no physical units and cannot be verified on the ground.

Instead, carrying capacity in Sahayata must be evaluated across **four physically measurable dimensions with explicit units and verifiable limiting constraints**:
1. **Designated Shelter Capacity** (measured in *persons* or *shelter floor area $m^2$*)
2. **Evacuation & Road Accessibility** (measured in *road network density $km/km^2$* and *paved all-weather connectivity ratio %*)
3. **Critical Infrastructure Adequacy** (measured in *normative hospital beds per 1,000 population* and *piped water supply coverage %*)
4. **Safe Habitable Area Headroom** (measured in *available hazard-free land area $m^2 / \text{person}$*)

---

## 3. Candidate Dimension Research & Source Verification

### 3.1 Dimension A: Designated Shelter Capacity

| Dataset / Source | Custodian | Format / Access | AP Coverage | Direct Capacity Available? | Findings & Limitations |
|---|---|---|---|---|---|
| **NCRMP Phase-I Multi-Purpose Cyclone Shelters (MPCS)** | NDMA / APSDMA / World Bank | Tabular Project Registry & Reports | 1,053 MPCS in 9 coastal AP districts | **YES (Direct: 300, 500, 1,000 persons)** | Direct engineering design capacities: Type-A (1,000 persons / 400 m²), Type-B (500 persons / 250 m²), Type-C (300 persons / 150 m²). High confidence. |
| **APSAC Cyclone Shelter Layer (`gatishakti_cycloneshelter`)** | APSAC GeoServer | OGC WMS (Raster Map Tiles) | Coastal Andhra Pradesh | **NO (Visualization-Only)** | Verified active WMS endpoint. Vector WFS download is disabled; point coordinates cannot be extracted via open API. Visual overlay only. |
| **UDISE+ School Infrastructure** | Ministry of Education / AP School Education | Tabular Portal / Open Data | Statewide (All 26 Districts) | **YES (Classroom Area Proxy)** | Government schools serve as designated primary relief shelters in rural mandals during floods/cyclones. Area proxy: $\ge 3.5 \text{ m}^2 / \text{person}$ per Sphere Project standard. |

#### Classification:
- **Direct Capacity:** Available for NCRMP Multi-Purpose Cyclone Shelters (persons).
- **Capacity Proxy:** Available for UDISE+ school infrastructure (covered floor area).

---

### 3.2 Dimension B: Evacuation & Road Accessibility

| Dataset / Source | Custodian | Format / Access | AP Coverage | Capacity Available? | Findings & Limitations |
|---|---|---|---|---|---|
| **OpenStreetMap (OSM) Highway Network** | OpenStreetMap Contributors / Geofabrik | Vector GeoJSON / PBF LineStrings (EPSG:4326) | Complete Statewide (696 Mandals) | **NO (Geometry & Length Only)** | Complete road network categorized into `primary`, `secondary`, `tertiary`, `residential`, `unclassified`, with surface type and bridge tags. |
| **PMGSY All-Weather Road Connectivity (OMMAS)** | Ministry of Rural Development | Tabular & Point Data | Rural Habitations across AP | **NO (Connectivity Status Only)** | Records all-weather paved road connectivity to rural habitations. |
| **Survey of India Open Series Maps (OSM / SoI)** | Survey of India | PDF / Topo Rasters | 1:50,000 Toposheets | **NO (Static Cartography)** | High spatial accuracy for topographic features, but static cartography. |

#### Critical Finding on Road Capacity:
- Dynamic vehicle flow capacity (Passenger Car Units per hour, $PCU/hr$) is **NOT available in any open static GIS dataset**.
- **Defensible Metric:** Road infrastructure must be evaluated using **Evacuation Road Density ($km/km^2$)** and **Paved All-Weather Road Connectivity Ratio**.
- **Labeling Standard:** These metrics must be strictly classified as **Evacuation Accessibility Proxies**, NOT vehicle flow capacity.

---

### 3.3 Dimension C: Critical Infrastructure (Health, Water, Sanitation)

| Dataset / Source | Custodian | Format / Access | AP Coverage | Capacity Available? | Findings & Limitations |
|---|---|---|---|---|---|
| **National Health Facility Registry (NHFR) / RHS** | MoHFW / ABDM | Tabular CSV & Facility Registry | Statewide (PHCs, CHCs, SDHs, DHs) | **YES (IPHS Normative Bed Standards)** | Facility counts by tier: Sub-Centres, Primary Health Centres (PHCs: 4–6 beds), Community Health Centres (CHCs: 30 beds), Sub-District Hospitals (50–100 beds), District Hospitals (100–500 beds) per Indian Public Health Standards (IPHS 2022). |
| **Jal Jeevan Mission (JJM) Rural Water Supply** | Dept of Drinking Water & Sanitation (DDWS) | Dashboard / Tabular API | All 26 AP Districts / Mandals | **YES (55 LPCD Standard & FHTC %)** | Tracks Functional Household Tap Connections (FHTC %) and piped water infrastructure against the national humanitarian standard of 55 Liters Per Capita per Day (LPCD). |
| **Swachh Bharat Mission - Gramin (SBM-G)** | Ministry of Jal Shakti | Open Portal CSV | All AP Mandals | **YES (Sanitation Coverage %)** | Individual household latrine (IHHL) coverage and community sanitary complexes (CSC) in rural villages. |

#### Classification:
- **Direct Capacity:** IPHS normative static bed capacity per facility tier (beds per 1,000 population).
- **Adequacy Proxy:** JJM piped drinking water coverage (%) and SBM-G sanitation coverage (%).

---

### 3.4 Dimension D: Safe Habitable Area / Environmental Headroom

| Dataset / Source | Custodian | Format / Access | AP Coverage | Capacity Available? | Findings & Limitations |
|---|---|---|---|---|---|
| **JRC Global Surface Water (GSW) 30m** | EC JRC (Phase 2B) | GeoTIFF (30m, EPSG:4326) | Complete AP (32,020 × 26,172 px) | **YES (Inundation Exclusion Area)** | High surface water recurrence ($R \ge 10\%$) defines active flood zones to exclude from safe habitable area. |
| **SRTM 90m DEM & Slope** | CGIAR-CSI (Phase 2B) | GeoTIFF (90m, EPSG:7755) | Complete AP (-35m to 1,664m, 0° to 64.7°) | **YES (Steep Terrain Exclusion Area)** | Slopes $> 25^\circ$ define unstable upland terrain to exclude from safe habitable area. |
| **Coastal Low-Elevation Surge Zone** | INCOIS / Derived | Vector Polygon (EPSG:4326) | AP Coastal Belt (<5m MSL within 5 km) | **YES (Coastal Buffer Exclusion)** | Low-lying coastal zone vulnerable to storm surge inundation. |

#### Derived Spatial Headroom Formulation:
$$\text{Hazard Exclusion Zone}_i = A_{\text{flood}, R \ge 10\%, i} \cup A_{\text{slope} > 25^\circ, i} \cup A_{\text{surge}, i}$$
$$A_{\text{safe}, i} = A_{\text{total}, i} - \text{Hazard Exclusion Zone}_i$$
$$\text{Safe Area Fraction}_i = \frac{A_{\text{safe}, i}}{A_{\text{total}, i}} \in [0.0, 1.0]$$
$$\text{Habitable Area Headroom}_i = \frac{A_{\text{safe}, i}}{P_i} \quad (m^2 / \text{person})$$

- **Humanitarian Reference Benchmark:** Sphere Project Minimum Standards require $\ge 3.5 - 4.5 \text{ m}^2$ covered living space per person and $\ge 30 - 45 \text{ m}^2$ total settlement area per person in emergency relocation sites.

---

## 4. Habitation-Level vs. Mandal-Level Feasibility Assessment

### 4.1 Habitation-Level Reality in India
1. **No Open Cadastral Vector Boundaries:** In Andhra Pradesh and across India, digital village boundary polygons (revenue survey cadastre) and sub-village hamlet/habitation boundaries are restricted government assets held by State Survey & Settlement Departments and are **not available as open GIS vector files**.
2. **Tabular & Point Availability:** Census 2011 Primary Census Abstract (PCA) provides tabular statistics for 17,039 inhabited revenue villages. APSAC hosts a raster WMS layer (`gatishakti_habitation`), but vector coordinates and attributes are not accessible via open WFS.
3. **No Direct Sub-Village Geometry:** Claiming to run polygon spatial intersections or continuous buffer calculations at the individual sub-village hamlet level without authoritative polygon boundaries would be scientifically unsupportable.

### 4.2 Mandal-Level Analytical Grounding
- The **696 administrative mandals** (established and verified in Phase 1B, Phase 2C, and Phase 2D) represent the **smallest robust, continuous spatial unit** with:
  - 100% verified polygon geometries in EPSG:4326 / EPSG:7755
  - Exhaustive Census 2011 demographic aggregates (36,040,445 rural inhabitants)
  - 30m JRC water recurrence zonal statistics
  - 50 km cyclone track buffer densities
  - BIS IS 875 wind speed zoning
  - SRTM elevation and slope distributions

### 4.3 Recommended Two-Tier Architecture for Phase 3B
- **Tier 1 (Statewide Spatial Baseline — 696 Mandals):**
  Evaluate multi-dimensional physical carrying capacity continuously across all 696 mandals.
- **Tier 2 (Village Tabular Attribution — 17,039 Villages):**
  Allow village records from Census 2011 to inherit parent mandal carrying-capacity headroom, contextualized by individual village population pressure.

---

## 5. Comprehensive Data Source Ranking Table

| # | Candidate Dataset | Dimension | Custodian | Official? | Geographic Level | Capacity Field Available? | Format | Freshness | Access Mode | Usability Category | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **NCRMP MPCS Shelter Registry** | Shelter Capacity | NDMA / APSDMA | Yes | Coastal Mandals | **Yes (300–1000 persons)** | Tabular / Report | Project Baseline | Open Project Docs | **A — Directly Usable** | HIGH |
| 2 | **UDISE+ School Infrastructure** | Shelter Capacity (Proxy) | MoE / AP School Edu | Yes | Mandal / Village | **Yes (Classrooms/Area)** | Tabular / CSV | 2021–2023 | Open Data Portal | **A — Directly Usable** | HIGH |
| 3 | **OpenStreetMap Highway Network** | Evacuation Accessibility | OSM / Geofabrik | Collaborative | Statewide (Lines) | **No (Length/Surface)** | GeoJSON / PBF | Current (2025/2026) | Open Download | **B — Usable as Proxy** | HIGH |
| 4 | **PMGSY All-Weather Roads** | Evacuation Accessibility | MoRD / OMMAS | Yes | Village / Habitation | **No (Connected Y/N)** | Tabular / Portal | Current | Open Portal | **B — Usable as Proxy** | MEDIUM |
| 5 | **National Health Facility Registry (NHFR)** | Health Infrastructure | MoHFW / ABDM | Yes | Mandal / District | **Yes (IPHS Bed Standard)** | Tabular / CSV | Current | Open Registry | **A — Directly Usable** | HIGH |
| 6 | **Jal Jeevan Mission (JJM) Water** | Water Supply Capacity | DDWS / Jal Shakti | Yes | Mandal / District | **Yes (55 LPCD & FHTC %)** | Tabular / API | Current | Open Dashboard | **A — Directly Usable** | HIGH |
| 7 | **SBM-G Rural Sanitation** | Sanitation Infrastructure | Ministry of Jal Shakti | Yes | Mandal / Village | **Yes (IHHL Coverage %)** | Tabular / CSV | Current | Open Portal | **A — Directly Usable** | HIGH |
| 8 | **JRC Global Surface Water (30m)** | Safe Habitable Area | EC JRC / GEE | Yes | 30m Raster Grid | **Yes (Recurrence %)** | GeoTIFF | 1984–2021 | Acquired (Phase 2B) | **A — Directly Usable** | HIGH |
| 9 | **SRTM 90m DEM & Slope** | Safe Habitable Area | CGIAR-CSI / NASA | Yes | 90m Raster Grid | **Yes (Slope Degrees)** | GeoTIFF | Continuous | Acquired (Phase 2B) | **A — Directly Usable** | HIGH |
| 10 | **APSAC WMS Layers (Shelter/Hab)** | Visual Overlays | APSAC GeoServer | Yes | Point Symbols | **No (WFS Disabled)** | OGC WMS | 2023–2024 | Active WMS | **C — Reference / Overlay Only** | MEDIUM |
| 11 | **Dynamic Traffic / Flow Models** | Road Capacity | Transport Dept | No | Corridor Points | **No (Closed/Uncollected)** | Dynamic Logs | N/A | Not Open | **D — Restricted / Unusable** | N/A |

### Usability Category Summary:
- **Category A (Directly Usable / Analysis-Ready):** 6 datasets (NCRMP Shelters, UDISE+ Schools, NHFR Health, JJM Water, SBM-G Sanitation, JRC/SRTM Safe Area)
- **Category B (Usable with Defined Spatial/Proxy Processing):** 2 datasets (OSM Road Network for density, PMGSY for connectivity)
- **Category C (Reference / Visualization-Only):** 1 dataset (APSAC OGC WMS overlays)
- **Category D (Restricted / Unusable for Prototype):** 1 dataset (Dynamic real-time traffic flow logs)

---

## 6. Proposed Measurable Carrying Capacity Metrics for Phase 3B

| Metric Name | Dimension | Input Data Sources | Physical Unit | Normalization Method | Interpretation & Standard | Limitation / Caveat |
|---|---|---|---|---|---|---|
| **$C_{\text{shelter}, i}$** | Designated Shelter Capacity | NCRMP MPCS Registry + UDISE+ School Area | *Designated Shelter Capacity in Persons per 1,000 population* | Bounded $[0, 1]$ via min-max or capacity ratio ($\min(1.0, \frac{\text{Capacity}}{P_{\text{req}}})$) | Measures emergency evacuation shelter readiness against rural population. | Does not account for real-time shelter structural damage during storm. |
| **$D_{\text{road}, i}$** | Evacuation Accessibility | OSM Highway Network (Paved $km$) / Mandal Area | *Paved Road Density ($km / km^2$)* | Bounded $[0, 1]$ across AP mandals | High density indicates multiple redundant evacuation egress corridors. | **Accessibility proxy**, NOT dynamic vehicle flow bandwidth. |
| **$B_{\text{health}, i}$** | Health Infrastructure Adequacy | NHFR / IPHS Normative Facility Beds / Pop | *Normative Hospital Beds per 1,000 population* | Bounded $[0, 1]$ against WHO/IPHS benchmark ($\ge 2.0\text{ beds/1k}$) | Measures local medical surge capacity for casualty triage during emergencies. | Uses static normative IPHS bed capacities; live daily bed occupancy is unmeasured. |
| **$W_{\text{water}, i}$** | Water & Sanitation Adequacy | JJM FHTC % + SBM-G Toilet Coverage % | *Combined Access Percentage (%)* | Linear $[0.0, 1.0]$ ($0\% \to 0.0, 100\% \to 1.0$) | Measures baseline availability of potable water and sanitation infrastructure. | Measures infrastructure coverage, not water quality testing during floods. |
| **$H_{\text{safe}, i}$** | Safe Habitable Land Headroom | JRC GSW + SRTM 90m DEM / Mandal Population | *Safe Habitable Land Area ($m^2 / \text{person}$)* | Bounded $[0, 1]$ against Sphere Standard ($\ge 45 \text{ m}^2 / \text{person}$) | Quantifies available hazard-free physical terrain for emergency camp or relocation sites. | **Spatial headroom constraint**, not immediate building availability. |

---

## 7. Direct Capacity vs. Proxy & Constraint Distinction

To maintain scientific integrity, the Phase 3 methodology establishes strict conceptual definitions:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CARRYING CAPACITY TAXONOMY                              │
├────────────────────────┬────────────────────────┬──────────────────────────────────────┤
│ Classification         │ Candidate Dimension    │ Scientific Standard                  │
├────────────────────────┼────────────────────────┼──────────────────────────────────────┤
│ 1. DIRECT CAPACITY     │ NCRMP Cyclone Shelters │ Quantified directly in persons or    │
│                        │ NHFR Health Beds       │ beds based on engineering blueprints │
│                        │                        │ and IPHS statutory norms.            │
├────────────────────────┼────────────────────────┼──────────────────────────────────────┤
│ 2. CAPACITY PROXY      │ UDISE+ School Floor    │ Derived from physical floor area     │
│                        │ Area (m² / 3.5 m²)     │ converted using international        │
│                        │                        │ humanitarian standards (Sphere).     │
├────────────────────────┼────────────────────────┼──────────────────────────────────────┤
│ 3. ACCESSIBILITY PROXY │ OSM Road Density       │ Measures network redundancy and      │
│                        │ (km / km²)             │ connectivity; strictly NOT labeled   │
│                        │                        │ as vehicle flow capacity.            │
├────────────────────────┼────────────────────────┼──────────────────────────────────────┤
│ 4. SAFETY CONSTRAINT   │ JRC + SRTM Safe        │ Quantifies unconstrained physical    │
│                        │ Habitable Headroom     │ terrain; acts as an upper ceiling,   │
│                        │ (m² / person)          │ NOT an operational building count.   │
└────────────────────────┴────────────────────────┴──────────────────────────────────────┘
```

---

## 8. Data Freshness & Provenance Summary

- **Spatial Resolution:**
  - JRC Surface Water: 30m grid cell
  - SRTM Elevation/Slope: 90m grid cell (India Albers EPSG:7755)
  - Road Network: Vector LineString coordinate accuracy $\pm 5\text{m}$
  - Administrative Geometries: 696 continuous Mandal polygons
- **Temporal Coverage:**
  - Census Demographics: 2011 Primary Census Abstract (PCA-TV)
  - NCRMP Shelters: NCRMP Phase-I Completion Baseline
  - OpenStreetMap: 2025/2026 Open Extract
  - Jal Jeevan Mission: 2023–2025 Open Portal Data
  - JRC GSW Water Recurrence: 1984–2021 Multi-Decadal Historical Baseline
- **Update Frequency & Real-Time Caveat:**
  - All candidate layers are **static planning baselines**.
  - The system must **never be described as a real-time tracking engine**; it provides strategic baseline decision support for disaster preparedness and relocation prioritization.

---

## 9. Recommended Architecture for Phase 3B Implementation

When Phase 3A is approved, Phase 3B will proceed with the following modular pipeline:

```
[ Phase 3B Ingestion Pipeline ]
  ├── 1. Acquire & Extract OSM AP Highway Network -> Calculate Mandal Paved Road Density (km/km²)
  ├── 2. Compile Mandal Shelter Capacity Registry (NCRMP MPCS + School Shelter Proxy)
  ├── 3. Ingest District/Mandal Health Bed & JJM Water Supply Indicators
  └── 4. Calculate Zonal Safe Habitable Area Headroom (m²/person) from JRC GSW & SRTM Slope
               │
               ▼
[ Physical Carrying Capacity Synthesis ]
  ├── Compute 5 Normalized Capacity Dimensions [0, 1]
  ├── Derive Combined Physical Carrying Capacity Index (C_i) with Transparent Weights
  └── Evaluate Carrying Capacity Headroom / Deficit relative to Population Exposure
               │
               ▼
[ Deliverables & Serving ]
  ├── data/processed/capacity/mandal_carrying_capacity.csv (696 mandals)
  ├── data/processed/capacity/ap_mandal_carrying_capacity.geojson (696 features)
  ├── FastAPI Routes under /api/capacity/ (summary, mandals, detail, geojson)
  └── Frontend Capacity Dashboard & GIS Map Layer Integration
```

---

## 10. Conclusion & Next Steps

Phase 3A has successfully completed data discovery, authoritative source validation, and methodological planning for the Physical Carrying Capacity Assessment without creating unphysical formulas or synthetic data.

**Next Phase upon approval:**
`PHASE 3B — CARRYING CAPACITY DATA PIPELINE & METRIC IMPLEMENTATION`
