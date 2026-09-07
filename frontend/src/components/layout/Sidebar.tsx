import React, { useState } from 'react';
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
  Clock,
  ChevronLeft,
  ChevronRight,
  Target,
  Shield
} from 'lucide-react';
import type { ActiveTab } from '../../types';

import { useActiveState } from '../../context/StateContext';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { currentState } = useActiveState();
  const priorityCount = String(currentState?.rankedCount || 680);

  const sections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'gis' as ActiveTab, label: 'Risk Map', icon: Map },
        { id: 'dashboard' as ActiveTab, label: 'Situation Overview', icon: LayoutDashboard },
      ]
    },
    {
      title: 'ASSESSMENT',
      items: [
        { id: 'hazard' as ActiveTab, label: 'Hazard Risk', icon: AlertTriangle },
        { id: 'vulnerability' as ActiveTab, label: 'Community Vulnerability', icon: Users },
        { id: 'capacity' as ActiveTab, label: 'Emergency Capacity', icon: Scale },
        { id: 'relocation' as ActiveTab, label: 'Relocation Planning', icon: MapPin },
      ]
    },
    {
      title: 'DECISION SUPPORT',
      items: [
        { id: 'priority_directory' as ActiveTab, label: 'Priority Areas', icon: Target, badge: priorityCount },
        { id: 'hosts' as ActiveTab, label: 'Potential Safer Locations', icon: ShieldCheck },
        { id: 'simulation' as ActiveTab, label: 'What-If Scenarios', icon: Sliders },
        { id: 'actions' as ActiveTab, label: 'Action Plan', icon: Clock },
      ]
    },
    {
      title: 'REFERENCE',
      items: [
        { id: 'data' as ActiveTab, label: 'Data & Sources', icon: BookOpen },
        { id: 'methodology' as ActiveTab, label: 'Methodology', icon: Activity },
      ]
    }
  ];

  return (
    <aside className={`${collapsed ? 'w-12' : 'w-[210px]'} h-full bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 select-none transition-all duration-200 z-30`}>
      {/* Collapse / Expand Toggle */}
      <div className="p-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
        {!collapsed && (
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Navigation
          </span>
        )}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className={`p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition ${collapsed ? 'mx-auto' : ''}`}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation Sections with comfortable vertical spacing */}
      <div className="p-2.5 flex-1 overflow-y-auto custom-scrollbar space-y-3.5">
        {sections.map((sec, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!collapsed && (
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 px-1.5 pt-0.5 pb-0.5">
                {sec.title}
              </p>
            )}
            <nav className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`} />
                      {!collapsed && <span className="truncate leading-tight">{item.label}</span>}
                    </div>

                    {!collapsed && item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ml-1.5 ${
                        isActive
                          ? 'bg-indigo-200/80 text-indigo-900'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* State Card pinned at bottom */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/70 shrink-0">
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-2.5 flex items-center gap-2.5 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[8.5px] font-bold uppercase tracking-wider text-indigo-600">Active State</div>
              <div className="text-xs font-black text-slate-800 truncate leading-tight">{currentState?.name || 'Andhra Pradesh'}</div>
            </div>
          </div>

          {/* Analytical Engine Status */}
          <div className="px-1 flex items-center justify-between text-[9.5px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Engine
            </span>
            <span className="font-mono font-semibold text-slate-600">{currentState?.adminUnitCount || 696} {currentState?.adminUnitPlural || 'Mandals'}</span>
          </div>
        </div>
      )}
    </aside>
  );
};
