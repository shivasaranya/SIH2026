import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Compass,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Activity,
} from 'lucide-react';


import type { SourceHostComparisonResponse } from '../../types/decision';
import { fetchSourceHostComparison } from '../../services/api';

interface HostComparisonModalProps {
  sourceMandalId: string;
  hostMandalId: string;
  onClose: () => void;
}

export const HostComparisonModal: React.FC<HostComparisonModalProps> = ({
  sourceMandalId,
  hostMandalId,
  onClose,
}) => {
  const [comparison, setComparison] = useState<SourceHostComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetchSourceHostComparison(sourceMandalId, hostMandalId)
      .then((data) => {
        if (isMounted) setComparison(data);
      })
      .catch((err: any) => {
        if (isMounted) setError(err.message || 'Failed to load source-host comparison.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sourceMandalId, hostMandalId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-slate-300 flex items-center space-x-3 shadow-2xl">
          <Activity className="w-5 h-5 text-indigo-400 animate-spin" />
          <span className="text-sm font-medium">Loading Source vs Candidate Host Comparison...</span>
        </div>
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-rose-500/40 rounded-xl p-6 text-slate-200 max-w-md w-full shadow-2xl space-y-4">
          <div className="flex items-center space-x-2 text-rose-400">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-bold text-sm">Comparison Unavailable</h3>
          </div>
          <p className="text-xs text-slate-400">{error || 'Data could not be resolved.'}</p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const { source_mandal: src, candidate_host: host, distance_km, key_advantages, key_concerns_or_bottlenecks, missing_or_unverified_information, human_validation_notice } = comparison;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Source vs Candidate Host Zone Assessment
                <span className="text-[10px] font-semibold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  Human Review Required
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Comparative evaluation across hazard safety, safe land headroom, and infrastructure capacity.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Side-by-Side Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Mandal Card */}
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Source Mandal</span>
                  <h3 className="text-base font-bold text-white">{src.mandal_name}</h3>
                  <p className="text-xs text-slate-400">{src.district_name} District</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded-full">
                    {src.relocation_priority_category} PRIORITY
                  </span>
                  <p className="text-xs font-mono text-slate-300 mt-1">Rank #{src.relocation_priority_rank || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Population (2011)</span>
                  <span className="font-bold text-slate-200">{Number(src.population).toLocaleString()}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Planning Priority Score</span>
                  <span className="font-bold text-rose-400 font-mono">{Number(src.topsis_score).toFixed(3)}</span>
                </div>

                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Hazard Exposure</span>
                  <span className="font-bold text-amber-300 font-mono">{Number(src.hazard_exposure).toFixed(3)}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Safe Area Headroom</span>
                  <span className="font-bold text-slate-300">{(src.safe_area_fraction * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-rose-400 font-semibold">Primary Bottleneck: </span>
                {String(src.primary_bottleneck).replace('_', ' ').toUpperCase()}
              </div>
            </div>

            {/* Candidate Host Mandal Card */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Candidate Host Zone</span>
                  <h3 className="text-base font-bold text-white">{host.mandal_name}</h3>
                  <p className="text-xs text-slate-400">{host.district_name} District</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full">
                    {host.capacity_condition}
                  </span>
                  <p className="text-xs font-mono text-emerald-400 mt-1 flex items-center justify-end gap-1">
                    <Compass className="w-3.5 h-3.5" />
                    {distance_km.toFixed(1)} km away
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Population (2011)</span>
                  <span className="font-bold text-slate-200">{Number(host.population).toLocaleString()}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Planning Priority Score</span>
                  <span className="font-bold text-emerald-400 font-mono">{Number(host.topsis_score).toFixed(3)}</span>
                </div>

                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Hazard Exposure</span>
                  <span className="font-bold text-emerald-400 font-mono">{Number(host.hazard_exposure).toFixed(3)}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Safe Area Headroom</span>
                  <span className="font-bold text-emerald-300">{(host.safe_area_fraction * 100).toFixed(1)}% ({Number(host.safe_area_m2_per_person).toFixed(0)} m²/p)</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-emerald-400 font-semibold">Data Completeness: </span>
                {(host.data_completeness * 100).toFixed(0)}% (Verified Physical Indicators)
              </div>
            </div>
          </div>

          {/* Key Advantages */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Candidate Host Zone Advantages
            </h4>
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 space-y-1.5">
              {key_advantages.map((adv, i) => (
                <div key={i} className="flex items-start space-x-2 text-xs text-slate-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{adv}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Concerns / Secondary Bottlenecks */}
          {key_concerns_or_bottlenecks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Candidate Host Constraints & Considerations
              </h4>
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 space-y-1.5">
                {key_concerns_or_bottlenecks.map((con, i) => (
                  <div key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{con}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing / Unverified Information */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              Data Limitations & Required Field Verifications
            </h4>
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 space-y-1.5">
              {missing_or_unverified_information.map((info, i) => (
                <div key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                  <span>{info}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Human Review Disclaimer */}
          <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3 flex items-start space-x-3 text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{human_validation_notice}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Geodesic distance calculated in EPSG:7755 (India Albers Equal Area).
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
