import React from 'react';
import { Shield, AlertCircle, MapPin, ChevronRight, ArrowRight, Grid } from 'lucide-react';

interface HeaderProps {
  pilotState: string;
  onBackToLanding?: () => void;
  onNavigateToStateSelection?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  pilotState, 
  onBackToLanding,
  onNavigateToStateSelection,
}) => {
  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-6 py-2 shadow-md">
      <div className="flex items-center justify-between">
        
        {/* Left: Shield, RakshaSethu & Subtitle & Breadcrumb */}
        <div className="flex items-center space-x-3">
          <div 
            onClick={onBackToLanding}
            className="bg-emerald-500/15 p-1.5 rounded-xl border border-emerald-500/30 text-emerald-400 shadow-sm flex items-center justify-center cursor-pointer hover:bg-emerald-500/25 transition"
            title="Return to Access Selection"
          >
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onBackToLanding}
                className="text-base font-extrabold tracking-tight text-white hover:text-emerald-300 transition flex items-center gap-1.5"
              >
                <span>RakshaSethu</span>
              </button>
              
              {/* Breadcrumb: Government / Andhra Pradesh */}
              <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400 font-medium pl-1 border-l border-slate-700/80">
                <button
                  onClick={onNavigateToStateSelection}
                  className="hover:text-indigo-300 transition"
                  title="Return to State Selection"
                >
                  Government
                </button>
                <ChevronRight className="w-3 h-3 text-slate-500" />
                <span className="text-emerald-400 font-semibold">{pilotState}</span>
              </div>
            </div>

            <p className="text-[10px] font-medium text-slate-400 leading-none mt-0.5">
              Disaster Decision &amp; Response Platform
            </p>
          </div>
        </div>

        {/* Center / Right: Change State, State Badge & Status */}
        <div className="flex items-center space-x-2.5">
          
          {/* India -> Change State button */}
          {onNavigateToStateSelection && (
            <button
              onClick={onNavigateToStateSelection}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition shadow-sm group"
              title="Return to India Map to choose another State"
            >
              <span>🇮🇳 India</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
              <span className="text-indigo-300">Change State</span>
            </button>
          )}

          {/* Current State Badge */}
          <div className="hidden md:flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{pilotState}</span>
          </div>

          {/* Subtle Decision Support Only Badge */}
          <div className="hidden lg:flex items-center space-x-1.5 bg-amber-500/10 text-amber-300/90 border border-amber-500/20 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold shadow-sm">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Decision Support Only</span>
          </div>

          {/* Switch Portal Role */}
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition"
              title="Switch Access Role / Return to Home"
            >
              <Grid className="w-4 h-4" />
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
