import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  AlertTriangle, 
  Scale, 
  MapPin, 
  Sliders,
  BookOpen,
  Activity,
  Users,
  ShieldCheck,
  Clock
} from 'lucide-react';
import type { ActiveTab } from '../../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const sections = [
    {
      title: 'Overview',
      items: [
        { id: 'gis' as ActiveTab, label: 'Risk Map', icon: Map, badge: 'Hero Map' },
        { id: 'dashboard' as ActiveTab, label: 'Situation Overview', icon: LayoutDashboard, badge: 'Statewide' },
      ]
    },
    {
      title: 'Assessment',
      items: [
        { id: 'hazard' as ActiveTab, label: 'Hazard Risk', icon: AlertTriangle, badge: 'Exposure' },
        { id: 'vulnerability' as ActiveTab, label: 'Community Vulnerability', icon: Users, badge: 'Demographics' },
        { id: 'capacity' as ActiveTab, label: 'Emergency Capacity', icon: Scale, badge: 'Headroom' },
        { id: 'relocation' as ActiveTab, label: 'Relocation Planning', icon: MapPin, badge: 'AHP+TOPSIS' },
      ]
    },
    {
      title: 'Decision Support',
      items: [
        { id: 'hosts' as ActiveTab, label: 'Candidate Host Locations', icon: ShieldCheck, badge: '51 Hosts' },
        { id: 'simulation' as ActiveTab, label: 'What-If Scenarios', icon: Sliders, badge: 'Sensitivity' },
        { id: 'actions' as ActiveTab, label: 'Action Planning', icon: Clock, badge: '3-Horizons' },
      ]
    },
    {
      title: 'Reference',
      items: [
        { id: 'data' as ActiveTab, label: 'Data & Methodology', icon: BookOpen, badge: '10 Sources' },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col shrink-0 shadow-lg select-none">
      <div className="p-3.5 flex-1 overflow-y-auto custom-scrollbar space-y-4">
        {sections.map((sec, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 pb-1">
              {sec.title}
            </p>
            <nav className="space-y-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm ring-1 ring-indigo-500/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span className="tracking-wide truncate text-[11px]">{item.label}</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono font-medium shrink-0 ${
                      isActive
                        ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/40'
                        : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
                    }`}>
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom Status Card */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/60 space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400" />
              Decision Engine Active
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            696 Mandals Assessed &bull; Human-in-the-Loop Decision Support.
          </p>
        </div>
      </div>
    </aside>
  );
};
