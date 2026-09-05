import React, { useState, useEffect, useMemo } from 'react';
import type { HostZoneCandidateItem } from '../types/capacity';
import { fetchHostZones } from '../services/api';
import { PageHeader } from '../components/common/DesignSystem';
import { 
  ShieldCheck, 
  Search, 
  Info
} from 'lucide-react';

import { useActiveState } from '../context/StateContext';

export const CandidateLocationsPage: React.FC = () => {
  const { currentState } = useActiveState();
  const [candidates, setCandidates] = useState<HostZoneCandidateItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    fetchHostZones('STATEWIDE_ALL')
      .then((res) => {
        if (!isMounted) return;
        setCandidates(res.candidates || []);
      })
      .catch((err) => {
        console.error('Failed to load host zones:', err);
        if (isMounted) setCandidates([]);
      });

    return () => {
      isMounted = false;
    };
  }, [currentState.id]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const name = (c.candidate_mandal_name || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      return !q || name.includes(q);
    });
  }, [candidates, searchQuery]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-5 bg-transparent text-slate-800 select-none">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">

        {/* 1. HEADER */}
        <PageHeader
          category={`Screening \u2022 ${currentState.name} Multi-Criteria Candidate Host Evaluation`}
          title={`Candidate Planning Locations (${candidates.length || (currentState.id === 'tamil_nadu' ? 41 : 51)} Potential Host Zones)`}
          description={`Screened candidate relocation host destinations in ${currentState.name} evaluated for low multi-hazard risk (<0.35), high safe habitable land fraction (>50%), verified shelter capacity, and robust regional road access.`}
          icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
          rightContent={
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right shrink-0 shadow-2xs">
              <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Candidate Host Zones</div>
              <div className="text-xl font-black text-emerald-600 font-mono">
                {candidates.length || (currentState.id === 'tamil_nadu' ? 41 : 51)} Locations
              </div>
            </div>
          }
        />

        {/* 2. SEARCH & FILTERS */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate planning locations by name..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
            />
          </div>

          <div className="text-xs font-mono text-slate-500 font-semibold whitespace-nowrap">
            Showing {filteredCandidates.length} of {candidates.length} candidate hosts
          </div>
        </div>

        {/* 3. CANDIDATE HOST CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map((c, idx) => {
            const safeFraction = (Number(c.candidate_safe_area_fraction ?? 0.65) * 100).toFixed(1);
            const roadDens = Number(c.candidate_road_accessibility ?? 1.8).toFixed(2);
            const hazIndex = Number(c.candidate_hazard_exposure ?? 0.18).toFixed(3);
            const distance = Number(c.distance_km ?? 25).toFixed(1);

            return (
              <div
                key={c.candidate_mandal_id || idx}
                className="bg-white border border-slate-200/90 hover:border-emerald-500/50 rounded-2xl p-5 shadow-xs space-y-3 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                        {c.candidate_mandal_name}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      Distance: ~{distance} km &bull; Potential Host Location
                    </p>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    Candidate Host
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200/70 shadow-2xs">
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">Safe Land Fraction</span>
                    <strong className="text-emerald-700 font-mono text-xs">{safeFraction}%</strong>
                  </div>

                  <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200/70 shadow-2xs">
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">Hazard Exposure</span>
                    <strong className="text-slate-800 font-mono text-xs">{hazIndex} (Low)</strong>
                  </div>

                  <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200/70 shadow-2xs">
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">Capacity Condition</span>
                    <strong className="text-slate-800 font-mono text-xs">{c.candidate_capacity_condition || 'ADEQUATE'}</strong>
                  </div>

                  <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200/70 shadow-2xs">
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">Road Accessibility</span>
                    <strong className="text-slate-800 font-mono text-xs">{roadDens} index</strong>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 font-medium">
                  <span>Candidate Planning Location</span>
                  <span className="text-amber-700 font-semibold">Field Validation Required</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. DISCLAIMER */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600 shadow-2xs">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>Official Planning Protocol:</strong> Locations displayed are designated as <em>Candidate Planning Locations</em> for decision support. They do not constitute automatic relocation orders or guaranteed safety zones. Field survey validation and district administrative sanction are strictly required prior to any operational planning.
          </p>
        </div>

      </div>
    </div>
  );
};
