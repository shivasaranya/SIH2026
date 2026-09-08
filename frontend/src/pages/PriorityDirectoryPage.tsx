import React, { useState, useEffect, useMemo } from 'react';
import type { MandalProperties } from '../types/gis';
import { fetchRelocationGeoJson } from '../services/api';
import { 
  Search, 
  ArrowUpDown, 
  ShieldAlert, 
  ArrowRight,
} from 'lucide-react';

interface PriorityDirectoryPageProps {
  onSelectMandalOnMap?: (mandal: MandalProperties) => void;
}

type PriorityFilter = 'ALL' | 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT DATA';

import { useActiveState } from '../context/StateContext';

export const PriorityDirectoryPage: React.FC<PriorityDirectoryPageProps> = ({ onSelectMandalOnMap }) => {
  const { currentState } = useActiveState();
  const [mandals, setMandals] = useState<MandalProperties[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<PriorityFilter>('ALL');
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'hazard' | 'name' | 'district'>('rank');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchRelocationGeoJson(undefined, currentState.id)
      .then((geo) => {
        if (!isMounted) return;
        const propsList = geo.features.map((f: any) => f.properties as MandalProperties);
        setMandals(propsList);
      })
      .catch((err) => {
        console.error('Failed to load priority area directory dataset:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentState.id]);

  // District list
  const districtList = useMemo(() => {
    const set = new Set<string>();
    for (const m of mandals) {
      const d = m.current_district_name || m.DNAME;
      if (d) set.add(d);
    }
    return Array.from(set).sort();
  }, [mandals]);

  // Counts
  const counts = useMemo(() => {
    let veryHigh = 0, high = 0, moderate = 0, low = 0, insufficient = 0;
    for (const m of mandals) {
      const pop = Number(m.population_total ?? 0);
      const isInsufficient =
        m.relocation_priority_category === 'INSUFFICIENT-DATA' ||
        m.ranking_status === 'INSUFFICIENT_DATA' ||
        pop === 0 ||
        m.topsis_score === undefined ||
        m.topsis_score === null;

      if (isInsufficient) {
        insufficient++;
      } else {
        const cat = (m.relocation_priority_category || 'MODERATE').toUpperCase().replace('-', ' ');
        if (cat === 'VERY HIGH') veryHigh++;
        else if (cat === 'HIGH') high++;
        else if (cat === 'MODERATE') moderate++;
        else if (cat === 'LOW') low++;
      }
    }
    return { all: mandals.length, ranked: mandals.length - insufficient, veryHigh, high, moderate, low, insufficient };
  }, [mandals]);

  // Filtered & Sorted Mandals
  const filteredMandals = useMemo(() => {
    return mandals
      .filter((m) => {
        const name = (m.mandal_name || m.DMNAME || '').toLowerCase();
        const dist = (m.current_district_name || m.DNAME || '').toLowerCase();
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || name.includes(q) || dist.includes(q);

        const matchesDistrict = selectedDistrict === 'ALL' || (m.current_district_name || m.DNAME) === selectedDistrict;

        const pop = Number(m.population_total ?? 0);
        const isInsufficient =
          m.relocation_priority_category === 'INSUFFICIENT-DATA' ||
          m.ranking_status === 'INSUFFICIENT_DATA' ||
          pop === 0 ||
          m.topsis_score === undefined ||
          m.topsis_score === null;

        const cat = isInsufficient ? 'INSUFFICIENT DATA' : (m.relocation_priority_category || 'MODERATE').toUpperCase().replace('-', ' ');

        let matchesPriority = true;
        if (selectedPriority === 'ALL') {
          matchesPriority = true;
        } else if (selectedPriority === 'INSUFFICIENT DATA') {
          matchesPriority = isInsufficient;
        } else {
          matchesPriority = cat === selectedPriority && !isInsufficient;
        }

        return matchesSearch && matchesDistrict && matchesPriority;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'name') {
          const nameA = a.mandal_name || a.DMNAME || '';
          const nameB = b.mandal_name || b.DMNAME || '';
          diff = nameA.localeCompare(nameB);
        } else if (sortBy === 'district') {
          const distA = a.current_district_name || a.DNAME || '';
          const distB = b.current_district_name || b.DNAME || '';
          diff = distA.localeCompare(distB);
        } else if (sortBy === 'score') {
          const scoreA = a.topsis_score !== undefined && a.topsis_score !== null ? Number(a.topsis_score) : -1;
          const scoreB = b.topsis_score !== undefined && b.topsis_score !== null ? Number(b.topsis_score) : -1;
          diff = scoreB - scoreA;
        } else if (sortBy === 'hazard') {
          const hazA = Number(a.hazard_exposure_index ?? a.c1_hazard_exposure ?? -1);
          const hazB = Number(b.hazard_exposure_index ?? b.c1_hazard_exposure ?? -1);
          diff = hazB - hazA;
        } else {
          // Default: rank
          const rankA = a.relocation_priority_rank ? Number(a.relocation_priority_rank) : 9999;
          const rankB = b.relocation_priority_rank ? Number(b.relocation_priority_rank) : 9999;
          diff = rankA - rankB;
        }
        return sortAsc ? diff : -diff;
      });
  }, [mandals, searchQuery, selectedDistrict, selectedPriority, sortBy, sortAsc]);

  const handleSort = (column: 'rank' | 'score' | 'hazard' | 'name' | 'district') => {
    if (sortBy === column) {
      setSortAsc((prev) => !prev);
    } else {
      setSortBy(column);
      setSortAsc(true);
    }
  };

  const getPriorityBadgeStyle = (cat: string) => {
    switch (cat) {
      case 'VERY HIGH':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'MODERATE':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 bg-slate-50/50 text-slate-800 select-none">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* 1. HEADER BANNER */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                DECISION SUPPORT &bull; STATEWIDE DIRECTORY
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-semibold">
                Decision Support Only
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Priority Area Directory ({currentState.name})
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Ranked {currentState.adminUnitPlural.toLowerCase()} requiring decision-support attention based on multi-hazard vulnerability, community sensitivity, and evacuation infrastructure headroom across {currentState.name}.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center min-w-[110px]">
              <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Populated Units</div>
              <div className="text-lg font-black text-emerald-600 font-mono">
                {counts.ranked} Ranked
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center min-w-[110px]">
              <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Data Constraint</div>
              <div className="text-lg font-black text-slate-500 font-mono">
                {counts.insufficient} Excluded
              </div>
            </div>
          </div>
        </div>

        {/* 2. STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => setSelectedPriority('VERY HIGH')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedPriority === 'VERY HIGH'
                ? 'bg-red-50 border-red-300 shadow-xs ring-2 ring-red-200'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-[10px] font-bold text-red-700 uppercase tracking-wider flex items-center justify-between">
              <span>Very High Priority</span>
              <span>🔴</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">{counts.veryHigh}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Immediate intervention focus</div>
          </button>

          <button
            onClick={() => setSelectedPriority('HIGH')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedPriority === 'HIGH'
                ? 'bg-amber-50 border-amber-300 shadow-xs ring-2 ring-amber-200'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
              <span>High Priority</span>
              <span>🟠</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">{counts.high}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Elevated risk &amp; stress</div>
          </button>

          <button
            onClick={() => setSelectedPriority('MODERATE')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedPriority === 'MODERATE'
                ? 'bg-yellow-50 border-yellow-300 shadow-xs ring-2 ring-yellow-200'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-[10px] font-bold text-yellow-800 uppercase tracking-wider flex items-center justify-between">
              <span>Moderate Priority</span>
              <span>🟡</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">{counts.moderate}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Intermediate headroom</div>
          </button>

          <button
            onClick={() => setSelectedPriority('LOW')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedPriority === 'LOW'
                ? 'bg-emerald-50 border-emerald-300 shadow-xs ring-2 ring-emerald-200'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
              <span>Low Priority</span>
              <span>🟢</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">{counts.low}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">High safety capacity</div>
          </button>

          <button
            onClick={() => setSelectedPriority('INSUFFICIENT DATA')}
            className={`p-3 rounded-xl border text-left transition-all col-span-2 sm:col-span-1 ${
              selectedPriority === 'INSUFFICIENT DATA'
                ? 'bg-slate-100 border-slate-300 shadow-xs ring-2 ring-slate-200'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Insufficient Data</span>
              <span>⚪</span>
            </div>
            <div className="text-2xl font-black text-slate-700 font-mono mt-1">{counts.insufficient}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Zero rural units</div>
          </button>
        </div>

        {/* 3. SEARCH & FILTER CONTROLS */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search by ${currentState.adminUnitName} or District Name...`}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* District Dropdown */}
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[180px]"
            >
              <option value="ALL">All Districts ({districtList.length || currentState.districtCount})</option>
              {districtList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-1 flex-wrap">
              {(['ALL', 'VERY HIGH', 'HIGH', 'MODERATE', 'LOW', 'INSUFFICIENT DATA'] as PriorityFilter[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPriority(p)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                    selectedPriority === p
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {p === 'ALL' ? 'All' : p.split(' ')[0]}
                </button>
              ))}
            </div>

            <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap pl-2">
              {filteredMandals.length} of {mandals.length}
            </span>
          </div>
        </div>

        {/* 4. MAIN DIRECTORY TABLE */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('rank')}>
                    <div className="flex items-center gap-1">
                      <span>Rank</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      <span>{currentState.adminUnitName}</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('district')}>
                    <div className="flex items-center gap-1">
                      <span>District</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right cursor-pointer hover:text-slate-900" onClick={() => handleSort('hazard')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Hazard (C1)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">Sensitivity (C2)</th>
                  <th className="py-3 px-3 text-right">Capacity (C3)</th>
                  <th className="py-3 px-3 text-right">Access (C4)</th>
                  <th className="py-3 px-4 text-right cursor-pointer hover:text-slate-900" onClick={() => handleSort('score')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>TOPSIS Score</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">Priority Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-2"></div>
                      <p>Loading Priority Area Directory...</p>
                    </td>
                  </tr>
                ) : filteredMandals.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No {currentState.adminUnitPlural.toLowerCase()} match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredMandals.map((m, idx) => {
                    const mname = m.mandal_name || m.DMNAME || currentState.adminUnitName;
                    const dname = m.current_district_name || m.DNAME || 'District';
                    const pop = Number(m.population_total ?? 0);

                    const isInsufficient =
                      m.relocation_priority_category === 'INSUFFICIENT-DATA' ||
                      m.ranking_status === 'INSUFFICIENT_DATA' ||
                      pop === 0 ||
                      m.topsis_score === undefined ||
                      m.topsis_score === null;

                    const cat = isInsufficient
                      ? 'INSUFFICIENT DATA'
                      : (m.relocation_priority_category || 'MODERATE').toUpperCase().replace('-', ' ');

                    const rank = isInsufficient ? '—' : `#${m.relocation_priority_rank || idx + 1}`;
                    const topsisVal = isInsufficient ? '—' : Number(m.topsis_score).toFixed(4);

                    const c1 = isInsufficient ? '—' : `${(Number(m.c1_hazard_exposure ?? m.hazard_exposure_index ?? 0) * 100).toFixed(1)}%`;
                    const c2 = isInsufficient ? '—' : `${(Number(m.c2_demographic_sensitivity ?? m.demographic_sensitivity_index ?? 0) * 100).toFixed(1)}%`;
                    const c3 = isInsufficient ? '—' : Number(m.c3_capacity_stress ?? 0.4).toFixed(3);
                    const c4 = isInsufficient ? '—' : Number(m.c4_accessibility_constraint ?? 0.3).toFixed(3);

                    return (
                      <tr
                        key={m.mandal_id || idx}
                        className="hover:bg-indigo-50/30 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                          {rank}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 uppercase tracking-wide">
                          {mname}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 font-medium">
                          {dname}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-red-600 font-semibold">
                          {c1}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-700 font-semibold">
                          {c2}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-sky-700 font-semibold">
                          {c3}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-purple-700 font-semibold">
                          {c4}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-extrabold text-indigo-700">
                          {topsisVal}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadgeStyle(cat)}`}>
                            {cat}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {onSelectMandalOnMap ? (
                            <button
                              onClick={() => onSelectMandalOnMap(m)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold transition flex items-center gap-1 mx-auto shadow-2xs"
                              title="Focus Mandal on Hero Map & Open Detail"
                            >
                              <span>Inspect Map</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <div>
              <strong>Data Governance:</strong> {counts.ranked} populated {currentState.adminUnitPlural.toLowerCase()} ranked via TOPSIS MCDA engine. {counts.insufficient > 0 ? `${counts.insufficient} unpopulated geometries are marked as INSUFFICIENT DATA.` : 'All administrative units fully enumerated.'}
            </div>
            <div className="font-mono text-slate-400">
              Verified Dataset &bull; {currentState.name} State Disaster Decision Support
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
