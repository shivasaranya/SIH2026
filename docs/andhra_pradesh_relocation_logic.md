# Andhra Pradesh Relocation Logic & Potential Safer Locations Protocol

## Overview

In **RakshaSethu**, population protection and relocation planning are organized into two distinct, orthogonal decision frameworks:

| Decision Area | Core Question | Underlying Methodology | Key Output |
|---|---|---|---|
| **Decision A: Relocation Planning Priority** | *"Which vulnerable mandals need attention first?"* | Analytical Hierarchy Process (AHP) weights + Technique for Order Preference by Similarity to Ideal Solution (TOPSIS) | Vulnerability & Prioritization Ranks ($C_1$–$C_4$ matrix) |
| **Decision B: Potential Safer Locations** | *"Where could affected people potentially be moved?"* | Multi-Criteria Decision Analysis: **Safety First $\to$ Capacity Second $\to$ Accessibility Third $\to$ Proximity as Soft Preference** | Ranked Destinations (🥇 Best Suitable, 🥈 Alternatives) |

---

## 1. Research Basis & Core Principles

Our empirical and administrative research for Andhra Pradesh disaster response demonstrated:
1. **No Fixed Distance Cutoff**:
   - There is no administrative rule or policy requiring same-mandal-only evacuation.
   - The NCRMP **1.5–2 km** figure is an engineering and service design radius for cyclone shelters (walking access radius for immediate shelter catchment), **NOT** a universal maximum evacuation limit or relocation boundary.
2. **Dynamic Multi-Tier Response in AP**:
   - Andhra Pradesh disaster response routinely utilizes pre-identified safer locations within the same district (adjacent or farther mandals).
   - When closer locations are hazard-exposed or capacity-constrained, farther mandals or even neighboring districts are used as valid fallback destinations.
   - Long-term permanent rehabilitation and relocation frequently involve inter-mandal and inter-district resettlement.
3. **Hierarchy of Priorities**:
   - **Safety First**: A candidate location must NOT be recommended merely because it is close.
   - **Capacity Second**: The destination must possess verified physical shelter capacity, habitable land headroom, and critical health/WASH infrastructure.
   - **Accessibility Third**: The destination must be connected via viable road networks.
   - **Proximity Fourth**: Geographic distance and administrative tiers are **soft preferences**, never rigid cutoffs.

> *"RakshaSethu does not enforce a fixed evacuation distance or same-mandal-only rule. For Andhra Pradesh, candidate locations are evaluated primarily on safety, capacity and accessibility, while distance and administrative proximity are treated as soft preferences. This allows the system to recommend a farther but safer and adequately resourced location when closer alternatives are unsuitable."*
>
> *"The 1.5–2 km NCRMP value is a cyclone shelter service/design radius, not a universal evacuation-distance limit."*

---

## 2. Hard Safety Filter & Candidate Exclusion

Before ranking, every candidate location is evaluated against mandatory safety and feasibility criteria. Any candidate failing these conditions is labeled with an explicit rejection rationale and excluded from the viable recommendations pool:

1. **Hazard Safety Constraint**:
   - Condition: Composite Multi-Hazard Exposure Index ($H \ge 0.35$) OR Safe Habitable Land Fraction ($< 50\%$).
   - Rejection Reason: `"Rejected: hazard exposure (hazard score exceeds safety threshold)"`.
2. **Capacity Headroom Constraint**:
   - Condition: Capacity condition is `CAPACITY-STRESSED` OR (verified shelter capacity $= 0$ and safe area $< 200\text{ m}^2/\text{person}$).
   - Rejection Reason: `"Rejected: insufficient capacity (zero verified shelter capacity and insufficient safe headroom)"`.
3. **Road Accessibility Constraint**:
   - Condition: Road accessibility score $< 0.15$ OR road status `BLOCKED` / `CRITICAL`.
   - Rejection Reason: `"Rejected: accessibility constraint (road accessibility score below transit threshold)"`.
4. **Critical Infrastructure Constraint**:
   - Condition: Water and sanitation adequacy $< 0.20$.
   - Rejection Reason: `"Rejected: insufficient critical infrastructure (WASH index below threshold)"`.
5. **Data Completeness Constraint**:
   - Condition: Census data completeness $< 50\%$ OR status `INSUFFICIENT_DATA`.
   - Label: `"INSUFFICIENT-DATA"`. Missing values are **never** assumed safe or filled with zeros.

---

## 3. Administrative Proximity & Soft Distance Preference

Viable candidates passing the Hard Safety Filter are classified into four administrative coordination tiers:

- **Tier 1: Same Mandal** ($S_{\text{admin}} = 1.00$)
- **Tier 2: Adjacent Mandal, Same District** ($S_{\text{admin}} = 0.85$)
- **Tier 3: Farther Mandal, Same District** ($S_{\text{admin}} = 0.70$)
- **Tier 4: Different District** ($S_{\text{admin}} = 0.50$)

> [!NOTE]
> These tiers represent coordination convenience and administrative ease. They are **NOT** safety scores. A safer Tier 2 or Tier 4 location strictly outranks an unsafe Tier 1 location.

### Real Geographic Distance (EPSG:7755)
Distances are computed between mandal centroids in **EPSG:7755 (India Albers Equal Area)**:
$$S_{\text{dist}} = \frac{1}{1 + \frac{d}{75.0}}$$
This smooth inverse function rewards closer viable locations without artificially disqualifying candidates at 5 km, 10 km, or 50 km.

---

## 4. Multi-Criteria Suitability Scoring

For candidates satisfying safety, capacity, and accessibility:

$$S_{\text{suitability}} = 0.35 \cdot S_{\text{safety}} + 0.30 \cdot S_{\text{capacity}} + 0.15 \cdot S_{\text{accessibility}} + 0.15 \cdot S_{\text{distance}} + 0.05 \cdot S_{\text{admin}}$$

Where:
- $S_{\text{safety}} = 0.6 \cdot (1 - H) + 0.4 \cdot \text{SafeLandFraction}$
- $S_{\text{capacity}} = 0.35 \cdot \text{ShelterAdequacy} + 0.35 \cdot \min\left(1.0, \frac{\text{Headroom}}{1500}\right) + 0.15 \cdot \text{WASH} + 0.15 \cdot \min\left(1.0, \frac{\text{BedsPer1000}}{2.5}\right)$
- $S_{\text{accessibility}} = \min(1.0, \text{RoadAccessibilityIndex})$
- $S_{\text{distance}} = \frac{1}{1 + d / 75.0}$
- $S_{\text{admin}} = \text{TierFactor}$

---

## 5. Human-Readable Rationale Generation

Every recommended destination provides a transparent explanation:
- **Same Mandal**: *"Same-mandal candidate with adequate capacity and acceptable safety conditions."*
- **Adjacent Mandal**: *"Recommended because it is outside the major hazard exposure area, has adequate capacity, has accessible road connectivity, and is the closest suitable candidate. (Same-district fallback because suitable same-mandal capacity was insufficient.)"*
- **Farther Mandal**: *"Farther fallback selected because closer candidates did not satisfy safety/capacity requirements."*
- **Different District**: *"Exceptional fallback because suitable locations within the origin district were unavailable."*
