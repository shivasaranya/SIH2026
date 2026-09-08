import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import L from 'leaflet';
import {
  fetchComprehensivePOIs,
  POI_GROUP_CONFIGS,
} from '../../services/overpassService';
import type { OverpassPOI, POIGroupKey } from '../../services/overpassService';

export interface DynamicOverpassPOILayerProps {
  map: L.Map | null;
  minZoom?: number;
  searchRadius?: number;
  onPOISelect?: (poi: OverpassPOI) => void;
  className?: string;
}

/**
 * Creates custom HTML DivIcon for POIs with category color and emoji
 */
function createPOIDivIcon(groupKey: POIGroupKey): L.DivIcon {
  const meta = POI_GROUP_CONFIGS[groupKey] || POI_GROUP_CONFIGS.daily_needs;
  return L.divIcon({
    className: 'custom-overpass-marker',
    html: `
      <div style="
        background: ${meta.color};
        color: #ffffff;
        border: 2px solid ${meta.borderColor};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        box-shadow: 0 3px 8px rgba(0,0,0,0.35);
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      " onmouseover="this.style.transform='scale(1.25)'; this.style.zIndex='1000';" onmouseout="this.style.transform='scale(1.0)'; this.style.zIndex='auto';">
        ${meta.icon}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

export const DynamicOverpassPOILayer: React.FC<DynamicOverpassPOILayerProps> = ({
  map,
  minZoom = 10,
  searchRadius = 5000,
  onPOISelect,
  className = '',
}) => {
  const [pois, setPois] = useState<OverpassPOI[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentZoom, setCurrentZoom] = useState<number>(map ? map.getZoom() : 10);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // 9 Category toggles state
  const [activeGroups, setActiveGroups] = useState<Record<POIGroupKey, boolean>>({
    education: true,
    medical: true,
    emergency: true,
    government: true,
    daily_needs: true,
    transport: true,
    food_stay: true,
    finance: true,
    religion_public: true,
  });

  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // Initialize LayerGroup on active Leaflet map
  useEffect(() => {
    if (!map) return;
    const layer = L.layerGroup().addTo(map);
    layerGroupRef.current = layer;

    return () => {
      layer.remove();
      layerGroupRef.current = null;
    };
  }, [map]);

  // Fetch logic based on dynamic map center coordinates
  const updatePOIs = useCallback(async () => {
    if (!map) return;
    const zoom = map.getZoom();
    setCurrentZoom(zoom);

    if (zoom <= minZoom) {
      setPois([]);
      if (layerGroupRef.current) layerGroupRef.current.clearLayers();
      return;
    }

    const center = map.getCenter();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const data = await fetchComprehensivePOIs(
        center.lat,
        center.lng,
        searchRadius,
        abortControllerRef.current.signal
      );
      setPois(data);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('[POILayer] OSM Fetch Notice:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [map, minZoom, searchRadius]);

  // Handle map pan/zoom with debouncing
  useEffect(() => {
    if (!map) return;

    const handleMapMove = () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = window.setTimeout(() => {
        updatePOIs();
      }, 400);
    };

    map.on('moveend', handleMapMove);
    map.on('zoomend', handleMapMove);

    // Initial load
    updatePOIs();

    return () => {
      map.off('moveend', handleMapMove);
      map.off('zoomend', handleMapMove);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [map, updatePOIs]);

  // Filter POIs based on active categories and search filter
  const filteredPOIs = useMemo(() => {
    return pois.filter((poi) => {
      if (!activeGroups[poi.group]) return false;
      if (!searchFilter.trim()) return true;
      const term = searchFilter.toLowerCase();
      return (
        poi.name.toLowerCase().includes(term) ||
        poi.subType.toLowerCase().includes(term) ||
        (poi.amenity && poi.amenity.toLowerCase().includes(term)) ||
        (poi.shop && poi.shop.toLowerCase().includes(term))
      );
    });
  }, [pois, activeGroups, searchFilter]);

  // Render markers onto Leaflet layer
  useEffect(() => {
    if (!layerGroupRef.current) return;
    layerGroupRef.current.clearLayers();

    filteredPOIs.forEach((poi) => {
      const icon = createPOIDivIcon(poi.group);
      const marker = L.marker([poi.lat, poi.lon], { icon });

      const config = POI_GROUP_CONFIGS[poi.group] || POI_GROUP_CONFIGS.daily_needs;
      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 13px; line-height: 1.4; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; gap: 8px;">
            <span style="
              background: ${config.badgeBg};
              color: ${config.badgeText};
              border: 1px solid ${config.color}40;
              padding: 2px 8px;
              border-radius: 9999px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">${config.icon} ${poi.subType}</span>
            <span style="font-size: 10px; color: #64748b; font-family: monospace;">OSM #${poi.id}</span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${poi.name}</h4>
          ${poi.rawTags['addr:street'] ? `<div style="font-size: 11px; color: #475569; margin-bottom: 3px;">📍 ${poi.rawTags['addr:street']}${poi.rawTags['addr:city'] ? `, ${poi.rawTags['addr:city']}` : ''}</div>` : ''}
          ${poi.rawTags.phone ? `<div style="font-size: 11px; color: #0284c7; margin-bottom: 3px;">📞 ${poi.rawTags.phone}</div>` : ''}
          ${poi.rawTags.opening_hours ? `<div style="font-size: 10px; color: #16a34a; margin-bottom: 3px;">🕒 ${poi.rawTags.opening_hours}</div>` : ''}
          <div style="font-size: 10px; color: #94a3b8; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px; display: flex; justify-content: space-between;">
            <span>${config.label}</span>
            <span>${poi.lat.toFixed(4)}°N, ${poi.lon.toFixed(4)}°E</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280 });
      marker.on('click', () => {
        if (onPOISelect) onPOISelect(poi);
      });

      marker.addTo(layerGroupRef.current!);
    });
  }, [filteredPOIs, onPOISelect]);

  // Group counts
  const groupCounts = useMemo(() => {
    const counts: Record<POIGroupKey, number> = {
      education: 0,
      medical: 0,
      emergency: 0,
      government: 0,
      daily_needs: 0,
      transport: 0,
      food_stay: 0,
      finance: 0,
      religion_public: 0,
    };
    pois.forEach((poi) => {
      if (counts[poi.group] !== undefined) {
        counts[poi.group]++;
      }
    });
    return counts;
  }, [pois]);

  const toggleAll = (val: boolean) => {
    setActiveGroups({
      education: val,
      medical: val,
      emergency: val,
      government: val,
      daily_needs: val,
      transport: val,
      food_stay: val,
      finance: val,
      religion_public: val,
    });
  };

  return (
    <div className={`absolute top-3 right-3 z-[400] flex flex-col gap-2 pointer-events-auto select-none ${className}`}>
      {/* Floating Control Card */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl min-w-[260px] max-w-[320px] transition-all overflow-hidden">
        {/* Header */}
        <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📍</span>
            <div>
              <h4 className="font-bold text-xs tracking-wide text-white">Live Nearby Places (OSM)</h4>
              <p className="text-[10px] text-slate-300">5 km radius • 9 Categories</p>
            </div>
          </div>
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition text-xs"
            title={isPanelOpen ? 'Collapse' : 'Expand'}
          >
            {isPanelOpen ? '▲' : '▼'}
          </button>
        </div>

        {/* Content Body */}
        {isPanelOpen && (
          <div className="p-3 space-y-2.5 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* Status / Search Bar */}
            <div className="flex items-center justify-between text-xs">
              {loading ? (
                <span className="flex items-center gap-1.5 text-indigo-600 font-semibold animate-pulse text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Fetching OSM Places...
                </span>
              ) : currentZoom <= minZoom ? (
                <span className="text-[11px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  🔍 Zoom &gt; {minZoom} to load POIs
                </span>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {filteredPOIs.length} / {pois.length} Visible
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      onClick={() => toggleAll(true)}
                      className="text-indigo-600 hover:underline font-semibold"
                    >
                      All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={() => toggleAll(false)}
                      className="text-slate-500 hover:underline font-semibold"
                    >
                      None
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Keyword Filter Input */}
            {currentZoom > minZoom && (
              <input
                type="text"
                placeholder="Filter places (e.g. Apollo, SBI)..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
            )}

            {/* 9 Category Checkbox Matrix */}
            <div className="space-y-1 pt-1 border-t border-slate-100">
              {(Object.keys(POI_GROUP_CONFIGS) as POIGroupKey[]).map((key) => {
                const config = POI_GROUP_CONFIGS[key];
                const count = groupCounts[key];
                const checked = activeGroups[key];

                return (
                  <label
                    key={key}
                    className={`flex items-center justify-between text-xs px-2 py-1.5 rounded-lg cursor-pointer transition ${
                      checked ? 'bg-slate-50/80 hover:bg-slate-100/90' : 'opacity-50 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setActiveGroups((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span className="text-sm">{config.icon}</span>
                      <span className="font-medium text-slate-700 text-[11px]">{config.label}</span>
                    </div>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{
                        backgroundColor: config.badgeBg,
                        color: config.badgeText,
                      }}
                    >
                      {count}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
