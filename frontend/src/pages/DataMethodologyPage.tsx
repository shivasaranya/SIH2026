import React, { useState } from 'react';
import { PageHeader } from '../components/common/DesignSystem';
import { 
  Database, 
  Scale, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  ArrowRight
} from 'lucide-react';

import { useActiveState } from '../context/StateContext';

interface DataMethodologyPageProps {
  initialTab?: 'sources' | 'methodology' | 'limitations' | 'governance';
  onLaunchGIS?: () => void;
}

export const DataMethodologyPage: React.FC<DataMethodologyPageProps> = ({ 
  initialTab = 'sources',
  onLaunchGIS 
}) => {
  const { currentState } = useActiveState();
  const [activeTab, setActiveTab] = useState<'sources' | 'methodology' | 'limitations' | 'governance'>(initialTab);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const isTN = currentState.id === 'tamil_nadu';
  const isMZ = currentState.id === 'mizoram';
  const isHP = currentState.id === 'himachal_pradesh';

  const datasets = [
    {
      name: `Administrative Boundaries (${currentState.districtCount} Districts & ${currentState.adminUnitCount} ${currentState.adminUnitPlural})`,
      source: `Survey of India (SOI) & ${currentState.name} Spatial Data Infrastructure (${currentState.code}-SSDI)`,
      year: '2022 (Harmonized Post-Restructuring)',
      res: 'Vector Polygons (EPSG:7755 / EPSG:4326)',
      classification: 'OFFICIAL',
      use: `Primary spatial join jurisdiction boundaries across all ${currentState.districtCount} districts and ${currentState.adminUnitCount} ${currentState.adminUnitPlural.toLowerCase()}.`,
      limitations: `Official district and sub-district boundaries harmonized with Survey of India and state gazette.`
    },
    {
      name: `Primary Census Abstract (PCA) ${currentState.adminUnitName} Demographics`,
      source: 'Office of the Registrar General & Census Commissioner, India (ORGI)',
      year: '2011 Census of India',
      res: isMZ ? '26 R.D. Blocks & 830+ Census Villages' : (isTN ? '302 Taluks & 15,979 Census Villages' : (isHP ? '172 Tehsils & 17,495 Census Villages' : '17,039 Habitations & Villages (Complete AP)')),
      classification: 'OFFICIAL',
      use: 'Demographic vulnerability proxy: children (0-6), total households, non-workers, and family size congestion.',
      limitations: '2011 decennial enumeration is the latest official habitation-level demographic baseline in India.'
    },
    {
      name: 'Global Surface Water Dynamics (38-Year Recurrence)',
      source: 'European Commission Joint Research Centre (EC-JRC) / Google Earth Engine',
      year: '1984–2021 (38-Year Time Series)',
      res: '30-meter Landsat Resolution',
      classification: 'OFFICIAL SCIENTIFIC',
      use: 'Historical inundation frequency, seasonal water occurrence, and persistent water extent.',
      limitations: 'Reflects historical multi-decadal surface water presence; not a hydrodynamic 1D/2D flood model.'
    },
    {
      name: isMZ ? 'Cyclone Hazard Assessment (Inland Policy Evaluation)' : 'Historical Tropical Cyclone Storm Tracks & Intensity',
      source: 'NOAA International Best Track Archive for Climate Stewardship (IBTrACS v04r00)',
      year: '1970–2023 (53-Year Archive)',
      res: isMZ ? 'Inland Mountainous Terrain (Zero Direct Landfall Recurrence)' : 'Line Segments with Saffir-Simpson & IMD Wind Speeds',
      classification: 'OFFICIAL SCIENTIFIC',
      use: isMZ ? 'Verification of inland storm decay; cyclone exposure is not fabricated in strict accordance with Zero Fake Data policy.' : (isHP ? 'Verification of inland storm decay; HP is landlocked with no direct cyclone exposure. Snow/Avalanche and seismic hazards are prioritized.' : 'Spatial track recurrence density, coastal surge exposure, and 50km/100km wind decay buffers.'),
      limitations: isMZ ? 'Mizoram is an inland mountainous state. Direct tropical cyclone storm surge is non-applicable; terrain slope and landslide hazards are prioritized instead.' : (isHP ? 'Himachal Pradesh is a landlocked Himalayan state. Cyclone storm surge is non-applicable; landslide, earthquake, GLOF, and snow/avalanche hazards dominate.' : 'Historical storm track frequency and intensity; not a real-time meteorological track forecast.')
    },
    {
      name: 'Basic Design Wind Speeds (IS 875 Part 3 & BMTPC)',
      source: 'Building Materials & Technology Promotion Council (BMTPC) Vulnerability Atlas',
      year: '2019 Revision',
      res: isMZ ? 'R.D. Block Design Wind Speed Zones (55 m/s, Zone A)' : (isHP ? 'Tehsil Design Wind Speed Zones (39–47 m/s, IS 875 Part 3)' : 'Mandal-level Design Wind Speed Zones (44, 47, 50, 55 m/s)'),
      classification: 'OFFICIAL',
      use: 'Structural wind hazard baseline and cyclonic wind exposure scoring.',
      limitations: 'Regional design wind thresholds; does not account for micro-topographic wind funneling.'
    },
    {
      name: 'Shuttle Radar Topography Mission (SRTM) 30m Digital Elevation Model',
      source: 'NASA JPL / USGS Earth Resources Observation and Science (EROS)',
      year: 'SRTM v3.0 (1 Arc-Second Global)',
      res: '30-meter Spatial Resolution',
      classification: 'OFFICIAL SCIENTIFIC',
      use: (isMZ || isHP) ? 'Terrain slope calculation (Horn algorithm), elevation profiling, and steep slope landslide constraint (>25°).' : 'Terrain slope calculation (Horn algorithm), elevation profiling, and steep slope constraint (>15°).',
      limitations: '30m raster grid averages micro-relief; unsuitable for site-level civil engineering excavation.'
    },
    {
      name: isMZ ? 'Community Shelter & YMA Hall Registry' : (isHP ? 'Emergency Shelter & Community Hall Registry' : 'Multi-Purpose Cyclone Shelter Registry (NCRMP)'),
      source: isMZ ? 'Disaster Management & Rehabilitation (DM&R) Dept Govt of Mizoram & YMA Registers' : (isHP ? 'HP State Disaster Management Authority (HPSDMA) & District DM Plans' : 'National Cyclone Risk Mitigation Project (NCRMP) / NDMA / APSDMA'),
      year: 'Phase I & II Asset Registry',
      res: isMZ ? 'Designated Community Halls & Emergency Shelters Across Mizoram' : (isHP ? 'Designated Shelters, School Buildings & Community Halls Across HP' : '1,053 Designated Shelters Across AP'),
      classification: 'OFFICIAL',
      use: `Verified emergency shelter capacity per ${currentState.adminUnitName.toLowerCase()} and shelter deficit calculations.`,
      limitations: 'Reflects designated asset capacity registry; live real-time shelter availability requires field check.'
    },
    {
      name: 'Road Network Evacuation Corridors & Density',
      source: isMZ ? 'OpenStreetMap (OSM) Contributors & Mizoram PWD / NHIDCL Road Network' : (isTN ? 'OpenStreetMap (OSM) & TN Highways Department' : (isHP ? 'OpenStreetMap (OSM) & HP PWD / NHIDCL Road Network' : 'OpenStreetMap (OSM) Contributors & NRDMS AP State Spatial Road Network')),
      year: '2023 Extract',
      res: 'Vector Line Network (National, State, District & Rural Roads)',
      classification: 'OPEN / OFFICIAL HYBRID',
      use: 'Egress infrastructure and transport chokepoint constraint proxy for evacuation corridors.',
      limitations: 'Paved vs unpaved road quality variations aggregated into regional density.'
    },
    {
      name: 'Healthcare Bed Standards & Facilities',
      source: isMZ ? 'Directorate of Health & Family Welfare Mizoram / IPHS Standards' : (isHP ? 'NHM Himachal Pradesh / IGMC Shimla / District Hospital Records / IPHS Standards' : 'MoHFW Indian Public Health Standards (IPHS) / UDISE+ / SSDI'),
      year: '2022 Guidelines',
      res: 'Normative Standard (1.0 Bed / 1,000 Population)',
      classification: 'NORMATIVE BENCHMARK',
      use: 'Baseline planning headroom deficit calculations across Community Health Centers (CHCs) and PHCs.',
      limitations: 'Normative benchmark comparison, not live hospital bed occupancy tracking.'
    },
    {
      name: 'Water & Sanitation Infrastructure Coverage',
      source: 'Jal Jeevan Mission (JJM) & SBM-Gramin Portals',
      year: '2023–2024 Administrative Aggregations',
      res: `${currentState.districtCount} Districts & ${currentState.adminUnitCount} ${currentState.adminUnitPlural} Coverage Indices`,
      classification: 'OFFICIAL / PROXY',
      use: 'Composite water supply and household sanitation coverage adequacy for relocation host planning.',
      limitations: 'Aggregated portal reporting indices used as proxy for baseline service headroom.'
    },
    {
      name: 'National Remote Sensing Centre (NRSC) Land Use/Land Cover',
      source: isMZ ? 'ISRO / NRSC Bhuvan / MIRSAC Mizoram LULC' : (isTN ? 'ISRO / NRSC Bhuvan / TNSDMA' : (isHP ? 'ISRO / NRSC Bhuvan / HPSCSTE Himachal Pradesh LULC' : 'ISRO / NRSC Bhuvan / Bhuvan Andhra')),
      year: '2022–2023 LULC 1:50,000 Scale',
      res: 'Vector & Raster Land Classification',
      classification: 'OFFICIAL',
      use: 'Classification of safe agricultural/barren land fractions suitable for candidate host screening.',
      limitations: 'Requires local cadastral revenue verification before administrative acquisition.'
    }
  ];

  const methodologyFlow = [
    {
      id: 1,
      title: 'DATA INGESTION',
      sub: '12+ Multi-Source GIS & Census Registries',
      desc: 'Ingestion of Survey of India vector boundaries, Census 2011 PCA demographic tables (17,039 habitations), JRC 38-yr surface water, NOAA IBTrACS storm tracks, BMTPC wind speeds, NASA SRTM 30m DEM, and NCRMP shelter registers.',
      tech: 'EPSG:7755 projected coordinate system & robust spatial joins.'
    },
    {
      id: 2,
      title: 'GIS PROCESSING',
      sub: 'Spatial Aggregation & Crosswalking',
      desc: 'Spatial harmonization crosswalking post-2022 26 districts and 696 mandals with Census PCA habitations and raster zonal statistics. 16 mandals without rural Census habitations are strictly flagged as INSUFFICIENT DATA.',
      tech: 'Vector polygon intersections and zonal raster cell aggregation.'
    },
    {
      id: 3,
      title: 'HAZARD EXPOSURE (H_i)',
      sub: '4-Factor Spatial Risk Model',
      desc: 'Normalized composite index of Surface Flood Inundation (JRC), Cyclone Storm Track recurrence (IBTrACS), Basic Design Wind Speed (BMTPC), and Steep Slope Constraint (>15° SRTM).',
      tech: 'H_i = 0.35 * Flood + 0.30 * Cyclone + 0.25 * Wind + 0.10 * Slope (all normalized [0, 1]).'
    },
    {
      id: 4,
      title: 'COMMUNITY SENSITIVITY (D_i)',
      sub: 'Demographic Assistance Model',
      desc: 'Evaluates vulnerable groups requiring coordinated physical assistance during evacuation: Children (0-6), Adult Male (7+), Adult Female (7+), Household family size congestion, and Non-worker mobilization dependency.',
      tech: 'D_i = 0.30 * ChildNorm + 0.25 * FemaleNorm + 0.25 * NonWorkerNorm + 0.20 * CongestionNorm.'
    },
    {
      id: 5,
      title: 'CAPACITY STRESS (C_i)',
      sub: 'Emergency Headroom Evaluation',
      desc: 'Integrates verified designated shelter capacity headroom, road network accessibility density, low-hazard habitable land availability, piped water access, and clinical hospital bed headroom.',
      tech: 'C_i = 0.30 * ShelterDeficit + 0.25 * RoadDeficit + 0.20 * HazardLand + 0.15 * WaterDeficit + 0.10 * BedDeficit.'
    },
    {
      id: 6,
      title: 'AHP CRITERIA WEIGHTS',
      sub: 'Saaty Analytical Hierarchy Process',
      desc: 'Pairwise comparison matrix computed and verified for mathematical consistency: Hazard Exposure C1 (42.31%), Community Sensitivity C2 (22.74%), Shelter Deficit C3 (22.74%), and Evacuation Access C4 (12.20%).',
      tech: 'Consistency Ratio CR = 0.003836 < 0.10 (Mathematically Consistent).'
    },
    {
      id: 7,
      title: 'TOPSIS RELOCATION ENGINE',
      sub: 'Ideal-Solution Closeness Ranking',
      desc: `Calculates Euclidean distance to Positive-Ideal Solution (PIS) and Negative-Ideal Solution (NIS). Relative closeness score C_i* determines final relocation prioritization rank across all ${currentState.adminUnitCount} ${currentState.adminUnitPlural.toLowerCase()}.`,
      tech: 'Vector normalization -> Weighted normalized matrix -> Distance separation -> C_i* = S_i- / (S_i+ + S_i-).'
    },
    {
      id: 8,
      title: 'SCENARIO PERTURBATION',
      sub: 'What-If Simulation Engine',
      desc: 'Allows decision-makers to adjust baseline parameters (+/-50% hazard surge, population displacement, capacity stress, road washout) to simulate dynamic sensitivity shifts across ranked units.',
      tech: 'Deterministic perturbation simulation — strictly NOT a forecast.'
    },
    {
      id: 9,
      title: 'ACTION MANAGEMENT',
      sub: '3-Horizon Operational Response',
      desc: 'Transforms MCDA scores into structured decision outputs: Immediate 0–72h tactical deployment, Short-term 1–6m host site surveys, and Long-term 1–3y resilient infrastructure planning.',
      tech: 'Integrated action catalogue mapped to responsible state departments.'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-5 bg-transparent text-slate-800 select-none">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">

        {/* 1. HEADER BANNER */}
        <PageHeader
          category="Open Data Registry & Multi-Criteria Methodology"
          title="Data Sources, Methodology & Governance"
          description="Full transparency documentation for all ingested government datasets, mathematical AHP/TOPSIS algorithms, normative carrying capacity benchmarks, and ethical data governance."
          icon={<Database className="w-4 h-4 text-indigo-600" />}
          rightContent={
            onLaunchGIS ? (
              <button
                onClick={onLaunchGIS}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition shrink-0"
              >
                <span>Launch Interactive Risk Map</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : undefined
          }
        />

        {/* 2. NAVIGATION TABS */}
        <div className="flex border border-slate-200 bg-white rounded-xl p-1 gap-1 shadow-2xs">
          <button
            onClick={() => setActiveTab('sources')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'sources'
                ? 'bg-indigo-50 text-indigo-900 border border-indigo-200/80 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            <span>Data Sources Catalog (12 Datasets)</span>
          </button>

          <button
            onClick={() => setActiveTab('methodology')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'methodology'
                ? 'bg-indigo-50 text-indigo-900 border border-indigo-200/80 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-indigo-600" />
            <span>Methodology &amp; Visual Flow</span>
          </button>

          <button
            onClick={() => setActiveTab('limitations')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'limitations'
                ? 'bg-indigo-50 text-indigo-900 border border-indigo-200/80 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Data Limitations &amp; Boundaries</span>
          </button>

          <button
            onClick={() => setActiveTab('governance')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'governance'
                ? 'bg-indigo-50 text-indigo-900 border border-indigo-200/80 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Governance &amp; Ethical Role</span>
          </button>
        </div>

        {/* TAB 1: DATA SOURCES CATALOG */}
        {activeTab === 'sources' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {datasets.map((ds, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-xs hover:border-indigo-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-xs flex items-center justify-center shrink-0 font-bold border border-indigo-100">
                        {idx + 1}
                      </span>
                      <h3 className="font-bold text-slate-900 text-xs leading-snug">{ds.name}</h3>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                      ds.classification === 'OFFICIAL'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : ds.classification === 'NORMATIVE BENCHMARK'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}>
                      {ds.classification}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Source / Custodian:</span>
                      <span className="text-slate-800 font-semibold">{ds.source}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Temporal Period:</span>
                      <span className="text-slate-800 font-semibold">{ds.year}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block font-medium">Spatial Resolution:</span>
                      <span className="text-slate-800 font-mono">{ds.res}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">Purpose:</strong> {ds.use}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    <strong>Limitation Note:</strong> {ds.limitations}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: METHODOLOGY & VISUAL FLOW */}
        {activeTab === 'methodology' && (
          <div className="space-y-5">
            
            {/* VISUAL FLOW DIAGRAM */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                End-to-End Decision Architecture Workflow
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {methodologyFlow.map((step) => {
                  const isExpanded = expandedStep === step.id;
                  return (
                    <div
                      key={step.id}
                      className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3.5 space-y-2 hover:border-indigo-300 transition cursor-pointer shadow-2xs"
                      onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-2xs">
                          {step.id}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Click to expand</span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-xs uppercase">{step.title}</h3>
                      <p className="text-[10px] text-indigo-700 font-semibold">{step.sub}</p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{step.desc}</p>
                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-200 text-[10px] text-emerald-800 font-mono bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                          <strong>Formula / Tech:</strong> {step.tech}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AHP CRITERIA WEIGHTS TABLE */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  AHP Pairwise Criteria Matrix &amp; Weights
                </h3>
                <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  CR = 0.003836 &lt; 0.10 (Consistent)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-rose-200 text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-rose-700 block uppercase">Hazard Exposure (C1)</span>
                  <strong className="text-xl font-black text-rose-700 font-mono block mt-1">42.31%</strong>
                  <span className="text-[10px] text-slate-500 font-medium">Weight: 0.4231</span>
                </div>

                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-amber-200 text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-amber-700 block uppercase">Community Sensitivity (C2)</span>
                  <strong className="text-xl font-black text-amber-700 font-mono block mt-1">22.74%</strong>
                  <span className="text-[10px] text-slate-500 font-medium">Weight: 0.2274</span>
                </div>

                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-sky-200 text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-sky-700 block uppercase">Capacity Stress (C3)</span>
                  <strong className="text-xl font-black text-sky-700 font-mono block mt-1">22.74%</strong>
                  <span className="text-[10px] text-slate-500 font-medium">Weight: 0.2274</span>
                </div>

                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-purple-200 text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-purple-700 block uppercase">Accessibility (C4)</span>
                  <strong className="text-xl font-black text-purple-700 font-mono block mt-1">12.20%</strong>
                  <span className="text-[10px] text-slate-500 font-medium">Weight: 0.1220</span>
                </div>
              </div>
            </div>

            {/* EVIDENCE-BASED RELOCATION & SAFER LOCATIONS PROTOCOL */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Evidence-Based Potential Safer Locations Protocol ({currentState.name})
                </h3>
                <span className="text-xs font-mono text-indigo-700 font-bold bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                  Decision Hierarchy: Safety &gt; Capacity &gt; Access &gt; Distance
                </span>
              </div>
              
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2">
                <p>
                  <strong>RakshaSethu does not enforce a fixed evacuation distance or same-{currentState.adminUnitName.toLowerCase()}-only rule.</strong> For {currentState.name}, candidate locations are evaluated primarily on safety, capacity and accessibility, while distance and administrative proximity are treated as soft preferences. This allows the system to recommend a farther but safer and adequately resourced location when closer alternatives are unsuitable.
                </p>
                <p className="text-slate-600">
                  <strong>The 1.5–2 km NCRMP value is a cyclone shelter service/design radius, not a universal evacuation-distance limit.</strong> National Cyclone Risk Mitigation Project (NCRMP) architectural guidelines designate 1.5–2 km as the walking service catchment for immediate cyclone shelter access, not a barrier against inter-administrative evacuation or planned relocation corridors.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                    <div className="font-bold text-slate-900 text-[11px] uppercase">Decision A: Relocation Priority (AHP + TOPSIS)</div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      <em>"Which vulnerable {currentState.adminUnitPlural.toLowerCase()} need attention first?"</em> Synthesizes C1 Hazard (42.31%), C2 Sensitivity (22.74%), C3 Capacity Stress (22.74%), and C4 Accessibility (12.20%) to rank vulnerable source areas.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                    <div className="font-bold text-slate-900 text-[11px] uppercase">Decision B: Potential Safer Locations</div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      <em>"Where could affected people potentially be moved?"</em> Multi-criteria screening prioritizing Safety First (&lt;0.35 hazard), Capacity Second (&gt;500 m²/person safe headroom), Accessibility Third (&gt;0.15 road index), and Distance/Tier as soft coordination preferences.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: LIMITATIONS */}
        {activeTab === 'limitations' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Scientific Data Boundaries &amp; Methodological Transparency
            </h2>
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1 shadow-2xs">
                <strong className="text-slate-900 block font-bold">1. Demographic Temporal Baseline (Census 2011)</strong>
                <p className="text-slate-500 text-[11px]">
                  Census 2011 Primary Census Abstract (PCA) provides the sole official habitation-level enumeration in India. 16 mandals with 0 rural habitations (fully urban/industrial) are explicitly isolated as <em>INSUFFICIENT DATA</em> and never converted to false zero-risk scores.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1 shadow-2xs">
                <strong className="text-slate-900 block font-bold">2. Vulnerable Group Age Demarcation (7+)</strong>
                <p className="text-slate-500 text-[11px]">
                  Adult population is strictly labeled <strong>7+</strong> rather than 7–59 because older persons are included in this aggregate PCA category. Dedicated older-person and disability counts are unavailable at mandal level.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1 shadow-2xs">
                <strong className="text-slate-900 block font-bold">3. Normative Infrastructure Headroom vs. Live Dispatch</strong>
                <p className="text-slate-500 text-[11px]">
                  Capacity scoring evaluates baseline infrastructure headroom against normative standards (e.g. 1.0 IPHS hospital bed / 1,000 population). It does not represent live emergency dispatch availability.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GOVERNANCE */}
        {activeTab === 'governance' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Human-in-the-Loop Governance &amp; Ethical Mandate
            </h2>
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2 text-xs text-slate-700 leading-relaxed shadow-2xs">
              <p>
                <strong className="text-slate-900">Decision Support Boundary:</strong> RakshaSethu is an explainable decision-support system designed to empower District Collectors, SDMA, and disaster superintendents with reproducible GIS multi-hazard rankings.
              </p>
              <p>
                <strong className="text-slate-900">No Automated Orders:</strong> The platform does not issue automated administrative relocation notices. All candidate planning locations require field engineering surveys, social consultation, and official administrative sanction.
              </p>
              <p>
                <strong className="text-slate-900">Ethical Neutrality:</strong> Demographic indicators reflect physical evacuation assistance logistics (care dependencies). No caste or social group is scored as inherently vulnerable.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
