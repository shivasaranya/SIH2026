import React from 'react';
import type { DemographicMetricKey } from '../../types/gis';
import { METRIC_CONFIGS } from '../../utils/mapUtils';
import { Info, MousePointerClick } from 'lucide-react';

interface MapLegendProps {
  activeMetric: DemographicMetricKey;
}

export const MapLegend: React.FC<MapLegendProps> = ({ activeMetric }) => {
  const config = METRIC_CONFIGS[activeMetric];
  const { thresholds, colors, formatter } = config.colorScale;

  const isPriorityView = ['topsis_score', 'scenario_topsis_score'].includes(activeMetric);
  const isAnalyticalIndex = ['topsis_score', 'scenario_topsis_score', 'vulnerability', 'hazard_exposure', 'demographic_sensitivity'].includes(activeMetric);
  const bandNames = ['Low Priority', 'Moderate Priority', 'High Priority', 'Very High Priority'];

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3.5 text-xs shadow-2xl min-w-[240px] max-w-[280px]">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-bold text-white text-xs tracking-wide block">
            {isPriorityView ? 'Relocation Priority Level' : config.label}
          </span>
          <span className="text-[10px] text-slate-400">Map Legend</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-300 font-mono border border-slate-700/60">
          {config.unit}
        </span>
      </div>

      <div className="space-y-1.5">
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
            <div key={idx} className="flex items-center space-x-2.5">
              <span
                className="w-4 h-3 rounded-md shrink-0 border border-black/30 shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-slate-200 font-medium text-[11px]">{label}</span>
            </div>
          );
        })}

        {isPriorityView && (
          <div className="flex items-center space-x-2.5 pt-0.5 border-t border-slate-800">
            <span
              className="w-4 h-3 rounded-md shrink-0 border border-black/30 shadow-sm bg-slate-700"
            />
            <span className="text-slate-400 font-medium text-[11px]">Insufficient Data</span>
          </div>
        )}
      </div>

      {/* Decision-first Helper Prompt */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center space-x-1.5 text-[10px] text-indigo-300 font-medium">
        <MousePointerClick className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span>Select an area to see why it is prioritized.</span>
      </div>

      <div className="mt-1.5 flex items-start space-x-1.5 text-[9px] text-slate-400 leading-tight">
        <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
        <span>Decision support for district authorities. Does not issue automatic relocation orders.</span>
      </div>
    </div>
  );
};
