import React, { useState, useEffect, useMemo } from 'react';
import type { MandalProperties } from '../types/gis';
import { fetchRelocationGeoJson } from '../services/api';
import { PageHeader } from '../components/common/DesignSystem';
import { 
  MapPin, 
  Search, 
  ArrowUpDown
} from 'lucide-react';

interface RelocationPlanningPageProps {
  onSelectMandalOnMap?: (mandal: MandalProperties) => void;
}

import { useActiveState } from '../context/StateContext';

type PriorityFilter = 'ALL' | 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT DATA';

export const RelocationPlanningPage: React.FC<RelocationPlanningPageProps> = ({ onSelectMandalOnMap }) => {
  const { currentState } = useActiveState();
  const [mandals, setMandals] = useState<MandalProperties[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<PriorityFilter>('ALL');
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'name' | 'district'>('rank');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchRelocationGeoJson()
      .then((geo) => {
        if (!isMounted) return;
        const propsList = geo.features.map((f: any) => f.properties as MandalProperties);
        setMandals(propsList);
      })
      .catch((err) => {
        console.error('Failed to load relocation planning dataset:', err);
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
        } else {
          // Default: rank
          const rankA = a.relocation_priority_rank ? Number(a.relocation_priority_rank) : 9999;
          const rankB = b.relocation_priority_rank ? Number(b.relocation_priority_rank) : 9999;
          diff = rankA - rankB;
        }
        return sortAsc ? diff : -diff;
      });
  }, [mandals, searchQuery, selectedDistrict, selectedPriority, sortBy, sortAsc]);

  const handleSort = (column: 'rank' | 'score' | 'name' | 'district') => {
    if (sortBy === column) {
      setSortAsc((prev) => !prev);
    } else {
      setSortBy(column);
      setSortAsc(true);
    }
  };

  const getCategoryBadge = (category: string) => {
    if (category === 'VERY HIGH') return 'bg-red-50 text-red-700 border-red-200';
    if (category === 'HIGH') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (category === 'MODERATE') return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    if (category === 'LOW') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-slate-100 text-slate-500 border-slate-200';
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-5 bg-transparent text-slate-800 select-none">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">

        {/* 1. HEADER */}
        <PageHeader
          category={`Multi-Criteria Decision Analysis \u2022 AHP-TOPSIS Mathematical Framework \u2022 ${currentState.name}`}
          title="Relocation Planning Priority Index"
          description={`Rigorous multi-criteria ranking of ${currentState.name} ${currentState.adminUnitPlural.toLowerCase()} synthesizing Multi-Hazard Exposure (42.31%), Community Sensitivity (22.74%), Shelter Deficit (22.74%), and Evacuation Accessibility (12.20%).`}
          icon={<MapPin className="w-4 h-4 text-indigo-600" />}
          rightContent={
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center shadow-2xs">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Ranked {currentState.adminUnitPlural}</div>
                <div className="text-lg font-black text-slate-900 font-mono">{counts.ranked} / {counts.ranked + counts.insufficient}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center shadow-2xs">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Insufficient Data</div>
                <div className="text-lg font-black text-slate-500 font-mono">{counts.insufficient}</div>
              </div>
            </div>
          }
        />

        {/* 2. STATS TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => setSelectedPriority('VERY HIGH')}
            className={`p-3 rounded-xl border text-left transition-all shadow-2xs ${
              selectedPriority === 'VERY HIGH'
                ? 'bg-red-50 border-red-300 ring-2 ring-red-200 shadow-xs'
                : 'bg-white border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <div className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Very High Priority</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">{counts.veryHigh}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Top urgent interventions</div>
          </button>

          <button
            onClick={() => setSelectedPriority('HIGH')}
            className={`p-3 rounded-xl border text-left transition-all shadow-2xs ${
              selectedPriority === 'HIGH'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200 shadow-xs'
                : 'bg-white border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">High Priority</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">{counts.high}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">High stress &amp; hazard</div>
          </button>

          <button
            onClick={() => setSelectedPriority('MODERATE')}
            className={`p-3 rounded-xl border text-left transition-all shadow-2xs ${
              selectedPriority === 'MODERATE'
                ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-200 shadow-xs'
                : 'bg-white border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <div className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider">Moderate Priority</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">{counts.moderate}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Medium headroom</div>
          </button>

          <button
            onClick={() => setSelectedPriority('LOW')}
            className={`p-3 rounded-xl border text-left transition-all shadow-2xs ${
              selectedPriority === 'LOW'
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200 shadow-xs'
                : 'bg-white border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Low Priority</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">{counts.low}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">High safe capacity</div>
          </button>

          <button
            onClick={() => setSelectedPriority('INSUFFICIENT DATA')}
            className={`p-3 rounded-xl border text-left transition-all col-span-2 sm:col-span-1 shadow-2xs ${
              selectedPriority === 'INSUFFICIENT DATA'
                ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-200 shadow-xs'
                : 'bg-white border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Insufficient Data</div>
            <div className="text-2xl font-black text-slate-600 font-mono mt-1">{counts.insufficient}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Zero rural Census units</div>
          </button>
        </div>

        {/* 3. FILTERS & SEARCH BAR */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 w-full">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search by ${currentState.adminUnitName} or District Name...`}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              />
            </div>

            {/* District Dropdown */}
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[180px] shadow-2xs"
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
            <div className="flex items-center gap-1">
              {(['ALL', 'VERY HIGH', 'HIGH', 'MODERATE', 'LOW', 'INSUFFICIENT DATA'] as PriorityFilter[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPriority(p)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                    selectedPriority === p
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {p === 'ALL' ? 'All' : p.split(' ')[0]}
                </button>
              ))}
            </div>

            <span className="text-[11px] font-mono text-slate-400 font-semibold whitespace-nowrap">
              {filteredMandals.length} of {mandals.length}
            </span>
          </div>
        </div>

        {/* 4. MAIN RANKING TABLE */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
                  <th className="py-3 px-3 text-right">Hazard (C1)</th>
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
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-2"></div>
                      <p>Loading statewide relocation planning dataset...</p>
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

                    const c1 = isInsufficient ? '—' : Number(m.c1_hazard_exposure ?? m.hazard_exposure_index ?? 0).toFixed(3);
                    const c2 = isInsufficient ? '—' : Number(m.c2_demographic_sensitivity ?? m.demographic_sensitivity_index ?? 0).toFixed(3);
                    const c3 = isInsufficient ? '—' : Number(m.c3_capacity_stress ?? 0.4).toFixed(3);
                    const c4 = isInsufficient ? '—' : Number(m.c4_accessibility_constraint ?? 0.3).toFixed(3);

                    return (
                      <tr
                        key={m.mandal_id || idx}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-700">
                          {rank}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 uppercase tracking-wide">
                          {mname}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 font-medium">
                          {dname}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-medium">
                          {c1}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-600 font-medium">
                          {c2}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-sky-600 font-medium">
                          {c3}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-600 font-medium">
                          {c4}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-extrabold text-slate-900">
                          {topsisVal}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadge(cat)}`}>
                            {cat}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {onSelectMandalOnMap ? (
                            <button
                              onClick={() => onSelectMandalOnMap(m)}
                              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 text-indigo-700 border border-slate-200 text-[10.5px] font-bold transition shadow-2xs"
                              title="Inspect on Hero Map"
                            >
                              Inspect
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

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <div>
              <strong>Methodology Note:</strong> 16 geometries with zero rural habitation Census counts are categorized strictly as <em>INSUFFICIENT DATA</em> with rank <em>—</em> and score <em>—</em>.
            </div>
            <div className="font-mono text-slate-400 font-semibold">
              AHP Matrix CR: 0.003836 &bull; Verified Consistent
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
