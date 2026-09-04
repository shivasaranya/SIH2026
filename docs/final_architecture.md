# System Architecture Specification

**Project:** Sahayata (SIH26191)  
**Implementation:** Modular Multi-Tier GIS & Decision-Support System  

---

## 1. End-to-End System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       SAHAYATA SYSTEM ARCHITECTURE                                     │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                        │
│  [1. OPEN DATA INGESTION & REPROJECTION (EPSG:7755 / EPSG:4326)]                                      │
│  ├── Survey of India / APSAC Admin Vectors (26 Districts, 696 Mandals)                                 │
│  ├── Census of India 2011 Primary Census Abstract (PCA Demographics)                                   │
│  ├── JRC Global Surface Water (38-year Historical Recurrence Raster, 30m)                              │
│  ├── NOAA NCEI IBTrACS v04r00 (Bay of Bengal Cyclone Tracks & Wind Decay)                              │
│  ├── NASA SRTM DEM (30m Elevation & Slope Raster) + BMTPC Wind Zones                                  │
│  └── NDMA NCRMP Phase-I Shelters + IPHS Health Norms + JJM / SBM-G Water + OSM Roads                   │
│                                      │                                                                 │
│                                      ▼                                                                 │
│  [2. GEOSPATIAL & ANALYTICAL PIPELINES (scripts/ & data/processed/)]                                   │
│  ├── Phase 2C: Mandal Multi-Hazard Exposure Engine (H_i ∈ [0, 1])                                      │
│  ├── Phase 2D: Demographic Sensitivity Model (D_i ∈ [0, 1], Children, Women, SC/ST, Non-Workers)      │
│  ├── Phase 3A-3C: Carrying Capacity Deficits & Host-Zone Screening Engine (51 Safe Mandals)            │
│  └── Phase 4: Multi-Criteria Relocation Engine (AHP Saaty Matrix w = [0.42, 0.23, 0.23, 0.12], TOPSIS)│
│                                      │                                                                 │
│                                      ▼                                                                 │
│  [3. HIGH-PERFORMANCE FASTAPI BACKEND (backend/app/)]                                                  │
│  ├── /api/gis/                 -> Administrative & Demographic Vector GeoJSON Endpoints                │
│  ├── /api/hazard/              -> Multi-Hazard Exposure Zonal Statistics & Components                  │
│  ├── /api/vulnerability/       -> Demographic Vulnerability Summaries & Indices                        │
│  ├── /api/capacity/            -> Physical Bottlenecks, Carrying Capacity Deficits, & Host Zones       │
│  ├── /api/relocation/          -> AHP Weights, TOPSIS Scores, Ranks, & Factor Contributions            │
│  ├── /api/simulation/          -> Vectorized In-Memory What-If Simulation Engine (<15ms latency)       │
│  └── /api/decision/            -> Indicative Capacity Gaps, 3-Horizon Action Plans, Source vs Host     │
│                                      │                                                                 │
│                                      ▼                                                                 │
│  [4. INTERACTIVE REACT / VITE GIS DASHBOARD (frontend/src/)]                                           │
│  ├── Leaflet / MapLibre Engine -> Dynamic Choropleth Layers (Hazard, Demography, Capacity, TOPSIS)     │
│  ├── Simulation Panel          -> Real-Time Sliders, Preset Triggers, & Delta Score/Rank Visualization │
│  ├── Mandal Detail Panel       -> Multi-Tab Decision Support (Assessment, Gaps, Action Plan, Hosts)   │
│  ├── Host Comparison Modal     -> Side-by-Side Source vs Host Evaluation & Governance Disclaimers      │
│  └── State Action Dashboard    -> Executive Summary Cards, Bottleneck Breakdown, & Top Movers          │
│                                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

- **Backend:** Python 3.13, FastAPI, Pydantic v2, NumPy, Pandas, GeoPandas, Shapely, Pytest.
- **Frontend:** React 19, TypeScript, Vite, TailwindCSS, Leaflet / React-Leaflet, Lucide React.
- **Data Formats:** GeoJSON (RFC 7946), GeoTIFF (Cloud-Optimized), CSV (Normalized relational schema).
- **Coordinate Reference Systems:** EPSG:4326 (WGS84 Web Visualization) & EPSG:7755 (India Albers Equal Area for planar distance and area calculations).
