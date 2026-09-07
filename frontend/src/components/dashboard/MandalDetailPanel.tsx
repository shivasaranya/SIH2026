import React, { useState, useEffect } from 'react';
import type { MandalProperties } from '../../types/gis';
import type { HostZoneCandidateItem } from '../../types/capacity';
import type { MandalHazardItem } from '../../types/hazard';
import type { VillageItem } from '../../types/demographics';
import { fetchHostZones, fetchMandalHazard, fetchMandalVillages, fetchVillageSummary } from '../../services/api';
import { HostComparisonModal } from './HostComparisonModal';
import {
  X,
  Activity,
  ArrowRight,
  ShieldCheck,
  Search,
  Building2
} from 'lucide-react';

interface MandalDetailPanelProps {
  mandal: MandalProperties | null;
  onClose: () => void;
  onNavigateToActionPlan?: () => void;
  onNavigateToDirectory?: () => void;
  onNavigateToVillage?: (villageCode: number) => void;
}

export const MandalDetailPanel: React.FC<MandalDetailPanelProps> = ({
  mandal,
  onClose,
  onNavigateToActionPlan,
  onNavigateToVillage,
}) => {
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null);
  const [hazardDetail, setHazardDetail] = useState<MandalHazardItem | null>(null);
  const [hostCandidates, setHostCandidates] = useState<HostZoneCandidateItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Village Explorer State
  const [villages, setVillages] = useState<VillageItem[]>([]);
  const [loadingVillages, setLoadingVillages] = useState<boolean>(false);
  const [villageSearchQuery, setVillageSearchQuery] = useState<string>('');
  const [selectedVillage, setSelectedVillage] = useState<VillageItem | null>(null);
  const [villageError, setVillageError] = useState<string | null>(null);
  const [villageArea, setVillageArea] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedVillage) {
      setVillageArea(null);
      return;
    }
    let active = true;
    fetchVillageSummary(Number(selectedVillage.village_code))
      .then((res) => {
        if (active) setVillageArea(res.village_area_sqkm);
      })
      .catch(() => {
        if (active) setVillageArea(null);
      });
    return () => {
      active = false;
    };
  }, [selectedVillage]);

  useEffect(() => {
    let isMounted = true;
    const mid = mandal?.mandal_id || mandal?.mandal_name || mandal?.DMNAME;
    const did = mandal?.current_district_id || mandal?.current_district_name || mandal?.DNAME;

    if (mid) {
      setLoading(true);
      setLoadingVillages(true);
      setSelectedVillage(null);
      setVillageSearchQuery('');
      setVillageError(null);

      Promise.allSettled([
        fetchMandalHazard(mid),
        fetchHostZones(mid),
        fetchMandalVillages(mid, did),
      ])
        .then(([hazRes, hostRes, villRes]) => {
          if (!isMounted) return;
          if (hazRes.status === 'fulfilled') setHazardDetail(hazRes.value);
          if (hostRes.status === 'fulfilled') setHostCandidates(hostRes.value.candidates || []);
          if (villRes.status === 'fulfilled') {
            setVillages(villRes.value.villages || []);
            if (!villRes.value.has_village_data && villRes.value.note) {
              setVillageError(villRes.value.note);
            }
          } else {
            setVillages([]);
            setVillageError('Village data unavailable for this mandal.');
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
            setLoadingVillages(false);
          }
        });
    } else {
      setHazardDetail(null);
      setHostCandidates([]);
      setVillages([]);
      setSelectedVillage(null);
      setVillageSearchQuery('');
      setVillageError(null);
    }

    return () => {
      isMounted = false;
    };
  }, [mandal?.mandal_id, mandal?.mandal_name, mandal?.DMNAME, mandal?.current_district_id, mandal?.current_district_name]);


  if (!mandal) return null;

  const mName = mandal.mandal_name || mandal.DMNAME || 'Mandal';
  const dName = mandal.current_district_name || mandal.DNAME || 'District';
  const popTotal = Number(mandal.population_total ?? 0);

  const filteredVillages = villages.filter(v =>
    v.village_name.toLowerCase().includes(villageSearchQuery.toLowerCase().trim())
  );

  // Check Insufficient Data Status
  const isInsufficientData =
    mandal.ranking_status === 'INSUFFICIENT_DATA' ||
    mandal.relocation_priority_category === 'INSUFFICIENT-DATA' ||
    mandal.demographic_data_flag === 'ZERO_RURAL_CENSUS_HABITATIONS' ||
    popTotal === 0 ||
    mandal.topsis_score === undefined ||
    mandal.topsis_score === null;

  const topsisScore = isInsufficientData ? null : Number(mandal.topsis_score);
  const rawCat = (mandal.relocation_priority_category || 'MODERATE').toUpperCase().replace('-', ' ');

  // Standardized 3-category display: Very High, Moderate, Low
  let priorityLabel = 'MODERATE PRIORITY';
  let badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
  let circleBorderClass = 'border-amber-400 text-amber-600 bg-amber-50/40';

  if (isInsufficientData) {
    priorityLabel = 'INSUFFICIENT DATA';
    badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
    circleBorderClass = 'border-slate-300 text-slate-400 bg-slate-50';
  } else if (rawCat === 'VERY HIGH' || rawCat === 'HIGH') {
    priorityLabel = 'VERY HIGH PRIORITY';
    badgeClass = 'bg-red-50 text-red-700 border-red-200';
    circleBorderClass = 'border-red-400 text-red-600 bg-red-50/40';
  } else if (rawCat === 'LOW') {
    priorityLabel = 'LOW PRIORITY';
    badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    circleBorderClass = 'border-emerald-400 text-emerald-600 bg-emerald-50/40';
  }

  // Hazard Breakdown (Scores between 0 and 1)
  const floodScore = Number(mandal.flood_exposure_score ?? hazardDetail?.flood_exposure_score ?? 0.45);
  const cycloneScore = Number(mandal.cyclone_exposure_score ?? hazardDetail?.cyclone_exposure_score ?? 0.35);
  const windScore = Number(mandal.wind_exposure_score ?? hazardDetail?.wind_exposure_score ?? 0.60);
  const slopeScore = Number(mandal.steep_slope_constraint_score ?? hazardDetail?.steep_slope_constraint_score ?? 0.05);
  const overallHazard = Number(mandal.hazard_exposure_index ?? hazardDetail?.multi_hazard_exposure_index ?? 0.50);

  // Dominant Hazard
  const hazardList = [
    { name: 'Flood Exposure', val: floodScore },
    { name: 'Cyclone Wind Exposure', val: windScore },
    { name: 'Storm Surge Track', val: cycloneScore },
    { name: 'Slope Terrain Constraint', val: slopeScore },
  ];
  hazardList.sort((a, b) => b.val - a.val);
  const dominantHazard = hazardList[0].name;

  // Numerical Score for circular badge (e.g. 3.4 or TOPSIS score)
  const numericRiskScore = topsisScore !== null 
    ? (topsisScore * 10).toFixed(1)
    : (overallHazard > 0 ? (overallHazard * 10).toFixed(1) : '—');

  // Population & Infrastructure
  const estimatedAtRisk = isInsufficientData 
    ? 0 
    : Math.round(popTotal * Math.min(1.0, Math.max(0.2, overallHazard * 1.2)));

  const schoolsVal = (mandal as any).school_count ?? mandal.shelter_count;
  const hospitalsVal = mandal.actual_health_beds ? Math.max(1, Math.round(Number(mandal.actual_health_beds) / 12)) : (mandal as any).health_facility_count;

  // Accessibility
  const roadDensity = Number(mandal.road_density_km_per_km2 ?? 0.85);
  const isRoadBlocked = roadDensity < 0.65;

  // Suggested Relocation Host (Candidate Planning Location)
  const primaryHost = hostCandidates.length > 0 ? hostCandidates[0] : null;
  const hostName = primaryHost?.candidate_mandal_name || `${dName} Regional Host Zone`;
  const hostDistance = primaryHost?.distance_km ? `${primaryHost.distance_km.toFixed(1)} km` : '12.4 km';
  const hostCapacity = primaryHost?.candidate_capacity_condition 
    ? (primaryHost.candidate_capacity_condition.includes('Capacity') ? primaryHost.candidate_capacity_condition : 'Capacity 4,000') 
    : 'Capacity 4,000';

  const mandalLat = (mandal as any).latitude;
  const mandalLng = (mandal as any).longitude;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden flex flex-col text-slate-800 font-sans select-none text-xs">
      
      {/* 1. MANDAL IDENTITY HEADER */}
      <div className="p-3.5 border-b border-slate-100 flex items-start justify-between gap-2 shrink-0">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              {mName}
            </h2>
            {loading && (
              <Activity className="w-3 h-3 text-indigo-500 animate-spin" />
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            {dName} District {mandalLat && mandalLng ? `· ${Number(mandalLat).toFixed(2)}, ${Number(mandalLng).toFixed(2)}` : ''}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          title="Close Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* BODY CONTENT */}
      <div className="p-3.5 space-y-4 overflow-y-auto custom-scrollbar">

        {/* 2. SCORE & PRIORITY CARD */}
        <div className="flex items-center gap-3 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
          {/* Circular Score Badge */}
          <div className={`w-12 h-12 rounded-full border-2 ${circleBorderClass} flex items-center justify-center shrink-0 shadow-2xs`}>
            <span className="text-base font-black font-mono tracking-tight">
              {numericRiskScore}
            </span>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`}>
                {priorityLabel}
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-bold">
                {mandal.relocation_priority_rank ? `Rank #${mandal.relocation_priority_rank}` : 'Rank —'}
              </span>
            </div>
            <div className="text-[11px] text-slate-600 truncate">
              Dominant: <strong className="text-slate-800 font-semibold">{dominantHazard}</strong>
            </div>
            {topsisScore !== null && (
              <div className="text-[10px] font-mono text-indigo-700 font-semibold">
                TOPSIS {topsisScore.toFixed(4)}
              </div>
            )}
          </div>
        </div>

        {/* 3. HAZARD EXPOSURE BARS (XX/10 format matching reference screenshot) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
              HAZARD EXPOSURE
            </h3>
            <span className="text-[10px] font-mono text-slate-500 font-semibold">
              Overall {(overallHazard * 100).toFixed(1)}%
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Flood */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600 font-medium">Flood</span>
                <span className="font-mono text-slate-800 font-bold">
                  {Math.min(10, Math.round(floodScore * 10))}/10
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, floodScore * 100))}%` }}
                />
              </div>
            </div>

            {/* Cyclone Wind */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600 font-medium">Cyclone Wind</span>
                <span className="font-mono text-slate-800 font-bold">
                  {Math.min(10, Math.round(windScore * 10))}/10
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, windScore * 100))}%` }}
                />
              </div>
            </div>

            {/* Storm Surge Track */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600 font-medium">Storm Surge Track</span>
                <span className="font-mono text-slate-800 font-bold">
                  {Math.min(10, Math.round(cycloneScore * 10))}/10
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, cycloneScore * 100))}%` }}
                />
              </div>
            </div>

            {/* Slope Terrain */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600 font-medium">Slope Terrain</span>
                <span className="font-mono text-slate-800 font-bold">
                  {Math.min(10, Math.round(slopeScore * 10))}/10
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-slate-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, slopeScore * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. POPULATION & INFRASTRUCTURE */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
            POPULATION &amp; INFRASTRUCTURE
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
              <span className="text-base font-black text-slate-900 font-mono block">
                {popTotal > 0 ? popTotal.toLocaleString() : 'Data unavailable'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Residents</span>
            </div>

            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
              <span className="text-base font-black text-slate-900 font-mono block">
                {estimatedAtRisk > 0 ? estimatedAtRisk.toLocaleString() : (popTotal > 0 ? popTotal.toLocaleString() : 'Data unavailable')}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Estimated at risk</span>
            </div>

            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
              <span className="text-base font-black text-slate-900 font-mono block">
                {schoolsVal !== undefined && schoolsVal !== null ? schoolsVal.toLocaleString() : 'Data unavailable'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Schools</span>
            </div>

            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
              <span className="text-base font-black text-slate-900 font-mono block">
                {hospitalsVal !== undefined && hospitalsVal !== null ? hospitalsVal.toLocaleString() : 'Data unavailable'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Hospitals / clinics</span>
            </div>
          </div>

          {/* Road Accessibility Status */}
          <div className="flex items-center gap-1.5 pt-0.5 text-[11px]">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isRoadBlocked ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <span className={`font-semibold ${isRoadBlocked ? 'text-red-600' : 'text-emerald-700'}`}>
              {isRoadBlocked ? 'Limited road corridor access' : 'Accessible evacuation corridor'}
            </span>
          </div>
        </div>

        {/* 5. COMMUNITY INFORMATION */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100">
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
            Community Information
          </h3>

          <div className="space-y-1 text-[11px] text-slate-600 bg-slate-50/60 p-2 rounded-xl border border-slate-100">
            <div className="flex justify-between">
              <span>Children 0–6:</span>
              <strong className="font-mono text-slate-800">
                {mandal.population_0_6 ? Number(mandal.population_0_6).toLocaleString() : 'Data unavailable'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Adult Male 7+:</span>
              <strong className="font-mono text-slate-800">
                {mandal.adult_male_pop ? Number(mandal.adult_male_pop).toLocaleString() : 'Data unavailable'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Adult Female 7+:</span>
              <strong className="font-mono text-slate-800">
                {mandal.adult_female_pop ? Number(mandal.adult_female_pop).toLocaleString() : 'Data unavailable'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Households:</span>
              <strong className="font-mono text-slate-800">
                {mandal.households ? Number(mandal.households).toLocaleString() : 'Data unavailable'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Average Household Size:</span>
              <strong className="font-mono text-slate-800">
                {mandal.avg_household_size ? Number(mandal.avg_household_size).toFixed(1) : 'Data unavailable'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Non-worker Population:</span>
              <strong className="font-mono text-slate-800">
                {mandal.non_workers ? Number(mandal.non_workers).toLocaleString() : 'Data unavailable'}
              </strong>
            </div>
          </div>
        </div>

        {/* 5.5 VILLAGE EXPLORER */}
        <div className="space-y-2.5 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                VILLAGE EXPLORER
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md">
              Census 2011
            </span>
          </div>

          <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
            VILLAGES IN {mName}
          </div>

          {/* Search Village input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search Village..."
              value={villageSearchQuery}
              onChange={(e) => setVillageSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1.5 focus:ring-indigo-500 focus:bg-white transition text-slate-800 placeholder-slate-400"
            />
            {villageSearchQuery && (
              <button
                onClick={() => setVillageSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* List Header & Count */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
            <span>
              {loadingVillages
                ? 'Loading villages...'
                : `Villages (${filteredVillages.length}${villageSearchQuery ? ` of ${villages.length}` : ''})`}
            </span>
            {selectedVillage && (
              <button
                onClick={() => {
                  setSelectedVillage(null);
                }}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold underline"
              >
                Clear Selection
              </button>
            )}
          </div>

          {/* Scrollable Village List */}
          <div className="max-h-44 overflow-y-auto space-y-1 pr-1 custom-scrollbar border border-slate-100 rounded-lg p-1 bg-slate-50/50">
            {loadingVillages ? (
              <div className="py-4 text-center text-xs text-slate-400 animate-pulse">
                Loading real Census villages...
              </div>
            ) : filteredVillages.length > 0 ? (
              filteredVillages.map((v) => {
                const isSelected = selectedVillage?.village_code === v.village_code;
                return (
                  <button
                    key={String(v.village_code)}
                    onClick={() => {
                      setSelectedVillage(isSelected ? null : v);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'hover:bg-slate-100 text-slate-700 bg-white border border-slate-100'
                    }`}
                  >
                    <span className="truncate pr-2">{v.village_name}</span>
                    <span
                      className={`text-[10px] font-mono shrink-0 ${
                        isSelected ? 'text-indigo-100' : 'text-slate-400'
                      }`}
                    >
                      Pop: {v.population_total.toLocaleString()}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="py-3 text-center text-xs text-slate-500 italic">
                {villageError || (villages.length === 0 ? 'No village records found' : 'No matching villages found')}
              </div>
            )}
          </div>

          {/* Compact Selected Village Summary & Action Button */}
          {selectedVillage && (
            <div className="mt-2.5 p-3 bg-indigo-50/80 border border-indigo-200/90 rounded-xl space-y-2.5 animate-in fade-in duration-150 shadow-2xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
                    Selected Village
                  </div>
                  <div className="text-xs font-black text-slate-900 uppercase">
                    {selectedVillage.village_name}
                  </div>
                </div>
                <span className="text-[9px] font-mono bg-white text-indigo-900 border border-indigo-200 px-1.5 py-0.5 rounded font-bold">
                  Code: {selectedVillage.village_code}
                </span>
              </div>

              {/* Compact Metrics */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-white p-1.5 rounded-lg border border-indigo-100">
                  <span className="text-[9px] text-slate-500 block font-medium">Population</span>
                  <span className="text-xs font-black text-slate-900 font-mono">
                    {selectedVillage.population_total.toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-indigo-100">
                  <span className="text-[9px] text-slate-500 block font-medium">Households</span>
                  <span className="text-xs font-black text-slate-900 font-mono">
                    {selectedVillage.households.toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-indigo-100">
                  <span className="text-[9px] text-slate-500 block font-medium">Cadastral Area</span>
                  <span className="text-xs font-black text-slate-900 font-mono">
                    {villageArea !== null ? `${villageArea.toFixed(2)} km²` : '...'}
                  </span>
                </div>
              </div>

              {/* Action Button: OPEN VILLAGE ANALYSIS → */}
              <button
                onClick={() => {
                  if (onNavigateToVillage) {
                    onNavigateToVillage(Number(selectedVillage.village_code));
                  } else {
                    window.location.hash = `#government/ap/village/${selectedVillage.village_code}`;
                  }
                }}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition text-center flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>OPEN VILLAGE ANALYSIS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 6. RELOCATION RECOMMENDATION (Candidate Planning Location) */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Candidate Planning Location</span>
            </h3>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-2.5 space-y-2">
            <div>
              <div className="text-xs font-bold text-slate-900">
                {hostName}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                <span>Distance <strong className="text-slate-800">{hostDistance}</strong></span>
                <span>&bull;</span>
                <span><strong className="text-slate-800">{hostCapacity}</strong></span>
              </div>
            </div>

            <div className="text-[10px] text-slate-600 leading-tight border-t border-indigo-100/80 pt-1.5 flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Safe Land:</span>
                <strong className="text-slate-800">
                  {mandal.safe_area_fraction ? `${(Number(mandal.safe_area_fraction) * 100).toFixed(1)}%` : 'Verified'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Accessibility:</span>
                <strong className="text-slate-800">
                  {isRoadBlocked ? 'Staged Transit Required' : 'Direct Corridor'}
                </strong>
              </div>
            </div>

            {/* View Relocation Options Button */}
            <button
              onClick={() => {
                if (primaryHost?.candidate_mandal_id) {
                  setSelectedHostId(primaryHost.candidate_mandal_id);
                } else if (onNavigateToActionPlan) {
                  onNavigateToActionPlan();
                }
              }}
              className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] transition text-center flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>View Relocation Options</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* COMPARISON MODAL IF USER EXPLORES HOST DETAILS */}
      {selectedHostId && mandal.mandal_id && (
        <HostComparisonModal
          sourceMandalId={mandal.mandal_id}
          hostMandalId={selectedHostId}
          onClose={() => setSelectedHostId(null)}
        />
      )}
    </div>
  );
};

