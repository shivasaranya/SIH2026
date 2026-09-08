# RakshaSethu: Odisha (OD) Master State Data Provenance & Methodology

## 1. Executive Summary & Administrative Structure
- **State**: Odisha (State Code: `OD`)
- **SDMA Authority**: Odisha State Disaster Management Authority (OSDMA)
- **Administrative Breakdown**:
  - **30 Administrative Districts** (Survey of India / DataMeet standard)
  - **475 Community Development (C.D.) Blocks / Tehsils**
- **Baseline Population**: **41,967,909** (~41.97 million, Census 2011 Primary Census Abstract aggregate)
- **Topography & Hazard Characterization**:
  - **Coastal Cyclone & Tidal Surge Belt** (Baleshwar, Bhadrak, Kendrapara, Jagatsinghpur, Puri, Ganjam): Highly vulnerable to severe Bay of Bengal tropical cyclones, catastrophic storm surges ($2.8\text{--}5.8\text{ m}$ peak depths), extreme gale wind speeds ($50\text{--}55\text{ m/s}$), and sea water ingress (e.g. Basudebpur, Chandbali, Rajnagar, Mahakalapada, Kujang, Ersama, Krushnaprasad, Astaranga).
  - **Mahanadi & Brahmani Riverine Floodplains** (Cuttack, Jajpur, Kendrapara, Jagatsinghpur, Puri, Khordha): Subject to recurrent major floods and drainage congestion during monsoon discharges from Hirakud and Rengali dams.
  - **Eastern Ghats & Upland Tribal Belts** (Koraput, Rayagada, Malkangiri, Kandhamal, Gajapati, Mayurbhanj, Sundargarh): High slope terrain with steep gradient runoff, flash floods, and localized landslides during depressions.
  - **Central & Western Tablelands** (Sambalpur, Bargarh, Balangir, Jharsuguda, Nuapada, Dhenkanal, Angul): Undulating plateau terrain providing high safe habitable land headroom and candidate host zone capacity.

---

## 2. Data Sources & Scientific Lineage

| Data Layer | Primary Authority / Source | Resolution / Format | Notes & Calibration |
| :--- | :--- | :--- | :--- |
| **Administrative Boundaries** | DataMeet Community / Survey of India (ADM2 & ADM3) | Vector GeoJSON (`EPSG:4326`, projected in `EPSG:7755`) | 30 Districts and 475 C.D. Blocks with topological boundary alignment. |
| **Demographics (PCA)** | Office of the Registrar General & Census Commissioner, India (Census 2011) | C.D. Block aggregates (CSV) | 41.97M total population, gender ratios, 0-6 child cohorts, SC/ST populations, household sizes, non-worker ratios. |
| **Storm Surge & Cyclone Inundation** | IMD Cyclone eAtlas / INCOIS Coastal Inundation Models & OSDMA Historical Surges | Coastal block surge depth ($2.8\text{--}5.8\text{ m}$) | Active for 6 coastal belt districts; calibrated to historical super cyclones and severe storms (1999 Super Cyclone, Phailin, Fani, Hudhud, Yaas). Formally $0.000\text{ m}$ for inland blocks. |
| **Riverine Flood Recurrence** | European Commission Joint Research Centre (JRC) Global Surface Water (30m) & OSDMA Flood Atlas | 30m Grid Surface Water Recurrence (1984–2021) | Calibrated for Mahanadi, Brahmani, Baitarani, Subarnarekha, and Rushikulya deltaic floodplains. |
| **Wind Hazard Exposure** | Bureau of Indian Standards (BIS IS 875 Part 3: 2015) | District-level design basic wind speed ($V_b$) | Basic wind speeds $47\text{--}55\text{ m/s}$ (Very High Hazard: Coastal belt $V_b = 50\text{--}55\text{ m/s}$). |
| **Elevation & Slope Constraints** | NASA Shuttle Radar Topography Mission (SRTM 90m DEM) | 90m Digital Elevation Model | Mean elevation (m), slope (deg), and area with slope $>25^\circ$ (Eastern Ghats blocks). |
| **Shelter Infrastructure** | OSDMA Multipurpose Cyclone Shelters (MCS) & NCRMP Phase I/II Network | Direct & normative capacity | Multipurpose cyclone and flood shelters constructed under NCRMP and state disaster funds. |
| **Health Infrastructure** | Indian Public Health Standards (IPHS 2022) | Normative rural capacity | 1.0 bed per 1,000 population across DHHs, SDHs, CHCs, and PHCs. |
| **Water & Sanitation** | Jal Jeevan Mission (JJM) & Swachh Bharat Mission (SBM-G) | Percentage coverage | Rural piped drinking water access and functional household latrine coverage. |
| **Evacuation Corridors** | OpenStreetMap (OSM) / Odisha Works Dept & PMGSY | Road length & density ($\text{km}/\text{km}^2$) | NH/SH evacuation corridors and rural pucca road density. |

---

## 3. Four-Criteria Decision Matrix Formulation

RakshaSethu formulates relocation prioritization using an orthogonal multi-criteria decision framework across four criteria:

$$X = \begin{bmatrix} C_1 & C_2 & C_3 & C_4 \end{bmatrix}$$

### C1: Multi-Hazard Physical Exposure ($C_1 \in [0, 1]$)
- **Coastal Storm Surge Index**: Calibrated for coastal delta blocks using peak surge depths ($2.8\text{--}5.8\text{ m}$) normalized against severe storm surge benchmarks.
- **Riverine Flood Recurrence Index**: JRC 30m permanent and seasonal water recurrence + OSDMA flood recurrence maps.
- **Extreme Storm Wind Index**: Normalized from BIS IS 875 basic wind speed ($47\text{--}55\text{ m/s}$).
- **Steep Slope / Landslide Constraint Index**: Fraction of block area with slope $>25^\circ$ (Eastern Ghats).

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

All 475 C.D. blocks are categorized via quantile priority thresholds:
- **VERY HIGH (Top 10% ~ 48 Blocks)**: Urgent structural interventions, multi-purpose cyclone shelter expansion, reinforced saline embankments, pre-positioned NDRF/ODRAF units, and staged relocation planning (e.g. Basudebpur, Chandbali, Rajnagar, Mahakalapada, Kujang, Ersama, Krushnaprasad, Astaranga).
- **HIGH (Next 20% ~ 95 Blocks)**: Embankment strengthening, saline water barriers, elevated community health centers, all-weather bridge connectivity.
- **MODERATE (Next 40% ~ 190 Blocks)**: Community disaster volunteer training (Aapda Mitra), early-warning siren integration, local water supply hardening.
- **LOW (Bottom 30% ~ 142 Blocks)**: Regular monitoring, infrastructure maintenance, and candidate host zone reception planning.

---

## 6. Candidate Planning Host Zone Screening

Safer host zones are screened via strict triple-filter criteria:
1. **Low Hazard Exposure**: $C_1 < 0.38$
2. **Low Composite Vulnerability**: $V_i < 0.42$
3. **High Safe Habitable Land Headroom**: $\ge 75\%$ unconstrained habitable land area ($<25^\circ$ slope, non-wetland).

In Odisha, **153 C.D. Blocks** qualified as Candidate Planning Host Zones (located primarily in stable upland districts such as Sambalpur, Bargarh, Balangir, Jharsuguda, Nuapada, Dhenkanal, Angul, Deogarh, and Sundargarh). **1,781 safe destination pairings** were generated connecting vulnerable coastal/riverine blocks to safer inland destinations within a $150\text{ km}$ corridor buffer.
