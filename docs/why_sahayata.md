# Why Sahayata? — Unique Value Proposition & Comparative Landscape

**Project:** Sahayata (SIH26191)  
**Problem Statement:** Intelligent Identification of Hazard-Based Red Zones, Carrying Capacity Assessment, and Immediate Relocation Needs for Vulnerable Habitations  
**Scope:** India-focused GIS Multi-Criteria Decision-Support System  

---

## 1. The Core Differentiator

Existing disaster management systems in India operate in specialized, isolated silos: early warning sirens (SACHET), satellite hazard layers (Bhuvan/NDEM), hydro-meteorological river gauges (CWC), or post-disaster relief coordination. 

**Sahayata introduces the first unified, end-to-end relocation decision-support workflow:**

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 SAHAYATA UNIFIED DECISION WORKFLOW                                     │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                        │
│   Multi-Hazard Exposure (Flood + Cyclone + Wind + Landslide/Slope)                                     │
│     │                                                                                                  │
│     ▼                                                                                                  │
│   Demographic Sensitivity (Census 2011 Children, Women, SC/ST, Non-Workers)                            │
│     │                                                                                                  │
│     ▼                                                                                                  │
│   Physical Carrying-Capacity Stress (Shelter Deficit + Bed Deficit + Safe Land + Roads)                │
│     │                                                                                                  │
│     ▼                                                                                                  │
│   Multi-Criteria Relocation Prioritization (AHP Weights + TOPSIS Relative Closeness)                   │
│     │                                                                                                  │
│     ▼                                                                                                  │
│   Screened Candidate Host-Zone Identification (Safety Headroom + Proximity in EPSG:7755)               │
│     │                                                                                                  │
│     ▼                                                                                                  │
│   Deterministic 3-Horizon Action Planning (Immediate 0-72h, Short-Term 1-6m, Long-Term 1-3y)           │
│     │                                                                                                  │
│     ▼                                                                                                  │
│   Near-Instant What-If Disaster Simulation (Compound Hazard & Access Sensitivity)                      │
│                                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

> **Core Value Summary:**  
> *"Our research found no single existing system combining these capabilities in this specific India-focused, habitation-level relocation-prioritization and carrying-capacity workflow."*

---

## 2. Comparative Landscape: What Others Do vs. What Sahayata Adds

```
┌──────────────────┬──────────────────────────────────────┬──────────────────────────────────────────────┐
│ Platform / Tool  │ Primary Operational Scope            │ What Sahayata Adds on Top                    │
├──────────────────┼──────────────────────────────────────┼──────────────────────────────────────────────┤
│ ISRO Bhuvan /    │ Satellite earth observation, thematic│ Synthesizes raw thematic layers with Census  │
│ NDEM             │ flood/cyclone extent maps.           │ demographics, carrying capacity, & TOPSIS.   │
├──────────────────┼──────────────────────────────────────┼──────────────────────────────────────────────┤
│ NDMA SACHET      │ Common Alerting Protocol (CAP) for   │ Provides multi-criteria pre-disaster planning│
│                  │ real-time emergency SMS broadcasts.  │ and post-disaster host zone screening.       │
├──────────────────┼──────────────────────────────────────┼──────────────────────────────────────────────┤
│ CWC / C-FLOOD    │ River basin hydrodynamics & discharge│ Integrates physical flood recurrence with    │
│                  │ forecasts.                           │ societal vulnerability & shelter deficits.   │
├──────────────────┼──────────────────────────────────────┼──────────────────────────────────────────────┤
│ InaSAFE /        │ Impact simulation of damage to       │ Adds MCDA relocation ranking, host zone      │
│ RiskScape        │ building assets and roads.           │ screening, and deterministic action plans.   │
├──────────────────┼──────────────────────────────────────┼──────────────────────────────────────────────┤
│ FEMA HAZUS-MH    │ US-centric loss estimation model     │ Engineered natively for Indian administrative│
│                  │ tailored to US building codes/census.│ units (Mandals/Villages, IPHS, NCRMP).       │
├──────────────────┼──────────────────────────────────────┼──────────────────────────────────────────────┤
│ ThinkHazard!     │ Global high-level hazard screening   │ Deep local carrying capacity, candidate host │
│ (World Bank)     │ at country/province level.           │ pairing, and interactive What-If simulation. │
└──────────────────┴──────────────────────────────────────┴──────────────────────────────────────────────┘
```

---

## 3. What Sahayata Does NOT Replace

- **Does NOT replace real-time meteorological forecasts:** Relies on IMD and CWC warning feeds.
- **Does NOT replace satellite remote sensing agencies:** Consumes official open GIS layers from NRSC/APSAC.
- **Does NOT replace human executive authority:** Strictly provides decision support for District Collectors and SDMAs; never issues automatic relocation orders.
