# RakshaSethu: Bihar (BR) Master State Data Provenance & Methodology

## 1. Executive Summary & Administrative Structure
- **State**: Bihar (State Code: `BR`)
- **SDMA Authority**: Bihar State Disaster Management Authority (BSDMA)
- **Administrative Breakdown**:
  - **38 Administrative Districts** (Survey of India / DataMeet standard)
  - **534 Community Development (C.D.) Blocks / Sub-districts**
- **Baseline Population**: **104,090,477** (Census 2011 Primary Census Abstract aggregate)
- **Topography & Hazard Characterization**: Major Gangetic alluvial plain bounded by the Nepal Terai in the north and the Chota Nagpur plateau margins in the south. Traversing river systems (Kosi - "Sorrow of Bihar", Gandak, Bagmati, Burhi Gandak, Kamla Balan, Mahananda, Son, and Ganga) create recurrent severe riverine and flash flooding across 28 north/central districts. Coastal cyclone storm surge and marine landfall are explicitly marked **`NOT APPLICABLE (0.0)`**.

---

## 2. Data Sources & Scientific Lineage

| Data Layer | Primary Authority / Source | Resolution / Format | Notes & Calibration |
| :--- | :--- | :--- | :--- |
| **Administrative Boundaries** | DataMeet Community / Survey of India (ADM2 & ADM3) | Vector GeoJSON (`EPSG:4326`, projected in `EPSG:7755`) | 38 Districts and 534 C.D. Blocks with full spatial polygon topology. |
| **Demographics (PCA)** | Office of the Registrar General & Census Commissioner, India (Census 2011) | C.D. Block aggregates (CSV) | 104.09M total population, gender split, 0-6 child population, SC/ST cohorts, household sizes, non-workers. |
| **Riverine Flood Recurrence** | European Commission Joint Research Centre (JRC) Global Surface Water (30m) & BSDMA Flood History | 30m Grid Surface Water Recurrence (1984–2021) | Calibrated for Kosi, Gandak, Bagmati, Kamla-Balan, and Ganga flood plains; high recurring inundation. |
| **Wind Hazard Exposure** | Bureau of Indian Standards (BIS IS 875 Part 3: 2015) | District-level design basic wind speed ($V_b$) | Basic wind speeds $44\text{--}55\text{ m/s}$ (Very High Hazard Zone: Madhubani, Supaul, Araria, Kishanganj, Purnia, Katihar). |
| **Elevation & Slope Constraints** | NASA Shuttle Radar Topography Mission (SRTM 90m DEM) | 90m Digital Elevation Model | Mean elevation (m), slope (deg), and area with slope $>25^\circ$ (Someshwar range in West Champaran and Kaimur hills). |
| **Shelter Infrastructure** | BSDMA Cyclone/Flood Shelters & Community Relief Hubs | Normative & direct capacity | Multi-purpose cyclone/flood shelters, designated government relief schools, community centres. |
| **Health Infrastructure** | Indian Public Health Standards (IPHS 2022) | Normative rural capacity | 1.0 bed per 1,000 population across District Hospitals, Sub-Divisional Hospitals, CHCs, and PHCs. |
| **Water & Sanitation** | Jal Jeevan Mission (JJM) & Swachh Bharat Mission (SBM-G) | Percentage coverage | Rural piped drinking water connectivity and household sanitation access percentages. |
| **Evacuation Corridors** | OpenStreetMap (OSM) / Bihar Rural Works Dept (RWD) PMGSY | Road length & density ($\text{km}/\text{km}^2$) | National/State Highway corridors and rural pacca road network density. |

---

## 3. Four-Criteria Decision Matrix Formulation

RakshaSethu formulates relocation prioritization using an orthogonal multi-criteria decision framework across four criteria:

$$X = \begin{bmatrix} C_1 & C_2 & C_3 & C_4 \end{bmatrix}$$

### C1: Multi-Hazard Physical Exposure ($C_1 \in [0, 1]$)
- **Riverine Flood Recurrence Index**: JRC 30m permanent and seasonal water recurrence + BSDMA flood inundation frequency.
- **Extreme Storm Wind Index**: Normalized from BIS IS 875 basic wind speed ($44\text{--}55\text{ m/s}$).
- **Steep Slope / Landslide Constraint Index**: Fraction of block area with slope $>25^\circ$ (West Champaran / Kaimur).
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

All 534 C.D. blocks are categorized via quantile priority thresholds:
- **VERY HIGH (Top 10% ~ 53 Blocks)**: Urgent structural intervention, pre-positioned NDRF/SDRF assets, and planned relocation review (e.g. high-risk Kosi/Gandak embayments in Supaul, Saharsa, Khagaria, Madhepura).
- **HIGH (Next 20% ~ 107 Blocks)**: Embankment strengthening, elevated flood shelter expansion, Bihar RWD bridge connectivity.
- **MODERATE (Next 40% ~ 214 Blocks)**: Community-level disaster preparedness, early-warning siren networks.
- **LOW (Bottom 30% ~ 160 Blocks)**: Baseline monitoring, candidate host zones, and regular infrastructure maintenance.

---

## 6. Candidate Planning Host Zone Screening

Safer host zones are screened via strict triple-filter criteria:
1. **Low Hazard Exposure**: $C_1 < 0.38$
2. **Low Composite Vulnerability**: $V_i < 0.42$
3. **High Safe Habitable Land Headroom**: $\ge 75\%$ unconstrained habitable land area ($<25^\circ$ slope, non-wetland).

In Bihar, **54 C.D. Blocks** qualified as Candidate Planning Host Zones. Pairings are generated with high-priority source blocks within a $150\text{ km}$ regional corridor buffer.

---

## 7. Data Artifact Parity & Integrity

All processed data files have been verified in `data/processed/`:
1. `data/processed/admin/bihar_38_districts.geojson` (38 districts)
2. `data/processed/admin/bihar_blocks.geojson` (534 blocks)
3. `data/processed/census/br_block_demographics.csv` (104,090,477 population)
4. `data/processed/hazard/mandal_exposure/br_block_multi_hazard_exposure.csv` & `.geojson`
5. `data/processed/vulnerability/br_block_demographic_vulnerability.csv` & `.geojson`
6. `data/processed/capacity/br_block_capacity_components.csv`
7. `data/processed/capacity/br_block_capacity_adequacy.csv`
8. `data/processed/capacity/br_host_zone_candidates.csv`
9. `data/processed/relocation/br_block_relocation_priority.csv` & `.geojson`
10. `data/processed/relocation/br_relocation_factor_contributions.csv`
11. `data/processed/relocation/br_ahp_weights.csv`
12. `data/processed/relocation/br_relocation_priority_summary.csv`
