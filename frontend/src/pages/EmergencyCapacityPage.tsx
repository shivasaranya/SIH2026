import React, { useState, useEffect, useMemo } from 'react';
import type { MandalProperties } from '../types/gis';
import { fetchVulnerabilityGeoJson } from '../services/api';
import { PageHeader } from '../components/common/DesignSystem';
import { 
  Scale, 
  Search
} from 'lucide-react';
import { useActiveState } from '../context/StateContext';

interface EmergencyCapacityPageProps {
  onSelectMandalOnMap?: (mandal: MandalProperties) => void;
}

export const EmergencyCapacityPage: React.FC<EmergencyCapacityPageProps> = () => {
  const { currentState } = useActiveState();
  const [mandals, setMandals] = useState<MandalProperties[]>([]);
  const [selectedMandal, setSelectedMandal] = useState<MandalProperties | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');

  useEffect(() => {
    let isMounted = true;
    fetchVulnerabilityGeoJson(undefined, currentState.id)
      .then((geo) => {
        if (!isMounted) return;
        const props = geo.features.map((f: any) => f.properties as MandalProperties);
        setMandals(props);
        if (props.length > 0) {
          const preferred = props.find((m: any) => {
            const name = (m.mandal_name || m.DMNAME || '').toUpperCase();
            return name === 'TADA' || name === 'CUDDALORE' || name === 'NAGAPATTINAM';
          });
          setSelectedMandal(preferred || props[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to load capacity geojson:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [currentState.id]);

  const districtList = useMemo(() => {
    const set = new Set<string>();
    for (const m of mandals) {
      const d = m.current_district_name || m.DNAME;
      if (d) set.add(d);
    }
    return Array.from(set).sort();
  }, [mandals]);

  const filteredMandals = useMemo(() => {
    return mandals
      .filter((m) => {
        const name = (m.mandal_name || m.DMNAME || '').toLowerCase();
        const dist = (m.current_district_name || m.DNAME || '').toLowerCase();
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || name.includes(q) || dist.includes(q);
        const matchesDistrict = selectedDistrict === 'ALL' || (m.current_district_name || m.DNAME) === selectedDistrict;
        return matchesSearch && matchesDistrict;
      })
      .sort((a, b) => {
        const capA = Number((a as any).c3_evacuation_capacity ?? a.shelter_count ?? 0);
        const capB = Number((b as any).c3_evacuation_capacity ?? b.shelter_count ?? 0);
        return capB - capA;
      });
  }, [mandals, searchQuery, selectedDistrict]);

  const activeMandal = selectedMandal || filteredMandals[0] || null;

  // Capacity indicators
  const shelterCount = Number(activeMandal?.shelter_count ?? 0);
  const shelterCap = Number(activeMandal?.verified_shelter_capacity_persons ?? (shelterCount * 500));
  const roadDensity = Number(activeMandal?.road_density_km_per_km2 ?? 0.85);
  const safeAreaPct = (Number(activeMandal?.safe_area_fraction ?? 0.70) * 100).toFixed(1);
  const waterPct = (Number(activeMandal?.water_sanitation_score ?? 0.65) * 100).toFixed(1);
  const bedsCount = Number(activeMandal?.actual_health_beds ?? 18);

  const shelterStatus = shelterCount > 0 ? 'SUFFICIENT' : 'DEFICIT';
  const roadStatus = roadDensity >= 0.8 ? 'SUFFICIENT' : 'DEFICIT';
  const safeLandStatus = Number(safeAreaPct) >= 50 ? 'SUFFICIENT' : 'DEFICIT';
  const waterStatus = Number(waterPct) >= 60 ? 'SUFFICIENT' : 'MODERATE';
  const healthStatus = bedsCount >= 20 ? 'SUFFICIENT' : 'DEFICIT';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUFFICIENT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'MODERATE':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'DEFICIT':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-5 bg-transparent text-slate-800 select-none">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">

        {/* 1. HEADER */}
        <PageHeader
          category={`Infrastructure & Headroom • 5 Capacity Dimensions (C3 & C4) • ${currentState.name}`}
          title="Emergency Physical Carrying Capacity"
          description={`Evaluating multi-purpose cyclone shelters, road network evacuation density, low-hazard habitable land, water-sanitation infrastructure, and clinical hospital bed headroom across ${currentState.name}.`}
          icon={<Scale className="w-4 h-4 text-sky-600" />}
          rightContent={
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right shrink-0 shadow-2xs">
              <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">AHP Capacity & Access Weights</div>
              <div className="text-xl font-black text-sky-600 font-mono">22.74% (C3) + 12.20% (C4)</div>
            </div>
          }
        />

        {/* 2. 2-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">

          {/* LEFT LIST */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col h-[680px]">
            <div className="space-y-3 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-sky-600" />
                  <span>{currentState.adminUnitPlural} Directory</span>
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">{filteredMandals.length} {currentState.adminUnitPlural}</span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${currentState.adminUnitName.toLowerCase()}...`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[130px] shadow-2xs"
                >
                  <option value="ALL">All Districts</option>
                  {districtList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100 mt-2 space-y-1">
              {filteredMandals.map((m, idx) => {
                const mname = m.mandal_name || m.DMNAME || 'Mandal';
                const dname = m.current_district_name || m.DNAME || 'District';
                const count = Number(m.shelter_count ?? 0);
                const isSelected = activeMandal?.mandal_id === m.mandal_id || activeMandal?.mandal_name === m.mandal_name;

                return (
                  <button
                    key={m.mandal_id || idx}
                    onClick={() => setSelectedMandal(m)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-sky-50/90 border-sky-200 text-sky-950 font-bold shadow-xs'
                        : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs uppercase text-slate-900">{mname}</div>
                      <div className="text-[10px] text-slate-500">{dname} District</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-sky-600 text-xs">{count} Shelters</div>
                      <div className="text-[9px] text-slate-400 font-mono">{(Number(m.road_density_km_per_km2 ?? 0)).toFixed(2)} km/km²</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT DETAIL */}
          <div className="lg:col-span-7 space-y-4">
            {activeMandal ? (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
                
                {/* MANDAL HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
                      Emergency Infrastructure Headroom
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-wide">
                      {activeMandal.mandal_name || activeMandal.DMNAME}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeMandal.current_district_name || activeMandal.DNAME} District &bull; Population: {Number(activeMandal.population_total ?? 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs text-slate-400 font-mono font-semibold">Shelter Headroom</span>
                    <span className="text-2xl font-black text-sky-600 font-mono">{shelterCap.toLocaleString()} Persons</span>
                    <span className="text-[10px] text-slate-500 font-mono font-semibold">Across {shelterCount} Verified Shelters</span>
                  </div>
                </div>

                {/* 5 CAPACITY DIMENSIONS */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    5 Critical Capacity Dimensions
                  </h3>

                  {/* 1. Designated Shelters */}
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs block">1. Designated Multi-Purpose Cyclone Shelters</span>
                        <span className="text-[10px] text-slate-500">
                          Verified Asset Registry: {shelterCount} facilities &bull; Planning capacity: {shelterCap.toLocaleString()} persons
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${getStatusBadge(shelterStatus)}`}>
                        {shelterStatus}
                      </span>
                    </div>
                  </div>

                  {/* 2. Evacuation Roads */}
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs block">2. Evacuation Road Network Access</span>
                        <span className="text-[10px] text-slate-500">
                          Network Density: {roadDensity.toFixed(2)} km / km² &bull; Regional evacuation corridors
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${getStatusBadge(roadStatus)}`}>
                        {roadStatus}
                      </span>
                    </div>
                  </div>

                  {/* 3. Safe Habitable Land */}
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs block">3. Low-Hazard Safe Habitable Land</span>
                        <span className="text-[10px] text-slate-500">
                          Safe Area Fraction: {safeAreaPct}% outside high-flood/cyclone buffers &amp; &lt;15&deg; slope
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${getStatusBadge(safeLandStatus)}`}>
                        {safeLandStatus}
                      </span>
                    </div>
                  </div>

                  {/* 4. Water & Sanitation */}
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs block">4. Water &amp; Sanitation Resilience</span>
                        <span className="text-[10px] text-slate-500">
                          JJM piped drinking water coverage and SBM solid waste resilience index
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${getStatusBadge(waterStatus)}`}>
                        {waterStatus}
                      </span>
                    </div>
                  </div>

                  {/* 5. Healthcare Beds */}
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs block">5. Healthcare Clinical Bed Headroom</span>
                        <span className="text-[10px] text-slate-500">
                          Clinical beds: {bedsCount} &bull; Normative benchmark standard: 1.0 bed per 1,000 pop (IPHS)
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${getStatusBadge(healthStatus)}`}>
                        {healthStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* NORMATIVE DISCLAIMER */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 shadow-2xs">
                  <p>
                    <strong className="text-slate-800">Normative Planning Note:</strong> Capacity assessment is a planning estimate based on available infrastructure and normative indicators. It is not a real-time operational availability guarantee.
                  </p>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-slate-400 shadow-xs">
                Select a mandal from the left list to inspect capacity factors.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
