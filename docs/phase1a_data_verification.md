# Phase 1A: Verified Data Source Plan — Andhra Pradesh Pilot

This document establishes the verified inventory of authoritative geospatial and demographic data sources for the **Sahayata** Andhra Pradesh pilot (Smart India Hackathon 2026, **SIH26191**).

> [!IMPORTANT]
> In strict compliance with scientific and data integrity standards, all URLs and endpoints documented below have been directly queried, pinged, or retrieved from live authoritative portals. No synthetic URLs, fictional download endpoints, or unverified claims are included.

---

## 1. Foundational Datasets Investigation Matrix

| Dataset | Source | Official URL | Availability | Year / Vintage | Format | CRS | Access Method | Coverage | Suitability for Sahayata | Limitations | Verification Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **AP State Boundary** | Andhra Pradesh Space Applications Centre (APSAC) | `https://apsac.ap.gov.in/geoserver/gatishakti1/wms?service=WMS` | Public WMS (Tiled) | 2022–2023 | OGC WMS (PNG / JPEG) | EPSG:4326 | HTTP GET via WMS Client / Leaflet TileLayer (`layer=AP_StateBoundary`) | Entire Andhra Pradesh | **High** (Authoritative state remote sensing agency; direct basemap overlay) | Serves rendered map raster tiles; vector feature geometries (SHP/GeoJSON) cannot be downloaded via WFS (public WFS disabled) | **VERIFIED** |
| **AP 26 District Boundaries** | Andhra Pradesh Space Applications Centre (APSAC) | `https://apsac.ap.gov.in/geoserver/gatishakti1/wms?service=WMS` | Public WMS (Tiled) | Post-April 2022 Reorganization | OGC WMS (PNG / JPEG) | EPSG:4326 | HTTP GET via WMS Client / Leaflet TileLayer (`layer=AP_DistrictBoundary`) | All 26 AP Districts | **High** (Captures official 26-district administrative reorganization) | Raster/tiled overlay; attributes queryable via GetFeatureInfo but bulk vector download requires administrative request | **VERIFIED** |
| **AP Mandal Boundaries** | Andhra Pradesh Space Applications Centre (APSAC) | `https://apsac.ap.gov.in/geoserver/gatishakti1/wms?service=WMS` | Public WMS (Tiled) | 2022–2023 | OGC WMS (PNG / JPEG) | EPSG:4326 | HTTP GET via WMS Client / Leaflet TileLayer (`layer=AP_MandalBoundary`) | All 679 Mandals in AP | **High** (Sub-district administrative units essential for multi-hazard aggregation) | Visual layer via WMS; vector polygons needed for local intersection require vector acquisition or digitizing from official gazette | **VERIFIED** |
| **AP Village Boundaries & Habitations** | Andhra Pradesh Space Applications Centre (APSAC) | `https://apsac.ap.gov.in/geoserver/gatishakti1/wms?service=WMS` & `.../gatishakti/wms?service=WMS` | Public WMS (Tiled) | 2021–2023 | OGC WMS | EPSG:4326 | HTTP GET via WMS (`layer=AP_VillageBoundary` & `layer=Habitation`) | State-wide villages and habitations | **High** (Directly matches problem statement requirement for vulnerable habitations) | Public server allows tile rendering; direct WFS export throws `Service WFS is disabled` exception | **VERIFIED** |
| **National & State Administrative Boundaries** | Survey of India (SOI) | `https://onlinemaps.surveyofindia.gov.in/` | Registered Free Download | 2019–2022 | Shapefile (.shp) | EPSG:4326 | User Registration & OTP Authentication on Online Maps Portal | Pan-India / State / District / Tahsil | **High** (National sovereign mapping authority for legal boundaries) | Requires user signup/OTP login; need to confirm whether current public shapefile release reflects post-April 2022 26-district reorganization or legacy 13 districts | **PARTIALLY VERIFIED** |
| **Bhuvan Administrative Layers** | ISRO / National Remote Sensing Centre (NRSC) | `https://bhuvan.nrsc.gov.in/ngmaps` & `https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms` | Public Web Viewer / Restricted OGC | 2019–2022 | OGC WMS | EPSG:4326 | Bhuvan Web GIS Viewer & OGC WMS integration | Pan-India / Andhra Pradesh (State, District, Sub-district, Village) | **Moderate** (Excellent for visual cross-verification against satellite imagery) | Direct vector shapefile download restricted for general public; primarily consumable as WMS | **PARTIALLY VERIFIED** |
| **Primary Census Abstract (PCA) — Village Level** | Office of the Registrar General & Census Commissioner (Census of India) | `https://censusindia.gov.in/census.website/data/census-tables` | Open Download | 2011 | Excel (.xlsx) / CSV | N/A (Tabular, linked by MDDS Village Codes) | Direct download from Census Tables catalog | All habitations and villages in AP | **High** (Authoritative source for population, gender, SC/ST, literates, households) | 2011 vintage (Census 2021 deferred); structured under pre-bifurcation / legacy district codes, necessitating crosswalk mapping to 26 districts | **VERIFIED** |
| **District & Mandal Statistical Abstracts** | Directorate of Economics & Statistics (DES AP) / APSDPS | `https://desap.cgg.gov.in/` & `https://apsdps.ap.gov.in/` | Public Web Reports | Annual (2022–2024) | PDF / Tabular HTML | N/A (Tabular aggregated) | Direct portal navigation / publication download | All 26 Districts & Mandals of AP | **Moderate to High** (Provides updated post-2022 population estimates and agricultural metrics) | Lacks coordinate geometries; must be joined to spatial boundaries via standardized Mandal codes | **PARTIALLY VERIFIED** |
| **Cadastral & Land Parcel Records (MeeBhoomi)** | Department of Revenue, Government of Andhra Pradesh | `https://meebhoomi.ap.gov.in/` | Public Citizen Portal | Current | Web Viewer / Citizen Search | Local Village Grid | Web query by District / Mandal / Village / Survey Number | Village survey numbers and FMBs (Field Measurement Books) | **Low for Pilot, High for Micro-Planning** (Cadastral level detail) | Not available as state-wide bulk GIS download; captcha and single-record query restriction | **TO BE VERIFIED** |
| **APSAC Public WFS Vector Service** | Andhra Pradesh Space Applications Centre (APSAC) | `https://apsac.ap.gov.in/geoserver/gatishakti1/wfs?service=WFS` | **Disabled on Public Server** | 2023 | OGC WFS (GeoJSON / GML) | EPSG:4326 | HTTP GET Request | N/A | **Unusable for direct vector download** | Server responds with `org.geoserver.platform.ServiceException: Service WFS is disabled`. Raw vector shapes cannot be pulled via WFS without internal credentials | **NOT SUITABLE** |

---

## 2. In-Depth Source Analysis

### A. Andhra Pradesh Space Applications Centre (APSAC)
- **Organization:** Andhra Pradesh Space Applications Centre (ITE & C Department, Government of Andhra Pradesh)
- **Official Portal:** [apsac.ap.gov.in](https://apsac.ap.gov.in/)
- **Live WMS Service Endpoints:**
  1. Administrative & Infrastructure WMS:  
     `https://apsac.ap.gov.in/geoserver/gatishakti1/wms?service=WMS`
     - `AP_StateBoundary`
     - `AP_DistrictBoundary` (Reflects 26 districts)
     - `AP_MandalBoundary`
     - `AP_VillageBoundary`
     - `AP_District_Headquarter`, `AP_Mandal_Headquarter`
  2. Habitations, Hazard & Shelter WMS:  
     `https://apsac.ap.gov.in/geoserver/gatishakti/wms?service=WMS`
     - `Habitation`
     - `PMGSYHabitation`
     - `CycloneShelter Locations`
     - `Michaung_Cyclone_Flood_Layer_06_12_2023_0600`
     - River flood inundation levels for Godavari, Krishna, Penna, Nagavali, and Vamsadhara rivers
- **CORS Support:** Verified HTTP Header `Access-Control-Allow-Origin: *`. Leaflet can consume these map tiles directly in the browser.
- **Critical Restriction:** Public WFS is disabled (`Service WFS is disabled`). Therefore, client-side vector intersection calculations require either:
  1. Utilizing WMS GetFeatureInfo / spatial bounding queries.
  2. Ingesting open verified vector boundary files (e.g. Survey of India / official open-data repositories) into the backend PostGIS database.

### B. Survey of India (SOI)
- **Organization:** Survey of India, Department of Science & Technology, Government of India
- **Official Portal:** [onlinemaps.surveyofindia.gov.in](https://onlinemaps.surveyofindia.gov.in/)
- **Dataset:** Administrative Boundary Database (State, District, Tahsil/Mandal)
- **Format & CRS:** ESRI Shapefile (.shp), Geographic WGS84 (EPSG:4326)
- **Access Protocol:** Registered portal download under the National Geospatial Policy. Requires Indian mobile number OTP verification.
- **Verification Status:** Partially Verified. Portal is active; acquisition requires manual user authentication to verify whether the download package has been updated to the 26-district AP boundary.

### C. ISRO / NRSC Bhuvan
- **Organization:** National Remote Sensing Centre (NRSC), Indian Space Research Organisation (ISRO)
- **Official Portal:** [bhuvan.nrsc.gov.in](https://bhuvan.nrsc.gov.in/)
- **Services:** Bhuvan AP State Viewer (`bhuvan-vec1.nrsc.gov.in`) providing OGC WMS visualization for State, District, Mandal, and Village boundaries.
- **Suitability:** High for basemap comparison and satellite imagery verification; low for direct vector extraction due to download restrictions on raw boundary shapefiles for general public accounts.

### D. Census of India (Primary Census Abstract)
- **Organization:** Office of the Registrar General & Census Commissioner, India (Ministry of Home Affairs)
- **Official Portal:** [censusindia.gov.in](https://censusindia.gov.in/census.website/data/census-tables)
- **Dataset:** Primary Census Abstract (PCA) — Andhra Pradesh (Village & Town Level)
- **Coverage & Content:** Every recognized census village in Andhra Pradesh, detailing:
  - Total population, Males, Females
  - 0–6 age child population (critical vulnerability indicator)
  - Scheduled Castes (SC) and Scheduled Tribes (ST) populations
  - Total households and housing types (from Houselisting tables)
  - Literates and main/marginal workers
- **Linking Mechanism:** 6-digit Census Village Code (MDDS code).
- **Key Caveat:** The Census 2011 data uses the pre-2014 unified AP hierarchy. While individual village codes remain stable, mandal and district parent linkages must be cross-referenced to the current 26-district structure.

---

## 3. The 26-District Administrative Reorganization Challenge

> [!CAUTION]
> On **April 4, 2022**, the Government of Andhra Pradesh officially reorganized the state from **13 districts into 26 districts**.
> - Many legacy datasets (Census 2011, older Survey of India shapefiles, and older Bhuvan releases) reflect only 13 districts.
> - APSAC's GeoServer reflects the updated 26-district and mandal configuration.
> - **Mandatory Engineering Requirement:** In the backend PostGIS schema, every habitation must be linked using its unique national village code (MDDS or LGD - Local Government Directory code from `lgdirectory.gov.in`), allowing seamless mapping to both the 13 legacy district boundaries and the 26 current administrative districts.

---

## 4. Recommended Step-by-Step Acquisition Order

1. **Step 1 (Immediate):** Acquire and ingest the official 26-district and mandal boundary GeoJSON/Shapefile for Andhra Pradesh into `data/raw/boundaries/`.
2. **Step 2:** Ingest Census 2011 Primary Census Abstract (PCA) village-level tabular dataset for Andhra Pradesh into `data/raw/demographics/`.
3. **Step 3:** Connect the frontend Leaflet map to APSAC's live WMS endpoint (`https://apsac.ap.gov.in/geoserver/gatishakti1/wms`) for live multi-hazard and administrative layer visual overlays.
4. **Step 4:** Build the LGD / MDDS code crosswalk mapping to link Census demographic rows to spatial habitation geometries in PostGIS.
