# RakshaSethu: West Bengal (WB) Master State Data Provenance & Methodology

## 1. Executive Summary & Administrative Structure
- **State**: West Bengal (State Code: `WB`)
- **SDMA Authority**: West Bengal Disaster Management and Civil Defence Department (WBDMD)
- **Administrative Breakdown**:
  - **23 Administrative Districts** (Survey of India / DataMeet standard)
  - **346 Community Development (C.D.) Blocks / Sub-districts** (including Kolkata urban municipal core)
- **Baseline Population**: **91,276,111** (Census 2011 Primary Census Abstract aggregate)
- **Topography & Hazard Characterization**:
  - **Sundarbans Coastal & Deltaic Zone** (South 24 Parganas, Purba Medinipur, North 24 Parganas): Vulnerable to severe tropical cyclones (Bay of Bengal origin), extreme cyclonic wind speeds ($50\text{--}55\text{ m/s}$), storm surge inundation ($2.5\text{--}6.0\text{ m}$ peak depths), tidal embankment breaches, and saline intrusion (e.g. Gosaba, Basanti, Sagar, Patharpratima, Namkhana, Kakdwip, Hingalganj, Sandeshkhali).
  - **Gangetic Alluvial Floodplain** (Murshidabad, Malda, Nadia, Hooghly, Howrah, Purba Bardhaman): Subject to major riverine inundation and embankment erosion along the Bhagirathi-Hooghly, Jalangi, and Damodar river systems.
  - **Sub-Himalayan & Terai Dooars Zone** (Darjeeling, Kalimpong, Jalpaiguri, Alipurduar, Cooch Behar): Characterized by steep slope terrain, high precipitation, severe landslide hazards, and flash floods along Teesta, Torsa, Jaldhaka, and Mahananda river channels.
  - **Western Rarh / Chota Nagpur Fringe** (Purulia, Bankura, Jhargram, Paschim Medinipur): Undulating upland topography with dry-zone characteristics, localized flash flood runoff, and candidate host zone land headroom.

---

## 2. Data Sources & Scientific Lineage

| Data Layer | Primary Authority / Source | Resolution / Format | Notes & Calibration |
| :--- | :--- | :--- | :--- |
| **Administrative Boundaries** | DataMeet Community / Survey of India (ADM2 & ADM3) | Vector GeoJSON (`EPSG:4326`, projected in `EPSG:7755`) | 23 Districts and 346 C.D. Blocks with full topological boundary alignment. |
| **Demographics (PCA)** | Office of the Registrar General & Census Commissioner, India (Census 2011) | C.D. Block aggregates (CSV) | 91.28M total population, gender ratios, 0-6 child cohorts, SC/ST populations, household sizes, non-worker ratios. |
| **Storm Surge & Cyclone Inundation** | IMD Cyclone eAtlas / INCOIS Coastal Inundation Models & WBDMD Historical Surges | Coastal block surge depth ($2.5\text{--}6.0\text{ m}$) | Active for coastal blocks in South 24 Parganas, Purba Medinipur, and North 24 Parganas; calibrated to historical events (Amphan, Yaas, Bulbul, Aila). Formally $0.000\text{ m}$ for inland blocks. |
| **Riverine Flood Recurrence** | European Commission Joint Research Centre (JRC) Global Surface Water (30m) & WBDMD Flood Inundation Maps | 30m Grid Surface Water Recurrence (1984–2021) | Calibrated for Bhagirathi, Teesta, Torsa, Mahananda, Damodar, and Jalangi active floodplains. |
| **Wind Hazard Exposure** | Bureau of Indian Standards (BIS IS 875 Part 3: 2015) | District-level design basic wind speed ($V_b$) | Basic wind speeds $47\text{--}55\text{ m/s}$ (Very High Hazard: Coastal and Northern Sundarbans, East Midnapore, Cooch Behar, Jalpaiguri). |
| **Elevation & Slope Constraints** | NASA Shuttle Radar Topography Mission (SRTM 90m DEM) | 90m Digital Elevation Model | Mean elevation (m), slope (deg), and area with slope $>25^\circ$ (Darjeeling and Kalimpong Himalayan blocks). |
| **Shelter Infrastructure** | WBDMD Multipurpose Cyclone Shelters (MPCS) & Flood Shelters | Normative & direct capacity | Multi-purpose cyclone shelters in Sundarbans and coastal belts, school-cum-relief centers in Gangetic plains. |
| **Health Infrastructure** | Indian Public Health Standards (IPHS 2022) | Normative rural capacity | 1.0 bed per 1,000 population across District Hospitals, Sub-Divisional Hospitals, Rural Hospitals, BPHCs, and PHCs. |
| **Water & Sanitation** | Jal Jeevan Mission (JJM) & Swachh Bharat Mission (SBM-G) | Percentage coverage | Rural piped drinking water coverage and household toilet access percentages. |
| **Evacuation Corridors** | OpenStreetMap (OSM) / WB PWD & WBSRDA PMGSY | Road length & density ($\text{km}/\text{km}^2$) | NH/SH evacuation routes and rural paved road network density. |

---

## 3. Four-Criteria Decision Matrix Formulation

RakshaSethu formulates relocation prioritization using an orthogonal multi-criteria decision framework across four criteria:

$$X = \begin{bmatrix} C_1 & C_2 & C_3 & C_4 \end{bmatrix}$$

### C1: Multi-Hazard Physical Exposure ($C_1 \in [0, 1]$)
- **Coastal Storm Surge Index**: Calibrated for coastal delta blocks using peak surge depths ($2.5\text{--}6.0\text{ m}$) normalized against severe storm surge benchmarks.
- **Riverine Flood Recurrence Index**: JRC 30m permanent and seasonal water recurrence + WBDMD flood history.
- **Extreme Storm Wind Index**: Normalized from BIS IS 875 basic wind speed ($47\text{--}55\text{ m/s}$).
- **Steep Slope / Landslide Constraint Index**: Fraction of block area with slope $>25^\circ$ (Darjeeling and Kalimpong).

### C2: Demographic Sensitivity Index ($C_2 \in [0, 1]$)
- Computed from Census 2011 Primary Census Abstract:
  $$D_i = 0.50 \cdot \text{Child}_{0-6, \text{norm}} + 0.30 \cdot \text{NonWorker}_{\text{norm}} + 0.20 \cdot \text{HHSize}_{\text{norm}}$$

### C3: Physical Carrying Capacity Stress ($C_3 \in [0, 1]$)
- Reflects localized deficits across 4 core infrastructure dimensions:
  $$C_3 = 0.35 \cdot \text{ShelterDeficit} + 0.25 \cdot \text{HealthBedDeficit} + 0.20 \cdot \text{WaterDeficit} + 0.20 \cdot \text{SafeLandDeficit}$$

### C4: Accessibility & Corridor Constraint ($C_4 \in [0, 1]$)
- Inverse normalized road density:
  $$C_4 = \max\left(0.05, \min\left(0.95, 1.0 - \frac{\text{RoadDensity}}{2.5}\right)\right)$$

---

## 4. Analytical Hierarchy Process (AHP) & Saaty Weighting

The pair-wise comparison matrix across $C_1, C_2, C_3, C_4$ was verified:

| Criterion | C1 (Hazard) | C2 (Sensitivity) | C3 (Capacity Stress) | C4 (Access Constraint) | Normalized Priority Weight |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **C1: Hazard Exposure** | 1.0 | 2.0 | 2.0 | 3.0 | **0.4231** (42.31%) |
| **C2: Demographic Sensitivity** | 0.5 | 1.0 | 1.0 | 2.0 | **0.2274** (22.74%) |
| **C3: Capacity Stress** | 0.5 | 1.0 | 1.0 | 2.0 | **0.2274** (22.74%) |
| **C4: Accessibility Constraint** | 0.333 | 0.5 | 0.5 | 1.0 | **0.1221** (12.21%) |

- **Principal Eigenvalue ($\lambda_{\max}$)**: 4.0102
- **Consistency Index ($CI$)**: $\frac{4.0102 - 4}{3} = 0.0034$
- **Consistency Ratio ($CR$)**: $\frac{0.0034}{0.90} = 0.0038 \ll 0.10$ (**Mathematical consistency validated**).

---

## 5. TOPSIS Closeness Coefficient & Quantile Priority Bands

Using vector normalization $r_{ij} = \frac{x_{ij}}{\sqrt{\sum_{k} x_{kj}^2}}$, weighted matrix $V = R \cdot W$, positive ideal solution $A^+$, and negative ideal solution $A^-$, the relative closeness coefficient is:

$$CC_i = \frac{S_i^-}{S_i^+ + S_i^-}$$

All 346 C.D. blocks are categorized via quantile priority thresholds:
- **VERY HIGH (Top 10% ~ 35 Blocks)**: Urgent structural interventions, multi-purpose cyclone shelter expansion, reinforced tidal embankments, pre-positioned NDRF/SDRF units, and staged relocation planning (e.g. Gosaba, Basanti, Sagar, Patharpratima, Kultali, Sandeshkhali II, Hingalganj, Kanthi I, Nandigram I).
- **HIGH (Next 20% ~ 69 Blocks)**: Embankment armoring, saline water barriers, elevated healthcare centers, all-weather bridge connectivity.
- **MODERATE (Next 40% ~ 139 Blocks)**: Community disaster training, early-warning siren integration, local water supply hardening.
- **LOW (Bottom 30% ~ 103 Blocks)**: Regular monitoring, infrastructure maintenance, and candidate host zone reception planning.

---

## 6. Candidate Planning Host Zone Screening

Safer host zones are screened via strict triple-filter criteria:
1. **Low Hazard Exposure**: $C_1 < 0.38$
2. **Low Composite Vulnerability**: $V_i < 0.42$
3. **High Safe Habitable Land Headroom**: $\ge 75\%$ unconstrained habitable land area ($<25^\circ$ slope, non-wetland).

In West Bengal, **23 C.D. Blocks** qualified as Candidate Planning Host Zones (located primarily in stable upland districts such as Paschim Bardhaman, Purulia, Bankura, and Birbhum). **577 safe destination pairings** were generated connecting vulnerable coastal/riverine blocks to safer inland destinations within a $150\text{ km}$ corridor buffer.

---

## 7. Institutional Action Planning & Line Department Mapping

Action recommendations are systematically assigned across state departments:

| Department | Short Code | Primary Mandate & Intervention Thresholds |
| :--- | :--- | :--- |
| **Disaster Management & Civil Defence** | `WBDMD` | Immediate emergency relief, multipurpose shelter deployment, SDRF asset prepositioning. |
| **Irrigation & Waterways Department** | `WB_IWD` | Embankment reconstruction, concrete armor protection, sluice gate automation, tidal drainage. |
| **Public Works Department & WBSRDA** | `WB_PWD` | Evacuation road widening, culvert elevation, cyclone-resilient bridge connections. |
| **Public Health Engineering Department** | `WB_PHED` | JJM piped potable water supply, elevated water storage, saline reverse-osmosis (RO) plants. |
| **Health & Family Welfare Department** | `WB_HFWD` | BPHC/Rural Hospital bed expansion, cold-chain preservation, mobile flood-response dispensaries. |
| **Land & Land Reforms Department** | `WB_LLRD` | Habitable land demarcations, rehabilitation package zoning, safe resettlement titles. |

---

## 8. Data Artifact Parity & Integrity

All processed data files have been verified in `data/processed/`:
- `admin/west_bengal_23_districts.geojson` (23 district polygons)
- `admin/west_bengal_blocks.geojson` (346 C.D. block polygons)
- `census/wb_block_demographics.csv` (346 block records, 91.28M population)
- `hazard/mandal_exposure/wb_block_multi_hazard_exposure.csv` & `.geojson`
- `vulnerability/wb_block_demographic_vulnerability.csv` & `.geojson`
- `capacity/wb_block_capacity_components.csv` & `.geojson`
- `capacity/wb_block_capacity_adequacy.csv` & `.geojson`
- `capacity/wb_host_zone_candidates.csv` (577 pairings)
- `relocation/wb_block_relocation_priority.csv` & `.geojson`
- `relocation/wb_relocation_factor_contributions.csv`
- `relocation/wb_ahp_weights.csv`
- `relocation/wb_relocation_priority_summary.csv`
