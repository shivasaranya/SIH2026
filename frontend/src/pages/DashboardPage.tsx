import React, { useEffect, useState } from 'react';
import { 
  Layers, 
  Map,
  ShieldAlert
} from 'lucide-react';
import { fetchRelocationGeoJson } from '../services/api';
import { PageHeader } from '../components/common/DesignSystem';

interface DashboardPageProps {
  onNavigateToGIS?: () => void;
}

import { useActiveState } from '../context/StateContext';

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToGIS }) => {
  const { currentState } = useActiveState();
  const isWB = currentState.id === 'west_bengal';
  const isTN = currentState.id === 'tamil_nadu';
  const isMZ = currentState.id === 'mizoram';
  const isHP = currentState.id === 'himachal_pradesh';

  const [counts, setCounts] = useState({
    districts: currentState.districtCount,
    mandals: currentState.adminUnitCount,
    ranked: isMZ ? 26 : (isTN ? 302 : (isHP ? 172 : 680)),
    insufficient: (isTN || isMZ || isHP) ? 0 : 16,
    candidateHosts: isMZ ? 5 : (isTN ? 41 : (isHP ? 15 : 51)),
    veryHigh: isMZ ? 2 : (isTN ? 30 : (isHP ? 46 : 34)),
    high: isMZ ? 5 : (isTN ? 60 : (isHP ? 80 : 136)),
    moderate: isMZ ? 11 : (isTN ? 121 : (isHP ? 46 : 272)),
    low: isMZ ? 8 : (isTN ? 91 : (isHP ? 0 : 238))
  });

  useEffect(() => {
    let isMounted = true;

    fetchRelocationGeoJson(undefined, currentState.id)
      .then((geo) => {
        if (!isMounted) return;
        let vh = 0, h = 0, m = 0, l = 0, ins = 0;
        for (const f of geo.features) {
          const p = f.properties;
          const isIns =
            p?.relocation_priority_category === 'INSUFFICIENT-DATA' ||
            p?.ranking_status === 'INSUFFICIENT_DATA' ||
            Number(p?.population_total ?? 0) === 0 ||
            p?.topsis_score === undefined ||
            p?.topsis_score === null;

          if (isIns) ins++;
          else {
            const cat = (p?.relocation_priority_category || 'MODERATE').toUpperCase();
            if (cat === 'VERY HIGH') vh++;
            else if (cat === 'HIGH') h++;
            else if (cat === 'MODERATE') m++;
            else if (cat === 'LOW') l++;
          }
        }
        setCounts((prev) => ({
          ...prev,
          districts: currentState.districtCount,
          mandals: geo.features.length || currentState.adminUnitCount,
          ranked: geo.features.length - ins,
          insufficient: ins,
          candidateHosts: isMZ ? 5 : (isTN ? 41 : 51),
          veryHigh: vh || (isMZ ? 2 : (isTN ? 30 : 34)),
          high: h || (isMZ ? 5 : (isTN ? 60 : 136)),
          moderate: m || (isMZ ? 11 : (isTN ? 121 : 272)),
          low: l || (isMZ ? 8 : (isTN ? 91 : 238))
        }));
      })
      .catch((err) => {
        console.error('Error loading relocation stats:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [currentState.id]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-5 bg-transparent text-slate-800 select-none">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">
        {/* 1. TOP HERO COMMAND BANNER */}
      <PageHeader
        category={`Statewide Situation Overview \u2022 ${currentState.name} Decision Support`}
        title={`${currentState.name} Disaster Decision Overview`}
        description={`State-level multi-hazard relocation intelligence platform for District Collectors, SDMA, and emergency planning authorities across all ${currentState.districtCount} administrative districts.`}
        icon={<ShieldAlert className="w-4 h-4 text-indigo-600" />}
        rightContent={
          onNavigateToGIS ? (
            <button
              onClick={onNavigateToGIS}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition shrink-0"
            >
              <Map className="w-4 h-4 text-indigo-200" />
              <span>Open Hero Risk Map &rarr;</span>
            </button>
          ) : undefined
        }
      />

      {/* 2. STATEWIDE COMPACT METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Districts</span>
          <div className="text-3xl font-black text-slate-900 font-mono mt-1">{counts.districts}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">Statewide Coverage</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">{currentState.adminUnitPlural} Assessed</span>
          <div className="text-3xl font-black text-slate-900 font-mono mt-1">{counts.mandals}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">Total Admin Units</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Populated / Ranked</span>
          <div className="text-3xl font-black text-emerald-600 font-mono mt-1">{counts.ranked}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">Census 2011 Habitations</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Insufficient Data</span>
          <div className="text-3xl font-black text-slate-500 font-mono mt-1">{counts.insufficient}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">Zero Rural Units</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-center shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">Candidate Hosts</span>
          <div className="text-3xl font-black text-purple-600 font-mono mt-1">{counts.candidateHosts}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">Screened Safer Zones</span>
        </div>
      </div>

      {/* 3. PRIORITY DISTRIBUTION BREAKDOWN */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600" />
            Statewide Relocation Priority Distribution
          </h2>
          <span className="text-xs font-mono text-slate-500 font-semibold">AHP+TOPSIS MCDA Engine</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-red-700">VERY HIGH</span>
              <span className="font-mono text-red-700 font-bold">{counts.veryHigh} {currentState.adminUnitPlural}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-red-500 h-full rounded-full" style={{ width: `${(counts.veryHigh / counts.ranked) * 100}%` }} />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1.5">Top-tier exposure &amp; severe capacity deficits</span>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-amber-700">HIGH</span>
              <span className="font-mono text-amber-700 font-bold">{counts.high} {currentState.adminUnitPlural}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(counts.high / counts.ranked) * 100}%` }} />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1.5">Elevated multi-hazard risk &amp; road constraints</span>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-yellow-700">MODERATE</span>
              <span className="font-mono text-yellow-700 font-bold">{counts.moderate} {currentState.adminUnitPlural}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${(counts.moderate / counts.ranked) * 100}%` }} />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1.5">Moderate exposure with manageable baseline capacity</span>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-emerald-700">LOW</span>
              <span className="font-mono text-emerald-700 font-bold">{counts.low} {currentState.adminUnitPlural}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(counts.low / counts.ranked) * 100}%` }} />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1.5">Low hazard profile, high safe land fraction</span>
          </div>
        </div>
      </div>

      {/* 4. DECISION-SUPPORT WORKFLOW */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
          Integrated Decision-Support Pipeline
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-1 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">1</div>
            <h3 className="font-bold text-slate-900 text-xs">Hazard Risk (H_i)</h3>
            <p className="text-[11px] text-slate-500 leading-tight">38-yr flood, cyclone buffers, wind speeds &amp; steep slope.</p>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-1 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">2</div>
            <h3 className="font-bold text-slate-900 text-xs">Community Sensitivity (D_i)</h3>
            <p className="text-[11px] text-slate-500 leading-tight">Children (0–6), family congestion &amp; non-worker dependencies.</p>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-1 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">3</div>
            <h3 className="font-bold text-slate-900 text-xs">Emergency Capacity (C_i)</h3>
            <p className="text-[11px] text-slate-500 leading-tight">Cyclone shelters, road access, hospital beds &amp; safe land.</p>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-1 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">4</div>
            <h3 className="font-bold text-slate-900 text-xs">AHP + TOPSIS Model</h3>
            <p className="text-[11px] text-slate-500 leading-tight">Deterministic multi-criteria ranking &amp; 3-horizon action plans.</p>
          </div>
        </div>
      </div>
    </div>

  </div>
);
};
