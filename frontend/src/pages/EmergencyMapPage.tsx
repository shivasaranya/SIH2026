import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  RefreshCw,
  AlertTriangle,
  Flame,
  Wind,
  Waves,
  CloudLightning,
  Mountain,
  Droplets,
  Filter,
  X,
  Info,
  Clock,
  Radio,
} from 'lucide-react';
import { useActiveState } from '../context/StateContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DisasterType =
  | 'flood'
  | 'cyclone'
  | 'heavy_rainfall'
  | 'landslide'
  | 'earthquake'
  | 'tsunami'
  | 'forest_fire'
  | 'urban_fire'
  | 'drought'
  | 'other';

export type DisasterSeverity = 'critical' | 'high' | 'medium' | 'low' | 'warning';
export type DisasterStatus = 'active' | 'monitoring' | 'resolved';

export interface DisasterEvent {
  id: string;
  type: DisasterType;
  latitude: number;
  longitude: number;
  severity: DisasterSeverity;
  status: DisasterStatus;
  title: string;
  description: string;
  location: string;
  district: string;
  state: string;
  affectedArea?: { type: 'radius'; radiusKm: number } | { type: 'polygon'; coordinates: [number, number][] };
  affectedPopulation?: number;
  startedAt: string;
  lastUpdated: string;
  source: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<DisasterSeverity, { bg: string; border: string; text: string; dot: string; marker: string }> = {
  critical: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', dot: '#dc2626', marker: '#dc2626' },
  high: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', dot: '#ea580c', marker: '#ea580c' },
  medium: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', dot: '#ca8a04', marker: '#ca8a04' },
  low: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', dot: '#16a34a', marker: '#16a34a' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', dot: '#d97706', marker: '#d97706' },
};

const DISASTER_ICONS: Record<DisasterType, { emoji: string; label: string }> = {
  flood: { emoji: '🌊', label: 'Flood' },
  cyclone: { emoji: '🌀', label: 'Cyclone' },
  heavy_rainfall: { emoji: '🌧', label: 'Heavy Rainfall' },
  landslide: { emoji: '⛰', label: 'Landslide' },
  earthquake: { emoji: '🌎', label: 'Earthquake' },
  tsunami: { emoji: '🌊', label: 'Tsunami' },
  forest_fire: { emoji: '🔥', label: 'Forest Fire' },
  urban_fire: { emoji: '🔥', label: 'Urban Fire' },
  drought: { emoji: '☀️', label: 'Drought' },
  other: { emoji: '⚠️', label: 'Other' },
};

const TIME_RANGE_OPTIONS = [
  { value: 'live', label: 'Live' },
  { value: '6h', label: 'Last 6 Hours' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
];

const DISASTER_FILTER_OPTIONS: { value: DisasterType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'flood', label: '🌊 Flood' },
  { value: 'cyclone', label: '🌀 Cyclone' },
  { value: 'heavy_rainfall', label: '🌧 Heavy Rainfall' },
  { value: 'landslide', label: '⛰ Landslide' },
  { value: 'earthquake', label: '🌎 Earthquake' },
  { value: 'tsunami', label: '🌊 Tsunami' },
  { value: 'forest_fire', label: '🔥 Forest Fire' },
  { value: 'urban_fire', label: '🔥 Urban Fire' },
  { value: 'drought', label: '☀️ Drought' },
  { value: 'other', label: '⚠️ Other' },
];

const SEVERITY_FILTER_OPTIONS: { value: DisasterSeverity | 'all'; label: string }[] = [
  { value: 'all', label: 'All Severities' },
  { value: 'critical', label: '🔴 Critical' },
  { value: 'high', label: '🟠 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '🟢 Low' },
  { value: 'warning', label: '⚠️ Warning' },
];

// ─── Helper: create Leaflet marker for a disaster ─────────────────────────────

function createDisasterIcon(type: DisasterType, severity: DisasterSeverity): L.DivIcon {
  const color = SEVERITY_COLORS[severity].marker;
  const emoji = DISASTER_ICONS[type].emoji;
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        cursor: pointer;
      ">${emoji}</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

// ─── Fetch current disasters from API ──────────────────────────────────────────

async function fetchCurrentDisasters(stateId: string): Promise<DisasterEvent[]> {
  try {
    const res = await fetch(`/api/emergency/disasters?state=${encodeURIComponent(stateId)}&status=active`);
    if (!res.ok) return [];
    const json = await res.json();
    const list: any[] = Array.isArray(json) ? json : (json.items || json.disasters || []);
    return list.map((item: any) => ({
      id: String(item.id),
      type: (item.type || item.disasterType || 'other') as DisasterType,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      severity: (item.severity || 'warning') as DisasterSeverity,
      status: (item.status || 'active') as DisasterStatus,
      title: item.title || `${item.type || item.disasterType || 'Disaster'} Incident`,
      description: item.description || '',
      location: item.location || '',
      district: item.district || '',
      state: item.state || stateId,
      affectedArea: item.affectedArea,
      affectedPopulation: item.affectedPopulation,
      startedAt: item.startedAt || new Date().toISOString(),
      lastUpdated: item.lastUpdated || new Date().toISOString(),
      source: item.source || 'State Emergency Operations Center',
    }));
  } catch (err) {
    console.warn('[EmergencyMap] Failed to fetch disasters from backend:', err);
    return [];
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export const EmergencyMapPage: React.FC = () => {
  const { currentState } = useActiveState();

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const affectedAreasGroupRef = useRef<L.LayerGroup | null>(null);

  // Data state
  const [disasters, setDisasters] = useState<DisasterEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Selection state
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterEvent | null>(null);

  // Filter state
  const [filterType, setFilterType] = useState<DisasterType | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<DisasterSeverity | 'all'>('all');
  const [filterTime, setFilterTime] = useState<string>('live');
  const [showFilters, setShowFilters] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  // Filtered disasters
  const filteredDisasters = disasters.filter((d) => {
    if (filterType !== 'all' && d.type !== filterType) return false;
    if (filterSeverity !== 'all' && d.severity !== filterSeverity) return false;
    return true;
  });

  // ─── Load disaster data ──────────────────────────────────────────────────────
  const loadDisasters = useCallback(async () => {
    setLoading(true);
    setDataError(null);
    try {
      const data = await fetchCurrentDisasters(currentState.id);
      setDisasters(data);
      setLastUpdated(new Date());
    } catch (err) {
      setDataError('Live disaster data is currently unavailable.');
      setDisasters([]);
    } finally {
      setLoading(false);
    }
  }, [currentState.id]);

  useEffect(() => {
    loadDisasters();
  }, [loadDisasters]);

  // ─── Initialize Leaflet map ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) {
      // Map already initialized; just fly to new state center
      mapRef.current.flyToBounds(
        L.latLngBounds(currentState.bounds[0], currentState.bounds[1]),
        { padding: [30, 30], animate: true, duration: 1 }
      );
      return;
    }

    const map = L.map(mapContainerRef.current, {
      center: currentState.center,
      zoom: 7,
      zoomControl: true,
      attributionControl: true,
    });

    // Satellite tile layer (Esri World Imagery)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '© Esri, OpenStreetMap contributors',
        maxZoom: 18,
      }
    ).addTo(map);

    // Fit to state bounds
    map.fitBounds(L.latLngBounds(currentState.bounds[0], currentState.bounds[1]), { padding: [20, 20] });

    // Layer groups
    const markersGroup = L.layerGroup().addTo(map);
    const affectedAreasGroup = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersGroupRef.current = markersGroup;
    affectedAreasGroupRef.current = affectedAreasGroup;

    return () => {
      map.remove();
      mapRef.current = null;
      markersGroupRef.current = null;
      affectedAreasGroupRef.current = null;
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Fly to new state when context changes ────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.flyToBounds(
      L.latLngBounds(currentState.bounds[0], currentState.bounds[1]),
      { padding: [30, 30], animate: true, duration: 1 }
    );
  }, [currentState.id]);

  // ─── Render disaster markers ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current || !affectedAreasGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    affectedAreasGroupRef.current.clearLayers();

    filteredDisasters.forEach((disaster) => {
      const icon = createDisasterIcon(disaster.type, disaster.severity);
      const marker = L.marker([disaster.latitude, disaster.longitude], { icon }).addTo(
        markersGroupRef.current!
      );

      marker.on('click', () => {
        setSelectedDisaster(disaster);
      });

      // Affected area visualization
      if (disaster.affectedArea) {
        const color = SEVERITY_COLORS[disaster.severity].marker;
        if (disaster.affectedArea.type === 'radius') {
          L.circle([disaster.latitude, disaster.longitude], {
            radius: disaster.affectedArea.radiusKm * 1000,
            color,
            fillColor: color,
            fillOpacity: 0.12,
            weight: 2,
            dashArray: '6 4',
          }).addTo(affectedAreasGroupRef.current!);
        } else if (disaster.affectedArea.type === 'polygon') {
          L.polygon(disaster.affectedArea.coordinates.map((c) => [c[0], c[1]] as L.LatLngExpression), {
            color,
            fillColor: color,
            fillOpacity: 0.12,
            weight: 2,
            dashArray: '6 4',
          }).addTo(affectedAreasGroupRef.current!);
        }
      }
    });
  }, [filteredDisasters]);

  // ─── Severity badge ───────────────────────────────────────────────────────────
  const SeverityBadge: React.FC<{ severity: DisasterSeverity }> = ({ severity }) => {
    const c = SEVERITY_COLORS[severity];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${c.bg} ${c.border} ${c.text}`}>
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: c.dot }}
        />
        {severity.toUpperCase()}
      </span>
    );
  };

  // ─── Format date ──────────────────────────────────────────────────────────────
  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso || 'Not available';
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">

      {/* ── Top Header Bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 shrink-0 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase">Emergency Map</h1>
              <p className="text-[10px] text-slate-500 leading-none">{currentState.name} — Current Disaster Situation</p>
            </div>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] font-bold text-rose-700">LIVE</span>
          </div>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Updated: {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
              showFilters
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>

          {/* Legend toggle */}
          <button
            onClick={() => setShowLegend((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
              showLegend
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            Legend
          </button>

          {/* Refresh */}
          <button
            onClick={loadDisasters}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Filter Bar (collapsible) ── */}
      {showFilters && (
        <div className="flex items-center gap-4 px-4 py-2 bg-indigo-50 border-b border-indigo-100 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as DisasterType | 'all')}
              className="text-xs border border-indigo-200 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              {DISASTER_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as DisasterSeverity | 'all')}
              className="text-xs border border-indigo-200 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              {SEVERITY_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Time</label>
            <div className="flex gap-1">
              {TIME_RANGE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setFilterTime(o.value)}
                  className={`text-[10px] px-2 py-1 rounded-md font-semibold transition border ${
                    filterTime === o.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          {(filterType !== 'all' || filterSeverity !== 'all') && (
            <button
              onClick={() => { setFilterType('all'); setFilterSeverity('all'); setFilterTime('live'); }}
              className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1 hover:underline"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Main Body: Map + Side Panels ── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── Map Container ── */}
        <div className="flex-1 relative">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Error overlay */}
          {dataError && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[900] bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-md text-xs text-amber-800 font-semibold pointer-events-none">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              {dataError}
            </div>
          )}

          {/* No disasters overlay */}
          {!loading && !dataError && filteredDisasters.length === 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[900] bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl rounded-2xl px-6 py-4 max-w-sm text-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-800">No active disasters detected</p>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                No current disasters in <strong>{currentState.name}</strong>.
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Emergency Map is ready to display live disaster locations when verified data becomes available.
              </p>
            </div>
          )}

          {/* Legend (floating, bottom-right) */}
          {showLegend && (
            <div className="absolute bottom-4 right-4 z-[800] bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-xl p-3 text-xs min-w-[160px]">
              <p className="font-black text-[9px] uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-100 pb-1.5">
                Current Disasters
              </p>
              {(['critical', 'high', 'medium', 'low', 'warning'] as DisasterSeverity[]).map((sev) => (
                <div key={sev} className="flex items-center gap-2 mb-1">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: SEVERITY_COLORS[sev].marker }}
                  />
                  <span className="text-[10px] font-semibold text-slate-700 capitalize">{sev}</span>
                </div>
              ))}
              <p className="font-black text-[9px] uppercase tracking-wider text-slate-500 mt-2.5 mb-2 border-b border-slate-100 pb-1.5">
                Disaster Types
              </p>
              {Object.entries(DISASTER_ICONS).slice(0, 6).map(([type, info]) => (
                <div key={type} className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px]">{info.emoji}</span>
                  <span className="text-[10px] text-slate-600">{info.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Disaster count badge (top-left inside map) */}
          <div className="absolute top-3 left-3 z-[800] bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md rounded-xl px-3 py-2 flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${filteredDisasters.length > 0 ? 'bg-rose-100' : 'bg-slate-100'}`}>
              <AlertTriangle className={`w-4 h-4 ${filteredDisasters.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase leading-none">Active Disasters</p>
              <p className="text-sm font-black text-slate-800 leading-tight">{filteredDisasters.length}</p>
            </div>
          </div>
        </div>

        {/* ── Right Side Panel: Disaster list + detail ── */}
        <aside className="w-[300px] shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden">

          {/* Panel header */}
          <div className="px-3 py-2.5 border-b border-slate-100 shrink-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Active Disasters — {currentState.name}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {filteredDisasters.length === 0 ? 'None detected' : `${filteredDisasters.length} disaster${filteredDisasters.length > 1 ? 's' : ''} active`}
            </p>
          </div>

          {/* Disaster list */}
          <div className="flex-1 overflow-y-auto">
            {filteredDisasters.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <MapPin className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-600">No active disasters</p>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Verified disaster events for <strong>{currentState.name}</strong> will appear here when reported.
                </p>
                <div className="mt-4 w-full bg-blue-50 border border-blue-100 rounded-xl p-3 text-left">
                  <p className="text-[10px] font-bold text-blue-700 mb-1">Future Integration</p>
                  <p className="text-[10px] text-blue-600 leading-relaxed">
                    When the Citizen interface is connected, real-time emergency locations and verified disaster data will populate this map.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredDisasters.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDisaster(d);
                      mapRef.current?.flyTo([d.latitude, d.longitude], 11, { duration: 1 });
                    }}
                    className={`w-full text-left px-3 py-3 hover:bg-slate-50 transition ${
                      selectedDisaster?.id === d.id ? 'bg-indigo-50/70 border-l-2 border-indigo-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl mt-0.5 shrink-0">{DISASTER_ICONS[d.type].emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{d.title}</p>
                          <SeverityBadge severity={d.severity} />
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{d.location}, {d.district}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {DISASTER_ICONS[d.type].label} • {fmtDate(d.lastUpdated)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Disaster detail panel */}
          {selectedDisaster && (
            <div className="border-t border-slate-200 bg-slate-50 overflow-y-auto max-h-[55%] shrink-0">
              <div className="px-3 py-2.5 flex items-center justify-between bg-white border-b border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Incident Details</p>
                <button onClick={() => setSelectedDisaster(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{DISASTER_ICONS[selectedDisaster.type].emoji}</span>
                  <div>
                    <p className="text-sm font-black text-slate-800">{selectedDisaster.title}</p>
                    <SeverityBadge severity={selectedDisaster.severity} />
                  </div>
                </div>

                {[
                  { label: 'Disaster ID', value: selectedDisaster.id },
                  { label: 'Type', value: DISASTER_ICONS[selectedDisaster.type].label },
                  { label: 'Status', value: selectedDisaster.status.toUpperCase() },
                  { label: 'Location', value: selectedDisaster.location },
                  { label: 'District', value: selectedDisaster.district },
                  { label: 'State', value: selectedDisaster.state },
                  { label: 'Latitude', value: selectedDisaster.latitude.toFixed(5) },
                  { label: 'Longitude', value: selectedDisaster.longitude.toFixed(5) },
                  {
                    label: 'Affected Area',
                    value: selectedDisaster.affectedArea
                      ? selectedDisaster.affectedArea.type === 'radius'
                        ? `${selectedDisaster.affectedArea.radiusKm} km radius`
                        : 'Polygon (see map)'
                      : 'Extent data unavailable',
                  },
                  {
                    label: 'Affected Population',
                    value: selectedDisaster.affectedPopulation != null
                      ? selectedDisaster.affectedPopulation.toLocaleString()
                      : 'Not available',
                  },
                  { label: 'Started At', value: fmtDate(selectedDisaster.startedAt) },
                  { label: 'Last Updated', value: fmtDate(selectedDisaster.lastUpdated) },
                  { label: 'Data Source', value: selectedDisaster.source },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">{label}</span>
                    <span className="text-[10px] text-slate-700 text-right">{value}</span>
                  </div>
                ))}

                {selectedDisaster.description && (
                  <div className="mt-2 bg-white border border-slate-200 rounded-lg p-2">
                    <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase">Description</p>
                    <p className="text-[10px] text-slate-700 leading-relaxed">{selectedDisaster.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
