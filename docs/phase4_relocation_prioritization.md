# Phase 4 — Multi-Criteria Relocation Prioritization Report

**Project:** Sahayata (SIH26191)  
**Phase:** 4 — Multi-Criteria Relocation Prioritization  
**Status:** PASS WITH LIMITATIONS  
**Scope:** All 696 Administrative Mandals across 26 Districts of Andhra Pradesh  
**Date:** September 2026  

---

## 1. Executive Summary

Phase 4 establishes the **Multi-Criteria Relocation Prioritization Engine** for the Sahayata platform (SIH26191). The engine synthesizes:
1. **Multi-Hazard Exposure ($C_1$)** from Phase 2C,
2. **Demographic Sensitivity ($C_2$)** from Phase 2D (Census 2011 baseline),
3. **Physical Capacity Stress ($C_3$)** from Phase 3C, and
4. **Evacuation & Accessibility Constraint ($C_4$)** from Phase 3B/3C.

Using **Analytic Hierarchy Process (AHP)** on Saaty's 1–9 scale for objective criterion weighting and **Technique for Order Preference by Similarity to Ideal Solution (TOPSIS)** for relative closeness ranking, the system ranks all 696 mandals and decomposes every score into an itemized percentage factor contribution and deterministic textual explanation.

> [!IMPORTANT]
> **Decision Support Mandate:** The relocation prioritization engine ranks administrative areas for government assessment and disaster mitigation planning. The platform strictly does **NOT** issue automated relocation orders. All candidate host zones are screened planning options labeled `"CANDIDATE HOST ZONE — HUMAN REVIEW REQUIRED"`.

---

## 2. Input Datasets & Four Orthogonal Decision Criteria

To prevent artificial inflation or double-counting, each criterion captures an independent physical or demographic dimension:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               PHASE 4 ORTHOGONAL DECISION CRITERIA                                     │
├──────────┬─────────────────────────────┬───────────┬───────────────────────────────────────────────────┤
│ Criteria │ Indicator Name              │ Range     │ Methodological Formulation & Source               │
├──────────┼─────────────────────────────┼───────────┼───────────────────────────────────────────────────┤
│ C1       │ Hazard Exposure             │ [0.0, 1.0]│ Phase 2C Multi-Hazard Exposure Index (H_i)        │
│          │                             │           │ (Flood, Cyclone, Wind, Slope Instability)         │
├──────────┼─────────────────────────────┼───────────┼───────────────────────────────────────────────────┤
│ C2       │ Demographic Sensitivity     │ [0.0, 1.0]│ Phase 2D Contextual Demographic Sensitivity (D_i) │
│          │                             │           │ (Children 0–6, Female, SC, ST, Non-Workers)       │
├──────────┼─────────────────────────────┼───────────┼───────────────────────────────────────────────────┤
│ C3       │ Capacity Stress / Pressure  │ [0.0, 1.0]│ Phase 3C Continuous Limiting Deficits (S_i)       │
│          │                             │           │ Avg of (1 - Bed Adq), (1 - JJM Adq), (1 - Safe Ar)│
├──────────┼─────────────────────────────┼───────────┼───────────────────────────────────────────────────┤
│ C4       │ Accessibility Constraint    │ [0.0, 1.0]│ Phase 3B/3C Evacuation Constraint Proxy (E_i)     │
│          │                             │           │ (1.0 - OSM Road Network Accessibility Score)      │
└──────────┴─────────────────────────────┴───────────┴───────────────────────────────────────────────────┘
```

### 2.1 Double-Counting Avoidance Check
In Phase 2D, the Composite Vulnerability Index was formulated as $V_i = 0.60 D_i + 0.40 H_i$.  
If $H_i$ and $V_i$ were both included as criteria in TOPSIS, **hazard exposure would be double-counted**.  
Therefore, Phase 4 strictly uses $D_i$ (**Demographic Sensitivity Index**) as criterion $C_2$ and $H_i$ (**Multi-Hazard Exposure Index**) as criterion $C_1$, ensuring strict orthogonality between physical exposure and societal sensitivity.

### 2.2 Directionality Standardization
All criteria are oriented in a consistent **benefit (pressure) direction**:
$$\text{Higher Criterion Value} \implies \text{Higher Relocation Priority Pressure}$$

---

## 3. AHP Weight Derivation & Consistency Ratio

A pairwise comparison matrix was constructed using Saaty's 1–9 fundamental scale, reflecting empirical disaster risk priorities:
- Physical hazard exposure ($C_1$) is the dominant physical trigger.
- Capacity stress ($C_3$) and demographic sensitivity ($C_2$) dictate in-situ survival headroom and community vulnerability.
- Accessibility constraint ($C_4$) represents egress corridor bottlenecks.

### 3.1 Pairwise Comparison Matrix ($A$)

$$A = \begin{pmatrix}
1 & 2 & 2 & 3 \\
1/2 & 1 & 1 & 2 \\
1/2 & 1 & 1 & 2 \\
1/3 & 1/2 & 1/2 & 1
\end{pmatrix}$$

### 3.2 Derived Criterion Weights ($w$)
Using the geometric mean method:
- **$C_1$ (Hazard Exposure):** $w_1 = 0.4231$ (42.31%)
- **$C_2$ (Demographic Sensitivity):** $w_2 = 0.2274$ (22.74%)
- **$C_3$ (Capacity Stress):** $w_3 = 0.2274$ (22.74%)
- **$C_4$ (Accessibility Constraint):** $w_4 = 0.1221$ (12.21%)
- **Sum of Weights:** $\sum_{j=1}^4 w_j = 1.0000$ (100.00%)

### 3.3 AHP Consistency Verification
- **$\lambda_{\max}$:** $4.0104$
- **Consistency Index ($CI$):** $CI = \frac{\lambda_{\max} - n}{n - 1} = \frac{4.0104 - 4}{3} = 0.00345$
- **Random Index ($RI$ for $n=4$):** $0.90$
- **Consistency Ratio ($CR$):**
  $$CR = \frac{CI}{RI} = \frac{0.00345}{0.90} = 0.0038 \quad (0.38\% \ll 10.0\%)$$
- **Status:** **PASS** (Highly consistent; far below Saaty's 0.10 threshold).

---

## 4. TOPSIS Multi-Criteria Ranking Formulation

1. **Decision Matrix:** $X = [x_{ij}]_{680 \times 4}$ for all 680 populated administrative mandals.
2. **Vector Normalization:**
   $$r_{ij} = \frac{x_{ij}}{\sqrt{\sum_{k=1}^m x_{kj}^2}}$$
3. **Weighted Normalized Matrix:**
   $$v_{ij} = w_j \cdot r_{ij}$$
4. **Positive and Negative Ideal Solutions:**
   $$A^+ = (\max_i v_{i1}, \max_i v_{i2}, \max_i v_{i3}, \max_i v_{i4})$$
   $$A^- = (\min_i v_{i1}, \min_i v_{i2}, \min_i v_{i3}, \min_i v_{i4})$$
5. **Euclidean Separation Distances:**
   $$D_i^+ = \sqrt{\sum_{j=1}^4 (v_{ij} - v_j^+)^2}, \quad D_i^- = \sqrt{\sum_{j=1}^4 (v_{ij} - v_j^-)^2}$$
6. **Relative Closeness Coefficient (TOPSIS Relocation Priority Score):**
   $$CC_i = \frac{D_i^-}{D_i^+ + D_i^-} \in [0.0, 1.0]$$

---

## 5. Priority Categorization & Score Distribution

Priority bands are established using analytical distribution-based quantile thresholds across populated mandals:
- **`VERY HIGH` Priority ($\ge \text{P90} = 0.6082$):** 68 mandals (Top 10%)
- **`HIGH` Priority ($\text{P70} = 0.5271 \le CC_i < \text{P90}$):** 136 mandals (Next 20%)
- **`MODERATE` Priority ($\text{P30} = 0.3075 \le CC_i < \text{P70}$):** 272 mandals (Middle 40%)
- **`LOW` Priority ($CC_i < \text{P30}$):** 204 mandals (Bottom 30%)
- **`INSUFFICIENT-DATA`:** 16 features (unpopulated or zero-area polygons)

### Top 10 Prioritized Mandals in Andhra Pradesh:

| Rank | Mandal Name | District | TOPSIS Score | Priority Band | Primary Contributing Factor | Key Geographic Context |
|---|---|---|---|---|---|---|
| **1** | TADA | Tirupati | 0.8146 | VERY HIGH | Hazard Exposure (54.6%) | Coastal lagoon / tidal surge zone |
| **2** | NANDIVADA | Krishna | 0.7700 | VERY HIGH | Hazard Exposure (54.1%) | Kolleru Lake flood plain |
| **3** | THALLAREVU | Kakinada | 0.7649 | VERY HIGH | Hazard Exposure (50.5%) | Coastal delta / cyclone landfall |
| **4** | ELURU | Eluru | 0.7647 | VERY HIGH | Hazard Exposure (47.3%) | Severe riverine / lake inundation |
| **5** | MANDAVALLI | Eluru | 0.7623 | VERY HIGH | Hazard Exposure (54.3%) | Low-lying Kolleru basin |
| **6** | KAIKALUR | Eluru | 0.7511 | VERY HIGH | Hazard Exposure (51.5%) | Low-lying wetland periphery |
| **7** | KATRENIKONA | Dr. B.R. Ambedkar Konaseema | 0.7282 | VERY HIGH | Hazard Exposure (47.9%) | Godavari delta tip / storm surge |
| **8** | BHIMAVARAM | West Godavari | 0.7268 | VERY HIGH | Hazard Exposure (51.3%) | Deltaic canal network flood zone |
| **9** | KALIDINDI | Eluru | 0.7238 | VERY HIGH | Hazard Exposure (55.4%) | Coastal marsh / saline intrusion |
| **10** | NIDAMARRU | Eluru | 0.7123 | VERY HIGH | Hazard Exposure (55.6%) | Low-lying agricultural flood plain |

---

## 6. Factor Contribution Breakdown & Deterministic Explainability

For every mandal, the platform computes an exact itemized percentage contribution:
$$\text{weighted\_pressure}_{ij} = w_j \times x_{ij}$$
$$\text{contribution}_{ij} = \frac{\text{weighted\_pressure}_{ij}}{\sum_{k=1}^4 \text{weighted\_pressure}_{ik}} \times 100\%$$

Each mandal is assigned:
- `primary_priority_factor`
- `secondary_priority_factor`
- `priority_explanation`: Deterministic human-readable explanation generated without generative AI or stochastic LLMs.

---

## 7. Verified Deliverables

1. **Master Relocation Priority Dataset:**  
   [`data/processed/relocation/mandal_relocation_priority.csv`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/data/processed/relocation/mandal_relocation_priority.csv) (696 rows, 28 columns)
2. **Factor Contributions Dataset:**  
   [`data/processed/relocation/relocation_factor_contributions.csv`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/data/processed/relocation/relocation_factor_contributions.csv) (696 rows)
3. **AHP Weights Dataset:**  
   [`data/processed/relocation/ahp_weights.csv`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/data/processed/relocation/ahp_weights.csv) (4 criteria)
4. **TOPSIS Diagnostics Dataset:**  
   [`data/processed/relocation/topsis_diagnostics.csv`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/data/processed/relocation/topsis_diagnostics.csv) (696 rows)
5. **Summary Dataset:**  
   [`data/processed/relocation/relocation_priority_summary.csv`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/data/processed/relocation/relocation_priority_summary.csv)
6. **Enriched Spatial GeoJSON:**  
   [`data/processed/relocation/ap_mandal_relocation_priority.geojson`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/data/processed/relocation/ap_mandal_relocation_priority.geojson) (696 features)
7. **Pipeline Script:**  
   [`scripts/calculate_relocation_priority.py`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/scripts/calculate_relocation_priority.py)

---

## 8. Backend APIs & Verification

FastAPI endpoints served under `/api/relocation/...`:
- `GET /api/relocation/summary`
- `GET /api/relocation/mandals`
- `GET /api/relocation/mandal/{mandal_id}`
- `GET /api/relocation/top`
- `GET /api/relocation/factors`
- `GET /api/relocation/weights`
- `GET /api/relocation/geojson`
- `GET /api/relocation/mandal/{mandal_id}/host-zones`

**Test Results:**
- **64 / 64 backend pytest tests passed** in 7.04s (`test_relocation.py`, `test_capacity.py`, `test_vulnerability.py`, `test_hazard_exposure.py`, `test_demographics.py`, `test_gis.py`, `test_health.py`).
- **Frontend Build:** `npm run build` compiled cleanly in 631ms with **0 TypeScript errors**.

---

## 9. Governance & Methodological Limitations

1. **Mandal-Level Pilot Resolution:** The current analysis evaluates mandal-level aggregate geometries. Habitation-level micro-siting will be integrated in subsequent phases when village cadastral polygons are ingested.
2. **Census 2011 Baseline:** Demographic sensitivity is derived from Census 2011 Primary Census Abstract (the latest official decennial census data).
3. **Normative vs. Live Operational Data:** Health bed capacity reflects IPHS planning standards; road density is an evacuation accessibility proxy rather than real-time vehicle throughput.
4. **No Generative AI in Risk Scoring:** All scores and explanations are produced deterministically through mathematical AHP and TOPSIS formulations.
5. **No Automated Relocation Directives:** The system provides transparent decision support for district collectors and SDRF planning authorities.
