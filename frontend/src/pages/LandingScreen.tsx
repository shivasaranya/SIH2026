import React from 'react';
import { 
  Shield, 
  Building2, 
  User, 
  ArrowRight, 
  Activity, 
  Layers, 
  Radio, 
  Sparkles,
  Lock
} from 'lucide-react';

interface LandingScreenProps {
  onSelectRole: (role: 'government' | 'citizen') => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onSelectRole }) => {
  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden select-none font-sans">
      {/* Background GIS / Topographic Grid and Ambient Light */}
      <div className="absolute inset-0 bg-gis-grid opacity-35 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

      {/* Decorative ambient gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-[400px] h-[300px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/4 w-[400px] h-[300px] bg-sky-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle GIS coordinate markers / radar elements */}
      <div className="absolute top-6 left-8 hidden md:flex items-center gap-2 text-[10px] font-mono text-slate-500 tracking-wider">
        <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span>SYS.STATUS: OPERATIONAL &bull; AP PILOT MANDAL GRID (696)</span>
      </div>

      <div className="absolute top-6 right-8 hidden md:flex items-center gap-2 text-[10px] font-mono text-slate-500 tracking-wider">
        <Layers className="w-3.5 h-3.5 text-indigo-400" />
        <span>SECURE DECISION SUPPORT &bull; SIH26191</span>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-10 max-w-5xl mx-auto w-full">
        
        {/* Header Section with Staggered Entrance */}
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          
          {/* Step 1: Shield Icon (Protection, Safety & Disaster Response) */}
          <div className="flex justify-center">
            <div className="relative group cursor-default animate-shield-entrance">
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/30 via-indigo-500/30 to-emerald-500/30 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity animate-shield-glow" />
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-700/80 shadow-2xl flex items-center justify-center text-emerald-400 backdrop-blur-xl">
                <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
                <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>

          {/* Step 2: RAKSHA SETHU Title */}
          <div className="space-y-2 animate-fade-up animation-delay-200">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[0.12em] sm:tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 uppercase drop-shadow-sm">
              RAKSHA SETHU
            </h1>
            
            {/* Step 3: Subtitle & Description */}
            <p className="text-sm sm:text-base lg:text-lg font-semibold text-emerald-400/95 tracking-wide flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 hidden sm:inline" />
              Disaster Decision &amp; Response Platform
              <Sparkles className="w-4 h-4 text-emerald-400 hidden sm:inline" />
            </p>
          </div>

          <div className="animate-fade-up animation-delay-350">
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto font-normal leading-relaxed">
              Connecting authorities, communities and emergency response systems.
            </p>
          </div>

          {/* Step 4: Access Question */}
          <div className="pt-2 animate-fade-up animation-delay-500">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs sm:text-sm font-medium text-slate-300 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>How are you accessing RakshaSethu?</span>
            </div>
          </div>
        </div>

        {/* Step 5: Two Access Cards (Side-by-Side on Desktop, Stack on Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-3xl mt-8 sm:mt-10">
          
          {/* CARD 1 — GOVERNMENT */}
          <div 
            onClick={() => onSelectRole('government')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectRole('government'); } }}
            role="button"
            tabIndex={0}
            className="group relative rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-800/90 hover:border-indigo-500/50 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1.5 cursor-pointer backdrop-blur-md focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none animate-fade-up animation-delay-650"
          >
            {/* Top Badge & Corner Accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
            
            <div className="space-y-4">
              {/* Icon */}
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/25 group-hover:border-indigo-500/50 transition-all duration-300 shadow-lg shadow-indigo-500/10">
                  <div className="flex items-center justify-center">
                    <span className="text-2xl mr-1">🏛️</span>
                    <Building2 className="w-5 h-5 text-indigo-300 -ml-1 hidden sm:block" />
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  OFFICIAL ACCESS
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-bold tracking-wider text-white group-hover:text-indigo-200 transition-colors">
                  GOVERNMENT
                </h3>
                <p className="text-sm font-semibold text-indigo-300/90">
                  Decision Support &amp; Disaster Management
                </p>
                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  Access multi-hazard GIS analytics, AHP/TOPSIS relocation priorities, safe host mandal allocation, and simulation engine.
                </p>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="pt-6">
              <div className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm tracking-wide transition-all duration-200 shadow-lg shadow-indigo-600/25 group-hover:bg-indigo-500 group-hover:shadow-indigo-500/40">
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-200" />
              </div>
            </div>
          </div>

          {/* CARD 2 — CITIZEN */}
          <div 
            onClick={() => onSelectRole('citizen')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectRole('citizen'); } }}
            role="button"
            tabIndex={0}
            className="group relative rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-800/90 hover:border-emerald-500/50 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1.5 cursor-pointer backdrop-blur-md focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none animate-fade-up animation-delay-800"
          >
            {/* Top Badge & Corner Accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
            
            <div className="space-y-4">
              {/* Icon */}
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/25 group-hover:border-emerald-500/50 transition-all duration-300 shadow-lg shadow-emerald-500/10">
                  <div className="flex items-center justify-center">
                    <span className="text-2xl mr-1">👤</span>
                    <User className="w-5 h-5 text-emerald-300 -ml-1 hidden sm:block" />
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  PUBLIC PORTAL
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-bold tracking-wider text-white group-hover:text-emerald-200 transition-colors">
                  CITIZEN
                </h3>
                <p className="text-sm font-semibold text-emerald-300/90">
                  Report &amp; Receive Emergency Help
                </p>
                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  Report local emergency situations, locate nearby safe relief shelters, track evacuation alerts, and check-in family safety.
                </p>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="pt-6">
              <div className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm tracking-wide transition-all duration-200 shadow-lg shadow-emerald-600/25 group-hover:bg-emerald-500 group-hover:shadow-emerald-500/40">
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-200" />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Footer Section */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 py-4 sm:py-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-200">Smart India Hackathon 2026</span>
            <span className="text-slate-600 hidden sm:inline">&bull;</span>
            <span className="text-slate-400 text-[11px] font-mono hidden sm:inline">Problem SIH26191</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>End-to-End Encrypted Disaster Response Channel</span>
            </div>
            <span className="hidden sm:inline">&bull;</span>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>v1.0.0 AP Pilot</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
