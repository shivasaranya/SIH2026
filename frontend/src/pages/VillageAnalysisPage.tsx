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
  Activity,
  Layers,
  Map as MapIcon,
  CheckCircle2,
  MapPin,
  XCircle,
  FileText,
  RefreshCw,
  Info,
} from 'lucide-react';
import type {
  VillageHazardResponse,
  VillageGeometryResponse,
  VillageScenarioResponse,
  VillageRelocationResponse,
  VillageRelocationCandidate,
  SectorHazardDetail,
} from '../types/village';
import {
  fetchVillageHazards,
  fetchVillageGeometry,
  fetchVillageScenario,
  fetchVillageRelocationCenters,
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

// -------------------------------------------------------------
// SPATIAL GEOMETRY & CURSOR DIRECTION UTILITIES
// -------------------------------------------------------------
function isPointInPolygonCoords(pt: [number, number], ring: number[][]): boolean {
  const [x, y] = pt; // [lon, lat]
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function isPointInGeoJson(lat: number, lon: number, geojson: any): boolean {
  if (!geojson) return false;
  const features = geojson.type === 'FeatureCollection' ? geojson.features : (Array.isArray(geojson) ? geojson : [geojson]);
  for (const f of features) {
    const geom = f.geometry || f;
    if (geom.type === 'Polygon' && geom.coordinates && geom.coordinates.length > 0) {
      if (isPointInPolygonCoords([lon, lat], geom.coordinates[0])) return true;
    } else if (geom.type === 'MultiPolygon' && geom.coordinates) {
      for (const poly of geom.coordinates) {
        if (poly && poly.length > 0 && isPointInPolygonCoords([lon, lat], poly[0])) return true;
      }
    }
  }
  return false;
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getSectorAndDirection(lat1: number, lon1: number, lat2: number, lon2: number): {
  sector: 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';
  directionLabel: string;
} {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

  if (bearing >= 315 || bearing < 45) {
    let directionLabel = 'NORTH ↑';
    if (bearing >= 337.5 || bearing < 22.5) directionLabel = 'NORTH ↑';
    else if (bearing >= 22.5 && bearing < 45) directionLabel = 'NORTH-EAST ↗';
    else directionLabel = 'NORTH-WEST ↖';
    return { sector: 'NORTH', directionLabel };
  } else if (bearing >= 45 && bearing < 135) {
    let directionLabel = 'EAST →';
    if (bearing >= 67.5 && bearing < 112.5) directionLabel = 'EAST →';
    else if (bearing < 67.5) directionLabel = 'NORTH-EAST ↗';
    else directionLabel = 'SOUTH-EAST ↘';
    return { sector: 'EAST', directionLabel };
  } else if (bearing >= 135 && bearing < 225) {
    let directionLabel = 'SOUTH ↓';
    if (bearing >= 157.5 && bearing < 202.5) directionLabel = 'SOUTH ↓';
    else if (bearing < 157.5) directionLabel = 'SOUTH-EAST ↘';
    else directionLabel = 'SOUTH-WEST ↙';
    return { sector: 'SOUTH', directionLabel };
  } else {
    let directionLabel = 'WEST ←';
    if (bearing >= 247.5 && bearing < 292.5) directionLabel = 'WEST ←';
    else if (bearing < 247.5) directionLabel = 'SOUTH-WEST ↙';
    else directionLabel = 'NORTH-WEST ↖';
    return { sector: 'WEST', directionLabel };
  }
}

// Priority Styling Helpers
export const getPriorityBadge = (priority?: string | null) => {
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

export const getPriorityColor = (priority?: string | null) => {
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

export const VillageAnalysisPage: React.FC<VillageAnalysisPageProps> = ({
  villageCode,
  onBackToRiskMap,
  onNavigateToActionPlan,
  onSelectVillage,
  onNavigateToReport,
}) => {
  const [activeDisaster, setActiveDisaster] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [hazardData, setHazardData] = useState<VillageHazardResponse | null>(null);
  const [geomData, setGeomData] = useState<VillageGeometryResponse | null>(null);
  const [selectedSector] = useState<string | null>(null);

  // Basemap switch: Satellite (default) vs Standard Map
  const [basemapMode, setBasemapMode] = useState<'satellite' | 'standard'>('satellite');
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [sectorAnalysis, setSectorAnalysis] = useState<boolean>(false);

  // Map DOM & Leaflet Refs (Controlled via callback ref state to guarantee container is mounted)
  const [mapContainerNode, setMapContainerNode] = useState<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayersRef = useRef<{
    satellite: L.TileLayer;
    standard: L.TileLayer;
  } | null>(null);
  const layersGroupRef = useRef<L.FeatureGroup | null>(null);
  const interactiveGroupRef = useRef<L.FeatureGroup | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const villageBoundsRef = useRef<L.LatLngBounds | null>(null);

  // What-If Simulation
  const [scenarioIncrease] = useState<number>(0);
  const [scenarioData, setScenarioData] = useState<VillageScenarioResponse | null>(null);

  // Relocation Centers & Planning Intensity
  const [planningIntensity] = useState<'low' | 'high' | 'very_high'>('high');
  const [relocData, setRelocData] = useState<VillageRelocationResponse | null>(null);
  const [, setLoadingReloc] = useState<boolean>(false);
  const [retryCount] = useState<number>(0);

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

    fetchVillageHazards(villageCode, activeDisaster)
      .then((haz) => {
        if (isMounted) {
          setHazardData(haz);
        }
      })
      .catch(() => {});

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



  // -------------------------------------------------------------
  // LEAFLET MAP INITIALIZATION (Triggers strictly AFTER container is mounted in DOM)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerNode || mapInstanceRef.current) return;

    // Initialize Leaflet Map instance with fine continuous zoom & responsive dragging
    const map = L.map(mapContainerNode, {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 60,
      minZoom: 6,
      maxZoom: 19,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      keyboard: true,
      inertia: true,
      inertiaDeceleration: 3000,
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

    // 1. High-Quality ESRI World Imagery Satellite Layer
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles © Esri',
        maxZoom: 19,
      }
    );

    // 2. Standard OpenStreetMap Layer fallback
    const standardLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }
    );

    tileLayersRef.current = {
      satellite: satelliteLayer,
      standard: standardLayer,
    };

    // Default to active basemapMode (satellite default)
    if (basemapMode === 'satellite') {
      satelliteLayer.addTo(map);
    } else {
      standardLayer.addTo(map);
    }

    // FeatureGroup for Cadastral Boundary
    const featureGroup = L.featureGroup().addTo(map);
    layersGroupRef.current = featureGroup;

    // FeatureGroup for Interactive Sectors & Cursor Direction Arrow
    const interactiveGroup = L.featureGroup().addTo(map);
    interactiveGroupRef.current = interactiveGroup;

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
      interactiveGroupRef.current = null;
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
  // RENDER SOI CADASTRAL BOUNDARY
  // Clean map: basemap + ONE selected village boundary outline
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !layersGroupRef.current || !geomData) return;
    const group = layersGroupRef.current;
    group.clearLayers();

    if (geomData.village_boundary_geojson) {
      const boundaryLayer = L.geoJSON(geomData.village_boundary_geojson, {
        pane: 'boundaryPane',
        style: {
          color: '#06b6d4', // professional cyan/blue outline
          weight: 2.5,
          opacity: 1.0,
          fill: false,
        },
      });
      boundaryLayer.addTo(group);

      try {
        const bounds = boundaryLayer.getBounds();
        if (bounds.isValid() && mapInstanceRef.current) {
          villageBoundsRef.current = bounds;
          const map = mapInstanceRef.current;
          map.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 18,
            animate: false,
          });
          map.invalidateSize();
        }
      } catch (e) {
        // bounds catch
      }
    }
  }, [geomData, mapReady]);

  // -------------------------------------------------------------
  // INTERACTIVE 4-SECTOR ANALYSIS & LIVE CURSOR DIRECTION TRACKING
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !interactiveGroupRef.current) return;
    const map = mapInstanceRef.current;
    const group = interactiveGroupRef.current;
    const tooltipEl = tooltipRef.current;

    // Reset everything first
    group.clearLayers();
    if (tooltipEl) tooltipEl.style.display = 'none';

    // If disabled, stop here — map displays ONLY basemap + village boundary outline
    if (!sectorAnalysis || !geomData) return;

    const sectorLayersMap: Record<string, L.GeoJSON> = {};

    // 1. Render 4 clipped sectors from geomData.sectors_geojson
    if (geomData.sectors_geojson?.features) {
      geomData.sectors_geojson.features.forEach((feature: any) => {
        const sName = feature?.properties?.sector as 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';
        if (!sName) return;
        const sDetail = hazardData?.sectors.find((s) => s.sector === sName);
        const pColor = getPriorityColor(sDetail?.priority || 'MODERATE');

        const sLayer = L.geoJSON(feature, {
          pane: 'sectorsFillPane',
          style: {
            fillColor: pColor,
            fillOpacity: 0.10, // subtle translucent fill so satellite imagery remains clearly visible
            color: pColor,
            weight: 1.5,
            dashArray: '5, 4',
            opacity: 0.85,
          },
        });
        sLayer.addTo(group);
        sectorLayersMap[sName] = sLayer;

        // Subtle sector label badge (non-obtrusive)
        const pos = getSectorLabelPosition(feature, geomData.centroid_lat, geomData.centroid_lon);
        const sectorIcon = L.divIcon({
          className: 'sector-subtle-badge',
          html: `
            <div style="
              display: flex;
              align-items: center;
              gap: 4px;
              background: rgba(15, 23, 42, 0.85);
              backdrop-filter: blur(4px);
              padding: 2px 7px;
              border-radius: 6px;
              border: 1px solid rgba(255, 255, 255, 0.25);
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
              transform: translate(-50%, -50%);
              pointer-events: none;
              user-select: none;
              white-space: nowrap;
            ">
              <span style="width: 5px; height: 5px; border-radius: 9999px; background: ${pColor};"></span>
              <span style="font-size: 9.5px; font-weight: 800; color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; letter-spacing: 0.03em;">
                ${sName} SECTOR
              </span>
            </div>
          `,
          iconSize: [80, 20],
          iconAnchor: [40, 10],
        });

        const labelMarker = L.marker(pos, {
          icon: sectorIcon,
          pane: 'sectorLabelsPane',
          interactive: false,
        });
        labelMarker.addTo(group);
      });
    }

    // 2. Interactive temporary centroid-to-cursor visual direction arrow
    const arrowLine = L.polyline([], {
      pane: 'sectorsLinePane',
      color: '#22d3ee',
      weight: 2.5,
      dashArray: '5, 4',
      opacity: 0.95,
      interactive: false,
    }).addTo(group);

    const centroidMarker = L.circleMarker([geomData.centroid_lat, geomData.centroid_lon], {
      pane: 'sectorLabelsPane',
      radius: 5,
      fillColor: '#06b6d4',
      fillOpacity: 0,
      color: '#ffffff',
      weight: 2,
      opacity: 0,
      interactive: false,
    }).addTo(group);

    const pointerMarker = L.circleMarker([0, 0], {
      pane: 'sectorLabelsPane',
      radius: 4,
      fillColor: '#38bdf8',
      fillOpacity: 0,
      color: '#ffffff',
      weight: 1.5,
      opacity: 0,
      interactive: false,
    }).addTo(group);

    let animFrame: number | null = null;
    let lastActiveSector: string | null = null;

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (animFrame) cancelAnimationFrame(animFrame);
      animFrame = requestAnimationFrame(() => {
        const { lat, lng } = e.latlng;
        const isInside = isPointInGeoJson(lat, lng, geomData.village_boundary_geojson);

        if (!isInside) {
          // Cursor outside village: hide tooltip, clear arrow, reset highlights
          if (tooltipEl) tooltipEl.style.display = 'none';
          arrowLine.setLatLngs([]);
          centroidMarker.setStyle({ opacity: 0, fillOpacity: 0 });
          pointerMarker.setStyle({ opacity: 0, fillOpacity: 0 });

          if (lastActiveSector && sectorLayersMap[lastActiveSector]) {
            const prevDetail = hazardData?.sectors.find((s) => s.sector === lastActiveSector);
            const prevColor = getPriorityColor(prevDetail?.priority || 'MODERATE');
            sectorLayersMap[lastActiveSector].setStyle({
              fillOpacity: 0.10,
              weight: 1.5,
              color: prevColor,
            });
            lastActiveSector = null;
          }
          return;
        }

        // Inside village boundary!
        const distKm = haversineDistanceKm(geomData.centroid_lat, geomData.centroid_lon, lat, lng);
        const { sector, directionLabel } = getSectorAndDirection(
          geomData.centroid_lat,
          geomData.centroid_lon,
          lat,
          lng
        );

        // Highlight active sector and keep other 3 subtle
        if (lastActiveSector !== sector) {
          if (lastActiveSector && sectorLayersMap[lastActiveSector]) {
            const prevDetail = hazardData?.sectors.find((s) => s.sector === lastActiveSector);
            const prevColor = getPriorityColor(prevDetail?.priority || 'MODERATE');
            sectorLayersMap[lastActiveSector].setStyle({
              fillOpacity: 0.08,
              weight: 1.2,
              color: prevColor,
            });
          }
          if (sectorLayersMap[sector]) {
            sectorLayersMap[sector].setStyle({
              fillOpacity: 0.28,
              weight: 2.75,
              color: '#ffffff',
            });
          }
          lastActiveSector = sector;
        }

        // Draw temporary direction arrow: Centroid ● ───────→ Cursor
        arrowLine.setLatLngs([
          [geomData.centroid_lat, geomData.centroid_lon],
          [lat, lng],
        ]);
        centroidMarker.setStyle({ opacity: 1, fillOpacity: 1 });
        pointerMarker.setLatLng([lat, lng]);
        pointerMarker.setStyle({ opacity: 1, fillOpacity: 1 });

        // Update floating direction tooltip
        if (tooltipEl && mapContainerNode) {
          const pt = map.latLngToContainerPoint(e.latlng);
          const sData = hazardData?.sectors.find((s) => s.sector === sector);
          const priority = sData?.priority;
          const score = sData?.sector_hazard_score != null ? sData.sector_hazard_score.toFixed(3) : null;
          const pColor = getPriorityColor(priority || 'MODERATE');

          tooltipEl.innerHTML = `
            <div style="
              background: rgba(15, 23, 42, 0.95);
              backdrop-filter: blur(8px);
              border: 1.5px solid #22d3ee;
              border-radius: 12px;
              padding: 8px 12px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
              min-width: 175px;
              color: #ffffff;
              font-family: ui-sans-serif, system-ui, sans-serif;
              pointer-events: none;
              font-size: 11px;
              line-height: 1.35;
            ">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid rgba(51, 65, 85, 0.8); padding-bottom: 4px; margin-bottom: 4px;">
                <strong style="color: #67e8f9; font-size: 11px; font-weight: 900; letter-spacing: 0.04em;">${sector} SECTOR</strong>
                ${priority ? `<span style="font-size: 8.5px; font-family: monospace; font-weight: 800; padding: 1px 5px; border-radius: 4px; background: rgba(15, 23, 42, 0.8); border: 1px solid ${pColor}; color: ${pColor};">${priority}</span>` : '<span style="font-size: 8px; color: #94a3b8;">Data unavailable</span>'}
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                <span style="color: #94a3b8; font-size: 10px;">Direction:</span>
                <span style="color: #22d3ee; font-weight: 900; font-family: monospace; font-size: 11px;">${directionLabel}</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                <span style="color: #94a3b8; font-size: 10px;">Distance:</span>
                <span style="color: #f1f5f9; font-weight: 700; font-family: monospace; font-size: 10.5px;">${distKm.toFixed(2)} km</span>
              </div>
              ${score ? `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 9.5px; color: #94a3b8; border-top: 1px dashed rgba(51,65,85,0.6); padding-top: 3px; margin-top: 3px;">
                  <span>Hazard Score:</span>
                  <span style="color: #cbd5e1; font-family: monospace; font-weight: 700;">${score}</span>
                </div>
              ` : '<div style="font-size: 9px; color: #64748b; font-style: italic; padding-top: 2px;">Sector-specific data unavailable</div>'}
            </div>
          `;

          const offsetX = pt.x + 16;
          const offsetY = pt.y - 20;
          tooltipEl.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
          tooltipEl.style.display = 'block';
        }
      });
    };

    const handleMouseOut = () => {
      if (tooltipEl) tooltipEl.style.display = 'none';
      arrowLine.setLatLngs([]);
      centroidMarker.setStyle({ opacity: 0, fillOpacity: 0 });
      pointerMarker.setStyle({ opacity: 0, fillOpacity: 0 });
      if (lastActiveSector && sectorLayersMap[lastActiveSector]) {
        const prevDetail = hazardData?.sectors.find((s) => s.sector === lastActiveSector);
        const prevColor = getPriorityColor(prevDetail?.priority || 'MODERATE');
        sectorLayersMap[lastActiveSector].setStyle({
          fillOpacity: 0.10,
          weight: 1.5,
          color: prevColor,
        });
        lastActiveSector = null;
      }
    };

    map.on('mousemove', handleMouseMove);
    map.on('mouseout', handleMouseOut);

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      map.off('mousemove', handleMouseMove);
      map.off('mouseout', handleMouseOut);
      group.clearLayers();
      if (tooltipEl) tooltipEl.style.display = 'none';
    };
  }, [sectorAnalysis, geomData, mapReady, hazardData, mapContainerNode]);



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

        {/* LEFT COLUMN: TOP CONTROLS + LARGE HERO MAP */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative order-1 gap-2 overflow-hidden">
          
          {/* TOP CONTROLS: Breadcrumb & Disaster Filter Row */}
          <div className="bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 shadow-2xs shrink-0 select-none space-y-2">
            {/* Top: Breadcrumb / village navigation */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={onBackToRiskMap}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition shadow-2xs cursor-pointer"
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

            {/* Below: Existing hazard filter row */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
              <div className="flex items-center gap-1 bg-slate-50/90 p-0.5 rounded-lg border border-slate-200/90">
                {DISASTERS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setActiveDisaster(d.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      activeDisaster === d.id
                        ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    {d.icon}
                    <span>{d.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200 text-[10px] font-mono font-bold">
                <span>SOI Cadastral (EPSG:7755)</span>
              </div>
            </div>
          </div>

          {/* Large Map Card: ONLY Standard Map / Satellite Map switch & Map Canvas */}
          <div className="village-satellite-container flex-1 relative w-full h-full min-h-0 bg-slate-950 rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
            
            {/* Map Card Header: Clean Basemap switch [ Standard Map ] [ Satellite Map ] and compact [ Sector Analysis OFF / ON ] control */}
            <div className="bg-slate-900 text-white px-3.5 py-2 flex items-center justify-between shrink-0 shadow-xs select-none z-10 flex-wrap gap-2">
              {/* Basemap Selection: Standard vs Satellite */}
              <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/80 gap-1">
                <button
                  type="button"
                  onClick={() => setBasemapMode('standard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    basemapMode === 'standard'
                      ? 'bg-indigo-600 text-white shadow-xs font-black'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Standard Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBasemapMode('satellite')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    basemapMode === 'satellite'
                      ? 'bg-indigo-600 text-white shadow-xs font-black'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Satellite Map</span>
                </button>
              </div>

              {/* Sector Analysis Controls & Compact Status Panel */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Sector Analysis Toggle Button */}
                <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/80 gap-1.5">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider px-1.5">
                    Sector Analysis
                  </span>
                  <button
                    type="button"
                    onClick={() => setSectorAnalysis((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      sectorAnalysis
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                        : 'bg-slate-700/70 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Compass className={`w-3.5 h-3.5 ${sectorAnalysis ? 'text-slate-950' : 'text-slate-300'}`} />
                    <span>{sectorAnalysis ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                {/* When ON: compact display of NORTH | EAST | SOUTH | WEST with existing priority information */}
                {sectorAnalysis && (
                  <div className="hidden sm:flex items-center bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-700/70 gap-2 text-[10px]">
                    {(['NORTH', 'EAST', 'SOUTH', 'WEST'] as const).map((sec, idx) => {
                      const sData = hazardData?.sectors.find((s) => s.sector === sec);
                      const priority = sData?.priority;
                      const pColor = getPriorityColor(priority || 'MODERATE');
                      return (
                        <div key={sec} className="flex items-center gap-1">
                          {idx > 0 && <span className="text-slate-600 mr-1 font-bold">|</span>}
                          <span className="font-bold text-slate-300">{sec}</span>
                          {priority ? (
                            <span
                              className="px-1.5 py-0.2 rounded font-mono font-extrabold text-[9px]"
                              style={{
                                backgroundColor: `${pColor}20`,
                                color: pColor,
                                border: `1px solid ${pColor}50`,
                              }}
                            >
                              {priority}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[9px] italic">Unavailable</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Leaflet Map Container: Pure map canvas with ONLY the village boundary outline */}
            <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden bg-slate-950">
              <div ref={setMapContainerNode} className="w-full h-full absolute inset-0 z-0" />
              {/* Dynamic live cursor direction tooltip */}
              <div
                ref={tooltipRef}
                className="absolute pointer-events-none z-30 transition-opacity duration-75"
                style={{ display: 'none', left: 0, top: 0 }}
              />
            </div>

          </div>

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
