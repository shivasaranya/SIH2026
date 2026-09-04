# Phase 1D: Interactive GIS Foundation & Demographic Visualization

This document specifies the technical architecture, data layer routing, visualization engine, and API contracts established in **Phase 1D** for **Sahayata** (SIH26191).

---

## 1. Architectural Overview

Phase 1D implements the foundational geospatial and demographic decision-support interface:

```
[ Frontend: React + TypeScript + Leaflet ]
       │
       ├── REST API Calls (/api/gis/..., /api/demographics/...)
       ▼
[ Backend: FastAPI Data Serving Engine ]
       │
       ├── Reads data/processed/admin/andhra_pradesh_26_districts.geojson
       ├── Reads data/raw/admin/AndhraPradesh_Mandals.geojson (enriched with 26-district parentage)
       └── Reads data/processed/census/ap_village_demographics.csv
       │
[ Optional External Raster Overlay ]
       └── OGC Web Map Service (WMS): APSAC GeoServer (gatishakti / gatishakti1)
```

---

## 2. Backend API Contracts

All endpoints are hosted on `http://127.0.0.1:8000/api` with automatic OpenAPI documentation available at `/docs`.

### A. GIS Endpoints (`app/api/gis.py`)

1. **`GET /api/gis/districts`**
   - **Description:** Returns the standardized 26-district GeoJSON `FeatureCollection` covering the state of Andhra Pradesh.
   - **CRS:** EPSG:4326 (WGS84).
   - **Feature Count:** Exactly 26 features.
   - **Properties:** `district_id`, `district_name`.

2. **`GET /api/gis/mandals`**
   - **Description:** Returns mandal boundary geometries enriched with modern 26-district parentage (`current_district_id`, `current_district_name`).
   - **Query Parameters:** `district_id` (optional, string) — Filters mandals belonging to a specified district (e.g. `?district_id=visakhapatnam`).
   - **Feature Count:** 696 features (all AP mandals).

### B. Demographic Endpoints (`app/api/demographics.py`)

1. **`GET /api/demographics/summary`**
   - **Description:** Returns statewide summary totals and district-by-district demographic breakdowns.
   - **Response Schema:** `StateDemographicSummary`
     - `total_population`: 34,776,389
     - `total_households`: 9,011,144
     - `total_children_0_6`: 3,846,547 (11.06%)
     - `total_sc`: 6,750,210 (19.41%)
     - `total_st`: 2,293,102 (6.59%)
     - `total_villages`: 17,039
     - `total_districts`: 26
     - `data_year`: 2011
     - `data_source`: "Census of India 2011 Primary Census Abstract"
     - `districts`: List of 26 `DistrictDemographicSummary` objects.

2. **`GET /api/demographics/district/{district_id}`**
   - **Description:** Returns detailed demographic indicators for a requested district along with its constituent mandals sorted by population.
   - **Response Schema:** `DistrictDetailResponse`
     - `district`: `DistrictDemographicSummary`
     - `mandals`: List of `MandalDemographicSummary` objects.

---

## 3. Frontend GIS Map & UI Architecture

Implemented under `frontend/src/`:

### Component Hierarchy:
- **`App.tsx`:** Master application shell managing active views, responsive viewport, and dark slate styling.
- **`pages/GISPage.tsx`:** Coordinates state between map controls, choropleth rendering, and slide-in information cards.
- **`components/map/GISMap.tsx`:**
  - CartoDB Dark Matter basemap (OpenStreetMap data) with high-contrast cartography.
  - Centered at Andhra Pradesh geographical midpoint: `[15.9129° N, 79.7400° E]`, initial zoom level `7`.
  - Dynamic Choropleth Layer: 26 district polygons colored according to chosen demographic metric.
  - Interactive event listeners: Hover glow, interactive tooltips, and click-to-zoom bounds fitting.
  - Mandal Boundary Overlay: 696 boundary lines with hover identification.
  - Optional APSAC WMS Overlays: Michaung flood inundation, cyclone shelter locations, and habitations.
- **`components/map/MapControls.tsx`:** Floating widget allowing instant switching of demographic metrics and layer toggles.
- **`components/map/MapLegend.tsx`:** Dynamic threshold legend tailored to the active demographic indicator.
- **`components/dashboard/DistrictInfoPanel.tsx`:** Right-side inspection card showing selected district statistics, vulnerability ratios (SC %, ST %, 0–6 child count), and searchable mandals breakdown.
- **`components/dashboard/StateOverviewCards.tsx`:** Top summary badges displaying statewide aggregates.

---

## 4. Demographic Metrics & Choropleth Classification

| Metric Key | Label | Unit | Classification Thresholds | Color Palette |
|---|---|---|---|---|
| `population` | Total Rural Population | persons | 500k, 1M, 1.5M, 2M, 2.5M | Blues (`#08306b` to `#9ecae1`) |
| `children_pct` | Children 0–6 Ratio | % | 8.5%, 9.5%, 10.5%, 11.5%, 12.5% | Purples (`#3f007d` to `#bcbddc`) |
| `sc_pct` | Scheduled Caste (SC) Ratio | % | 12%, 16%, 20%, 24%, 28% | Oranges (`#7f2704` to `#fdae6b`) |
| `st_pct` | Scheduled Tribe (ST) Ratio | % | 2%, 5%, 10%, 20%, 40% | Emeralds (`#00441b` to `#a1d99b`) |

> [!IMPORTANT]
> **Census 2011 Temporal Attribution:**  
> All demographic indicators are strictly labeled as **Census of India 2011 Primary Census Abstract (PCA)**. They are never represented as current 2026 census counts, maintaining research integrity.

---

## 5. APSAC OGC WMS Integration & Fallback Handling

- **Services Integrated:**
  - `gatishakti_Michaung_Flood_Inundation` (`https://apsac.ap.gov.in/geoserver/gatishakti/wms`)
  - `gatishakti_cycloneshelter` (`https://apsac.ap.gov.in/geoserver/gatishakti/wms`)
  - `gatishakti_habitation` (`https://apsac.ap.gov.in/geoserver/gatishakti/wms`)
- **Resilience Policy:**
  - The WMS layers are integrated as **optional user-toggled overlays**.
  - WMS map tiles are strictly treated as raster visualization overlays and never claimed to be vector analytical geometries.
  - If upstream state network, firewall, or CORS issues occur, the base vector map and demographic analytics continue operating uninterrupted.

---

## 6. Testing & Validation Summary

- **Backend Pytest Suite:** 8 passed in 2.98s (`backend/tests/test_gis.py`, `backend/tests/test_demographics.py`, `backend/tests/test_health.py`).
- **Frontend Production Build:** `tsc -b && vite build` succeeded in 1.04s with 0 TypeScript errors.
- **Data Integrity:** Verified 26 distinct districts, 17,039 villages, 34,776,389 population, and 0 NaN / invalid attributes.
