import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GISMap } from '../components/map/GISMap';
import { MapLegend } from '../components/map/MapLegend';
import { StateOverviewCards } from '../components/dashboard/StateOverviewCards';
import { DistrictInfoPanel } from '../components/dashboard/DistrictInfoPanel';
import { MandalDetailPanel } from '../components/dashboard/MandalDetailPanel';
import { SimulationPanel } from '../components/dashboard/SimulationPanel';
import { METRIC_CONFIGS } from '../utils/mapUtils';
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
import type { ActiveTab } from '../types';
import { 
  AlertCircle, 
  RefreshCw, 
  Sliders, 
  Layers, 
  RotateCcw, 
  Maximize2, 
  Minimize2,
  AlertTriangle,
  Activity,
  Users,
  Scale,
  ShieldCheck,
  ChevronDown,
  Search,
  X
} from 'lucide-react';

interface GISPageProps {
  initialMetric?: DemographicMetricKey;
  initialOpenSimulation?: boolean;
  initialSelectedMandal?: MandalProperties | null;
  onNavigateToTab?: (tab: ActiveTab) => void;
}

import { useActiveState } from '../context/StateContext';

export const GISPage: React.FC<GISPageProps> = ({
  initialMetric = 'topsis_score',
  initialOpenSimulation = false,
  initialSelectedMandal = null,
  onNavigateToTab,
}) => {
  const { currentState } = useActiveState();
  // Data State
  const [districtsGeoJson, setDistrictsGeoJson] = useState<GeoJsonFeatureCollection<DistrictProperties> | null>(null);
  const [mandalsGeoJson, setMandalsGeoJson] = useState<GeoJsonFeatureCollection<MandalProperties> | null>(null);
  const [vulnerabilityGeoJson, setVulnerabilityGeoJson] = useState<GeoJsonFeatureCollection<MandalProperties> | null>(null);
  const [demographicsSummary, setDemographicsSummary] = useState<StateDemographicSummary | null>(null);
  const [selectedDistrictDetail, setSelectedDistrictDetail] = useState<DistrictDetailResponse | null>(null);
  const [selectedMandal, setSelectedMandal] = useState<MandalProperties | null>(initialSelectedMandal);

  // Drawer / Modal States
  const [showSimulationModal, setShowSimulationModal] = useState<boolean>(initialOpenSimulation);
  const [, setLatestSimulation] = useState<SimulationRunResponse | null>(null);

  // Loading & Error States
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [loadingDistrict, setLoadingDistrict] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOfflineFallback, setIsOfflineFallback] = useState<boolean>(false);

  // Interactive Map Controls
  const [activeMetric, setActiveMetric] = useState<DemographicMetricKey>(initialMetric);
  const [priorityFilter, setPriorityFilter] = useState<'VERY_HIGH' | 'MODERATE' | 'LOW' | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [showMandals, setShowMandals] = useState<boolean>(false);
  const [showFloodWms, setShowFloodWms] = useState<boolean>(false);
  const [showSheltersWms, setShowSheltersWms] = useState<boolean>(false);
  const [showHabitationsWms, setShowHabitationsWms] = useState<boolean>(false);
  const [resetViewTrigger, setResetViewTrigger] = useState<number>(0);
  const [isFullscreenMap, setIsFullscreenMap] = useState<boolean>(false);
  const [showLayerDropdown, setShowLayerDropdown] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(true);

  // Stable selection & reset callbacks to prevent resetting interaction state
  const handleSelectDistrict = useCallback((id: string | null) => {
    setSelectedDistrictId(id);
    if (id) setSelectedMandal(null);
  }, []);

  const handleSelectMandal = useCallback((m: MandalProperties | null) => {
    setSelectedMandal(m);
    if (m) setSelectedDistrictId(null);
  }, []);

  const handleResetView = useCallback(() => {
    setResetViewTrigger((n) => n + 1);
    setSelectedMandal(null);
    setSelectedDistrictId(null);
    setActiveMetric('topsis_score');
    setPriorityFilter(null);
    setSearchQuery('');
    setShowSearchResults(false);
  }, []);

  // Quick Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

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

  // Reset selections & layers on state change
  useEffect(() => {
    setSelectedMandal(null);
    setSelectedDistrictId(null);
    setMandalsGeoJson(null);
    setDistrictsGeoJson(null);
    setVulnerabilityGeoJson(null);
    setDemographicsSummary(null);
  }, [currentState.id]);

  // Initial Data Load
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      setLoadingData(true);
      setErrorMessage(null);
      setIsOfflineFallback(false);
      try {
        const districts = await fetchDistrictsGeoJson(currentState.id);
        if (isMounted) setDistrictsGeoJson(districts);

        try {
          const [summary, vulnGeo, capGeo, relocGeo] = await Promise.all([
            fetchDemographicsSummary(currentState.id),
            fetchVulnerabilityGeoJson(undefined, currentState.id),
            fetchCapacityGeoJson(undefined, currentState.id),
            fetchRelocationGeoJson(undefined, currentState.id),
          ]);
          if (isMounted) {
            setDemographicsSummary(summary);

            const getUnitId = (props: any): string => {
              return String(
                props?.mandal_id ||
                props?.circle_id ||
                props?.block_id ||
                props?.tehsil_id ||
                props?.taluk_id ||
                props?.subdivision_id ||
                props?.mandal_code ||
                props?.block_code ||
                props?.circle_code ||
                props?.tehsil_code ||
                ''
              ).trim();
            };

            const capMap = new Map<string, any>();
            for (const f of capGeo.features) {
              const mid = getUnitId(f.properties);
              if (mid) capMap.set(mid, f.properties);
            }

            const relocMap = new Map<string, any>();
            for (const f of relocGeo.features) {
              const mid = getUnitId(f.properties);
              if (mid) relocMap.set(mid, f.properties);
            }

            const mergedFeatures = vulnGeo.features.map((f: any) => {
              const mid = getUnitId(f.properties);
              const capProps = mid ? (capMap.get(mid) || {}) : {};
              const relocProps = mid ? (relocMap.get(mid) || {}) : {};
              const unitName = f.properties?.mandal_name || f.properties?.block_name || f.properties?.circle_name || f.properties?.tehsil_name || f.properties?.taluk_name || f.properties?.subdivision_name || mid;
              return {
                ...f,
                properties: {
                  ...f.properties,
                  mandal_id: mid || f.properties?.mandal_id,
                  mandal_name: unitName,
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
        } catch (backendErr: any) {
          console.warn('Backend dynamic layers unavailable, using static boundaries:', backendErr);
          if (isMounted) {
            setIsOfflineFallback(true);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to load GIS data.');
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
  }, [currentState.id]);

  // Lazy Load Mandals if toggled on
  useEffect(() => {
    let isMounted = true;
    if (showMandals && !mandalsGeoJson) {
      fetchMandalsGeoJson(undefined, currentState.id)
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
  }, [showMandals, mandalsGeoJson, currentState.id]);

  // Load detailed district breakdown when a district is selected
  useEffect(() => {
    let isMounted = true;
    if (!selectedDistrictId) {
      setSelectedDistrictDetail(null);
      return;
    }

    setLoadingDistrict(true);
    fetchDistrictDemographics(selectedDistrictId, currentState.id)
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
  }, [selectedDistrictId, currentState.id]);

  // All Mandal properties for priority directory and search
  const allMandalProps = useMemo(() => {
    if (!vulnerabilityGeoJson) return [];
    return vulnerabilityGeoJson.features.map((f: any) => f.properties as MandalProperties);
  }, [vulnerabilityGeoJson]);

  // Search filter
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return allMandalProps
      .filter((m) => {
        const name = (m.mandal_name || m.DMNAME || '').toLowerCase();
        const dist = (m.current_district_name || m.DNAME || '').toLowerCase();
        return name.includes(q) || dist.includes(q);
      })
      .slice(0, 8);
  }, [allMandalProps, searchQuery]);

  // Simulation Callback
  const handleSimulationRun = (sim: SimulationRunResponse | null) => {
    setLatestSimulation(sim);
    if (sim && vulnerabilityGeoJson) {
      const simMap = new Map<string, any>();
      for (const m of sim.mandals) {
        simMap.set(m.mandal_id, m);
      }

      const updatedFeatures = vulnerabilityGeoJson.features.map((f: any) => {
        const mid = f.properties?.mandal_id;
        const res = mid ? simMap.get(mid) : null;
        if (!res) return f;
        return {
          ...f,
          properties: {
            ...f.properties,
            scenario_topsis_score: res.scenario_topsis_score,
            scenario_category: res.scenario_category,
            scenario_rank: res.scenario_rank,
            score_change: res.score_change,
            rank_change: res.rank_change,
            change_direction: res.change_direction,
          },
        };
      });

      setVulnerabilityGeoJson({
        type: 'FeatureCollection',
        features: updatedFeatures,
      });

      setActiveMetric('scenario_topsis_score');
    }
  };

  const analyticalLayers = [
    {
      id: 'topsis_score' as DemographicMetricKey,
      label: 'Relocation Planning (TOPSIS)',
      sub: 'Multi-Criteria Decision Analysis Ranking',
      icon: AlertTriangle,
      color: 'text-rose-500',
      activeBg: 'bg-rose-50 text-rose-800 border-rose-200 shadow-xs',
    },
    {
      id: 'hazard_exposure' as DemographicMetricKey,
      label: 'Multi-Hazard Risk Exposure',
      sub: 'Flood, Cyclone Wind & Coastal Surge',
      icon: Activity,
      color: 'text-sky-500',
      activeBg: 'bg-sky-50 text-sky-800 border-sky-200 shadow-xs',
    },
    {
      id: 'demographic_sensitivity' as DemographicMetricKey,
      label: 'Community Vulnerability (PCA)',
      sub: 'Census 2011 Children & Dependent Care',
      icon: Users,
      color: 'text-amber-500',
      activeBg: 'bg-amber-50 text-amber-800 border-amber-200 shadow-xs',
    },
    {
      id: 'shelter_capacity' as DemographicMetricKey,
      label: 'Emergency Shelter Capacity',
      sub: 'Designated Relief Capacity per 1k Pop',
      icon: Scale,
      color: 'text-emerald-500',
      activeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs',
    },
    {
      id: 'safe_area_fraction' as DemographicMetricKey,
      label: `Candidate Host Locations (${currentState.candidateHostsCount || 45})`,
      sub: 'Safe Habitable Area Fraction',
      icon: ShieldCheck,
      color: 'text-purple-500',
      activeBg: 'bg-purple-50 text-purple-800 border-purple-200 shadow-xs',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 select-none">
      
      {/* ERROR ALERT BANNER */}
      {errorMessage && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-1 underline hover:text-rose-100 font-semibold"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reload Application</span>
          </button>
        </div>
      )}

      {/* OFFLINE RESILIENCE BANNER */}
      {isOfflineFallback && !errorMessage && (
        <div className="bg-amber-500/95 text-amber-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shrink-0 shadow-sm border-b border-amber-600/30">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-950" />
            <span>Backend offline - showing limited data</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-1 underline hover:text-amber-900 font-bold"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* MAIN WORKSPACE: MAP DOMINANT + RIGHT COMMAND / INTELLIGENCE PANEL */}
      <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden relative gap-2.5">
        
        {/* CENTER COLUMN: TOP CONTROLS + CONTAINED HERO MAP + BOTTOM STATUS STRIP */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative order-1 gap-2">
          
          {/* 1. TOP CONTROLS ROW (Above Map Card, matching Reference Screenshot 2) */}
          <div className="flex items-center justify-between gap-2.5 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs shrink-0 flex-wrap select-none">
            
            {/* Left: Priority Level 3-Filter Control Bar */}
            {(activeMetric === 'topsis_score' || activeMetric === 'scenario_topsis_score') ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500">
                  Priority Level:
                </span>
                <button
                  onClick={() => setPriorityFilter(null)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    priorityFilter === null
                      ? 'bg-slate-100 text-slate-900 border border-slate-300 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setPriorityFilter((prev) => (prev === 'VERY_HIGH' ? null : 'VERY_HIGH'))}
                  className={`px-2 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                    priorityFilter === 'VERY_HIGH'
                      ? 'bg-red-50 text-red-700 border border-red-200 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-red-600 hover:bg-slate-50'
                  }`}
                >
                  <span>🔴</span>
                  <span>Very High</span>
                </button>
                <button
                  onClick={() => setPriorityFilter((prev) => (prev === 'MODERATE' ? null : 'MODERATE'))}
                  className={`px-2 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                    priorityFilter === 'MODERATE'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-amber-700 hover:bg-slate-50'
                  }`}
                >
                  <span>🟡</span>
                  <span>Moderate</span>
                </button>
                <button
                  onClick={() => setPriorityFilter((prev) => (prev === 'LOW' ? null : 'LOW'))}
                  className={`px-2 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                    priorityFilter === 'LOW'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                  }`}
                >
                  <span>🟢</span>
                  <span>Low</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-semibold">
                <span>Active Layer:</span>
                <span className="font-bold">{METRIC_CONFIGS[activeMetric]?.label || activeMetric}</span>
              </div>
            )}

            {/* Middle: Quick Search Box */}
            <div className="relative">
              <div className="flex items-center bg-slate-50/80 border border-slate-200/90 rounded-lg px-2.5 py-1 shadow-2xs">
                <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  placeholder={`Search ${currentState.adminUnitName}...`}
                  className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-36 sm:w-48"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Search Dropdown Results */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute left-0 top-9 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50 divide-y divide-slate-100 max-h-60 overflow-y-auto custom-scrollbar">
                  {searchResults.map((m, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedMandal(m);
                        setSearchQuery('');
                        setShowSearchResults(false);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-50 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800 uppercase">{m.mandal_name || m.DMNAME}</div>
                        <div className="text-[10px] text-slate-500">{m.current_district_name || m.DNAME} District</div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-indigo-600">
                        {m.topsis_score ? Number(m.topsis_score).toFixed(3) : '—'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Reset View & Toggle Legend */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleResetView}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-semibold shadow-2xs transition"
                title={`Reset Map View to Full ${currentState.name}`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Reset View</span>
              </button>

              <button
                onClick={() => setShowLegend((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold shadow-2xs transition ${
                  showLegend
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200/90'
                }`}
                title="Toggle Legend"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Legend</span>
              </button>
            </div>

          </div>

          {/* 2. CONTAINED HERO MAP CARD (Rounded card with dot grid) */}
          <div className="flex-1 relative w-full h-full bg-white bg-gis-grid rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <GISMap
              districtsGeoJson={districtsGeoJson}
              vulnerabilityGeoJson={vulnerabilityGeoJson}
              demographicsSummary={demographicsSummary}
              activeMetric={activeMetric}
              selectedDistrictId={selectedDistrictId}
              selectedMandal={selectedMandal}
              onSelectDistrict={handleSelectDistrict}
              onSelectMandal={handleSelectMandal}
              mandalsGeoJson={mandalsGeoJson}
              showMandals={showMandals}
              showFloodWms={showFloodWms}
              showSheltersWms={showSheltersWms}
              showHabitationsWms={showHabitationsWms}
              resetViewTrigger={resetViewTrigger}
              priorityFilter={priorityFilter}
            />

            {/* Floating Top-Left Controls inside Map (Fullscreen & Overlays) */}
            <div className="absolute top-3 left-3 z-30 flex items-center gap-2 pointer-events-auto">
              
              {/* Fullscreen Toggle */}
              <button
                onClick={() => setIsFullscreenMap((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-700 border border-slate-200/90 text-xs font-semibold shadow-xs transition backdrop-blur-xs"
                title={isFullscreenMap ? 'Exit Fullscreen' : 'Fullscreen Map'}
              >
                {isFullscreenMap ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-slate-600" />
                    <span className="hidden sm:inline">Normal</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                    <span className="hidden sm:inline">Fullscreen</span>
                  </>
                )}
              </button>

              {/* Overlays Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowLayerDropdown((prev) => !prev)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-700 border border-slate-200/90 text-xs font-semibold shadow-xs transition backdrop-blur-xs"
                  title="Toggle GIS Overlays"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  <span className="hidden md:inline">Overlays</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showLayerDropdown && (
                  <div className="absolute left-0 top-10 w-56 bg-white border border-slate-200 rounded-xl p-3 shadow-lg space-y-2 z-50 animate-in fade-in">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
                      Map Layers &amp; Overlays
                    </p>
                    <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showMandals}
                        onChange={() => setShowMandals((prev) => !prev)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                      />
                      <span>Mandal Boundaries (696)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showFloodWms}
                        onChange={() => setShowFloodWms((prev) => !prev)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                      />
                      <span>Flood Inundation Overlay</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSheltersWms}
                        onChange={() => setShowSheltersWms((prev) => !prev)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                      />
                      <span>Cyclone Relief Shelters</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showHabitationsWms}
                        onChange={() => setShowHabitationsWms((prev) => !prev)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                      />
                      <span>Rural Habitations Overlay</span>
                    </label>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom-Right Floating Legend */}
            {showLegend && (
              <div className="absolute bottom-4 right-4 z-20 pointer-events-auto animate-in fade-in">
                <MapLegend activeMetric={activeMetric} />
              </div>
            )}

            {/* What-If Simulation Floating Modal */}
            {showSimulationModal && (
              <div className="absolute top-4 left-4 sm:left-12 z-40 pointer-events-auto w-full max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar shadow-xl animate-in fade-in zoom-in-95 bg-white border border-slate-200 rounded-2xl p-4">
                <SimulationPanel
                  onSimulationRun={handleSimulationRun}
                  activeMetric={activeMetric}
                  onMetricSelect={setActiveMetric}
                  selectedMandalId={selectedMandal?.mandal_id}
                />
              </div>
            )}

          </div>

          {/* 3. BOTTOM STATUS / INFORMATION STRIP (Matches reference UI exactly) */}
          <footer className="bg-white border border-slate-200/90 rounded-xl px-4 py-2 text-xs text-slate-600 flex flex-col md:flex-row items-center justify-between gap-2.5 shrink-0 z-10 select-none shadow-2xs">
            
            {/* 3 Concepts: People First, Community Driven, Always Ready */}
            <div className="flex items-center gap-5 sm:gap-6 flex-wrap">
              
              {/* Concept 1: People First */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Users className="w-3 h-3" />
                </div>
                <div>
                  <div className="font-bold text-[10.5px] text-slate-800 leading-tight">People First</div>
                  <div className="text-[9.5px] text-slate-400 leading-none">Human-centered approach</div>
                </div>
              </div>

              <div className="hidden sm:block h-5 w-px bg-slate-200" />

              {/* Concept 2: Community Driven */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Activity className="w-3 h-3" />
                </div>
                <div>
                  <div className="font-bold text-[10.5px] text-slate-800 leading-tight">Community Driven</div>
                  <div className="text-[9.5px] text-slate-400 leading-none">Collaborative resilience</div>
                </div>
              </div>

              <div className="hidden sm:block h-5 w-px bg-slate-200" />

              {/* Concept 3: Always Ready */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                </div>
                <div>
                  <div className="font-bold text-[10.5px] text-slate-800 leading-tight">Always Ready</div>
                  <div className="text-[9.5px] text-slate-400 leading-none">Prepared for tomorrow</div>
                </div>
              </div>

            </div>

            {/* Right Side: Data Governance Status */}
            <div className="text-[9.5px] text-slate-500 font-medium text-right leading-tight">
              <div><strong>Data Governance:</strong> Census 2011 PCA &bull; Phase 2C Multi-Hazard Risk</div>
              <div className="text-slate-400">&bull; TOPSIS Relocation Engine &bull; Decision Support Prototype</div>
            </div>

          </footer>

        </div>

        {/* RIGHT SIDE: INTELLIGENCE PANEL (290-330px width, full height) */}
        {!isFullscreenMap && (
          <aside className="w-full lg:w-[315px] xl:w-[325px] h-full bg-white border border-slate-200/90 rounded-2xl shadow-sm flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-3.5 space-y-3 z-20 order-2">
            
            {/* If a Mandal is selected -> Display the Detailed Mandal Intelligence Panel */}
            {selectedMandal ? (
              <div className="animate-in fade-in duration-150">
                <MandalDetailPanel
                  mandal={selectedMandal}
                  onClose={() => setSelectedMandal(null)}
                  onNavigateToActionPlan={() => onNavigateToTab?.('actions')}
                  onNavigateToDirectory={() => onNavigateToTab?.('priority_directory')}
                />
              </div>
            ) : (
              /* If no Mandal is selected -> Display State Overview & Analytical Layers */
              <>
                {/* 1. Andhra Pradesh State-Level Decision-Support Overview */}
                <StateOverviewCards summary={demographicsSummary} loading={loadingData} />

                {/* 2. Analytical Decision Layer Selector */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-3 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Analytical Map Layers</span>
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-semibold">
                      MCDA
                    </span>
                  </div>

                  <div className="space-y-1">
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
                          className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between border text-xs ${
                            isActive
                              ? layer.activeBg
                              : 'bg-slate-50/70 hover:bg-slate-100 text-slate-700 border-slate-200/70'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                            <div className="p-1.5 rounded-lg bg-white border border-slate-200/80 shrink-0 shadow-2xs">
                              <Icon className={`w-3.5 h-3.5 ${layer.color}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11.5px] font-bold leading-tight">{layer.label}</p>
                              <p className="text-[9.5px] text-slate-400 font-medium leading-tight mt-0.5">{layer.sub}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. What-If Simulation Engine Trigger */}
                <button
                  onClick={() => setShowSimulationModal((prev) => !prev)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-xs border ${
                    showSimulationModal
                      ? 'bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-200'
                      : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>What-If Simulation Engine</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                    {showSimulationModal ? 'Close' : 'Simulate'}
                  </span>
                </button>

                {/* District Detail Panel if selected in demographic mode */}
                {selectedDistrictId && !isAnalyticalMode && (
                  <div className="mt-2 animate-in fade-in duration-150">
                    <DistrictInfoPanel
                      districtDetail={selectedDistrictDetail}
                      loading={loadingDistrict}
                      onClose={() => setSelectedDistrictId(null)}
                    />
                  </div>
                )}
              </>
            )}

          </aside>
        )}

      </div>

    </div>
  );
};
