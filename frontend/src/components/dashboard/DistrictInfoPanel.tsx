import React, { useState } from 'react';
import type { DistrictDetailResponse } from '../../types/demographics';
import { useActiveState } from '../../context/StateContext';
import { X, Users, Home, Briefcase, Search, AlertCircle } from 'lucide-react';

interface DistrictInfoPanelProps {
  districtDetail: DistrictDetailResponse | null;
  loading: boolean;
  onClose: () => void;
}

export const DistrictInfoPanel: React.FC<DistrictInfoPanelProps> = ({
  districtDetail,
  loading,
  onClose,
}) => {
  const { currentState } = useActiveState();
  const [searchMandal, setSearchMandal] = useState('');

  if (loading) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-2xl w-80 sm:w-96 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-3/4 mb-4"></div>
        <div className="h-24 bg-slate-800 rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-800 rounded"></div>
          <div className="h-4 bg-slate-800 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!districtDetail) {
    return null;
  }

  const { district, mandals } = districtDetail;

  const filteredMandals = mandals.filter((m) =>
    m.mandal_name.toLowerCase().includes(searchMandal.toLowerCase())
  );

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl w-80 sm:w-96 max-h-[85vh] flex flex-col overflow-hidden text-slate-100">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-start justify-between bg-slate-800/40">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-lg text-white tracking-tight">{district.district_name}</h3>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {currentState.districtCount} Districts {currentState.code}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {district.mandal_count} {currentState.adminUnitPlural} • {district.village_count.toLocaleString()} Villages
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="p-4 overflow-y-auto space-y-4 flex-1">
        {/* Core Population & Households */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
            <div className="flex items-center space-x-2 text-slate-400 mb-1">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px]">Rural Population</span>
            </div>
            <p className="text-base font-bold text-white">
              {district.total_population.toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
            <div className="flex items-center space-x-2 text-slate-400 mb-1">
              <Home className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px]">Households</span>
            </div>
            <p className="text-base font-bold text-white">
              {district.total_households.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Population Profile & Demographic Indicators */}
        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Population Profile (Census 2011)
            </span>
          </div>

          {/* Children 0-6 */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Children (0–6 Years):</span>
              <span className="font-semibold text-purple-300">
                {district.children_0_6.toLocaleString()} ({district.children_0_6_pct}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${Math.min(district.children_0_6_pct * 5, 100)}%` }}
              />
            </div>
          </div>

          {/* Adult Population (7+) */}
          <div className="p-2 bg-slate-900/60 rounded border border-slate-800 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Adult Population (7+):</span>
              <span className="font-bold text-slate-200">
                {(district.total_population - district.children_0_6).toLocaleString()} ({(((district.total_population - district.children_0_6) / district.total_population) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Older People & Disabilities */}
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
            <div className="p-1.5 bg-slate-900/40 rounded border border-dashed border-slate-800">
              <span className="block font-semibold text-slate-300">Older People (60+)</span>
              <span className="text-[9px] text-slate-500">Unavailable in PCA</span>
            </div>
            <div className="p-1.5 bg-slate-900/40 rounded border border-dashed border-slate-800">
              <span className="block font-semibold text-slate-300">Disabilities</span>
              <span className="text-[9px] text-slate-500">Unavailable in PCA</span>
            </div>
          </div>

          {/* Non-Workers */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/50">
            <span className="flex items-center space-x-1.5 text-slate-400">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>Non-Workers (Mobilization Proxy):</span>
            </span>
            <span className="font-mono text-slate-200 font-bold">
              {(district.total_population - district.workers).toLocaleString()} ({(((district.total_population - district.workers) / district.total_population) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Administrative Units List with Search */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">
              {currentState.adminUnitPlural} in {district.district_name} ({mandals.length})
            </span>
          </div>

          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${currentState.adminUnitName.toLowerCase()}...`}
              value={searchMandal}
              onChange={(e) => setSearchMandal(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {filteredMandals.map((m) => (
              <div
                key={m.mandal_code}
                className="flex items-center justify-between p-2 rounded bg-slate-800/50 hover:bg-slate-800 border border-slate-700/30 text-xs transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-200">{m.mandal_name}</p>
                  <p className="text-[10px] text-slate-400">{m.village_count} villages</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-slate-300">{m.total_population.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 font-mono">pop</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Caveat */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex items-start space-x-2 text-[11px] text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <p className="leading-tight">
            <strong>Census 2011 Data:</strong> Figures represent Primary Census Abstract (PCA) values spatially mapped to modern {currentState.districtCount}-district boundaries.
          </p>
        </div>
      </div>
    </div>
  );
};
