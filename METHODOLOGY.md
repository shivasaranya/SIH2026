# Methodology — Sahayata

## High-Level Analytical Pipeline

Sahayata implements an explainable multi-criteria decision-support workflow structured in sequential logical stages:

```
[ Hazard & Inundation Analysis ] (Phase 2B - Harmonization)
               │
               ▼
   [ Exposure Identification ] (Phase 2C - Mandal Zonal Synthesis)
               │
               ▼
[ Population Vulnerability Assessment ] (Phase 2D - Demographic Sensitivity & Exposure Intersection)
               │
               ▼
[ Physical Carrying Capacity Assessment ] (Phase 3)
               │
               ▼
  [ Relocation Priority Ranking ] (Phase 4)
               │
               ▼
 [ Explainable Decision Breakdown & Simulation ] (Phase 5)
```

> [!IMPORTANT]
> **Decision Support Mandate:** The methodology produces analytical evidence, ranking rationales, and factor contributions. It is strictly a **decision-support tool** for district collectors, disaster management commissioners, and planning authorities. The system does **not** automatically mandate, issue, or execute relocation orders.

---

## 1. Hazard & Exposure Modeling (Phase 2C)

In Phase 2C, quantitative zonal exposure is evaluated across all **696 mandals** in Andhra Pradesh using four empirical hazard dimensions:

### 1.1 Multi-Hazard Exposure Index ($H_i$)
The composite Multi-Hazard Exposure Index for mandal $i$ is bounded in $[0, 1]$:

$$H_i = w_{\text{flood}} E_{\text{flood}, i} + w_{\text{cyclone}} E_{\text{cyclone}, i} + w_{\text{wind}} E_{\text{wind}, i} + w_{\text{slope}} C_{\text{slope}, i}$$

Where weights are physically assigned based on state disaster profile:
- $w_{\text{flood}} = 0.40$ (Surface water occurrence/flood recurrence frequency)
- $w_{\text{cyclone}} = 0.30$ (Bay of Bengal cyclone track density within 50 km)
- $w_{\text{wind}} = 0.20$ (BIS IS 875 Basic Design Wind Speed tier)
- $w_{\text{slope}} = 0.10$ (Upland terrain instability proxy: slope $> 25^\circ$)
- $\sum w = 1.00 \implies H_i \in [0.0, 1.0]$.

### 1.2 Component Definitions & Normalization
1. **Flood Exposure Component ($E_{\text{flood}, i} \in [0, 1]$):**
   $$E_{\text{flood}, i} = 0.50 \times \left(\frac{R_{\text{mean}, i}}{100}\right) + 0.50 \times \left(\frac{P_{10, i}}{100}\right)$$
2. **Cyclone Exposure Component ($E_{\text{cyclone}, i} \in [0, 1]$):**
   $$E_{\text{cyclone}, i} = 0.60 \times \left(\frac{N_{\text{storms}, i}}{\max_j(N_{\text{storms}})}\right) + 0.40 \times \left(\frac{D_{\text{track}, i}}{\max_j(D_{\text{track}})}\right)$$
3. **Wind Hazard Component ($E_{\text{wind}, i} \in [0, 1]$):**
   $$E_{\text{wind}, i} = \frac{V_{b, i} - 44.0}{50.0 - 44.0}$$
4. **Topographic Slope Constraint ($C_{\text{slope}, i} \in [0, 1]$):**
   $$C_{\text{slope}, i} = \min\left(1.0, \frac{P_{\text{slope}>25, i}}{25.0}\right)$$

---

## 2. Population Vulnerability & Hazard Intersection (Phase 2D)

### 2.1 Demographic Sensitivity Index ($D_i \in [0, 1]$)
Demographic sensitivity evaluates contextual societal sensitivity using Census 2011 Primary Census Abstract (PCA) indicators:
$$D_i = 0.30 \times \text{child\_norm} + 0.25 \times \text{female\_norm} + 0.20 \times \text{sc\_norm} + 0.20 \times \text{st\_norm} + 0.05 \times \text{dep\_norm}$$
- All indicators are min-max normalized across populated mandals into $[0.0, 1.0]$.
- These weights are **baseline prototype weights**, not expert-derived or AHP-derived.
- Indicators represent contextual disaster-planning sensitivity; no group is claimed to be inherently vulnerable.

### 2.2 Exposure-Weighted Population ($EWP_i$)
$$EWP_i = \text{population\_total}_i \times H_i$$
- A planning metric reflecting modeled exposure-weighted population equivalents.
- **Not an actual disaster-affected population count.**

### 2.3 Combined Vulnerability Prioritization Index ($V_i \in [0, 1]$)
$$V_i = 0.60 \times D_i + 0.40 \times H_i$$
- Combines modeled demographic sensitivity ($D_i$) and physical hazard exposure ($H_i$).
- Strictly bounded within $[0.0, 1.0]$.

### 2.4 Priority Planning Quadrant Matrix
Partitioned by the statewide medians of populated mandals ($\tilde{H} = 0.3082, \tilde{D} = 0.3061$):
- **Q1 (Highest Planning Concern):** High Hazard ($H \ge \tilde{H}$) + High Demographic Sensitivity ($D \ge \tilde{D}$)
- **Q2 (Hazard-Driven Concern):** High Hazard ($H \ge \tilde{H}$) + Lower Demographic Sensitivity ($D < \tilde{D}$)
- **Q3 (Demographic Sensitivity Concern):** Lower Hazard ($H < \tilde{H}$) + Higher Demographic Sensitivity ($D \ge \tilde{D}$)
- **Q4 (Lower Modeled Concern):** Lower Hazard ($H < \tilde{H}$) + Lower Demographic Sensitivity ($D < \tilde{D}$)

---

## 3. Physical Carrying Capacity Assessment (Phase 3A Blueprint)

> [!CAUTION]
> **Scientific Validity of Carrying Capacity:**
> Sahayata strictly rejects simplistic, unphysical formulas such as dividing population by an arbitrary dimensionless carrying capacity index ($Population / CCI$). 
> Carrying capacity is evaluated using **four physically measurable dimensions with explicit units and verifiable limiting constraints**:

### 3.1 Dimension 1: Designated Shelter Capacity ($C_{\text{shelter}, i}$)
- **Direct Capacity:** Verified design capacity of Multi-Purpose Cyclone Shelters (MPCS) constructed under NCRMP Phase-I (300, 500, 1,000 persons per shelter).
- **Shelter Floor Area Proxy:** Covered classroom floor area in government primary/secondary schools (UDISE+) evaluated against the Sphere Humanitarian Standard ($\ge 3.5 \text{ m}^2 / \text{person}$).

### 3.2 Dimension 2: Evacuation Road Accessibility ($D_{\text{road}, i}$)
- **Network Density:** Total paved all-weather road network length divided by mandal geographical area ($km / km^2$) derived from OpenStreetMap highway vectors.
- **Classification:** Strictly labeled as an **Evacuation Accessibility & Redundancy Proxy**, not dynamic vehicle flow capacity (PCU/hr), as dynamic flow rates are unavailable in open static GIS.

### 3.3 Dimension 3: Critical Health & Water Infrastructure Adequacy
- **Normative Hospital Bed Capacity ($B_{\text{health}, i}$):** Total facility beds per 1,000 population derived from National Health Facility Registry (NHFR) tier classifications (PHC: 4–6 beds, CHC: 30 beds, SDH: 50–100 beds, DH: 100–500 beds) aligned with Indian Public Health Standards (IPHS 2022).
- **Water & Sanitation Coverage ($W_{\text{water}, i}$):** Functional Household Tap Connection (FHTC %) and 55 LPCD minimum humanitarian threshold from Jal Jeevan Mission (JJM) combined with Swachh Bharat Mission rural toilet coverage (%).

### 3.4 Dimension 4: Safe Habitable Land Area Headroom ($H_{\text{safe}, i}$)
- **Zonal Hazard Exclusion:** Exclusion of active flood zones (JRC GSW recurrence $R \ge 10\%$), steep unstable slopes ($> 25^\circ$), and low-lying coastal surge buffers.
- **Spatial Carrying Headroom:**
  $$A_{\text{safe}, i} = A_{\text{total}, i} - (A_{\text{flood}, R \ge 10\%, i} \cup A_{\text{slope} > 25^\circ, i} \cup A_{\text{surge}, i})$$
  $$H_{\text{safe}, i} = \frac{A_{\text{safe}, i}}{P_i} \quad (m^2 / \text{person})$$
- Evaluated against the Sphere Project emergency settlement standard ($\ge 45 \text{ m}^2 / \text{person}$).

### 3.5 Physical Bottleneck Engine (Phase 3C)
- **Limiting Resource Discovery:** Evaluates verified adequacy components per mandal and identifies the minimum adequacy component as the **Primary Bottleneck** and second minimum as the **Secondary Bottleneck**.
- **Missing-Data Exemption:** Components with unacquired or non-applicable data (e.g. inland cyclone shelter requirement) are excluded from the candidate sorting pool to prevent artificial penalties.

### 3.6 Candidate Host-Zone Screening (Phase 3C)
- **Multi-Constraint Safety Thresholds:** Screened host mandals must satisfy low hazard ($H_i < 0.30$), low vulnerability ($V_i < 0.35$), safe headroom ($\ge 85\%$, $\ge 500\text{ m}^2/\text{person}$), and data completeness ($\ge 80\%$).
- **Metric Planar Geodesic Distance:** Centroid-to-centroid distances are calculated in **India Albers Equal Area (EPSG:7755)** to avoid distortion across AP's 3 UTM zones.
- **Governance Mandate:** All candidate host zones are strictly labeled `"CANDIDATE HOST ZONE — HUMAN REVIEW REQUIRED"` for human disaster management planning.



---

## 4. Multi-Criteria Decision Analysis (MCDA) for Relocation Ranking (Phase 4)

### 4.1 Four Orthogonal Criteria Definition
1. **$C_1$: Hazard Exposure ($H_i \in [0, 1]$):** Direct multi-hazard exposure index.
2. **$C_2$: Demographic Sensitivity ($D_i \in [0, 1]$):** Contextual societal sensitivity from Census 2011 (preventing double-counting with $H_i$).
3. **$C_3$: Capacity Stress ($S_i \in [0, 1]$):** Continuous average of physical resource deficits (Health, Water/Sanitation, Safe Area, Shelter).
4. **$C_4$: Accessibility Constraint ($E_i \in [0, 1]$):** Inverted road density accessibility score ($1.0 - \text{road\_accessibility\_score}_i$).

### 4.2 AHP Criterion Weighting (Saaty 1–9 Fundamental Scale)
- **Pairwise Comparison Matrix ($A$):**
  $$A = \begin{pmatrix} 1 & 2 & 2 & 3 \\ 1/2 & 1 & 1 & 2 \\ 1/2 & 1 & 1 & 2 \\ 1/3 & 1/2 & 1/2 & 1 \end{pmatrix}$$
- **Derived Priority Weights:** $w = (0.4231, 0.2274, 0.2274, 0.1221)^T$ ($\sum w_j = 1.0000$)
- **Consistency Verification:** $\lambda_{\max} = 4.0104$, $CI = 0.00345$, $RI = 0.90 \implies CR = 0.0038 \ll 0.10$ (**PASS**).

### 4.3 TOPSIS Closeness Ranking
- **Normalized Matrix:** $r_{ij} = x_{ij} / \sqrt{\sum_k x_{kj}^2}$, $v_{ij} = w_j \cdot r_{ij}$
- **Ideal Solutions:** $A^+ = (\max_i v_{i1}, \dots, \max_i v_{i4})$, $A^- = (\min_i v_{i1}, \dots, \min_i v_{i4})$
- **Closeness Coefficient:** $CC_i = \frac{D_i^-}{D_i^+ + D_i^-} \in [0.0, 1.0]$

### 4.4 Factor Contribution Breakdown
- **Itemized Percentage Attribution:**
  $$\text{contribution}_{ij} = \frac{w_j \cdot x_{ij}}{\sum_{k=1}^4 w_k \cdot x_{ik}} \times 100\%$$
- Accompanied by deterministic explainability text without black-box generative AI models.

---

## 5. Scenario-Based What-If Disaster Simulation (Phase 5)

### 5.1 Sensitivity Transformations
- **Hazard Multiplier:** $H_{\text{scen}, i} = \text{clip}(H_{\text{base}, i} \cdot (1 + \Delta_{\text{haz}}), 0.0, 1.0)$
- **Demographic Invariance:** $D_{\text{scen}, i} = D_{\text{base}, i}$ (baseline societal vulnerability preserved)
- **Capacity Constraint Surge:** $C_{\text{scen}, i} = \text{clip}(C_{\text{base}, i} \cdot (1 + \Delta_{\text{cap}} + 0.5 \Delta_{\text{pop}}), 0.0, 1.0)$
- **Accessibility Degradation / Upgrades:** $E_{\text{scen}, i} = \text{clip}(E_{\text{base}, i} \cdot (1 - \Delta_{\text{acc}}), 0.0, 1.0)$

### 5.2 Comparative TOPSIS Engine
- Uses fixed baseline vector normalizers $\sqrt{\sum_k (x_{\text{base}, kj})^2}$ and ideal solutions $A_{\text{base}}^+, A_{\text{base}}^-$ to evaluate absolute displacement sensitivity across scenarios.
- Deterministic template explainability describes specific primary contributing pressures.

---

## 6. Decision & Action Planning Workflow (Phase 6)

### 6.1 Indicative Capacity Gap Benchmarking
- **Planning Population:** Fixed to Census 2011 Primary Census Abstract.
- **Health Beds (IPHS 2022):** $\text{Deficit}_{\text{health}} = \max(0, \text{Pop} \times 0.001 - \text{Beds}_{\text{baseline}})$.
- **Safe Habitable Land (Sphere Standard):** $\text{Deficit}_{\text{safe}} = \max(0, \frac{\text{Pop} \times 45\text{ m}^2}{10^6} - \text{Safe Area km}^2)$.
- **Preservation Policy:** Missing facility registers remain strictly `null` / `INSUFFICIENT_DATA` (never silently converted to zero).

### 6.2 Screened Candidate Host-Zone Pairing
- Evaluates 51 screened candidate host zones meeting multi-hazard thresholds ($H < 0.30$), safe land headroom ($\ge 85\%$), and data completeness ($\ge 80\%$) via planar geodesic distance in EPSG:7755 (India Albers Equal Area).

### 6.3 Deterministic 3-Horizon Action Synthesis
- Rule-based triggers map active physical bottlenecks and priority quantiles into:
  1. *Immediate / Emergency Preparedness (0–72 hrs)*
  2. *Short-Term Mitigation (1–6 Months)*
  3. *Long-Term Planning (1–3 Years)*
- Strictly decision-support; all outputs require human validation and administrative sanction from district disaster authorities.



