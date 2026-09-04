# Phase 2B: Hazard Data Acquisition & Spatial Harmonization Report
**Project:** Sahayata (SIH26191)  
**Pilot State:** Andhra Pradesh, India  
**Date:** September 2026  
**Status:** COMPLETED — Analysis-ready multi-hazard raster and vector datasets acquired, validated, and harmonized.

---

## 1. Executive Summary

Phase 2B implemented the end-to-end automated acquisition, geometric validation, spatial clipping, and projection harmonization of the primary hazard datasets for Andhra Pradesh, adhering strictly to the principle of zero mock or synthetic values.

### Key Milestones Achieved:
1. **Flood Recurrence Layer:** Acquired 30m resolution multi-decadal (1984–2021) observed surface water recurrence from the European Commission Joint Research Centre (EC JRC) Global Surface Water (GSW) v1.4. Mosaiced tiles `70E_20N` and `80E_20N`, clipped precisely to the 26-district boundary of Andhra Pradesh, and exported as `data/processed/hazard/flood/ap_water_recurrence.tif` (32,020 × 26,172 pixels).
2. **Cyclone Track & Exposure Layer:** Acquired official historical tropical cyclone best-track shapefiles (1877–2025) from NOAA / WMO / IMD IBTrACS v04. Filtered to 4,356 track segments within a 150 km coastal impact zone of Andhra Pradesh, identifying 883 direct land-crossing segments, and exported as `data/processed/hazard/cyclone/ap_bay_of_bengal_tracks.geojson`.
3. **Wind Hazard Layer:** Mapped official Bureau of Indian Standards (BIS) and BMTPC Vulnerability Atlas Basic Design Wind Speed ($V_b$) values (IS 875 Part 3: 2015) to all 26 reorganized AP districts. Exported as `data/processed/hazard/wind/ap_district_wind_hazard.geojson` and `.csv`.
4. **Digital Elevation Model (DEM):** Acquired CGIAR-CSI SRTM v4.1 seamless void-filled 90m DEM tiles (`srtm_52_09`, `srtm_52_10`, `srtm_53_09`, `srtm_53_10`). Mosaiced and clipped to the AP boundary, producing `data/processed/hazard/elevation/ap_dem_90m.tif` (9,606 × 7,851 pixels; elevation range: -35m to 1,664m).
5. **Terrain Slope Layer:** Derived terrain slope in degrees using a geospatially correct method on a metric grid in **India Albers Equal Area (EPSG:7755)**, eliminating latitude/longitude degree distortion. Exported as `data/processed/hazard/slope/ap_slope_degrees.tif` (9,658 × 8,063 pixels).
6. **Testing & Validation:** 13 backend unit and integration tests passed (`pytest backend/tests/`), verifying raster dimensions, nodata handling, CRS metadata, and attribute validity.

---

## 2. Dataset Inventory & Provenance

| Hazard Domain | Processed Layer Name | Format | Spatial Resolution | Source Custodian | Source URL | Source Version / Vintage |
|---|---|---|---|---|---|---|
| **Cyclone** | `ap_bay_of_bengal_tracks.geojson` | GeoJSON | Vector Lines | NOAA / WMO / IMD | [IBTrACS Portal](https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/shapefile/) | `IBTrACS v04r01 (1877–2025)` |
| **Wind** | `ap_district_wind_hazard.geojson` | GeoJSON | 26 Districts | BMTPC / BIS | [BMTPC Atlas](https://www.bmtpc.org/) / IS 875 (Part 3) | `IS 875 (Part 3): 2015 Code` |
| **Flood** | `ap_water_recurrence.tif` | GeoTIFF | 30m (~0.0002778°) | EC JRC / Google Earth Engine | [JRC GSW Downloads](https://storage.googleapis.com/global-surface-water/downloads2021/recurrence/) | `GSW v1.4 (1984–2021 Observation)` |
| **Elevation** | `ap_dem_90m.tif` | GeoTIFF | 90m (~0.0008333°) | CGIAR-CSI / NASA | [CGIAR-CSI SRTM](https://srtm.csi.cgiar.org/wp-content/uploads/files/srtm_5x5/TIFF/) | `SRTM v4.1 Void-Filled` |
| **Slope** | `ap_slope_degrees.tif` | GeoTIFF | 90m metric | Derived from SRTM 90m | Calculated via central difference in EPSG:7755 | `2026 Analytical Derivative` |

---

## 3. Detailed Spatial Processing & CRS Strategy

### CRS Strategy Analysis:
Andhra Pradesh extends across approximately 8 degrees of longitude (76.75°E to 84.78°E) and 7 degrees of latitude (12.62°N to 19.17°N).
- Longitude 76.75°E to 78.00°E lies in **UTM Zone 43N (EPSG:32643)** (Western Rayalaseema).
- Longitude 78.00°E to 84.00°E lies in **UTM Zone 44N (EPSG:32644)** (Central AP, coastal deltas).
- Longitude 84.00°E to 84.78°E lies in **UTM Zone 45N (EPSG:32645)** (North-eastern Srikakulam).

Because AP spans **three UTM zones**, forcing a single UTM projection (e.g. UTM 44N) introduces severe linear scale distortion and area inflation at the western and eastern extremities.

### Projection Policy Adopted:
1. **Cartographic & Web Storage CRS — EPSG:4326 (WGS84):**
   - Used for the primary vector GeoJSON layers (`ap_bay_of_bengal_tracks.geojson`, `ap_district_wind_hazard.geojson`) and primary rasters (`ap_water_recurrence.tif`, `ap_dem_90m.tif`) to ensure seamless alignment with Leaflet, GeoServer, and GIS clients.
2. **Metric Distance & Equal-Area Processing CRS — EPSG:7755 (India Albers Equal Area):**
   - Parameters: Standard Parallels 12.0°N and 28.0°N, Central Meridian 78.0°E, False Easting 2,000,000 m, False Northing 2,000,000 m, Datum WGS84.
   - Used for:
     - Buffering the Andhra Pradesh coastline by 150 km to accurately select cyclone tracks without latitudinal elongation.
     - Projecting the DEM to calculate physical surface gradient ($\partial z / \partial x, \partial z / \partial y$) where both elevation ($z$) and horizontal cell spacing ($dx, dy$) are in meters.

---

## 4. Layer Validation Results

### 1. Cyclone Hazard (`ap_bay_of_bengal_tracks.geojson`)
- **Total Tracks Filtered:** 4,356 line segments.
- **Distinct Storm Identifiers (SID):** 445 named and numbered cyclones.
- **Temporal Coverage:** 1877 to 2025 (148 years of observation).
- **AP Land Crossing Segments:** 883 features directly intersected the AP land polygon.
- **Key Attributes Preserved:** `SID`, `SEASON`, `NAME`, `ISO_TIME`, `LAT`, `LON`, `WMO_WIND` (knots), `WMO_PRES` (hPa), `intersects_ap_land`.
- **Validation:** 0 self-intersections or corrupt geometries.

### 2. Wind Hazard (`ap_district_wind_hazard.geojson` & `.csv`)
- **Total Features:** Exactly 26 districts matching `andhra_pradesh_26_districts.geojson`.
- **Engineering Standard:** BIS IS 875 (Part 3): 2015 / BMTPC Vulnerability Atlas of India.
- **Distribution:**
  - **$V_b = 50.0\text{ m/s}$ (180 km/h, Zone I - Very High Damage Risk):** 16 districts (Srikakulam, Vizianagaram, Visakhapatnam, Anakapalli, Kakinada, Dr. B.R. Ambedkar Konaseema, East Godavari, West Godavari, Eluru, Krishna, Bapatla, Prakasam, SPSR Nellore, Tirupati, Alluri Sitharama Raju, Parvathipuram Manyam).
  - **$V_b = 47.0\text{ m/s}$ (169.2 km/h, Zone II - High Damage Risk):** 7 districts (Palnadu, Guntur, Nandyal, YSR Kadapa, Chittoor, NTR, Annamayya).
  - **$V_b = 44.0\text{ m/s}$ (158.4 km/h, Zone III - Moderate Damage Risk):** 3 districts (Kurnool, Ananthapuramu, Sri Sathya Sai).
- **Validation:** 0 missing values, 0 duplicate joins.

### 3. Flood Recurrence (`ap_water_recurrence.tif`)
- **Dimensions:** 32,020 columns × 26,172 rows (1 band).
- **Resolution:** 0.0002778° (~30 meters).
- **CRS:** EPSG:4326.
- **Total Valid Pixels:** 220,436,162 pixels across Andhra Pradesh.
- **Value Range:** 0% to 100% water recurrence.
- **Mean AP Recurrence:** 4.32% (highlighting Godavari, Krishna, and Kolleru Lake permanent water bodies and recurrent floodplains).
- **Nodata:** 255.
- **Compression:** Deflate with internal 256×256 tiling.
- **Scientific Attribution:** EC JRC Global Surface Water v1.4. Reflects observed multi-decadal recurrence (1984–2021). *Not a real-time hydrodynamic forecast.*

### 4. Digital Elevation Model (`ap_dem_90m.tif`)
- **Dimensions:** 9,606 columns × 7,851 rows.
- **Resolution:** 0.0008333° (~90 meters).
- **CRS:** EPSG:4326.
- **Total Valid Pixels:** 19,771,183 pixels.
- **Elevation Range:** -35m (coastal delta creeks/mudflats) to 1,664m (Arma Konda / Eastern Ghats apex in Alluri Sitharama Raju).
- **Nodata:** -32,768.

### 5. Terrain Slope (`ap_slope_degrees.tif`)
- **Dimensions:** 9,658 columns × 8,063 rows.
- **Resolution:** 90.0 meters.
- **CRS:** EPSG:7755 (India Albers Equal Area).
- **Slope Range:** 0.0° to 64.68°.
- **Mean AP Slope:** 3.70° (reflecting AP's predominantly alluvial delta and coastal plain terrain).
- **Steep Terrain (>25°):** 379,073 pixels representing **1.93% of AP land area**, concentrated exclusively in the Eastern Ghats escarpments of Alluri Sitharama Raju and Parvathipuram Manyam.
- **Nodata:** -9999.0.

---

## 5. Habitation / Village Linkage Inspection

### Current Geometry Reality:
- Administrative geometry in the repository is verified at the **District level (26 features)** and **Mandal level (696 features)**.
- The Census 2011 demographic master contains **17,039 villages** with official Census MDDS codes, but **village boundary polygons (revenue village cadastral boundaries) are not available as an open vector dataset**.

### Implications for Risk Scoring (Phase 2C):
1. **Mandal-Level Zonation:** Zonal statistics (mean flood recurrence, maximum flood extent area, cyclone track frequency, basic wind speed, and steep slope area) can be computed directly against the 696 mandal polygons.
2. **Inherited Village Hazard Scores:** Villages can be assigned hazard exposure indices through their validated parent mandal (`current_mandal_code`, `current_district_id`).
3. **Sub-Mandal Village Geometries:** If sub-mandal differentiation is required in future phases, the next legitimate acquisition step is to ingest village centroid coordinates from Survey of India 1:50,000 Open Series Maps (OSM) or formal APSAC habitation vector export.

---

## 6. Reproducibility Instructions

The entire acquisition, mosaicing, masking, and slope derivation pipeline is fully automated and reproducible via a single CLI command:

```bash
# From repository root:
python scripts/process_hazard_layers.py
```

The script automatically:
1. Validates local cached downloads in `data/raw/hazard/` or downloads missing archives.
2. Unpacks shapefiles and mosaicing GeoTIFFs using spatial bounding intersections.
3. Reprojects to EPSG:7755 for metric gradient calculations.
4. Writes tiled, compressed GeoTIFFs and GeoJSONs to `data/processed/hazard/`.

---

## 7. What Can Be Used in Phase 2C vs. What Cannot

### Readily Usable in Phase 2C (Hazard Exposure Scoring):
- `ap_water_recurrence.tif` (Zonal stats for flood exposure per mandal/district)
- `ap_bay_of_bengal_tracks.geojson` (Track density and proximity buffering per mandal)
- `ap_district_wind_hazard.geojson` (Baseline physical wind speed $V_b$ per district)
- `ap_dem_90m.tif` (Low-elevation coastal storm surge exposure < 5m MSL)
- `ap_slope_degrees.tif` (Localized slope > 25° constraint for Eastern Ghats mandals)

### What Cannot Currently Be Used:
- Direct 2D hydrodynamic flood inundation depth grids (e.g. water depth in meters for 100-year return flood).
- Restricted Geological Survey of India (GSI) 1:50,000 NLSM vector shapefiles (inaccessible without official credentials).
- Scraped APSAC WMS raster image tiles for vector geometric intersections (prohibited by data governance).
