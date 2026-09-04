import React from 'react';
import { 
  Landmark, 
  Users, 
  ArrowRight, 
  HeartHandshake, 
  Clock, 
  UserCheck 
} from 'lucide-react';

interface LandingScreenProps {
  onSelectRole: (role: 'government' | 'citizen') => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onSelectRole }) => {
  return (
    <div className="relative min-h-screen w-full bg-[#FBF9F4] text-slate-800 flex flex-col justify-between overflow-x-hidden select-none font-sans">
      
      {/* Top Header: National Emblem & Hackathon Identification */}
      <header className="relative z-20 w-full px-6 sm:px-10 pt-6 pb-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/images/emblem_india.jpg" 
              alt="National Emblem of India" 
              className="h-10 sm:h-12 w-auto object-contain mix-blend-multiply"
            />
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-slate-800">
                Smart India Hackathon 2026
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-tight">
                Government of India Initiative &bull; SIH26191
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Scenic Illustrated Backdrop (Indian Village & Hills Landscape) */}
      <div className="absolute top-1/4 left-0 right-0 w-full h-[460px] sm:h-[520px] pointer-events-none overflow-hidden z-0 flex justify-center">
        <img 
          src="/images/village_hero_bg.jpg" 
          alt="Peaceful village landscape"
          className="w-full h-full object-cover object-center opacity-45 sm:opacity-60 mix-blend-multiply"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.85) 75%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.85) 75%, transparent 100%)'
          }}
        />
      </div>

      {/* Main Hero & Access Selection Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-4xl mx-auto w-full">
        
        {/* Title & Introduction Section */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-wide text-slate-900 uppercase">
            RAKSHA SETHU
          </h1>
          
          <h2 className="text-base sm:text-xl font-bold text-[#1E7446] tracking-tight">
            Disaster Decision &amp; Response Platform
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed pt-1">
            Connecting authorities, communities and emergency response systems.
          </p>

          <div className="pt-2 sm:pt-3">
            <p className="text-xs sm:text-sm font-semibold text-slate-700 tracking-tight">
              How are you accessing RakshaSethu?
            </p>
          </div>
        </div>

        {/* Two Primary Action Cards (Side-by-Side on Tablet/Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-2xl mt-8 sm:mt-10">
          
          {/* CARD 1 — GOVERNMENT */}
          <div 
            onClick={() => onSelectRole('government')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectRole('government'); } }}
            role="button"
            tabIndex={0}
            className="group relative rounded-3xl bg-white/95 border border-stone-200/90 hover:border-blue-400 p-6 sm:p-7 flex flex-col justify-between shadow-lg shadow-stone-300/30 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          >
            <div>
              {/* Header with Icon */}
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#0D629B] text-white flex items-center justify-center shadow-md shadow-blue-900/15 group-hover:scale-105 transition-transform duration-200 shrink-0">
                  <Landmark className="w-7 h-7 text-white stroke-[1.75]" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg sm:text-xl font-extrabold tracking-wide text-slate-900 group-hover:text-blue-700 transition-colors">
                    GOVERNMENT
                  </h3>
                  <p className="text-xs font-semibold text-slate-700">
                    Decision Support &amp; Disaster Management
                  </p>
                </div>
              </div>

              {/* Description Body */}
              <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed mt-5">
                Access multi-hazard analytics, resource management, safe shelter allocation and simulation engine.
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-6">
              <button 
                type="button"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0D629B] hover:bg-[#094d7c] text-white font-medium text-xs sm:text-sm tracking-wide shadow-sm shadow-blue-900/20 transition-all duration-200 group-hover:shadow-md"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
          </div>

          {/* CARD 2 — CITIZEN */}
          <div 
            onClick={() => onSelectRole('citizen')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectRole('citizen'); } }}
            role="button"
            tabIndex={0}
            className="group relative rounded-3xl bg-white/95 border border-stone-200/90 hover:border-emerald-500 p-6 sm:p-7 flex flex-col justify-between shadow-lg shadow-stone-300/30 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <div>
              {/* Header with Icon */}
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#1E7446] text-white flex items-center justify-center shadow-md shadow-emerald-900/15 group-hover:scale-105 transition-transform duration-200 shrink-0">
                  <Users className="w-7 h-7 text-white stroke-[1.75]" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg sm:text-xl font-extrabold tracking-wide text-slate-900 group-hover:text-[#1E7446] transition-colors">
                    CITIZEN
                  </h3>
                  <p className="text-xs font-semibold text-slate-700">
                    Report &amp; Receive Emergency Help
                  </p>
                </div>
              </div>

              {/* Description Body */}
              <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed mt-5">
                Report emergencies, find nearby safe shelters, track alerts and check-in for family safety.
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-6">
              <button 
                type="button"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1E7446] hover:bg-[#165a36] text-white font-medium text-xs sm:text-sm tracking-wide shadow-sm shadow-emerald-900/20 transition-all duration-200 group-hover:shadow-md"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* Bottom Pillars / Trust Markers */}
      <footer className="relative z-10 w-full py-6 px-4">
        <div className="max-w-xl mx-auto flex items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-medium text-slate-600 flex-wrap">
          <div className="flex items-center gap-2 hover:text-slate-900 transition-colors">
            <UserCheck className="w-4 h-4 text-slate-500" />
            <span>People First</span>
          </div>

          <div className="flex items-center gap-2 hover:text-slate-900 transition-colors">
            <HeartHandshake className="w-4 h-4 text-slate-500" />
            <span>Community Driven</span>
          </div>

          <div className="flex items-center gap-2 hover:text-slate-900 transition-colors">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Always Ready</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
