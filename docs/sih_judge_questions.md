# SIH Technical Judge Defense & FAQ (30 Questions & Answers)

**Project:** Sahayata (SIH26191)  
**Preparation Target:** SIH Grand Finale Technical Jury & Disaster Management Domain Experts  

---

### Q1: What is actually "AI" in your system?
**A:** Sahayata employs deterministic **Multi-Criteria Decision Analysis (MCDA)** combining **Analytic Hierarchy Process (AHP)** for mathematically verified criterion weighting ($CR = 0.0038 \ll 0.10$) and **TOPSIS** (Technique for Order Preference by Similarity to Ideal Solution) for multidimensional vector distance ranking. This provides intelligent, auditable decision support without the unpredictability, hallucination, or uncalibrated confidence of black-box neural networks.

### Q2: Why not just use ISRO Bhuvan or NDEM?
**A:** Bhuvan and NDEM provide foundational satellite hazard layers (e.g. flood inundation extent). They do not integrate physical carrying-capacity deficits (shelters, beds, safe land), demographic sensitivity, multi-criteria relocation ranking, or candidate host-zone pairing. Sahayata consumes these spatial layers to build an end-to-end relocation decision workflow.

### Q3: Why not NDMA SACHET?
**A:** SACHET is an early warning public alerting protocol (CAP) for real-time citizen SMS broadcasts. Sahayata is a strategic pre-disaster planning and post-disaster host-zone assessment platform for disaster authorities.

### Q4: What makes Sahayata unique?
**A:** Our research found no single existing system combining multi-hazard exposure, demographic vulnerability, physical carrying capacity, MCDA relocation prioritization, candidate host-zone screening, and What-If scenario simulation in an integrated India-focused workflow.

### Q5: Why Andhra Pradesh as the pilot?
**A:** Andhra Pradesh possesses India's second-longest coastline (974 km), experiences severe recurring Bay of Bengal cyclones and Krishna/Godavari floods, and has complete, standardized open spatial data across its 26 bifurcated districts.

### Q6: Why use Census 2011?
**A:** Census 2011 is the latest officially published village/mandal-level population census in India. Sahayata’s crosswalk architecture is modular—when Census 2026 is published, it updates the demographic baseline automatically without altering the analytical core.

### Q7: Why conduct the pilot at the Mandal level rather than Village level?
**A:** Health bed allocations (IPHS), secondary cyclone shelters (NCRMP), and major road density networks are planned and administered at the mandal level. Village-level boundaries lack continuous infrastructure inventory data.

### Q8: Why AHP?
**A:** AHP provides a structured, pairwise-comparison mathematical framework (Saaty scale 1–9) with an eigenvalue consistency test ($\lambda_{\max} = 4.0104, CR = 0.0038$), ensuring weighting judgments are logically consistent.

### Q9: Why TOPSIS?
**A:** TOPSIS simultaneously measures the geometric Euclidean separation from the Ideal Best solution (highest risk across all 4 dimensions) and the Ideal Worst solution, avoiding arbitrary linear additive assumptions.

### Q10: Why these specific AHP weights ($0.4231, 0.2274, 0.2274, 0.1221$)?
**A:** Multi-Hazard Exposure ($0.4231$) is the primary physical trigger driving relocation need. Demographic Vulnerability ($0.2274$) and Capacity Stress ($0.2274$) provide equal societal and physical constraint context, while Egress Accessibility ($0.1221$) represents the operational evacuation constraint.

### Q11: How did you validate that AHP and TOPSIS do not double-count risk?
**A:** We performed an orthogonality correlation audit across all 680 mandals: the Pearson correlation between $C_1$ (Hazard) and $C_2$ (Demography) is $r = 0.0092$, confirming statistical independence and zero double-counting.

### Q12: What is "Carrying Capacity" in Sahayata?
**A:** It is the physical adequacy of in-situ critical infrastructure: cyclone shelter capacity, normative hospital beds (IPHS), water/sanitation coverage (JJM/SBM-G), road density, and slope $<15^\circ$ safe habitable land fraction.

### Q13: How is Capacity Stress calculated?
**A:** As the unweighted mean of continuous deficit fractions across health beds, shelter persons, safe land, and water/sanitation adequacy ($S_i \in [0.0, 1.0]$).

### Q14: Why are many mandals classified as "Capacity Constrained"?
**A:** Because in rural and tribal upland mandals, specialized multi-purpose cyclone shelters are either non-existent or health bed ratios fall below the normative 1.0 bed / 1,000 population IPHS standard.

### Q15: Are shelter capacities live?
**A:** No. They represent verified static designated capacities from NCRMP Phase-I.

### Q16: Are hospital beds live?
**A:** No. They reflect normative baseline capacities from IPHS 2022 standards.

### Q17: Can Sahayata predict floods or cyclones?
**A:** No. Sahayata evaluates 38-year historical recurrence (JRC Global Surface Water) and 50-year cyclone track frequency (IBTrACS), not real-time hydrodynamic forecasts.

### Q18: Is Sahayata an evacuation routing system?
**A:** No. Road density is an accessibility proxy to identify transport chokepoints.

### Q19: Who makes the final relocation decision?
**A:** The District Disaster Management Authority (DDMA) headed by the District Collector and State Disaster Management Authority (SDMA). Sahayata is strictly a decision-support tool.

### Q20: What happens if data is missing for a mandal?
**A:** Missing data remains strictly `null` / `INSUFFICIENT_DATA`. It is never silently converted to zero.

### Q21: Can Sahayata scale to all of India?
**A:** Yes. The core analytical engine, coordinate reprojection (EPSG:7755), and MCDA algorithms are state-agnostic. Ingesting any state's administrative boundary and Census crosswalk enables immediate deployment.

### Q22: How are candidate host zones screened?
**A:** 51 candidate host mandals were filtered from all 696 units based on: Hazard Exposure $< 0.30$, Vulnerability $< 0.35$, Safe Habitable Land $\ge 85.0\%$, Safe Land Headroom $\ge 500\text{ m}^2/\text{person}$, and Data Completeness $\ge 80\%$.

### Q23: How are distances calculated between source and host?
**A:** Using planar geodesic distance in EPSG:7755 (India Albers Equal Area) between polygon geometric centroids.

### Q24: What is the purpose of the What-If simulation?
**A:** To allow disaster authorities to explore sensitivity: "If hazard intensity increases by $+30\%$ and road washouts degrade access by $-30\%$, which mandals jump into critical priority?"

### Q25: Why is the population coefficient $0.5$ in the simulation capacity term?
**A:** It is a documented heuristic damping elasticity assumption, reflecting that sudden population displacement partially scales in-situ asset strain rather than scaling static infrastructure 1:1.

### Q26: Why did Gummalakshmipuram jump from #18 to #1 in the stress test?
**A:** It possesses the state's highest demographic sensitivity ($D = 0.5895$) combined with steep terrain and limited road access. Compounding hazard and access degradation surges all four constrained criteria simultaneously.

### Q27: How are 3-horizon action plans generated?
**A:** Through deterministic rule-based triggers mapped directly to active physical bottlenecks (e.g. health beds trigger mobile medical units; road access triggers causeway elevation audits).

### Q28: How fast does the simulation engine run?
**A:** Sub-15 milliseconds for full statewide recalculation across all 680 mandals using in-memory vectorized NumPy operations.

### Q29: What is the biggest limitation of Sahayata?
**A:** Dependence on Census 2011 for demographic baselines and static infrastructure inventories, requiring district ground-truthing before executive action.

### Q30: What is your key message to disaster authorities?
**A:** Sahayata converts fragmented hazard maps and census books into an explainable, prioritized roadmap for targeted pre-disaster mitigation, shelter retrofitting, and safe host-zone planning.
