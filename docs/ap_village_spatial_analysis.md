# Andhra Pradesh Village-Level Spatial Hazard Analysis & Four-Direction Sector Engine

**Project:** RakshaSethu (SIH26191)  
**Status:** Implemented and Verified  
**Date:** September 2026  

---

> [!IMPORTANT]
> **Core Methodological Principle:**  
> *"Village-level analysis is calculated from actual village geometry and available spatial hazard layers. Mandal-level hazard scores are not copied to villages."*

---

## 1. Overview & Data Sources

This component establishes high-resolution cadastral spatial analysis for Andhra Pradesh habitations by combining verified Survey of India (SOI) MultiPolygon geometries with authoritative 30m and 90m continuous spatial hazard rasters and historical storm tracks.

| Layer | Source / Provider | Native Format | Resolution | Application in Village Analysis |
|---|---|---|---|---|
| **Village Cadastral Boundaries** | **Survey of India (SOI)** via National Water Informatics Centre (NWIC) | MultiPolygon (GeoJSON/GPKG) | Cadastral revenue boundaries | Exact village extent, centroid calculation, and four cardinal sector clipping. |
| **Demographic Baseline** | **Census of India 2011** (Primary Census Abstract) | Tabular CSV | 17,039 villages | Population total, households, children 0–6, SC/ST, workers. |
| **Flood Recurrence** | **EC Joint Research Centre (JRC)** Global Surface Water | 30m GeoTIFF | 30m grid | Historical water recurrence ($0\%–100\%$) sampled within sector polygons. |
| **Terrain Elevation & Slope** | **CGIAR-CSI SRTM 90m** Digital Elevation Model | 90m GeoTIFF in EPSG:7755 | 90m grid | Metric terrain gradient in degrees ($0^\circ–64.7^\circ$) and steep land ($\ge 15^\circ$). |
| **Tropical Cyclones** | **NOAA / WMO IBTrACS v04** | LineString GeoJSON | Track segments | Track density within 25 km buffer and exact distance to nearest track. |
| **Basic Wind Speeds** | **BMTPC / BIS IS 875 (Part 3: 2015)** | District-level Polygon | Regional zones | $V_b = 44–50\text{ m/s}$ design wind speeds and damage risk categorization. |

---

## 2. Village Geometry & Crosswalk Integrity

1. **Exact Census Code Matching:**
   - The Survey of India `vlcode` corresponds 1:1 with the official Census 2011 6-digit `village_code`.
   - All **17,039 Census 2011 villages** in Andhra Pradesh were matched directly ($100.00\%$ match rate, $0$ unmatched records).
2. **Topology Verification:**
   - Multi-part village fragments under the same code were dissolved into unified `MultiPolygon` geometries.
   - Minor self-intersecting boundary vertices were repaired using `shapely.make_valid()`.
3. **Storage & Performance Optimization:**
   - Native metric spatial layers are stored in `data/processed/gis/villages/ap_villages.parquet` and `ap_villages.gpkg` in **EPSG:7755 (India Albers Equal Area)**.
   - A lightweight index `ap_villages_index.csv` allows instantaneous sub-millisecond metadata search without loading 137 MB of geometry into memory.

---

## 3. Four-Cardinal Sectoring Methodology (N / E / S / W)

To provide actionable directional intelligence for early evacuation and defense without dividing parent mandals:

1. **Centroid Calculation:**
   For the selected village polygon $P$, the geometric centroid $C = (c_x, c_y)$ is derived in EPSG:7755.
2. **Cardinal Wedge Partitioning:**
   Four non-overlapping $90^\circ$ wedges meeting at $C$ partition the plane:
   - **North Sector ($S_N$):** $(y - c_y) \ge |x - c_x|$
   - **South Sector ($S_S$):** $(c_y - y) \ge |x - c_x|$
   - **East Sector ($S_E$):** $(x - c_x) \ge |y - c_y|$
   - **West Sector ($S_W$):** $(c_x - x) \ge |y - c_y|$
3. **Clipping to Actual Geometry:**
   Each sector is clipped directly to the village polygon:
   $$S_i = P \cap \text{Wedge}_i \quad \text{for } i \in \{N, E, S, W\}$$
4. **Mathematical Area Preservation:**
   The union of the four sectors exactly reconstructs the village:
   $$\text{Area}(S_N) + \text{Area}(S_E) + \text{Area}(S_S) + \text{Area}(S_W) = \text{Area}(P)$$
   Verified in automated test suite ($|\Delta A| < 0.05\text{ km}^2$).

```
                     ▲ North [y - cy >= |x - cx|]
                     │
            West     │     East
     [cx - x >= |y - cy|]  [x - cx >= |y - cy|]
             ◄───────┼───────►
                     │
                     ▼ South [cy - y >= |x - cx|]
```

---

## 4. Sector-Level Hazard Calculations & Thresholds

Each sector polygon is intersected with the underlying continuous rasters and vectors:

### A. Flood Recurrence (30m JRC)
- Polygons are reprojected to EPSG:4326 to sample `ap_water_recurrence.tif`.
- **Metrics Extracted:** Valid pixel count, mean recurrence ($\mu_{\text{flood}}$), maximum recurrence, and percentage of sector pixels with recurrence $\ge 10\%$ ($P_{\ge 10\%}$).
- **Normalized Flood Score:**
  $$S_{\text{flood}} = \min\left(1.0, \frac{\mu_{\text{flood}}}{100} \cdot 0.5 + \frac{P_{\ge 10\%}}{100} \cdot 0.5\right)$$
- *Notice:* Percentage values represent the percentage of valid raster pixels/area intersecting the hazard, NOT a probability of occurrence.

### B. Terrain Slope (90m SRTM) — Sector Steep Terrain (≥15°)
- Sampled directly in EPSG:7755 against `ap_slope_degrees.tif`.
- **Metrics Extracted:** Mean slope ($\mu_{\text{slope}}$), maximum slope, and percentage of pixels exceeding the $15^\circ$ steep terrain threshold ($P_{\ge 15^\circ}$).
- **Methodological Distinction:** This is an intentional **village micro-topography descriptive indicator ($\ge 15^\circ$)** to capture local gradient constraints for hamlets and access tracks; it is strictly **distinct from the mandal civil-engineering exclusion constraint ($> 25^\circ$)** used in macro-land suitability.
- **Normalized Slope Score:**
  $$S_{\text{slope}} = \min\left(1.0, \frac{\mu_{\text{slope}}}{30.0} \cdot 0.5 + \frac{P_{\ge 15^\circ}}{100} \cdot 0.5\right)$$

### C. Cyclone Track Proximity (NOAA IBTrACS)
- Intersected with a 25 km buffer around the sector geometry.
- **Metrics Extracted:** Number of historical tracks within 25 km, exact minimum Euclidean distance in km to the nearest track ($d_{\text{cyc}}$).
- **Normalized Cyclone Score:**
  $$S_{\text{cyc}} = \min\left(1.0, \max\left(0.0, 1.0 - \frac{d_{\text{cyc}}}{50.0}\right)\right)$$

### D. Basic Design Wind Speed (BMTPC IS 875)
- Evaluated from district zoning: $V_b \in [44, 50]\text{ m/s}$.
- $$S_{\text{wind}} = \frac{V_b - 44.0}{6.0}$$
- **Resolution & Uniformity Disclosure:** Wind exposure is uniform across this village at the available source resolution. The BMTPC/IS 875 wind dataset is available at district-level resolution, so artificial N/E/S/W variation is not created.

---

## 5. Sector Priority Classification & WHY Rationale

Each sector is assigned a deterministic priority class based on its hazard score:

| Composite Sector Score ($S_{\text{sector}}$) | Priority Class | Operational Meaning |
|---|---|---|
| $\ge 0.45$ | **VERY HIGH** | Acute hazard concentration; immediate directional evacuation focus. |
| $0.28 \le S_{\text{sector}} < 0.45$ | **HIGH** | Significant hazard exposure; priority reinforcement required. |
| $0.12 \le S_{\text{sector}} < 0.28$ | **MODERATE** | Secondary buffer zone; standard operational precautions. |
| $< 0.12$ | **LOW** | Minimal direct physical hazard exposure; potential in-situ safe quadrant. |
| *No valid pixels / Missing data* | **INSUFFICIENT DATA** | Data unavailable from spatial sensors. |

### Deterministic Explanation Style
Every sector generates an auditable, plain-English explanation of its dominant driver:
> *"NORTH sector classified VERY HIGH priority: Flood recurrence (42.5% mean, 68.2% area affected). Surface area: 1.42 km² (34.5% of village)."*

---

## 6. Village What-If Scenario Sensitivity (0–10)

The village what-if slider applies a mathematical sensitivity perturbation:
$$\text{Multiplier} = 1.0 + \frac{\text{Increase}}{100.0} \quad \text{where } \text{Increase} \in [0.0, 10.0]$$

- $0 = \text{Baseline conditions}$ ($0\%$ perturbation)
- $5 = +5.0\%$ hazard stress test
- $10 = +10.0\%$ extreme compound stress test

### Regulatory Disclosure:
> **SCENARIO SIMULATION — NOT A FORECAST**  
> This mathematical perturbation explores infrastructural resilience and evacuation load under aggravated stress. It does not claim to predict future rainfall or cyclone tracks.

---

## 7. Safer Relocation Center Recommendations

Candidate host locations are ranked using the approved **RakshaSethu Relocation Logic**:
1. **Hard Safety Filter:** Must have verified $< 35\%$ hazard exposure and $\ge 50\%$ safe habitable land headroom.
2. **Capacity Headroom:** Must NOT be capacity-stressed; verified shelter capacity $> 0$ and safe land headroom $\ge 200\text{ m}^2/\text{person}$.
3. **Accessibility:** Direct evacuation corridor without critical road washouts.
4. **Soft Distance Preference:** Distance from the village centroid in EPSG:7755 is evaluated smoothly:
   $$S_{\text{dist}} = \frac{1}{1 + \frac{d_{\text{km}}}{60.0}}$$
   No arbitrary rigid cutoffs (e.g. 5 km or same-mandal-only) are enforced; a safer host further away strictly outranks an unsafe close host.
5. **Human-Readable Rationale:** Each recommended center includes an explicit explanation of why it was selected and why closer non-viable locations were rejected.

---

## 8. Limitations & Methodological Boundaries

1. **Census Temporal Baseline:** Demographics reflect Census of India 2011 (the latest published national census).
2. **Raster Sampling Resolution:**
   - Flood is resolved to 30m grid cells.
   - Topography and slope are resolved to 90m grid cells.
   - Micro-topography under 30m (e.g. roadside culverts, individual plinths) is below sensor resolution.
3. **Decision Support Mandate:**
   - RakshaSethu provides auditable, transparent decision-support analytics for District Disaster Management Authorities (DDMAs). It never issues automated relocation orders.

---

*End of Methodology Document.*
