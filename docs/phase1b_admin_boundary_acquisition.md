# Phase 1B: Administrative Boundary Vector Data Acquisition & Validation

This document records the systematic research, acquisition attempt, validation, and processing of the foundational administrative boundary vector datasets for **Sahayata** (SIH26191) covering the Andhra Pradesh pilot.

---

## 1. Candidate Vector Datasets Research Matrix

| Parameter | Candidate 1: APSAC GeoServer | Candidate 2: Survey of India (SOI) | Candidate 3: ISRO / NRSC Bhuvan | Candidate 4: Open Government Data (data.gov.in) | Candidate 5: AP Open Data / Gazette Compilation |
|---|---|---|---|---|---|
| **Source Organization** | Andhra Pradesh Space Applications Centre (APSAC), ITE&C Dept, Govt. of AP | Survey of India, Department of Science & Technology, Govt. of India | National Remote Sensing Centre (NRSC), ISRO | National Informatics Centre (NIC), Ministry of Electronics & IT | Compiled from Official AP Gazette Notifications & ECI Demarcations |
| **Exact URL** | `https://apsac.ap.gov.in/geoserver/gatishakti1/wfs` (WFS) & `.../wms` (WMS) | `https://onlinemaps.surveyofindia.gov.in/` | `https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms` | `https://data.gov.in/` | `https://github.com/satishvmadala/andhrapradesh_opendata_locations` |
| **Dataset Name** | AP Administrative Boundaries (`AP_DistrictBoundary`, `AP_MandalBoundary`) | Administrative Boundary Database & Village Boundary Database | Bhuvan Administrative Vector Layers | National Open Data Catalogues | `AndhraPradesh_Districts.geojson` & `MANDAL.geojson` |
| **Spatial Units** | State, 26 Districts, Mandals, Villages, Habitations | State, District, Tahsil, Village | State, District, Sub-district, Village | Varies by department | State, 26 Districts, Mandals |
| **Administrative Vintage** | 2022–2023 (Post-Reorganization) | 2019–2022 (Varies by product sheet) | 2019–2022 | Legacy / Inconsistent | April 4, 2022 Official Reorganization |
| **13 vs 26 District Compatibility** | **26 Districts** | Likely legacy 13 districts in public download; requires verification behind login | Mixed / Mostly 13 districts | Mostly legacy 13 districts | **Fully 26 Districts** (All 26 new districts confirmed) |
| **File Format** | OGC WMS (PNG) / OGC WFS (GeoJSON/GML) | ESRI Shapefile (.shp) | OGC WMS (Raster Map Tiles) | CSV / SHP (where available) | GeoJSON (FeatureCollection) |
| **CRS** | EPSG:4326 (WGS84) | EPSG:4326 (WGS84) | EPSG:4326 (WGS84) | EPSG:4326 | EPSG:4326 (WGS84) |
| **Download / Access Method** | WMS HTTP GET (Active); WFS GET (Disabled) | Registered Portal Download (`addtocart.aspx`) | Portal Viewer / OGC Service integration | Web Search / API (API key required) | Direct HTTPS Download from versioned repository |
| **Authentication / OTP Required?** | No for WMS; WFS returns `Service WFS is disabled` | **Yes: Mobile number OTP & password login mandatory** | Yes for vector shapefile downloads | API Key required for data API | **No (Openly accessible public repository)** |
| **License / Restrictions** | State Govt Official Use / Planning | National Geospatial Policy guidelines | Academic / Planning / Non-commercial | Government Open Data License (GODL-India) | Open Data Commons Open Database License (ODbL) / MIT |
| **Village / Mandal Geometries Included?** | Yes via WMS; disabled for vector export | Separate products (Tahsil vs Village DB) | Yes via WMS; vector download restricted | Not bundled together | Mandals included; Village geometries separate |
| **Stable Identifiers (LGD/MDDS)** | State internal OBJECTID & district names | State Census / LGD codes (behind login) | Census 2011 MDDS codes | Varies | `district_id`, `district_name`, `DNAME`, `DMNAME` |
| **Suitability for Sahayata** | Visual basemap: **High**; Vector analysis: **Unusable due to WFS disabled** | Sovereign legal boundary: **High**; Automated acquisition: **Blocked by OTP requirement** | Visual comparison: **High**; Vector analysis: **Blocked by download restriction** | General data: **Moderate**; Automated 26-district vector download: **Not Available** | Immediate spatial processing & 26-district pilot modeling: **Highest Available Alternative** |
| **Limitations** | Public WFS is disabled (`Service WFS is disabled`) | Cannot be automated or downloaded without manual OTP user session | Vector shapefile download restricted to internal departmental requests | No direct 26-district GeoJSON available on open endpoints | Derived from official gazettes; mandal file retains legacy district linkage |

---

## 2. Decision on Official Sources Requiring Authentication

In accordance with project engineering rules:
> **Critical Rule:** If the official source requires OTP/login and cannot be downloaded automatically, STOP the acquisition attempt rather than bypassing authentication.

1. **Survey of India Online Maps Portal:** Requires user registration with Indian mobile number OTP and password-authenticated session (`https://onlinemaps.surveyofindia.gov.in/Login.aspx`). Automated download scripts cannot bypass this OTP gateway. The attempt to scrape or bypass this login was deliberately stopped.
2. **APSAC Public WFS:** Public WFS request (`https://apsac.ap.gov.in/geoserver/gatishakti1/wfs?service=WFS&request=GetCapabilities`) returns `org.geoserver.platform.ServiceException: Service WFS is disabled`. WMS rendering remains active and verified for visualization, but raw vector extraction via public WFS is administratively blocked.
3. **Primary Dataset Selected:** The verified open vector compilation sourced directly from the official Andhra Pradesh Gazette notifications for the April 4, 2022 reorganization (`satishvmadala/andhrapradesh_opendata_locations`) was acquired as the foundational vector layer for Phase 1B.

---

## 3. Directory Layout & Preserved Files

### Raw Vector Directory (`data/raw/admin/`)
- `data/raw/admin/AndhraPradesh_Districts.geojson` (28.14 MB) — Original downloaded GeoJSON containing all 26 district boundary geometries. Completely preserved without modification.
- `data/raw/admin/AndhraPradesh_Mandals.geojson` (6.71 MB) — Original downloaded GeoJSON containing 696 mandal geometries across Andhra Pradesh.

### Processed Vector Directory (`data/processed/admin/`)
- `data/processed/admin/andhra_pradesh_26_districts.geojson` (5.16 MB) — Standardized 26-district GeoJSON where multi-part polygon fragments (islands, deltas, enclaves) are consolidated into clean `MultiPolygon` features per district, eliminating duplicate feature rows while preserving full geometric fidelity.

---

## 4. Comprehensive Validation Results

A dedicated validation suite (`scripts/validate_admin_boundaries.py`) was executed against both raw and processed datasets using the virtual environment Python interpreter.

### Validation Matrix

| Validation Metric | Raw Districts (`data/raw/admin/AndhraPradesh_Districts.geojson`) | Processed Districts (`data/processed/admin/andhra_pradesh_26_districts.geojson`) | Raw Mandals (`data/raw/admin/AndhraPradesh_Mandals.geojson`) |
|---|---|---|---|
| **File Opens Successfully** | Yes (Valid JSON) | Yes (Valid JSON) | Yes (Valid JSON) |
| **Root GeoJSON Type** | `FeatureCollection` | `FeatureCollection` | `FeatureCollection` |
| **Geometry Types** | `['Polygon']` | `['MultiPolygon', 'Polygon']` | `['Polygon']` |
| **Feature Count** | 39 features (multi-part splits) | **Exactly 26 features** (1 per district) | 696 features |
| **CRS** | EPSG:4326 (WGS84 coordinates) | OGC:1.3:CRS84 (EPSG:4326 equivalent) | EPSG:4326 (WGS84 coordinates) |
| **Bounding Box** | Min Lon: 76.7600° E, Min Lat: 12.6240° N<br>Max Lon: 84.7651° E, Max Lat: 19.1669° N | Min Lon: 76.7600° E, Min Lat: 12.6240° N<br>Max Lon: 84.7651° E, Max Lat: 19.1669° N | Min Lon: 76.7600° E, Min Lat: 12.6240° N<br>Max Lon: 84.7651° E, Max Lat: 19.1669° N |
| **Invalid Geometries** | **0** | **0** | **0** |
| **Missing IDs** | **0** | **0** | **0** |
| **Duplicate IDs** | 13 (due to multi-part feature splitting) | **0 (Zero duplicate IDs)** | 26 (due to multi-part mandals) |
| **District Count** | **26 Districts** | **26 Districts** | 13 legacy parent districts |
| **Mandal Count** | N/A | N/A | 669 unique mandals (696 polygons) |
| **Village Count** | N/A | N/A | N/A (Village layer separate) |
| **Covers AP Completely?** | **True** (Entire spatial footprint of AP) | **True** (Entire spatial footprint of AP) | **True** (Entire spatial footprint of AP) |

---

## 5. Verified List of All 26 Andhra Pradesh Districts

The processed dataset confirms presence of all 26 districts established in the April 2022 reorganization:
1. Alluri Sitharama Raju
2. Anakapalli
3. Ananthapuramu
4. Annamayya
5. Bapatla
6. Chittoor
7. Dr. B.R. Ambedkar Konaseema
8. East Godavari
9. Eluru
10. Guntur
11. Kakinada
12. Krishna
13. Kurnool
14. Nandyal
15. NTR
16. Palnadu
17. Parvathipuram Manyam
18. Prakasam
19. Sri Potti Sriramulu Nellore
20. Sri Sathya Sai
21. Srikakulam
22. Tirupati
23. Visakhapatnam
24. Vizianagaram
25. West Godavari
26. YSR Kadapa

---

## 6. Identified Problems & Engineering Solutions

1. **Problem:** Raw district GeoJSON represented non-contiguous districts (such as coastal delta islands in Krishna, Eluru, and Konaseema) as multiple separate `Polygon` features with identical `district_id`, yielding 39 features instead of 26.  
   **Solution:** Executed `scripts/process_admin_boundaries.py` to dissolve multi-part features into unified `MultiPolygon` geometries per district in `data/processed/admin/andhra_pradesh_26_districts.geojson`, achieving exactly 26 features with 0 duplicate IDs.
2. **Problem:** The raw mandal dataset (`AndhraPradesh_Mandals.geojson`) contains 696 polygon features, but its `DNAME` attribute reflects the legacy 13 district names because mandals were demarcated prior to 2022.  
   **Solution:** A spatial intersection in PostGIS or an official gazette crosswalk table will map each mandal polygon into its respective new 26-district parent entity in Phase 1C.
