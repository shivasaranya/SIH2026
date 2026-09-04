# System Architecture — Sahayata

## Architectural Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend Application Shell                      │
│                (React, TypeScript, Vite, Tailwind CSS)                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST / JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          FastAPI Backend API                           │
│                (Routing, Auth-Ready Middleware, Pydantic)              │
└───────────┬───────────────────────┬──────────────────────┬─────────────┘
            │                       │                      │
            ▼                       ▼                      ▼
┌───────────────────────┐ ┌───────────────────┐ ┌────────────────────────┐
│  Data Ingestion / GIS │ │   PostGIS Spatial │ │     Risk & Decision    │
│       Pipeline        │ │      Database     │ │         Engines        │
│  (GeoPandas, Shapely, │ │ (Habitations,     │ │ (Hazard Overlay,       │
│   Rasterio, GDAL)     │ │  Boundaries,      │ │  Carrying Capacity,    │
│                       │ │  Hazards, Infra)  │ │  AHP / TOPSIS Ranking) │
└───────────────────────┘ └───────────────────┘ └──────────┬─────────────┘
                                                           │
                                                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Interactive GIS & Decision Dashboard               │
│                  (Leaflet Layers, Recharts, Explainability)            │
└────────────────────────────────────────────────────────────────────────┘
```

## Layer Descriptions

### 1. Frontend Presentation Layer
- **Tech Stack:** React 18+, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Responsibilities:**
  - Interactive map visualization (Leaflet) with multi-hazard layer toggling.
  - Habitation vulnerability inspection and decision-maker controls.
  - Visualizing explainable ranking criteria and carrying-capacity headroom via Recharts.
  - Scenario simulation interface ("What-if" analysis for hazard intensity shifts).

### 2. Backend API Orchestration Layer
- **Tech Stack:** Python 3.11+, FastAPI, Uvicorn, Pydantic Settings.
- **Responsibilities:**
  - Exposing structured REST endpoints for habitations, administrative hierarchies, hazard maps, and analytical metrics.
  - Decoupling computational tasks from client-side state.
  - Validating input parameters for simulation requests.

### 3. Data Ingestion & GIS Processing
- **Tech Stack:** GeoPandas, Shapely, PyProj, Rasterio, NumPy, Pandas.
- **Responsibilities:**
  - Ingesting vector shapes (GeoJSON, Shapefile, GeoPackage) and raster hazard data (GeoTIFF).
  - Standardizing spatial projections to appropriate UTM projections for accurate metric calculations.
  - Performing spatial intersections, buffer zones, and zonal statistics.

### 4. Persistence Layer (Spatial Database)
- **Tech Stack:** PostgreSQL with PostGIS extension.
- **Responsibilities:**
  - Storing state, district, mandal, and habitation spatial geometries.
  - Efficient spatial indexing (`GIST`) for bounding box and proximity queries.
  - Storing temporal hazard layers, shelter locations, road networks, and calculated risk histories.

### 5. Risk, Capacity & Decision Engines
- **Modules:**
  - **Hazard & Exposure Engine:** Calculates intersection of habitations with flood/cyclone extents.
  - **Vulnerability Engine:** Integrates demographic, housing, and social vulnerability indicators.
  - **Carrying Capacity Engine:** Computes host-zone physical thresholds (land area, shelter space, water, sanitation, road capacity).
  - **Relocation Ranking Engine:** Applies multi-criteria decision models (AHP for weighting, TOPSIS for ranking) to generate prioritized habitation recommendations with transparent score breakdowns.

---

## Modularity & Multi-State Readiness Principle

While Andhra Pradesh serves as the pilot testbed (utilizing its district/mandal administrative divisions), the core engine is strictly decoupled from state-specific assumptions:
- Administrative hierarchies are normalized as generic level-1 (State), level-2 (District), and level-3 (Mandal/Tehsil/Taluk) entities.
- Spatial calculations operate on standardized GeoJSON / PostGIS geometry primitives.
- Adapting to a new state requires only importing its administrative boundary geometries and demographic habitation register.
