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
  Search,
  FileText,
  RefreshCw,
  Info
} from 'lucide-react';
import type {
  VillageHazardResponse,
  VillageGeometryResponse,
  VillageScenarioResponse,
  VillageRelocationResponse,
  VillageRelocationCandidate,
  SectorHazardDetail,
  VillagePoiItem,
  VillagePoiResponse,
} from '../types/village';
import {
  fetchVillageHazards,
  fetchVillageGeometry,
  fetchVillageScenario,
  fetchVillageRelocationCenters,
  fetchVillagePois,
} from '../services/api';

interface VillageAnalysisPageProps {
  villageCode: number;
  onBackToRiskMap: () => void;
  onNavigateToActionPlan?: () => void;
  onSelectVillage?: (code: number) => void;
  onNavigateToReport?: (code: number) => void;
}

export const TEST_VILLAGES = [
  { code: 583572, name: 'Dareli', mandal: 'Munchingi Puttu', district: 'Alluri Sitharama Raju', area: 0.03, category: 'Small Village' },
  { code: 584410, name: 'Pedabayalu', mandal: 'Ananthagiri', district: 'Alluri Sitharama Raju', area: 272.51, category: 'Large Village' },
  { code: 581073, name: 'Gangaram', mandal: 'Kotabommali', district: 'Srikakulam', area: 2.51, category: 'Coastal Village' },
  { code: 594124, name: 'Sammathagiri', mandal: 'Holagunda', district: 'Kurnool', area: 6.90, category: 'Inland Village' },
  { code: 588383, name: 'Chinagollapalem', mandal: 'Kruthivennu', district: 'Krishna', area: 35.48, category: 'Coastal Delta' },
  // Kerala villages (Census 2011 — Taluk-level spatial data)
  { code: 320010001, name: 'Bekal', mandal: 'Hosdurg', district: 'Kasaragod', area: 0.42, category: 'Kerala Coastal' },
  { code: 320060001, name: 'Mananthavady', mandal: 'Mananthavady', district: 'Wayanad', area: 1.85, category: 'Kerala Western Ghats' },
  { code: 320590001, name: 'Thiruvananthapuram', mandal: 'Thiruvananthapuram', district: 'Thiruvananthapuram', area: 0.95, category: 'Kerala Capital' },
  { code: 320110001, name: 'Kozhikode', mandal: 'Kozhikode', district: 'Kozhikode', area: 1.12, category: 'Kerala Port City' },
  { code: 320340001, name: 'Devikulam', mandal: 'Devikulam', district: 'Idukki', area: 2.31, category: 'Kerala Highlands' },
];


const DISASTERS = [
  { id: 'all', label: 'Multi-Hazard', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'flood', label: 'Flood (30m)', icon: <Waves className="w-3.5 h-3.5" /> },
  { id: 'cyclone', label: 'Cyclone Track', icon: <Compass className="w-3.5 h-3.5" /> },
  { id: 'wind', label: 'Wind Zone', icon: <Wind className="w-3.5 h-3.5" /> },
  { id: 'slope', label: 'Terrain (≥15°)', icon: <Mountain className="w-3.5 h-3.5" /> },
];

function getSectorLabelPosition(feature: any, centroidLat: number, centroidLon: number): L.LatLng {
  const layer = L.geoJSON(feature);
  const b = layer.getBounds();
  const sName = feature?.properties?.sector;
  const bCenter = b.getCenter();

  // Position label outward into the sector geometry away from village centroid
  if (sName === 'NORTH') {
    return L.latLng(centroidLat + (b.getNorth() - centroidLat) * 0.52, centroidLon + (bCenter.lng - centroidLon) * 0.25);
  }
  if (sName === 'SOUTH') {
    return L.latLng(centroidLat - (centroidLat - b.getSouth()) * 0.52, centroidLon + (bCenter.lng - centroidLon) * 0.25);
  }
  if (sName === 'EAST') {
    return L.latLng(centroidLat + (bCenter.lat - centroidLat) * 0.25, centroidLon + (b.getEast() - centroidLon) * 0.52);
  }
  if (sName === 'WEST') {
    return L.latLng(centroidLat + (bCenter.lat - centroidLat) * 0.25, centroidLon - (centroidLon - b.getWest()) * 0.52);
  }
  return bCenter;
}

export const VillageAnalysisPage: React.FC<VillageAnalysisPageProps> = ({
  villageCode,
  onBackToRiskMap,
  onNavigateToActionPlan,
  onSelectVillage,
  onNavigateToReport,
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
  const tileLayersRef = useRef<{
    satellite: L.TileLayer;
    satelliteBoundaries: L.TileLayer;
    satelliteTransportation: L.TileLayer;
    standard: L.TileLayer;
  } | null>(null);
  const layersGroupRef = useRef<L.FeatureGroup | null>(null);
  const villageBoundsRef = useRef<L.LatLngBounds | null>(null);

  // What-If Slider (0 to 10)
  const [scenarioIncrease, setScenarioIncrease] = useState<number>(0);
  const [scenarioData, setScenarioData] = useState<VillageScenarioResponse | null>(null);

  // Relocation Centers & Planning Intensity
  const [planningIntensity, setPlanningIntensity] = useState<'low' | 'high' | 'very_high'>('high');
  const [relocData, setRelocData] = useState<VillageRelocationResponse | null>(null);
  const [loadingReloc, setLoadingReloc] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  // POI Layer State
  const [showPois, setShowPois] = useState<boolean>(true);
  const [poiResponse, setPoiResponse] = useState<VillagePoiResponse | null>(null);
  const [loadingPois, setLoadingPois] = useState<boolean>(false);
  const [poiCategoryFilter, setPoiCategoryFilter] = useState<string>('All');
  const [poiSearchQuery, setPoiSearchQuery] = useState<string>('');
  const [selectedPoi, setSelectedPoi] = useState<VillagePoiItem | null>(null);
  const poiSearchRadius = 3.0;
  const [showPoiFilterDropdown, setShowPoiFilterDropdown] = useState<boolean>(false);

  // 1. Initial Load for Village (Summary, Geometry, and Relocation Centers)
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setLoading(true);
    setLoadingReloc(true);
    setError(null);

    Promise.all([
      fetchVillageHazards(villageCode, activeDisaster, signal),
      fetchVillageGeometry(villageCode, signal),
      fetchVillageRelocationCenters(villageCode, 6, 'high', null, 'all', signal),
    ])
      .then(([haz, geo, reloc]) => {
        if (!signal.aborted) {
          setHazardData(haz);
          setGeomData(geo);
          setRelocData(reloc);
          setLoading(false);
          setLoadingReloc(false);
        }
      })
      .catch((err) => {
        if (!signal.aborted) {
          setError(err.message || 'Failed to load village spatial hazard data.');
          setLoading(false);
          setLoadingReloc(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [villageCode, retryCount]);


  // 2. Disaster Filter Update (Preserves layout and Leaflet map canvas without unmounting)
  useEffect(() => {
    if (loading || !hazardData) return;
    let isMounted = true;
    setUpdatingHazards(true);

    fetchVillageHazards(villageCode, activeDisaster)
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

  // Re-fetch Relocation Centers when planningIntensity or selectedSector changes
  useEffect(() => {
    if (loading) return;
    let isMounted = true;
    setLoadingReloc(true);
    fetchVillageRelocationCenters(
      villageCode,
      planningIntensity === 'low' ? 25 : 6,
      planningIntensity,
      selectedSector,
      activeDisaster
    )
      .then((reloc) => {
        if (isMounted) {
          setRelocData(reloc);
          setLoadingReloc(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingReloc(false);
      });
    return () => { isMounted = false; };
  }, [planningIntensity, selectedSector, activeDisaster]);

  // Fetch Real OpenStreetMap POIs
  useEffect(() => {
    if (!villageCode) return;
    const controller = new AbortController();
    setLoadingPois(true);

    fetchVillagePois(villageCode, poiSearchRadius, activeDisaster, controller.signal)
      .then((res) => {
        setPoiResponse(res);
        setLoadingPois(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadingPois(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [villageCode, poiSearchRadius, activeDisaster]);


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
      default:
        return '#94a3b8';
    }
  };

  // POI Category Visuals & Color Codes
  const getPoiCategoryBadge = (category: string) => {
    switch (category) {
      case 'Schools':
        return { icon: '🏫', color: '#6366f1', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
      case 'Hospitals':
        return { icon: '🏥', color: '#ef4444', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
      case 'Pharmacies':
        return { icon: '💊', color: '#ec4899', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' };
      case 'Police':
        return { icon: '👮', color: '#1d4ed8', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
      case 'Fire':
        return { icon: '🚒', color: '#ea580c', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
      case 'Government':
        return { icon: '🏛️', color: '#0284c7', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' };
      case 'Shelters':
        return { icon: '⛺', color: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
      case 'Banks / ATMs':
        return { icon: '🏦', color: '#0d9488', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' };
      case 'Petrol Pumps':
        return { icon: '⛽', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
      case 'Religious Places':
        return { icon: '🛕', color: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
      case 'Shops / Markets':
        return { icon: '🛒', color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
      case 'Food / Hotels':
        return { icon: '🍽️', color: '#d97706', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
      case 'Transport':
        return { icon: '🚌', color: '#64748b', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
      case 'Other':
      default:
        return { icon: '📍', color: '#64748b', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
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
    // 2. Sector fills (zIndex: 250) - very transparent overlay above basemap
    // 3. Satellite reference labels (zIndex: 300) - roads, places, villages, rivers overlay above sector fills
    // 4. Sector dividing lines (zIndex: 350) - crisp lines above fills and reference
    // 5. Village cadastral boundary (zIndex: 400) - distinct Survey of India boundary outline
    // 6. Relocation Facilities (zIndex: 500) - host facilities / shelters
    // 7. Sector label badges & Boundary badge (zIndex: 600) - high-contrast NORTH, EAST, SOUTH, WEST badges
    map.createPane('sectorsFillPane');
    const sFill = map.getPane('sectorsFillPane');
    if (sFill) sFill.style.zIndex = '250';

    map.createPane('satelliteReferencePane');
    const sRef = map.getPane('satelliteReferencePane');
    if (sRef) {
      sRef.style.zIndex = '300';
      sRef.style.pointerEvents = 'none';
    }

    map.createPane('sectorsLinePane');
    const sLine = map.getPane('sectorsLinePane');
    if (sLine) sLine.style.zIndex = '350';

    map.createPane('boundaryPane');
    const sBnd = map.getPane('boundaryPane');
    if (sBnd) sBnd.style.zIndex = '400';

    map.createPane('facilitiesPane');
    const sFac = map.getPane('facilitiesPane');
    if (sFac) sFac.style.zIndex = '500';

    map.createPane('poiPane');
    const sPoi = map.getPane('poiPane');
    if (sPoi) sPoi.style.zIndex = '550';

    map.createPane('sectorLabelsPane');
    const sLbl = map.getPane('sectorLabelsPane');
    if (sLbl) sLbl.style.zIndex = '600';

    // 1a. Real Satellite Tile Layer: Esri World Imagery (Authoritative, sub-meter aerial basemap)
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        maxNativeZoom: 18,
        opacity: 1.0,
        keepBuffer: 8,
        updateInterval: 100,
        className: 'satellite-tile',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
      }
    );

    // 1b. Esri World Boundaries and Places (Village names, places, water bodies, administrative units)
    const satelliteBoundariesLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        pane: 'satelliteReferencePane',
        maxZoom: 19,
        maxNativeZoom: 18,
        opacity: 0.95,
        attribution: 'Esri, HERE, Garmin',
      }
    );

    // 1c. Esri World Transportation (Roads, highways, road numbers, major streets)
    const satelliteTransportationLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      {
        pane: 'satelliteReferencePane',
        maxZoom: 19,
        maxNativeZoom: 18,
        opacity: 0.90,
        attribution: 'Esri, HERE, Garmin',
      }
    );

    // 2. Standard OpenStreetMap Layer (Cartographic Vector basemap fallback with roads & place names)
    const standardLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        opacity: 1.0,
        attribution: '&copy; OpenStreetMap contributors',
      }
    );

    tileLayersRef.current = {
      satellite: satelliteLayer,
      satelliteBoundaries: satelliteBoundariesLayer,
      satelliteTransportation: satelliteTransportationLayer,
      standard: standardLayer,
    };

    // Default to active basemapMode (satellite default)
    if (basemapMode === 'satellite') {
      satelliteLayer.addTo(map);
      satelliteBoundariesLayer.addTo(map);
      satelliteTransportationLayer.addTo(map);
    } else {
      standardLayer.addTo(map);
    }

    // FeatureGroup for Cadastral Boundary, Cardinal Sectors, Facilities, and Centroid
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
  // Switching basemaps does NOT remove boundary, sectors, centroid, or facilities
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !tileLayersRef.current) return;
    const { satellite, satelliteBoundaries, satelliteTransportation, standard } = tileLayersRef.current;
    const map = mapInstanceRef.current;

    if (basemapMode === 'satellite') {
      if (map.hasLayer(standard)) map.removeLayer(standard);
      if (!map.hasLayer(satellite)) map.addLayer(satellite);
      if (!map.hasLayer(satelliteBoundaries)) map.addLayer(satelliteBoundaries);
      if (!map.hasLayer(satelliteTransportation)) map.addLayer(satelliteTransportation);
    } else {
      if (map.hasLayer(satellite)) map.removeLayer(satellite);
      if (map.hasLayer(satelliteBoundaries)) map.removeLayer(satelliteBoundaries);
      if (map.hasLayer(satelliteTransportation)) map.removeLayer(satelliteTransportation);
      if (!map.hasLayer(standard)) map.addLayer(standard);
    }
  }, [basemapMode, mapReady]);

  // -------------------------------------------------------------
  // RENDER SOI CADASTRAL BOUNDARY + N/E/S/W SECTORS + CENTROID + LABELS
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !layersGroupRef.current || !geomData) return;
    const group = layersGroupRef.current;
    group.clearLayers();

    // -------------------------------------------------------------
    // 1. Cardinal Sectors FILLS (pane: 'sectorsFillPane', zIndex: 250)
    // Sits directly ABOVE basemap tiles with subtle transparent tint
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

          let computedFillOpacity = 0.0;
          if (showSectorOverlay) {
            const baseOpacity = basemapMode === 'satellite' ? sectorOpacity : 0.20;
            computedFillOpacity = isSel ? (basemapMode === 'satellite' ? 0.14 : 0.35) : (selectedSector ? 0.02 : baseOpacity);
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
      // 2. Sector DIVIDING LINES (pane: 'sectorsLinePane', zIndex: 350)
      // Sits directly ABOVE sector fills & reference labels
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
            opacity: 0.95,
            dashArray: isSel ? undefined : '6, 4',
          };
        },
      });
      sectorsLineLayer.addTo(group);

      // -------------------------------------------------------------
      // 3. Clear Sector Quadrant Label Badges (pane: 'sectorLabelsPane', zIndex: 600)
      // Positioned well inside the actual sector geometry, offset from centroid
      // -------------------------------------------------------------
      geomData.sectors_geojson.features.forEach((feature: any) => {
        const sName = feature.properties?.sector;
        if (!sName) return;
        const sDetail = hazardData?.sectors.find((s) => s.sector === sName);
        const priority = sDetail?.priority || 'MODERATE';
        const pColor = getPriorityColor(priority);
        const isSel = selectedSector === sName;
        const pos = getSectorLabelPosition(feature, geomData.centroid_lat, geomData.centroid_lon);

        const sectorIcon = L.divIcon({
          className: 'sector-label-marker',
          html: `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              background: rgba(15, 23, 42, 0.92);
              backdrop-filter: blur(4px);
              padding: 3px 8px;
              border-radius: 8px;
              border: 1.5px solid ${isSel ? '#ffffff' : pColor};
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
              cursor: pointer;
              pointer-events: auto;
              user-select: none;
              transform: translate(-50%, -50%);
              transition: all 0.2s ease;
              min-width: 72px;
              ${isSel ? 'box-shadow: 0 0 12px ' + pColor + ', 0 4px 10px rgba(0,0,0,0.5);' : ''}
            ">
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 10px; font-weight: 900; color: #ffffff; letter-spacing: 0.05em; font-family: ui-sans-serif, system-ui, sans-serif;">
                  ${sName}
                </span>
                <span style="width: 6px; height: 6px; border-radius: 9999px; background: ${pColor};"></span>
              </div>
              <div style="font-size: 8px; font-weight: 800; color: ${pColor}; font-family: monospace; letter-spacing: 0.02em; white-space: nowrap;">
                ${priority}
              </div>
            </div>
          `,
          iconSize: [80, 32],
          iconAnchor: [40, 16],
        });

        const labelMarker = L.marker(pos, {
          icon: sectorIcon,
          pane: 'sectorLabelsPane',
          zIndexOffset: isSel ? 1200 : 800,
        });

        labelMarker.on('click', () => {
          setSelectedSector((prev) => (prev === sName ? null : sName));
        });

        labelMarker.bindTooltip(
          `<div class="font-sans text-xs">
            <strong class="text-slate-900">${sName} Sector</strong><br/>
            <span class="text-slate-600">Priority: <strong>${priority}</strong></span><br/>
            <span class="text-slate-600">Hazard Score: <strong>${(sDetail?.sector_hazard_score ?? 0).toFixed(3)}</strong></span><br/>
            <span class="text-slate-500 text-[10px]">Area: ${(feature.properties?.area_sqkm ?? 0).toFixed(2)} km²</span>
          </div>`,
          { sticky: true, className: 'leaflet-custom-tooltip' }
        );

        labelMarker.addTo(group);
      });
    }

    // -------------------------------------------------------------
    // 4. Village CADASTRAL BOUNDARY (pane: 'boundaryPane', zIndex: 400)
    // Sits ABOVE sector dividing lines and fills
    // Survey of India EPSG:7755 projected to WGS84 GeoJSON
    // -------------------------------------------------------------
    if (geomData.village_boundary_geojson) {
      // 4a. Dark casing layer underneath for high contrast against light sand/buildings/roads
      const casingLayer = L.geoJSON(geomData.village_boundary_geojson, {
        pane: 'boundaryPane',
        style: {
          color: '#020617',
          weight: 6.0,
          opacity: 0.95,
          fill: false,
        },
      });
      casingLayer.addTo(group);

      // 4b. Crisp outer glowing cyan dashed boundary
      const boundaryLayer = L.geoJSON(geomData.village_boundary_geojson, {
        pane: 'boundaryPane',
        style: {
          color: '#22d3ee', // Distinct glowing cyan line
          weight: 2.75,
          opacity: 1.0,
          fill: false,
          dashArray: '8, 4',
        },
      });
      boundaryLayer.addTo(group);

      // 4c. Boundary Label on top northern edge
      try {
        const bBounds = boundaryLayer.getBounds();
        if (bBounds.isValid()) {
          const northPt = L.latLng(bBounds.getNorth(), bBounds.getCenter().lng);
          const bLabelIcon = L.divIcon({
            className: 'boundary-badge-marker',
            html: `
              <div style="
                background: rgba(15, 23, 42, 0.92);
                backdrop-filter: blur(4px);
                color: #22d3ee;
                font-family: monospace;
                font-size: 8.5px;
                font-weight: 800;
                padding: 2px 7px;
                border-radius: 5px;
                border: 1px solid rgba(34, 211, 238, 0.6);
                white-space: nowrap;
                box-shadow: 0 2px 6px rgba(0,0,0,0.5);
                transform: translate(-50%, -100%);
                pointer-events: none;
              ">
                SOI CADASTRAL VILLAGE BOUNDARY &bull; EPSG:7755
              </div>
            `,
            iconSize: [210, 18],
            iconAnchor: [105, 0],
          });
          const bMarker = L.marker(northPt, {
            icon: bLabelIcon,
            pane: 'sectorLabelsPane',
            zIndexOffset: 750,
          });
          bMarker.addTo(group);
        }
      } catch (e) {
        // boundary label catch
      }
    }

    // -------------------------------------------------------------
    // 5. Relocation Facilities on Map (pane: 'facilitiesPane', zIndex: 500)
    // -------------------------------------------------------------
    if (relocData?.recommended_centers) {
      relocData.recommended_centers.forEach((center) => {
        if (center.latitude && center.longitude) {
          const facIcon = L.divIcon({
            className: 'facility-marker',
            html: `
              <div style="
                display: flex;
                align-items: center;
                gap: 4px;
                background: rgba(15, 23, 42, 0.92);
                border: 1.5px solid #10b981;
                border-radius: 6px;
                padding: 2px 6px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.5);
                transform: translate(-50%, -50%);
                cursor: pointer;
              ">
                <span style="width: 6px; height: 6px; border-radius: 9999px; background: #10b981;"></span>
                <span style="font-size: 8.5px; font-weight: 800; color: #ffffff; white-space: nowrap; max-width: 100px; overflow: hidden; text-overflow: ellipsis;">
                  ${center.center_name}
                </span>
              </div>
            `,
            iconSize: [110, 20],
            iconAnchor: [55, 10],
          });
          const facMarker = L.marker([center.latitude, center.longitude], {
            icon: facIcon,
            pane: 'facilitiesPane',
            zIndexOffset: 500,
          });
          facMarker.bindTooltip(
            `<div class="font-sans text-xs">
              <strong class="text-slate-900">${center.center_name}</strong><br/>
              <span class="text-slate-600">Type: <strong>${center.facility_type || 'Relocation Center'}</strong></span><br/>
              <span class="text-slate-600">Distance: <strong>${center.distance_km.toFixed(2)} km</strong></span><br/>
              <span class="text-emerald-600 text-[10px] font-bold">Safety: ${center.safety_status}</span>
            </div>`,
            { sticky: true, className: 'leaflet-custom-tooltip' }
          );
          facMarker.addTo(group);
        }
      });
    }

    // -------------------------------------------------------------
    // 6. Village Centroid (Crosshair + Pulsing Marker + Coordinates)
    // -------------------------------------------------------------
    if (geomData.centroid_lat && geomData.centroid_lon) {
      const centroidIcon = L.divIcon({
        className: 'centroid-marker-container',
        html: `
          <div style="display: flex; align-items: center; gap: 6px; transform: translate(-10px, -10px); pointer-events: auto;">
            <span style="position: relative; display: flex; width: 18px; height: 18px;">
              <span style="position: absolute; display: inline-flex; width: 100%; height: 100%; border-radius: 9999px; background-color: #f43f5e; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              <span style="position: relative; display: inline-flex; border-radius: 9999px; width: 18px; height: 18px; background-color: #dc2626; border: 2.5px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.4);"></span>
            </span>
            <span style="background-color: rgba(15, 23, 42, 0.95); color: white; font-size: 9.5px; font-weight: 800; font-family: monospace; padding: 2px 7px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.3); white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.4);">
              Centroid
            </span>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const centroidMarker = L.marker([geomData.centroid_lat, geomData.centroid_lon], {
        icon: centroidIcon,
        pane: 'sectorLabelsPane',
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

    // -------------------------------------------------------------
    // 7. REAL POINTS OF INTEREST (pane: 'poiPane', zIndex: 550)
    // Sourced from OpenStreetMap GeoPackages
    // Filterable by Category & Search, with disaster emphasis
    // -------------------------------------------------------------
    if (showPois && poiResponse?.pois) {
      const q = poiSearchQuery.trim().toLowerCase();
      const filteredPois = poiResponse.pois.filter((poi) => {
        // Category filter
        if (poiCategoryFilter !== 'All' && poi.filter_category !== poiCategoryFilter) {
          return false;
        }
        // Search text query
        if (q) {
          const matchName = poi.name.toLowerCase().includes(q);
          const matchCat = poi.filter_category.toLowerCase().includes(q);
          const matchSub = poi.subcategory.toLowerCase().includes(q);
          const matchAddr = poi.address ? poi.address.toLowerCase().includes(q) : false;
          if (!matchName && !matchCat && !matchSub && !matchAddr) {
            return false;
          }
        }
        return true;
      });

      filteredPois.forEach((poi) => {
        const catBadge = getPoiCategoryBadge(poi.filter_category);
        const isInside = poi.is_inside;
        const isSelected = selectedPoi?.osm_id === poi.osm_id;

        // Disaster-relevance emphasis
        let isDisasterRelevant = false;
        if (activeDisaster === 'flood') {
          isDisasterRelevant = ['Hospitals', 'Pharmacies', 'Schools', 'Police', 'Fire', 'Government', 'Shelters', 'Petrol Pumps', 'Transport'].includes(poi.filter_category);
        } else if (activeDisaster === 'cyclone') {
          isDisasterRelevant = ['Shelters', 'Schools', 'Hospitals', 'Police', 'Fire', 'Government', 'Pharmacies', 'Petrol Pumps'].includes(poi.filter_category);
        } else if (activeDisaster === 'wind') {
          isDisasterRelevant = ['Shelters', 'Hospitals', 'Schools', 'Police', 'Government'].includes(poi.filter_category);
        }

        const markerBorder = isInside ? '#22d3ee' : '#94a3b8';
        const markerBg = isInside ? 'rgba(15, 23, 42, 0.95)' : 'rgba(30, 41, 59, 0.90)';
        const pulseEffect = isDisasterRelevant ? 'box-shadow: 0 0 10px ' + catBadge.color + ', 0 2px 6px rgba(0,0,0,0.5);' : '';

        const poiIcon = L.divIcon({
          className: 'poi-marker-container',
          html: `
            <div style="
              display: flex;
              align-items: center;
              gap: 4px;
              background: ${markerBg};
              border: ${isSelected ? '2.5px solid #38bdf8' : `1.5px solid ${markerBorder}`};
              border-radius: 20px;
              padding: 2px 7px 2px 5px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.45);
              cursor: pointer;
              transform: translate(-50%, -50%);
              transition: transform 0.15s ease, box-shadow 0.15s ease;
              ${pulseEffect}
              pointer-events: auto;
            ">
              <span style="font-size: 11px; line-height: 1;">${catBadge.icon}</span>
              <span style="
                font-size: 8.5px;
                font-weight: 800;
                color: ${isInside ? '#ffffff' : '#cbd5e1'};
                font-family: ui-sans-serif, system-ui, sans-serif;
                white-space: nowrap;
                max-width: 105px;
                overflow: hidden;
                text-overflow: ellipsis;
              ">
                ${poi.name}
              </span>
              ${isInside ? `<span style="font-size: 7px; font-weight: 900; color: #22d3ee; background: rgba(34,211,238,0.15); padding: 1px 3px; border-radius: 3px; font-family: monospace;">IN</span>` : ''}
            </div>
          `,
          iconSize: [120, 22],
          iconAnchor: [60, 11],
        });

        const poiMarker = L.marker([poi.latitude, poi.longitude], {
          icon: poiIcon,
          pane: 'poiPane',
          zIndexOffset: isInside ? 650 : 550,
        });

        poiMarker.on('click', () => {
          setSelectedPoi(poi);
        });

        // Informative Hover Tooltip
        const locString = isInside
          ? `<span class="text-cyan-600 font-extrabold">Inside Village (${poi.sector || 'Centroid'} Sector &bull; Priority: ${poi.sector_priority || 'N/A'})</span>`
          : `<span class="text-amber-600 font-extrabold">Nearby &bull; ${poi.distance_km.toFixed(2)} km ${poi.direction || ''}</span>`;

        poiMarker.bindTooltip(
          `<div class="font-sans text-xs p-0.5 space-y-1 max-w-[200px]">
            <div class="font-black text-slate-900 leading-tight">${poi.name}</div>
            <div class="text-[11px] text-slate-600 font-semibold">${catBadge.icon} ${poi.subcategory}</div>
            <div class="text-[10px]">${locString}</div>
            <div class="text-[9.5px] text-slate-400 font-mono">OSM ID: ${poi.osm_id}</div>
          </div>`,
          { sticky: true, className: 'leaflet-custom-tooltip' }
        );

        poiMarker.addTo(group);
      });
    }

    // Fit view to complete village boundary initially (works dynamically for ALL village sizes)
    try {
      const bounds = group.getBounds();
      if (bounds.isValid() && mapInstanceRef.current) {
        villageBoundsRef.current = bounds;
        const map = mapInstanceRef.current;
        map.fitBounds(bounds, {
          padding: [35, 35],
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
  }, [
    geomData,
    hazardData,
    relocData,
    selectedSector,
    activeDisaster,
    mapReady,
    sectorOpacity,
    showSectorOverlay,
    basemapMode,
    showPois,
    poiResponse,
    poiCategoryFilter,
    poiSearchQuery,
    selectedPoi,
  ]);

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
      'WITHIN VILLAGE': [],
      'WITHIN MANDAL': [],
      'ADJACENT MANDAL': [],
      'SAME DISTRICT': [],
      'REGIONAL FALLBACK': [],
    };

    relocData.recommended_centers.forEach((c) => {
      let cat: string = c.proximity_category || 'REGIONAL FALLBACK';
      if (cat === 'SAME MANDAL' || cat === 'NEARBY / SAME MANDAL') {
        cat = 'WITHIN MANDAL';
      }
      if (c.location_tier === 'IN_VILLAGE') {
        cat = 'WITHIN VILLAGE';
      }
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
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
            <button
              onClick={onBackToRiskMap}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Map</span>
            </button>
          </div>
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

                {/* Reset View & Multi-Scale Zoom controls */}
                <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  <button
                    onClick={handleResetView}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-slate-200 hover:text-white hover:bg-slate-700 transition"
                    title="Fit view to complete Survey of India cadastral boundary"
                  >
                    <Maximize2 className="w-3 h-3 text-cyan-400" />
                    <span>FIT BOUNDARY</span>
                  </button>
                  <button
                    onClick={() => handleZoomToLevel(14.5)}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-200 hover:text-white hover:bg-slate-700 transition"
                    title="Zoom to see surrounding villages, mandals, and major roads"
                  >
                    <span>VILLAGE</span>
                  </button>
                  <button
                    onClick={() => handleZoomToLevel(16.0)}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-200 hover:text-white hover:bg-slate-700 transition"
                    title="Zoom to village settlement cluster & streets"
                  >
                    <span>SETTLEMENT</span>
                  </button>
                  <button
                    onClick={() => handleZoomToLevel(18.0)}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-200 hover:text-white hover:bg-slate-700 transition"
                    title="High-resolution aerial view: houses, buildings, streets, and fields"
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

                {/* POI LAYER TOGGLE */}
                <button
                  onClick={() => setShowPois(!showPois)}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[10.5px] font-black transition border ${
                    showPois
                      ? 'bg-cyan-950/90 text-cyan-200 border-cyan-500/60 hover:bg-cyan-900 ring-1 ring-cyan-400/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                  title="Toggle Real OpenStreetMap POIs layer on/off"
                >
                  <span>{showPois ? '📍 POIs: ON' : '📍 POIs: OFF'}</span>
                  {loadingPois ? (
                    <span className="text-[9px] text-cyan-300 font-mono animate-pulse">...</span>
                  ) : poiResponse ? (
                    <span className="text-[9px] bg-cyan-400/20 text-cyan-300 px-1 rounded font-mono">
                      {poiResponse.total_pois}
                    </span>
                  ) : null}
                </button>

                {/* POI CATEGORY FILTER DROPDOWN */}
                {showPois && (
                  <div className="relative">
                    <button
                      onClick={() => setShowPoiFilterDropdown(!showPoiFilterDropdown)}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
                      title="Filter POIs by Category"
                    >
                      <Sliders className="w-3 h-3 text-cyan-400" />
                      <span>{poiCategoryFilter === 'All' ? 'Categories (All)' : poiCategoryFilter}</span>
                    </button>

                    {showPoiFilterDropdown && (
                      <div className="absolute top-full right-0 mt-1 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1 select-none">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-800 flex justify-between items-center">
                          <span>Filter POIs</span>
                          <button
                            onClick={() => {
                              setPoiCategoryFilter('All');
                              setPoiSearchQuery('');
                              setShowPoiFilterDropdown(false);
                            }}
                            className="text-[9px] text-cyan-400 hover:underline cursor-pointer"
                          >
                            Reset
                          </button>
                        </div>
                        <div className="max-h-56 overflow-y-auto space-y-0.5 py-1">
                          {[
                            'All',
                            'Schools',
                            'Hospitals',
                            'Pharmacies',
                            'Police',
                            'Fire',
                            'Government',
                            'Shelters',
                            'Banks / ATMs',
                            'Petrol Pumps',
                            'Religious Places',
                            'Shops / Markets',
                            'Food / Hotels',
                            'Transport',
                            'Other',
                          ].map((cat) => {
                            const isSelected = poiCategoryFilter === cat;
                            const count =
                              cat === 'All'
                                ? poiResponse?.total_pois ?? 0
                                : poiResponse?.categories_summary.find((c) => c.category === cat)?.count ?? 0;
                            return (
                              <button
                                key={cat}
                                onClick={() => {
                                  setPoiCategoryFilter(cat);
                                  setShowPoiFilterDropdown(false);
                                }}
                                className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-left text-[11px] font-medium transition ${
                                  isSelected
                                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                <span>{cat}</span>
                                <span className="font-mono text-[9.5px] text-slate-400">({count})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* POI SEARCH BOX */}
                {showPois && (
                  <div className="flex items-center relative">
                    <input
                      type="text"
                      placeholder="Search places (e.g. hospital, school)..."
                      value={poiSearchQuery}
                      onChange={(e) => setPoiSearchQuery(e.target.value)}
                      className="bg-slate-800/90 border border-slate-700 rounded-lg px-2 py-0.5 text-[10.5px] text-white placeholder-slate-400 w-36 xl:w-48 focus:outline-hidden focus:border-cyan-400 font-sans"
                    />
                    {poiSearchQuery && (
                      <button
                        onClick={() => setPoiSearchQuery('')}
                        className="absolute right-1 text-slate-400 hover:text-white text-xs px-1"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}


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
                  <span>SECTOR PRIORITY</span>
                  <span className="text-[8px] text-slate-400 font-mono">
                    {showSectorOverlay ? `${Math.round(sectorOpacity * 100)}% Opacity` : 'Hidden'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 ring-1 ring-white/50" />
                  <span className="font-semibold text-slate-200">Very High</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 ring-1 ring-white/50" />
                  <span className="font-semibold text-slate-200">High</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 ring-1 ring-white/50" />
                  <span className="font-semibold text-slate-200">Moderate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 ring-1 ring-white/50" />
                  <span className="font-semibold text-slate-200">Low</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border border-dashed border-slate-400 bg-slate-800 shrink-0" />
                  <span className="font-semibold text-slate-400">Insufficient Data</span>
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

                <div className="pt-1 mt-1 border-t border-slate-700/60 text-[8px] text-slate-400 space-y-0.5">
                  <div className="flex items-center gap-1 text-cyan-300">
                    <span className="inline-block w-3 border-b-2 border-dashed border-cyan-400"></span>
                    <span>SOI Cadastral Boundary (EPSG:7755)</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300">
                    <span className="inline-block w-3 border-b border-sky-400"></span>
                    <span>N / E / S / W Sector Dividers</span>
                  </div>
                </div>
              </div>

              {/* Village Name & Location Context Banner (Top-Center) */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/92 backdrop-blur-md border border-slate-700/80 rounded-xl px-4 py-1.5 shadow-lg text-center z-10 select-none pointer-events-auto max-w-sm">
                <div className="text-xs font-black text-white tracking-wide flex items-center justify-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{hazardData.village_name.toUpperCase()}</span>
                </div>
                <div className="text-[10px] text-slate-300 font-medium truncate">
                  {hazardData.mandal_name} Mandal &bull; {hazardData.district_name} District
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
                    {basemapMode === 'satellite' ? 'Esri World Imagery + Labels' : 'OpenStreetMap'}
                  </span>
                </div>

                {/* Preset Zoom Levels */}
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-md flex items-center gap-1 text-[10px] font-bold">
                  <button
                    onClick={handleResetView}
                    className="px-2 py-1 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white transition flex items-center gap-1 shadow-2xs"
                    title="Reset view to fit complete village boundary"
                  >
                    <Focus className="w-3 h-3 text-cyan-300" />
                    <span>Fit Boundary</span>
                  </button>
                  <button
                    onClick={() => handleZoomToLevel(14.5)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition"
                    title="Zoom out to see surrounding villages, mandals, and major roads"
                  >
                    Village (z14.5)
                  </button>
                  <button
                    onClick={() => handleZoomToLevel(16.0)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition"
                    title="Zoom to village settlement cluster & streets"
                  >
                    Settlement (z16)
                  </button>
                  <button
                    onClick={() => handleZoomToLevel(18.0)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition"
                    title="High-resolution aerial view: houses, buildings, streets, and fields"
                  >
                    Houses &amp; Roads (z18)
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

              {/* Selected POI Detail Modal / Floating Card (Clean decision-support popup) */}
              {selectedPoi && (
                <div className="absolute top-16 right-3 bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-3.5 shadow-2xl z-30 max-w-sm w-80 text-white select-none pointer-events-auto space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl p-1.5 rounded-xl bg-slate-800 border border-slate-700">
                        {getPoiCategoryBadge(selectedPoi.filter_category).icon}
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-white leading-tight">
                          {selectedPoi.name}
                        </h4>
                        <p className="text-[10px] text-slate-300 font-medium">
                          {selectedPoi.category} &bull; {selectedPoi.subcategory}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPoi(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-xs font-bold"
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="border-t border-slate-800 pt-2 space-y-1.5 text-xs">
                    {/* Inside vs Nearby Distinction */}
                    <div className="flex items-center justify-between text-[11px] bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
                      <span className="text-slate-400 font-semibold">Location:</span>
                      {selectedPoi.is_inside ? (
                        <span className="font-extrabold text-cyan-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                          Inside {hazardData.village_name}
                        </span>
                      ) : (
                        <span className="font-extrabold text-amber-400">
                          Nearby &bull; {selectedPoi.distance_km.toFixed(2)} km {selectedPoi.direction || ''}
                        </span>
                      )}
                    </div>

                    {/* Sector and Priority if inside */}
                    {selectedPoi.is_inside && selectedPoi.sector && (
                      <div className="flex items-center justify-between text-[11px] bg-slate-800/60 px-2 py-1 rounded-lg">
                        <span className="text-slate-400">Sector:</span>
                        <span className="font-mono font-bold text-white">
                          {selectedPoi.sector} Sector{' '}
                          {selectedPoi.sector_priority && (
                            <span className="text-indigo-300 font-black">({selectedPoi.sector_priority})</span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Address if legitimately available */}
                    {selectedPoi.address && (
                      <div className="text-[10px] text-slate-300 bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/40">
                        <span className="text-slate-400 font-semibold block text-[9px] uppercase">Address:</span>
                        <span>{selectedPoi.address}</span>
                      </div>
                    )}

                    {/* Opening hours if available */}
                    {selectedPoi.opening_hours && (
                      <div className="text-[10px] text-slate-300 flex items-center justify-between bg-slate-800/40 px-2 py-1 rounded-lg">
                        <span className="text-slate-400">Hours:</span>
                        <span className="font-mono">{selectedPoi.opening_hours}</span>
                      </div>
                    )}

                    {/* Source & OSM ID */}
                    <div className="border-t border-slate-800/80 pt-1.5 flex items-center justify-between text-[9px] font-mono text-slate-400">
                      <span>Source: {selectedPoi.source}</span>
                      <span>OSM ID: {selectedPoi.osm_id}</span>
                    </div>

                    {/* Disaster Classification Notice */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-1.5 text-[8.5px] text-slate-400 leading-tight">
                      <span className="text-cyan-400 font-bold">Mapped Real POI</span> &bull; Not automatically an approved emergency shelter. For verified shelters see Relocation Centers.
                    </div>
                  </div>
                </div>
              )}

              {/* POI Coverage & Disclaimer Bar (Bottom-Left) */}
              {showPois && poiResponse && (
                <div className="absolute bottom-3 left-3 bg-slate-900/92 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-md z-10 text-[9.5px] text-slate-300 max-w-sm pointer-events-auto flex items-center justify-between gap-3 select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                    <span>
                      <strong>POI Data:</strong> {poiResponse.source} ({poiResponse.total_pois} found: {poiResponse.inside_count} inside, {poiResponse.nearby_count} nearby)
                    </span>
                  </div>
                  {poiResponse.total_pois === 0 && (
                    <span className="text-amber-400 font-bold">Limited POI coverage in this area</span>
                  )}
                </div>
              )}

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
                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                    {scenarioIncrease > 0 && (
                      <div className="text-right hidden md:block">
                        <div className="text-[8.5px] uppercase font-bold text-slate-400">Hazard Score</div>
                        <span className="font-mono text-xs font-black text-slate-700">
                          {scenarioData.baseline_hazard_score.toFixed(3)} &rarr;{' '}
                          <strong className="text-rose-600">{scenarioData.simulated_hazard_score.toFixed(3)}</strong>
                        </span>
                      </div>
                    )}
                    {scenarioIncrease > 0 && (
                      <div className="text-right hidden lg:block">
                        <div className="text-[8.5px] uppercase font-bold text-slate-400">At-Risk Pop</div>
                        <span className="font-mono text-xs font-black text-indigo-700">
                          {scenarioData.simulated_population_at_risk.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="text-right">
                      <div className="text-[8.5px] uppercase font-bold text-slate-400">Simulated Priority</div>
                      <span className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded-full border ${getPriorityBadge(scenarioData.simulated_relocation_priority)}`}>
                        {scenarioData.simulated_relocation_priority}
                      </span>
                    </div>
                    {scenarioData.priority_shifted && (
                      <span className="text-[9.5px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg animate-pulse shrink-0">
                        ⚠ Shifted
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
              <span className="text-[9px] font-mono text-slate-400 font-semibold">Historical/Spatial Impact Priority</span>
            </div>

            <div className="space-y-1.5">
              {(() => {
                // Sort sectors by descending hazard score to derive impact rank
                const ranked = [...hazardData.sectors].sort(
                  (a, b) => (b.sector_hazard_score ?? 0) - (a.sector_hazard_score ?? 0)
                );
                const rankLabels = ['#1 FIRST IMPACT', '#2 SECOND IMPACT', '#3 THIRD IMPACT', '#4 FOURTH IMPACT'];
                const rankBgColors = [
                  'bg-rose-600 text-white border-rose-700',
                  'bg-amber-500 text-white border-amber-600',
                  'bg-blue-500 text-white border-blue-600',
                  'bg-slate-400 text-white border-slate-500',
                ];
                return ranked.map((s, rankIdx) => {
                  const isSel = selectedSector === s.sector;
                  const simSec = scenarioIncrease > 0 ? scenarioData?.sector_simulations?.find((ss) => ss.sector === s.sector) : null;
                  return (
                    <button
                      key={s.sector}
                      onClick={() => setSelectedSector(isSel ? null : s.sector)}
                      className={`w-full p-2.5 rounded-xl text-left transition-all border text-xs ${
                        isSel
                          ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200'
                          : 'bg-slate-50/70 hover:bg-slate-100 text-slate-700 border-slate-200/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded border shrink-0 ${rankBgColors[rankIdx]}`}>
                            {rankLabels[rankIdx]}
                          </span>
                          <strong className="text-slate-900 font-bold text-xs shrink-0">{s.sector} SECTOR</strong>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded border ${getPriorityBadge(simSec ? simSec.simulated_priority : s.priority)}`}>
                            {simSec ? simSec.simulated_priority : s.priority}
                          </span>
                          {simSec?.priority_shifted && (
                            <span className="text-[8px] font-extrabold px-1 py-0.2 bg-rose-600 text-white rounded shrink-0">
                              SHIFT
                            </span>
                          )}
                        </div>
                        <span className="text-indigo-600 font-bold text-xs ml-auto shrink-0">
                          {isSel ? '✓' : '→'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 flex-wrap gap-1">
                        <span>Area: {(s.area_sqkm ?? 0).toFixed(2)} km² ({(s.area_pct ?? 0).toFixed(0)}%) &bull; Base Score: {(s.sector_hazard_score ?? 0).toFixed(3)}</span>
                        {simSec && (
                          <span className="text-[9px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            +{scenarioIncrease}%: {simSec.simulated_score.toFixed(3)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          {/* Card 4: Recommended Relocation Centers (Location / Proximity Hierarchy) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Candidate Host Relocation Centers</span>
              </span>
              <span className="text-[9px] font-mono text-slate-400 font-semibold">Decision Support</span>
            </div>

            {/* Selection Hierarchy Banner */}
            <div className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 p-2.5 rounded-xl leading-tight space-y-1">
              <div className="font-bold text-slate-800 text-[10px]">
                Selection hierarchy: Safety &rarr; Capacity &rarr; Accessibility &rarr; Soft Proximity Preference
              </div>
              <div className="text-[9px] text-slate-500">
                No arbitrary distance cutoff. Proximity is a soft preference; candidates are ranked by multi-hazard safety and capacity headroom.
              </div>
            </div>

            {/* Geographic Proximity Scope Selector */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Search Scope / Proximity</span>
              <div className="flex gap-1.5 flex-wrap">
                {([
                  { key: 'low' as const, label: 'WITHIN VILLAGE', desc: 'In-Village Potential Facilities' },
                  { key: 'high' as const, label: 'WITHIN MANDAL', desc: 'Same-Mandal Host Candidates' },
                  { key: 'very_high' as const, label: 'REGIONAL OPTIONS', desc: 'Adjacent & Regional Candidates' },
                ]).map(({ key, label, desc }) => {
                  const isActive = planningIntensity === key;
                  return (
                    <button
                      key={key}
                      id={`scope-btn-${key}`}
                      onClick={() => setPlanningIntensity(key)}
                      className={`text-[9px] font-black px-2.5 py-1.5 rounded-lg border transition-all leading-tight cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div>{label}</div>
                      <div className={`text-[8px] font-normal mt-0.5 ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>{desc}</div>
                    </button>
                  );
                })}
              </div>
              {selectedSector && (
                <p className="text-[9px] text-indigo-600 font-semibold">
                  Filtered for: {selectedSector} Sector &bull; {activeDisaster === 'all' ? 'Multi-Hazard' : activeDisaster}
                </p>
              )}
            </div>

            <div className="text-[9px] text-slate-500 bg-slate-50/70 border border-slate-100 p-2 rounded-xl leading-normal">
              Mapped facilities are potential locations identified from connected public datasets. Final structural safety, occupancy, emergency suitability and authorization require local authority verification.
            </div>

            {loadingReloc ? (
              <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
                Evaluating candidate host zones against multi-hazard thresholds...
              </div>
            ) : relocData ? (
              <div className="space-y-3">
                {/* Clean In-Village Facility Status when no verified facility exists in-village */}
                {planningIntensity === 'low' && (!relocData.recommended_centers || relocData.recommended_centers.length === 0) && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-slate-700 text-[11px] font-bold uppercase tracking-wide">
                      <Info className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      <span>IN-VILLAGE FACILITY STATUS</span>
                    </div>
                    <p className="text-[11px] text-slate-900 font-bold leading-tight">
                      No verified relocation facility mapped inside this village.
                    </p>
                    <p className="text-[9.5px] text-slate-600 leading-relaxed">
                      Potential relocation candidates are therefore searched using the approved hierarchy: same mandal &rarr; adjacent mandal &rarr; same district &rarr; regional fallback.
                    </p>
                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setPlanningIntensity('high')}
                        className="text-[9.5px] font-bold px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <span>VIEW WITHIN-MANDAL OPTIONS</span>
                        <span>&rarr;</span>
                      </button>
                      <button
                        onClick={() => setPlanningIntensity('very_high')}
                        className="text-[9.5px] font-bold px-2.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <span>VIEW ADJACENT/SAME-DISTRICT OPTIONS</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Notice when no candidate found in expanded search */}
                {planningIntensity !== 'low' && (!relocData.recommended_centers || relocData.recommended_centers.length === 0) && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700 text-[11px] font-bold">
                      <Info className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      <span>Proximity Search Result</span>
                    </div>
                    <p className="text-[11px] text-slate-900 font-bold leading-tight">
                      No verified suitable nearby candidate was found in the current dataset.
                    </p>
                    <p className="text-[9.5px] text-slate-600 leading-tight">
                      Displaying nearest qualified fallback candidates meeting verified safety (&ge;50% safe land), capacity, and accessibility criteria.
                    </p>
                  </div>
                )}

                {/* Grouped by Location / Proximity Hierarchy */}
                {(['WITHIN VILLAGE', 'WITHIN MANDAL', 'ADJACENT MANDAL', 'SAME DISTRICT', 'REGIONAL FALLBACK'] as const).map((tierName) => {
                  const candidates = groupedCandidates[tierName];
                  if (!candidates || candidates.length === 0) return null;

                  const tierColor =
                    tierName === 'WITHIN VILLAGE'
                      ? 'bg-teal-50 text-teal-800 border-teal-200'
                      : tierName === 'WITHIN MANDAL'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : tierName === 'ADJACENT MANDAL'
                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                      : tierName === 'SAME DISTRICT'
                      ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200';

                  const tierSubtext =
                    tierName === 'WITHIN VILLAGE'
                      ? 'Potential facilities located inside the selected village'
                      : tierName === 'WITHIN MANDAL'
                      ? 'Potential candidate hosts elsewhere within the same mandal'
                      : tierName === 'ADJACENT MANDAL'
                      ? 'Potential candidate hosts in nearby/adjacent mandals'
                      : tierName === 'SAME DISTRICT'
                      ? 'Potential candidate hosts elsewhere in the same district'
                      : 'Candidate hosts farther away when closer qualified options are unavailable';

                  return (
                    <div key={tierName} className="space-y-2 pt-1">
                      {/* Tier Category Header */}
                      <div className="flex items-center justify-between px-1">
                        <div>
                          <span className={`text-[9.5px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${tierColor}`}>
                            {tierName}
                          </span>
                          <span className="text-[8.5px] text-slate-500 ml-2 hidden sm:inline">
                            {tierSubtext}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 font-semibold">
                          {candidates.length} {candidates.length === 1 ? 'candidate' : 'candidates'}
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
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-slate-900 text-xs">
                                    #{center.rank ?? idx + 1} {center.center_name}
                                  </span>
                                  {center.facility_type && (
                                    <span className="text-[8.5px] font-bold px-1.5 py-0.2 bg-teal-50 text-teal-700 border border-teal-200 rounded">
                                      {center.facility_type.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {center.location_tier === 'IN_VILLAGE'
                                    ? `Inside Village Polygon • ${center.mandal_name} Mandal, ${center.district_name}`
                                    : `${center.mandal_name} Mandal • ${center.district_name}`}
                                </div>
                                {center.location_tier === 'IN_VILLAGE' && (
                                  <div className="mt-1">
                                    <span className="text-[8px] font-bold px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 rounded-sm">
                                      Potential Facility — Authority Verification Required
                                    </span>
                                  </div>
                                )}
                              </div>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                                center.suitability_tier?.includes('HIGH')
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : center.suitability_tier?.includes('MEDIUM')
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
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
                                <strong className="text-blue-700 font-bold truncate block" title={center.capacity_condition}>
                                  {center.capacity_total ? `${center.capacity_total.toLocaleString()} persons` : 'Not in source'}
                                </strong>
                              </div>
                              <div className="bg-white p-1 rounded-lg border border-slate-200/80">
                                <span className="text-slate-400 block text-[8px] uppercase font-bold">Score</span>
                                <strong className="font-mono text-indigo-700 font-black">{(center.suitability_score ?? 0).toFixed(3)}</strong>
                              </div>
                            </div>

                            {/* Detailed Footprint & Capacity Note */}
                            <div className="text-[9px] text-slate-600 mt-1.5 space-y-0.5 bg-white p-1.5 rounded-lg border border-slate-200/60 font-medium">
                              <div>
                                <span className="text-slate-400">Capacity Status:</span>{' '}
                                <strong className="text-slate-800">{center.capacity_condition}</strong>
                              </div>
                              {center.usable_area_sq_m && (
                                <div>
                                  <span className="text-slate-400">Physical Footprint:</span>{' '}
                                  <strong className="text-slate-800">{center.usable_area_sq_m.toLocaleString()} m²</strong>{' '}
                                  <span className="text-slate-400 text-[8px]">(Capacity not established from area)</span>
                                </div>
                              )}
                            </div>

                            <div className="text-[10px] text-slate-600 mt-1.5 leading-relaxed font-medium">
                              {center.why_recommended}
                            </div>

                            {center.source && (
                              <div className="text-[8.5px] text-slate-400 mt-1 font-mono">
                                Source: {center.source} ({center.source_date || '2026-09'})
                              </div>
                            )}
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
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>LAUNCH ACTION PLAN →</span>
            </button>
          </div>

          {/* Card 6: Generate Village Analysis Dedicated Report */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-4 space-y-3 shadow-md border border-indigo-500/40">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Official Village Brief
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              Generate a decision-ready brief for this village
            </p>
            <button
              id="btn-generate-village-analysis-report"
              onClick={() => {
                if (onNavigateToReport) {
                  onNavigateToReport(villageCode);
                } else {
                  window.location.hash = `#government/ap/village/${villageCode}/report`;
                }
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white text-xs font-black rounded-xl transition shadow-md flex items-center justify-center gap-2 border border-indigo-400/40 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>GENERATE VILLAGE ANALYSIS →</span>
            </button>
          </div>

        </aside>

      </div>

    </div>
  );
};

export default VillageAnalysisPage;
