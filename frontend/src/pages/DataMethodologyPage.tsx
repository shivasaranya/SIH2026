import React, { useState } from 'react';
import { 
  Database, 
  Scale, 
  AlertTriangle, 
  ShieldCheck, 
  Layers, 
  Activity, 
  Compass, 
  ArrowRight, 
  ChevronRight 
} from 'lucide-react';

interface DataMethodologyPageProps {
  onLaunchGIS?: () => void;
}

type SectionTab = 'sources' | 'methodology' | 'limitations' | 'governance';

export const DataMethodologyPage: React.FC<DataMethodologyPageProps> = ({ onLaunchGIS }) => {
  const [activeTab, setActiveTab] = useState<SectionTab>('sources');

  const datasets = [
    {
      name: 'AP Administrative Boundaries (Districts & Mandals)',
      source: 'Survey of India / APSAC / OGD India',
      year: '2022 (Post-Bifurcation)',
      res: 'Vector Polygons (696 Mandals, 26 Districts)',
      classification: 'OFFICIAL',
      use: 'Spatial geometry, administrative hierarchy, and choropleth polygons in EPSG:7755 / EPSG:4326.'
    },
    {
      name: 'Village & Mandal Demographics',
      source: 'Census of India (Primary Census Abstract - PCA)',
      year: '2011 Baseline',
      res: '17,039 Habitations crosswalked to 696 Mandals',
      classification: 'OFFICIAL',
      use: 'Evacuation assistance indicators: children 0-6 physical care need, non-workers mobilization proxy, and household family congestion index.'
    },
    {
      name: 'Historical Surface Water Recurrence',
      source: 'EC Joint Research Centre (JRC) Global Surface Water',
      year: '1984–2021 (38-Year Time Series)',
      res: '30-meter Raster Grid',
      classification: 'THIRD-PARTY / PROXY',
      use: 'Zonal mean inundation recurrence frequency for baseline flood exposure.'
    },
    {
      name: 'Cyclone Storm Tracks & Wind Decay',
      source: 'NOAA NCEI IBTrACS v04r00',
      year: '1970–2023 (50+ Year Archive)',
      res: 'Vector Storm Tracks & 100km Buffer Decay',
      classification: 'THIRD-PARTY / DERIVED',
      use: 'Spatial storm track recurrence density weighted by sustained wind speeds.'
    },
    {
      name: 'Basic Design Wind Speeds',
      source: 'BMTPC Vulnerability Atlas of India',
      year: '2019 Atlas Edition',
      res: 'Zonal & District Vectors (44–55 m/s)',
      classification: 'OFFICIAL / PROXY',
      use: 'Regional wind hazard design thresholds.'
    },
    {
      name: 'Elevation & Terrain Slope',
      source: 'NASA SRTM DEM (1-Arcsecond)',
      year: '2000 Baseline',
      res: '30-meter Raster Elevation Grid',
      classification: 'THIRD-PARTY / DERIVED',
      use: 'Horn slope calculation for steep terrain instability and safe habitable land filtering (<15°).'
    },
    {
      name: 'Designated Multi-Purpose Cyclone Shelters',
      source: 'NDMA National Cyclone Risk Mitigation Project (NCRMP)',
      year: 'Phase-I Inventory (2015–2020)',
      res: 'Point Coordinates & Static Asset Registry',
      classification: 'OFFICIAL',
      use: 'Designated cyclone shelter capacity for coastal Andhra Pradesh.'
    },
    {
      name: 'Healthcare Bed Standards',
      source: 'MoHFW Indian Public Health Standards (IPHS)',
      year: '2022 Guidelines',
      res: 'Normative Standard (1.0 Bed / 1,000 Population)',
      classification: 'NORMATIVE BENCHMARK',
      use: 'Baseline planning headroom deficit calculations.'
    },
    {
      name: 'Water & Sanitation Infrastructure Coverage',
      source: 'Jal Jeevan Mission (JJM) & SBM-Gramin Portals',
      year: '2023–2024 Administrative Aggregations',
      res: 'District & State Coverage Indices',
      classification: 'OFFICIAL / PROXY',
      use: 'Composite water supply and household sanitation coverage adequacy.'
    },
    {
      name: 'Evacuation Road Network Density',
      source: 'OpenStreetMap (OSM) & NRDMS State Portal',
      year: '2024 Line Vectors',
      res: 'Vector Line Road Network (km / km²)',
      classification: 'THIRD-PARTY / PROXY',
      use: 'Egress infrastructure and transport chokepoint constraint proxy.'
    }
  ];

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Open Data Registry & Multi-Criteria Methodology
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Data Sources, Methodology & Governance
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-3xl leading-relaxed">
            Full transparency documentation for all 10 ingested datasets, mathematical AHP/TOPSIS algorithms, normative carrying capacity benchmarks, and explicit data boundaries.
          </p>
        </div>

        {onLaunchGIS && (
          <button
            onClick={onLaunchGIS}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20 shrink-0"
          >
            <span>Launch Interactive Risk Map</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 rounded-xl p-1 gap-1">
        <button
          onClick={() => setActiveTab('sources')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'sources'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Data Sources Catalog (10 Datasets)</span>
        </button>

        <button
          onClick={() => setActiveTab('methodology')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'methodology'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Analytical Methodology & Formulas</span>
        </button>

        <button
          onClick={() => setActiveTab('limitations')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'limitations'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Data Limitations & Boundaries</span>
        </button>

        <button
          onClick={() => setActiveTab('governance')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'governance'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Governance & Operational Role</span>
        </button>
      </div>

      {/* ================= TAB 1: DATA SOURCES CATALOG ================= */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {datasets.map((ds, idx) => (
              <div
                key={idx}
                className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-2.5 shadow-sm hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="font-bold text-white text-xs leading-snug">{ds.name}</h3>
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                    ds.classification === 'OFFICIAL'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : ds.classification === 'NORMATIVE BENCHMARK'
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                  }`}>
                    {ds.classification}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-slate-400 block font-medium">Source / Custodian:</span>
                    <span className="text-slate-200 font-semibold">{ds.source}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Temporal Benchmark:</span>
                    <span className="text-slate-200 font-semibold">{ds.year}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium">Spatial Resolution:</span>
                    <span className="text-slate-200 font-mono">{ds.res}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {ds.use}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 2: METHODOLOGY & FORMULAS ================= */}
      {activeTab === 'methodology' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AHP Matrix Card */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-indigo-400" />
                  1. Analytic Hierarchy Process (AHP) Weights
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {'CR = 0.0038 < 0.10'}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Criteria weights derived from Saaty's pairwise comparison matrix (λmax = 4.0104, n = 4):
              </p>

              <div className="space-y-1.5 font-mono text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between text-rose-300">
                  <span>C1 Multi-Hazard Exposure:</span>
                  <span className="font-bold">0.4231 (42.31%)</span>
                </div>
                <div className="flex justify-between text-amber-300">
                  <span>C2 Evacuation Assistance Sensitivity:</span>
                  <span className="font-bold">0.2274 (22.74%)</span>
                </div>
                <div className="flex justify-between text-sky-300">
                  <span>C3 Emergency Capacity Stress:</span>
                  <span className="font-bold">0.2274 (22.74%)</span>
                </div>
                <div className="flex justify-between text-indigo-300">
                  <span>C4 Evacuation Access Constraint:</span>
                  <span className="font-bold">0.1221 (12.21%)</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800 font-bold">
                  <span>Sum (Σ wj):</span>
                  <span>1.0000 (100.0%)</span>
                </div>
              </div>
            </div>

            {/* TOPSIS Method Card */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  2. TOPSIS Multi-Criteria Prioritization
                </h3>
                <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-500/30">
                  680 Mandals Ranked
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Geometric separation from the Ideal Best (A+) and Ideal Worst (A-) solutions:
              </p>

              <div className="space-y-1.5 font-mono text-[11px] bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-slate-300">
                <div>{'Vector Normalization: r_ij = x_ij / sqrt(Σ x_kj^2)'}</div>
                <div>{'Weighted Matrix: v_ij = w_j * r_ij'}</div>
                <div>{'Relative Closeness: CC_i = S_i^- / (S_i^+ + S_i^-) in [0, 1]'}</div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  {'Category Bands: Very High (≥ 0.50), High (0.40–0.50), Moderate (0.30–0.40), Low (< 0.30).'}
                </div>
              </div>
            </div>

            {/* Capacity Headroom Equations */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-sky-400" />
                  3. Emergency Capacity Stress Formula
                </h3>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Capacity stress is calculated as the continuous unweighted mean of individual infrastructure deficit fractions:
              </p>

              <div className="font-mono text-[11px] bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-slate-300 space-y-1">
                <div>{'Capacity Stress S_i = mean(D_health, D_shelter, D_land, D_water)'}</div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  IPHS 2022: 1.0 bed / 1,000 population &bull; Sphere Standard: 45 m²/person safe land headroom.
                </div>
              </div>
            </div>

            {/* What-If Simulation Sensitivity */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  4. What-If Scenario Sensitivity Engine
                </h3>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Deterministic near-instant recalculation preserving fixed baseline reference frame normalizers:
              </p>

              <div className="font-mono text-[11px] bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-slate-300 space-y-1">
                <div>{'H_sim = min(1.0, H_base * (1 + Δ_haz))'}</div>
                <div>{'C_sim = min(1.0, C_base * (1 + 0.5 * Δ_pop + Δ_cap))'}</div>
                <div>{'E_sim = max(0.0, E_base * (1 - Δ_acc))'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: DATA LIMITATIONS ================= */}
      {activeTab === 'limitations' && (
        <div className="space-y-3">
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Explicit System Limitations & Methodological Boundaries
            </h3>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <strong className="text-amber-300 block">1. Demographic Baseline (Census 2011)</strong>
                <p className="text-[11px] text-slate-400">
                  Population, female ratio, children 0–6, and SC/ST distributions are derived from Census of India 2011 (the latest published national census). All demographic analyses reflect relative planning shares.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <strong className="text-amber-300 block">2. Static Asset Inventories vs. Live Operations</strong>
                <p className="text-[11px] text-slate-400">
                  Cyclone shelters and hospital bed numbers reflect static verified registers (NCRMP) and normative standards (IPHS 2022); live emergency occupancy is not claimed.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <strong className="text-amber-300 block">3. Safe Habitable Land as a Physical Planning Indicator</strong>
                <p className="text-[11px] text-slate-400">
                  Safe habitable land is defined as contiguous terrain with slope &lt; 15&deg; outside flood zones. It indicates physical headroom, not legally acquired government land.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <strong className="text-amber-300 block">4. What-If Scenario Sliders are Sensitivity Exploration Tools</strong>
                <p className="text-[11px] text-slate-400">
                  Slider adjustments are mathematical sensitivity simulations, not meteorological weather forecasts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: GOVERNANCE & OPERATIONAL ROLE ================= */}
      {activeTab === 'governance' && (
        <div className="space-y-3">
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Operational Governance & Human-in-the-Loop Mandate
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Sahayata is an <strong>AI-Assisted Decision Support System</strong> engineered to provide quantitative, auditable, and reproducible evidence to disaster management authorities (District Collectors, SDMA, DDMA).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1">
                <span className="text-emerald-400 font-bold text-xs block">What RakshaSethu Does:</span>
                <ul className="text-[11px] text-slate-300 space-y-1">
                  <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-emerald-400" /> Identifies high relocation-priority habitations</li>
                  <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-emerald-400" /> Evaluates critical infrastructure bottlenecks</li>
                  <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-emerald-400" /> Screens candidate host locations</li>
                  <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-emerald-400" /> Simulates compound hazard sensitivities</li>
                </ul>
              </div>

              <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-1">
                <span className="text-rose-400 font-bold text-xs block">What Sahayata Never Does:</span>
                <ul className="text-[11px] text-slate-300 space-y-1">
                  <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-rose-400" /> Never issues automatic relocation orders</li>
                  <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-rose-400" /> Never overrides human administrative judgment</li>
                  <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-rose-400" /> Never claims black-box AI forecasting</li>
                  <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-rose-400" /> Never fabricates unverified live occupancy</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
