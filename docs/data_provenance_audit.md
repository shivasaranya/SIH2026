# Data Provenance & Lineage Audit

**Project:** Sahayata (SIH26191)  
**Pilot Jurisdiction:** Andhra Pradesh (696 Administrative Mandals)  
**Audit Purpose:** Comprehensive Data Traceability, Verification, and Provenance Classification  

---

## 1. Dataset Classification Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  DATASET PROVENANCE AUDIT MATRIX                                       │
├───────────────────┬────────────────────┬───────────┬──────────────┬───────────────┬────────────────────┤
│ Dataset Name      │ Primary Source     │ Year      │ Spatial Res. │ Classification│ Processing Applied │
├───────────────────┼────────────────────┼───────────┼──────────────┼───────────────┼────────────────────┤
│ AP Admin Mandals  │ Survey of India /  │ 2022 Post-│ Vector       │ OFFICIAL      │ Reprojected to     │
│ & 26 Districts    │ APSAC / OGD India  │ Bifurc.   │ Polygons     │               │ EPSG:7755 / 4326   │
├───────────────────┼────────────────────┼───────────┼──────────────┼───────────────┼────────────────────┤
│ Village & Mandal  │ Census of India    │ 2011      │ Habitation / │ OFFICIAL      │ 17,000+ villages   │
│ Demographics      │ PCA Table          │           │ Mandal Agg.  │               │ crosswalked to 696 │
├───────────────────┼────────────────────┼───────────┼──────────────┼───────────────┼────────────────────┤
│ Historical Water  │ EC JRC Global      │ 1984–2021 │ 30-meter     │ THIRD-PARTY / │ Zonal statistics   │
│ Recurrence        │ Surface Water      │ (38-yr)   │ Raster       │ PROXY         │ (mean recurrence)  │
├───────────────────┼────────────────────┼───────────┼──────────────┼───────────────┼────────────────────┤
│ Cyclone Storm     │ NOAA NCEI IBTrACS  │ 1970–2023 │ Track Vector │ THIRD-PARTY / │ 100km buffer decay │
│ Tracks & Intensity│ v04r00             │           │ & Buffers    │ DERIVED       │ wind-speed weighted│
├───────────────────┼────────────────────┼───────────┼──────────────┼───────────────┼────────────────────┤
│ Wind Hazard Zones │ BMTPC Vulnerability│ 2019      │ District /   │ OFFICIAL /    │ Assigned 44–55 m/s │
│                   │ Atlas of India     │           │ Zonal Vector │ PROXY         │ design wind speeds │
├───────────────────┼────────────────────┼───────────┼──────────────┼───────────────┼────────────────────┤
│ Elevation & Slope │ NASA SRTM DEM      │ 2000      │ 30-meter     │ THIRD-PARTY / │ Horn's slope alg.  │
│                   │ Global 1-arcsec    │           │ Raster       │ DERIVED       │ steepness fraction │
├───────────────────┼────────────────────┼───────────┼──────────────┼───────────────┼────────────────────┤
│ Cyclone Shelters  │ NDMA NCRMP Phase-I │ 2015–2020 │ Point / Site │ OFFICIAL      │ Geocoded & joined  │
│ (Designated)      │ Project Cell       │           │ Inventory    │               │ to coastal mandals │
├───────────────────┼────────────────────┼───────────┼──────────────┼───────────────┼────────────────────┤
│ Health Beds       │ MoHFW IPHS 2022    │ 2022      │ Normative /  │ NORMATIVE     │ 1.0 bed per 1,000  │
│ Baseline          │ Guidelines         │           │ Standard     │ BENCHMARK     │ planning population│
├───────────────────┼────────────────────┼───────────┼──────────────┼───────────────┼────────────────────┤
│ Water & Sanitation│ Jal Jeevan Mission │ 2023–2024 │ District /   │ OFFICIAL /    │ Composite coverage │
│ Coverage          │ & SBM-Gramin Port. │           │ State Agg.   │ PROXY         │ percentage index   │
├───────────────────┼────────────────────┼───────────┼──────────────┼───────────────┼────────────────────┤
│ Road Accessibility│ OpenStreetMap &    │ 2024      │ Vector Line  │ THIRD-PARTY / │ Road length / km²  │
│ Corridor Network  │ NRDMS State Portal │           │ Network      │ PROXY         │ density index      │
└───────────────────┴────────────────────┴───────────┴──────────────┴───────────────┴────────────────────┘
```

---

## 2. Key Data Governance Findings

1. **Census 2011 Baseline:** Represents the latest officially published village-level population data for India. All demographic vulnerability analyses clearly disclose this temporal baseline.
2. **Normative vs. Live Operational Capacity:** Health and shelter metrics represent planning benchmarks and static designated assets; live hospital/shelter occupancy is not claimed.
3. **Reproducibility:** All raster and vector extraction pipelines are scripted deterministically under `scripts/` with fixed random seeds and standardized Coordinate Reference Systems (EPSG:7755 Albers Equal Area / EPSG:4326 WGS84).
