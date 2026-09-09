# RakshaSethu: Sikkim (SK) Master State Data Provenance & Methodology

## 1. Executive Summary & Administrative Structure
- **State**: Sikkim (State Code: `SK`, State ID: `sikkim`)
- **SDMA Authority**: Sikkim State Disaster Management Authority (SSDMA), Land Revenue & Disaster Management Department (LR&DMD), Government of Sikkim
- **Administrative Breakdown**:
  - **6 Administrative Districts** (Reflecting the Government of Sikkim administrative reorganization, dissolving historical 4 districts into 6 modern districts):
    1. **Mangan** (formerly North Sikkim)
    2. **Gyalshing** (formerly West Sikkim)
    3. **Soreng** (carved out of West Sikkim)
    4. **Namchi** (formerly South Sikkim)
    5. **Gangtok** (formerly East Sikkim)
    6. **Pakyong** (carved out of East Sikkim)
  - **16 Sub-divisions (ADM3 level)**: Gangtok, Pakyong, Rongli, Rangpo, Namchi, Jorethang, Ravong, Yangang, Gyalshing, Soreng, Dentam, Yuksom, Mangan, Chungthang, Dzongu, Kabi (Complete statewide coverage, zero dropped or excluded administrative units).
- **Baseline Population**: Exactly **610,577** (Census 2011 Primary Census Abstract aggregate across all districts: 323,070 male, 287,507 female, 128,163 households).
- **Demographic Sub-cohorts**:
  - Children (0–6 years): 64,111 (10.50%)
  - Scheduled Castes (SC): 28,275 (4.63%)
  - Scheduled Tribes (ST): 206,360 (33.80%)
  - Total Workers: 308,138 (50.47%)
  - Non-Workers: 302,439 (49.53%)
- **Topography & Hazard Characterization**:
  - **High-Alpine Glacial & Periglacial Zone** (Mangan / Upper Teesta Basin): Extreme elevation ($1,500\text{--}8,586\text{ m}$ AMSL, crowned by Mount Kangchenjunga), active moraine-dammed glacial lakes (e.g., South Lhonak, Shako Cho), acute Glacial Lake Outburst Flood (GLOF) trajectory through the Chungthang gorge and Teesta Stage III dam breach corridor, catastrophic flash flooding, and severe winter isolation.
  - **Rugged Middle-Himalayan Hill Terrain** (Gyalshing, Yuksom, Dentam, Dzongu, Kabi, Ravong): Exceptionally steep terrain with $>25^\circ$ slope fractions exceeding $65\%$, active shear zones along the Main Central Thrust (MCT), high monsoon precipitation, frequent rockfalls, debris flows, and critical highway blockages along NH-10 and state lifelines.
  - **Lower Elevation Terraces & Foothill Basins** (Namchi, Jorethang, Pakyong, Soreng): Lower elevation river terraces and stable foothill basins ($300\text{--}1,400\text{ m}$ AMSL) with higher safe habitable land headroom ($46\%\text{--}70\%$), providing prime reception capacity for planned community relocation, relief logistics, and emergency helipad connectivity.

---

## 2. Data Sources & Scientific Lineage

| Data Layer | Primary Authority / Source | Resolution / Format | Notes & Calibration |
| :--- | :--- | :--- | :--- |
| **Administrative Boundaries** | Survey of India / DataMeet / Census ADM3 | Vector GeoJSON (`EPSG:4326`) | Exactly 6 Modern Districts and 16 Sub-divisions with clean topological boundaries and verified centroid coordinates. |
| **Demographics (PCA)** | Office of the Registrar General & Census Commissioner, India (Census 2011) | Sub-division aggregates (CSV) | Exactly 610,577 population across all 16 sub-divisions. Full column alignment (`mandal_id`, `mandal_name`, `district_id`, `district_name`, `total_population`, `children_0_6`, `sc_population`, `st_population`, `total_workers`). |
| **Coastal Storm Surge** | INCOIS / IMD Cyclone eAtlas | Hard-coded $0.000\text{ m}$ | **Formally 0.000 m (NOT APPLICABLE - INLAND HIMALAYAN)**. Enforced strictly to prevent synthetic coastal distortion in mountain states. |
| **Glacial Lake Outburst & Flash Floods** | CWC, NRSC/ISRO Bhuvan, Wadia Institute of Himalayan Geology (WIHG) & SSDMA | Basin-level glacial lake risk & flood recurrence | Calibrated to upper Teesta, Rangpo Chhu, Rangeet, and Lachen/Lachung basins post-South Lhonak 2023 disaster. |
| **Landslide Susceptibility & Slope Constraints** | Geological Survey of India (GSI) & NASA SRTM DEM | 90m Digital Elevation Model | Slope angle ($>25^\circ$ steep-relief fraction), mean elevation (m), and safe unconstrained habitable land headroom. |
| **Wind Hazard Exposure** | Bureau of Indian Standards (BIS IS 875 Part 3: 2015) | District design basic wind speed ($V_b$) | Basic wind speeds $47\text{ m/s}$ (Zone IV mountain ridges and river gorges). |
| **Shelter Infrastructure** | SSDMA / LR&DMD / Government of Sikkim | Sub-division verified shelter capacity & shortfall | Permanent disaster shelters, community centers, schools, and government infrastructure. |
| **Health Infrastructure** | Indian Public Health Standards (IPHS 2022) / NHM Sikkim | Normative public health beds | STNM Hospital Gangtok, District Hospitals, Community Health Centres (CHCs), and PHCs. |
| **Water & Sanitation** | Jal Jeevan Mission (JJM Sikkim) & SBM-G | Percentage coverage | Gravity-fed spring water supply networks and rural sanitation access percentages. |
| **Evacuation Corridors** | OpenStreetMap (OSM) / MoRTH / Sikkim PWD & Border Roads Organisation (BRO) | Road length & density ($\text{km}/\text{km}^2$) | NH-10 arterial corridor (Siliguri-Gangtok), North Sikkim Highway (Mangan-Chungthang-Lachen/Lachung), and BRO border routes. |

---

## 3. Four-Criteria Decision Matrix Formulation

RakshaSethu formulates relocation prioritization using an orthogonal multi-criteria decision framework across four criteria:

$$X = \begin{bmatrix} C_1 & C_2 & C_3 & C_4 \end{bmatrix}$$

### C1: Multi-Hazard Physical Exposure ($C_1 \in [0, 1]$)
- **Coastal Storm Surge Index**: Strictly $0.000$ (inland state flag active).
- **GLOF & Riverine Flash Flood Exposure**: Derived from glacial lake outburst pathways (South Lhonak, Shako Cho), Teesta basin morphology, and seasonal flood recurrence.
- **Landslide & Slope Instability Index**: Derived from GSI national landslide susceptibility mapping and steep slope fractions ($>25^\circ$).
- **Extreme Wind Hazard Index**: Derived from BIS IS 875 basic wind speed ($47\text{ m/s}$).

### C2: Demographic Sensitivity Index ($C_2 \in [0, 1]$)
- Computed from Census 2011 Primary Census Abstract:
  $$D_i = 0.50 \cdot \text{Child}_{0-6, \text{norm}} + 0.30 \cdot \text{NonWorker}_{\text{norm}} + 0.20 \cdot \text{HHSize}_{\text{norm}}$$
- Universal Indian humanitarian standard without synthetic demographic bias.

### C3: Physical Carrying Capacity Stress ($C_3 \in [0, 1]$)
- Quantifies localized deficits across essential humanitarian life-support infrastructure in steep mountain terrain:
  $$C_3 = 0.35 \cdot \text{ShelterDeficit} + 0.25 \cdot \text{HealthBedDeficit} + 0.20 \cdot \text{WaterDeficit} + 0.20 \cdot \text{SafeLandDeficit}$$

### C4: Accessibility & Evacuation Corridor Constraint ($C_4 \in [0, 1]$)
- Inverse normalized road network density in mountainous corridors subject to rockfalls and bridge washouts:
  $$C_4 = \max\left(0.05, \min\left(0.95, 1.0 - \frac{\text{RoadDensity}}{2.5}\right)\right)$$

---

## 4. Analytical Hierarchy Process (AHP) & Saaty Weighting

The pair-wise comparison matrix across $C_1, C_2, C_3, C_4$ was verified:

| Criterion | C1 (Hazard) | C2 (Sensitivity) | C3 (Capacity Stress) | C4 (Access Constraint) | Priority Weight ($W$) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **C1: Hazard Exposure** | 1.0 | 2.0 | 2.0 | 3.0 | **0.4231** (42.31%) |
| **C2: Demographic Sensitivity** | 0.5 | 1.0 | 1.0 | 2.0 | **0.2274** (22.74%) |
| **C3: Capacity Stress** | 0.5 | 1.0 | 1.0 | 2.0 | **0.2274** (22.74%) |
| **C4: Accessibility Constraint** | 0.333 | 0.5 | 0.5 | 1.0 | **0.1221** (12.21%) |

- **Principal Eigenvalue ($\lambda_{\max}$)**: 4.0102
- **Consistency Index ($CI$)**: $\frac{4.0102 - 4}{3} = 0.0034$
- **Consistency Ratio ($CR$)**: $\frac{0.0034}{0.90} = 0.0038 \ll 0.10$ (**Rigorous mathematical consistency verified**).

---

## 5. TOPSIS Closeness Coefficient & Priority Bands

Using vector normalization $r_{ij} = \frac{x_{ij}}{\sqrt{\sum_{k} x_{kj}^2}}$, weighted matrix $V = R \cdot W$, positive ideal solution $A^+$, and negative ideal solution $A^-$, the relative closeness coefficient is:

$$CC_i = \frac{S_i^-}{S_i^+ + S_i^-}$$

All 16 Sub-divisions are prioritized in an unbroken ranking from 1 to 16:
- **VERY HIGH (Top Ranks: Mangan, Chungthang)**: Extreme alpine river gorge sub-divisions directly exposed to the South Lhonak GLOF breach corridor, severe landslide toe-cutting, and acute road isolation ($CC_i \ge 0.80$).
- **HIGH (Ranks 3–6: Kabi, Yuksom, Dzongu, Rongli)**: High-slope mountain sub-divisions with active debris flow cones and limited road egress ($CC_i \in [0.55, 0.75]$).
- **MODERATE (Ranks 7–11: Gyalshing, Dentam, Ravong, Rangpo, Yangang)**: Middle-hill sub-divisions with moderate landslide exposure and partial infrastructure resilience ($CC_i \in [0.40, 0.55]$).
- **LOW (Ranks 12–16: Gangtok, Soreng, Pakyong, Namchi, Jorethang)**: Stable valley floors and administrative urban centers with lower hazard vulnerability and higher safe land availability ($CC_i < 0.40$).

---

## 6. Candidate Planning Host Zone Screening

Safer host zones are screened via strict triple-filter criteria:
1. **Low Hazard Exposure**: $C_1 < 0.48$
2. **Low Composite Vulnerability**: $V_i < 0.70$
3. **Safe Habitable Land Headroom**: $\ge 45\%$ unconstrained habitable land area ($<15^\circ$ slope, non-hazard terrain).

In Sikkim, **4 Sub-divisions** qualified as Candidate Planning Host Zones:
1. **Jorethang** (Namchi District) – $70.2\%$ safe land, hazard exposure $0.428$
2. **Namchi** (Namchi District) – $48.1\%$ safe land, hazard exposure $0.442$
3. **Pakyong** (Pakyong District) – $55.7\%$ safe land, hazard exposure $0.464$
4. **Soreng** (Soreng District) – $46.7\%$ safe land, hazard exposure $0.476$

**64 safe destination pairings** were generated connecting vulnerable high-hazard sub-divisions to safer host destinations within the inter-district road transit corridor network.
