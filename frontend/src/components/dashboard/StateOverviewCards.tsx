import React from 'react';
import type { StateDemographicSummary } from '../../types/demographics';
import { Building2, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react';

interface StateOverviewCardsProps {
  summary: StateDemographicSummary | null;
  loading: boolean;
}

export const StateOverviewCards: React.FC<StateOverviewCardsProps> = ({ summary, loading }) => {
  const cards = [
    {
      label: 'Districts Evaluated',
      value: summary ? `${summary.total_districts}` : '26',
      sub: 'All 26 Admin Districts',
      icon: Building2,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
    },
    {
      label: 'Mandals Assessed',
      value: '696',
      sub: 'Complete Jurisdiction',
      icon: MapPin,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
    {
      label: 'Populated Units Ranked',
      value: '680',
      sub: 'Decision Support Prioritization',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Candidate Host Locations',
      value: '51',
      sub: 'Screened Candidate Host Zones',
      icon: ShieldCheck,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
  ];

  if (loading) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md animate-pulse">
        <div className="h-5 bg-slate-800 rounded w-1/2" />
        <div className="h-3 bg-slate-800 rounded w-3/4" />
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-800/80 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 space-y-3 shadow-lg">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white tracking-wider uppercase">
            ANDHRA PRADESH
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
            PILOT STATE
          </span>
        </div>
        <p className="text-[11px] text-slate-400 font-medium">
          State-level decision-support overview
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-inner hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded-lg ${card.bg} ${card.border} border shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
                <span className="text-base sm:text-lg font-black text-white tracking-tight font-mono">
                  {card.value}
                </span>
              </div>
              <div className="mt-1.5">
                <span className="text-[10px] font-bold text-slate-300 block truncate leading-tight">
                  {card.label}
                </span>
                <span className="text-[9px] text-slate-400 font-mono block truncate">
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
