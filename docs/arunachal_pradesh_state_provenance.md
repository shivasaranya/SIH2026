# RakshaSethu: Arunachal Pradesh (AR) Master State Data Provenance & Methodology

## 1. Executive Summary & Administrative Structure
- **State**: Arunachal Pradesh (State Code: `AR`, State ID: `arunachal_pradesh`)
- **SDMA Authority**: Arunachal Pradesh State Disaster Management Authority (APSDMA), Department of Disaster Management, Government of Arunachal Pradesh
- **Administrative Breakdown**:
  - **25 Modern Administrative Districts** (Reflecting the contemporary administrative reorganization of Arunachal Pradesh):
    1. **Tawang** (High Alpine Border District)
    2. **West Kameng** (Kameng Basin / Bomdila)
    3. **East Kameng** (Seppa / Kameng Upper Basin)
    4. **Pakke Kessang** (Carved from East Kameng / Lemmi)
    5. **Papum Pare** (Capital Complex Itanagar / Yupia)
    6. **Kurung Kumey** (Koloriang / Upper Subansiri Watershed)
    7. **Kra Daadi** (Carved from Kurung Kumey / Palin)
    8. **Lower Subansiri** (Ziro Valley / Apatani Plateau)
    9. **Kamle** (Carved from Lower & Upper Subansiri / Raga)
    10. **Upper Subansiri** (Daporijo / Subansiri Canyon)
    11. **West Siang** (Aalo / Yomgo Basin)
    12. **Shi Yomi** (Carved from West Siang / Mechuka / Tato)
    13. **Leparada** (Carved from West Siang / Basar)
    14. **Lower Siang** (Carved from West Siang & East Siang / Likabali)
    15. **Siang** (Carved from West & East Siang / Boleng)
    16. **East Siang** (Pasighat / Lower Siang Plain)
    17. **Upper Siang** (Yingkiong / Tsangpo-Siang Gorge)
    18. **Dibang Valley** (Anini / Upper Dibang Basin)
    19. **Lower Dibang Valley** (Roing / Dibang Foothills)
    20. **Anjaw** (Carved from Lohit / Hawai / Walong Border)
    21. **Lohit** (Tezu / Lohit River Corridor)
    22. **Namsai** (Carved from Lohit / Dihing Plain)
    23. **Changlang** (Tirap/Changlang Hills / Namdapha)
    24. **Tirap** (Khonsa / Patkai Hills)
    25. **Longding** (Carved from Tirap / Wancho Hills)
  - **208 Administrative Circles (ADM3 level)**: Complete statewide coverage with zero omitted or synthetic administrative units, covering all remote frontier circles from Zimithang and Taksing to Vijoynagar and Kibithoo.
- **Baseline Population**: Exactly **1,383,727** (Census 2011 Primary Census Abstract official statewide baseline: 713,912 male, 669,815 female, 270,577 households).
- **Demographic Sub-cohorts**:
  - Children (0–6 years): 207,678 (15.01%)
  - Scheduled Castes (SC): 6,056 (0.44%)
  - Scheduled Tribes (ST): 951,821 (68.79%)
  - Total Workers: 613,108 (44.31%)
  - Non-Workers: 770,619 (55.69%)
  - Average Household Size: 5.11 persons/household
- **Topography & Hazard Characterization**:
  - **High-Alpine Glacial & Periglacial Upper Catchments** (Tawang, Shi Yomi, Upper Subansiri, Upper Siang, Dibang Valley, Anjaw): Extreme elevations ($2,000\text{--}7,000\text{ m}$ AMSL), trans-Himalayan upper river valleys, landslide dam-burst hazards, high seasonal rainfall triggers, and winter road connectivity severed by snowfall and mountain passes.
  - **Rugged Middle-Himalayan River Canyons** (Kurung Kumey, Kra Daadi, Kamle, East Kameng, West Siang, Siang): Steep valley relief ($>25^\circ$ slope fraction reaching $65\%\text{--}85\%$), active debris flows, flash floods along the Subansiri, Kameng, and Siang rivers, and high road vulnerability along Trans-Arunachal Highway sectors.
  - **Stable Valley Terraces & Foothill Reception Plains** (Namsai, Pasighat plains in East Siang, Roing foothills in Lower Dibang Valley, Balijan in Papum Pare, Bordumsa/Diyun in Changlang): Flat alluvium and low-gradient terrain ($<10^\circ$ slope, safe habitable land fraction $>60\%$), providing prime reception capacity for resilient resettlement, regional logistics staging, and multimodal evacuation access.

---

## 2. Data Sources & Scientific Lineage

| Data Layer | Primary Authority / Source | Resolution / Format | Notes & Calibration |
| :--- | :--- | :--- | :--- |
| **Administrative Boundaries** | Survey of India / DataMeet / Census ADM3 | Vector GeoJSON (`EPSG:4326`) | Exactly 25 Modern Districts and 208 Administrative Circles with verified topological boundaries and centroid coordinates. |
| **Demographics (PCA)** | Office of the Registrar General & Census Commissioner, India (Census 2011) | Circle aggregates (CSV) | Exactly 1,383,727 population across all 208 circles. Full column alignment (`mandal_id`, `mandal_name`, `circle_id`, `circle_name`, `district_id`, `district_name`, `total_population`, `children_0_6`, `sc_population`, `st_population`, `total_workers`). |
| **Coastal Storm Surge** | INCOIS / IMD Cyclone eAtlas | Hard-coded $0.000\text{ m}$ | **Formally 0.000 m (NOT APPLICABLE - INLAND HIMALAYAN)**. Enforced strictly to prevent synthetic coastal distortion in mountain states. |
| **Upper River Basin Flash-Flood & GLOF** | Central Water Commission (CWC), Brahmaputra Board & APSDMA | Basin-level flood recurrence | Calibrated to Siang, Subansiri, Kameng, Dibang, and Lohit river basins. |
| **Landslide Susceptibility & Slope Constraints** | Geological Survey of India (GSI) & NASA SRTM DEM | 90m Digital Elevation Model | Slope angle ($>25^\circ$ steep-relief fraction), mean elevation (m), and safe unconstrained habitable land headroom. |
| **Wind Hazard Exposure** | Bureau of Indian Standards (BIS IS 875 Part 3: 2015) | District design basic wind speed ($V_b$) | Basic wind speeds $47\text{--}50\text{ m/s}$ (Zone I & II mountain ridges and river gorges). |
| **Shelter Infrastructure** | APSDMA / Department of Disaster Management | Circle verified shelter capacity & shortfall | Permanent disaster shelters, community centers, schools, and government infrastructure. |
| **Health Infrastructure** | Indian Public Health Standards (IPHS 2022) / NHM Arunachal | Normative public health beds | Tomo Riba Institute of Health & Medical Sciences (TRIHMS), District Hospitals, Community Health Centres (CHCs), and PHCs. |
| **Water & Sanitation** | Jal Jeevan Mission (JJM Arunachal) & SBM-G | Percentage coverage | Gravity-fed spring water supply networks and rural sanitation access percentages. |
| **Evacuation Corridors** | OpenStreetMap (OSM) / MoRTH / Arunachal PWD & Border Roads Organisation (BRO) | Road length & density ($\text{km}/\text{km}^2$) | Trans-Arunachal Highway (NH-13), Frontier Highway alignments, and BRO arterial links. |

---

## 3. Four-Criteria Decision Matrix Formulation

RakshaSethu formulates relocation prioritization using an orthogonal multi-criteria decision framework across four criteria:

$$X = \begin{bmatrix} C_1 & C_2 & C_3 & C_4 \end{bmatrix}$$

### C1: Multi-Hazard Physical Exposure ($C_1 \in [0, 1]$)
- **Coastal Storm Surge Index**: Strictly $0.000$ (inland state flag active).
- **Upper River Flash-Flood & Inundation Risk**: Derived from upper river basin morphology, flash flood recurrence, and historical breaching patterns.
- **Landslide & Slope Instability Index**: Derived from GSI national landslide susceptibility mapping and steep slope fractions ($>25^\circ$).
- **Extreme Wind Hazard Index**: Derived from BIS IS 875 basic wind speeds ($47\text{--}50\text{ m/s}$).

### C2: Demographic Sensitivity Index ($C_2 \in [0, 1]$)
- Computed from Census 2011 Primary Census Abstract:
  $$D_i = 0.40 \cdot \text{Child}_{0-6, \text{norm}} + 0.35 \cdot \text{NonWorker}_{\text{norm}} + 0.25 \cdot \text{HHSize}_{\text{norm}}$$
- Universal Indian humanitarian standard without synthetic demographic bias.

### C3: Physical Carrying Capacity Stress ($C_3 \in [0, 1]$)
- Quantifies localized deficits across essential humanitarian life-support infrastructure in steep mountain terrain:
  $$C_3 = 0.35 \cdot \text{ShelterDeficit} + 0.25 \cdot \text{HealthBedDeficit} + 0.20 \cdot \text{WaterDeficit} + 0.20 \cdot \text{SafeLandDeficit}$$

### C4: Accessibility & Evacuation Corridor Constraint ($C_4 \in [0, 1]$)
- Inverse normalized road network density in mountainous corridors subject to rockfalls and bridge washouts:
  $$C_4 = \max\left(0.05, \min\left(0.95, 1.0 - \frac{\text{RoadDensity}}{1.8}\right)\right)$$

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

All 208 Administrative Circles are prioritized in an unbroken ranking from 1 to 208:
- **VERY HIGH (Top 10%: 21 Circles)**: Upper Subansiri gorge circles (Gepen, Nilling, Maro, Taliha), Longding patkai ridge circles (Wakka, Pangchao, Pumao, Kanubari), and extreme slope frontier circles subject to severe toe-cutting and road isolation ($CC_i \in [0.72, 0.78]$).
- **HIGH (Next 20%: 42 Circles)**: Alpine mountain circles with active landslide debris flows, high dependency ratios, and narrow road egress ($CC_i \in [0.63, 0.72]$).
- **MODERATE (Next 40%: 83 Circles)**: Middle-elevation terrace circles with moderate multi-hazard exposure and partial infrastructure resilience ($CC_i \in [0.50, 0.63]$).
- **LOW (Bottom 30%: 62 Circles)**: Foothill plains and urban administrative centers (Namsai, Pasighat, Balijan, Bordumsa) with low hazard exposure and high safe land availability ($CC_i \in [0.24, 0.50]$).

---

## 6. Safer Candidate Host Zones

Triple-filter screening identified **47 screened candidate host zones** in foothill valley plains and stable terraces with safe land headroom $\ge 50\%$, low multi-hazard risk $<0.55$, and low demographic vulnerability $<0.65$.
Over **4,390 regional source-host pairing corridors** within 150 km road transit distance were evaluated, providing verifiable resettlement options with zero displacement into hazardous zones.
