# Data Sources Catalog — Sahayata

This document catalogs the required datasets for the multi-hazard decision-support platform (Andhra Pradesh Pilot & General Architecture).

> [!IMPORTANT]
> In accordance with project integrity principles, no unverified URLs, synthetic registries, or fabricated portals are listed. Unverified candidate layers are explicitly marked **TO BE RESEARCHED**. Verified datasets are detailed in:
> - Data Verification Plan: [docs/phase1a_data_verification.md](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/docs/phase1a_data_verification.md)
> - Boundary Acquisition: [docs/phase1b_admin_boundary_acquisition.md](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/docs/phase1b_admin_boundary_acquisition.md)
> - Census Demographics: [docs/phase1c_census_crosswalk.md](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/docs/phase1c_census_crosswalk.md)
> - Crosswalk Quality: [docs/phase1c5_crosswalk_quality.md](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/docs/phase1c5_crosswalk_quality.md)
> - Interactive GIS Foundation: [docs/phase1d_gis_foundation.md](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/docs/phase1d_gis_foundation.md)
> - Hazard Data Validation (Phase 2A): [docs/phase2a_hazard_data_validation.md](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/docs/phase2a_hazard_data_validation.md)
> - Hazard Data Acquisition & Harmonization (Phase 2B): [docs/phase2b_hazard_data_acquisition.md](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/docs/phase2b_hazard_data_acquisition.md)
> - Mandal Hazard Exposure Analysis (Phase 2C): [docs/phase2c_mandal_hazard_exposure.md](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/docs/phase2c_mandal_hazard_exposure.md)
> - Population Vulnerability & Hazard Intersection (Phase 2D): [docs/phase2d_population_vulnerability.md](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/docs/phase2d_population_vulnerability.md)
> - Physical Carrying Capacity Data Research & Validation (Phase 3A): [docs/phase3a_carrying_capacity_data_validation.md](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/docs/phase3a_carrying_capacity_data_validation.md)
> - Physical Carrying Capacity Data Pipeline & Metric Implementation (Phase 3B): [docs/phase3b_carrying_capacity_implementation.md](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/docs/phase3b_carrying_capacity_implementation.md)
> - Capacity Adequacy, Bottlenecks & Host-Zone Screening (Phase 3C): [docs/phase3c_capacity_adequacy_and_bottlenecks.md](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/docs/phase3c_capacity_adequacy_and_bottlenecks.md)
> - Multi-Criteria Relocation Prioritization (Phase 4): [docs/phase4_relocation_prioritization.md](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/docs/phase4_relocation_prioritization.md)
> - Explainable What-If Disaster Simulation (Phase 5): [docs/phase5_what_if_simulation.md](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/docs/phase5_what_if_simulation.md)
> - Decision & Action Planning (Phase 6): [docs/phase6_decision_action_planning.md](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/docs/phase6_decision_action_planning.md)

---






## 1. Foundational Administrative & Demographic Layers

| # | Data Layer | Description / Purpose | Spatial Format | Custodian / Source | Status |
|---|---|---|---|---|---|
| 1 | **Administrative Boundaries** | State, 26 Districts, and 696 Mandals for Andhra Pradesh | GeoJSON (EPSG:4326) | AP Gazette / ECI Compilation | `VALIDATED & ACCESSIBLE (Served via /api/gis/...)` |
| 2 | **Demographics & Population** | 17,039 villages (Population, Households, 0–6, SC, ST, Workers) | Tabular CSV | Census of India 2011 (PCA-TV) | `VALIDATED & ACCESSIBLE (Served via /api/demographics/...)` |
| 3 | **Administrative Crosswalk** | 100% verified village → mandal → 26-district mapping | Tabular CSV | AP Gazette No. 192 / Census MDDS | `VALIDATED & ACCESSIBLE (data/processed/census/)` |

---

## 2. Multi-Hazard Data Layers (Phase 2B Status)

| # | Hazard Category | Dataset / Layer Name | Custodian / Source | Format / Resolution | Status | File Path / Usability |
|---|---|---|---|---|---|---|
| 4 | **Flood** | Global Surface Water (GSW) Recurrence (1984–2021) | EC JRC / Google Earth Engine | GeoTIFF (30m, EPSG:4326) | `ACQUIRED & HARMONIZED` | `data/processed/hazard/flood/ap_water_recurrence.tif` (32,020 × 26,172 px) |
| 5 | **Flood** | Flood Hazard Zonation Atlas of Andhra Pradesh | NRSC / ISRO / NDMA | PDF Atlas / Bhuvan Viewer | `RESEARCHED (BENCHMARK)` | Calibration benchmark for mandal flood zonation. |
| 6 | **Flood** | APSAC Michaung Flood Inundation Layer | APSAC GeoServer (`gatishakti`) | OGC WMS (Raster tiles) | `VISUALIZATION-ONLY` | Map overlay only. Public WFS is disabled. |
| 7 | **Flood** | River Gauge Warning & High Flood Levels (HFL) | CWC / NWIC (India-WRIS) | Tabular CSV / Point Stations | `VALIDATED & ACCESSIBLE` | Hydrological monitoring along Godavari & Krishna channels. |
| 8 | **Cyclone** | IBTrACS v04 Tropical Cyclone Tracks (Bay of Bengal) | NOAA / WMO / IMD | GeoJSON LineStrings (EPSG:4326) | `ACQUIRED & HARMONIZED` | `data/processed/hazard/cyclone/ap_bay_of_bengal_tracks.geojson` (4,356 segments) |
| 9 | **Wind** | Basic Design Wind Speed Zones ($V_b$) | BMTPC / BIS (IS 875 Part 3: 2015) | GeoJSON / CSV (EPSG:4326) | `ACQUIRED & HARMONIZED` | `data/processed/hazard/wind/ap_district_wind_hazard.geojson` (26 districts) |
| 10 | **Coastal / Surge** | Storm Surge Maximum Probable Height (MPSS) | INCOIS | Hydrodynamic Model / Bulletins | `RESEARCHED` | Coastal low-elevation thresholds (<5m MSL within 5 km coast). |
| 11 | **Coastal / Surge** | Cyclone Shelter Infrastructure | APSAC GeoServer (`gatishakti`) | OGC WMS (Point symbology) | `VISUALIZATION-ONLY` | Map overlay in Leaflet. |
| 12 | **Topography** | Digital Elevation Model (SRTM 90m) | CGIAR-CSI / NASA | GeoTIFF (90m, EPSG:4326) | `ACQUIRED & HARMONIZED` | `data/processed/hazard/elevation/ap_dem_90m.tif` (Elevation: -35m to 1,664m) |
| 13 | **Slope** | Terrain Slope in Degrees | Derived from SRTM 90m in EPSG:7755 | GeoTIFF (90m, EPSG:7755) | `ACQUIRED & HARMONIZED` | `data/processed/hazard/slope/ap_slope_degrees.tif` (Slope: 0° to 64.68°) |
| 14 | **Landslide** | National Landslide Susceptibility Mapping (NLSM) | Geological Survey of India (GSI) | Bhukosh Map Service | `RESTRICTED` | Localized to Eastern Ghats (~10k km²). Raw vector download restricted. |
| 15 | **Coastal Erosion** | Shoreline Change Atlas of India (AP Coast) | NCCR (Ministry of Earth Sciences) | Monographs / Sector Maps | `RESEARCHED` | Hotspot identification along beachfront habitations. |
| 16 | **Drought** | Standardized Precipitation Index (SPI) / Bulletins | IMD / APSDMA / MNCFC | Tabular / Raster | `NOT SUITABLE FOR RELOCATION` | Agricultural/water stress hazard; managed via irrigation relief, not relocation. |
| 17 | **Earthquake** | Seismic Zoning Map of India (BIS 1893: 2016) | BIS / NCS | Tabular / District Classification | `NOT SUITABLE FOR RELOCATION` | Uniform regional zoning (Zone II & III); managed via building code compliance. |

---

## 3. Physical Carrying Capacity Data Layers (Phase 3A Status)

| # | Dimension | Dataset / Layer Name | Custodian / Source | Format / Resolution | Usability Category | Role in Capacity Modeling |
|---|---|---|---|---|---|---|
| 18 | **Shelter Capacity** | NCRMP Multi-Purpose Cyclone Shelters (MPCS) | NDMA / APSDMA / World Bank | Tabular Project Baseline | `A — DIRECTLY USABLE` | Direct emergency shelter capacity (300, 500, 1,000 persons) across coastal mandals. |
| 19 | **Shelter Capacity** | UDISE+ Government School Infrastructure | MoE / AP School Education | Tabular CSV | `A — DIRECTLY USABLE` | Secondary emergency shelter proxy derived from covered school classroom area ($\ge 3.5\text{ m}^2/\text{person}$). |
| 20 | **Evacuation Roads** | OpenStreetMap (OSM) AP Highway Network | OSM Contributors / Geofabrik | Vector GeoJSON LineStrings | `B — USABLE AS PROXY` | Evaluates Evacuation Road Density ($km/km^2$) as a network redundancy proxy (NOT vehicle flow bandwidth). |
| 21 | **Evacuation Roads** | PMGSY All-Weather Road Connectivity | MoRD / OMMAS | Tabular / Portal Registry | `B — USABLE AS PROXY` | Measures all-weather paved road connectivity percentage to rural habitations. |
| 22 | **Health Infrastructure** | National Health Facility Registry (NHFR) | MoHFW / ABDM | Tabular CSV | `A — DIRECTLY USABLE` | Normative hospital bed capacity per 1,000 population derived from IPHS 2022 facility standards. |
| 23 | **Water Supply** | Jal Jeevan Mission (JJM) Rural Piped Water | DDWS / Ministry of Jal Shakti | Dashboard / Tabular API | `A — DIRECTLY USABLE` | Functional Household Tap Connection (FHTC %) and 55 LPCD minimum humanitarian threshold. |
| 24 | **Sanitation** | Swachh Bharat Mission - Gramin (SBM-G) | Ministry of Jal Shakti | Open Portal CSV | `A — DIRECTLY USABLE` | Baseline rural household sanitation and community sanitary facility coverage (%). |
| 25 | **Safe Habitable Area** | Zonal Hazard Exclusion Spatial Headroom | Derived from JRC GSW + SRTM Slope | Metric Raster Overlay (EPSG:7755) | `A — DIRECTLY USABLE` | Safe habitable land area ($m^2/\text{person}$) evaluated against Sphere Humanitarian Standard ($\ge 45\text{ m}^2/\text{person}$). |

---

## 4. Data Ingestion & Governance Principles

1. **Analysis-Ready Requirement:** Only datasets in **Category A (Analysis-Ready)** featuring verified spatial coordinates, native geometry/raster formats (GeoTIFF, Shapefile, GeoJSON), and documented projection systems (EPSG:4326 / EPSG:7755) are permitted into the quantitative scoring engine.
2. **WMS Isolation:** WMS services from APSAC or Bhuvan are strictly isolated as **visualization-only layers** in the Leaflet frontend. No script may treat raster WMS pixels as vector analytical units.
3. **No Synthetic Data:** Synthetic hazard values or fabricated GIS boundaries are strictly forbidden. Where data is restricted or localized (e.g. GSI Landslide), the limitation must be documented transparently.
4. **Physical Capacity Standards:** Capacity metrics must maintain physical units (persons, beds, $km/km^2$, $m^2/\text{person}$) and avoid unphysical dimensionless divisions.

