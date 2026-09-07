import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowLeft,
  Waves,
  Wind,
  Compass,
  Mountain,
  AlertTriangle,
  ShieldCheck,
  Sliders,
  Activity,
  Layers,
  CheckCircle2,
  MapPin,
  XCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Focus,
  Search
} from 'lucide-react';
import type {
  VillageHazardResponse,
  VillageGeometryResponse,
  VillageScenarioResponse,
  VillageRelocationResponse,
  VillageRelocationCandidate,
  SectorHazardDetail
} from '../types/village';
import {
  fetchVillageSummary,
  fetchVillageGeometry,
  fetchVillageScenario,
  fetchVillageRelocationCenters
} from '../services/api';

interface VillageAnalysisPageProps {
  villageCode: number;
  onBackToRiskMap: () => void;
  onNavigateToActionPlan?: () => void;
  onSelectVillage?: (code: number) => void;
}

export const TEST_VILLAGES = [
  { code: 583572, name: 'Dareli', mandal: 'Munchingi Puttu', district: 'Alluri Sitharama Raju', area: 0.03, category: 'Small Village' },
  { code: 584410, name: 'Pedabayalu', mandal: 'Ananthagiri', district: 'Alluri Sitharama Raju', area: 272.51, category: 'Large Village' },
  { code: 581073, name: 'Gangaram', mandal: 'Kotabommali', district: 'Srikakulam', area: 2.51, category: 'Coastal Village' },
  { code: 594124, name: 'Sammathagiri', mandal: 'Holagunda', district: 'Kurnool', area: 6.90, category: 'Inland Village' },
  { code: 588383, name: 'Chinagollapalem', mandal: 'Kruthivennu', district: 'Krishna', area: 35.48, category: 'Coastal Delta' },
];

const DISASTERS = [
  { id: 'all', label: 'Multi-Hazard', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'flood', label: 'Flood (30m)', icon: <Waves className="w-3.5 h-3.5" /> },
  { id: 'cyclone', label: 'Cyclone Track', icon: <Compass className="w-3.5 h-3.5" /> },
  { id: 'wind', label: 'Wind Zone', icon: <Wind className="w-3.5 h-3.5" /> },
  { id: 'slope', label: 'Terrain (≥15°)', icon: <Mountain className="w-3.5 h-3.5" /> },
];

export const VillageAnalysisPage: React.FC<VillageAnalysisPageProps> = ({
  villageCode,
  onBackToRiskMap,
  onNavigateToActionPlan,
  onSelectVillage,
}) => {
  const [activeDisaster, setActiveDisaster] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingHazards, setUpdatingHazards] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [hazardData, setHazardData] = useState<VillageHazardResponse | null>(null);
  const [geomData, setGeomData] = useState<VillageGeometryResponse | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  // Basemap switch: Satellite (default) vs Standard Map
  const [basemapMode, setBasemapMode] = useState<'satellite' | 'standard'>('satellite');
  const [mapReady, setMapReady] = useState<boolean>(false);
  // Sector overlay opacity: default 0.06 (6%, within the required 5-8% range)
  const [sectorOpacity, setSectorOpacity] = useState<number>(0.06);
  const [showSectorOverlay, setShowSectorOverlay] = useState<boolean>(true);
  const [currentZoom, setCurrentZoom] = useState<number>(15.0);
  const [customVillageSearch, setCustomVillageSearch] = useState<string>('');

  // Map DOM & Leaflet Refs (Controlled via callback ref state to guarantee container is mounted)
  const [mapContainerNode, setMapContainerNode] = useState<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayersRef = useRef<{ satellite: L.TileLayer; standard: L.TileLayer } | null>(null);
  const layersGroupRef = useRef<L.FeatureGroup | null>(null);
  const villageBoundsRef = useRef<L.LatLngBounds | null>(null);

  // What-If Slider (0 to 10)
  const [scenarioIncrease, setScenarioIncrease] = useState<number>(0);
  const [scenarioData, setScenarioData] = useState<VillageScenarioResponse | null>(null);

  // Relocation Centers
  const [relocData, setRelocData] = useState<VillageRelocationResponse | null>(null);
  const [loadingReloc, setLoadingReloc] = useState<boolean>(false);

  // 1. Initial Load for Village (Summary, Geometry, and Relocation Centers)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadingReloc(true);
    setError(null);

    Promise.all([
      fetchVillageSummary(villageCode, activeDisaster),
      fetchVillageGeometry(villageCode),
      fetchVillageRelocationCenters(villageCode, 6),
    ])
      .then(([haz, geo, reloc]) => {
        if (isMounted) {
          setHazardData(haz);
          setGeomData(geo);
          setRelocData(reloc);
          setLoading(false);
          setLoadingReloc(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load village spatial hazard data.');
          setLoading(false);
          setLoadingReloc(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [villageCode]);

  // 2. Disaster Filter Update (Preserves layout and Leaflet map canvas without unmounting)
  useEffect(() => {
    if (loading || !hazardData) return;
    let isMounted = true;
    setUpdatingHazards(true);

    fetchVillageSummary(villageCode, activeDisaster)
      .then((haz) => {
        if (isMounted) {
          setHazardData(haz);
          setUpdatingHazards(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUpdatingHazards(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeDisaster]);

  // Fetch What-If Scenario on slider change
  useEffect(() => {
    if (!villageCode) return;
    fetchVillageScenario(villageCode, scenarioIncrease)
      .then((res) => {
        setScenarioData(res);
      })
      .catch(() => {
        // preserve previous state
      });
  }, [villageCode, scenarioIncrease]);

  // Priority Styling Helpers
  const getPriorityBadge = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'VERY HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-extrabold';
      case 'MODERATE':
        return 'bg-blue-50 text-blue-700 border-blue-200 font-extrabold';
      case 'LOW':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-extrabold';
      case 'INSUFFICIENT DATA':
        return 'bg-slate-100 text-slate-700 border-slate-300 font-extrabold';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 font-extrabold';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'VERY HIGH':
        return '#f43f5e';
      case 'HIGH':
        return '#f59e0b';
      case 'MODERATE':
        return '#3b82f6';
      case 'LOW':
        return '#10b981';
      case 'INSUFFICIENT DATA':
        return '#94a3b8';
      default:
        return '#64748b';
    }
  };

  // -------------------------------------------------------------
  // LEAFLET MAP INITIALIZATION (Triggers strictly AFTER container is mounted in DOM)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerNode || mapInstanceRef.current) return;

    // Initialize Leaflet Map instance with fine zoom snap (Google Maps-like continuous zoom)
    const map = L.map(mapContainerNode, {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 90,
      minZoom: 8,
      maxZoom: 19,
    });

    // Dedicated Panes for physical layer hierarchy:
    // 1. Tile layer sits in default tilePane (zIndex: 200)
    // 2. Sector fills (zIndex: 350) - very transparent overlay above satellite
    // 3. Sector dividing lines (zIndex: 360) - crisp lines above fills
    // 4. Village cadastral boundary (zIndex: 370) - boundary outline above all sectors
    map.createPane('sectorsFillPane');
    const sFill = map.getPane('sectorsFillPane');
    if (sFill) sFill.style.zIndex = '350';

    map.createPane('sectorsLinePane');
    const sLine = map.getPane('sectorsLinePane');
    if (sLine) sLine.style.zIndex = '360';

    map.createPane('boundaryPane');
    const sBnd = map.getPane('boundaryPane');
    if (sBnd) sBnd.style.zIndex = '370';

    // 1. Real Satellite Tile Layer: Esri World Imagery (Authoritative, sub-meter aerial basemap)
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        maxNativeZoom: 18,
        opacity: 1.0,
        keepBuffer: 8,
        updateInterval: 100,
        className: 'satellite-tile',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
      }
    );

    // 2. Standard OpenStreetMap Layer (Cartographic Vector basemap fallback)
    const standardLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        opacity: 1.0,
        attribution: '&copy; OpenStreetMap contributors',
      }
    );

    tileLayersRef.current = { satellite: satelliteLayer, standard: standardLayer };

    // Default to active basemapMode (satellite default)
    if (basemapMode === 'satellite') {
      satelliteLayer.addTo(map);
    } else {
      standardLayer.addTo(map);
    }

    // FeatureGroup for Cadastral Boundary, Cardinal Sectors, and Centroid
    const featureGroup = L.featureGroup().addTo(map);
    layersGroupRef.current = featureGroup;

    mapInstanceRef.current = map;
    setMapReady(true);

    const handleZoomUpdate = () => {
      try {
        const z = map.getZoom();
        if (typeof z === 'number' && !isNaN(z)) {
          setCurrentZoom(Number(z.toFixed(1)));
        }
      } catch (e) {
        // map zoom not initialized yet
      }
    };
    map.on('zoomend', handleZoomUpdate);

    requestAnimationFrame(() => {
      map.invalidateSize();
    });
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      map.off('zoomend', handleZoomUpdate);
      map.remove();
      mapInstanceRef.current = null;
      layersGroupRef.current = null;
      tileLayersRef.current = null;
      villageBoundsRef.current = null;
      setMapReady(false);
    };
  }, [mapContainerNode]);

  // -------------------------------------------------------------
  // SWITCH BASEMAP (Satellite vs Standard Map)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !tileLayersRef.current) return;
    const { satellite, standard } = tileLayersRef.current;
    const map = mapInstanceRef.current;

    if (basemapMode === 'satellite') {
      if (map.hasLayer(standard)) map.removeLayer(standard);
      if (!map.hasLayer(satellite)) map.addLayer(satellite);
    } else {
      if (map.hasLayer(satellite)) map.removeLayer(satellite);
      if (!map.hasLayer(standard)) map.addLayer(standard);
    }
  }, [basemapMode, mapReady]);

  // -------------------------------------------------------------
  // RENDER SOI CADASTRAL BOUNDARY + N/E/S/W SECTORS + CENTROID
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !layersGroupRef.current || !geomData) return;
    const group = layersGroupRef.current;
    group.clearLayers();

    // -------------------------------------------------------------
    // 1. Cardinal Sectors FILLS (pane: 'sectorsFillPane', zIndex: 350)
    // Sits directly ABOVE satellite tiles with very transparent (~5%) tint
    // so individual houses, roads, streets, fields, and water bodies remain 100% visible
    // -------------------------------------------------------------
    if (geomData.sectors_geojson?.features) {
      const sectorsFillLayer = L.geoJSON(geomData.sectors_geojson, {
        pane: 'sectorsFillPane',
        style: (feature) => {
          const sName = feature?.properties?.sector;
          const sDetail = hazardData?.sectors.find((s) => s.sector === sName);
          const priority = sDetail?.priority || 'MODERATE';
          const isSel = selectedSector === sName;
          const fillColor = getPriorityColor(priority);

          // In satellite mode: very transparent overlay (5–8% default opacity, default 0.06)
          // so individual houses, roads, fields, and water bodies remain crystal-clear underneath.
          let computedFillOpacity = 0.0;
          if (showSectorOverlay) {
            const baseOpacity = basemapMode === 'satellite' ? sectorOpacity : 0.20;
            computedFillOpacity = isSel ? (basemapMode === 'satellite' ? 0.12 : 0.35) : (selectedSector ? 0.02 : baseOpacity);
          } else if (isSel) {
            computedFillOpacity = basemapMode === 'satellite' ? 0.10 : 0.25;
          }

          return {
            fillColor,
            fillOpacity: computedFillOpacity,
            stroke: false,
          };
        },
        onEachFeature: (feature, layer) => {
          const sName = feature.properties.sector;
          const sDetail = hazardData?.sectors.find((s) => s.sector === sName);

          layer.on('click', () => {
            setSelectedSector((prev) => (prev === sName ? null : sName));
          });

          layer.bindTooltip(
            `<div class="font-sans text-xs">
              <strong class="text-slate-900">${sName} Sector</strong><br/>
              <span class="text-slate-600">Priority: <strong>${sDetail?.priority || 'N/A'}</strong></span><br/>
              <span class="text-slate-600">Hazard Score: <strong>${(sDetail?.sector_hazard_score ?? 0).toFixed(3)}</strong></span><br/>
              <span class="text-slate-500 text-[10px]">Area: ${(feature.properties?.area_sqkm ?? 0).toFixed(2)} km²</span>
            </div>`,
            { sticky: true, className: 'leaflet-custom-tooltip' }
          );
        },
      });
      sectorsFillLayer.addTo(group);

      // -------------------------------------------------------------
      // 2. Sector DIVIDING LINES (pane: 'sectorsLinePane', zIndex: 360)
      // Sits directly ABOVE sector fills
      // -------------------------------------------------------------
      const sectorsLineLayer = L.geoJSON(geomData.sectors_geojson, {
        pane: 'sectorsLinePane',
        style: (feature) => {
          const sName = feature?.properties?.sector;
          const isSel = selectedSector === sName;
          return {
            fill: false,
            color: isSel ? '#ffffff' : '#38bdf8',
            weight: isSel ? 3.0 : 1.75,
            opacity: 0.9,
            dashArray: isSel ? undefined : '5, 4',
          };
        },
      });
      sectorsLineLayer.addTo(group);
    }

    // -------------------------------------------------------------
    // 3. Village CADASTRAL BOUNDARY (pane: 'boundaryPane', zIndex: 370)
    // Sits ABOVE sector dividing lines and fills
    // Survey of India EPSG:7755 projected to WGS84 GeoJSON
    // -------------------------------------------------------------
    if (geomData.village_boundary_geojson) {
      // 3a. Dark casing layer underneath for high contrast against light sand/buildings
      const casingLayer = L.geoJSON(geomData.village_boundary_geojson, {
        pane: 'boundaryPane',
        style: {
          color: '#000000',
          weight: 5.0,
          opacity: 0.85,
          fill: false,
        },
      });
      casingLayer.addTo(group);

      // 3b. Crisp outer glowing white dashed boundary
      const boundaryLayer = L.geoJSON(geomData.village_boundary_geojson, {
        pane: 'boundaryPane',
        style: {
          color: '#ffffff',
          weight: 2.5,
          opacity: 1.0,
          fill: false,
          dashArray: '6, 4',
        },
      });
      boundaryLayer.addTo(group);
    }

    // Fit view to complete village boundary initially (works dynamically for ALL village sizes)
    try {
      const bounds = group.getBounds();
      if (bounds.isValid() && mapInstanceRef.current) {
        villageBoundsRef.current = bounds;
        const map = mapInstanceRef.current;
        map.fitBounds(bounds, {
          padding: [30, 30],
          maxZoom: 18,
          animate: false,
        });
        map.invalidateSize();
        const z = map.getZoom();
        if (typeof z === 'number' && !isNaN(z)) {
          setCurrentZoom(Number(z.toFixed(1)));
        }
      }
    } catch (e) {
      // bounds catch
    }

    // 3. Village Centroid (Crosshair + Pulsing Marker + Coordinates)
    if (geomData.centroid_lat && geomData.centroid_lon) {
      const centroidIcon = L.divIcon({
        className: 'centroid-marker-container',
        html: `
          <div style="display: flex; align-items: center; gap: 6px; transform: translate(-10px, -10px); pointer-events: auto;">
            <span style="position: relative; display: flex; width: 18px; height: 18px;">
              <span style="position: absolute; display: inline-flex; width: 100%; height: 100%; border-radius: 9999px; background-color: #f43f5e; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              <span style="position: relative; display: inline-flex; border-radius: 9999px; width: 18px; height: 18px; background-color: #dc2626; border: 2.5px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.4);"></span>
            </span>
            <span style="background-color: rgba(15, 23, 42, 0.95); color: white; font-size: 10px; font-weight: 800; font-family: monospace; padding: 2px 7px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.3); white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.4);">
              Centroid
            </span>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const centroidMarker = L.marker([geomData.centroid_lat, geomData.centroid_lon], {
        icon: centroidIcon,
        zIndexOffset: 1000,
      });

      centroidMarker.bindTooltip(
        `<div class="font-mono text-xs">
          <strong>Village Centroid</strong><br/>
          Lat: ${geomData.centroid_lat.toFixed(5)}°N<br/>
          Lon: ${geomData.centroid_lon.toFixed(5)}°E
        </div>`,
        { direction: 'top' }
      );
      centroidMarker.addTo(group);
    }
  }, [geomData, hazardData, selectedSector, activeDisaster, mapReady, sectorOpacity, showSectorOverlay, basemapMode]);

  // Smoothly focus on selected sector when clicked
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !geomData) return;
    if (selectedSector && geomData.sectors_geojson?.features) {
      const targetFeature = geomData.sectors_geojson.features.find(
        (f: any) => f.properties?.sector === selectedSector
      );
      if (targetFeature) {
        try {
          const sLayer = L.geoJSON(targetFeature as any);
          const sBounds = sLayer.getBounds();
          if (sBounds.isValid()) {
            mapInstanceRef.current.fitBounds(sBounds, {
              padding: [30, 30],
              maxZoom: 17.5,
            });
            mapInstanceRef.current.invalidateSize();
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }, [selectedSector, mapReady]);

  // User Map Controls: Smooth Zoom, Pan & Reset to Complete Boundary
  const handleResetView = () => {
    if (mapInstanceRef.current && villageBoundsRef.current && villageBoundsRef.current.isValid()) {
      mapInstanceRef.current.fitBounds(villageBoundsRef.current, {
        padding: [30, 30],
        maxZoom: 18,
        animate: true,
        duration: 0.5,
      });
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn(0.5);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut(0.5);
    }
  };

  const handleZoomToLevel = (level: number) => {
    if (mapInstanceRef.current && villageBoundsRef.current && villageBoundsRef.current.isValid()) {
      mapInstanceRef.current.setView(villageBoundsRef.current.getCenter(), level, {
        animate: true,
        duration: 0.5,
      });
    }
  };

  const handleSwitchVillage = (targetCode: number) => {
    if (onSelectVillage) {
      onSelectVillage(targetCode);
    } else {
      window.location.hash = `#government/ap/village/${targetCode}`;
    }
  };

  // Active Sector for Inspection
  const activeSectorDetail: SectorHazardDetail | undefined = useMemo(() => {
    if (!hazardData) return undefined;
    if (selectedSector) {
      return hazardData.sectors.find((s) => s.sector === selectedSector);
    }
    return [...hazardData.sectors].sort((a, b) => b.sector_hazard_score - a.sector_hazard_score)[0];
  }, [hazardData, selectedSector]);

  // Proximity Tier grouping for Relocation Candidates
  const groupedCandidates = useMemo(() => {
    if (!relocData || !relocData.recommended_centers) return {};
    const tiers: Record<string, VillageRelocationCandidate[]> = {
      'NEARBY / SAME MANDAL': [],
      'ADJACENT MANDAL': [],
      'SAME DISTRICT': [],
      'REGIONAL FALLBACK': [],
    };

    relocData.recommended_centers.forEach((c) => {
      const cat = c.proximity_category || 'REGIONAL FALLBACK';
      if (!tiers[cat]) tiers[cat] = [];
      tiers[cat].push(c);
    });

    return tiers;
  }, [relocData]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f4f6fa] p-6 text-center space-y-3 select-none">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs animate-bounce">
          <Activity className="w-6 h-6 animate-spin" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          Loading Cadastral Resolution Spatial Intelligence...
        </h3>
        <p className="text-xs text-slate-500 max-w-md">
          Extracting Survey of India cadastral boundary, continuous 30m flood recurrence, 90m topography slope, and NOAA IBTrACS cyclone exposure for Census Village {villageCode}.
        </p>
      </div>
    );
  }

  if (error || !hazardData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f4f6fa] p-6 select-none">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-rose-600">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="font-bold text-sm">Village Analysis Inaccessible</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error || `Village with Census code ${villageCode} could not be loaded from Survey of India boundary dataset.`}
          </p>
          <button
            onClick={onBackToRiskMap}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-2xs flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to AP Risk Map</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative select-none">
      
      {/* MAIN WORKSPACE: 2-COLUMN LAYOUT (MAP DOMINANT CANVAS + RIGHT INTELLIGENCE PANEL) */}
      <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden relative gap-2.5">

        {/* LEFT COLUMN: TOP CONTROLS + CONTAINED HERO CADASTRAL MAP + STATUS STRIP */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative order-1 gap-2 overflow-hidden">
          
          {/* 0. DYNAMIC VILLAGE ARCHETYPE QUICK-SWITCHER BAR (Supports ALL villages + 1-click test archetypes) */}
          <div className="flex items-center justify-between gap-2 bg-slate-900 text-white rounded-xl px-3 py-1.5 shadow-2xs shrink-0 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>Test Villages:</span>
              </span>
              {TEST_VILLAGES.map((tv) => {
                const isCurrent = tv.code === villageCode;
                return (
                  <button
                    key={tv.code}
                    onClick={() => handleSwitchVillage(tv.code)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold transition border ${
                      isCurrent
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-xs ring-1 ring-indigo-300 font-black'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                    }`}
                    title={`${tv.category}: ${tv.name}, ${tv.mandal} Mandal (${tv.area} km²)`}
                  >
                    <span className="text-slate-400 text-[10px]">{tv.category.replace(' Village', '')}:</span>
                    <span className={isCurrent ? 'underline font-extrabold' : 'font-semibold'}>{tv.name}</span>
                    <span className="text-[9.5px] font-mono text-indigo-300">({tv.area}km²)</span>
                  </button>
                );
              })}
            </div>

            {/* Jump to Any Census Code input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const code = parseInt(customVillageSearch.trim(), 10);
                if (!isNaN(code) && code > 0) {
                  handleSwitchVillage(code);
                  setCustomVillageSearch('');
                }
              }}
              className="flex items-center gap-1"
            >
              <input
                type="text"
                placeholder="Any Census Code (e.g. 581086)..."
                value={customVillageSearch}
                onChange={(e) => setCustomVillageSearch(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-0.5 text-xs text-white placeholder-slate-400 w-44 focus:outline-hidden focus:border-indigo-500 font-mono"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-0.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1"
                title="Jump to Village"
              >
                <Search className="w-3 h-3" />
                <span>Jump</span>
              </button>
            </form>
          </div>

          {/* 1. TOP CONTROLS ROW (Above Map Card, matching Master Design System) */}
          <div className="flex items-center justify-between gap-2.5 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs shrink-0 flex-wrap select-none">
            
            {/* Left: Breadcrumbs / Drill-Down Return */}
            <div className="flex items-center gap-2">
              <button
                onClick={onBackToRiskMap}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition shadow-2xs"
                title="Return to Mandal Risk Map"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
                <span>AP Risk Map</span>
              </button>
              <span className="text-slate-300 font-bold">/</span>
              <span className="text-xs font-semibold text-slate-600">{hazardData.district_name}</span>
              <span className="text-slate-300 font-bold">/</span>
              <span className="text-xs font-semibold text-slate-600">{hazardData.mandal_name} Mandal</span>
              <span className="text-slate-300 font-bold">/</span>
              <span className="text-xs font-black text-indigo-900 bg-indigo-50/90 px-2.5 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-600" />
                {hazardData.village_name}
              </span>
            </div>

            {/* Middle: Disaster Focus Pill Tabs */}
            <div className="flex items-center gap-1 bg-slate-50/90 p-0.5 rounded-lg border border-slate-200/90">
              {DISASTERS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActiveDisaster(d.id)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold transition ${
                    activeDisaster === d.id
                      ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  {d.icon}
                  <span className="hidden xl:inline">{d.label}</span>
                </button>
              ))}
            </div>

            {/* Right: Resolution Badge & Reset Sector Filter */}
            <div className="flex items-center gap-2">
              {selectedSector && (
                <button
                  onClick={() => setSelectedSector(null)}
                  className="px-2 py-1 rounded-md text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition shadow-2xs"
                >
                  Reset Sector Filter
                </button>
              )}
              <div className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200 text-[10px] font-mono font-bold">
                <span>SOI Cadastral (EPSG:7755)</span>
              </div>
            </div>

          </div>

          {/* 2. CONTAINED HERO MAP CARD (Leaflet Satellite Imagery + Actual SOI Cadastral Boundary + Cardinal Sectors + Centroid) */}
          <div className="village-satellite-container flex-1 relative w-full h-full bg-slate-950 rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
            
            {/* Navy Control Strip with Map Layer Switcher & Sector Selectors */}
            <div className="bg-slate-900 text-white px-3.5 py-2 flex items-center justify-between shrink-0 shadow-xs select-none z-10 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${updatingHazards ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                <span className="text-xs font-bold tracking-wide">
                  REAL SATELLITE &amp; CADASTRAL BOUNDARY MAP &bull; {hazardData.village_name.toUpperCase()} ({(hazardData.village_area_sqkm ?? 0).toFixed(2)} km²)
                </span>
                {updatingHazards && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.2 rounded font-mono font-bold">
                    UPDATING...
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {/* MAP LAYER SWITCH: SATELLITE vs STANDARD MAP */}
                <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  <button
                    onClick={() => setBasemapMode('satellite')}
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[10.5px] font-black transition ${
                      basemapMode === 'satellite'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                    title="Real High-Resolution Satellite/Aerial Imagery (Esri World Imagery)"
                  >
                    <span>🛰️ SATELLITE</span>
                  </button>
                  <button
                    onClick={() => setBasemapMode('standard')}
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[10.5px] font-black transition ${
                      basemapMode === 'standard'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                    title="Standard Cartographic Map (OpenStreetMap)"
                  >
                    <span>🗺️ STANDARD MAP</span>
                  </button>
                </div>

                {/* Reset View & High Zoom controls */}
                <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  <button
                    onClick={handleResetView}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold text-slate-200 hover:text-white hover:bg-slate-700 transition"
                    title="Reset view to fit complete village boundary"
                  >
                    <Maximize2 className="w-3 h-3 text-indigo-400" />
                    <span>FIT BOUNDARY</span>
                  </button>
                  <button
                    onClick={() => handleZoomToLevel(18.0)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold text-slate-200 hover:text-white hover:bg-slate-700 transition"
                    title="Zoom in to see individual houses, buildings, streets, and fields"
                  >
                    <ZoomIn className="w-3 h-3 text-emerald-400" />
                    <span>HOUSES &amp; ROADS</span>
                  </button>
                </div>

                {/* INDEPENDENT OVERLAY TOGGLE */}
                <button
                  onClick={() => setShowSectorOverlay(!showSectorOverlay)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-black transition border ${
                    showSectorOverlay
                      ? 'bg-indigo-950/90 text-indigo-200 border-indigo-500/60 hover:bg-indigo-900'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                  title="Toggle sector hazard overlay tint on/off"
                >
                  <span>{showSectorOverlay ? '👁️ OVERLAY: ON' : '👁️‍🗨️ OVERLAY: OFF'}</span>
                </button>

                {/* 4 Cardinal Sector Buttons */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold mr-1">Sector:</span>
                  {(['NORTH', 'EAST', 'SOUTH', 'WEST'] as const).map((sec) => {
                    const isSel = selectedSector === sec;
                    const sData = hazardData.sectors.find(s => s.sector === sec);
                    const priority = sData?.priority || 'MODERATE';
                    return (
                      <button
                        key={sec}
                        onClick={() => setSelectedSector(isSel ? null : sec)}
                        className={`px-2 py-0.5 rounded text-[10.5px] font-black transition border ${
                          isSel 
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-2xs ring-2 ring-indigo-300' 
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                        title={`${sec} Sector (${priority})`}
                      >
                        {sec[0]}: {sec}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Interactive Leaflet Map Container */}
            <div className="flex-1 relative w-full h-full overflow-hidden bg-slate-950">
              
              {/* Leaflet Mount Target */}
              <div ref={setMapContainerNode} className="w-full h-full absolute inset-0 z-0" />

              {/* Floating Map Legend (Top-Left) */}
              <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-2.5 shadow-md z-10 text-[10px] space-y-1.5 select-none pointer-events-auto text-white">
                <div className="font-extrabold uppercase tracking-wider text-[9px] text-slate-300 mb-0.5 flex items-center justify-between gap-3">
                  <span>Sector Priority Overlay</span>
                  <span className="text-[8px] text-slate-400 font-mono">
                    {showSectorOverlay ? `${Math.round(sectorOpacity * 100)}% Opacity` : 'Hidden'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 ring-1 ring-white/50" />
                  <span className="font-semibold text-slate-200">Very High Priority</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 ring-1 ring-white/50" />
                  <span className="font-semibold text-slate-200">High Priority</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 ring-1 ring-white/50" />
                  <span className="font-semibold text-slate-200">Moderate Priority</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 ring-1 ring-white/50" />
                  <span className="font-semibold text-slate-200">Low Priority</span>
                </div>

                {/* Satellite Detail Opacity Switcher (Light 5-8% options) */}
                {basemapMode === 'satellite' && (
                  <div className="pt-1.5 mt-1 border-t border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>Detail Clarity</span>
                      <span className="text-indigo-400 font-mono">Zoom {currentZoom}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[
                        { label: '0% Pure', val: 0.0, desc: '100% Pure raw photographic satellite view' },
                        { label: '5% Light', val: 0.05, desc: '5% light analytical tint' },
                        { label: '6% Balanced', val: 0.06, desc: '6% balanced analytical tint (Recommended)' },
                        { label: '8% Subtle', val: 0.08, desc: '8% subtle analytical tint' },
                      ].map((item) => (
                        <button
                          key={item.val}
                          onClick={() => {
                            setSectorOpacity(item.val);
                            if (!showSectorOverlay && item.val > 0) {
                              setShowSectorOverlay(true);
                            }
                          }}
                          className={`flex-1 px-1 py-0.5 rounded text-[8px] font-extrabold transition border ${
                            sectorOpacity === item.val && showSectorOverlay
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-2xs'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                          }`}
                          title={item.desc}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-1 mt-1 border-t border-slate-700/60 text-[8px] text-slate-400">
                  White dashed: Cadastral Boundary
                </div>
              </div>

              {/* Centroid Coordinate Badge & Disaster Focus Indicator (Top-Right) */}
              <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10 select-none pointer-events-auto">
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-2.5 py-1 shadow-md text-[10px] font-mono text-slate-200">
                  Centroid: {geomData?.centroid_lat != null && geomData?.centroid_lon != null ? `${geomData.centroid_lat.toFixed(5)}°N, ${geomData.centroid_lon.toFixed(5)}°E` : 'Calculating...'}
                </div>
                <div className="bg-indigo-900/85 backdrop-blur-md border border-indigo-500/50 text-indigo-100 rounded-lg px-2 py-0.5 text-[9.5px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-pulse" />
                  <span>Overlay: {DISASTERS.find(d => d.id === activeDisaster)?.label}</span>
                </div>
              </div>

              {/* Interactive Sector Badge at Bottom Left of Map */}
              {activeSectorDetail && (
                <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-2.5 shadow-md z-10 text-xs max-w-xs space-y-1 text-white">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-white text-xs">
                      {activeSectorDetail.sector} Sector Spatial Inspection
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${getPriorityBadge(activeSectorDetail.priority)}`}>
                      {activeSectorDetail.priority}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300 leading-tight">
                    {activeSectorDetail.priority_reason}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400">
                    Area: {(activeSectorDetail.area_sqkm ?? 0).toFixed(2)} km² &bull; Score: {(activeSectorDetail.sector_hazard_score ?? 0).toFixed(3)}
                  </div>
                </div>
              )}

              {/* Google Maps-Grade Floating Zoom & Reset Controls (Bottom-Right) */}
              <div className="absolute bottom-3 right-3 flex flex-col items-end gap-2 z-10 select-none pointer-events-auto">
                {/* Live Zoom & Provider Pill */}
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-2.5 py-1 shadow-md text-[9.5px] font-mono text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-bold">Zoom {currentZoom}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">
                    {basemapMode === 'satellite' ? 'Esri World Imagery (Sub-Meter)' : 'OpenStreetMap'}
                  </span>
                </div>

                {/* Preset Zoom Levels */}
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-md flex items-center gap-1 text-[10px] font-bold">
                  <button
                    onClick={handleResetView}
                    className="px-2 py-1 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white transition flex items-center gap-1 shadow-2xs"
                    title="Reset view to fit complete village boundary"
                  >
                    <Focus className="w-3 h-3" />
                    <span>Fit Boundary</span>
                  </button>
                  <button
                    onClick={() => handleZoomToLevel(16.5)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition"
                    title="Zoom to village settlement cluster"
                  >
                    Settlement (z16.5)
                  </button>
                  <button
                    onClick={() => handleZoomToLevel(18.0)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition"
                    title="High-resolution view: individual houses, rooflines, streets, canals, fields"
                  >
                    Houses &amp; Streets (z18)
                  </button>
                </div>

                {/* + / - Zoom & Reset Buttons Group */}
                <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-lg flex flex-col overflow-hidden divide-y divide-slate-700/70">
                  <button
                    onClick={handleZoomIn}
                    className="w-8 h-8 flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-800 transition active:bg-slate-700"
                    title="Zoom In (+0.5)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="w-8 h-8 flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-800 transition active:bg-slate-700"
                    title="Zoom Out (-0.5)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleResetView}
                    className="w-8 h-8 flex items-center justify-center text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 transition active:bg-slate-700"
                    title="Reset Map View (Fit Complete Boundary)"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

            {/* Contained Bottom: What-If Hazard Perturbation Engine */}
            <div className="bg-slate-50/95 border-t border-slate-200 p-3 shrink-0 select-none z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span>WHAT-IF HAZARD PERTURBATION ENGINE</span>
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200">
                        SIMULATION
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Simulate compound micro-hazard increase: +{scenarioIncrease}% perturbation
                    </div>
                  </div>
                </div>

                {/* Slider Control */}
                <div className="flex items-center gap-3 w-full sm:w-64">
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={scenarioIncrease}
                    onChange={(e) => setScenarioIncrease(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="font-mono font-bold text-xs text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded shadow-2xs shrink-0">
                    +{scenarioIncrease}%
                  </span>
                </div>

                {/* Status Indicator */}
                {scenarioData && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Simulated Priority</div>
                      <span className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded-full border ${getPriorityBadge(scenarioData.simulated_relocation_priority)}`}>
                        {scenarioData.simulated_relocation_priority}
                      </span>
                    </div>
                    {scenarioData.priority_shifted && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg animate-pulse">
                        ⚠ Priority Shifted
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* 3. BOTTOM CONCEPT & DATA GOVERNANCE STRIP */}
          <footer className="bg-white border border-slate-200/90 rounded-xl px-3.5 py-1.5 shadow-2xs flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-4">
              
              {/* Concept 1: People First */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                </div>
                <div>
                  <div className="font-bold text-[10.5px] text-slate-800 leading-tight">People First</div>
                  <div className="text-[9.5px] text-slate-400 leading-none">Cadastral protection</div>
                </div>
              </div>

              <div className="hidden sm:block h-5 w-px bg-slate-200" />

              {/* Concept 2: Community Driven */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Activity className="w-3 h-3" />
                </div>
                <div>
                  <div className="font-bold text-[10.5px] text-slate-800 leading-tight">Community Driven</div>
                  <div className="text-[9.5px] text-slate-400 leading-none">Sector resilience</div>
                </div>
              </div>

              <div className="hidden sm:block h-5 w-px bg-slate-200" />

              {/* Concept 3: Always Ready */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Compass className="w-3 h-3" />
                </div>
                <div>
                  <div className="font-bold text-[10.5px] text-slate-800 leading-tight">Always Ready</div>
                  <div className="text-[9.5px] text-slate-400 leading-none">Real-time What-If</div>
                </div>
              </div>

            </div>

            {/* Right Side: Data Governance Status */}
            <div className="text-[9.5px] text-slate-500 font-medium text-right leading-tight hidden md:block">
              <div><strong>Data Governance:</strong> Census 2011 PCA &bull; SOI Cadastral MultiPolygon (EPSG:7755)</div>
              <div className="text-slate-400">&bull; Esri High-Resolution Satellite &bull; 30m JRC Water &bull; 90m SRTM &bull; DDMA Decision Support</div>
            </div>

          </footer>

        </div>

        {/* RIGHT COLUMN: INTELLIGENCE PANEL (350px - 380px width, full height) */}
        <aside className="w-full lg:w-[350px] xl:w-[380px] h-full bg-white border border-slate-200/90 rounded-2xl shadow-sm flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-3.5 space-y-3 z-20 order-2">
          
          {/* Card 1: Village Identity & Census Demographics */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3.5 space-y-3 shadow-2xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9.5px] font-mono uppercase tracking-wider text-indigo-600 font-bold block">
                  Census Village {hazardData.village_code}
                </span>
                <h2 className="text-lg font-black text-slate-900 leading-tight mt-0.5">
                  {hazardData.village_name}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {hazardData.mandal_name} Mandal &bull; {hazardData.district_name}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Priority</span>
                <span className={`text-[10.5px] px-2 py-0.5 rounded-full border inline-block mt-0.5 ${getPriorityBadge(hazardData.relocation_priority)}`}>
                  {hazardData.relocation_priority}
                </span>
              </div>
            </div>

            {/* 4-Metric Demographic Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Population</span>
                <strong className="text-base font-black text-slate-900 font-mono block mt-0.5">
                  {hazardData.population_total.toLocaleString()}
                </strong>
                <span className="text-[9px] text-slate-400 block">Census 2011 PCA</span>
              </div>

              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Households</span>
                <strong className="text-base font-black text-slate-900 font-mono block mt-0.5">
                  {hazardData.households.toLocaleString()}
                </strong>
                <span className="text-[9px] text-slate-400 block">Habitations</span>
              </div>

              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Cadastral Area</span>
                <strong className="text-base font-black text-slate-900 font-mono block mt-0.5">
                  {(hazardData.village_area_sqkm ?? 0).toFixed(2)} km²
                </strong>
                <span className="text-[9px] text-emerald-600 block font-semibold">100% SOI Match</span>
              </div>

              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Hazard Score</span>
                <strong className="text-base font-black text-indigo-600 font-mono block mt-0.5">
                  {(hazardData.overall_hazard_score ?? 0).toFixed(3)}
                </strong>
                <span className="text-[9px] text-slate-400 block">4-Factor Spatial</span>
              </div>
            </div>
          </div>

          {/* Card 2: Four-Factor Hazard Metrics */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Micro-Hazard Exposure</span>
              </span>
              <span className="text-[9px] font-mono text-slate-400 font-semibold">Continuous Layers</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* 1. Surface Water Inundation (30m JRC) */}
              <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                    <Waves className="w-3 h-3 text-sky-500" />
                    <span>Surface Water Recurrence (30m JRC)</span>
                  </div>
                  <span className="font-mono font-bold text-sky-700 text-[11px]">
                    {(hazardData.flood_summary?.pct_affected ?? 0).toFixed(1)}% affected
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  Mean recurrence: {(hazardData.flood_summary?.mean_rec ?? 0).toFixed(1)}% &bull; Max: {(hazardData.flood_summary?.max_rec ?? 0).toFixed(1)}%
                </div>
              </div>

              {/* 2. Cyclone Storm Tracks (IBTrACS) */}
              <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                    <Compass className="w-3 h-3 text-indigo-500" />
                    <span>Cyclone Proximity (IBTrACS)</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-700 text-[11px]">
                    {hazardData.cyclone_summary?.tracks_count ?? 0} tracks &bull; ~{(hazardData.cyclone_summary?.min_dist_km ?? 0).toFixed(1)} km
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  Historical storm tracks within 50 km buffer corridor
                </div>
              </div>

              {/* 3. Design Wind Speed (BMTPC) */}
              <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                    <Wind className="w-3 h-3 text-teal-500" />
                    <span>Basic Design Wind Speed (BMTPC)</span>
                  </div>
                  <span className="font-mono font-bold text-teal-700 text-[11px]">
                    {hazardData.wind_summary?.speed_ms ?? 0} m/s ({hazardData.wind_summary?.zone ?? 'Zone'})
                  </span>
                </div>
                <div className="text-[9.5px] text-slate-500 bg-white p-1.5 rounded-lg border border-slate-200/70 leading-tight font-medium">
                  Regional design wind speed uniform across village boundary at source resolution.
                </div>
              </div>

              {/* 4. Sector Steep Terrain (≥15°) */}
              <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                    <Mountain className="w-3 h-3 text-amber-500" />
                    <span>Sector Steep Terrain (≥15°)</span>
                  </div>
                  <span className="font-mono font-bold text-amber-700 text-[11px]">
                    {(hazardData.slope_summary?.pct_steep ?? 0).toFixed(1)}% steep
                  </span>
                </div>
                <div className="text-[9.5px] text-slate-500 bg-white p-1.5 rounded-lg border border-slate-200/70 leading-tight font-medium">
                  Village micro-topography descriptive indicator (≥15°); distinct from mandal exclusion constraint (&gt;25°).
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Micro-Sector Prioritization Matrix */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sector Priorities</span>
              </span>
              <span className="text-[9px] font-mono text-slate-400 font-semibold">4 Cardinal Sectors</span>
            </div>

            <div className="space-y-1.5">
              {hazardData.sectors.map((s) => {
                const isSel = selectedSector === s.sector;
                return (
                  <button
                    key={s.sector}
                    onClick={() => setSelectedSector(isSel ? null : s.sector)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all border text-xs flex items-center justify-between ${
                      isSel
                        ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200'
                        : 'bg-slate-50/70 hover:bg-slate-100 text-slate-700 border-slate-200/70'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-bold text-xs">{s.sector} SECTOR</strong>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border ${getPriorityBadge(s.priority)}`}>
                          {s.priority}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Area: {(s.area_sqkm ?? 0).toFixed(2)} km² ({(s.area_pct ?? 0).toFixed(0)}%) &bull; Hazard: {(s.sector_hazard_score ?? 0).toFixed(3)}
                      </p>
                    </div>
                    <span className="text-indigo-600 font-bold text-xs ml-2">
                      {isSel ? '✓' : '→'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 4: Recommended Relocation Centers (4-Tier Proximity Hierarchy + Closer Rejection Audit) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Candidate Host Relocation Centers</span>
              </span>
              <span className="text-[9px] font-mono text-slate-400 font-semibold">Decision Support</span>
            </div>

            <div className="text-[10px] text-slate-500 bg-emerald-50/60 border border-emerald-200/60 p-2 rounded-xl leading-tight">
              <strong>Hierarchy:</strong> Safety First &gt; Capacity &gt; Accessibility &gt; Soft Proximity Preference. No arbitrary distance cutoffs.
            </div>

            {loadingReloc ? (
              <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
                Evaluating candidate host zones against multi-hazard thresholds...
              </div>
            ) : relocData ? (
              <div className="space-y-3">
                {/* Fallback Notice when no verified suitable candidate exists in immediate proximity */}
                {!relocData.nearby_candidate_found && (
                  <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>Proximity Search Result</span>
                    </div>
                    <p className="text-[11px] text-amber-900 font-bold leading-tight">
                      No verified suitable nearby candidate was found in the current dataset.
                    </p>
                    <p className="text-[9.5px] text-amber-800/90 leading-tight">
                      Displaying nearest qualified fallback candidates meeting verified safety (≥50% safe land), capacity, and accessibility criteria.
                    </p>
                  </div>
                )}

                {/* Grouped by 4-Tier Geographic Search Hierarchy */}
                {(['NEARBY / SAME MANDAL', 'ADJACENT MANDAL', 'SAME DISTRICT', 'REGIONAL FALLBACK'] as const).map((tierName) => {
                  const candidates = groupedCandidates[tierName];
                  if (!candidates || candidates.length === 0) return null;

                  const tierColor =
                    tierName === 'NEARBY / SAME MANDAL'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : tierName === 'ADJACENT MANDAL'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : tierName === 'SAME DISTRICT'
                      ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      : 'bg-slate-100 text-slate-800 border-slate-200';

                  return (
                    <div key={tierName} className="space-y-2 pt-1">
                      {/* Tier Category Header */}
                      <div className="flex items-center justify-between px-1">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${tierColor}`}>
                          {tierName}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">
                          {candidates.length} {candidates.length === 1 ? 'host' : 'hosts'}
                        </span>
                      </div>

                      {/* Candidate Cards */}
                      {candidates.map((center, idx) => (
                        <div
                          key={center.center_name + idx}
                          className={`p-3 rounded-xl border transition flex flex-col space-y-2 ${
                            (center.rank ?? idx + 1) === 1
                              ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200 shadow-2xs'
                              : 'bg-slate-50/80 border-slate-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-900 text-xs">
                                    #{center.rank ?? idx + 1} {center.center_name}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {center.mandal_name} Mandal &bull; {center.district_name}
                                </div>
                              </div>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                                (center.rank ?? idx + 1) === 1
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {center.suitability_tier}
                              </span>
                            </div>

                            {/* 4 Core Attributes (Distance, Safety, Capacity, Accessibility) */}
                            <div className="grid grid-cols-4 gap-1 text-center mt-2 text-[9px]">
                              <div className="bg-white p-1 rounded-lg border border-slate-200/80">
                                <span className="text-slate-400 block text-[8px] uppercase font-bold">Distance</span>
                                <strong className="font-mono text-slate-900 font-black">~{center.distance_km} km</strong>
                              </div>
                              <div className="bg-white p-1 rounded-lg border border-slate-200/80">
                                <span className="text-slate-400 block text-[8px] uppercase font-bold">Safety</span>
                                <strong className="text-emerald-700 font-bold">{center.safety_status}</strong>
                              </div>
                              <div className="bg-white p-1 rounded-lg border border-slate-200/80">
                                <span className="text-slate-400 block text-[8px] uppercase font-bold">Capacity</span>
                                <strong className="text-blue-700 font-bold truncate block">{center.capacity_condition}</strong>
                              </div>
                              <div className="bg-white p-1 rounded-lg border border-slate-200/80">
                                <span className="text-slate-400 block text-[8px] uppercase font-bold">Score</span>
                                <strong className="font-mono text-indigo-700 font-black">{(center.suitability_score ?? 0).toFixed(3)}</strong>
                              </div>
                            </div>

                            <div className="text-[10px] text-slate-600 mt-2 leading-relaxed font-medium">
                              {center.why_recommended}
                            </div>
                          </div>

                          {/* Data-Backed Closer Candidates Rejection Audit Log */}
                          {center.rejected_closer_candidates && center.rejected_closer_candidates.length > 0 && (
                            <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                              <div className="flex items-center justify-between text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                                <span className="flex items-center gap-1">
                                  <XCircle className="w-3 h-3 text-rose-500" />
                                  <span>Closer Candidate Inspection Log</span>
                                </span>
                                <span className="text-slate-400 font-normal">
                                  {center.rejected_closer_candidates.length} closer rejected
                                </span>
                              </div>

                              <div className="space-y-1">
                                {center.rejected_closer_candidates.map((rej, rIdx) => (
                                  <div key={rIdx} className="bg-white p-2 rounded-lg border border-rose-100 text-[9.5px] space-y-0.5">
                                    <div className="flex items-center justify-between font-bold text-slate-800">
                                      <span>{rej.mandal_name} ({rej.district_name})</span>
                                      <span className="font-mono text-rose-600 font-extrabold">~{rej.distance_km} km</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[8.5px] text-slate-500">
                                      <span>
                                        Safe Land: <strong className="text-slate-700">{((rej.safe_area_fraction ?? 0) * 100).toFixed(1)}%</strong> (Req: &ge;50%)
                                      </span>
                                      <span className="px-1 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 rounded font-black text-[8px]">
                                        REJECTED
                                      </span>
                                    </div>
                                    <div className="text-[8.5px] text-rose-600/95 font-medium leading-tight">
                                      {rej.rejection_reason}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400 italic">
                No candidate host zone available.
              </div>
            )}
          </div>

          {/* Card 5: Action Plan Trigger */}
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                DDMA Evacuation Operations
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Integrate cadastral sector risk and candidate host zones into the official district evacuation action plan.
            </p>
            <button
              onClick={() => onNavigateToActionPlan?.()}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-2xs flex items-center justify-center gap-1.5"
            >
              <span>LAUNCH ACTION PLAN →</span>
            </button>
          </div>

        </aside>

      </div>

    </div>
  );
};

export default VillageAnalysisPage;
