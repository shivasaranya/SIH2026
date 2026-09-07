# Project State — Sahayata

## Project Metadata
- **Project Name:** Sahayata
- **Problem Statement ID:** SIH26191
- **Title:** Intelligent Identification of Hazard-Based Red Zones, Carrying Capacity Assessment, and Immediate Relocation Needs for Vulnerable Habitations
- **Domain:** Disaster Management
- **Initial Pilot:** Andhra Pradesh, India
- **Current Phase:** PHASE 2C — MANDAL-LEVEL HAZARD EXPOSURE ANALYSIS (COMPLETED)

---

## Phase Status

### Completed
- **Phase 0 (Project Foundation):**
  - Project directory hierarchy established (`frontend/`, `backend/`, `data/`, `docs/`, `scripts/`, `tests/`)
  - Modular FastAPI backend initialized and health endpoint (`GET /api/health`) verified
  - React + TypeScript + Vite + Tailwind CSS shell created and build verified
  - Schema planning for PostgreSQL + PostGIS spatial tables documented
  - Core methodology and architecture specifications authored
- **Phase 1A (Data Source Verification):**
  - Authoritative sources investigated (APSAC, Bhuvan/NRSC, Survey of India, Census of India, DES AP/APSDPS)
  - Live verification of APSAC OGC WMS endpoints (`gatishakti1` and `gatishakti`)
  - WFS capability audit confirming public vector WFS is disabled on APSAC GeoServer
  - Census 2011 Primary Census Abstract (PCA) village-level tabular data availability verified
  - `docs/phase1a_data_verification.md` and `DATA_SOURCES.md` created
- **Phase 1B (Administrative Boundary Vector Acquisition & Validation):**
  - Official AP Gazette & ECI reorganization compilation acquired for Andhra Pradesh 26 districts and 696 mandals
  - Original vector files preserved in `data/raw/admin/`
  - Processed vector layer created in `data/processed/admin/andhra_pradesh_26_districts.geojson` (consolidated into 26 distinct MultiPolygon/Polygon features with 0 duplicate IDs)
  - 12-point automated validation performed (`scripts/validate_admin_boundaries.py` passed with 0 invalid geometries)
  - Comprehensive report authored: `docs/phase1b_admin_boundary_acquisition.md`
- **Phase 1C (Census 2011 Demographics & Initial Crosswalk):**
  - Official Primary Census Abstract (PCA-TV) tables acquired for all 13 legacy AP districts from Census of India NADA portal
  - 13 original Excel workbooks preserved in `data/raw/census/`
  - Baseline crosswalk established (92.72% direct, 5.07% alias, 2.21% unmatched)
  - Documentation authored: `docs/phase1c_census_crosswalk.md`
- **Phase 1C.5 (Crosswalk Quality Improvement & Disambiguation):**
  - Resolved homonymous mandals via composite key spatial containment `(legacy_district, mandal_name)`
  - Authoritatively verified all transliteration variations against AP Gazette No. 192 (2022) and Census DCHBs
  - Verified Karvetinagar retention in Chittoor district per Gazette No. 192
  - Generated formal crosswalk file: `data/processed/census/ap_administrative_crosswalk.csv` (**17,039 records, 100% VERIFIED, HIGH confidence**)
  - Regenerated master demographic dataset: `data/processed/census/ap_village_demographics.csv` with synchronized verified district mappings
  - Documentation authored: `docs/phase1c5_crosswalk_quality.md`
- **Phase 1D (Interactive GIS Foundation & Backend Serving):**
  - Implemented FastAPI backend routes: `GET /api/gis/districts`, `GET /api/gis/mandals`, `GET /api/demographics/summary`, `GET /api/demographics/district/{district_id}`
  - Verified all backend endpoints with pytest (8 tests passed in 2.98s)
  - Built interactive Leaflet GIS frontend in React + TypeScript with CartoDB Dark Matter basemap, 26-district choropleth, mandal boundary vector overlays, and optional APSAC WMS hazard layers
  - Built floating MapControls (metric selector, layer toggles, view reset), dynamic MapLegend, DistrictInfoPanel (with mandals search and Census 2011 caveat), and StateOverviewCards
  - Verified frontend production build (`npm run build` completed with 0 errors)
  - Documentation authored: `docs/phase1d_gis_foundation.md`
- **Phase 2A (AP Hazard Data Research & Validation):**
  - Evaluated 12 authoritative candidate datasets across Flood, Cyclone, Wind, Landslide, and secondary hazards
  - Established critical distinction between Analysis-Ready data vs. WMS visualization-only data
  - Confirmed APSAC WMS layers are visualization-only (WFS disabled)
  - Documented localized nature of landslide risk in AP (restricted to ~2% of AP land in Eastern Ghats)
  - Documentation authored: `docs/phase2a_hazard_data_validation.md`
- **Phase 2B (Hazard Data Acquisition & Spatial Harmonization):**
  - Downloaded and processed EC JRC Global Surface Water (GSW) 30m Water Recurrence raster (1984–2021), clipped to AP 26 districts (`ap_water_recurrence.tif`, 32,020 × 26,172 px)
  - Acquired NOAA / WMO / IMD IBTrACS v04 Bay of Bengal cyclone tracks, filtered to AP 150 km impact zone (`ap_bay_of_bengal_tracks.geojson`, 4,356 track segments, 445 storms)
  - Joined BMTPC / BIS IS 875 Basic Design Wind Speed ($V_b$) to all 26 districts (`ap_district_wind_hazard.geojson`, 50 m/s, 47 m/s, 44 m/s)
  - Downloaded and mosaiced CGIAR-CSI SRTM 90m DEM clipped to AP (`ap_dem_90m.tif`, -35m to 1,664m)
  - Derived terrain slope in degrees on metric grid in India Albers Equal Area EPSG:7755 (`ap_slope_degrees.tif`)
  - Documented CRS strategy accounting for AP spanning 3 UTM zones (43N, 44N, 45N)
  - 13 backend pytest tests passed
  - Documentation authored: `docs/phase2b_hazard_data_acquisition.md`
- **Phase 2C (Mandal-Level Hazard Exposure Analysis):**
  - Processed all 696 mandals with unique indexing (`AP_MANDAL_001` through `AP_MANDAL_696`) and verified 26-district parentage
  - Extracted 30m JRC water recurrence zonal stats (mean, max, area $\ge 10\%, 25\%, 50\%$)
  - Computed 50 km cyclone buffer metrics (distinct storms, track density per 1,000 km², nearest track distance) in EPSG:7755
  - Joined BIS IS 875 Basic Wind Speeds ($V_b$) and normalized to $[0, 1]$
  - Derived mean elevation, mean slope, and percentage area with slope $> 25^\circ$ as terrain constraint
  - Documented strict exclusion of storm surge from quantitative scoring
  - Synthesized bounded Multi-Hazard Exposure Index ($H_i \in [0.0254, 0.6356]$) with transparent weights ($w_{\text{flood}}=0.40, w_{\text{cyclone}}=0.30, w_{\text{wind}}=0.20, w_{\text{slope}}=0.10$)
  - Generated output tables: `mandal_flood_exposure.csv`, `mandal_cyclone_exposure.csv`, `mandal_wind_exposure.csv`, `mandal_terrain_exposure.csv`, `mandal_multi_hazard_exposure.csv`
  - Created valid master GeoJSON: `ap_mandal_multi_hazard_exposure.geojson` (696 features)
  - Implemented FastAPI endpoints: `/api/hazard/summary`, `/api/hazard/mandals`, `/api/hazard/mandal/{id}`, `/api/hazard/geojson`
  - 22 backend pytest tests passed; frontend build succeeded
  - Documentation authored: `docs/phase2c_mandal_hazard_exposure.md`
- **Phase 2D (Population Vulnerability & Hazard Intersection):**
  - Aggregated 17,039 Census 2011 rural village records to all 696 mandal geometries (36,040,445 rural inhabitants)
  - Computed normalized demographic sensitivity indicators (child share 0–6, female share, SC share, ST share, non-worker dependency share)
  - Formulated baseline Demographic Sensitivity Index ($D_i \in [0, 1]$)
  - Calculated planning-level Exposure-Weighted Population ($P_i \times H_i = 10,290,046.7$)
  - Synthesized composite Vulnerability Index ($V_i = 0.60 D_i + 0.40 H_i \in [0.0698, 0.5502]$)
  - Established analytical bands (Low, Moderate, High, Very High) and Priority Quadrant Matrix (Q1: 151 mandals, Q2: 202, Q3: 189, Q4: 154)
  - Created outputs: `mandal_demographic_vulnerability.csv`, `ap_mandal_vulnerability.geojson`, `vulnerability_summary.csv`
  - Added backend endpoints under `/api/vulnerability` (`/summary`, `/mandals`, `/mandal/{id}`, `/geojson`)
  - All 33 backend tests passed; frontend build succeeded
  - Documentation authored: `docs/phase2d_population_vulnerability.md`

- **Phase 3A (Physical Carrying Capacity Data Research & Validation):**
  - Investigated official AP and national datasets across 4 physical dimensions: Designated Shelter Capacity, Evacuation Road Accessibility, Critical Health/Water Infrastructure, and Safe Habitable Area Headroom
  - Verified NCRMP Phase-I MPCS registry (1,053 Multi-Purpose Cyclone Shelters with standard 300/500/1,000 person design capacities) and UDISE+ school emergency shelter proxy
  - Evaluated OpenStreetMap highway network and PMGSY all-weather road connectivity; established that dynamic vehicle flow capacity is unavailable in open GIS and defined Evacuation Road Density ($km/km^2$) as a strictly labeled accessibility proxy
  - Ingested National Health Facility Registry (NHFR) tier classifications aligned with Indian Public Health Standards (IPHS 2022) normative bed capacities
  - Derived spatial safe habitable area formulation from 30m JRC surface water recurrence ($R \ge 10\%$) and SRTM 90m slope ($> 25^\circ$) against Sphere Project humanitarian minimum standards ($\ge 45 \text{ m}^2 / \text{person}$)
  - Formally documented habitation vs mandal level feasibility, establishing a 2-tier spatial framework (696 continuous mandal polygons + 17,039 village tabular attribution)
  - Compiled 11-dataset ranking table (6 Category A directly usable, 2 Category B proxy-usable, 1 Category C reference-only, 1 Category D restricted)
  - Probed active endpoints and authored comprehensive methodology report: `docs/phase3a_carrying_capacity_data_validation.md`

- **Phase 3B (Physical Carrying Capacity Pipeline & Implementation):**
  - Built reproducible pipeline script `scripts/calculate_mandal_capacity.py` processing all 696 mandals
  - Compiled designated cyclone shelter registry (1,009,700 rated persons capacity across 381 coastal mandals; NCRMP Phase-I)
  - Explicitly marked UDISE+ usable school emergency space as `null` / unavailable (prevented fabrication)
  - Ingested normative health bed baseline (21,084 normative beds across AP rural mandals; IPHS 2022 standards)
  - Evaluated water and sanitation infrastructure adequacy (mean: 81.35% adequacy; JJM + SBM-G)
  - Calculated OpenStreetMap evacuation road density (198,000.7 km total corridors; mean density: 1.259 km/km²) labeled strictly as Accessibility Proxy
  - Derived safe habitable land area headroom (mean: 91.97% safe fraction, 3,612.4 m²/person headroom; JRC GSW 30m + SRTM 90m slope)
  - Generated deliverables: `mandal_capacity_components.csv`, `ap_mandal_capacity_components.geojson`, `capacity_summary.csv`
  - Created backend endpoints (`/api/capacity/summary`, `/api/capacity/mandals`, `/api/capacity/mandal/{id}`, `/api/capacity/geojson`)
  - Integrated interactive frontend with Layer Controls, dynamic tooltips, and MandalDetailPanel with explicit taxonomy badges (DIRECT, PROXY, NORMATIVE, SPATIAL CONSTRAINT, UNAVAILABLE)
  - Passed all 45 backend pytest tests; frontend build succeeded in 647ms with 0 errors
- **Phase 3C (Capacity Adequacy, Bottleneck Analysis & Host-Zone Screening):**
  - Formulated component-level adequacy metrics (shelter coverage ratio & deficit, normative health beds vs. IPHS benchmark, JJM/SBM water adequacy, OSM road accessibility, safe habitable area fraction)
  - Built Physical Bottleneck Identification Engine discovering limiting physical resources per mandal without artificial single-index collapse (Primary Bottlenecks: 532 health beds, 147 cyclone shelters, 1 safe area)
  - Implemented missing-data exclusion in bottleneck ranking to prevent false penalties on inland areas (mean data completeness: 87.2%)
  - Established Capacity Condition analytical classifications (603 severely constrained, 77 constrained, 16 insufficient data)
  - Screened 51 candidate host mandals meeting low hazard ($H_i < 0.30$), low vulnerability ($V_i < 0.35$), and safe headroom ($\ge 85\%$, $\ge 500\text{ m}^2/\text{p}$)
  - Generated geodesic planar metric distances in EPSG:7755 (India Albers Equal Area), producing 2,088 screened candidate pairs with explicit label `"CANDIDATE HOST ZONE — HUMAN REVIEW REQUIRED"`
  - Generated deliverables: `mandal_capacity_adequacy.csv`, `mandal_bottlenecks.csv`, `host_zone_candidates.csv`, `ap_mandal_capacity_adequacy.geojson`
  - Created backend endpoints (`/api/capacity/adequacy/summary`, `/api/capacity/adequacy/mandals`, `/api/capacity/adequacy/mandal/{id}`, `/api/capacity/bottlenecks`, `/api/capacity/host-zones/{id}`)
  - Updated frontend MandalDetailPanel with Capacity Condition banners, Primary/Secondary Bottlenecks, and Candidate Host Zones list
  - Passed all 52 backend pytest tests; frontend build succeeded in 678ms with 0 errors
- **Phase 4 (Multi-Criteria Relocation Prioritization):**
  - Formulated four orthogonal decision criteria: Hazard Exposure ($C_1$), Demographic Sensitivity ($C_2$), Capacity Stress ($C_3$), and Accessibility Constraint ($C_4$).
  - Evaluated double-counting prevention: explicitly used Demographic Sensitivity ($D_i$) as $C_2$ rather than composite $V_i$ to prevent duplicating hazard contributions.
  - Implemented AHP pairwise comparison matrix on Saaty's 1–9 scale deriving verified criterion weights ($C_1: 0.4231, C_2: 0.2274, C_3: 0.2274, C_4: 0.1221$) with strict Consistency Ratio $CR = 0.0038 \ll 0.10$.
  - Implemented TOPSIS relative closeness coefficient ($CC_i \in [0, 1]$) ranking all 680 populated mandals without black-box AI scoring.
  - Assigned distribution-based quantile priority bands (68 Very High, 136 High, 272 Moderate, 204 Low, 16 Insufficient Data).
  - Computed itemized percentage factor contributions and deterministic explainability text for every mandal.
  - Linked Phase 3C screened Candidate Host Zones with distances in EPSG:7755 (India Albers Equal Area) labeled `"CANDIDATE HOST ZONE — HUMAN REVIEW REQUIRED"`.
  - Created deliverables: `mandal_relocation_priority.csv`, `relocation_factor_contributions.csv`, `ahp_weights.csv`, `topsis_diagnostics.csv`, `relocation_priority_summary.csv`, `ap_mandal_relocation_priority.geojson`.
  - Built backend endpoints under `/api/relocation/...`.
  - Integrated interactive frontend with TOPSIS choropleth, layer controls, and detailed explanation breakdown in MandalDetailPanel.
  - Documentation authored: `docs/phase4_relocation_prioritization.md`.
- **Phase 5 (Explainable What-If Disaster Simulation):**
  - Built near-instant deterministic simulation engine on top of Phase 4 precomputed indicators.
  - Defined 4 constrained scenario parameters (Hazard $[-30\%, +50\%]$, Population $[-20\%, +30\%]$, Capacity $[-30\%, +50\%]$, Accessibility $[-50\%, +50\%]$) with strict sensitivity semantics.
  - Implemented comparative TOPSIS engine preserving official Phase 4 AHP weights and reference normalizers.
  - Designed deterministic factor contribution breakdown and template-based explanation strings for all 680 mandals.
  - Configured 4 scenario presets (Baseline, Severe Hazard, Extreme Stress, Improved Preparedness).
  - Built backend APIs (`/api/simulation/run`, `/api/simulation/presets`, `/api/simulation/mandal/{id}`) with Pydantic validation.
  - Created interactive frontend `SimulationPanel` with real-time sliders, comparison cards, delta visualization, and detail panel extensions.
  - Authored documentation: `docs/phase5_what_if_simulation.md`.
- **Phase 6 (Decision & Action Planning):**
  - Completed pre-implementation audit (`docs/phase6_preimplementation_audit.md`).
  - Implemented Indicative Capacity Gap analysis benchmarking against IPHS 2022 and Sphere standards with explicit missing-data preservation.
  - Built deterministic 3-horizon Action Planning engine (Immediate Emergency, Short-Term Mitigation, Long-Term Planning).
  - Integrated Candidate Host-Zone side-by-side comparison engine (Advantages, Constraints, Missing Data).
  - Built backend APIs under `/api/decision/...` and passed all 80 backend unit tests.
  - Implemented frontend multi-tab detail panel and `HostComparisonModal`.
  - Authored documentation: `docs/phase6_decision_action_planning.md`.
- **Phase 7A (Multi-State Platform Expansion — Tamil Nadu & Mizoram):**
  - Generalized the backend architecture to be fully state-agnostic via `app/core/state_registry.py`.
  - Implemented end-to-end data pipeline and decision support for **Tamil Nadu** (38 districts, 302 taluks, coastal delta vulnerability).
  - Built and validated full pipeline for **Mizoram** (11 districts, 26 R.D. blocks, hilly terrain landslide & multi-hazard risk).
  - Unified frontend state selector, map bounds switcher, and dynamic admin unit handling (`Mandals`, `Taluks`, `R.D. Blocks`).
  - Implemented state-aware API query parameters with backward compatibility.
- **Phase 7B (Cadastral Village Spatial Hazard Analysis & 4-Sector Engine):**
  - Integrated Survey of India (SOI) high-resolution cadastral boundary geometries matched 1:1 to Census 2011 village codes (17,039 habitations in AP).
  - Built continuous spatial raster sampling for 30m JRC surface water recurrence, 90m SRTM DEM/slope, and NOAA IBTrACS cyclone track vectors.
  - Formulated 4-Cardinal Direction quadrant partitioning ($S_N, S_E, S_S, S_W$) clipped to village polygons with mathematical area preservation ($\Delta A < 0.05\text{ km}^2$).
  - Established micro-topography slope threshold ($\ge 15^\circ$) for village habitation access tracks, distinct from mandal civil engineering exclusion ($> 25^\circ$).
  - Built real-time what-if scenario perturbation engine (0%–10% stress test).
  - Created interactive `VillageAnalysisPage.tsx` and `VillageSpatialPanel.tsx`.
  - Authored documentation: `docs/ap_village_spatial_analysis.md` and `docs/ap_village_spatial_data_audit.md`.
- **Phase 7C (Safer Locations Protocol & MCDA Decision B Engine):**
  - Separated Relocation Priority (Decision A: AHP + TOPSIS) from Potential Safer Locations (Decision B: Multi-Criteria Decision Analysis).
  - Established research-grounded principle: NCRMP 1.5–2 km is a cyclone shelter service/design radius, NOT an evacuation limit.
  - Implemented Hard Safety Filters (hazard $\ge 0.35$ or safe land $< 50\%$ rejected; capacity-stressed rejected; road $< 0.15$ rejected).
  - Established 4 administrative proximity tiers (Same Mandal, Adjacent Mandal, Farther Mandal, Different District) as soft preferences without rigid cutoffs.
  - Redesigned `CandidateLocationsPage.tsx` featuring 🥇 Recommended, 🥈 Alternative, 🥉 Fallback tiers, transparent rejection reasons, and human-readable explanations.
  - Authored documentation: `docs/andhra_pradesh_relocation_logic.md`.

### Current
- **Multi-State Operational Coverage**: Andhra Pradesh (696 mandals, 17,039 villages), Tamil Nadu (302 taluks), Mizoram (26 R.D. blocks).
- **Backend Test Suite**: 112 / 112 tests passing across all states, pipelines, spatial sampling, and decision modules.
- **Frontend Build**: Production build clean with 0 errors.

### Status Summary
- **Phase 0:** Project Foundation — **COMPLETE**
- **Phase 1A–1D:** AP Admin GIS, Demographics, Crosswalk, Baseline APIs & Frontend — **COMPLETE**
- **Phase 2A–2D:** Hazard Acquisition, Mandal Exposure, Vulnerability Intersection — **COMPLETE**
- **Phase 3A–3C:** Carrying Capacity Validation, Physical Deficits, Host-Zone Screening — **COMPLETE**
- **Phase 4:** Multi-Criteria Relocation Prioritization (AHP + TOPSIS) — **COMPLETE**
- **Phase 5:** Explainable What-If Disaster Simulation — **COMPLETE**
- **Phase 6:** Decision & Action Planning — **COMPLETE**
- **Phase 7A:** Multi-State Architecture Expansion (AP, TN, Mizoram) — **COMPLETE**
- **Phase 7B:** Village Cadastral Spatial Analysis & 4-Sector Engine — **COMPLETE**
- **Phase 7C:** Safer Locations Protocol & MCDA Decision B Engine — **COMPLETE**
- **Phase 7D:** Mizoram Full State Implementation & Multi-Hazard Pipeline — **COMPLETE**
  - Administrative boundary acquisition (11 districts, 26 R.D. Blocks) from Survey of India (SOI) & MIRSAC.
  - Census 2011 Primary Census Abstract (PCA) demographics ingested with care dependency proxy (children 0-6, household congestion, non-workers). Zero caste or gender vulnerability scoring.
  - Multi-hazard pipeline tailored to inland mountainous geography: slope & landslide hazard (40%), GSW flood inundation (35%), basic design wind speed IS 875 (25%), zero fake cyclone tracks.
  - Carrying capacity headroom: shelter capacity (DM&R & YMA halls), evacuation road access, safe land headroom (>1,500 m²/person), water & sanitation, healthcare bed standards.
  - Saaty AHP pairwise matrix (CR = 0.0038 < 0.10) and TOPSIS MCDA relative closeness ranking across all 26 R.D. Blocks (2 Very High, 5 High, 11 Moderate, 8 Low).
  - 5 screened candidate host zones identified (Champhai, Zawlnuam, Bilkhawthlir, Lawngtlai, 'N' Thingdawl).
  - Full UI integration with state-dynamic routing (`#government/mz/...`), custom map bounds, what-if simulator, 3-horizon action plans, and complete provenance documentation (`docs/mizoram_state_implementation.md`).
  - 100% backend test pass (112/112 tests) and 0 frontend build errors.
  - Zero regression for Andhra Pradesh and Tamil Nadu.







---

## Major Architectural Decisions

1. **Decision Support Only (Human-in-the-Loop)**
   - The platform strictly provides decision *support* and analytical rankings to disaster management authorities.
   - The system must never claim or be designed to automatically mandate or order habitation relocations.

2. **Modular and State-Agnostic Core**
   - Andhra Pradesh is the initial pilot jurisdiction.
   - Core data pipelines, risk models, carrying-capacity formulas, and ranking engines are strictly decoupled from state-specific parameters.

3. **Mandal as Primary Spatial Analysis Unit**
   - In the absence of open official village boundary polygons, spatial exposure is calculated strictly at the Mandal level (696 features).
   - Village demographic records inherit parent mandal exposure scores, avoiding false claims of sub-mandal spatial measurement.

4. **Multi-Hazard Layering & Projection Strategy**
   - Equal-area and metric gradient derivations use **India Albers Equal Area (EPSG:7755)** to prevent scale distortion across AP's 3 UTM zones (43N, 44N, 45N), while web interchange maintains **WGS84 (EPSG:4326)**.

5. **Physically Meaningful Carrying Capacity**
   - Carrying capacity must be expressed in physically measurable units (habitable area, shelter capacity, water availability, road bandwidth) rather than ambiguous dimensionless indices.
