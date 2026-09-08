import React from 'react';
import type { DemographicMetricKey } from '../../types/gis';
import { METRIC_CONFIGS } from '../../utils/mapUtils';
import { Layers, Eye, EyeOff, RotateCcw, AlertTriangle, ShieldCheck, Home, Activity, Compass } from 'lucide-react';

interface MapControlsProps {
  activeMetric: DemographicMetricKey;
  onSelectMetric: (metric: DemographicMetricKey) => void;
  showMandals: boolean;
  onToggleMandals: () => void;
  showFloodWms: boolean;
  onToggleFloodWms: () => void;
  showSheltersWms: boolean;
  onToggleSheltersWms: () => void;
  showHabitationsWms: boolean;
  onToggleHabitationsWms: () => void;
  onResetView: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  activeMetric,
  onSelectMetric,
  showMandals,
  onToggleMandals,
  showFloodWms,
  onToggleFloodWms,
  showSheltersWms,
  onToggleSheltersWms,
  showHabitationsWms,
  onToggleHabitationsWms,
  onResetView,
}) => {
  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 text-xs shadow-2xl space-y-4 max-w-xs max-h-[calc(100vh-14rem)] overflow-y-auto custom-scrollbar">
      {/* 1. Relocation Planning Priorities */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-white flex items-center space-x-1.5 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Relocation Planning</span>
          </span>
          <span className="text-[10px] text-indigo-400 font-mono font-semibold bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full">
            Decision Priority
          </span>
        </div>
        <div className="space-y-1.5">
          <button
            onClick={() => onSelectMetric('topsis_score')}
            className={`w-full px-3 py-2 rounded-xl text-left transition-all text-xs font-semibold flex items-center justify-between ${
              activeMetric === 'topsis_score'
                ? 'bg-rose-500/25 text-rose-200 border border-rose-500/50 shadow-md ring-1 ring-rose-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50'
            }`}
          >
            <span>Current Relocation Priority</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900/80 text-rose-300 border border-rose-500/30">
              Baseline
            </span>
          </button>

          <button
            onClick={() => onSelectMetric('scenario_topsis_score')}
            className={`w-full px-3 py-2 rounded-xl text-left transition-all text-xs font-semibold flex items-center justify-between ${
              activeMetric === 'scenario_topsis_score'
                ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50'
            }`}
          >
            <span>Simulated Scenario Priority</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900/80 text-indigo-300 border border-indigo-500/30">
              What-If
            </span>
          </button>

          <button
            onClick={() => onSelectMetric('priority_change')}
            className={`w-full px-3 py-2 rounded-xl text-left transition-all text-xs font-semibold flex items-center justify-between ${
              activeMetric === 'priority_change'
                ? 'bg-purple-500/25 text-purple-200 border border-purple-500/50 shadow-md ring-1 ring-purple-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50'
            }`}
          >
            <span>Priority Shift (Delta)</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900/80 text-purple-300 border border-purple-500/30">
              Shift
            </span>
          </button>
        </div>
      </div>

      {/* 2. Hazard Exposure & Community Vulnerability */}
      <div className="pt-2.5 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hazard & Vulnerability</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">Risk Level</span>
        </div>
        <div className="space-y-1.5">
          <button
            onClick={() => onSelectMetric('hazard_exposure')}
            className={`w-full px-3 py-1.5 rounded-xl text-left transition-all text-xs font-medium flex items-center justify-between ${
              activeMetric === 'hazard_exposure'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/40'
            }`}
          >
            <span>Hazard Exposure</span>
          </button>

          <button
            onClick={() => onSelectMetric('demographic_sensitivity')}
            className={`w-full px-3 py-1.5 rounded-xl text-left transition-all text-xs font-medium flex items-center justify-between ${
              activeMetric === 'demographic_sensitivity'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/40'
            }`}
          >
            <span>Community Vulnerability</span>
          </button>

          <button
            onClick={() => onSelectMetric('vulnerability')}
            className={`w-full px-3 py-1.5 rounded-xl text-left transition-all text-xs font-medium flex items-center justify-between ${
              activeMetric === 'vulnerability'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/40'
            }`}
          >
            <span>Combined Risk Index</span>
          </button>
        </div>
      </div>

      {/* 3. Emergency Capacity Headroom */}
      <div className="pt-2.5 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>Emergency Capacity</span>
          </span>
          <span className="text-[10px] text-sky-400 font-mono">Headroom</span>
        </div>
        <div className="space-y-1.5">
          <button
            onClick={() => onSelectMetric('shelter_capacity')}
            className={`w-full px-3 py-1.5 rounded-xl text-left transition-all text-xs font-medium flex items-center justify-between ${
              activeMetric === 'shelter_capacity'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/40'
            }`}
          >
            <span>Designated Cyclone Shelters</span>
          </button>

          <button
            onClick={() => onSelectMetric('road_density')}
            className={`w-full px-3 py-1.5 rounded-xl text-left transition-all text-xs font-medium flex items-center justify-between ${
              activeMetric === 'road_density'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/40'
            }`}
          >
            <span>Evacuation Road Access</span>
          </button>

          <button
            onClick={() => onSelectMetric('safe_area_fraction')}
            className={`w-full px-3 py-1.5 rounded-xl text-left transition-all text-xs font-medium flex items-center justify-between ${
              activeMetric === 'safe_area_fraction'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/40'
            }`}
          >
            <span>Safe Habitable Land</span>
          </button>

          <button
            onClick={() => onSelectMetric('water_sanitation')}
            className={`w-full px-3 py-1.5 rounded-xl text-left transition-all text-xs font-medium flex items-center justify-between ${
              activeMetric === 'water_sanitation'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/40'
            }`}
          >
            <span>Water & Sanitation Coverage</span>
          </button>

          <button
            onClick={() => onSelectMetric('health_beds')}
            className={`w-full px-3 py-1.5 rounded-xl text-left transition-all text-xs font-medium flex items-center justify-between ${
              activeMetric === 'health_beds'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/40'
            }`}
          >
            <span>Healthcare Bed Capacity</span>
          </button>
        </div>
      </div>

      {/* 4. Demographic Baseline */}
      <div className="pt-2.5 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-slate-200">Demographic Baseline</span>
          <span className="text-[10px] text-amber-400 font-mono">Census 2011</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {(['population', 'children_pct', 'non_workers_pct', 'avg_hh_size'] as DemographicMetricKey[]).map((key) => {
            const isSelected = activeMetric === key;
            return (
              <button
                key={key}
                onClick={() => onSelectMetric(key)}
                className={`px-2.5 py-1.5 rounded-xl text-left transition-all text-[11px] font-medium ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/40'
                }`}
              >
                {METRIC_CONFIGS[key].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Map Layers & Overlays */}
      <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-200 flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Map Layers</span>
          </span>
          <button
            onClick={onResetView}
            className="flex items-center space-x-1 text-[10px] text-slate-400 hover:text-slate-200 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 transition"
            title="Reset to State Extent"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset View</span>
          </button>
        </div>

        {/* Mandal Layer Toggle */}
        <button
          onClick={onToggleMandals}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all text-xs ${
            showMandals
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'bg-slate-800/70 text-slate-400 hover:text-slate-300 border border-slate-700/40'
          }`}
        >
          <div className="flex items-center space-x-2">
            {showMandals ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Mandal Boundaries (696)</span>
          </div>
          <span className="text-[10px] font-mono opacity-80">Vector</span>
        </button>

        {/* APSAC WMS Optional Overlays */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
            <span>State GIS Overlays</span>
            <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">OGC WMS</span>
          </div>

          <button
            onClick={onToggleFloodWms}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all text-xs ${
              showFloodWms
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-300 border border-slate-700/40'
            }`}
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Michaung Flood Inundation</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400/80">WMS</span>
          </button>

          <button
            onClick={onToggleSheltersWms}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all text-xs ${
              showSheltersWms
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-300 border border-slate-700/40'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cyclone Shelters</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/80">WMS</span>
          </button>

          <button
            onClick={onToggleHabitationsWms}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all text-xs ${
              showHabitationsWms
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-300 border border-slate-700/40'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Home className="w-3.5 h-3.5 text-amber-400" />
              <span>Habitations Layer</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400/80">WMS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
