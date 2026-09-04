import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Shield, 
  Search, 
  ArrowRight, 
  Compass, 
  Layers, 
  ChevronRight, 
  Clock, 
  X
} from 'lucide-react';

interface StateSelectionScreenProps {
  onSelectState: (stateName: string) => void;
  onBackToLanding: () => void;
}

interface StateFeatureProperties {
  state_name: string;
  is_implemented: boolean;
  pilot_status: string;
}

export const StateSelectionScreen: React.FC<StateSelectionScreenProps> = ({
  onSelectState,
  onBackToLanding,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComingSoonState, setSelectedComingSoonState] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [loadingMap, setLoadingMap] = useState(true);

  // Initialize Leaflet Map for India
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Leaflet Map instance
    const map = L.map(mapContainerRef.current, {
      center: [22.5, 82.0],
      zoom: 4.5,
      minZoom: 4,
      maxZoom: 7,
      zoomControl: false,
      attributionControl: false,
    });

    // Add base tiles (Esri World Dark Gray Base - No API Key Required)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      attribution: '&copy; Esri, OpenStreetMap',
    }).addTo(map);

    // Zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // Fetch and render India states GeoJSON
    // Data Source: DataMeet Open Spatial Data / Official Survey of India administrative state boundaries
    fetch('/data/india_states.geojson')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load India states boundary GeoJSON');
        return res.json();
      })
      .then((geoData) => {
        if (!mapInstanceRef.current) return;

        const layer = L.geoJSON(geoData, {
          style: (feature) => {
            const props = feature?.properties as StateFeatureProperties;
            const isAP = props?.is_implemented;

            return {
              color: isAP ? '#10b981' : '#334155',
              weight: isAP ? 2 : 1,
              fillColor: isAP ? '#065f46' : '#0f172a',
              fillOpacity: isAP ? 0.75 : 0.6,
              dashArray: isAP ? undefined : '2, 2',
            };
          },
          onEachFeature: (feature, featureLayer) => {
            const props = feature.properties as StateFeatureProperties;
            const stateName = props.state_name;
            const isAP = props.is_implemented;

            // Custom clean tooltip showing state name and status
            featureLayer.bindTooltip(
              `<div class="p-1 text-center select-none font-sans">
                <div class="text-xs font-bold ${isAP ? 'text-emerald-400' : 'text-slate-200'}">${stateName}</div>
                <div class="text-[10px] font-mono mt-0.5 ${isAP ? 'text-emerald-300 font-bold' : 'text-amber-400/90'}">
                  ${isAP ? '● ACTIVE PILOT (Click to Launch)' : '○ Data Integration Coming Soon'}
                </div>
              </div>`,
              { sticky: true, className: 'leaflet-custom-tooltip' }
            );

            featureLayer.on({
              mouseover: (e) => {
                const target = e.target as L.Path;
                setHoveredState(stateName);
                target.setStyle({
                  weight: 2.5,
                  color: isAP ? '#34d399' : '#38bdf8',
                  fillColor: isAP ? '#047857' : '#1e293b',
                  fillOpacity: 0.9,
                });
                target.bringToFront();
              },
              mouseout: (e) => {
                const target = e.target as L.Path;
                setHoveredState(null);
                target.setStyle({
                  color: isAP ? '#10b981' : '#334155',
                  weight: isAP ? 2 : 1,
                  fillColor: isAP ? '#065f46' : '#0f172a',
                  fillOpacity: isAP ? 0.75 : 0.6,
                  dashArray: isAP ? undefined : '2, 2',
                });
              },
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                if (isAP) {
                  onSelectState('Andhra Pradesh');
                } else {
                  setSelectedComingSoonState(stateName);
                }
              },
            });
          },
        });

        layer.addTo(map);
        geojsonLayerRef.current = layer;
        
        // Fit map view to India boundaries
        try {
          const bounds = layer.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [20, 20], maxZoom: 5.5 });
          }
        } catch {
          // fallback center
        }

        setLoadingMap(false);
      })
      .catch((err) => {
        console.error('Error loading India states GeoJSON:', err);
        setLoadingMap(false);
      });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [onSelectState]);

  // List of major states for quick selection dropdown / filter
  const allStates = [
    { name: 'Andhra Pradesh', status: 'Implemented', isPilot: true },
    { name: 'Tamil Nadu', status: 'Coming Soon', isPilot: false },
    { name: 'Odisha', status: 'Coming Soon', isPilot: false },
    { name: 'Kerala', status: 'Coming Soon', isPilot: false },
    { name: 'Karnataka', status: 'Coming Soon', isPilot: false },
    { name: 'Maharashtra', status: 'Coming Soon', isPilot: false },
    { name: 'Gujarat', status: 'Coming Soon', isPilot: false },
    { name: 'West Bengal', status: 'Coming Soon', isPilot: false },
    { name: 'Telangana', status: 'Coming Soon', isPilot: false },
    { name: 'Goa', status: 'Coming Soon', isPilot: false },
  ];

  const filteredStates = allStates.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Background GIS Grid & Vignette */}
      <div className="absolute inset-0 bg-gis-grid opacity-25 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Left: Branding & Subtitle */}
          <div className="flex items-center space-x-3.5">
            <button 
              onClick={onBackToLanding}
              className="bg-emerald-500/15 p-2 rounded-xl border border-emerald-500/30 text-emerald-400 shadow-sm flex items-center justify-center hover:bg-emerald-500/25 transition"
              title="Return to Access Selection"
            >
              <Shield className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-white">
                  RakshaSethu
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold">
                  GOVERNMENT
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                Government Decision Support
              </p>
            </div>
          </div>

          {/* Right: State Selection Indicator */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3.5 py-1.5 rounded-lg border border-slate-700/60 text-xs shadow-sm">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold text-slate-200">State Selection</span>
            </div>
          </div>

        </div>
      </header>

      {/* Breadcrumb Bar */}
      <div className="relative z-20 bg-slate-900/60 border-b border-slate-800/70 px-4 sm:px-8 py-2 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center space-x-2">
          <button 
            onClick={onBackToLanding}
            className="hover:text-emerald-400 transition"
          >
            RakshaSethu
          </button>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-slate-300">Government</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-emerald-400 font-semibold">Select State</span>
        </div>
      </div>

      {/* Main Content: Map HERO Container */}
      <main className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        
        {/* Title & Directive */}
        <div className="text-center space-y-1.5 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Select your State
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            &ldquo;Choose a state to view disaster decision-support information.&rdquo;
          </p>
        </div>

        {/* Quick Search & Pilot Badge Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-md">
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Indian state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
            />
          </div>

          {/* Pilot State Quick Launch Pill */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => onSelectState('Andhra Pradesh')}
              className="group flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition shadow-sm"
              title="Launch Andhra Pradesh Decision Support"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Andhra Pradesh (Active Pilot)</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Hero India Map Visual Container */}
        <div className="relative flex-1 min-h-[480px] lg:min-h-[560px] rounded-2xl border border-slate-800/90 bg-slate-950/80 overflow-hidden shadow-2xl flex flex-col">
          
          {/* Top-left Legend & Status Badge */}
          <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-lg space-y-2 max-w-xs pointer-events-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 border-b border-slate-800 pb-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>National Disaster GIS</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 border border-emerald-300" />
                  Andhra Pradesh
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  PILOT READY
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-600" />
                  Other States
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  COMING SOON
                </span>
              </div>
            </div>
            {hoveredState && (
              <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                <span className="text-slate-500">Hovered:</span>
                <span className="font-bold text-white">{hoveredState}</span>
              </div>
            )}
          </div>

          {/* Leaflet Map DOM Element */}
          <div ref={mapContainerRef} className="w-full h-full min-h-[480px] lg:min-h-[560px] z-0" />

          {/* Loading Indicator */}
          {loadingMap && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[500] flex items-center justify-center space-x-2 text-xs text-slate-400">
              <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <span>Loading India States Boundary GIS...</span>
            </div>
          )}

          {/* Filtered States Quick List overlay if searching */}
          {searchQuery && (
            <div className="absolute top-4 right-4 z-[400] bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl max-h-60 overflow-y-auto custom-scrollbar w-64 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1">
                Matching States ({filteredStates.length})
              </p>
              {filteredStates.map((s) => (
                <button
                  key={s.name}
                  onClick={() => {
                    if (s.isPilot) {
                      onSelectState(s.name);
                    } else {
                      setSelectedComingSoonState(s.name);
                    }
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-left transition"
                >
                  <span className="text-slate-200 font-medium">{s.name}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    s.isPilot ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {s.status}
                  </span>
                </button>
              ))}
            </div>
          )}

        </div>

      </main>

      {/* Non-implemented State "Coming Soon" Modal Dialog */}
      {selectedComingSoonState && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedComingSoonState}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
                    REGIONAL EXPANSION IN PROGRESS
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedComingSoonState(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <p className="leading-relaxed">
                State-level data integration for this region is coming soon.
              </p>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Currently, <span className="text-emerald-400 font-semibold">Andhra Pradesh</span> is the operational pilot state with 26 districts and 696 mandals analyzed across multi-hazard exposure, census demographics, physical carrying capacity, and AHP/TOPSIS relocation models.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-1">
              <button
                onClick={() => setSelectedComingSoonState(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Choose Another State
              </button>
              <button
                onClick={() => {
                  setSelectedComingSoonState(null);
                  onSelectState('Andhra Pradesh');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20"
              >
                <span>Launch Andhra Pradesh Pilot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 px-4 py-3.5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>RakshaSethu Government Decision-Support Platform &bull; Smart India Hackathon 2026</span>
          <span className="text-[11px] font-mono text-slate-600">
            Boundary Source: DataMeet Open Spatial / Survey of India (Simplified for Web GIS)
          </span>
        </div>
      </footer>
    </div>
  );
};
