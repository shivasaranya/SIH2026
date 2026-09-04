# Phase 6 — Decision & Action Planning Report

**Project:** Sahayata (SIH26191)  
**Phase:** 6 — Decision & Action Planning  
**Status:** PASS  
**Pilot Region:** Andhra Pradesh (696 Administrative Mandals)  
**Date:** September 2026  

---

## 1. Executive Summary

Phase 6 implements the **Decision & Action Planning Module** for Sahayata (SIH26191). It operationalizes the multi-hazard risk (Phase 2C), demographic vulnerability (Phase 2D), physical carrying capacity (Phase 3A–3C), multi-criteria relocation ranking (Phase 4), and what-if simulation (Phase 5) analytical layers into an actionable, transparent decision-support framework for disaster-management authorities.

> [!IMPORTANT]
> **Human-in-the-Loop Governance Notice:**  
> Sahayata is an AI-assisted decision-support platform. The system does **NOT** issue automated relocation orders, does **NOT** direct citizens to relocate, and does **NOT** mandate evacuation destinations. All host zone candidates and action plans are provided for **human review, feasibility verification, and administrative sanction**.

---

## 2. Pre-Implementation Audit & Reused Datasets

Phase 6 strictly preserves and reuses all precomputed, approved datasets:
- **Administrative Layer:** 696 mandal geometries and EPSG:7755 centroids across 26 districts of Andhra Pradesh.
- **Relocation Priority Ranking (Phase 4):** AHP weights ($w = [0.4231, 0.2274, 0.2274, 0.1221]$) and TOPSIS Closeness Scores ($CC_i \in [0.0, 1.0]$) preserved exactly across all 680 populated mandals.
- **Physical Carrying Capacity (Phase 3C):** 51 screened candidate host zones with safe land headroom $\ge 85\%$, safe area $\ge 500\text{ m}^2/\text{person}$, low hazard ($H_i < 0.30$), and data completeness $\ge 80\%$.
- **What-If Simulation (Phase 5):** Dynamic sensitivity transformations and comparative TOPSIS recalculation.

---

## 3. Indicative Capacity Gap Methodology

To provide concrete physical planning metrics without fabricating population displacement claims, the capacity gap engine computes normative planning benchmarks:

1. **Planning Population:** Fixed to Census 2011 Primary Census Abstract.
2. **Health Bed Gap (IPHS 2022 Standard):**
   $$\text{Bed Target} = \text{Population} \times \frac{1.0\text{ bed}}{1,000\text{ persons}}$$
   $$\text{Health Deficit} = \max\Big(0,\, \text{Bed Target} - \text{Baseline Beds}\Big)$$
3. **Safe Habitable Land Gap (Sphere Project Minimum Standard):**
   $$\text{Safe Land Target (km}^2\text{)} = \frac{\text{Population} \times 45\text{ m}^2/\text{person}}{1,000,000}$$
   $$\text{Safe Land Deficit} = \max\Big(0,\, \text{Safe Land Target} - \text{Safe Area (km}^2\text{)}\Big)$$
4. **Designated Cyclone Shelters:** Evaluates designated NCRMP shelters for coastal mandals; non-coastal mandals are explicitly marked `NON_APPLICABLE_OR_INSUFFICIENT_DATA` without converting missing values to zero.
5. **Water/Sanitation & Road Access:** Identifies critical utility deficits when coverage falls below $70\%$ (JJM/SBM-G) or road density falls below $50\%$.

---

## 4. Candidate Host-Zone Screening & Comparison

Candidate host zones are retrieved directly from the screened Phase 3C spatial index (2,088 screened pairs linking source mandals to 51 safe host zones within regional radius):
- **Distance Metric:** Geodesic planar distance computed in **EPSG:7755 (India Albers Equal Area)**.
- **Side-by-Side Comparison Engine:**
  - **Key Advantages:** Hazard reduction ($\Delta H > 0.15$), safe habitable land fraction ($\ge 85\%$), road accessibility, and proximity ($\le 60\text{ km}$).
  - **Key Concerns & Bottlenecks:** Identifies whether the candidate host itself faces water or health capacity constraints requiring secondary facility expansion.
  - **Data Limitations:** Highlights unverified inland shelter inventories or missing utility data requiring ground validation.

---

## 5. Deterministic 3-Horizon Action Planning

Action plans are generated deterministically using rule-based triggers mapped to active physical bottlenecks and hazard exposure:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              3-HORIZON DETERMINISTIC ACTION PLANNING                                   │
├──────────────────────────────────┬──────────────────────┬──────────────────────────────────────────────┤
│ Horizon                          │ Trigger Condition    │ Deterministic Action Recommendation          │
├──────────────────────────────────┼──────────────────────┼──────────────────────────────────────────────┤
│ 1. Immediate Emergency           │ Access > 0.30        │ Audit alternate egress corridors & chokepoint│
│    Preparedness (0–72 hrs)       │ Hazard > 0.40        │ Pre-monsoon multipurpose shelter check       │
│                                  │ Demography > 0.35    │ Priority evacuation roster (vulnerable cohort│
├──────────────────────────────────┼──────────────────────┼──────────────────────────────────────────────┤
│ 2. Short-Term Mitigation         │ Health Bottleneck    │ Pre-position mobile medical units & drugs    │
│    (1–6 Months)                  │ Shelter Bottleneck   │ Retrofit concrete public schools as shelters │
│                                  │ Water Bottleneck     │ Deploy emergency mobile RO water units       │
│                                  │ Road Access High     │ Elevate flood-prone road causeways           │
├──────────────────────────────────┼──────────────────────┼──────────────────────────────────────────────┤
│ 3. Long-Term Planning            │ Priority: VERY HIGH  │ Joint Revenue & GIS host land micro-siting   │
│    (1–3 Years)                   │ Priority: HIGH       │ Community consultation & livelihood study    │
│                                  │ Priority: MOD/LOW    │ In-situ storm drainage & coastal greenbelts  │
└──────────────────────────────────┴──────────────────────┴──────────────────────────────────────────────┘
```

---

## 6. Backend & Frontend Deliverables

1. **Pydantic Schemas:** [`backend/app/decision/schemas.py`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/backend/app/decision/schemas.py)
2. **Decision Service:** [`backend/app/services/decision_service.py`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/backend/app/services/decision_service.py)
3. **FastAPI Router:** [`backend/app/api/decision.py`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/backend/app/api/decision.py)
   - `GET /api/decision/summary`
   - `GET /api/decision/mandal/{mandal_id}/capacity-gap`
   - `GET /api/decision/mandal/{mandal_id}/action-plan`
   - `GET /api/decision/mandal/{mandal_id}/compare/{host_id}`
4. **Unit Tests:** [`backend/tests/test_decision.py`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/backend/tests/test_decision.py) (6 tests; full backend suite 80/80 passed).
5. **TypeScript Types:** [`frontend/src/types/decision.ts`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/frontend/src/types/decision.ts)
6. **API Client:** [`frontend/src/services/api.ts`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/frontend/src/services/api.ts)
7. **Host Comparison Modal:** [`frontend/src/components/dashboard/HostComparisonModal.tsx`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/frontend/src/components/dashboard/HostComparisonModal.tsx)
8. **Mandal Detail Panel:** [`frontend/src/components/dashboard/MandalDetailPanel.tsx`](file:///c:/Users/Lalitha/OneDrive/Desktop/sahayata/frontend/src/components/dashboard/MandalDetailPanel.tsx)

---

## 7. Verification Results

- **Backend Pytest Suite:** **80 / 80 tests passed** in 8.90s with 0 regressions across all phases.
- **Frontend Production Build:** `npm run build` compiled in 748ms with **0 TypeScript errors**.

---

## 8. Governance & Limitations

- **Indicative Planning Estimates:** Gaps reflect normative benchmarking (IPHS 2022 / Sphere Project) over Census 2011 baseline data.
- **No Automated Relocation Directives:** All candidate host zones and action items require administrative validation by the District Disaster Management Authority (DDMA).
