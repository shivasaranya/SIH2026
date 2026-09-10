import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Map, 
  MapPin, 
  Sliders, 
  BookOpen, 
  Activity, 
  ShieldCheck, 
  Clock,
  ChevronLeft,
  ChevronRight,
  Target,
  Shield,
  Bell,
  Megaphone,
  CheckSquare,
  CheckCircle,
  History,
  BarChart2
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
  const isMZ = currentState.id === 'mizoram';
  const isTN = currentState.id === 'tamil_nadu';
  const isJK = currentState.id === 'jammu_kashmir';
  const isMP = currentState.id === 'madhya_pradesh';
  const isHP = currentState.id === 'himachal_pradesh';
  const priorityCount = isMP ? '422' : isJK ? '197' : isMZ ? '26' : isHP ? '172' : isTN ? '302' : '680';

  const assessmentItems = [
    { id: 'relocation' as ActiveTab, label: 'Relocation Planning', icon: MapPin }
  ];

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
      items: assessmentItems
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
      title: 'EMERGENCY INTELLIGENCE',
      items: [
        { id: 'emergency_alerts' as ActiveTab, label: 'Live Alerts', icon: Bell },
        { id: 'citizen_reports' as ActiveTab, label: 'Citizen Reports', icon: Megaphone },
        { id: 'emergency_map' as ActiveTab, label: 'Emergency Map', icon: Map },
        { id: 'verification_queue' as ActiveTab, label: 'Verification Queue', icon: CheckSquare },
        { id: 'verified_incidents' as ActiveTab, label: 'Verified Incidents', icon: CheckCircle },
        { id: 'alert_history' as ActiveTab, label: 'Alert History', icon: History },
        { id: 'emergency_analytics' as ActiveTab, label: 'Analytics', icon: BarChart2 },
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
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-1.5 rounded-lg text-xs transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-50/90 text-indigo-900 border border-indigo-200/80 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent font-medium'
                    }`}
                    title={collapsed ? `${item.label} ${item.badge ? `(${item.badge})` : ''}` : undefined}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      {!collapsed && (
                        <span className="tracking-tight text-[11px] leading-tight text-left">
                          {item.label}
                        </span>
                      )}
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
              <div className="text-xs font-black text-slate-800 truncate leading-tight">{currentState.name}</div>
            </div>
          </div>

          {/* Analytical Engine Status */}
          <div className="px-1 flex items-center justify-between text-[9.5px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Engine
            </span>
            <span className="font-mono font-semibold text-slate-600">{currentState.adminUnitCount} {currentState.adminUnitPlural}</span>
          </div>
        </div>
      )}
    </aside>
  );
};

