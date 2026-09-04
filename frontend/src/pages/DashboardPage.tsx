import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Layers, 
  Users, 
  Scale, 
  MapPin, 
  FileText,
  ShieldCheck
} from 'lucide-react';
import type { HealthResponse } from '../types';

interface DashboardPageProps {
  onNavigateToGIS?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToGIS }) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/health');
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data: HealthResponse = await res.json();
      setHealth(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Backend unreachable';
      setError(msg);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const workflowSteps = [
    { 
      title: '1. Hazard Exposure', 
      desc: 'Evaluate 38-year flood recurrence, cyclone storm buffers, design wind speeds, and terrain slope across 696 mandals.', 
      icon: Layers, 
      color: 'text-rose-400 bg-rose-500/10' 
    },
    { 
      title: '2. Community Vulnerability', 
      desc: 'Quantify demographic sensitivity using Census 2011 (children 0-6, female share, SC/ST, and non-worker dependents).', 
      icon: Users, 
      color: 'text-amber-400 bg-amber-500/10' 
    },
    { 
      title: '3. Emergency Capacity', 
      desc: 'Assess physical headroom in host zones (cyclone shelters, IPHS hospital beds, water coverage, and road networks).', 
      icon: Scale, 
      color: 'text-sky-400 bg-sky-500/10' 
    },
    { 
      title: '4. Relocation Planning', 
      desc: 'Rank habitations using multi-criteria AHP criteria weights and TOPSIS relative closeness to guide targeted planning.', 
      icon: MapPin, 
      color: 'text-purple-400 bg-purple-500/10' 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Disaster Decision Command Center */}
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Smart India Hackathon 2026 &bull; SIH26191
            </span>
            <h1 className="text-2xl font-extrabold text-white mt-1">
              Disaster Decision Command Center
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 max-w-3xl leading-relaxed">
              An explainable, GIS-based multi-hazard platform designed for disaster management authorities (District Collectors, SDMA) to identify vulnerable habitations, assess emergency capacity, and prioritize planning interventions.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-left shadow-sm">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Decision Engine</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Operational
              </div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-left shadow-sm">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Pilot Jurisdiction</div>
              <div className="text-xs font-bold text-sky-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Andhra Pradesh
              </div>
            </div>
          </div>
        </div>

        {onNavigateToGIS && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-300">
              Ready to explore live hazard and relocation priority layers statewide?
            </span>
            <button
              onClick={onNavigateToGIS}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20"
            >
              <span>Open Interactive Risk Map</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Decision-Support Workflow Pipeline */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Decision-Support Workflow Pipeline</h2>
          <span className="text-xs text-slate-400">Deterministic Analytical Flow</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div 
                key={idx} 
                className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all duration-150 shadow-sm"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 ${step.color} shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1.5">{step.title}</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Backend Connection Health Status Card */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">System Services Status</h2>
          </div>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors border border-slate-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>

        {loading ? (
          <div className="text-xs text-slate-400 flex items-center gap-2 py-2">
            <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></span>
            Verifying API microservices at <code>http://127.0.0.1:8000/api/health</code>...
          </div>
        ) : health ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-950/80 rounded-xl p-3 border border-emerald-500/20">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>API Status</span>
              </div>
              <p className="text-xs font-bold text-white capitalize">{health.status}</p>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800">
              <div className="text-[10px] text-slate-400 mb-1">Project Identifier</div>
              <p className="text-xs font-bold text-white font-mono">{health.sih_problem}</p>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800">
              <div className="text-[10px] text-slate-400 mb-1">System Version</div>
              <p className="text-xs font-bold text-white font-mono">v{health.version}</p>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800">
              <div className="text-[10px] text-slate-400 mb-1">Jurisdiction</div>
              <p className="text-xs font-bold text-white">{health.pilot_state}</p>
            </div>
          </div>
        ) : (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-300">FastAPI backend is offline</p>
              <p className="text-[11px] text-rose-400/80 mt-1">
                Error: {error}.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Decision-Support Governance Box */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Governance & Operational Boundary</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sahayata produces quantitative, reproducible decision support to empower human disaster managers (District Collectors, SDMA, and relief superintendents). 
              The system presents prioritized planning options, capacity bottlenecks, and candidate safer locations; it does not issue automated administrative relocation orders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
