# Phase 5 — Explainable What-If Disaster Simulation Report

**Project:** Sahayata (SIH26191)  
**Phase:** 5 — Explainable What-If Disaster Simulation  
**Status:** PASS  
**Scope:** All 696 Administrative Mandals across 26 Districts of Andhra Pradesh  
**Date:** September 2026  

---

## 1. Executive Summary

Phase 5 introduces the **Near-Instant Scenario-Based What-If Disaster Simulation Module** for the Sahayata platform (SIH26191). The simulation engine allows disaster-management authorities to explore how hypothetical changes in hazard intensity, population displacement load, infrastructure capacity strain, and evacuation road accessibility would shift mandal-level relocation priorities across Andhra Pradesh.

> [!IMPORTANT]
> **Deterministic Sensitivity Engine (Not Forecasting):**  
> This module does **NOT** forecast future disaster events, does **NOT** run black-box generative AI models, and does **NOT** issue automated relocation orders. It performs near-instant deterministic algebraic recalculations using the approved Phase 4 **AHP + TOPSIS** formulation over precomputed baseline indicators.

---

## 2. Invariant Baseline & Scope

1. **Analytical Unit:** All 696 administrative mandals across 26 districts of Andhra Pradesh (680 populated units + 16 unpopulated/insufficient-data units).
2. **Untouched Baseline State:** The official Phase 4 master relocation dataset (`data/processed/relocation/mandal_relocation_priority.csv`) remains immutable and acts as the ground-truth reference state.
3. **Fixed AHP Criterion Weights:**
   - Multi-Hazard Exposure ($C_1$): $w_1 = 0.4231$ (42.31%)
   - Demographic Sensitivity ($C_2$): $w_2 = 0.2274$ (22.74%)
   - Capacity Stress ($C_3$): $w_3 = 0.2274$ (22.74%)
   - Evacuation Accessibility Constraint ($C_4$): $w_4 = 0.1221$ (12.21%)

---

## 3. Scenario Parameters & Strict Semantics

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               PHASE 5 WHAT-IF SCENARIO PARAMETERS                                      │
├──────────────────────────┬──────────────┬─────────┬────────────────────────────────────────────────────┤
│ Parameter Name           │ Range        │ Default │ Methodological Rationale & Physical Meaning        │
├──────────────────────────┼──────────────┼─────────┼────────────────────────────────────────────────────┤
│ Hazard Intensity Change  │ [-30%, +50%] │ 0.0%    │ Sensitivity multiplier applied to existing         │
│ (hazard_change)          │              │         │ multi-hazard exposure index (not a rainfall model) │
├──────────────────────────┼──────────────┼─────────┼────────────────────────────────────────────────────┤
│ Population Pressure      │ [-20%, +30%] │ 0.0%    │ Displaced population load multiplier modifying     │
│ (population_change)      │              │         │ capacity strain (not a population forecast)        │
├──────────────────────────┼──────────────┼─────────┼────────────────────────────────────────────────────┤
│ Capacity Stress Change   │ [-30%, +50%] │ 0.0%    │ Modifies health bed, shelter, and safe land        │
│ (capacity_change)        │              │         │ deficit severity (not live occupancy tracking)     │
├──────────────────────────┼──────────────┼─────────┼────────────────────────────────────────────────────┤
│ Evacuation Accessibility │ [-50%, +50%] │ 0.0%    │ Egress corridor multiplier: negative values        │
│ (accessibility_change)   │              │         │ increase constraint; positive values reduce it     │
└──────────────────────────┴──────────────┴─────────┴────────────────────────────────────────────────────┘
```

---

## 4. Mathematical Transformation & TOPSIS Engine

### 4.1 Criterion Transformations

For each populated mandal $i \in \{1, \dots, 680\}$:

1. **Hazard Exposure ($C_1$):**
   $$H_{\text{scen}, i} = \text{clip}\Big(H_{\text{base}, i} \times (1 + \Delta_{\text{hazard}}),\, 0.0,\, 1.0\Big)$$

2. **Demographic Sensitivity ($C_2$):**
   $$D_{\text{scen}, i} = D_{\text{base}, i}$$
   *(Demographic composition such as children, female, SC, and ST shares remains stable during immediate disaster scenarios to prevent double-counting).*

3. **Capacity Stress ($C_3$):**
   $$C_{\text{scen}, i} = \text{clip}\Big(C_{\text{base}, i} \times (1 + \Delta_{\text{capacity}} + 0.5 \times \Delta_{\text{pop}}),\, 0.0,\, 1.0\Big)$$

4. **Evacuation Accessibility Constraint ($C_4$):**
   $$E_{\text{scen}, i} = \text{clip}\Big(E_{\text{base}, i} \times (1 - \Delta_{\text{access}}),\, 0.0,\, 1.0\Big)$$
   *(Negative accessibility change, e.g. road washouts, scales up the egress constraint).*

### 4.2 Comparative TOPSIS Formulation
To ensure mathematical consistency across scenario comparisons, scenario decision vectors $X_{\text{scen}}$ are evaluated using the fixed baseline vector norm denominator and ideal boundaries:
$$r_{\text{scen}, ij} = \frac{x_{\text{scen}, ij}}{\sqrt{\sum_{k=1}^{680} (x_{\text{base}, kj})^2}}$$
$$v_{\text{scen}, ij} = w_j \cdot r_{\text{scen}, ij}$$
$$D_{\text{scen}, i}^+ = \sqrt{\sum_{j=1}^4 (v_{\text{scen}, ij} - A_{\text{base}, j}^+)^2}, \quad D_{\text{scen}, i}^- = \sqrt{\sum_{j=1}^4 (v_{\text{scen}, ij} - A_{\text{base}, j}^-)^2}$$
$$CC_{\text{scen}, i} = \frac{D_{\text{scen}, i}^-}{D_{\text{scen}, i}^+ + D_{\text{scen}, i}^-} \in [0.0, 1.0]$$

---

## 5. Scenario Presets

1. **Baseline Planning State:** $\Delta = [0\%, 0\%, 0\%, 0\%]$ (reproduces official Phase 4 baseline).
2. **Severe Hazard Intensification:** $\Delta_{\text{haz}} = +30\%$, $\Delta_{\text{pop}} = +10\%$, $\Delta_{\text{cap}} = +10\%$, $\Delta_{\text{acc}} = -10\%$.
3. **Compound Extreme Disaster Stress:** $\Delta_{\text{haz}} = +50\%$, $\Delta_{\text{pop}} = +20\%$, $\Delta_{\text{cap}} = +30\%$, $\Delta_{\text{acc}} = -30\%$.
4. **Enhanced Mitigation & Upgraded Access:** $\Delta_{\text{haz}} = 0\%$, $\Delta_{\text{pop}} = 0\%$, $\Delta_{\text{cap}} = -30\%$, $\Delta_{\text{acc}} = +30\%$.

---

## 6. Deterministic Factor Contributions & Explainability

For every simulated mandal, percentage decision factor pressure is calculated as:
$$\text{weighted\_pressure}_{\text{scen}, ij} = w_j \cdot x_{\text{scen}, ij}$$
$$\text{contribution}_{\text{scen}, ij} = \frac{\text{weighted\_pressure}_{\text{scen}, ij}}{\sum_{k=1}^4 \text{weighted\_pressure}_{\text{scen}, ik}} \times 100\%$$

Each mandal generates an auditable, deterministic textual explanation without stochastic generative AI.

---

## 7. Example Scenario Stress-Test Results

**Scenario Parameters:** $\Delta_{\text{haz}} = +30\%$, $\Delta_{\text{pop}} = +10\%$, $\Delta_{\text{cap}} = +20\%$, $\Delta_{\text{acc}} = -30\%$

- **Mean Baseline Priority Score:** $0.4244$
- **Mean Simulated Priority Score:** $0.5382$ ($+0.1138$ net shift)
- **Mandals Priority Increased ($\Delta > +0.02$):** $678$ mandals
- **Mandals Priority Decreased ($\Delta < -0.02$):** $1$ mandal
- **Mandals in VERY HIGH Priority Band:** $68 \rightarrow 342$ mandals
- **Top 5 Priority Gainers:**
  1. `GUMMALAKSHMIPURAM` (Parvathipuram Manyam): $+0.198$ (Rank #18 $\to$ #1)
  2. `SALUR` (Parvathipuram Manyam): $+0.180$ (Rank #47 $\to$ #12)
  3. `PADERU` (Alluri Sitharama Raju): $+0.179$ (Rank #56 $\to$ #25)
  4. `MUNCHINGIPUTTU` (Alluri Sitharama Raju): $+0.178$ (Rank #53 $\to$ #20)
  5. `PACHIPENTA` (Parvathipuram Manyam): $+0.177$ (Rank #51 $\to$ #18)

---

## 8. Backend & Frontend Deliverables

1. **Pydantic Schemas:** [`backend/app/simulation/schemas.py`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/backend/app/simulation/schemas.py)
2. **Simulation Service:** [`backend/app/services/simulation_service.py`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/backend/app/services/simulation_service.py)
3. **API Endpoints:** [`backend/app/api/simulation.py`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/backend/app/api/simulation.py)
   - `POST /api/simulation/run`
   - `GET /api/simulation/presets`
   - `GET /api/simulation/mandal/{mandal_id}`
4. **Backend Test Suite:** [`backend/tests/test_simulation.py`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/backend/tests/test_simulation.py) (10 tests; full suite 74 tests passing).
5. **Interactive UI Component:** [`frontend/src/components/dashboard/SimulationPanel.tsx`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/frontend/src/components/dashboard/SimulationPanel.tsx)
6. **Mandal Detail Comparison:** [`frontend/src/components/dashboard/MandalDetailPanel.tsx`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/frontend/src/components/dashboard/MandalDetailPanel.tsx)
7. **Map Integration & Controls:** [`frontend/src/pages/GISPage.tsx`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/frontend/src/pages/GISPage.tsx), [`MapControls.tsx`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/frontend/src/components/map/MapControls.tsx), [`MapLegend.tsx`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/frontend/src/components/map/MapLegend.tsx)

---

## 9. Governance & Safety Notice

- **Planning Sensitivity Only:** Outputs reflect mathematical sensitivity over precomputed baseline indicators.
- **No Automated Relocation Orders:** The system strictly provides decision support for disaster authorities and never instructs citizens or orders relocations.
