import React, { useState, useEffect, useMemo } from 'react';
import { GISMap } from '../components/map/GISMap';
import { MapControls } from '../components/map/MapControls';
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
import { AlertCircle, RefreshCw, Sliders, ListFilter } from 'lucide-react';

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

  // Interactive Controls (Default to Relocation Prioritization TOPSIS Score)
  const [activeMetric, setActiveMetric] = useState<DemographicMetricKey>(initialMetric);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [showMandals, setShowMandals] = useState<boolean>(false);
  const [showFloodWms, setShowFloodWms] = useState<boolean>(false);
  const [showSheltersWms, setShowSheltersWms] = useState<boolean>(false);
  const [showHabitationsWms, setShowHabitationsWms] = useState<boolean>(false);
  const [resetViewTrigger, setResetViewTrigger] = useState<number>(0);

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

  // Initial Data Load: 26 Districts + Demographic Summary + Vulnerability GeoJSON + Capacity GeoJSON + Relocation GeoJSON
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

          // Build map for capacity and relocation properties
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

  // Lazy Load Mandals when toggled on in demographic mode
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

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 space-y-3.5 overflow-hidden bg-slate-950 select-none">
      {/* Top Section: Executive Stats & Action Controls */}
      <div className="flex items-center justify-between gap-3.5">
        <div className="flex-1">
          <StateOverviewCards summary={demographicsSummary} loading={loadingData} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowPriorityList((prev) => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border font-bold text-xs transition-all shadow-md ${
              showPriorityList
                ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-500/30'
                : 'bg-slate-900/90 text-rose-300 border-rose-500/40 hover:bg-slate-850 hover:border-rose-400'
            }`}
          >
            <ListFilter className="w-4 h-4 text-rose-400" />
            <span>{showPriorityList ? 'Close Directory' : 'Priority Area List (680)'}</span>
          </button>

          <button
            onClick={() => setShowSimulationModal((prev) => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border font-bold text-xs transition-all shadow-md ${
              showSimulationModal
                ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/30'
                : 'bg-slate-900/90 text-indigo-300 border-indigo-500/40 hover:bg-slate-850 hover:border-indigo-400'
            }`}
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>{showSimulationModal ? 'Close Simulation' : 'What If Conditions Change?'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 flex items-center justify-between text-rose-300 text-xs shadow-sm">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Main Map & Interactive Layout Container */}
      <div className="relative flex-1 min-h-[550px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800/90 bg-slate-900 flex">
        {/* Optional Left Drawer: Priority Area List Panel */}
        {showPriorityList && (
          <div className="w-80 md:w-96 h-full shrink-0 z-30 animate-in slide-in-from-left-4 duration-200">
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

        {/* Hero GIS Map Container */}
        <div className="relative flex-1 h-full">
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

          {/* Top-Left Floating Controls */}
          <div className="absolute top-4 left-4 z-20 pointer-events-auto">
            <MapControls
              activeMetric={activeMetric}
              onSelectMetric={(m) => {
                setActiveMetric(m);
                setSelectedMandal(null);
              }}
              showMandals={showMandals}
              onToggleMandals={() => setShowMandals((prev) => !prev)}
              showFloodWms={showFloodWms}
              onToggleFloodWms={() => setShowFloodWms((prev) => !prev)}
              showSheltersWms={showSheltersWms}
              onToggleSheltersWms={() => setShowSheltersWms((prev) => !prev)}
              showHabitationsWms={showHabitationsWms}
              onToggleHabitationsWms={() => setShowHabitationsWms((prev) => !prev)}
              onResetView={() => {
                setResetViewTrigger((n) => n + 1);
                setSelectedMandal(null);
                setSelectedDistrictId(null);
              }}
            />
          </div>

          {/* Bottom-Left Floating Legend */}
          <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
            <MapLegend activeMetric={activeMetric} />
          </div>

          {/* What-If Simulation Floating Drawer */}
          {showSimulationModal && (
            <div className="absolute top-4 left-[340px] z-30 pointer-events-auto w-[420px] max-h-[85vh] overflow-y-auto custom-scrollbar">
              <SimulationPanel
                onSimulationRun={handleSimulationRun}
                activeMetric={activeMetric}
                onMetricSelect={setActiveMetric}
                selectedMandalId={selectedMandal?.mandal_id}
              />
            </div>
          )}

          {/* Right Floating Panels: Mandal Detail or District Info */}
          {selectedMandal && (
            <div className="absolute top-4 right-4 z-20 pointer-events-auto">
              <MandalDetailPanel
                mandal={selectedMandal}
                onClose={() => setSelectedMandal(null)}
              />
            </div>
          )}

          {!selectedMandal && selectedDistrictId && !isAnalyticalMode && (
            <div className="absolute top-4 right-4 z-20 pointer-events-auto">
              <DistrictInfoPanel
                districtDetail={selectedDistrictDetail}
                loading={loadingDistrict}
                onClose={() => setSelectedDistrictId(null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Attribution and Governance Disclaimer */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 px-2 py-0.5 space-y-1 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>
            <strong>Data Governance:</strong> Census of India 2011 Primary Census Abstract (PCA) • Phase 2C Multi-Hazard Exposure • Decision-Support Prototype.
          </span>
        </div>
        <div className="text-slate-400">
          APSAC OGC WMS Services: <span className="text-slate-400 font-mono">gatishakti / gatishakti1</span>
        </div>
      </div>
    </div>
  );
};
