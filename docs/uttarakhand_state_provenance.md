# RakshaSethu: Uttarakhand (UK) Master State Data Provenance & Methodology

## 1. Executive Summary & Administrative Structure
- **State**: Uttarakhand (State Code: `UK`, State ID: `uttarakhand`)
- **SDMA Authority**: Uttarakhand State Disaster Management Authority (USDMA), Disaster Mitigation & Management Centre (DMMC), Department of Disaster Management, Government of Uttarakhand
- **Administrative Breakdown**:
  - **13 Administrative Districts** (Survey of India / Census / Revenue standard): Almora, Bageshwar, Chamoli, Champawat, Dehradun, Haridwar, Nainital, Pauri Garhwal, Pithoragarh, Rudraprayag, Tehri Garhwal, Udham Singh Nagar, Uttarkashi.
  - **127 Tehsils (Sub-districts)** (Complete statewide coverage, zero dropped or excluded administrative units).
- **Baseline Population**: Exactly **10,086,292** (Census 2011 Primary Census Abstract aggregate across all 13 districts: 5,137,773 male, 4,948,519 female, 2,056,975 households).
- **Demographic Sub-cohorts**:
  - Children (0–6 years): 1,366,108 (13.54%)
  - Scheduled Castes (SC): 1,892,516 (18.76%)
  - Scheduled Tribes (ST): 291,906 (2.89%)
  - Total Workers: 3,872,275 (38.39%)
  - Non-Workers: 6,214,017 (61.61%)
- **Topography & Hazard Characterization**:
  - **Higher Himalayan & Trans-Himalayan Glacial Belt** (Uttarkashi, Chamoli, Pithoragarh, Rudraprayag): High alpine elevation (3,000–7,800 m AMSL), active glaciers, moraine-dammed proglacial lakes vulnerable to Glacial Lake Outburst Floods (GLOF), heavy snow avalanches, severe freeze-thaw weathering, and steep river gorges (Bhagirathi, Alaknanda, Mandakini, Kali/Sharda). Heavy landslide susceptibility with high-relief slope fractions ($>25^\circ$).
  - **Lesser Himalayas & Shivalik Ranges** (Tehri Garhwal, Pauri Garhwal, Almora, Bageshwar, Champawat, Nainital, Dehradun hills): Deeply dissected hills, seismically active thrust fault zones (Main Central Thrust - MCT, Main Boundary Thrust - MBT, Himalayan Frontal Thrust - HFT), acute monsoon cloudburst and debris-flow hazards, riverbank toe-erosion, and seismic Zone IV/V vulnerability.
  - **Foothill Bhabhar, Dun Valleys & Tarai Plain** (Haridwar, Udham Singh Nagar, Southern Dehradun/Rishikesh/Roorkee/Kashipur/Rudrapur): Low-relief alluvial plains ($200\text{--}500\text{ m}$ AMSL) with high safe habitable land headroom ($\ge 75\%$), providing prime reception capacity for planned community relocation and regional logistics staging.

---

## 2. Data Sources & Scientific Lineage

| Data Layer | Primary Authority / Source | Resolution / Format | Notes & Calibration |
| :--- | :--- | :--- | :--- |
| **Administrative Boundaries** | Survey of India / DataMeet / Census ADM2 & ADM3 | Vector GeoJSON (`EPSG:4326`) | Exactly 13 Districts and 127 Tehsils with clean topological boundaries and verified centroid coordinates. |
| **Demographics (PCA)** | Office of the Registrar General & Census Commissioner, India (Census 2011) | Tehsil aggregates (CSV) | Exactly 10,086,292 population across all 127 tehsils. Includes dual column aliases (`tehsil_id`/`mandal_id`, `children_0_6`/`population_0_6`, `households`, `workers`). |
| **Coastal Storm Surge** | INCOIS / IMD Cyclone eAtlas | Hard-coded $0.000\text{ m}$ | **Formally 0.000 m (NOT APPLICABLE - INLAND HIMALAYAN)**. Fully documented to prevent synthetic coastal distortion in mountainous states. |
| **Glacial Lake Outburst & Flash Floods** | CWC, NRSC/ISRO Bhuvan, Wadia Institute of Himalayan Geology (WIHG) & USDMA | High-resolution riverine and glacial lake basin data | Calibrated for Bhagirathi, Alaknanda, Mandakini, Pindar, Dhauliganga, Kali, and Yamuna headwaters. |
| **Landslide Susceptibility & Slope Constraints** | Geological Survey of India (GSI) & NASA SRTM 90m DEM | 90m Digital Elevation Model | Slope angle ($>25^\circ$ steep-relief fraction), mean elevation (m), and safe unconstrained habitable land fraction ($<15^\circ$ slope, non-hazard). |
| **Wind Hazard Exposure** | Bureau of Indian Standards (BIS IS 875 Part 3: 2015) | District design basic wind speed ($V_b$) | Basic wind speeds $39\text{ m/s}$ (inner valleys) to $47\text{ m/s}$ (exposed mountain crests and southern plains). |
| **Shelter Infrastructure** | USDMA / Disaster Mitigation & Management Centre (DMMC) | Tehsil shelter capacity & shortfall | Permanent disaster relief centers, GMVN/KMVN tourist lodges, school-cum-evacuation shelters, and government colleges. |
| **Health Infrastructure** | Indian Public Health Standards (IPHS 2022) / NHM Uttarakhand | Normative public health beds | Calibrated to 1.0 bed per 1,000 population across District Hospitals, Sub-Divisional Hospitals, CHCs, and PHCs. |
| **Water & Sanitation** | Jal Jeevan Mission (JJM Uttarakhand) & SBM-G | Percentage coverage | Rural piped gravity water supply and household sanitation access percentages. |
| **Evacuation Corridors** | OpenStreetMap (OSM) / MoRTH / Uttarakhand PWD & PMGSY (URRDA) | Road length & density ($\text{km}/\text{km}^2$) | All-weather Char Dham all-weather highway corridors, NH-58, NH-108, NH-109, and PMGSY hill feeder roads. |

---

## 3. Four-Criteria Decision Matrix Formulation

RakshaSethu formulates relocation prioritization using an orthogonal multi-criteria decision framework across four criteria:

$$X = \begin{bmatrix} C_1 & C_2 & C_3 & C_4 \end{bmatrix}$$

### C1: Multi-Hazard Physical Exposure ($C_1 \in [0, 1]$)
- **Coastal Storm Surge Index**: Strictly $0.000$ (inland state flag active).
- **Riverine Flood & GLOF Inundation Index**: Derived from high-slope channel runoffs, GLOF trajectory, and historical flash-flood markers (Kedarnath 2013, Chamoli 2021, Uttarkashi 2012).
- **Landslide & Slope Instability Index**: Derived from GSI national landslide susceptibility mapping and slope steepness ($>25^\circ$).
- **Extreme Wind Hazard Index**: Derived from BIS IS 875 basic wind speed ($39\text{--}47\text{ m/s}$).

### C2: Demographic Sensitivity Index ($C_2 \in [0, 1]$)
- Computed from Census 2011 Primary Census Abstract:
  $$D_i = 0.50 \cdot \text{Child}_{0-6, \text{norm}} + 0.30 \cdot \text{NonWorker}_{\text{norm}} + 0.20 \cdot \text{HHSize}_{\text{norm}}$$
- Universal Indian humanitarian standard without synthetic caste penalties or artificial scoring bias.

### C3: Physical Carrying Capacity Stress ($C_3 \in [0, 1]$)
- Quantifies localized deficits across essential humanitarian life-support infrastructure in difficult mountain terrain:
  $$C_3 = 0.35 \cdot \text{ShelterDeficit} + 0.25 \cdot \text{HealthBedDeficit} + 0.20 \cdot \text{WaterDeficit} + 0.20 \cdot \text{SafeLandDeficit}$$

### C4: Accessibility & Evacuation Corridor Constraint ($C_4 \in [0, 1]$)
- Inverse normalized road network density in mountainous corridors subject to road cut-offs and bridge washouts:
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

All 127 Tehsils are prioritized in an unbroken ranking from 1 to 127:
- **VERY HIGH (Top 10% ~ 13 Tehsils)**: Extreme high-relief mountain valleys subject to combined GLOF, landslide blockages, and acute winter cut-offs (e.g., Joshimath, Bhatwari, Ukhimath, Dharchula, Munsyari, Karnaprayag, Chamoli, Dunda, Barkot, Munikireti, Thalisain).
- **HIGH (Next 20% ~ 25 Tehsils)**: Steep middle-Himalayan tehsils with severe seasonal debris flows and infrastructure stress.
- **MODERATE (Next 40% ~ 51 Tehsils)**: Intermontane valleys, transitional slopes, and foothill ridges.
- **LOW (Bottom 30% ~ 38 Tehsils)**: Alluvial plains, stable duns, and reception destinations with high safe land headroom.

---

## 6. Candidate Planning Host Zone Screening

Safer host zones are screened via strict triple-filter criteria:
1. **Low Hazard Exposure**: $C_1 < 0.38$
2. **Low Composite Vulnerability**: $V_i < 0.42$
3. **High Safe Habitable Land Headroom**: $\ge 75\%$ unconstrained habitable land area ($<15^\circ$ slope, non-hazard terrain).

In Uttarakhand, **29 Tehsils** qualified as Candidate Planning Host Zones (located primarily in the broad valleys, Tarai, and Bhabhar plains of Haridwar, Udham Singh Nagar, and lower Dehradun/Nainital, including Roorkee, Bhagwanpur, Laksar, Haridwar, Kashipur, Rudrapur, Kichha, Sitarganj, Khatima, Bajpur, Gadarpur, Jaspur, and Rishikesh plains). **326 safe destination pairings** were generated connecting vulnerable high-hazard tehsils to safer host destinations within a $160\text{ km}$ transit corridor buffer.
