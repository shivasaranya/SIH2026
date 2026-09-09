import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import L from 'leaflet';
import {
  fetchNearbyPOIs,
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
 * Creates high-visibility DivIcon optimized for both Satellite and Standard Map
 */
function createPOIDivIcon(groupKey: POIGroupKey): L.DivIcon {
  const meta = POI_GROUP_CONFIGS[groupKey] || POI_GROUP_CONFIGS.others;
  return L.divIcon({
    className: 'custom-satellite-poi-marker',
    html: `
      <div style="
        background: ${meta.color};
        color: #ffffff;
        border: 2px solid #ffffff;
        outline: 1.5px solid ${meta.borderColor};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.65), 0 0 8px ${meta.color}80;
        cursor: pointer;
        transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease;
      " onmouseover="this.style.transform='scale(1.3)'; this.style.zIndex='9999';" onmouseout="this.style.transform='scale(1.0)'; this.style.zIndex='auto';">
        ${meta.icon}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
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
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // 9 Complete Category Toggles
  const [activeGroups, setActiveGroups] = useState<Record<POIGroupKey, boolean>>({
    education: true,
    medical: true,
    emergency: true,
    government: true,
    daily_needs: true,
    transport: true,
    food_lifestyle: true,
    financial: true,
    others: true,
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
      const data = await fetchNearbyPOIs(
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

      const config = POI_GROUP_CONFIGS[poi.group] || POI_GROUP_CONFIGS.others;
      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 13px; line-height: 1.4; min-width: 230px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; gap: 8px;">
            <span style="
              background: ${config.badgeBg};
              color: ${config.badgeText};
              border: 1px solid ${config.borderColor}40;
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
          <div style="font-size: 10px; color: #64748b; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px; display: flex; justify-content: space-between;">
            <span style="font-weight: 600; color: ${config.color};">${config.label}</span>
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
      food_lifestyle: 0,
      financial: 0,
      others: 0,
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
      food_lifestyle: val,
      financial: val,
      others: val,
    });
  };

  return (
    <div className={`absolute top-3 right-3 z-[400] flex flex-col gap-2 pointer-events-auto select-none ${className}`}>
      {/* Floating Control Card */}
      <div className="bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl min-w-[270px] max-w-[320px] transition-all overflow-hidden">
        {/* Header */}
        <div
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="p-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between cursor-pointer select-none hover:bg-slate-800/80 transition"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">📍</span>
            <div>
              <h4 className="font-bold text-xs tracking-wide text-white flex items-center gap-1.5">
                Live Places (OSM)
                {loading && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>}
              </h4>
              <p className="text-[10px] text-slate-400">
                {currentZoom <= minZoom ? `Zoom > ${minZoom} to load` : `${filteredPOIs.length} Places Found`}
              </p>
            </div>
          </div>
          <button
            className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition text-xs font-bold"
            title={isPanelOpen ? 'Collapse' : 'Expand'}
          >
            {isPanelOpen ? '▲' : '▼'}
          </button>
        </div>

        {/* Content Body */}
        {isPanelOpen && (
          <div className="p-3 space-y-2.5 max-h-[75vh] overflow-y-auto custom-scrollbar bg-slate-950/90 border-t border-slate-800">
            {/* Status / Quick Actions */}
            <div className="flex items-center justify-between text-xs">
              {loading ? (
                <span className="flex items-center gap-1.5 text-indigo-400 font-semibold animate-pulse text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Fetching Satellite POIs...
                </span>
              ) : currentZoom <= minZoom ? (
                <span className="text-[11px] text-amber-400 font-medium bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/50">
                  🔍 Zoom in (Level &gt; {minZoom}) to show markers
                </span>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-700/60">
                    {filteredPOIs.length} / {pois.length} Visible
                  </span>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      onClick={() => toggleAll(true)}
                      className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                    >
                      All
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      onClick={() => toggleAll(false)}
                      className="text-slate-400 hover:text-slate-300 font-bold hover:underline"
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
                placeholder="Search (e.g. Hospital, Apollo, Kirana)..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-500"
              />
            )}

            {/* 9 Category Checkbox Matrix */}
            <div className="space-y-1 pt-1 border-t border-slate-800">
              {(Object.keys(POI_GROUP_CONFIGS) as POIGroupKey[]).map((key) => {
                const config = POI_GROUP_CONFIGS[key];
                const count = groupCounts[key];
                const checked = activeGroups[key];

                return (
                  <label
                    key={key}
                    className={`flex items-center justify-between text-xs px-2 py-1.5 rounded-lg cursor-pointer transition ${
                      checked ? 'bg-slate-900 hover:bg-slate-800/90 text-white' : 'opacity-40 hover:opacity-75 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setActiveGroups((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                        className="rounded border-slate-700 text-indigo-500 focus:ring-0 w-3.5 h-3.5 bg-slate-800"
                      />
                      <span className="text-sm">{config.icon}</span>
                      <span className="font-medium text-[11px]">{config.label}</span>
                    </div>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{
                        backgroundColor: `${config.color}25`,
                        color: config.color,
                        border: `1px solid ${config.color}50`,
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
