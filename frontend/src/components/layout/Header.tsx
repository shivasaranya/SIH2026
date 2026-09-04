import React from 'react';
import { Shield, AlertCircle, Compass } from 'lucide-react';

interface HeaderProps {
  pilotState: string;
}

export const Header: React.FC<HeaderProps> = ({ pilotState }) => {
  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/90 sticky top-0 z-40 px-5 lg:px-7 py-2.5 shadow-md">
      <div className="flex items-center justify-between">
        {/* Left: Branding & Subtitle */}
        <div className="flex items-center space-x-3.5">
          <div className="bg-emerald-500/15 p-2 rounded-xl border border-emerald-500/30 text-emerald-400 shadow-sm flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-xl font-extrabold tracking-tight text-white">
                Sahayata
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800/90 text-indigo-300 border border-indigo-500/30 font-mono">
                SIH26191
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              Disaster Decision-Support Platform
            </p>
          </div>
        </div>

        {/* Right: Pilot Status & Governance Badges */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 px-3.5 py-1.5 rounded-lg border border-slate-700/60 text-xs transition-colors shadow-sm">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Pilot:</span>
            <span className="font-semibold text-slate-200">{pilotState}</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/25 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Decision Support Only</span>
          </div>
        </div>
      </div>
    </header>
  );
};
