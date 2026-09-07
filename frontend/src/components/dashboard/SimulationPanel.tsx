import React, { useState } from 'react';
import { runWhatIfSimulation } from '../../services/api';
import type { SimulationRunResponse, SimulationParameters } from '../../types/simulation';
import type { DemographicMetricKey } from '../../types/gis';
import { 
  Sliders, 
  RotateCcw, 
  Layers, 
  ArrowRight,
  Sparkles,
  Flame,
  Users,
  HeartPulse,
  Car
} from 'lucide-react';
import { useActiveState } from '../../context/StateContext';

interface SimulationPanelProps {
  onSimulationRun: (result: SimulationRunResponse | null) => void;
  activeMetric: DemographicMetricKey;
  onMetricSelect: (metric: DemographicMetricKey) => void;
  selectedMandalId?: string | null;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({
  onSimulationRun,
  activeMetric,
  onMetricSelect,
  selectedMandalId,
}) => {
  const { currentState } = useActiveState();
  const [sliders, setSliders] = useState<SimulationParameters>({
    hazard_change: 0.0,
    population_change: 0.0,
    capacity_change: 0.0,
    accessibility_change: 0.0,
  });

  const [simulationResult, setSimulationResult] = useState<SimulationRunResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    {
      name: 'Severe Storm Surge & Flood',
      desc: '30% hazard surge with 10% road washout',
      sliders: { hazard_change: 0.30, population_change: 0.10, capacity_change: 0.10, accessibility_change: -0.10 }
    },
    {
      name: 'High Influx Displacement',
      desc: '20% population surge straining shelters & beds',
      sliders: { hazard_change: 0.0, population_change: 0.20, capacity_change: 0.30, accessibility_change: -0.05 }
    },
    {
      name: 'Major Road Access Severed',
      desc: '30% accessibility drop due to bridge washouts',
      sliders: { hazard_change: 0.10, population_change: 0.0, capacity_change: 0.15, accessibility_change: -0.30 }
    },
    {
      name: 'Proactive In-Situ Mitigation',
      desc: '30% capacity improvement + elevated access',
      sliders: { hazard_change: 0.0, population_change: 0.0, capacity_change: -0.30, accessibility_change: 0.30 }
    }
  ];

  const handleSliderChange = (key: keyof SimulationParameters, value: number) => {
    setSliders((prev: SimulationParameters) => ({ ...prev, [key]: value }));
  };

  const handlePresetSelect = (presetSliders: SimulationParameters) => {
    setSliders(presetSliders);
  };

  const handleReset = () => {
    const zeroSliders: SimulationParameters = {
      hazard_change: 0.0,
      population_change: 0.0,
      capacity_change: 0.0,
      accessibility_change: 0.0,
    };
    setSliders(zeroSliders);
    setSimulationResult(null);
    onSimulationRun(null);
    setError(null);
  };

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await runWhatIfSimulation(sliders, currentState.id);
      setSimulationResult(res);
      onSimulationRun(res);
    } catch (err: any) {
      setError(err.message || 'Simulation execution failed.');
    } finally {
      setLoading(false);
    }
  };

  const selectedMandalResult = selectedMandalId && simulationResult
    ? simulationResult.mandals.find(m => m.mandal_id === selectedMandalId)
    : null;

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 shadow-2xl space-y-4 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-white text-sm">What If Conditions Change?</h3>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Preset Scenarios */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
          Explore Ready-Made Scenarios
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetSelect(p.sliders)}
              className="p-2 rounded-xl text-left bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/50 transition space-y-0.5"
            >
              <div className="font-semibold text-indigo-300 text-[11px] truncate flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>{p.name}</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Condition Sliders */}
      <div className="space-y-3 pt-1 border-t border-slate-800/80">
        {/* 1. Hazard Intensity */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Hazard Intensity
            </span>
            <span className="font-mono text-indigo-300 font-bold">
              {sliders.hazard_change > 0 ? `+${(sliders.hazard_change * 100).toFixed(0)}%` : `${(sliders.hazard_change * 100).toFixed(0)}%`}
            </span>
          </div>
          <input
            type="range"
            min="-0.30"
            max="0.50"
            step="0.05"
            value={sliders.hazard_change}
            onChange={(e) => handleSliderChange('hazard_change', parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* 2. Population Pressure */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              Displaced Population Influx
            </span>
            <span className="font-mono text-indigo-300 font-bold">
              {sliders.population_change > 0 ? `+${(sliders.population_change * 100).toFixed(0)}%` : `${(sliders.population_change * 100).toFixed(0)}%`}
            </span>
          </div>
          <input
            type="range"
            min="-0.20"
            max="0.30"
            step="0.05"
            value={sliders.population_change}
            onChange={(e) => handleSliderChange('population_change', parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* 3. Emergency Capacity Deficit */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-sky-400" />
              Emergency Capacity Stress
            </span>
            <span className="font-mono text-indigo-300 font-bold">
              {sliders.capacity_change > 0 ? `+${(sliders.capacity_change * 100).toFixed(0)}%` : `${(sliders.capacity_change * 100).toFixed(0)}%`}
            </span>
          </div>
          <input
            type="range"
            min="-0.30"
            max="0.50"
            step="0.05"
            value={sliders.capacity_change}
            onChange={(e) => handleSliderChange('capacity_change', parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* 4. Accessibility */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-emerald-400" />
              Evacuation Road Access
            </span>
            <span className="font-mono text-indigo-300 font-bold">
              {sliders.accessibility_change > 0 ? `+${(sliders.accessibility_change * 100).toFixed(0)}%` : `${(sliders.accessibility_change * 100).toFixed(0)}%`}
            </span>
          </div>
          <input
            type="range"
            min="-0.50"
            max="0.50"
            step="0.05"
            value={sliders.accessibility_change}
            onChange={(e) => handleSliderChange('accessibility_change', parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleExecute}
        disabled={loading}
        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2"
      >
        {loading ? (
          <span>Recalculating Scenario Across {currentState.adminUnitCount} {currentState.adminUnitPlural}...</span>
        ) : (
          <>
            <span>Run What-If Scenario</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {error && (
        <div className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-[11px]">
          {error}
        </div>
      )}

      {/* Selected Mandal Preview */}
      {selectedMandalResult && (
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs">{selectedMandalResult.mandal_name}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              selectedMandalResult.category_change === 'INCREASED'
                ? 'bg-rose-500/20 text-rose-300'
                : selectedMandalResult.category_change === 'DECREASED'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {selectedMandalResult.scenario_category} PRIORITY
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {selectedMandalResult.scenario_explanation}
          </p>
        </div>
      )}

      {/* Quick Layer Switchers */}
      {simulationResult && (
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
            Visualize on Map
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onMetricSelect('scenario_topsis_score')}
              className={`p-2 rounded-xl text-left border transition ${
                activeMetric === 'scenario_topsis_score'
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-bold text-[11px]">Simulated Priority</span>
              </div>
            </button>

            <button
              onClick={() => onMetricSelect('priority_change')}
              className={`p-2 rounded-xl text-left border transition ${
                activeMetric === 'priority_change'
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-bold text-[11px]">Priority Shift (Δ)</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Governance Banner */}
      <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-2 text-[10px] text-amber-200 text-center">
        SCENARIO SIMULATION &bull; NOT A FORECAST
      </div>
    </div>
  );
};
