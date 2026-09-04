import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PlaceholderViewProps {
  title: string;
  phase: string;
  description: string;
  icon: LucideIcon;
  deliverables: string[];
  onLaunchGIS?: () => void;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  title,
  phase,
  description,
  icon: Icon,
  deliverables,
  onLaunchGIS,
}) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-8 max-w-3xl mx-auto my-6 text-center space-y-6 shadow-2xl animate-in fade-in duration-200">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
        <Icon className="w-8 h-8" />
      </div>

      <div className="space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active Analytical Engine &bull; {phase} Verified</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">{title}</h2>
        <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-5 text-left max-w-lg mx-auto space-y-3 shadow-inner">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-1.5">
          Verified Core Deliverables & Indices
        </span>
        <ul className="space-y-2">
          {deliverables.map((item, idx) => (
            <li key={idx} className="text-xs text-slate-200 flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {onLaunchGIS && (
        <div className="pt-2">
          <button
            onClick={onLaunchGIS}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20"
          >
            <span>Explore on Interactive GIS Map</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <p className="text-[11px] text-slate-500 max-w-md mx-auto">
        Fully integrated with Andhra Pradesh (696 Mandals), Census 2011 PCA demographic crosswalk, and Phase 4 MCDA TOPSIS engine.
      </p>
    </div>
  );
};
