import React, { useState, useMemo } from 'react';
import type { MandalProperties } from '../../types/gis';
import { 
  Search, 
  MapPin, 
  ChevronRight, 
  X,
  AlertTriangle,
  ArrowUpDown,
  Filter
} from 'lucide-react';

interface PriorityListPanelProps {
  mandals: MandalProperties[];
  selectedMandalId?: string | null;
  onSelectMandal: (mandal: MandalProperties) => void;
  onClose?: () => void;
}

type PriorityFilter = 'ALL' | 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT DATA';

export const PriorityListPanel: React.FC<PriorityListPanelProps> = ({
  mandals,
  selectedMandalId,
  onSelectMandal,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<PriorityFilter>('ALL');
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'name'>('rank');

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
      // default: rank
      const rankA = a.relocation_priority_rank ? Number(a.relocation_priority_rank) : 9999;
      const rankB = b.relocation_priority_rank ? Number(b.relocation_priority_rank) : 9999;
      return rankA - rankB;
    });
  }, [mandals, searchQuery, selectedFilter, sortBy]);

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

  const filterTabs: { id: PriorityFilter; label: string; count: number; color: string }[] = [
    { id: 'ALL', label: 'All', count: counts.all, color: 'text-slate-300' },
    { id: 'VERY HIGH', label: 'Very High', count: counts.veryHigh, color: 'text-rose-400' },
    { id: 'HIGH', label: 'High', count: counts.high, color: 'text-amber-400' },
    { id: 'MODERATE', label: 'Moderate', count: counts.moderate, color: 'text-sky-400' },
    { id: 'LOW', label: 'Low', count: counts.low, color: 'text-emerald-400' },
    { id: 'INSUFFICIENT DATA', label: 'Insufficient Data', count: counts.insufficient, color: 'text-slate-500' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900/95 backdrop-blur-md border-r border-slate-800 text-slate-100 shadow-2xl select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Priority Area Directory</h3>
            <p className="text-[10px] text-slate-400">
              {filteredMandals.length} of {mandals.length} Mandals ({counts.veryHigh} Very High Priority)
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search & Sort Bar */}
      <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-900/60">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Mandal or District..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Filter className="w-3 h-3 text-slate-500" /> Filter by Priority:
          </span>
          <div className="flex items-center gap-1 text-slate-400">
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-[10px] text-slate-300 focus:outline-none"
            >
              <option value="rank">Sort: Priority Rank</option>
              <option value="score">Sort: Priority Score</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1 pt-0.5">
          {filterTabs.map((tab) => {
            const isActive = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition flex items-center gap-1 ${
                  isActive
                    ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`font-mono text-[9px] px-1 rounded-full ${isActive ? 'bg-indigo-500/30' : 'bg-slate-800'} ${tab.color}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
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

            const cat = isInsufficient ? 'INSUFFICIENT DATA' : (m.relocation_priority_category || 'MODERATE');
            const rank = isInsufficient ? null : m.relocation_priority_rank;
            const score = isInsufficient ? null : (m.topsis_score !== undefined && m.topsis_score !== null ? Number(m.topsis_score) : null);
            const isSelected = selectedMandalId === mId;

            const badgeColor =
              isInsufficient
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : cat === 'VERY HIGH'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : cat === 'HIGH'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : cat === 'MODERATE'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

            return (
              <div
                key={mId}
                onClick={() => onSelectMandal(m)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500/60 ring-1 ring-indigo-500/30 shadow-md'
                    : 'bg-slate-950/50 hover:bg-slate-800/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center space-x-1.5">
                    {rank && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                        #{rank}
                      </span>
                    )}
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                      {mName}
                    </h4>
                  </div>

                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1">
                    <span className="flex items-center gap-0.5 truncate">
                      <MapPin className="w-2.5 h-2.5 text-slate-500" />
                      {dName}
                    </span>
                    <span>&bull;</span>
                    <span>Pop: {pop > 0 ? pop.toLocaleString() : 'N/A'}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end space-y-1">
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                    {cat}
                  </span>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <span>Score:</span>
                    <span className="font-bold text-slate-200">
                      {score !== null ? score.toFixed(3) : 'N/A'}
                    </span>
                    <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-300 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-slate-500 text-xs">
            No mandals match the search filter.
          </div>
        )}
      </div>

      {/* Footer / Instruction */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/80 text-[10px] text-slate-400 text-center">
        Click any mandal to focus map & view full assessment.
      </div>
    </div>
  );
};
