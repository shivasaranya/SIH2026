import React, { useState, useEffect } from 'react';
import type { MandalProperties } from '../../types/gis';
import type { HostZoneCandidateItem } from '../../types/capacity';
import type { CapacityGapAssessment, ActionPlanResponse } from '../../types/decision';
import type { MandalHazardItem } from '../../types/hazard';
import { fetchHostZones, fetchCapacityGap, fetchActionPlan, fetchMandalHazard } from '../../services/api';
import { HostComparisonModal } from './HostComparisonModal';
import {
  X,
  MapPin,
  ShieldCheck,
  Sliders,
  Clock,
  Building,
  ArrowRight,
  Activity,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Flame,
  Users,
  Car,
  Wind,
  Droplets,
  Mountain
} from 'lucide-react';


interface MandalDetailPanelProps {
  mandal: MandalProperties | null;
  onClose: () => void;
}

type PanelTab = 'situation' | 'capacity' | 'actions' | 'safer_locations' | 'scenarios';

export const MandalDetailPanel: React.FC<MandalDetailPanelProps> = ({ mandal, onClose }) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('situation');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  // Phase 2B Hazard Detail
  const [hazardDetail, setHazardDetail] = useState<MandalHazardItem | null>(null);
  const [, setLoadingHazard] = useState<boolean>(false);

  // Phase 3 & 6 Host Candidates
  const [hostCandidates, setHostCandidates] = useState<HostZoneCandidateItem[]>([]);
  const [loadingHosts, setLoadingHosts] = useState<boolean>(false);
  const [selectedHostIdForCompare, setSelectedHostIdForCompare] = useState<string | null>(null);

  // Phase 6 Capacity Gaps & Action Plan
  const [capacityGap, setCapacityGap] = useState<CapacityGapAssessment | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlanResponse | null>(null);
  const [loadingGap, setLoadingGap] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (mandal?.mandal_id) {
      const mid = mandal.mandal_id;

      // Load Hazard Details
      setLoadingHazard(true);
      fetchMandalHazard(mid)
        .then((data) => {
          if (isMounted) setHazardDetail(data);
        })
        .catch((err) => {
          console.error('Error fetching hazard detail:', err);
          if (isMounted) setHazardDetail(null);
        })
        .finally(() => {
          if (isMounted) setLoadingHazard(false);
        });

      // Load Host Candidates
      setLoadingHosts(true);
      fetchHostZones(mid)
        .then((res) => {
          if (isMounted) setHostCandidates(res.candidates || []);
        })
        .catch((err) => {
          console.error('Error fetching host zones:', err);
          if (isMounted) setHostCandidates([]);
        })
        .finally(() => {
          if (isMounted) setLoadingHosts(false);
        });

      // Load Capacity Gaps
      setLoadingGap(true);
      fetchCapacityGap(mid)
        .then((data) => {
          if (isMounted) setCapacityGap(data);
        })
        .catch((err) => {
          console.error('Error fetching capacity gap:', err);
          if (isMounted) setCapacityGap(null);
        })
        .finally(() => {
          if (isMounted) setLoadingGap(false);
        });

      // Load Action Plan
      setLoadingAction(true);
      fetchActionPlan(mid)
        .then((data) => {
          if (isMounted) setActionPlan(data);
        })
        .catch((err) => {
          console.error('Error fetching action plan:', err);
          if (isMounted) setActionPlan(null);
        })
        .finally(() => {
          if (isMounted) setLoadingAction(false);
        });
    } else {
      setHazardDetail(null);
      setHostCandidates([]);
      setCapacityGap(null);
      setActionPlan(null);
    }

    return () => {
      isMounted = false;
    };
  }, [mandal?.mandal_id]);

  if (!mandal) return null;

  const mName = mandal.mandal_name || mandal.DMNAME || 'Mandal';
  const dName = mandal.current_district_name || mandal.DNAME || 'District';
  const popTotal = Number(mandal.population_total ?? 0);

  // Relocation Prioritization (Decision Level)
  const topsisScore = mandal.topsis_score !== undefined ? Number(mandal.topsis_score) : null;
  const relocRank = mandal.relocation_priority_rank;
  const fHaz = Number(mandal.factor_contrib_hazard_pct ?? 0);
  const fDemo = Number(mandal.factor_contrib_demographic_pct ?? 0);
  const fCap = Number(mandal.factor_contrib_capacity_pct ?? 0);
  const fAcc = Number(mandal.factor_contrib_accessibility_pct ?? 0);
  const explanation = mandal.priority_explanation;

  // Check for insufficient data / zero rural habitations
  const isInsufficientData =
    mandal.ranking_status === 'INSUFFICIENT_DATA' ||
    mandal.relocation_priority_category === 'INSUFFICIENT-DATA' ||
    mandal.demographic_data_flag === 'ZERO_RURAL_CENSUS_HABITATIONS' ||
    popTotal === 0 ||
    relocRank === null ||
    relocRank === undefined ||
    isNaN(Number(relocRank));

  const relocCat = isInsufficientData
    ? 'INSUFFICIENT DATA'
    : (mandal.relocation_priority_category || 'MODERATE');

  const relocRankDisplay = isInsufficientData ? 'Excluded from Ranking (Insufficient Data)' : `#${relocRank} of 680 Mandals`;

  // Exact 5-Category Population Profile (Census 2011 PCA)
  const childPop = Number(mandal.child_pop ?? mandal.population_0_6 ?? 0);
  const childShare = Number(mandal.child_share_0_6 ?? (popTotal > 0 ? childPop / popTotal : 0));
  
  const adultMalePop = Number(
    mandal.adult_male_pop ??
    (mandal.population_male !== undefined && mandal.population_0_6_male !== undefined
      ? mandal.population_male - mandal.population_0_6_male
      : (mandal.population_male !== undefined && mandal.population_0_6 !== undefined
        ? Math.max(0, mandal.population_male - Math.round(mandal.population_0_6 * 0.51))
        : 0))
  );
  const adultMaleShare = Number(mandal.adult_male_share ?? (popTotal > 0 ? adultMalePop / popTotal : 0));

  const adultFemalePop = Number(
    mandal.adult_female_pop ??
    (mandal.population_female !== undefined && mandal.population_0_6_female !== undefined
      ? mandal.population_female - mandal.population_0_6_female
      : (mandal.population_female !== undefined && mandal.population_0_6 !== undefined
        ? Math.max(0, mandal.population_female - Math.round(mandal.population_0_6 * 0.49))
        : 0))
  );
  const adultFemaleShare = Number(mandal.adult_female_share ?? (popTotal > 0 ? adultFemalePop / popTotal : 0));

  const nonWorkers = Number(mandal.non_workers ?? (mandal.workers !== undefined && popTotal > 0 ? Math.max(0, popTotal - mandal.workers) : 0));
  const nonWorkerShare = Number(mandal.non_worker_share ?? (popTotal > 0 ? nonWorkers / popTotal : 0));
  const households = Number(mandal.households ?? 0);
  const avgHhSize = mandal.avg_household_size !== undefined && mandal.avg_household_size !== null
    ? Number(mandal.avg_household_size).toFixed(2)
    : (households > 0 ? (popTotal / households).toFixed(2) : 'N/A');

  // Raw Normalized Indices for Technical Details
  const c1Haz = mandal.c1_hazard_exposure !== undefined ? Number(mandal.c1_hazard_exposure) : Number(mandal.hazard_exposure_index ?? 0);
  const c2Demo = mandal.c2_demographic_sensitivity !== undefined ? Number(mandal.c2_demographic_sensitivity) : Number(mandal.demographic_sensitivity_index ?? 0);
  const c3Cap = mandal.c3_capacity_stress !== undefined ? Number(mandal.c3_capacity_stress) : 0.4;
  const c4Acc = mandal.c4_accessibility_constraint !== undefined ? Number(mandal.c4_accessibility_constraint) : 0.3;

  // Hazard Component Scores (Existing Processed Hazard Values)
  const floodScore = hazardDetail?.flood_exposure_score !== undefined
    ? Number(hazardDetail.flood_exposure_score)
    : (mandal.flood_exposure_score !== undefined ? Number(mandal.flood_exposure_score) : null);

  const cycloneScore = hazardDetail?.cyclone_exposure_score !== undefined
    ? Number(hazardDetail.cyclone_exposure_score)
    : (mandal.cyclone_exposure_score !== undefined ? Number(mandal.cyclone_exposure_score) : null);

  const windScore = hazardDetail?.wind_exposure_score !== undefined
    ? Number(hazardDetail.wind_exposure_score)
    : (mandal.wind_exposure_score !== undefined ? Number(mandal.wind_exposure_score) : null);

  const slopeScore = hazardDetail?.steep_slope_constraint_score !== undefined
    ? Number(hazardDetail.steep_slope_constraint_score)
    : (mandal.steep_slope_constraint_score !== undefined ? Number(mandal.steep_slope_constraint_score) : null);

  const overallHazardScore = hazardDetail?.multi_hazard_exposure_index !== undefined
    ? Number(hazardDetail.multi_hazard_exposure_index)
    : c1Haz;

  const hazardComponents = [
    { name: 'Flood', score: floodScore, weight: 0.40, color: 'bg-blue-500', textColor: 'text-blue-400', icon: Droplets },
    { name: 'Cyclone', score: cycloneScore, weight: 0.30, color: 'bg-teal-500', textColor: 'text-teal-400', icon: Flame },
    { name: 'High Wind', score: windScore, weight: 0.20, color: 'bg-amber-500', textColor: 'text-amber-400', icon: Wind },
    { name: 'Slope / Landslide', score: slopeScore, weight: 0.10, color: 'bg-purple-500', textColor: 'text-purple-400', icon: Mountain },
  ];

  const validComponents = hazardComponents.filter((c) => c.score !== null && !isNaN(c.score));
  const dominantHazard = validComponents.length > 0
    ? validComponents.reduce((prev, current) => ((current.score ?? 0) > (prev.score ?? 0) ? current : prev))
    : null;

  // Simulation State
  const simScore = mandal.scenario_topsis_score !== undefined ? Number(mandal.scenario_topsis_score) : null;
  const simRank = mandal.scenario_rank !== undefined ? Number(mandal.scenario_rank) : null;
  const simCat = mandal.scenario_category || relocCat;
  const simExplanation = mandal.scenario_explanation;

  const scoreChange = mandal.score_change !== undefined ? Number(mandal.score_change) : null;
  const rankChange = mandal.rank_change !== undefined ? Number(mandal.rank_change) : null;
  const isSimulationActive = simScore !== null && scoreChange !== null && Math.abs(scoreChange) > 0.0001;

  // Human-readable Priority Narrative
  const priorityNarrative =
    isInsufficientData
      ? 'Demographic baseline data unavailable or zero rural Census habitations. Excluded from multi-criteria ranking ladder.'
      : relocCat === 'VERY HIGH'
      ? 'Immediate planning attention recommended.'
      : relocCat === 'HIGH'
      ? 'Priority planning attention recommended.'
      : relocCat === 'MODERATE'
      ? 'Standard monitoring and in-situ protection.'
      : 'Lower relative priority; suitable for host screening.';

  // Relocation priority badge style
  const relocBadgeClass =
    isInsufficientData
      ? 'bg-slate-800 text-slate-300 border-slate-700'
      : relocCat === 'VERY HIGH'
      ? 'bg-rose-500/25 text-rose-200 border-rose-500/50 ring-1 ring-rose-500/40'
      : relocCat === 'HIGH'
      ? 'bg-amber-500/25 text-amber-200 border-amber-500/50 ring-1 ring-amber-500/40'
      : relocCat === 'MODERATE'
      ? 'bg-sky-500/25 text-sky-200 border-sky-500/50 ring-1 ring-sky-500/40'
      : 'bg-emerald-500/25 text-emerald-200 border-emerald-500/50 ring-1 ring-emerald-500/40';

  return (
    <div className="absolute top-4 right-4 z-20 w-96 md:w-[480px] max-h-[calc(100vh-2rem)] flex flex-col bg-slate-900/95 backdrop-blur-md border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
            <h2 className="text-base font-bold text-white tracking-wide">{mName}</h2>
          </div>
          <p className="text-xs text-slate-400 pl-6">
            {dName} District &bull; Population: {popTotal > 0 ? popTotal.toLocaleString() : 'Insufficient Data'} (Census 2011)
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Navigation (Decision-First) */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 px-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('situation')}
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'situation'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Situation
        </button>
        <button
          onClick={() => setActiveTab('capacity')}
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'capacity'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Emergency Capacity
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'actions'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Planning Actions
        </button>
        <button
          onClick={() => setActiveTab('safer_locations')}
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'safer_locations'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Candidate Hosts ({hostCandidates.length})
        </button>
        {isSimulationActive && (
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'scenarios'
                ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <Sliders className="w-3 h-3" />
            What-If Impact
          </button>
        )}
      </div>

      {/* Panel Body */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-xs">
        {/* ================= TAB 1: SITUATION & WHY PRIORITIZED ================= */}
        {activeTab === 'situation' && (
          <div className="space-y-4">
            {/* Priority Status Box */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Planning Priority Status
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${relocBadgeClass}`}>
                  {isInsufficientData ? 'INSUFFICIENT DATA' : `${relocCat} PRIORITY`}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-200 leading-snug">
                "{priorityNarrative}"
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Statewide Priority Ranking:</span>
                <span className="font-bold text-white font-mono">
                  {relocRankDisplay}
                </span>
              </div>
            </div>

            {/* Why is this area prioritized? — 4 Visual Dimension Cards */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
                Why is this area prioritized?
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* 1. Hazard */}
                <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-1">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>Hazard Exposure</span>
                  </div>
                  <span className="font-bold text-rose-300 text-xs">
                    {c1Haz > 0.40 ? 'High Exposure' : c1Haz > 0.25 ? 'Moderate' : 'Low Exposure'}
                  </span>
                </div>

                {/* 2. Evacuation Assistance Sensitivity */}
                <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-1">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Assistance Need</span>
                  </div>
                  <span className="font-bold text-amber-300 text-xs">
                    {c2Demo > 0.45 ? 'High Need' : c2Demo > 0.30 ? 'Moderate' : 'Low'}
                  </span>
                </div>

                {/* 3. Capacity */}
                <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-1">
                    <HeartPulse className="w-3.5 h-3.5 text-sky-400" />
                    <span>Emergency Capacity</span>
                  </div>
                  <span className="font-bold text-sky-300 text-xs">
                    {c3Cap > 0.35 ? 'Severely Constrained' : c3Cap > 0.20 ? 'Constrained' : 'Adequate'}
                  </span>
                </div>

                {/* 4. Access */}
                <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-1">
                    <Car className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Road Access</span>
                  </div>
                  <span className="font-bold text-indigo-300 text-xs">
                    {c4Acc > 0.30 ? 'High Constraint' : c4Acc > 0.15 ? 'Moderate' : 'Good Access'}
                  </span>
                </div>
              </div>
            </div>

            {/* Plain-Language Explanation */}
            {explanation && (
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 space-y-1 text-slate-200 leading-relaxed text-[11px]">
                <span className="text-indigo-400 font-bold uppercase text-[10px] block">Summary Assessment:</span>
                <p>{explanation}</p>
              </div>
            )}

            {/* Factor Pressure Contribution */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Primary Contributing Pressures
              </span>
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Hazard Exposure:</span>
                    <span className="font-mono text-white font-semibold">{fHaz}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, fHaz)}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Evacuation Assistance Need:</span>
                    <span className="font-mono text-white font-semibold">{fDemo}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, fDemo)}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Emergency Capacity Stress:</span>
                    <span className="font-mono text-white font-semibold">{fCap}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-sky-500 h-full rounded-full" style={{ width: `${Math.min(100, fCap)}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Evacuation Access Constraint:</span>
                    <span className="font-mono text-white font-semibold">{fAcc}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, fAcc)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ================= HAZARD EXPOSURE COMPONENT BREAKDOWN ================= */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  Hazard Exposure
                </span>
                {dominantHazard && dominantHazard.score !== null && !isInsufficientData && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-1">
                    <span className="text-slate-400 text-[9px]">DOMINANT:</span>
                    <span className="font-bold">{dominantHazard.name}</span>
                  </span>
                )}
              </div>

              {/* Overall Multi-Hazard Score Card */}
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Overall Hazard Exposure Score
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    H = 0.40·Flood + 0.30·Cyclone + 0.20·Wind + 0.10·Slope
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-extrabold text-rose-300">
                    {(overallHazardScore * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Score: {overallHazardScore.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* 4 Hazard Components List */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 space-y-2.5">
                {hazardComponents.map((comp) => {
                  const hasData = comp.score !== null && !isNaN(comp.score) && !isInsufficientData;
                  const pct = hasData ? comp.score! * 100 : 0;
                  const IconComp = comp.icon;
                  return (
                    <div key={comp.name} className="space-y-1">
                      <div className="flex justify-between items-baseline text-[11px]">
                        <span className="text-slate-300 font-medium flex items-center gap-1.5">
                          <IconComp className="w-3 h-3 text-slate-400" />
                          <span>{comp.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">(Wt: {(comp.weight * 100).toFixed(0)}%)</span>
                        </span>
                        {hasData ? (
                          <div className="font-mono text-right flex items-baseline gap-1.5">
                            <span className="text-[10px] text-slate-400">Exposure Score: {comp.score!.toFixed(4)}</span>
                            <span className={`font-bold ${comp.textColor}`}>({pct.toFixed(1)}%)</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono italic">Insufficient Data</span>
                        )}
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        {hasData ? (
                          <div
                            className={`${comp.color} h-full rounded-full transition-all duration-300`}
                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                          />
                        ) : (
                          <div className="bg-slate-700 h-full rounded-full w-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ================= POPULATION PROFILE (Census 2011 PCA) ================= */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  Population Profile (Census 2011)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {popTotal > 0 ? `${popTotal.toLocaleString()} persons` : 'Insufficient Data'}
                </span>
              </div>

              {popTotal === 0 && (
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[10px] text-amber-200">
                  Demographic baseline data unavailable or zero rural habitations in Census 2011 PCA for this mandal.
                </div>
              )}

              <div className="space-y-2">
                {/* 1. Children 0-6 */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-1">
                      <span>Children (0–6 Years)</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">Source: Census 2011 P_06 &bull; Physical care dependency</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-amber-300">
                      {childPop > 0 ? childPop.toLocaleString() : 'N/A'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {(childShare * 100).toFixed(1)}% of total
                    </div>
                  </div>
                </div>

                {/* 2. Adult Men 7+ & Adult Women 7+ (Partitioned Exactly) */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Adult Male (7+) */}
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-[11px] font-bold text-slate-200">Adult Male (7+)</div>
                    <div className="text-[9px] text-slate-400 font-mono">Formula: TOT_M - M_06</div>
                    <div className="pt-1 flex items-baseline justify-between font-mono">
                      <span className="text-xs font-bold text-slate-100">
                        {adultMalePop > 0 ? adultMalePop.toLocaleString() : 'N/A'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {(adultMaleShare * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Adult Female (7+) */}
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-[11px] font-bold text-slate-200">Adult Female (7+)</div>
                    <div className="text-[9px] text-slate-400 font-mono">Formula: TOT_F - F_06</div>
                    <div className="pt-1 flex items-baseline justify-between font-mono">
                      <span className="text-xs font-bold text-slate-100">
                        {adultFemalePop > 0 ? adultFemalePop.toLocaleString() : 'N/A'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {(adultFemaleShare * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[9px] text-slate-500 italic px-1 leading-tight">
                  * Note: "7+" categories reflect available village-level Census 2011 PCA data, which does not provide separate 60+ senior age brackets.
                </div>

                {/* 3 & 4: Older People & Disabilities (Unavailable States) */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Older People (60+) */}
                  <div className="bg-slate-950/40 p-2 rounded-xl border border-dashed border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-300">Older People (60+)</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        Unavailable
                      </span>
                    </div>
                    <div className="text-[8px] text-slate-400 leading-tight">
                      Census 2011 village-level PCA does not provide age groups required to identify the 60+ population.
                    </div>
                  </div>

                  {/* Persons with Disabilities */}
                  <div className="bg-slate-950/40 p-2 rounded-xl border border-dashed border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-300">Disabilities</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        Unavailable
                      </span>
                    </div>
                    <div className="text-[8px] text-slate-400 leading-tight">
                      Official Census disability tables are not published at the required village/mandal level.
                    </div>
                  </div>
                </div>

                {/* 5. Other Contextual Indicators */}
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Other Available Contextual Indicators
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                    <div>
                      <span className="text-slate-500 block text-[9px]">Non-Workers:</span>
                      <span className="text-slate-200 font-bold">{nonWorkers > 0 ? nonWorkers.toLocaleString() : 'N/A'}</span>
                      <span className="text-slate-400 text-[9px] block">({(nonWorkerShare * 100).toFixed(1)}%)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Households:</span>
                      <span className="text-slate-200 font-bold">{households > 0 ? households.toLocaleString() : 'N/A'}</span>
                      <span className="text-slate-400 text-[9px] block">No_HH</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Avg HH Size:</span>
                      <span className="text-slate-200 font-bold">{avgHhSize}</span>
                      <span className="text-slate-400 text-[9px] block">persons/HH</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsible Technical Analysis */}
            <div className="border-t border-slate-800 pt-2">
              <button
                onClick={() => setShowTechnicalDetails((prev) => !prev)}
                className="w-full py-1.5 px-2.5 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-between rounded-lg bg-slate-950/40 border border-slate-800 transition"
              >
                <span>View Technical Analysis & MCDA Metrics</span>
                {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showTechnicalDetails && (
                <div className="mt-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-[10px] text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span>TOPSIS Relative Closeness:</span>
                    <span className="text-white font-bold">{topsisScore !== null ? topsisScore.toFixed(4) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>C1 Multi-Hazard Exposure Index:</span>
                    <span className="text-slate-200">{c1Haz.toFixed(4)} (Weight: 42.3%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>C2 Evacuation Assistance Sensitivity:</span>
                    <span className="text-slate-200">{c2Demo.toFixed(4)} (Weight: 22.7%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>C3 Capacity Stress Index:</span>
                    <span className="text-slate-200">{c3Cap.toFixed(4)} (Weight: 22.7%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>C4 Accessibility Constraint:</span>
                    <span className="text-slate-200">{c4Acc.toFixed(4)} (Weight: 12.2%)</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-[9px] text-slate-400 space-y-0.5">
                    <div>Demographic Baseline: Census 2011 PCA (Children 0-6, Non-Workers, Household Size)</div>
                    <div>Older Persons (60+): INSUFFICIENT_DATA_IN_VILLAGE_PCA</div>
                    <div>Disability Data: INSUFFICIENT_DATA_IN_VILLAGE_PCA</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: EMERGENCY CAPACITY GAPS ================= */}
        {activeTab === 'capacity' && (
          <div className="space-y-3">
            {loadingGap ? (
              <div className="text-center py-8 text-slate-400 flex items-center justify-center gap-2">
                <Activity className="w-4 h-4 animate-spin text-indigo-400" />
                Evaluating emergency capacity conditions...
              </div>
            ) : capacityGap ? (
              <div className="space-y-3">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Main Identified Constraint</span>
                  <p className="text-xs text-slate-200 font-medium">
                    {capacityGap.overall_gap_summary}
                  </p>
                </div>

                {/* Healthcare Bed Capacity */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">Healthcare Beds</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      capacityGap.health_gap_status === 'DEFICIT_IDENTIFIED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {capacityGap.health_gap_status === 'DEFICIT_IDENTIFIED' ? 'Critical Deficit' : 'Adequate'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{capacityGap.health_note}</p>
                </div>

                {/* Designated Cyclone Shelters */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">Designated Cyclone Shelters</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {capacityGap.shelter_gap_status === 'DEFICIT_IDENTIFIED' ? 'Deficit Identified' : capacityGap.shelter_gap_status === 'ADEQUATE' ? 'Adequate' : 'Not Applicable (Inland)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{capacityGap.shelter_note}</p>
                </div>

                {/* Safe Habitable Land */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">Safe Habitable Land Headroom</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      capacityGap.safe_area_gap_status === 'DEFICIT_IDENTIFIED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {capacityGap.safe_area_gap_status === 'DEFICIT_IDENTIFIED' ? 'Constrained Space' : 'Adequate Land'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{capacityGap.safe_area_note}</p>
                </div>

                {/* Water & Sanitation */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">Water & Sanitation Access</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      capacityGap.water_sanitation_gap_status === 'DEFICIT_IDENTIFIED'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {capacityGap.water_sanitation_gap_status === 'DEFICIT_IDENTIFIED' ? 'Moderate Coverage' : 'Good Coverage'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{capacityGap.water_note}</p>
                </div>

                {/* Evacuation Road Access */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">Evacuation Road Network</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      capacityGap.road_accessibility_gap_status === 'CONSTRAINT_IDENTIFIED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {capacityGap.road_accessibility_gap_status === 'CONSTRAINT_IDENTIFIED' ? 'Constrained Network' : 'Good Access'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{capacityGap.road_note}</p>
                </div>

                <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-2.5 text-[10px] text-amber-200 leading-relaxed">
                  {capacityGap.data_limitations_notice}
                </div>
              </div>
            ) : (
              <p className="text-slate-400 py-4 text-center">Capacity assessment unavailable.</p>
            )}
          </div>
        )}

        {/* ================= TAB 3: RECOMMENDED PLANNING ACTIONS ================= */}
        {activeTab === 'actions' && (
          <div className="space-y-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-1">Action Recommendations</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Suggested interventions deterministically generated based on identified hazard levels and capacity constraints.
              </p>
            </div>

            {loadingAction ? (
              <div className="text-center py-8 text-slate-400 flex items-center justify-center gap-2">
                <Activity className="w-4 h-4 animate-spin text-indigo-400" />
                Synthesizing recommended actions...
              </div>
            ) : actionPlan ? (
              <div className="space-y-4">
                {/* 1. Immediate */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Immediate Emergency Preparedness (0–72 hrs)
                  </h4>
                  {actionPlan.immediate_actions.map((act) => (
                    <div key={act.action_id} className="bg-slate-950/50 border border-rose-500/30 rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{act.title}</span>
                        <span className="text-[9px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full">
                          {act.priority_level}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">{act.description}</p>
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                        <span className="text-indigo-400 font-semibold">Responsible: </span>{act.responsible_agency}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. Short-Term */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    Short-Term Mitigation (1–6 Months)
                  </h4>
                  {actionPlan.short_term_actions.map((act) => (
                    <div key={act.action_id} className="bg-slate-950/50 border border-amber-500/30 rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{act.title}</span>
                        <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                          {act.priority_level}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">{act.description}</p>
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                        <span className="text-indigo-400 font-semibold">Responsible: </span>{act.responsible_agency}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. Long-Term */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Long-Term Relocation & Host Planning (1–3 Years)
                  </h4>
                  {actionPlan.long_term_actions.map((act) => (
                    <div key={act.action_id} className="bg-slate-950/50 border border-emerald-500/30 rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{act.title}</span>
                        <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                          {act.priority_level}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">{act.description}</p>
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                        <span className="text-indigo-400 font-semibold">Responsible: </span>{act.responsible_agency}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-2.5 text-[10px] text-amber-200 leading-relaxed">
                  {actionPlan.governance_disclaimer}
                </div>
              </div>
            ) : (
              <p className="text-slate-400 py-4 text-center">Action plan unavailable.</p>
            )}
          </div>
        )}

        {/* ================= TAB 4: SCREENED CANDIDATE HOST LOCATIONS ================= */}
        {activeTab === 'safer_locations' && (
          <div className="space-y-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Screened Candidate Host Locations</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                These locations are screened candidate host locations based on the prototype's criteria. Final suitability requires field verification and authority approval.
              </p>
            </div>

            {loadingHosts ? (
              <div className="text-center py-6 text-slate-400 flex items-center justify-center gap-2">
                <Activity className="w-4 h-4 animate-spin text-indigo-400" />
                Screening candidate host locations...
              </div>
            ) : hostCandidates.length > 0 ? (
              <div className="space-y-2.5">
                {hostCandidates.map((host, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/50 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3 space-y-2 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-emerald-400 font-bold block uppercase">Candidate #{idx + 1}</span>
                        <h4 className="font-bold text-white text-xs">{host.candidate_mandal_name}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                          {host.distance_km ? `${host.distance_km.toFixed(1)} km away` : 'Near'}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">{host.host_candidate_reason}</p>

                    <button
                      onClick={() => setSelectedHostIdForCompare(host.candidate_mandal_id)}
                      className="w-full py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <span>Compare with this Location</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-6">No candidate host zones within regional radius.</p>
            )}

            <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-2.5 text-[10px] text-amber-200">
              <strong className="text-amber-400">Important Disclaimer:</strong> These are candidate locations identified using screening criteria. Human and administrative validation is mandatory before any relocation action.
            </div>
          </div>
        )}

        {/* ================= TAB 5: WHAT-IF SCENARIOS ================= */}
        {activeTab === 'scenarios' && isSimulationActive && (
          <div className="space-y-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" />
                  What-If Scenario Impact
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  (scoreChange || 0) > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {(scoreChange || 0) > 0 ? `Priority Increased (+${(scoreChange || 0).toFixed(3)})` : `Priority Reduced (${(scoreChange || 0).toFixed(3)})`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Current Priority</span>
                  <span className="font-bold text-slate-200 block text-xs">{relocCat} Priority</span>
                  <span className="text-[10px] text-slate-400 font-mono">Rank #{relocRank || 'N/A'}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Simulated Scenario</span>
                  <span className="font-bold text-emerald-400 block text-xs">{simCat} Priority</span>
                  <span className="text-[10px] text-emerald-300 font-mono">
                    Rank #{simRank || 'N/A'}{' '}
                    <span>({(rankChange || 0) > 0 ? `↑ ${rankChange}` : (rankChange || 0) < 0 ? `↓ ${Math.abs(rankChange || 0)}` : 'Stable'})</span>
                  </span>
                </div>
              </div>

              {simExplanation && (
                <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                  <span className="text-emerald-400 font-semibold block text-[10px] uppercase">Why priority changed:</span>
                  {simExplanation}
                </div>
              )}

              <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-2 text-[10px] text-amber-200">
                SCENARIO SIMULATION &bull; NOT A FORECAST
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Host Zone Comparison Modal */}
      {selectedHostIdForCompare && mandal.mandal_id && (
        <HostComparisonModal
          sourceMandalId={mandal.mandal_id}
          hostMandalId={selectedHostIdForCompare}
          onClose={() => setSelectedHostIdForCompare(null)}
        />
      )}
    </div>
  );
};
