# RakshaSethu: Assam (AS) Master State Data Provenance & Methodology

## 1. Executive Summary & Administrative Structure
- **State**: Assam (State Code: `AS`)
- **SDMA Authority**: Assam State Disaster Management Authority (ASDMA)
- **Administrative Breakdown**:
  - **33 Administrative Districts** (Survey of India / DataMeet standard)
  - **153 Revenue Circles (Sub-districts / Mandals)**
- **Baseline Population**: **31,205,576** (Census 2011 Primary Census Abstract aggregate)
- **Topography & Hazard Characterization**: Inland riverine basin (Brahmaputra & Barak River valleys) flanked by hill districts (Dima Hasao, Karbi Anglong, West Karbi Anglong). Coastal cyclone storm surge and marine landfall are explicitly marked **`NOT APPLICABLE (0.0)`**.

---

## 2. Data Sources & Scientific Lineage

| Data Layer | Primary Authority / Source | Resolution / Format | Notes & Calibration |
| :--- | :--- | :--- | :--- |
| **Administrative Boundaries** | DataMeet Community / Survey of India (ADM2 & ADM3) | Vector GeoJSON (`EPSG:4326`, projected in `EPSG:7755`) | 33 Districts and 153 Revenue Circles with exact spatial coverage. |
| **Demographics (PCA)** | Office of the Registrar General & Census Commissioner, India (Census 2011) | Revenue Circle aggregates (CSV) | Total population, male/female, 0-6 children, SC/ST, households, non-workers. |
| **Riverine Flood Recurrence** | European Commission Joint Research Centre (JRC) Global Surface Water (30m) | 30m Grid Surface Water Recurrence (1984–2021) | Calibrated for Brahmaputra & Barak annual monsoon flooding; mean recurrence and area $\ge 10\%$. |
| **Wind Hazard Exposure** | Bureau of Indian Standards (BIS IS 875 Part 3: 2015) | District-level design basic wind speed ($V_b$) | Basic wind speeds $47\text{--}55\text{ m/s}$ (Very High Hazard Zone: Dhubri, Kokrajhar, Goalpara, etc.). |
| **Elevation & Slope Constraints** | NASA Shuttle Radar Topography Mission (SRTM 90m DEM) | 90m Digital Elevation Model | Mean elevation (m), slope (deg), and area with slope $>25^\circ$ as landslide constraints. |
| **Shelter Infrastructure** | ASDMA Flood Shelters & Relief Camps | Normative & direct capacity | ASDMA flood shelters, community relief centres, school halls. |
| **Health Infrastructure** | Indian Public Health Standards (IPHS 2022) | Normative rural capacity | 1.0 bed per 1,000 population across PHCs, CHCs, Sub-Divisional Hospitals. |
| **Water & Sanitation** | Jal Jeevan Mission (JJM) & Swachh Bharat Mission (SBM-G) | Percentage coverage | Tap water connectivity and household sanitation access percentages. |
| **Evacuation Corridors** | OpenStreetMap (OSM) / PMGSY Network | Road length & density ($\text{km}/\text{km}^2$) | Primary, secondary, and rural road evacuation network density. |

---

## 3. Four-Criteria Decision Matrix Formulation

RakshaSethu formulates relocation prioritization using an orthogonal multi-criteria decision framework across the four criteria:

$$X = \begin{bmatrix} C_1 & C_2 & C_3 & C_4 \end{bmatrix}$$

### C1: Multi-Hazard Physical Exposure ($C_1 \in [0, 1]$)
- **Riverine Flood Recurrence Index**: JRC 30m permanent and seasonal water recurrence.
- **Extreme Wind Index**: Normalized from BIS IS 875 basic wind speed ($47\text{--}55\text{ m/s}$).
- **Steep Slope Constraint Index**: Fraction of circle area with slope $>25^\circ$.
- **Coastal Landfall & Surge**: Formally set to $0.000$ (inland state flag).

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

Revenue Circles are categorized via quantile priority thresholds:
- **VERY HIGH (Top 10%)**: Urgent structural intervention, pre-positioned NDRF/SDRF assets, and planned relocation review.
- **HIGH (Next 20%)**: Embankment strengthening, elevated flood shelter expansion, PMGSY bridge connectivity.
- **MODERATE (Next 40%)**: Community-level disaster preparedness, early-warning siren networks.
- **LOW (Bottom 30%)**: Baseline monitoring and regular infrastructure maintenance.

---

## 6. Candidate Planning Host Zone Screening

Safer host zones are screened via strict triple-filter criteria:
1. **Low Hazard Exposure**: $C_1 < 0.38$
2. **Low Composite Vulnerability**: $V_i < 0.42$
3. **High Safe Habitable Land Headroom**: $\ge 75\%$ unconstrained habitable land area ($<25^\circ$ slope, non-wetland).

In Assam, **42 Revenue Circles** qualified as Candidate Planning Host Zones. Pairings are generated with high-priority source circles within a $150\text{ km}$ regional corridor buffer.

---

## 7. Data Artifact Parity & Integrity

All processed data files have been verified:
- `data/processed/admin/assam_33_districts.geojson` (33 districts, EPSG:4326)
- `data/processed/admin/assam_revenue_circles.geojson` (153 circles, EPSG:4326)
- `data/processed/census/as_circle_demographics.csv` (153 records, Census 2011)
- `data/processed/hazard/mandal_exposure/as_circle_multi_hazard_exposure.csv` & `.geojson`
- `data/processed/vulnerability/as_circle_demographic_vulnerability.csv` & `.geojson`
- `data/processed/capacity/as_circle_capacity_components.csv`, `as_circle_capacity_adequacy.csv`, `as_host_zone_candidates.csv`
- `data/processed/relocation/as_circle_relocation_priority.csv`, `as_relocation_factor_contributions.csv`, `as_ahp_weights.csv`, `as_relocation_priority_summary.csv`, `as_circle_relocation_priority.geojson`

**Test Suite Coverage**: 100% pass rate across 90 tests in 11 test modules.
