import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Search, 
  ArrowRight, 
  ArrowLeft,
  Layers, 
  Clock, 
  X,
  UserCheck,
  HeartHandshake,
  MapPin,
  CheckCircle2,
  Shield
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

  // Initialize Single India Map (Vector GeoJSON Only - No World Tile Layer)
  useEffect(() => {
    let isMounted = true;
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Leaflet Map instance centered on India
    const map = L.map(mapContainerRef.current, {
      center: [22.5, 82.0],
      zoom: 5,
      minZoom: 4,
      maxZoom: 8,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
    });

    // Zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // Fetch and render single India states GeoJSON (Vector only, no world tiles)
    fetch('/data/india_states.geojson')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load India states boundary GeoJSON');
        return res.json();
      })
      .then((geoData) => {
        if (!isMounted || !mapInstanceRef.current) return;

        const layer = L.geoJSON(geoData, {
          style: (feature) => {
            const props = feature?.properties as StateFeatureProperties;
            const isImplemented = Boolean(props?.is_implemented);

            if (isImplemented) {
              return {
                color: '#145A36',
                weight: 2.5,
                fillColor: '#1E7446',
                fillOpacity: 0.95,
              };
            }

            return {
              color: '#FFFFFF',
              weight: 1.5,
              fillColor: '#ECE8E0',
              fillOpacity: 0.9,
            };
          },
          onEachFeature: (feature, featureLayer) => {
            const props = feature.properties as StateFeatureProperties;
            const stateName = props.state_name;
            const isImplemented = Boolean(props.is_implemented);

            // Custom warm tooltip
            featureLayer.bindTooltip(
              `<div class="py-1.5 px-2.5 text-center select-none font-sans">
                <div class="text-xs font-bold ${isImplemented ? 'text-[#145A36]' : 'text-slate-900'}">${stateName}</div>
                <div class="text-[10px] font-semibold mt-0.5 ${isImplemented ? 'text-[#1E7446] font-extrabold' : 'text-amber-700'}">
                  ${isImplemented ? '★ OPERATIONAL STATE (Click to Launch)' : '○ Regional Data Expansion In Progress'}
                </div>
              </div>`,
              { sticky: true, className: 'leaflet-warm-tooltip' }
            );

            featureLayer.on({
              mouseover: (e) => {
                const target = e.target as L.Path;
                setHoveredState(stateName);
                if (isImplemented) {
                  target.setStyle({
                    weight: 3.5,
                    color: '#0B3B20',
                    fillColor: '#166534',
                    fillOpacity: 1,
                  });
                } else {
                  target.setStyle({
                    weight: 2.5,
                    color: '#0D629B',
                    fillColor: '#DDD6C9',
                    fillOpacity: 0.98,
                  });
                }
                target.bringToFront();
              },
              mouseout: (e) => {
                const target = e.target as L.Path;
                setHoveredState(null);
                if (isImplemented) {
                  target.setStyle({
                    color: '#145A36',
                    weight: 2.5,
                    fillColor: '#1E7446',
                    fillOpacity: 0.95,
                  });
                } else {
                  target.setStyle({
                    color: '#FFFFFF',
                    weight: 1.5,
                    fillColor: '#ECE8E0',
                    fillOpacity: 0.9,
                  });
                }
              },
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                if (isImplemented) {
                  onSelectState(stateName);
                } else {
                  setSelectedComingSoonState(stateName);
                }
              },
            });
          },
        });

        layer.addTo(map);
        geojsonLayerRef.current = layer;
        
        // Fit view strictly to India boundaries with tight padding to maximize map scale
        try {
          const bounds = layer.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [8, 8] });
          }
        } catch {
          // fallback center
        }

        // Add prominent AP marker label at coordinates [15.9, 79.7]
        const apLabelIcon = L.divIcon({
          className: 'ap-marker-badge',
          html: `<div style="
            background: #1E7446;
            color: #FFFFFF;
            font-family: inherit;
            font-size: 11px;
            font-weight: 700;
            padding: 5px 10px;
            border-radius: 9999px;
            box-shadow: 0 4px 14px rgba(20, 90, 54, 0.4);
            border: 2px solid #FFFFFF;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
            transform: scale(1.02);
          ">
            <span style="display:inline-block; width:7px; height:7px; background:#4ade80; border-radius:50%; box-shadow: 0 0 6px #4ade80;"></span>
            Andhra Pradesh (Active Pilot)
          </div>`,
          iconSize: [160, 28],
          iconAnchor: [80, 14],
        });

        const apMarker = L.marker([15.9, 79.7], { icon: apLabelIcon, interactive: true });
        apMarker.on('click', () => onSelectState('Andhra Pradesh'));
        apMarker.addTo(map);

        // Add prominent Tamil Nadu marker label at coordinates [11.12, 78.65]
        const tnLabelIcon = L.divIcon({
          className: 'tn-marker-badge',
          html: `<div style="
            background: #1E7446;
            color: #FFFFFF;
            font-family: inherit;
            font-size: 11px;
            font-weight: 700;
            padding: 5px 10px;
            border-radius: 9999px;
            box-shadow: 0 4px 14px rgba(20, 90, 54, 0.4);
            border: 2px solid #FFFFFF;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
            transform: scale(1.02);
          ">
            <span style="display:inline-block; width:7px; height:7px; background:#4ade80; border-radius:50%; box-shadow: 0 0 6px #4ade80;"></span>
            Tamil Nadu (Operational)
          </div>`,
          iconSize: [150, 28],
          iconAnchor: [75, 14],
        });

        const tnMarker = L.marker([11.12, 78.65], { icon: tnLabelIcon, interactive: true });
        tnMarker.on('click', () => onSelectState('Tamil Nadu'));
        tnMarker.addTo(map);

        // Add prominent Jammu & Kashmir marker label at coordinates [33.77, 75.0]
        const jkLabelIcon = L.divIcon({
          className: 'jk-marker-badge',
          html: `<div style="
            background: #1E7446;
            color: #FFFFFF;
            font-family: inherit;
            font-size: 11px;
            font-weight: 700;
            padding: 5px 10px;
            border-radius: 9999px;
            box-shadow: 0 4px 14px rgba(20, 90, 54, 0.4);
            border: 2px solid #FFFFFF;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
            transform: scale(1.02);
          ">
            <span style="display:inline-block; width:7px; height:7px; background:#4ade80; border-radius:50%; box-shadow: 0 0 6px #4ade80;"></span>
            Jammu & Kashmir (Operational)
          </div>`,
          iconSize: [180, 28],
          iconAnchor: [90, 14],
        });

        const jkMarker = L.marker([33.77, 75.0], { icon: jkLabelIcon, interactive: true });
        jkMarker.on('click', () => onSelectState('Jammu and Kashmir'));
        jkMarker.addTo(map);

        // Add prominent Madhya Pradesh marker label at coordinates [23.97, 78.42]
        const mpLabelIcon = L.divIcon({
          className: 'mp-marker-badge',
          html: `<div style="
            background: #1E7446;
            color: #FFFFFF;
            font-family: inherit;
            font-size: 11px;
            font-weight: 700;
            padding: 5px 10px;
            border-radius: 9999px;
            box-shadow: 0 4px 14px rgba(20, 90, 54, 0.4);
            border: 2px solid #FFFFFF;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
            transform: scale(1.02);
          ">
            <span style="display:inline-block; width:7px; height:7px; background:#4ade80; border-radius:50%; box-shadow: 0 0 6px #4ade80;"></span>
            Madhya Pradesh (Operational)
          </div>`,
          iconSize: [175, 28],
          iconAnchor: [87, 14],
        });

        const mpMarker = L.marker([23.97, 78.42], { icon: mpLabelIcon, interactive: true });
        mpMarker.on('click', () => onSelectState('Madhya Pradesh'));
        mpMarker.addTo(map);

        // Force invalidate size after DOM layout settles to ensure full expansion
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
            const bounds = layer.getBounds();
            if (bounds.isValid()) {
              mapInstanceRef.current.fitBounds(bounds, { padding: [8, 8] });
            }
          }
        }, 150);

        if (isMounted) setLoadingMap(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error loading India states GeoJSON:', err);
        setLoadingMap(false);
      });

    // Window resize handler
    const handleResize = () => {
      if (mapInstanceRef.current && geojsonLayerRef.current) {
        mapInstanceRef.current.invalidateSize();
        const bounds = geojsonLayerRef.current.getBounds();
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [8, 8] });
        }
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [onSelectState]);

  // Major states quick lookup
  const allStates = [
    { name: 'Andhra Pradesh', status: 'Operational Pilot', isPilot: true },
    { name: 'Tamil Nadu', status: 'Operational State', isPilot: true },
    { name: 'Jammu and Kashmir', status: 'Operational State', isPilot: true },
    { name: 'Madhya Pradesh', status: 'Operational State', isPilot: true },
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
    <div className="relative min-h-screen w-full bg-[#FBF9F4] text-slate-800 flex flex-col justify-between overflow-x-hidden select-none font-sans">
      
      {/* Top Header Bar */}
      <header className="relative z-20 w-full px-6 sm:px-10 pt-4 pb-3 border-b border-stone-200/80 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Left: National Emblem & Return Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 hover:border-slate-400 bg-white text-slate-700 text-xs font-semibold shadow-sm transition hover:bg-stone-50"
              title="Return to Access Selection"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <div className="h-6 w-[1px] bg-stone-200 hidden sm:block" />

            <div className="flex items-center gap-3">
              <img 
                src="/images/emblem_india.jpg" 
                alt="National Emblem of India" 
                className="h-9 sm:h-10 w-auto object-contain mix-blend-multiply"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold tracking-wide text-slate-900">
                    RAKSHA SETHU
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0D629B]/10 text-[#0D629B] border border-[#0D629B]/20">
                    GOVERNMENT
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  National Disaster Decision-Support Platform &bull; SIH26191
                </span>
              </div>
            </div>
          </div>

          {/* Right: Active Pilot Direct Launch Pill */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectState('Andhra Pradesh')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E7446] hover:bg-[#165a36] text-white text-xs font-bold shadow-md shadow-emerald-900/15 transition group"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
              <span className="hidden sm:inline">Active Pilot:</span>
              <span>Andhra Pradesh</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Container - Fully Expanded */}
      <main className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        
        {/* Title & National Status Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-stone-200/90 rounded-2xl px-5 py-3 shadow-sm">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Select State Jurisdiction</span>
              <span className="text-[11px] font-semibold text-[#1E7446] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Interactive National Map
              </span>
            </h1>
            <p className="text-xs text-slate-500 pt-0.5">
              Select an Indian state on the vector map below to open localized multi-hazard carrying capacity &amp; relocation decision support.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FBF9F4] border border-stone-300 rounded-xl pl-10 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0D629B] focus:bg-white transition"
            />
          </div>
        </div>

        {/* Large Expanded Single India Map Card */}
        <div className="relative flex-1 min-h-[660px] sm:min-h-[720px] lg:min-h-[780px] rounded-3xl border border-stone-200/90 bg-white overflow-hidden shadow-xl shadow-stone-300/30 flex flex-col w-full">
          
          {/* Top-Left: Map Legend Overlay */}
          <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md border border-stone-200 rounded-2xl p-3.5 shadow-md space-y-2.5 max-w-xs pointer-events-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-stone-100 pb-1.5">
              <Layers className="w-3.5 h-3.5 text-[#0D629B]" />
              <span>National Boundary Layer</span>
            </div>
            <div className="space-y-2 text-[11px]">
              <div 
                onClick={() => onSelectState('Andhra Pradesh')}
                className="flex items-center justify-between gap-3 cursor-pointer p-1.5 rounded-xl hover:bg-emerald-50 transition border border-transparent hover:border-emerald-200"
              >
                <span className="flex items-center gap-2 text-[#145A36] font-bold">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#1E7446] border border-[#145A36] shadow-sm" />
                  Andhra Pradesh
                </span>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-[#145A36] font-extrabold">
                  ACTIVE PILOT
                </span>
              </div>
              <div 
                onClick={() => onSelectState('Tamil Nadu')}
                className="flex items-center justify-between gap-3 cursor-pointer p-1.5 rounded-xl hover:bg-emerald-50 transition border border-transparent hover:border-emerald-200"
              >
                <span className="flex items-center gap-2 text-[#145A36] font-bold">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#1E7446] border border-[#145A36] shadow-sm" />
                  Tamil Nadu
                </span>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-[#145A36] font-extrabold">
                  OPERATIONAL
                </span>
              </div>
              <div 
                onClick={() => onSelectState('Jammu and Kashmir')}
                className="flex items-center justify-between gap-3 cursor-pointer p-1.5 rounded-xl hover:bg-emerald-50 transition border border-transparent hover:border-emerald-200"
              >
                <span className="flex items-center gap-2 text-[#145A36] font-bold">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#1E7446] border border-[#145A36] shadow-sm" />
                  Jammu & Kashmir
                </span>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-[#145A36] font-extrabold">
                  OPERATIONAL
                </span>
              </div>
              <div 
                onClick={() => onSelectState('Madhya Pradesh')}
                className="flex items-center justify-between gap-3 cursor-pointer p-1.5 rounded-xl hover:bg-emerald-50 transition border border-transparent hover:border-emerald-200"
              >
                <span className="flex items-center gap-2 text-[#145A36] font-bold">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#1E7446] border border-[#145A36] shadow-sm" />
                  Madhya Pradesh
                </span>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-[#145A36] font-extrabold">
                  OPERATIONAL
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 p-1.5">
                <span className="flex items-center gap-2 text-slate-500 font-medium">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#ECE8E0] border border-stone-300" />
                  Other States
                </span>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-stone-100 text-slate-500">
                  EXPANSION
                </span>
              </div>
            </div>

            {hoveredState && (
              <div className="pt-2 border-t border-stone-100 text-[11px] text-slate-700 flex items-center justify-between">
                <span className="text-slate-400">Inspecting:</span>
                <span className="font-bold text-slate-900">{hoveredState}</span>
              </div>
            )}
          </div>

          {/* Bottom-Right: Active States Quick Showcase Card */}
          <div className="absolute bottom-5 right-5 z-[400] bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-2xl p-4 shadow-lg max-w-sm pointer-events-auto hidden md:block">
            <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#1E7446] flex items-center justify-center border border-emerald-200">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Operational State Deployments
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  Full Spatial Relocation &amp; Capacity Models
                </p>
              </div>
            </div>

            <div className="space-y-2 my-2.5">
              {/* Andhra Pradesh Quick Tile */}
              <div 
                onClick={() => onSelectState('Andhra Pradesh')}
                className="bg-[#FAF8F3] hover:bg-emerald-50/60 transition cursor-pointer p-2.5 rounded-xl border border-stone-200/60 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Andhra Pradesh</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">PILOT</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">26 Districts &bull; 696 Mandals</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#1E7446]" />
              </div>

              {/* Tamil Nadu Quick Tile */}
              <div 
                onClick={() => onSelectState('Tamil Nadu')}
                className="bg-[#FAF8F3] hover:bg-emerald-50/60 transition cursor-pointer p-2.5 rounded-xl border border-stone-200/60 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Tamil Nadu</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">ACTIVE</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">38 Districts &bull; 302 Taluks</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#1E7446]" />
              </div>

              {/* Jammu & Kashmir Quick Tile */}
              <div 
                onClick={() => onSelectState('Jammu and Kashmir')}
                className="bg-[#FAF8F3] hover:bg-emerald-50/60 transition cursor-pointer p-2.5 rounded-xl border border-stone-200/60 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Jammu & Kashmir</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">ACTIVE</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">20 Districts &bull; 197 Tehsils</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#1E7446]" />
              </div>

              {/* Madhya Pradesh Quick Tile */}
              <div 
                onClick={() => onSelectState('Madhya Pradesh')}
                className="bg-[#FAF8F3] hover:bg-emerald-50/60 transition cursor-pointer p-2.5 rounded-xl border border-stone-200/60 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Madhya Pradesh</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">ACTIVE</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">52 Districts &bull; 422 Tehsils</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#1E7446]" />
              </div>
            </div>
          </div>

          {/* Bottom-Left: Technical Assurance Badge */}
          <div className="absolute bottom-5 left-5 z-[400] bg-white/90 backdrop-blur-sm border border-stone-200/80 rounded-xl px-3 py-1.5 shadow-sm text-[10px] text-slate-500 hidden sm:flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Single India Administrative GIS (DataMeet &bull; Survey of India Aligned)</span>
          </div>

          {/* Leaflet Single India Map DOM Element (Full Canvas) */}
          <div 
            ref={mapContainerRef} 
            className="w-full h-full min-h-[660px] sm:min-h-[720px] lg:min-h-[780px] z-0 bg-[#FAF8F3]" 
          />

          {/* Loading Indicator */}
          {loadingMap && (
            <div className="absolute inset-0 bg-white/85 backdrop-blur-sm z-[500] flex items-center justify-center space-x-2 text-xs text-slate-600">
              <div className="w-5 h-5 rounded-full border-2 border-[#1E7446] border-t-transparent animate-spin" />
              <span>Rendering Single India Boundary Map...</span>
            </div>
          )}

          {/* Filtered States Dropdown / Overlay if searching */}
          {searchQuery && (
            <div className="absolute top-4 right-4 z-[400] bg-white border border-stone-200 rounded-2xl p-3 shadow-xl max-h-64 overflow-y-auto custom-scrollbar w-64 space-y-1">
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
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-stone-50 text-left transition"
                >
                  <span className="text-slate-800 font-medium">{s.name}</span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                    s.isPilot ? 'bg-emerald-100 text-[#145A36] font-bold' : 'bg-stone-100 text-slate-500'
                  }`}>
                    {s.status}
                  </span>
                </button>
              ))}
            </div>
          )}

        </div>

      </main>

      {/* Non-implemented State "Coming Soon" Modal Dialog (Warm Themed) */}
      {selectedComingSoonState && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedComingSoonState}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                    DATA INTEGRATION IN PROGRESS
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedComingSoonState(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-stone-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
              <p className="leading-relaxed">
                Analytical hazard models and carrying capacity indicators for <span className="font-semibold text-slate-800">{selectedComingSoonState}</span> are currently being integrated into the national pipeline.
              </p>
              <p className="text-[11px] leading-relaxed text-slate-500">
                You can explore the live operational model using the <strong className="text-[#145A36]">Andhra Pradesh pilot</strong>, featuring all 26 districts, 696 mandals, 17,039 villages, and AHP/TOPSIS multi-criteria relocation priorities.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-1">
              <button
                onClick={() => setSelectedComingSoonState(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-semibold transition"
              >
                Choose Another State
              </button>
              <button
                onClick={() => {
                  setSelectedComingSoonState(null);
                  onSelectState('Andhra Pradesh');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E7446] hover:bg-[#165a36] text-white text-xs font-bold transition shadow-md shadow-emerald-900/15"
              >
                <span>Launch Andhra Pradesh Pilot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Pillars / Trust Markers */}
      <footer className="relative z-10 w-full py-4 px-4 border-t border-stone-200/80 bg-white/70">
        <div className="max-w-xl mx-auto flex items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-slate-600 flex-wrap">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-500" />
            <span>People First</span>
          </div>

          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-slate-500" />
            <span>Community Driven</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span>Single India Jurisdiction GIS</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
