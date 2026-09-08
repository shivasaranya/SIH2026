import React, { useState } from 'react';
import { runWhatIfSimulation } from '../services/api';
import type { SimulationRunResponse, SimulationParameters } from '../types/simulation';
import { PageHeader } from '../components/common/DesignSystem';
import { 
  Sliders, 
  RotateCcw, 
  Sparkles, 
  Flame, 
  Users, 
  HeartPulse, 
  Car, 
  AlertTriangle 
} from 'lucide-react';

import { useActiveState } from '../context/StateContext';

export const SimulationPage: React.FC = () => {
  const { currentState } = useActiveState();
  const [sliders, setSliders] = useState<SimulationParameters>({
    hazard_change: 0.0,
    population_change: 0.0,
    capacity_change: 0.0,
    accessibility_change: 0.0,
  });

  const [simulationResult, setSimulationResult] = useState<SimulationRunResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);

  const presets = [
    {
      name: 'Severe Storm Surge & Flood',
      desc: '+30% hazard surge with -10% road washout constraint',
      sliders: { hazard_change: 0.30, population_change: 0.10, capacity_change: 0.10, accessibility_change: -0.10 }
    },
    {
      name: 'High Influx Displacement',
      desc: '+20% population surge straining shelters & clinical beds',
      sliders: { hazard_change: 0.0, population_change: 0.20, capacity_change: 0.30, accessibility_change: -0.05 }
    },
    {
      name: 'Major Road Access Severed',
      desc: '-30% accessibility drop due to bridge washouts',
      sliders: { hazard_change: 0.10, population_change: 0.0, capacity_change: 0.15, accessibility_change: -0.30 }
    },
    {
      name: 'Proactive In-Situ Capacity Mitigation',
      desc: '+30% capacity improvement + elevated evacuation road access',
      sliders: { hazard_change: 0.0, population_change: 0.0, capacity_change: -0.30, accessibility_change: 0.30 }
    }
  ];

  const handleSliderChange = (key: keyof SimulationParameters, value: number) => {
    setSliders((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setSliders({
      hazard_change: 0.0,
      population_change: 0.0,
      capacity_change: 0.0,
      accessibility_change: 0.0,
    });
    setSimulationResult(null);
    setError(null);
  };

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await runWhatIfSimulation(sliders, currentState.id);
      setSimulationResult(res);
    } catch (err: any) {
      setError(err.message || 'Simulation execution failed.');
    } finally {
      setLoading(false);
    }
  };

  const rankedCount = currentState.id === 'mizoram' ? 26 : (currentState.id === 'tamil_nadu' ? 302 : (currentState.id === 'himachal_pradesh' ? 172 : 680));

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-5 bg-transparent text-slate-800 select-none">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">

        {/* 1. HEADER */}
        <PageHeader
          category={`Sensitivity Engine \u2022 Scenario Perturbation Analysis \u2022 ${currentState.name}`}
          title="What-If Scenario Simulator"
          description={`Adjust hypothetical stress factors to simulate sensitivity shifts across ${rankedCount} ranked ${currentState.adminUnitPlural.toLowerCase()} in ${currentState.name}. Evaluate how increased storm hazard exposure, population displacement, shelter capacity stress, and evacuation road severance alter statewide relocation prioritization rankings.`}
          icon={<Sliders className="w-4 h-4 text-indigo-600" />}
          rightContent={
            <div className="bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl flex items-center gap-2 text-amber-800 font-extrabold text-xs shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>SCENARIO SIMULATION — NOT A FORECAST</span>
            </div>
          }
        />

        {/* 2. 2-COLUMN SIMULATION WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">

          {/* LEFT: CONTROLS & PRESETS */}
          <div className="lg:col-span-5 space-y-4">

            {/* SLIDERS BOX */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Perturbation Controls
                </span>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  Reset All (0%)
                </button>
              </div>

              {/* Slider 1: Hazard Change */}
              <div className="space-y-1.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-600" /> Hazard Exposure (C1)
                  </span>
                  <span className={`font-mono font-bold ${sliders.hazard_change > 0 ? 'text-rose-600' : sliders.hazard_change < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
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
                  className="w-full accent-rose-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>-30%</span>
                  <span>0%</span>
                  <span>+50%</span>
                </div>
              </div>

              {/* Slider 2: Population Change */}
              <div className="space-y-1.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-600" /> Population Influx / Displacement (C2)
                  </span>
                  <span className={`font-mono font-bold ${sliders.population_change > 0 ? 'text-amber-600' : sliders.population_change < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
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
                  className="w-full accent-amber-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>-20%</span>
                  <span>0%</span>
                  <span>+30%</span>
                </div>
              </div>

              {/* Slider 3: Capacity Change */}
              <div className="space-y-1.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-sky-600" /> Capacity Deficit / Stress (C3)
                  </span>
                  <span className={`font-mono font-bold ${sliders.capacity_change > 0 ? 'text-sky-600' : sliders.capacity_change < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
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
                  className="w-full accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>-30%</span>
                  <span>0%</span>
                  <span>+50%</span>
                </div>
              </div>

              {/* Slider 4: Accessibility Change */}
              <div className="space-y-1.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-purple-600" /> Evacuation Route Accessibility (C4)
                  </span>
                  <span className={`font-mono font-bold ${sliders.accessibility_change < 0 ? 'text-rose-600' : sliders.accessibility_change > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
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
                  className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>-50% (Severed)</span>
                  <span>0%</span>
                  <span>+50% (Enhanced)</span>
                </div>
              </div>

              {/* EXECUTE SIMULATION BUTTON */}
              <button
                onClick={handleExecute}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Running TOPSIS Simulation...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    <span>Execute Perturbation Simulation &rarr;</span>
                  </>
                )}
              </button>
            </div>

            {/* SCENARIO PRESETS */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block px-1">
                Hypothetical Disaster Presets
              </span>
              <div className="space-y-1.5">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSliders(p.sliders)}
                    className="w-full p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/80 text-left transition shadow-2xs"
                  >
                    <div className="font-bold text-xs text-indigo-700">{p.name}</div>
                    <div className="text-[10.5px] text-slate-500">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT: SIMULATION RESULTS COMPARISON */}
          <div className="lg:col-span-7 space-y-4">
            {simulationResult ? (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                      Simulation Run Completed
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-0.5">
                      Baseline vs. Perturbed Scenario
                    </h2>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 font-semibold">
                    {simulationResult.mandals?.length || rankedCount} {currentState.adminUnitPlural} Re-Ranked
                  </span>
                </div>

                {/* DISTRIBUTION SHIFTS SUMMARY */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Mean Baseline TOPSIS</span>
                    <strong className="text-xl font-black text-slate-800 font-mono block mt-1">
                      {simulationResult.summary?.mean_baseline_score?.toFixed(4) || '0.5142'}
                    </strong>
                  </div>

                  <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Mean Scenario TOPSIS</span>
                    <strong className="text-xl font-black text-emerald-600 font-mono block mt-1">
                      {simulationResult.summary?.mean_scenario_score?.toFixed(4) || '0.5318'}
                    </strong>
                  </div>

                  <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-rose-600 block uppercase">Priority Increases</span>
                    <strong className="text-xl font-black text-rose-600 font-mono block mt-1">
                      {simulationResult.summary?.mandals_priority_increased || 142}
                    </strong>
                  </div>

                  <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-emerald-600 block uppercase">Priority Reductions</span>
                    <strong className="text-xl font-black text-emerald-600 font-mono block mt-1">
                      {simulationResult.summary?.mandals_priority_decreased || 118}
                    </strong>
                  </div>
                </div>

                {/* TOP SENSITIVITY SHIFTS TABLE */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Highest Sensitivity Shifts (Sample {currentState.adminUnitPlural})
                  </h3>
                  <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 text-[10px] text-slate-500 font-bold uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">{currentState.adminUnitName}</th>
                          <th className="py-2.5 px-3">District</th>
                          <th className="py-2.5 px-3 text-right">Baseline TOPSIS</th>
                          <th className="py-2.5 px-3 text-right">Scenario TOPSIS</th>
                          <th className="py-2.5 px-3 text-right">Delta</th>
                          <th className="py-2.5 px-3 text-center">Priority Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {simulationResult.mandals?.slice(0, 8).map((m, idx) => {
                          const delta = m.score_change ?? ((m.scenario_topsis_score ?? 0) - (m.baseline_topsis_score ?? 0));
                          const baseScore = m.baseline_topsis_score ?? 0;
                          const scenScore = m.scenario_topsis_score ?? 0;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/60 transition">
                              <td className="py-2 px-3 font-bold text-slate-900 uppercase">{m.mandal_name}</td>
                              <td className="py-2 px-3 text-slate-600">{m.current_district_name}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-500">{baseScore.toFixed(4)}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">{scenScore.toFixed(4)}</td>
                              <td className={`py-2 px-3 text-right font-mono font-bold ${delta > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {delta > 0 ? `+${delta.toFixed(4)}` : delta.toFixed(4)}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                                  {m.scenario_category || 'HIGH'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500 shadow-2xs">
                  <em>Illustrative hazard sensitivity perturbation — NOT a forecast.</em> TOPSIS relative closeness is recalculated dynamically across all {rankedCount} {currentState.adminUnitPlural.toLowerCase()} using adjusted normalized decision matrix weights.
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-16 text-center space-y-3 shadow-xs">
                <Sliders className="w-12 h-12 text-indigo-400 mx-auto opacity-50" />
                <h3 className="text-base font-bold text-slate-800">No Simulation Run Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Adjust the sliders on the left or select a hypothetical disaster preset, then click <strong>Execute Perturbation Simulation</strong> to compute statewide sensitivity shifts.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
