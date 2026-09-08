import React from 'react';
import type { StateDemographicSummary } from '../../types/demographics';
import { useActiveState } from '../../context/StateContext';
import { Building2, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react';

interface StateOverviewCardsProps {
  summary: StateDemographicSummary | null;
  loading: boolean;
}

export const StateOverviewCards: React.FC<StateOverviewCardsProps> = ({ summary, loading }) => {
  const { currentState } = useActiveState();

  const unitLabel = `${currentState.adminUnitPlural} Assessed`;
  const unitCount = summary?.total_mandals ? summary.total_mandals.toString() : currentState.adminUnitCount.toString();
  const rankedUnits = summary?.total_mandals ? summary.total_mandals.toString() : currentState.adminUnitCount.toString();
  const hostCount = currentState.candidateHostsCount.toString();

  const cards = [
    {
      label: 'Districts Evaluated',
      value: summary ? `${summary.total_districts}` : `${currentState.districtCount}`,
      sub: `All ${currentState.districtCount} Admin Districts`,
      icon: Building2,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
    },
    {
      label: unitLabel,
      value: unitCount,
      sub: 'Complete Jurisdiction',
      icon: MapPin,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
    {
      label: 'Populated Units Ranked',
      value: rankedUnits,
      sub: 'Decision Support Prioritization',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Candidate Host Locations',
      value: hostCount,
      sub: 'Screened Candidate Host Zones',
      icon: ShieldCheck,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
  ];

  if (loading) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xs animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-3/4" />
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-xs">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 tracking-wider uppercase">
            {currentState.name}
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
            {currentState.id === 'andhra_pradesh' ? 'PILOT STATE' : 'OPERATIONAL STATE'}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 font-medium">
          State-level decision-support overview
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-2.5 flex flex-col justify-between hover:bg-slate-100/70 transition shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded-lg ${card.bg} ${card.border} border shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-mono">
                  {card.value}
                </span>
              </div>
              <div className="mt-1.5 min-w-0">
                <span className="text-[10.5px] font-bold text-slate-800 block leading-snug">
                  {card.label}
                </span>
                <span className="text-[9px] text-slate-500 font-mono block leading-tight mt-0.5">
                  {card.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
