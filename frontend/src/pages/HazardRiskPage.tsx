import React, { useState, useEffect, useMemo } from 'react';
import type { MandalProperties } from '../types/gis';
import { fetchVulnerabilityGeoJson } from '../services/api';
import { PageHeader } from '../components/common/DesignSystem';
import { 
  AlertTriangle, 
  Droplets, 
  Wind, 
  Layers, 
  Compass, 
  Search
} from 'lucide-react';
import { useActiveState } from '../context/StateContext';

interface HazardRiskPageProps {
  onSelectMandalOnMap?: (mandal: MandalProperties) => void;
}

export const HazardRiskPage: React.FC<HazardRiskPageProps> = () => {
  const { currentState } = useActiveState();
  const [mandals, setMandals] = useState<MandalProperties[]>([]);
  const [selectedMandal, setSelectedMandal] = useState<MandalProperties | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');

  useEffect(() => {
    let isMounted = true;
    fetchVulnerabilityGeoJson()
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
        console.error('Failed to load hazard geojson:', err);
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
        const hazA = Number(a.hazard_exposure_index ?? 0);
        const hazB = Number(b.hazard_exposure_index ?? 0);
        return hazB - hazA;
      });
  }, [mandals, searchQuery, selectedDistrict]);

  const current = selectedMandal || filteredMandals[0] || ({} as MandalProperties);
  const activeMandal = current;

  const floodScore = Number(current.flood_exposure_score ?? 0);
  const cycloneScore = Number(current.cyclone_exposure_score ?? 0);
  const windScore = Number(current.wind_exposure_score ?? 0);
  const slopeScore = Number(current.steep_slope_constraint_score ?? 0);
  const overallHazard = Number(current.hazard_exposure_index ?? 0);

  const floodPct = (floodScore * 100).toFixed(2);
  const cyclonePct = (cycloneScore * 100).toFixed(2);
  const windPct = (windScore * 100).toFixed(2);
  const slopePct = (slopeScore * 100).toFixed(2);
  const overallHazardPct = (overallHazard * 100).toFixed(2);

  const dominantHazard = [
    { name: 'High Wind Exposure', val: windScore },
    { name: 'Surface Flood Inundation', val: floodScore },
    { name: 'Cyclone Storm Track Density', val: cycloneScore },
    { name: 'Steep Slope Constraint', val: slopeScore },
  ].sort((a, b) => b.val - a.val)[0].name;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-5 bg-transparent text-slate-800 select-none">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">

        {/* 1. HEADER */}
        <PageHeader
          category={`Hazard Exposure • 4-Factor Spatial Model (H_i) • ${currentState.name}`}
          title="Multi-Hazard Exposure Assessment"
          description={`Evaluating 38-year historical surface water recurrence (JRC), 50-year cyclone storm track buffers (IBTrACS), BMTPC basic design wind speeds, and SRTM terrain slope constraints across ${currentState.name}.`}
          icon={<AlertTriangle className="w-4 h-4 text-rose-600" />}
          rightContent={
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right shrink-0 shadow-2xs">
              <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">AHP Weight in Relocation</div>
              <div className="text-xl font-black text-rose-600 font-mono">42.31% (C1)</div>
            </div>
          }
        />

        {/* 2. 2-COLUMN LAYOUT: LIST ON LEFT, DETAIL INSPECTION ON RIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">

          {/* LEFT LIST: ALL UNITS RANKED BY HAZARD EXPOSURE */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col h-[680px]">
            <div className="space-y-3 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Ranked by Hazard (H_i)</span>
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
                const haz = Number(m.hazard_exposure_index ?? 0);
                const isSelected = activeMandal?.mandal_id === m.mandal_id || activeMandal?.mandal_name === m.mandal_name;

                return (
                  <button
                    key={m.mandal_id || idx}
                    onClick={() => setSelectedMandal(m)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-rose-50/90 border-rose-200 text-rose-950 font-bold shadow-xs'
                        : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs uppercase text-slate-900">{mname}</div>
                      <div className="text-[10px] text-slate-500">{dname} District</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-rose-600 text-xs">{(haz * 100).toFixed(1)}%</div>
                      <div className="text-[9px] text-slate-400 font-mono">Score: {haz.toFixed(3)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT DETAIL: SELECTED MANDAL HAZARD BREAKDOWN */}
          <div className="lg:col-span-7 space-y-4">
            {activeMandal ? (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
                
                {/* MANDAL HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                      Hazard Profile Detail
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-wide">
                      {activeMandal.mandal_name || activeMandal.DMNAME}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeMandal.current_district_name || activeMandal.DNAME} District &bull; Population: {Number(activeMandal.population_total ?? 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs text-slate-400 font-mono font-semibold">Overall Hazard (H_i)</span>
                    <span className="text-3xl font-black text-rose-600 font-mono">{overallHazardPct}%</span>
                    <span className="text-[10px] text-slate-500 font-mono font-semibold">Normalized: {overallHazard.toFixed(4)}</span>
                  </div>
                </div>

                {/* DOMINANT HAZARD HIGHLIGHT */}
                <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                      Primary Driving Hazard Factor
                    </span>
                    <strong className="text-base font-extrabold text-slate-900">{dominantHazard}</strong>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-rose-100/80 text-rose-800 border border-rose-200 text-xs font-bold font-mono">
                    High Impact
                  </span>
                </div>

                {/* 4 HAZARD COMPONENT PROGRESS BARS */}
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    4-Factor Exposure Component Breakdown
                  </h3>

                  {/* Flood */}
                  <div className="space-y-1.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Droplets className="w-4 h-4 text-sky-600" />
                        Surface Flood Inundation Exposure
                      </span>
                      <span className="font-mono text-sky-600 font-extrabold text-sm">{floodPct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-sky-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, floodScore * 100))}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Source: JRC Global Surface Water (38-year spatial inundation recurrence frequency).
                    </p>
                  </div>

                  {/* Cyclone */}
                  <div className="space-y-1.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-teal-600" />
                        Cyclone Storm Track &amp; Surge Exposure
                      </span>
                      <span className="font-mono text-teal-600 font-extrabold text-sm">{cyclonePct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, cycloneScore * 100))}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Source: NOAA IBTrACS archive (50-year storm tracks, 100km wind decay buffers).
                    </p>
                  </div>

                  {/* Wind */}
                  <div className="space-y-1.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Wind className="w-4 h-4 text-amber-600" />
                        Basic Design Wind Speed Hazard
                      </span>
                      <span className="font-mono text-amber-600 font-extrabold text-sm">{windPct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, windScore * 100))}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Source: BMTPC Vulnerability Atlas of India (basic design wind speed thresholds 44–55 m/s).
                    </p>
                  </div>

                  {/* Slope */}
                  <div className="space-y-1.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-orange-600" />
                        Steep Slope &amp; Terrain Constraint
                      </span>
                      <span className="font-mono text-orange-600 font-extrabold text-sm">{slopePct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, slopeScore * 100))}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Source: NASA SRTM 30m DEM (Horn algorithm slope steepness constraint &gt; 15&deg;).
                    </p>
                  </div>
                </div>

                {/* NOTE */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 space-y-1 shadow-2xs">
                  <strong className="text-slate-700">Scientific Methodology Note:</strong>
                  <p>
                    Exposure percentages represent normalized index scores multiplied by 100 for decision readability. They do not denote probabilistic event forecast or meteorological return probability.
                  </p>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-slate-400 shadow-xs">
                Select a mandal from the left list to inspect hazard components.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
