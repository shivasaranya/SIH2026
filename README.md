# Sahayata (सहायता)

**Smart India Hackathon 2026 — Problem Statement SIH26191**  
*Intelligent Identification of Hazard-Based Red Zones, Carrying Capacity Assessment, and Immediate Relocation Needs for Vulnerable Habitations*

- **Domain:** Disaster Management
- **Initial Pilot Jurisdiction:** Andhra Pradesh, India
- **Core Principle:** Decision Support Platform (Human-in-the-Loop; strictly decision assistance, never automated relocation directives)

---

## 🧭 Project Overview

Sahayata is an explainable, GIS-based, multi-hazard decision-support platform engineered for disaster management authorities. It integrates hazard mapping, vulnerability layers, physical carrying capacity constraints, and multi-criteria decision analysis (AHP & TOPSIS) to assist planners in prioritizing habitations requiring immediate intervention and relocation planning.

### Analytical Pipeline
```
Hazard → Exposure → Vulnerability → Carrying Capacity → Affected Population → Relocation Priority → Explainability → What-if Simulation
```

---

## 🛠️ Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide Icons, Leaflet (CartoDB Dark Matter / OSM Basemaps)
- **GIS:** Leaflet with dynamic GeoJSON choropleth, mandal boundary vector layers, and optional APSAC OGC WMS overlays
- **Backend:** Python 3.11+, FastAPI, Uvicorn, Pydantic Settings
- **Data Processing:** Pandas, Shapely, OpenPyXL, NumPy
- **Spatial Storage (Planned):** PostgreSQL 15+ with PostGIS extension
- **Decision Engine (Planned):** AHP (Analytic Hierarchy Process), TOPSIS (Technique for Order Preference by Similarity to Ideal Solution)

---

## 📁 Repository Structure

```
Sahayata/
├── frontend/             # React + TypeScript + Vite + Leaflet GIS interactive application
│   ├── src/
│   │   ├── components/
│   │   │   ├── map/      # GISMap, MapControls, MapLegend
│   │   │   ├── dashboard/# DistrictInfoPanel, StateOverviewCards
│   │   │   └── layout/   # Header, Sidebar
│   │   ├── pages/        # GISPage, DashboardPage
│   │   ├── services/     # api.ts (REST client)
│   │   ├── types/        # gis.ts, demographics.ts
│   │   └── utils/        # mapUtils.ts (Choropleth color scales & thresholds)
├── backend/              # Python FastAPI backend service & data-serving layer
│   ├── app/
│   │   ├── api/          # Route controllers (health, gis, demographics)
│   │   ├── core/         # Settings & data path configuration
│   │   ├── demographics/ # Pydantic schemas for state & district summaries
│   │   ├── services/     # gis_service.py, demographics_service.py
│   │   └── ...
│   └── tests/            # Pytest test suite (test_gis.py, test_demographics.py, test_health.py)
├── data/
│   ├── raw/
│   │   ├── admin/        # Preserved original AP districts & mandals GeoJSON
│   │   └── census/       # 13 preserved original Census 2011 PCA workbooks
│   └── processed/
│   │   ├── admin/        # andhra_pradesh_26_districts.geojson (26 clean MultiPolygons)
│   │   └── census/       # ap_administrative_crosswalk.csv & ap_village_demographics.csv
├── scripts/              # Validation, processing, and crosswalk generation CLI scripts
├── docs/                 # Detailed architectural and phase technical reports
│   ├── phase1a_data_verification.md
│   ├── phase1b_admin_boundary_acquisition.md
│   ├── phase1c_census_crosswalk.md
│   ├── phase1c5_crosswalk_quality.md
│   └── phase1d_gis_foundation.md
├── DATA_SOURCES.md       # Living catalog of data layers and verification statuses
├── PROJECT_STATE.md      # Living roadmap and current implementation phase
└── README.md
```

---

## 🚀 Running the Application Locally

### 1. Start the FastAPI Backend
```bash
cd backend
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API docs available at: `http://127.0.0.1:8000/docs`

### 2. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Interactive GIS Dashboard available at: `http://127.0.0.1:5173/`

### 3. Run Automated Tests
```bash
# Backend pytest suite:
pytest backend/tests/

# Frontend type-check & build:
cd frontend
npm run build
```

---

## 📊 Completed Phase Milestones
- **Phase 0:** Project Foundation & Modular Architecture (Scaffolded & Tested)
- **Phase 1A:** Authoritative Data Sources Plan & APSAC WMS Verification
- **Phase 1B:** AP 26-District Administrative Boundary Vector Acquisition & Validation
- **Phase 1C:** Census 2011 Village Demographic Data Ingestion (17,039 villages)
- **Phase 1C.5:** 100% Verified Administrative Crosswalk with Spatial Disambiguation
- **Phase 1D:** Interactive Leaflet GIS Foundation & FastAPI Demographic Serving Layer
