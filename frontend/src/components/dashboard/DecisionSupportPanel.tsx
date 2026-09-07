import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { MandalProperties } from '../../types/gis';
import { 
  Search, 
  MapPin, 
  ChevronRight, 
  X,
  ShieldAlert,
  ArrowUpDown,
  Filter,
  ArrowRight
} from 'lucide-react';
import { useActiveState } from '../../context/StateContext';

interface DecisionSupportPanelProps {
  mandals: MandalProperties[];
  selectedMandalId?: string | null;
  onSelectMandal: (mandal: MandalProperties) => void;
  onNavigateToRelocation?: () => void;
}

type PriorityFilter = 'ALL' | 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT DATA';

export const DecisionSupportPanel: React.FC<DecisionSupportPanelProps> = ({
  mandals,
  selectedMandalId,
  onSelectMandal,
  onNavigateToRelocation,
}) => {
  const { currentState } = useActiveState();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<PriorityFilter>('ALL');
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'hazard' | 'name'>('rank');
  const listContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Count priority statistics
  const counts = useMemo(() => {
    let veryHigh = 0, high = 0, moderate = 0, low = 0, insufficient = 0;
    for (const m of mandals) {
      const pop = Number(m.population_total ?? 0);
      const isInsufficient =
        m.relocation_priority_category === 'INSUFFICIENT-DATA' ||
        m.ranking_status === 'INSUFFICIENT_DATA' ||
        m.demographic_data_flag === 'ZERO_RURAL_CENSUS_HABITATIONS' ||
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
    return { all: mandals.length, veryHigh, high, moderate, low, insufficient };
  }, [mandals]);

  const filterTabs: { id: PriorityFilter; label: string; count: number; color: string; activeBorder: string }[] = [
    { id: 'ALL', label: 'All', count: counts.all, color: 'text-slate-300', activeBorder: 'border-indigo-500 bg-indigo-600/20 text-indigo-200' },
    { id: 'VERY HIGH', label: 'Very High', count: counts.veryHigh, color: 'text-rose-400', activeBorder: 'border-rose-500 bg-rose-500/20 text-rose-200' },
    { id: 'HIGH', label: 'High', count: counts.high, color: 'text-amber-400', activeBorder: 'border-amber-500 bg-amber-500/20 text-amber-200' },
    { id: 'MODERATE', label: 'Moderate', count: counts.moderate, color: 'text-yellow-400', activeBorder: 'border-yellow-500 bg-yellow-500/20 text-yellow-200' },
    { id: 'LOW', label: 'Low', count: counts.low, color: 'text-emerald-400', activeBorder: 'border-emerald-500 bg-emerald-500/20 text-emerald-200' },
    { id: 'INSUFFICIENT DATA', label: 'Insufficient', count: counts.insufficient, color: 'text-slate-400', activeBorder: 'border-slate-500 bg-slate-700/40 text-slate-300' },
  ];

  // Filter and sort mandals
  const filteredMandals = useMemo(() => {
    return mandals.filter((m) => {
      const name = (m.mandal_name || m.DMNAME || '').toLowerCase();
      const district = (m.current_district_name || m.DNAME || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || name.includes(q) || district.includes(q);

      const pop = Number(m.population_total ?? 0);
      const isInsufficient =
        m.relocation_priority_category === 'INSUFFICIENT-DATA' ||
        m.ranking_status === 'INSUFFICIENT_DATA' ||
        m.demographic_data_flag === 'ZERO_RURAL_CENSUS_HABITATIONS' ||
        pop === 0 ||
        m.topsis_score === undefined ||
        m.topsis_score === null;

      const cat = isInsufficient ? 'INSUFFICIENT DATA' : (m.relocation_priority_category || 'MODERATE').toUpperCase().replace('-', ' ');

      let matchesFilter = true;
      if (selectedFilter === 'ALL') {
        matchesFilter = true;
      } else if (selectedFilter === 'INSUFFICIENT DATA') {
        matchesFilter = isInsufficient;
      } else {
        matchesFilter = cat === selectedFilter && !isInsufficient;
      }

      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = a.mandal_name || a.DMNAME || '';
        const nameB = b.mandal_name || b.DMNAME || '';
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'score') {
        const scoreA = Number(a.topsis_score ?? -1);
        const scoreB = Number(b.topsis_score ?? -1);
        return scoreB - scoreA;
      }
      if (sortBy === 'hazard') {
        const hazA = Number(a.hazard_exposure_index ?? a.c1_hazard_exposure ?? -1);
        const hazB = Number(b.hazard_exposure_index ?? b.c1_hazard_exposure ?? -1);
        return hazB - hazA;
      }
      // default: rank ascending
      const rankA = a.relocation_priority_rank ? Number(a.relocation_priority_rank) : 9999;
      const rankB = b.relocation_priority_rank ? Number(b.relocation_priority_rank) : 9999;
      return rankA - rankB;
    });
  }, [mandals, searchQuery, selectedFilter, sortBy]);

  // Synchronize scroll with selected mandal
  useEffect(() => {
    if (selectedMandalId) {
      const el = itemRefs.current.get(selectedMandalId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedMandalId]);

  return (
    <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-3.5 space-y-3 shadow-lg flex flex-col">
      {/* 1. SECTION HEADER */}
      <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              DECISION SUPPORT
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Priority Areas &bull; <span className="font-mono text-slate-300">{(mandals.length - counts.insufficient) || currentState.adminUnitCount} Ranked {currentState.adminUnitPlural}</span>
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-semibold">
          {counts.veryHigh} Very High
        </span>
      </div>

      {/* 2. SEARCH & CONTROLS */}
      <div className="space-y-2">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${currentState.adminUnitName} or District...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills & Sort Options */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <span className="flex items-center gap-1 font-semibold text-slate-300">
            <Filter className="w-3 h-3 text-slate-400" />
            Filters:
          </span>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-[10px] text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="rank">Sort: Priority Rank (#1...)</option>
              <option value="score">Sort: TOPSIS Score</option>
              <option value="hazard">Sort: Hazard Exposure</option>
              <option value="name">Sort: Name (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1">
          {filterTabs.map((tab) => {
            const isActive = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 border ${
                  isActive
                    ? `${tab.activeBorder} shadow-sm font-bold`
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border-slate-800/80 hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`font-mono text-[9px] px-1 rounded-full ${isActive ? 'bg-slate-900/80' : 'bg-slate-900'} ${tab.color}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SCROLLABLE PRIORITY MANDALS LIST */}
      <div 
        ref={listContainerRef}
        className="max-h-[320px] overflow-y-auto custom-scrollbar space-y-1.5 pr-0.5"
      >
        {filteredMandals.length > 0 ? (
          filteredMandals.map((m) => {
            const mId = m.mandal_id || '';
            const mName = m.mandal_name || m.DMNAME || 'Mandal';
            const dName = m.current_district_name || m.DNAME || 'District';
            const pop = Number(m.population_total ?? 0);
            
            const isInsufficient =
              m.relocation_priority_category === 'INSUFFICIENT-DATA' ||
              m.ranking_status === 'INSUFFICIENT_DATA' ||
              m.demographic_data_flag === 'ZERO_RURAL_CENSUS_HABITATIONS' ||
              pop === 0 ||
              m.topsis_score === undefined ||
              m.topsis_score === null;

            const cat = isInsufficient 
              ? 'INSUFFICIENT DATA' 
              : (m.relocation_priority_category || 'MODERATE').toUpperCase().replace('-', ' ');
            
            const rank = isInsufficient ? null : m.relocation_priority_rank;
            const score = isInsufficient ? null : (m.topsis_score !== undefined && m.topsis_score !== null ? Number(m.topsis_score) : null);
            const isSelected = selectedMandalId === mId;

            // Restrained priority badge & indicator dot
            let priorityDot = '🔴';
            let priorityBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
            let priorityLabel = 'VERY HIGH PRIORITY';

            if (isInsufficient) {
              priorityDot = '⚪';
              priorityBadgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
              priorityLabel = 'INSUFFICIENT DATA';
            } else if (cat === 'VERY HIGH') {
              priorityDot = '🔴';
              priorityBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
              priorityLabel = 'VERY HIGH PRIORITY';
            } else if (cat === 'HIGH') {
              priorityDot = '🟠';
              priorityBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
              priorityLabel = 'HIGH PRIORITY';
            } else if (cat === 'MODERATE') {
              priorityDot = '🟡';
              priorityBadgeColor = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
              priorityLabel = 'MODERATE PRIORITY';
            } else if (cat === 'LOW') {
              priorityDot = '🟢';
              priorityBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
              priorityLabel = 'LOW PRIORITY';
            }

            return (
              <div
                key={mId}
                ref={(el) => {
                  if (el) itemRefs.current.set(mId, el);
                  else itemRefs.current.delete(mId);
                }}
                onClick={() => onSelectMandal(m)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col space-y-1.5 group ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                    : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Dot + Mandal Name + District + Rank / TOPSIS */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-1.5">
                    <span className="text-xs leading-none shrink-0" title={cat}>
                      {priorityDot}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide truncate group-hover:text-indigo-300 transition-colors">
                        {mName}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                        {dName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono font-bold text-slate-300 block">
                      {rank ? `Rank #${rank}` : 'Rank —'}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-emerald-400">
                      {score !== null ? `TOPSIS ${score.toFixed(4)}` : 'TOPSIS —'}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Priority Category Label + Explore Arrow */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border text-[9px] ${priorityBadgeColor}`}>
                    {priorityLabel}
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-indigo-300 font-medium flex items-center gap-0.5 transition-colors">
                    <span>Inspect</span>
                    <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all" />
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800/60">
            No mandals found matching &ldquo;{searchQuery}&rdquo;.
          </div>
        )}
      </div>

      {/* 4. FOOTER LINK: VIEW FULL RELOCATION PLANNING */}
      {onNavigateToRelocation && (
        <button
          onClick={onNavigateToRelocation}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500/60 text-xs font-bold transition shadow-sm"
        >
          <span>View Full Relocation Planning</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
