# Final SIH Demo Storyline & Pitch Guide (3–5 Minutes)

**Project:** Sahayata (SIH26191)  
**Title:** AI-Assisted GIS Platform for Hazard-Based Relocation Prioritization of Vulnerable Habitations  
**Target Audience:** SIH Jury, State Disaster Management Authorities (SDMA), District Collectors  

---

## 1. Timing & Narrative Breakdown

```
┌─────────────┬─────────────────────────────────────────────────┬────────────────────────────────────────┐
│ Time Window │ Focus Area                                      │ Screen & Interactive Action            │
├─────────────┼─────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 0:00–0:25   │ Problem: Fragmented Risk vs. Relocation Need    │ Dashboard overview & AP statewide map  │
├─────────────┼─────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 0:25–0:50   │ Why Existing Systems Fall Short (Siloed Data)   │ Architecture & 4-Criteria MCDA pipeline│
├─────────────┼─────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 0:50–1:40   │ Scenario A (Baseline): Deep Dive on Priority    │ Click High-Risk Mandal (e.g. Tada /    │
│             │ Mandal & Infrastructure Bottlenecks             │ Gummalakshmipuram) -> View TOPSIS rank │
├─────────────┼─────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 1:40–2:30   │ Candidate Host-Zone Screening & Side-by-Side    │ Open "Host Zones" Tab -> Launch        │
│             │ Comparative Evaluation                          │ "Compare Source vs Host" modal         │
├─────────────┼─────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 2:30–3:30   │ Scenario B (Severe Hazard Intensification)      │ Open "What-If Simulation" -> Select    │
│             │ Near-Instant Re-ranking under Compound Stress   │ "Severe Hazard" preset (+30% H, -10% A)│
├─────────────┼─────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 3:30–4:15   │ Scenario C (Proactive Mitigation & Upgrades)    │ Switch to "Improved Preparedness"      │
│             │ Demonstrating Risk Headroom Creation            │ (-30% Cap Deficit, +30% Access)        │
├─────────────┼─────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 4:15–4:45   │ 3-Horizon Action Plan (Immediate to Long-Term)  │ Open "Action Plan" Tab -> Show DDMA    │
│             │ Tailored to Active Bottlenecks                  │ assigned agencies and triggers         │
├─────────────┼─────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 4:45–5:00   │ Closing: Impact, Open Data, & Governance        │ Summary card & Human-in-the-Loop note  │
└─────────────┴─────────────────────────────────────────────────┴────────────────────────────────────────┘
```

---

## 2. Three Polished Demo Scenarios

### Scenario A — Baseline Planning State
- **Parameters:** $\Delta_{\text{haz}}=0\%, \Delta_{\text{pop}}=0\%, \Delta_{\text{cap}}=0\%, \Delta_{\text{acc}}=0\%$
- **Storyline:** Shows official Phase 4 TOPSIS relocation baseline across Andhra Pradesh's 680 populated mandals. Identifies top-risk habitations in coastal deltas and tribal upland zones where multi-hazard exposure intersects with high demographic vulnerability.

### Scenario B — Severe Compound Hazard & Road Washouts
- **Parameters:** $\Delta_{\text{haz}}=+30\%, \Delta_{\text{pop}}=+10\%, \Delta_{\text{cap}}=+10\%, \Delta_{\text{acc}}=-10\%$
- **Storyline:** Simulates severe monsoon storm surge compounding with road corridor degradation. Demonstrates how upland tribal mandals (e.g. Gummalakshmipuram) jump significantly into critical relocation priority due to compounding egress constraints.

### Scenario C — Proactive Mitigation & Access Upgrades
- **Parameters:** $\Delta_{\text{haz}}=0\%, \Delta_{\text{pop}}=0\%, \Delta_{\text{cap}}=-30\%, \Delta_{\text{acc}}=+30\%$
- **Storyline:** Demonstrates how government investments in all-weather road elevation and PHC bed expansion reduce composite relocation pressure, enabling communities to safely remain with in-situ protection.
