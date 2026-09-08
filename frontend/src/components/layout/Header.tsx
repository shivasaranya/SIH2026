import React, { useState, useRef, useEffect } from 'react';
import { Shield, ChevronRight, Grid, AlertCircle, ArrowLeft, ChevronDown, Check } from 'lucide-react';
import { useActiveState } from '../../context/StateContext';

interface HeaderProps {
  pilotState: string;
  onBackToLanding?: () => void;
  onNavigateToStateSelection?: () => void;
  onSelectState?: (stateName: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  pilotState, 
  onBackToLanding,
  onNavigateToStateSelection,
  onSelectState,
}) => {
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentState, availableStates } = useActiveState();
  const stateCode = currentState?.code || 'IN';
  const sdmaLabel = currentState?.sdmaName || `${currentState?.name || 'State'} Disaster Management Authority`;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowStateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStateChange = (st: string) => {
    setShowStateDropdown(false);
    if (onSelectState) {
      onSelectState(st);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 px-4 lg:px-5 h-[52px] flex items-center justify-between shadow-xs select-none">
      
      {/* Left: Shield Logo & Branding */}
      <div className="flex items-center space-x-3">
        <div 
          onClick={onBackToLanding}
          className="bg-indigo-50 p-1.5 rounded-lg border border-indigo-200 text-indigo-600 shadow-xs flex items-center justify-center cursor-pointer hover:bg-indigo-100 transition"
          title="Return to Access Selection"
        >
          <Shield className="w-4 h-4 text-indigo-600" />
        </div>

        <div>
          <button
            onClick={onBackToLanding}
            className="text-xs sm:text-sm font-black tracking-tight text-slate-900 hover:text-indigo-600 transition flex items-center gap-1.5 leading-none"
          >
            <span>RAKSHA SETHU</span>
          </button>
          <div className="text-[10px] text-slate-500 font-medium tracking-tight hidden sm:block mt-0.5">
            Disaster Decision &amp; Response Platform
          </div>
        </div>

        {/* State Selector Pill */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowStateDropdown(!showStateDropdown)}
            className="hidden md:flex items-center space-x-1.5 bg-slate-50 border border-slate-200/90 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
            title="Switch State Jurisdiction"
          >
            <span className="text-slate-400 font-normal">In India</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-indigo-700 font-bold">{currentState?.name || pilotState}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {/* Dropdown Menu */}
          {showStateDropdown && (
            <div className="absolute top-full left-12 mt-1 w-72 max-h-[380px] overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider sticky top-0 bg-white border-b border-slate-100">
                Select Active State Jurisdiction
              </div>

              {availableStates.map((st) => {
                const isSelected = st.id === currentState.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => handleStateChange(st.name)}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                      isSelected ? 'text-indigo-600 font-bold bg-indigo-50/60' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{st.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {st.districtCount} Districts &bull; {st.adminUnitCount} {st.adminUnitPlural}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}

              <div className="border-t border-slate-100 mt-1 pt-1 sticky bottom-0 bg-white">
                <button
                  onClick={() => {
                    setShowStateDropdown(false);
                    onNavigateToStateSelection?.();
                  }}
                  className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50/50 transition flex items-center justify-between"
                >
                  <span>All States (Interactive India Map)...</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Decision Support Only + Grid Icon + State SDMA Avatar */}
      <div className="flex items-center space-x-2.5">
        
        {/* Switch State Button on Mobile */}
        {onNavigateToStateSelection && (
          <button
            onClick={onNavigateToStateSelection}
            className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition"
            title="Change State"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>{stateCode}</span>
          </button>
        )}

        {/* Decision Support Only Badge Pill */}
        <div className="flex items-center space-x-1.5 bg-indigo-50/70 text-indigo-700 border border-indigo-200/90 px-3 py-1 rounded-full text-xs font-semibold shadow-xs">
          <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />
          <span>Decision Support Only</span>
        </div>

        {/* Access Grid Switcher Button */}
        <button
          onClick={onBackToLanding}
          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition shadow-xs"
          title="Switch Access Role (Gov / Citizen)"
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* User Profile Avatar */}
        <div 
          className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs"
          title={`Official Profile (${sdmaLabel})`}
        >
          {stateCode}
        </div>

      </div>

    </header>
  );
};
