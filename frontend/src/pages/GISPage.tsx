import React, { useState, useEffect, useMemo } from 'react';
import { GISMap } from '../components/map/GISMap';
import { MapLegend } from '../components/map/MapLegend';
import { StateOverviewCards } from '../components/dashboard/StateOverviewCards';
import { DistrictInfoPanel } from '../components/dashboard/DistrictInfoPanel';
import { MandalDetailPanel } from '../components/dashboard/MandalDetailPanel';
import { SimulationPanel } from '../components/dashboard/SimulationPanel';
import { PriorityListPanel } from '../components/dashboard/PriorityListPanel';
import {
  fetchDistrictsGeoJson,
  fetchMandalsGeoJson,
  fetchVulnerabilityGeoJson,
  fetchCapacityGeoJson,
  fetchRelocationGeoJson,
  fetchDemographicsSummary,
  fetchDistrictDemographics,
} from '../services/api';
import type {
  GeoJsonFeatureCollection,
  DistrictProperties,
  MandalProperties,
  DemographicMetricKey,
} from '../types/gis';
import type {
  StateDemographicSummary,
  DistrictDetailResponse,
} from '../types/demographics';
import type { SimulationRunResponse } from '../types/simulation';
import { 
  AlertCircle, 
  RefreshCw, 
  Sliders, 
  ListFilter, 
  Layers, 
  RotateCcw, 
  Maximize2, 
  Minimize2,
  AlertTriangle,
  Activity,
  Users,
  Scale,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

interface GISPageProps {
  initialMetric?: DemographicMetricKey;
  initialOpenSimulation?: boolean;
}

export const GISPage: React.FC<GISPageProps> = ({
  initialMetric = 'topsis_score',
  initialOpenSimulation = false,
}) => {
  // Data State
  const [districtsGeoJson, setDistrictsGeoJson] = useState<GeoJsonFeatureCollection<DistrictProperties> | null>(null);
  const [mandalsGeoJson, setMandalsGeoJson] = useState<GeoJsonFeatureCollection<MandalProperties> | null>(null);
  const [vulnerabilityGeoJson, setVulnerabilityGeoJson] = useState<GeoJsonFeatureCollection<MandalProperties> | null>(null);
  const [demographicsSummary, setDemographicsSummary] = useState<StateDemographicSummary | null>(null);
  const [selectedDistrictDetail, setSelectedDistrictDetail] = useState<DistrictDetailResponse | null>(null);
  const [selectedMandal, setSelectedMandal] = useState<MandalProperties | null>(null);

  // Drawer / Modal States
  const [showPriorityList, setShowPriorityList] = useState<boolean>(false);
  const [showSimulationModal, setShowSimulationModal] = useState<boolean>(initialOpenSimulation);
  const [, setLatestSimulation] = useState<SimulationRunResponse | null>(null);

  // Loading & Error States
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [loadingDistrict, setLoadingDistrict] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Interactive Map Controls
  const [activeMetric, setActiveMetric] = useState<DemographicMetricKey>(initialMetric);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [showMandals, setShowMandals] = useState<boolean>(false);
  const [showFloodWms, setShowFloodWms] = useState<boolean>(false);
  const [showSheltersWms, setShowSheltersWms] = useState<boolean>(false);
  const [showHabitationsWms, setShowHabitationsWms] = useState<boolean>(false);
  const [resetViewTrigger, setResetViewTrigger] = useState<number>(0);
  const [isFullscreenMap, setIsFullscreenMap] = useState<boolean>(false);
  const [showLayerDropdown, setShowLayerDropdown] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(true);

  const isAnalyticalMode = [
    'topsis_score',
    'scenario_topsis_score',
    'priority_change',
    'vulnerability',
    'hazard_exposure',
    'demographic_sensitivity',
    'shelter_capacity',
    'road_density',
    'safe_area_fraction',
    'water_sanitation',
    'health_beds',
  ].includes(activeMetric);

  // Initial Data Load
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      setLoadingData(true);
      setErrorMessage(null);
      try {
        const [districts, summary, vulnGeo, capGeo, relocGeo] = await Promise.all([
          fetchDistrictsGeoJson(),
          fetchDemographicsSummary(),
          fetchVulnerabilityGeoJson(),
          fetchCapacityGeoJson(),
          fetchRelocationGeoJson(),
        ]);
        if (isMounted) {
          setDistrictsGeoJson(districts);
          setDemographicsSummary(summary);

          const capMap = new Map<string, any>();
          for (const f of capGeo.features) {
            const mid = f.properties?.mandal_id;
            if (mid) capMap.set(mid, f.properties);
          }

          const relocMap = new Map<string, any>();
          for (const f of relocGeo.features) {
            const mid = f.properties?.mandal_id;
            if (mid) relocMap.set(mid, f.properties);
          }

          const mergedFeatures = vulnGeo.features.map((f: any) => {
            const mid = f.properties?.mandal_id;
            const capProps = mid ? capMap.get(mid) : {};
            const relocProps = mid ? relocMap.get(mid) : {};
            return {
              ...f,
              properties: {
                ...f.properties,
                ...capProps,
                ...relocProps,
              },
            };
          });

          setVulnerabilityGeoJson({
            type: 'FeatureCollection',
            features: mergedFeatures,
          });
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to load GIS and demographic data.');
        }
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Lazy Load Mandals if toggled on
  useEffect(() => {
    let isMounted = true;
    if (showMandals && !mandalsGeoJson) {
      fetchMandalsGeoJson()
        .then((data) => {
          if (isMounted) setMandalsGeoJson(data);
        })
        .catch((err) => {
          console.error('Failed to load mandals:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [showMandals, mandalsGeoJson]);

  // Load detailed district breakdown when a district is selected
  useEffect(() => {
    let isMounted = true;
    if (!selectedDistrictId) {
      setSelectedDistrictDetail(null);
      return;
    }

    setLoadingDistrict(true);
    fetchDistrictDemographics(selectedDistrictId)
      .then((detail) => {
        if (isMounted) setSelectedDistrictDetail(detail);
      })
      .catch((err) => {
        console.error(`Error loading district ${selectedDistrictId}:`, err);
        if (isMounted) setSelectedDistrictDetail(null);
      })
      .finally(() => {
        if (isMounted) setLoadingDistrict(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDistrictId]);

  // Flatten mandals for PriorityListPanel
  const allMandalProps = useMemo(() => {
    if (!vulnerabilityGeoJson) return [];
    return vulnerabilityGeoJson.features.map((f: any) => f.properties);
  }, [vulnerabilityGeoJson]);

  const handleSimulationRun = (res: SimulationRunResponse | null) => {
    setLatestSimulation(res);
    if (!res || !vulnerabilityGeoJson) return;

    const simMap = new Map<string, any>();
    for (const m of res.mandals) {
      simMap.set(m.mandal_id, m);
    }

    const updatedFeatures = vulnerabilityGeoJson.features.map((f: any) => {
      const mid = f.properties?.mandal_id;
      const simData = mid ? simMap.get(mid) : null;
      if (!simData) return f;
      return {
        ...f,
        properties: {
          ...f.properties,
          scenario_topsis_score: simData.scenario_topsis_score,
          scenario_category: simData.scenario_category,
          scenario_rank: simData.scenario_rank,
          scenario_primary_factor: simData.scenario_primary_factor,
          scenario_secondary_factor: simData.scenario_secondary_factor,
          score_change: simData.score_change,
          rank_change: simData.rank_change,
          category_change: simData.category_change,
          change_direction: simData.change_direction,
          scenario_c1_hazard: simData.scenario_c1_hazard,
          scenario_c2_demography: simData.scenario_c2_demography,
          scenario_c3_capacity: simData.scenario_c3_capacity,
          scenario_c4_accessibility: simData.scenario_c4_accessibility,
          scenario_explanation: simData.scenario_explanation,
        },
      };
    });

    setVulnerabilityGeoJson({
      type: 'FeatureCollection',
      features: updatedFeatures,
    });

    if (selectedMandal?.mandal_id) {
      const updatedM = simMap.get(selectedMandal.mandal_id);
      if (updatedM) {
        setSelectedMandal({
          ...selectedMandal,
          scenario_topsis_score: updatedM.scenario_topsis_score,
          scenario_category: updatedM.scenario_category,
          scenario_rank: updatedM.scenario_rank,
          scenario_primary_factor: updatedM.scenario_primary_factor,
          scenario_secondary_factor: updatedM.scenario_secondary_factor,
          score_change: updatedM.score_change,
          rank_change: updatedM.rank_change,
          category_change: updatedM.category_change,
          change_direction: updatedM.change_direction,
          scenario_c1_hazard: updatedM.scenario_c1_hazard,
          scenario_c2_demography: updatedM.scenario_c2_demography,
          scenario_c3_capacity: updatedM.scenario_c3_capacity,
          scenario_c4_accessibility: updatedM.scenario_c4_accessibility,
          scenario_explanation: updatedM.scenario_explanation,
        });
      }
    }
  };

  const analyticalLayers = [
    {
      id: 'topsis_score' as DemographicMetricKey,
      label: 'Relocation Planning (TOPSIS)',
      sub: 'Multi-Criteria Decision Analysis Ranking',
      icon: AlertTriangle,
      color: 'text-rose-400',
      activeBg: 'bg-rose-500/20 text-rose-200 border-rose-500/40 ring-1 ring-rose-500/30',
    },
    {
      id: 'hazard_exposure' as DemographicMetricKey,
      label: 'Multi-Hazard Risk Exposure',
      sub: 'Flood, Cyclone Wind & Coastal Surge',
      icon: Activity,
      color: 'text-sky-400',
      activeBg: 'bg-sky-500/20 text-sky-200 border-sky-500/40 ring-1 ring-sky-500/30',
    },
    {
      id: 'demographic_sensitivity' as DemographicMetricKey,
      label: 'Community Vulnerability (PCA)',
      sub: 'Census 2011 SC/ST & Housing Sensitivity',
      icon: Users,
      color: 'text-purple-400',
      activeBg: 'bg-purple-500/20 text-purple-200 border-purple-500/40 ring-1 ring-purple-500/30',
    },
    {
      id: 'shelter_capacity' as DemographicMetricKey,
      label: 'Emergency Shelter Capacity',
      sub: 'Designated Relief Capacity per 1k Pop',
      icon: Scale,
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 ring-1 ring-emerald-500/30',
    },
    {
      id: 'safe_area_fraction' as DemographicMetricKey,
      label: 'Candidate Host Locations (51)',
      sub: 'Safe Habitable Area Fraction',
      icon: ShieldCheck,
      color: 'text-amber-400',
      activeBg: 'bg-amber-500/20 text-amber-200 border-amber-500/40 ring-1 ring-amber-500/30',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 select-none">
      
      {/* Error Banner if any */}
      {errorMessage && (
        <div className="bg-rose-500/10 border-b border-rose-500/25 px-4 py-2 flex items-center justify-between text-rose-300 text-xs shrink-0">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold transition"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Main Workspace: Large AP Hero Map (Left & Center) + Right Quick Overview (in blank space) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* MAIN / LEFT AREA: LARGE HERO ANDHRA PRADESH MAP */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-950 order-1">
          
          {/* Main Leaflet Map Viewport */}
          <div className="relative flex-1 w-full h-full z-0">
            <GISMap
              districtsGeoJson={districtsGeoJson}
              mandalsGeoJson={mandalsGeoJson}
              vulnerabilityGeoJson={vulnerabilityGeoJson}
              demographicsSummary={demographicsSummary}
              activeMetric={activeMetric}
              selectedDistrictId={selectedDistrictId}
              selectedMandal={selectedMandal}
              onSelectDistrict={setSelectedDistrictId}
              onSelectMandal={setSelectedMandal}
              showMandals={showMandals}
              showFloodWms={showFloodWms}
              showSheltersWms={showSheltersWms}
              showHabitationsWms={showHabitationsWms}
              resetViewTrigger={resetViewTrigger}
            />

            {/* Top-Left Floating Controls Group (Compact, Clean) */}
            <div className="absolute top-4 left-4 z-30 flex items-center gap-2 pointer-events-auto">
              
              {/* Reset View Button */}
              <button
                onClick={() => {
                  setResetViewTrigger((n) => n + 1);
                  setSelectedMandal(null);
                  setSelectedDistrictId(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold backdrop-blur-md shadow-lg transition"
                title="Reset Map to Full Andhra Pradesh View"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Reset View</span>
              </button>

              {/* Toggle Legend Button */}
              <button
                onClick={() => setShowLegend((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md shadow-lg transition ${
                  showLegend
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white border-slate-700/80'
                }`}
                title="Toggle Map Legend"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Legend</span>
              </button>

              {/* Fullscreen Map Toggle Button */}
              <button
                onClick={() => setIsFullscreenMap((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold backdrop-blur-md shadow-lg transition"
                title={isFullscreenMap ? 'Exit Map Fullscreen' : 'Expand Map Fullscreen'}
              >
                {isFullscreenMap ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Normal View</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                    <span className="hidden sm:inline">Fullscreen</span>
                  </>
                )}
              </button>

              {/* Optional Overlays Dropdown Trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowLayerDropdown((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold backdrop-blur-md shadow-lg transition"
                  title="Toggle GIS Data Overlays"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden md:inline">Overlays</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showLayerDropdown && (
                  <div className="absolute left-0 top-10 w-56 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl space-y-2 z-50 animate-in fade-in">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800">
                      Map Layers &amp; Overlays
                    </p>
                    <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showMandals}
                        onChange={() => setShowMandals((prev) => !prev)}
                        className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
                      />
                      <span>Mandal Boundaries (696)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showFloodWms}
                        onChange={() => setShowFloodWms((prev) => !prev)}
                        className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
                      />
                      <span>Flood Inundation Overlay</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSheltersWms}
                        onChange={() => setShowSheltersWms((prev) => !prev)}
                        className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
                      />
                      <span>Cyclone Relief Shelters</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showHabitationsWms}
                        onChange={() => setShowHabitationsWms((prev) => !prev)}
                        className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
                      />
                      <span>Rural Habitations Overlay</span>
                    </label>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom-Right Floating Legend (in the blank space over Bay of Bengal) */}
            {showLegend && (
              <div className="absolute bottom-6 right-6 z-20 pointer-events-auto animate-in fade-in">
                <MapLegend activeMetric={activeMetric} />
              </div>
            )}

            {/* Priority Area List Slide-Over Drawer */}
            {showPriorityList && (
              <div className="absolute top-0 left-0 bottom-0 w-80 sm:w-96 bg-slate-900/98 backdrop-blur-md border-r border-slate-800 shadow-2xl z-40 animate-in slide-in-from-left duration-200">
                <PriorityListPanel
                  mandals={allMandalProps}
                  selectedMandalId={selectedMandal?.mandal_id}
                  onSelectMandal={(m) => {
                    setSelectedMandal(m);
                  }}
                  onClose={() => setShowPriorityList(false)}
                />
              </div>
            )}

            {/* What-If Simulation Floating Modal */}
            {showSimulationModal && (
              <div className="absolute top-4 left-4 sm:left-12 z-40 pointer-events-auto w-full max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in fade-in zoom-in-95">
                <SimulationPanel
                  onSimulationRun={handleSimulationRun}
                  activeMetric={activeMetric}
                  onMetricSelect={setActiveMetric}
                  selectedMandalId={selectedMandal?.mandal_id}
                />
              </div>
            )}

            {/* Mandal Detail Panel Drawer (Slides in on Mandal Click) */}
            {selectedMandal && (
              <div className="absolute top-4 right-4 z-40 pointer-events-auto w-full max-w-lg max-h-[88vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in slide-in-from-right duration-200">
                <MandalDetailPanel
                  mandal={selectedMandal}
                  onClose={() => setSelectedMandal(null)}
                />
              </div>
            )}

            {/* District Detail Panel if selected in non-analytical mode */}
            {!selectedMandal && selectedDistrictId && !isAnalyticalMode && (
              <div className="absolute top-4 right-4 z-40 pointer-events-auto w-full max-w-md max-h-[88vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in slide-in-from-right duration-200">
                <DistrictInfoPanel
                  districtDetail={selectedDistrictDetail}
                  loading={loadingDistrict}
                  onClose={() => setSelectedDistrictId(null)}
                />
              </div>
            )}

          </div>

          {/* Bottom Data Governance and Sources Footer */}
          <footer className="bg-slate-950/95 border-t border-slate-800/80 px-4 py-2 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 z-10">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>
                <strong>Data Governance:</strong> Census 2011 PCA &bull; Phase 2C Multi-Hazard Risk &bull; TOPSIS Relocation Engine &bull; Decision Support Prototype.
              </span>
            </div>
            <div className="text-slate-400 font-mono text-[10px]">
              AP Jurisdiction: 26 Districts &bull; 696 Mandals
            </div>
          </footer>

        </div>

        {/* RIGHT SIDE: QUICK OVERVIEW & DECISION CONTROLLER (In the blank space on the right) */}
        {!isFullscreenMap && (
          <aside className="w-full lg:w-80 xl:w-96 bg-slate-900/90 border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-4 space-y-4 shadow-xl z-20 order-2">
            
            {/* 1. Compact Andhra Pradesh State Overview Cards */}
            <StateOverviewCards summary={demographicsSummary} loading={loadingData} />

            {/* 2. Analytical Decision Layer Selector */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Analytical Map Layer</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-semibold">
                  MCDA
                </span>
              </div>

              <div className="space-y-1.5">
                {analyticalLayers.map((layer) => {
                  const Icon = layer.icon;
                  const isActive = activeMetric === layer.id;
                  return (
                    <button
                      key={layer.id}
                      onClick={() => {
                        setActiveMetric(layer.id);
                        setSelectedMandal(null);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between border ${
                        isActive
                          ? layer.activeBg
                          : 'bg-slate-950/50 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg bg-slate-800 border border-slate-700/60 shrink-0`}>
                          <Icon className={`w-3.5 h-3.5 ${layer.color}`} />
                        </div>
                        <div className="min-w-0 truncate">
                          <p className="text-xs font-bold truncate leading-tight">{layer.label}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{layer.sub}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Action Buttons: Priority Directory & What-If Simulation */}
            <div className="space-y-2">
              <button
                onClick={() => setShowPriorityList((prev) => !prev)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md border ${
                  showPriorityList
                    ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-500/30'
                    : 'bg-slate-900/90 text-rose-300 border-rose-500/40 hover:bg-slate-850 hover:border-rose-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ListFilter className="w-4 h-4 text-rose-400" />
                  <span>Priority Area Directory (680)</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/80 text-rose-300">
                  {showPriorityList ? 'Close' : 'Explore'}
                </span>
              </button>

              <button
                onClick={() => setShowSimulationModal((prev) => !prev)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md border ${
                  showSimulationModal
                    ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/30'
                    : 'bg-slate-900/90 text-indigo-300 border-indigo-500/40 hover:bg-slate-850 hover:border-indigo-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>What-If Simulation Engine</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/80 text-indigo-300">
                  {showSimulationModal ? 'Close' : 'Simulate'}
                </span>
              </button>
            </div>

          </aside>
        )}

      </div>

    </div>
  );
};
