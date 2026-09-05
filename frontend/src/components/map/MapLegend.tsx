import React from 'react';
import type { DemographicMetricKey } from '../../types/gis';
import { METRIC_CONFIGS } from '../../utils/mapUtils';
import { Info, Sparkles } from 'lucide-react';

interface MapLegendProps {
  activeMetric: DemographicMetricKey;
}

export const MapLegend: React.FC<MapLegendProps> = ({ activeMetric }) => {
  const config = METRIC_CONFIGS[activeMetric];
  const { thresholds, colors, formatter } = config.colorScale;

  const isPriorityView = ['topsis_score', 'scenario_topsis_score'].includes(activeMetric);
  const isAnalyticalIndex = ['topsis_score', 'scenario_topsis_score', 'vulnerability', 'hazard_exposure', 'demographic_sensitivity'].includes(activeMetric);
  const bandNames = ['Low Priority', 'Moderate Priority', 'High Priority', 'Very High Priority'];

  if (isPriorityView) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-3 text-xs shadow-md min-w-[190px] max-w-[230px] select-none">
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
          <div>
            <span className="font-extrabold text-slate-900 text-xs tracking-tight block uppercase">
              RELOCATION PRIORITY
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center space-x-2.5">
            <span className="w-3.5 h-3 rounded-xs bg-red-500 shrink-0 shadow-2xs border border-red-600/30"></span>
            <span className="text-slate-800 font-medium text-xs">Very High Priority</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <span className="w-3.5 h-3 rounded-xs bg-amber-500 shrink-0 shadow-2xs border border-amber-600/30"></span>
            <span className="text-slate-800 font-medium text-xs">Moderate Priority</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <span className="w-3.5 h-3 rounded-xs bg-emerald-500 shrink-0 shadow-2xs border border-emerald-600/30"></span>
            <span className="text-slate-800 font-medium text-xs">Low Priority</span>
          </div>
          <div className="flex items-center space-x-2.5 pt-0.5 border-t border-slate-100">
            <span className="w-3.5 h-3 rounded-xs bg-slate-300 shrink-0 shadow-2xs border border-slate-400/30"></span>
            <span className="text-slate-500 font-medium text-[11px]">Insufficient Data</span>
          </div>
        </div>

        {/* Note: Click any area to view details */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center space-x-1 text-[10px] text-indigo-600 font-semibold">
          <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
          <span>Click any area to view details.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-3 text-xs shadow-md min-w-[200px] max-w-[250px] select-none">
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
        <div>
          <span className="font-extrabold text-slate-900 text-xs tracking-tight block">
            {config.label}
          </span>
          <span className="text-[10px] text-slate-500">Map Legend</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-mono font-medium">
          {config.unit}
        </span>
      </div>

      <div className="space-y-1">
        {colors.map((color, idx) => {
          let label = '';
          if (activeMetric === 'priority_change') {
            if (idx === 0) label = 'Priority Reduced (Safer)';
            else if (idx === 1) label = 'Stable / Unchanged';
            else label = 'Priority Increased (Urgent)';
          } else if (isAnalyticalIndex) {
            label = bandNames[idx];
          } else {
            if (idx === 0) {
              label = `≤ ${formatter(thresholds[0])}`;
            } else if (idx === colors.length - 1) {
              label = `> ${formatter(thresholds[thresholds.length - 1])}`;
            } else {
              label = `${formatter(thresholds[idx - 1])} – ${formatter(thresholds[idx])}`;
            }
          }

          return (
            <div key={idx} className="flex items-center space-x-2">
              <span
                className="w-3.5 h-3 rounded shrink-0 shadow-xs"
                style={{ backgroundColor: color }}
              />
              <span className="text-slate-700 font-medium text-[11px]">{label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-start space-x-1 text-[9px] text-slate-500 leading-tight">
        <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
        <span>Decision support only &bull; Select an area to inspect details.</span>
      </div>
    </div>
  );
};

