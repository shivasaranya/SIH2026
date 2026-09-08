import React, { useState } from 'react';
import { PageHeader } from '../components/common/DesignSystem';
import { 
  Clock, 
  Calendar, 
  Building, 
  ShieldCheck, 
} from 'lucide-react';

import { useActiveState } from '../context/StateContext';

type TimeHorizon = 'immediate' | 'short_term' | 'long_term';

export const ActionPlanPage: React.FC = () => {
  const { currentState } = useActiveState();
  const [activeHorizon, setActiveHorizon] = useState<TimeHorizon>('immediate');

  const actionData = {
    immediate: [
      {
        priority: 'P1 - URGENT',
        action: 'Deploy Mobile Early-Warning Siren & Cell Broadcast System',
        reason: 'Severe cyclone wind & coastal surge inundation risk trigger (C1 > 0.65)',
        authority: `District Disaster Management Authority (DDMA) / ${currentState.sdmaName}`,
        timeHorizon: '0–24 Hours',
        status: 'READY FOR DISPATCH',
        badgeColor: 'bg-red-50 text-red-700 border-red-200'
      },
      {
        priority: 'P1 - URGENT',
        action: 'Pre-position State Disaster Response Force (SDRF) Evacuation Teams',
        reason: 'Evacuation accessibility bottleneck along single-lane bridge corridors (C4 deficit)',
        authority: `${currentState.name} SDRF / Fire & Rescue Services`,
        timeHorizon: '12–36 Hours',
        status: 'STANDBY NOTICE',
        badgeColor: 'bg-red-50 text-red-700 border-red-200'
      },
      {
        priority: 'P2 - PRIORITY',
        action: 'Activate Designated Multi-Purpose Cyclone Shelters with Food & Water Buffers',
        reason: 'Shelter headroom deficit (<50 persons per 1,000 population capacity)',
        authority: 'Revenue Divisional Officer (RDO) & Civil Supplies',
        timeHorizon: '24–72 Hours',
        status: 'INSPECTION ACTIVE',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
      }
    ],
    short_term: [
      {
        priority: 'P2 - MITIGATION',
        action: 'Field Survey & Structural Retrofitting of High-Vulnerability Habitations',
        reason: 'Census 2011 vulnerable dependent population (>35% children 0–6 & non-workers)',
        authority: 'Rural Development & Panchayat Raj Department',
        timeHorizon: '1–3 Months',
        status: 'SURVEY STAGE',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
      },
      {
        priority: 'P2 - MITIGATION',
        action: 'Culvert & Road Drainage Elevation along Identified Evacuation Corridors',
        reason: 'Recurring 38-year historical surface water inundation intersection (JRC layer)',
        authority: 'Highways & Rural Roads Department',
        timeHorizon: '2–6 Months',
        status: 'ESTIMATE APPROVED',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
      },
      {
        priority: 'P3 - CAPACITY',
        action: `Pre-screen and Ground-Validate Candidate Planning Host Locations (${currentState.name})`,
        reason: 'Verify water supply carrying capacity and habitable land boundaries',
        authority: 'District Planning Committee & Town/Country Planning',
        timeHorizon: '3–6 Months',
        status: 'GROUND-TRUTHING',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      }
    ],
    long_term: [
      {
        priority: 'P3 - STRATEGIC',
        action: 'Formulate Comprehensive Coastal Habitation Relocation Master Plan',
        reason: 'Provide structured, voluntary in-situ and ex-situ relocation for Top TOPSIS-prioritized habitations',
        authority: `${currentState.sdmaName} & Housing Department`,
        timeHorizon: '1–2 Years',
        status: 'POLICY DRAFTING',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      },
      {
        priority: 'P3 - STRATEGIC',
        action: 'Construct New Elevated Multi-Purpose Cyclone Resilient Shelters',
        reason: 'Cover severe deficit zones in coastal districts to achieve >100 persons / 1k population shelter headroom',
        authority: 'NDMA / World Bank NCRMP Project',
        timeHorizon: '2–3 Years',
        status: 'SANCTIONED',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      },
      {
        priority: 'P4 - INSTITUTIONAL',
        action: 'Institutionalize Continuous GIS Hazard & Demographics Data Integration Crosswalk',
        reason: 'Automate Bhuvan, CWC, IMD, and Census data feeds for decision-support forecasting updates',
        authority: `${currentState.code} State Spatial Data Infrastructure (${currentState.code}-SSDI)`,
        timeHorizon: '2–3 Years',
        status: 'IN PROGRESS',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      }
    ]
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-5 bg-transparent text-slate-800 select-none">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">

        {/* 1. HEADER */}
        <PageHeader
          category={`Action Management \u2022 3-Horizon Tactical & Strategic Interventions \u2022 ${currentState.name}`}
          title={`${currentState.name} Disaster Decision Action Plan`}
          description="Structured operational interventions mapped across immediate emergency readiness (0–72 Hours), short-term mitigation & host site validation (1–6 Months), and long-term resilient infrastructure planning (1–3 Years)."
          icon={<Clock className="w-4 h-4 text-emerald-600" />}
          rightContent={
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right shrink-0 shadow-2xs">
              <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Operational Framework</div>
              <div className="text-xl font-black text-emerald-600 font-mono">3 Time Horizons</div>
            </div>
          }
        />

        {/* 2. TIME HORIZON TABS */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveHorizon('immediate')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
              activeHorizon === 'immediate'
                ? 'bg-red-50 text-red-700 border border-red-300 ring-2 ring-red-200 shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>IMMEDIATE (0–72 HOURS)</span>
          </button>

          <button
            onClick={() => setActiveHorizon('short_term')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
              activeHorizon === 'short_term'
                ? 'bg-amber-50 text-amber-800 border border-amber-300 ring-2 ring-amber-200 shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>SHORT TERM (1–6 MONTHS)</span>
          </button>

          <button
            onClick={() => setActiveHorizon('long_term')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
              activeHorizon === 'long_term'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 ring-2 ring-emerald-200 shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>LONG TERM (1–3 YEARS)</span>
          </button>
        </div>

        {/* 3. ACTION TABLE */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Priority Level</th>
                  <th className="py-3 px-4">Action Item</th>
                  <th className="py-3 px-4">Reason &amp; Technical Trigger</th>
                  <th className="py-3 px-4">Responsible Authority</th>
                  <th className="py-3 px-3 text-center">Time Horizon</th>
                  <th className="py-3 px-4 text-center">Operational Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {actionData[activeHorizon].map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${item.badgeColor}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs">
                      {item.action}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-sm leading-relaxed">
                      {item.reason}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {item.authority}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-[11px] text-slate-500">
                      {item.timeHorizon}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 font-mono text-[10px] font-semibold">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500">
            <div>
              <strong>Action Governance:</strong> Interventions derived directly from MCDA priority categories and capacity stress bottlenecks.
            </div>
            <div className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> State Response Ready
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
