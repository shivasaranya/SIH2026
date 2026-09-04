import React from 'react';
import type { StateDemographicSummary } from '../../types/demographics';
import { Building2, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react';

interface StateOverviewCardsProps {
  summary: StateDemographicSummary | null;
  loading: boolean;
}

export const StateOverviewCards: React.FC<StateOverviewCardsProps> = ({ summary, loading }) => {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Districts Evaluated',
      value: `${summary.total_districts}`,
      sub: 'All 26 Administrative Districts',
      icon: Building2,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/25',
    },
    {
      label: 'Mandals Assessed',
      value: '696',
      sub: 'Complete AP Jurisdiction',
      icon: MapPin,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/25',
    },
    {
      label: 'Populated Units Ranked',
      value: '680',
      sub: 'Decision Support Prioritization',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/25',
    },
    {
      label: 'Candidate Host Locations',
      value: '51',
      sub: 'Screened Candidate Host Zones',
      icon: ShieldCheck,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/25',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            AP Disaster Situation Overview
          </h2>
          <p className="text-[11px] text-slate-400">
            Explore areas by hazard exposure, community vulnerability, capacity constraints, and relocation planning priorities.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 flex items-center space-x-3.5 shadow-sm hover:border-slate-700/80 transition-all duration-150"
            >
              <div className={`p-2.5 rounded-xl ${card.bg} ${card.border} border shrink-0 shadow-sm flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-400 block truncate">{card.label}</span>
                <p className="text-base font-extrabold text-white tracking-tight leading-snug">
                  {card.value}
                </p>
                <span className="text-[10px] text-slate-400 font-mono block truncate">{card.sub}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
