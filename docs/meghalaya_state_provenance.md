# RakshaSethu: Meghalaya (ML) Master State Data Provenance & Methodology

## 1. Executive Summary & Administrative Structure
- **State**: Meghalaya (State Code: `ML`, State ID: `meghalaya`)
- **SDMA Authority**: Meghalaya State Disaster Management Authority (MSDMA), Revenue and Disaster Management Department, Government of Meghalaya
- **Administrative Breakdown**:
  - **11 Administrative Districts** (Reflecting the official administrative reorganization of Meghalaya):
    1. **East Khasi Hills** (Headquarters: Shillong)
    2. **West Khasi Hills** (Headquarters: Nongstoin)
    3. **South West Khasi Hills** (Headquarters: Mawkyrwat)
    4. **Ri-Bhoi** (Headquarters: Nongpoh)
    5. **West Jaintia Hills** (Headquarters: Jowai)
    6. **East Jaintia Hills** (Headquarters: Khliehriat)
    7. **West Garo Hills** (Headquarters: Tura)
    8. **East Garo Hills** (Headquarters: Williamnagar)
    9. **South Garo Hills** (Headquarters: Baghmara)
    10. **North Garo Hills** (Headquarters: Resubelpara)
    11. **South West Garo Hills** (Headquarters: Ampati)
  - **46 Community Development Blocks (ADM3 level)**: Complete statewide coverage with stable identifiers (`ML_BLOCK_001` through `ML_BLOCK_046`), zero unmapped or dropped administrative units.
- **Baseline Population**: Exactly **2,966,889** (Census 2011 Primary Census Abstract: 1,491,832 male, 1,475,057 female, 538,299 households).
- **Demographic Sub-cohorts**:
  - Children (0–6 years): 569,327 (19.19%)
  - Scheduled Castes (SC): 17,355 (0.58%)
  - Scheduled Tribes (ST): 2,555,861 (86.15% - predominantly Khasi, Garo, and Jaintia communities)
  - Total Workers: 1,185,619 (39.96%)
  - Non-Workers: 1,781,270 (60.04%)
- **Topography & Hazard Characterization**:
  - **Southern Escarpment & Deep Gorges** (Mawsynram, Shella Bholaganj, Khatarshnong Laitkroh, Pynursla, Amlarem, Baghmara, Rongara): Exceptional monsoon orographic precipitation (including the wettest places on Earth: Mawsynram and Cherrapunji), steep structural drop-offs ($26^\circ\text{--}32^\circ$ slope) plunging to the Sylhet plains of Bangladesh, extreme landslide and debris-flow hazards, and violent flash floods in deep limestone and sandstone gorges.
  - **Central Shillong Plateau & Highland Ridges** (Mylliem, Mawphlang, Mawryngkneng, Bhoirymbong, Thadlaskein): Rolling crystalline plateau terrain ($1,200\text{--}1,960\text{ m}$ AMSL) with lower landslide shear risk, moderate slopes, and higher urban/institutional density (Shillong agglomeration).
  - **Northern & Western Lowland Basins / Riverine Plains** (Jirang, Umling, Tikrikilla, Selsella, Demdema): Low-gradient riverine floodplains draining northward to the Brahmaputra and westward along the Simsang and Jinjiram rivers, characterized by seasonal riverine flooding and bank erosion.
  - **Inland Plateau Setting**: Coastal storm surge is strictly $0.000\text{ m}$ ("NOT APPLICABLE - INLAND PLATEAU"). BIS IS 875 wind hazard is Zone V ($55\text{ m/s}$) reflecting severe Nor'wester convective squalls and high-altitude ridge exposure.

---

## 2. Data Sources & Scientific Lineage

| Data Layer | Primary Authority / Source | Resolution / Format | Notes & Calibration |
| :--- | :--- | :--- | :--- |
| **Administrative Boundaries** | Survey of India / DataMeet / Census ADM3 | Vector GeoJSON (`EPSG:4326`) | Exactly 11 Districts and 46 C.D. Blocks with topological integrity and verified centroid coordinates. |
| **Demographics (PCA)** | Office of the Registrar General & Census Commissioner, India (Census 2011) | Block aggregates (CSV) | Exactly 2,966,889 population across all 46 blocks. Full column alignment (`mandal_id`, `mandal_name`, `district_id`, `district_name`, `total_population`, `children_0_6`, `sc_population`, `st_population`, `total_workers`). |
| **Coastal Storm Surge** | INCOIS / IMD Cyclone eAtlas | Hard-coded $0.000\text{ m}$ | **Formally 0.000 m (NOT APPLICABLE - INLAND PLATEAU)**. Strictly enforced to prevent synthetic coastal distortions. |
| **Riverine & Flash Flood Exposure** | Central Water Commission (CWC), NRSC/ISRO Bhuvan & Meghalaya Water Resources Dept | Block-level flood susceptibility | Calibrated to Simsang, Jinjiram, Umiam, Myntdu, and southern cross-border drainage basins. |
| **Landslide Susceptibility & Slope Constraints** | Geological Survey of India (GSI) & NASA SRTM DEM | 90m Digital Elevation Model | Slope angle ($>25^\circ$ steep-relief fraction), mean elevation (m), and safe unconstrained habitable land headroom. |
| **Wind Hazard Exposure** | Bureau of Indian Standards (BIS IS 875 Part 3: 2015) | District design basic wind speed ($V_b$) | Basic design wind speed $55\text{ m/s}$ (Zone V - Very High Damage Risk). |
| **Shelter Infrastructure** | MSDMA / Revenue & Disaster Management Dept | Block verified shelter capacity & shortfall | Community centers, government schools, church/durbar infrastructure, and public buildings. |
| **Health Infrastructure** | Indian Public Health Standards (IPHS 2022) / National Health Mission Meghalaya | Normative public health beds | Civil Hospitals (Shillong, Tura, Jowai), CHCs, PHCs, and Sub-centres. |
| **Water & Sanitation** | Jal Jeevan Mission (JJM Meghalaya) & SBM-G | Percentage coverage | High-precipitation spring-shed capture networks, gravity-flow piped water, and rural sanitation coverage. |
| **Evacuation Corridors** | OpenStreetMap (OSM) / MoRTH / Meghalaya PWD (Roads) | Road length & density ($\text{km}/\text{km}^2$) | NH-6 (Guwahati-Shillong-Silchar lifeline), NH-106, NH-217 (Tura-Dalu), and district arterial corridors. |

---

## 3. Four-Criteria Decision Matrix Formulation

RakshaSethu formulates relocation prioritization using an orthogonal multi-criteria decision framework across four criteria:

$$X = \begin{bmatrix} C_1 & C_2 & C_3 & C_4 \end{bmatrix}$$

### C1: Multi-Hazard Physical Exposure ($C_1 \in [0, 1]$)
- **Coastal Storm Surge Index**: Strictly $0.000$ (inland state flag active).
- **Flash Flood & Riverine Flood Exposure**: Derived from CWC gauge records, flood-prone alluvial tracts in Garo Hills and deep Khasi/Jaintia river gorges.
- **Landslide & Slope Instability Index**: Derived from GSI national landslide susceptibility mapping and steep slope fractions ($>25^\circ$).
- **Extreme Wind Hazard Index**: Derived from BIS IS 875 basic wind speed ($55\text{ m/s}$).

### C2: Demographic Sensitivity Index ($C_2 \in [0, 1]$)
- Computed from Census 2011 Primary Census Abstract:
  $$D_i = 0.50 \cdot \text{Child}_{0-6, \text{norm}} + 0.30 \cdot \text{NonWorker}_{\text{norm}} + 0.20 \cdot \text{HHSize}_{\text{norm}}$$
- Universal Indian humanitarian standard without synthetic demographic bias.

### C3: Physical Carrying Capacity Stress ($C_3 \in [0, 1]$)
- Quantifies localized deficits across essential humanitarian life-support infrastructure in steep mountain terrain:
  $$C_3 = 0.35 \cdot \text{ShelterDeficit} + 0.25 \cdot \text{HealthBedDeficit} + 0.20 \cdot \text{WaterDeficit} + 0.20 \cdot \text{SafeLandDeficit}$$

### C4: Accessibility & Evacuation Corridor Constraint ($C_4 \in [0, 1]$)
- Inverse normalized road network density in mountainous corridors subject to rockfalls, slope failure, and bridge washouts:
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

All 46 C.D. Blocks are prioritized in an unbroken ranking from 1 to 46:
- **VERY HIGH (Top Ranks: Mawsynram, Shella Bholaganj, Khatarshnong Laitkroh, Selsella, Tikrikilla, Pynursla)**: Southern precipitous escarpment and western low-gradient floodplains facing severe compound hazard exposure, steep slopes, and high evacuation constraints.
- **HIGH (Ranks 7–16)**: High-slope mountain blocks with active debris flow hazards and moderate infrastructure deficits.
- **MODERATE (Ranks 17–32)**: Plateau and foothill blocks with balanced risk and partial infrastructure buffering.
- **LOW (Ranks 33–46)**: Stable valley floors and plateau blocks (e.g., Umsning, Bhoirymbong, Umling) with lower hazard vulnerability and higher safe land availability.

---

## 6. Candidate Planning Locations (Host Zones)

Screened 11 safe candidate host zones meeting multi-criteria safety thresholds ($>55\%$ safe habitable land, lower hazard index, and physical capacity headroom):
1. **Bhoirymbong** (Ri-Bhoi) — $72.0\%$ Safe Land
2. **Umling** (Ri-Bhoi) — $68.0\%$ Safe Land
3. **Umsning** (Ri-Bhoi) — $65.0\%$ Safe Land
4. **Jirang** (Ri-Bhoi) — $62.0\%$ Safe Land
5. **Samanda** (East Garo Hills) — $60.0\%$ Safe Land
6. **Songsak** (East Garo Hills) — $58.0\%$ Safe Land
7. **Resubelpara** (North Garo Hills) — $60.0\%$ Safe Land
8. **Kharkutta** (North Garo Hills) — $58.0\%$ Safe Land
9. **Bajengdoba** (North Garo Hills) — $56.0\%$ Safe Land
10. **Thadlaskein** (West Jaintia Hills) — $62.0\%$ Safe Land
11. **Laskein** (West Jaintia Hills) — $58.0\%$ Safe Land

*Note: These are Candidate Planning Locations for decision support, not officially gazetted permanent rehabilitation sites.*

---

## 7. Action Planning & Inter-Agency Coordination
The phased decision action plan dynamically integrates Meghalaya state agencies:
- **Immediate (0–72 Hours)**: Meghalaya State Disaster Management Authority (MSDMA), District Disaster Management Authorities (DDMAs), Police & SDRF mobilization along NH-6, NH-106, and NH-217.
- **Short Term (1–6 Months)**: Meghalaya PWD (Roads) culvert reinforcement, Public Health Engineering Department (PHED) spring-shed water supply restoration, Health & Family Welfare temporary field hospitals.
- **Long Term (1–3 Years)**: Social Welfare Department community relocation support, Water Resources Department watershed management, and long-term resilient housing on designated candidate host zones.
