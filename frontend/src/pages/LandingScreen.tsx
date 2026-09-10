import React from 'react';
import { 
  Landmark, 
  ArrowRight, 
  HeartHandshake, 
  Clock, 
  UserCheck 
} from 'lucide-react';

interface LandingScreenProps {
  onContinueAsGovernment?: () => void;
  onSelectRole?: (role: 'government' | 'citizen') => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ 
  onContinueAsGovernment,
  onSelectRole 
}) => {
  const handleProceed = () => {
    if (onContinueAsGovernment) {
      onContinueAsGovernment();
    } else if (onSelectRole) {
      onSelectRole('government');
    }
  };

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
        </div>

        {/* Government Action Card (Single Centered Card) */}
        <div className="w-full max-w-lg mt-8 sm:mt-10">
          
          {/* CARD — GOVERNMENT DASHBOARD */}
          <div 
            onClick={handleProceed}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleProceed(); } }}
            role="button"
            tabIndex={0}
            className="group relative rounded-3xl bg-white/95 border border-[#D8E6DD] hover:border-[#1F7A4D] p-6 sm:p-8 flex flex-col justify-between shadow-lg shadow-stone-300/30 hover:shadow-xl hover:shadow-[#1F7A4D]/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-[#1F7A4D] focus-visible:outline-none"
          >
            <div>
              {/* Header with Icon */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0F2D5C] text-white flex items-center justify-center shadow-md shadow-[#0F2D5C]/20 group-hover:scale-105 group-hover:bg-[#1F7A4D] transition-all duration-300 shrink-0">
                  <Landmark className="w-7 h-7 text-white stroke-[1.75]" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-heading font-extrabold tracking-wide text-[#0F2D5C] group-hover:text-[#1F7A4D] transition-colors">
                      GOVERNMENT
                    </h3>
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EAF4EE] text-[#1F7A4D] border border-[#D8E6DD]">
                      SIH26191
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    National Disaster Decision &amp; Command Platform
                  </p>
                </div>
              </div>

              {/* Description Body */}
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed mt-5">
                Access multi-hazard analytics, resource management, safe shelter allocation, carrying capacity and relocation decision engine across India.
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-6">
              <button 
                type="button"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-[#0F2D5C] hover:bg-[#1F7A4D] text-white font-semibold text-sm tracking-wide shadow-md shadow-[#0F2D5C]/20 transition-all duration-200 group-hover:shadow-lg cursor-pointer"
              >
                <span>Continue as Government</span>
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
