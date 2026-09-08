import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowLeft,
  Printer,
  ShieldCheck,
  Compass,
  Waves,
  Wind,
  Mountain,
  AlertTriangle,
  Clock,
  Layers,
  FileText,
  ChevronDown,
  ChevronUp,
  Info,
  Users,
  Building2,
  Activity,
  MapPin,
  RefreshCw
} from 'lucide-react';
import type {
  VillageHazardResponse,
  VillageGeometryResponse,
  VillageScenarioResponse,
  VillageRelocationResponse,
  SectorHazardDetail
} from '../types/village';
import {
  fetchVillageHazards,
  fetchVillageGeometry,
  fetchVillageScenario,
  fetchVillageRelocationCenters
} from '../services/api';

interface VillageAnalysisReportPageProps {
  villageCode: number;
  onBackToVillage: () => void;
}

export const VillageAnalysisReportPage: React.FC<VillageAnalysisReportPageProps> = ({
  villageCode,
  onBackToVillage
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [hazardData, setHazardData] = useState<VillageHazardResponse | null>(null);
  const [geomData, setGeomData] = useState<VillageGeometryResponse | null>(null);
  const [scenarioData, setScenarioData] = useState<VillageScenarioResponse | null>(null);
  const [inVillageReloc, setInVillageReloc] = useState<VillageRelocationResponse | null>(null);
  const [outsideReloc, setOutsideReloc] = useState<VillageRelocationResponse | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Fetch all real village data concurrently
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchVillageHazards(villageCode, 'all'),
      fetchVillageGeometry(villageCode),
      fetchVillageScenario(villageCode, 5.0).catch(() => null),
      fetchVillageRelocationCenters(villageCode, 25, 'low', null, 'all').catch(() => null),
      fetchVillageRelocationCenters(villageCode, 5, 'very_high', null, 'all').catch(() => null),
    ]).then(([haz, geom, scen, inV, outV]) => {
      if (isMounted) {
        setHazardData(haz);
        setGeomData(geom);
        setScenarioData(scen);
        setInVillageReloc(inV);
        setOutsideReloc(outV);
        setLoading(false);
      }
    }).catch((err) => {
      if (isMounted) {
        setError(err.message || 'Failed to load village report data.');
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [villageCode, retryCount]);

  // Derived sector ranking (descending hazard score)
  const rankedSectors: SectorHazardDetail[] = useMemo(() => {
    if (!hazardData?.sectors) return [];
    return [...hazardData.sectors].sort(
      (a, b) => (b.sector_hazard_score ?? 0) - (a.sector_hazard_score ?? 0)
    );
  }, [hazardData]);

  const highestImpactSector = rankedSectors[0];

  // Initialize small real cadastral map on overview section
  useEffect(() => {
    if (!mapContainerRef.current || !geomData || loading) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [geomData.centroid_lat || 16.5, geomData.centroid_lon || 80.5],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false,
      keyboard: false,
    });
    mapInstanceRef.current = map;

    // Real satellite layer
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18 }
    ).addTo(map);

    const group = L.featureGroup().addTo(map);

    // Sectors GeoJSON
    if (geomData.sectors_geojson) {
      const sectorColors: Record<string, string> = {
        NORTH: '#f43f5e',
        EAST: '#f59e0b',
        SOUTH: '#3b82f6',
        WEST: '#10b981',
      };

      L.geoJSON(geomData.sectors_geojson, {
        style: (feature) => {
          const sec = feature?.properties?.sector;
          return {
            color: '#ffffff',
            weight: 1.5,
            opacity: 0.9,
            fillColor: sectorColors[sec] || '#6366f1',
            fillOpacity: 0.25,
            dashArray: '3, 3',
          };
        },
      }).addTo(group);
    }

    // Outer boundary GeoJSON
    if (geomData.village_boundary_geojson) {
      L.geoJSON(geomData.village_boundary_geojson, {
        style: {
          color: '#ffffff',
          weight: 2.5,
          opacity: 1.0,
          fill: false,
        },
      }).addTo(group);
    }

    // Centroid marker
    if (geomData.centroid_lat && geomData.centroid_lon) {
      const centroidIcon = L.divIcon({
        className: 'report-centroid-marker',
        html: `
          <div style="display: flex; align-items: center; gap: 4px; transform: translate(-8px, -8px);">
            <span style="display: inline-flex; border-radius: 9999px; width: 16px; height: 16px; background-color: #dc2626; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.5);"></span>
          </div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([geomData.centroid_lat, geomData.centroid_lon], { icon: centroidIcon }).addTo(group);
    }

    try {
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [15, 15] });
      }
    } catch {
      // bounds fallback
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [geomData, loading]);

  const handlePrint = () => {
    window.print();
  };

  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority) {
      case 'VERY HIGH':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 print:bg-rose-100 print:text-rose-800 print:border-rose-400';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 print:bg-amber-100 print:text-amber-800 print:border-amber-400';
      case 'MODERATE':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40 print:bg-blue-100 print:text-blue-800 print:border-blue-400';
      case 'LOW':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 print:bg-emerald-100 print:text-emerald-800 print:border-emerald-400';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40 print:bg-slate-100 print:text-slate-700 print:border-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] text-slate-400 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Generating Village Decision Brief for Census Code {villageCode}...
        </p>
      </div>
    );
  }

  if (error || !hazardData) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto my-12 bg-slate-900 border border-slate-800 rounded-3xl text-white">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold">Village Decision Brief Unavailable</h2>
        <p className="text-xs text-slate-400">
          {error || `Could not retrieve cadastral and multi-hazard datasets for village code ${villageCode}.`}
        </p>
        <div className="flex gap-2.5 justify-center pt-2">
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
          <button
            onClick={onBackToVillage}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Return to Village
          </button>
        </div>
      </div>
    );
  }

  const vName = hazardData.village_name;
  const mMandal = hazardData.mandal_name;
  const dDist = hazardData.district_name;
  const isTN = hazardData.mandal_code?.startsWith('TN_') || hazardData.district_code?.startsWith('TN_');
  const stateLabel = isTN ? 'Tamil Nadu' : 'Andhra Pradesh';
  const adminUnitLabel = isTN ? 'Taluk' : 'Mandal';
  const sdmaLabel = isTN ? 'Tamil Nadu SDMA (TNDMA)' : 'Andhra Pradesh Disaster Management Authority';
  const pop = hazardData.population_total || 0;
  const hh = hazardData.households || 0;
  const area = hazardData.village_area_sqkm || 0;
  const avgHhSize = hh > 0 ? (pop / hh).toFixed(1) : 'N/A';
  const pop06 = hazardData.population_0_6 ?? 0;
  const pop7Plus = Math.max(0, pop - pop06);
  const workers = hazardData.workers ?? 0;
  const nonWorkers = hazardData.non_workers ?? 0;

  const inVillageFacilities = inVillageReloc?.recommended_centers || [];
  const outsideCandidates = outsideReloc?.recommended_centers || [];
  const nearestCandidate = outsideCandidates[0] || inVillageFacilities[0];

  // Capacity condition evaluation
  const safeLandPct = Math.round(Math.max(0.4, 1.0 - (hazardData.overall_hazard_score || 0)) * 100);
  const isCapacityConstrained = inVillageFacilities.length === 0 || hazardData.overall_hazard_score >= 0.35;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 font-sans text-slate-100 print:bg-white print:text-slate-900 print:overflow-visible">
      
      {/* Print Document Styles */}
      <style>{`
        @media print {
          @page {
            margin: 12mm 15mm;
            size: A4 portrait;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .print-heading-keep {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
        }
      `}</style>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 print:p-0 print:max-w-full print:space-y-6">

        {/* Top Control Bar (Hidden on Print) */}
        <div className="flex items-center justify-between gap-4 print:hidden border-b border-slate-800 pb-4">
          <button
            onClick={onBackToVillage}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Village Analysis</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 font-medium">
              Official Decision Brief &bull; {sdmaLabel}
            </span>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition shadow-sm border border-indigo-500 active:scale-[0.98] cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save Brief (PDF)</span>
            </button>
          </div>
        </div>

        {/* ============================================================= */}
        {/* EXECUTIVE DECISION AREA (REPORT-LIKE HIERARCHY) */}
        {/* ============================================================= */}
        <section className="bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 print:bg-white print:border-2 print:border-slate-800 print:text-slate-900 print:rounded-none print:p-5 print-avoid-break">
          
          {/* Header & Village Identity */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800/80 print:border-slate-300 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 print:border-slate-400 print:text-slate-800">
                <FileText className="w-3.5 h-3.5 text-indigo-400 print:text-slate-800" />
                <span>OFFICIAL VILLAGE DECISION BRIEF</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white print:text-slate-950">
                {vName.toUpperCase()}
              </h1>
              <p className="text-sm font-semibold text-slate-300 mt-1 print:text-slate-700">
                {mMandal} {adminUnitLabel} &bull; {dDist} District &bull; {stateLabel}
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-1.5 font-mono text-xs text-slate-300 print:text-slate-700 shrink-0">
              <div className="bg-slate-800/90 print:bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-700 print:border-slate-300 flex items-center gap-2">
                <span className="text-slate-400">Census Village Code:</span>
                <strong className="text-white print:text-slate-900 font-bold">{villageCode}</strong>
              </div>
              <div className="text-[10px] text-slate-400 print:text-slate-500">
                Survey of India EPSG:7755 &bull; Census 2011 PCA &bull; Multi-Hazard Rasters
              </div>
            </div>
          </div>

          {/* Structured Executive Metrics (Visual Hierarchy: Priority & Score Dominate) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Priority (Dominant) */}
            <div className="p-3.5 bg-slate-950/80 print:bg-slate-50 border-2 border-indigo-500/40 print:border-slate-400 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] uppercase font-black text-indigo-300 print:text-slate-700 block">
                Relocation Priority
              </span>
              <span className={`inline-block text-xs font-black px-2 py-1 rounded border text-center my-1 ${getPriorityBadgeClass(hazardData.relocation_priority)}`}>
                {hazardData.relocation_priority}
              </span>
              <span className="text-[8.5px] text-slate-400 print:text-slate-500 block text-center">Composite Model</span>
            </div>

            {/* Hazard Score (Dominant) */}
            <div className="p-3.5 bg-slate-950/80 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Overall Hazard Score</span>
              <strong className="text-lg font-black text-indigo-400 print:text-slate-900 font-mono my-0.5">
                {(hazardData.overall_hazard_score ?? 0).toFixed(3)}
              </strong>
              <span className="text-[8.5px] text-slate-400 print:text-slate-500 block">Scale [0.000 – 1.000]</span>
            </div>

            {/* Highest Risk Sector (Dominant) */}
            <div className="p-3.5 bg-slate-950/80 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Highest Risk Sector</span>
              <strong className="text-xs font-black text-rose-400 print:text-rose-800 block truncate my-0.5">
                {highestImpactSector ? `${highestImpactSector.sector} SECTOR` : 'N/A'}
              </strong>
              <span className="text-[8.5px] text-slate-400 print:text-slate-500 font-mono block">
                Score: {highestImpactSector?.sector_hazard_score?.toFixed(3) || 'N/A'}
              </span>
            </div>

            {/* Relocation Status */}
            <div className="p-3.5 bg-slate-950/80 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Relocation Status</span>
              <strong className="text-xs font-bold text-teal-400 print:text-teal-800 block truncate my-0.5">
                {outsideCandidates.length > 0
                  ? `${outsideCandidates.length} Qualified Host${outsideCandidates.length > 1 ? 's' : ''}`
                  : (inVillageFacilities.length > 0 ? `${inVillageFacilities.length} In-Village Fac.` : 'Mandal Review')}
              </strong>
              <span className="text-[8.5px] text-slate-400 print:text-slate-500 block">
                {nearestCandidate ? `Nearest: ~${nearestCandidate.distance_km} km` : 'Local Host'}
              </span>
            </div>

            {/* Village Area */}
            <div className="p-3.5 bg-slate-950/60 print:bg-slate-50 border border-slate-800/80 print:border-slate-200 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Village Area</span>
              <strong className="text-sm font-extrabold text-white print:text-slate-900 font-mono my-0.5">
                {area.toFixed(2)} km²
              </strong>
              <span className="text-[8.5px] text-slate-400 print:text-slate-500 block">SOI Cadastral Polygon</span>
            </div>

            {/* Population */}
            <div className="p-3.5 bg-slate-950/60 print:bg-slate-50 border border-slate-800/80 print:border-slate-200 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Population</span>
              <strong className="text-sm font-extrabold text-white print:text-slate-900 font-mono my-0.5">
                {pop.toLocaleString()}
              </strong>
              <span className="text-[8.5px] text-slate-400 print:text-slate-500 block">{hh.toLocaleString()} Households</span>
            </div>
          </div>

          {/* Prominent "WHY THIS VILLAGE IS PRIORITIZED" Box */}
          <div className="p-4 sm:p-5 bg-indigo-950/50 print:bg-indigo-50 border border-indigo-700/60 print:border-indigo-300 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-800/40 print:border-indigo-200 pb-2">
              <span className="text-xs font-black tracking-wider uppercase text-indigo-300 print:text-indigo-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-400 print:text-indigo-700" />
                <span>WHY THIS VILLAGE IS PRIORITIZED</span>
              </span>
              <span className="text-[9.5px] font-mono text-indigo-400 print:text-indigo-800 font-bold">
                Deterministic Rationale
              </span>
            </div>
            
            <p className="text-xs text-slate-200 print:text-slate-800 leading-relaxed font-medium">
              Priority is classified as <strong className="text-white print:text-slate-950 font-bold">{hazardData.relocation_priority}</strong> because the village has an overall multi-hazard exposure score of <strong className="font-mono text-white print:text-slate-950">{(hazardData.overall_hazard_score ?? 0).toFixed(3)}</strong>, predominantly driven by <strong className="text-white print:text-slate-950 font-bold">{hazardData.dominant_hazard}</strong>. Spatial analysis indicates the highest concern is concentrated in the <strong className="text-rose-300 print:text-rose-800 font-bold">{highestImpactSector?.sector || 'affected'}</strong> sector (score: {highestImpactSector?.sector_hazard_score?.toFixed(3) || 'N/A'}). Emergency capacity and relocation host constraints should be reviewed before finalizing evacuation logistics.
            </p>

            {/* Compact Primary Concern Row */}
            <div className="pt-2 border-t border-indigo-800/30 print:border-indigo-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-indigo-400 print:text-indigo-900 font-bold uppercase text-[9.5px]">PRIMARY CONCERN:</span>
                <strong className="text-white print:text-slate-900 font-semibold">{hazardData.dominant_hazard} &bull; {highestImpactSector?.sector || 'Affected'} Sector</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-indigo-400 print:text-indigo-900 font-bold uppercase text-[9.5px]">HOST FOCUS:</span>
                <strong className="text-teal-300 print:text-teal-800 font-semibold">
                  {outsideCandidates[0]?.center_name ? `${outsideCandidates[0].center_name} (~${outsideCandidates[0].distance_km} km)` : (inVillageFacilities[0]?.center_name ? `In-Village (${inVillageFacilities[0].center_name})` : 'Mandal HQ')}
                </strong>
              </div>
            </div>
          </div>

        </section>

        {/* ============================================================= */}
        {/* DECISION AT A GLANCE (5 COMPACT CARDS) */}
        {/* ============================================================= */}
        <section className="space-y-2.5 print-avoid-break">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 print:text-slate-600 flex items-center gap-1.5">
              <span>DECISION AT A GLANCE</span>
            </span>
            <span className="text-[9px] font-mono text-slate-500">5-Dimensional Executive Matrix</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {/* Card 1: HAZARD */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 print:bg-slate-50 print:border-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-black text-slate-400 flex items-center gap-1">
                  <Waves className="w-3 h-3 text-rose-400" />
                  <span>HAZARD</span>
                </span>
                <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded border ${getPriorityBadgeClass(hazardData.relocation_priority)}`}>
                  {hazardData.relocation_priority}
                </span>
              </div>
              <div className="text-xs font-black text-white print:text-slate-900 font-mono">
                Score: {(hazardData.overall_hazard_score ?? 0).toFixed(3)}
              </div>
              <p className="text-[10px] text-slate-400 print:text-slate-600 leading-tight">
                Led by {hazardData.dominant_hazard.split(' ')[0]}. High spatial sampling confidence.
              </p>
            </div>

            {/* Card 2: COMMUNITY */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 print:bg-slate-50 print:border-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-black text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3 text-blue-400" />
                  <span>COMMUNITY</span>
                </span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded print:bg-blue-100 print:text-blue-800">
                  CENSUS BASELINE
                </span>
              </div>
              <div className="text-xs font-black text-white print:text-slate-900 font-mono">
                {pop.toLocaleString()} Population
              </div>
              <p className="text-[10px] text-slate-400 print:text-slate-600 leading-tight">
                {hh.toLocaleString()} households ({avgHhSize} avg/HH). Disability/elderly uncataloged.
              </p>
            </div>

            {/* Card 3: CAPACITY */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 print:bg-slate-50 print:border-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-black text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-amber-400" />
                  <span>CAPACITY</span>
                </span>
                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${
                  isCapacityConstrained
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 print:bg-amber-100 print:text-amber-800'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 print:bg-emerald-100 print:text-emerald-800'
                }`}>
                  {isCapacityConstrained ? 'CONSTRAINED' : 'SUFFICIENT'}
                </span>
              </div>
              <div className="text-xs font-black text-white print:text-slate-900 font-mono">
                {safeLandPct}% Safe Ground
              </div>
              <p className="text-[10px] text-slate-400 print:text-slate-600 leading-tight">
                {inVillageFacilities.length > 0 ? `${inVillageFacilities.length} in-village facilities mapped` : 'Requires mandal host allocation'}.
              </p>
            </div>

            {/* Card 4: RELOCATION */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 print:bg-slate-50 print:border-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-black text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-teal-400" />
                  <span>RELOCATION</span>
                </span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded print:bg-teal-100 print:text-teal-800">
                  {outsideCandidates.length > 0 ? 'HOSTS FOUND' : 'IN-VILLAGE'}
                </span>
              </div>
              <div className="text-xs font-black text-white print:text-slate-900 font-mono truncate">
                {nearestCandidate ? `~${nearestCandidate.distance_km} km (${nearestCandidate.mandal_name})` : 'Local Host'}
              </div>
              <p className="text-[10px] text-slate-400 print:text-slate-600 leading-tight">
                Safety &gt; Capacity &gt; Proximity. Candidate status requires verification.
              </p>
            </div>

            {/* Card 5: ACTION */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 print:bg-slate-50 print:border-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-black text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-indigo-400" />
                  <span>ACTION</span>
                </span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded print:bg-indigo-100 print:text-indigo-800">
                  REVIEW REQ.
                </span>
              </div>
              <div className="text-xs font-black text-white print:text-slate-900 font-mono">
                3-Stage Directive
              </div>
              <p className="text-[10px] text-slate-400 print:text-slate-600 leading-tight">
                Immediate (0–72h), Short-term (1–6m), Long-term (1–3y) directives defined.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 01 — VILLAGE OVERVIEW */}
        {/* ------------------------------------------------------------- */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm print:bg-white print:border print:border-slate-300 print:text-slate-900 print:rounded-2xl print-avoid-break">
          <div className="border-b border-slate-800 print:border-slate-200 pb-3 flex items-center justify-between print-heading-keep">
            <div>
              <span className="text-xs font-black text-indigo-400 print:text-indigo-600 font-mono">01</span>
              <h2 className="text-sm font-black text-white print:text-slate-900 uppercase tracking-wider">
                VILLAGE OVERVIEW
              </h2>
              <p className="text-[11px] text-slate-400 print:text-slate-500 mt-0.5">
                Administrative hierarchy, cadastral area, baseline demographics, and verified boundary polygon.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[9px] font-mono font-semibold px-2 py-0.5 bg-slate-800 text-slate-300 print:bg-slate-100 print:text-slate-700 rounded border border-slate-700 print:border-slate-300">
                SPATIAL SOURCE: Survey of India (SOI)
              </span>
              <span className="text-[9px] font-mono font-semibold px-2 py-0.5 bg-slate-800 text-slate-300 print:bg-slate-100 print:text-slate-700 rounded border border-slate-700 print:border-slate-300">
                DATA SOURCE: Census 2011 PCA
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Demographic and Geographic Summary Grid */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-950/70 print:bg-slate-50 border border-slate-800/90 print:border-slate-200 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Village Area</span>
                <strong className="text-base font-extrabold text-white print:text-slate-900 font-mono">
                  {area.toFixed(2)} km²
                </strong>
              </div>
              <div className="p-3.5 bg-slate-950/70 print:bg-slate-50 border border-slate-800/90 print:border-slate-200 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Population</span>
                <strong className="text-base font-extrabold text-white print:text-slate-900 font-mono">
                  {pop.toLocaleString()}
                </strong>
              </div>
              <div className="p-3.5 bg-slate-950/70 print:bg-slate-50 border border-slate-800/90 print:border-slate-200 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Households</span>
                <strong className="text-base font-extrabold text-white print:text-slate-900 font-mono">
                  {hh.toLocaleString()}
                </strong>
              </div>
              <div className="p-3.5 bg-slate-950/70 print:bg-slate-50 border border-slate-800/90 print:border-slate-200 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg HH Size</span>
                <strong className="text-base font-extrabold text-white print:text-slate-900 font-mono">
                  {avgHhSize}
                </strong>
              </div>

              <div className="col-span-2 sm:col-span-4 p-3.5 bg-slate-950/50 print:bg-slate-50 border border-slate-800/80 print:border-slate-200 rounded-2xl space-y-1.5 text-xs font-medium">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 print:text-slate-600">Mandal Headquarters:</span>
                  <strong className="text-slate-200 print:text-slate-900">{mMandal}</strong>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 print:text-slate-600">District Administration:</span>
                  <strong className="text-slate-200 print:text-slate-900">{dDist}</strong>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 print:text-slate-600">Data Availability Status:</span>
                  <strong className="text-emerald-400 print:text-emerald-800">100% Verified (Multi-Layer Raster + Cadastral)</strong>
                </div>
              </div>
            </div>

            {/* Small Cadastral Boundary Map Preview */}
            <div className="lg:col-span-1 space-y-1.5">
              <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-700 print:border-slate-300 relative shadow-inner">
                <div ref={mapContainerRef} className="w-full h-full z-0" />
              </div>
              <p className="text-[9.5px] text-slate-400 print:text-slate-500 text-center font-mono">
                Satellite Boundary Map &bull; Cadastral Quadrants (EPSG:7755)
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 02 — EXECUTIVE RISK ASSESSMENT */}
        {/* ------------------------------------------------------------- */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm print:bg-white print:border print:border-slate-300 print:text-slate-900 print:rounded-2xl print-avoid-break">
          <div className="border-b border-slate-800 print:border-slate-200 pb-3 flex items-center justify-between print-heading-keep">
            <div>
              <span className="text-xs font-black text-indigo-400 print:text-indigo-600 font-mono">02</span>
              <h2 className="text-sm font-black text-white print:text-slate-900 uppercase tracking-wider">
                EXECUTIVE RISK ASSESSMENT
              </h2>
              <p className="text-[11px] text-slate-400 print:text-slate-500 mt-0.5">
                Deterministic classification evaluating compound peril exposure across cardinal sectors.
              </p>
            </div>
            <span className="text-[9px] font-mono text-slate-400 print:text-slate-500 font-semibold px-2 py-0.5 bg-slate-800 print:bg-slate-100 rounded border border-slate-700 print:border-slate-300">
              HAZARD SOURCE: Multi-Hazard Rasters
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl border border-slate-800 print:border-slate-200 bg-slate-950/60 print:bg-slate-50 flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Relocation Priority</span>
              <span className={`text-sm font-black px-2.5 py-1 rounded-lg border text-center ${getPriorityBadgeClass(hazardData.relocation_priority)}`}>
                {hazardData.relocation_priority}
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 print:border-slate-200 bg-slate-950/60 print:bg-slate-50 flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Overall Hazard Score</span>
              <strong className="text-xl font-black text-white print:text-slate-900 font-mono">
                {(hazardData.overall_hazard_score ?? 0).toFixed(3)}
              </strong>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 print:border-slate-200 bg-slate-950/60 print:bg-slate-50 flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Dominant Peril</span>
              <strong className="text-xs font-bold text-indigo-300 print:text-indigo-900">
                {hazardData.dominant_hazard}
              </strong>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 print:border-slate-200 bg-slate-950/60 print:bg-slate-50 flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Highest Concern Sector</span>
              <strong className="text-sm font-black text-rose-400 print:text-rose-700 font-mono">
                {highestImpactSector ? `${highestImpactSector.sector} SECTOR` : 'N/A'}
              </strong>
            </div>
          </div>

          <div className="p-4 bg-indigo-950/30 print:bg-indigo-50/70 border border-indigo-800/40 print:border-indigo-200 rounded-2xl text-xs text-slate-300 print:text-slate-800 leading-relaxed font-medium space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 print:text-indigo-900 block">
              Why This Priority?
            </span>
            <p>
              Priority is classified as <strong className="text-white print:text-slate-900 font-bold">{hazardData.relocation_priority}</strong> based on an overall compound score of <strong className="font-mono text-white print:text-slate-900">{(hazardData.overall_hazard_score ?? 0).toFixed(3)}</strong> and peak sector exposure of <strong className="font-mono text-white print:text-slate-900">{highestImpactSector?.sector_hazard_score?.toFixed(3) || 'N/A'}</strong> in the <strong className="text-white print:text-slate-900 font-bold">{highestImpactSector?.sector || 'affected'}</strong> sector. The primary peril driver is <strong className="text-white print:text-slate-900 font-bold">{hazardData.dominant_hazard}</strong>.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 03 — HAZARD EXPOSURE */}
        {/* ------------------------------------------------------------- */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm print:bg-white print:border print:border-slate-300 print:text-slate-900 print:rounded-2xl print-avoid-break">
          <div className="border-b border-slate-800 print:border-slate-200 pb-3 flex items-center justify-between print-heading-keep">
            <div>
              <span className="text-xs font-black text-indigo-400 print:text-indigo-600 font-mono">03</span>
              <h2 className="text-sm font-black text-white print:text-slate-900 uppercase tracking-wider">
                HAZARD EXPOSURE
              </h2>
              <p className="text-[11px] text-slate-400 print:text-slate-500 mt-0.5">
                Physical peril intensity sampled from continuous 30m/90m rasters (Exposure Score % vs. Village Area %).
              </p>
            </div>
            <span className="text-[9px] font-mono text-slate-400 print:text-slate-500 font-semibold px-2 py-0.5 bg-slate-800 print:bg-slate-100 rounded border border-slate-700 print:border-slate-300">
              HAZARD SOURCE: JRC 30m / SRTM 90m / IMD / IS 875
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Flood Card */}
            <div className="p-4 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 print:text-slate-800 flex items-center gap-1.5">
                  <Waves className="w-4 h-4 text-blue-400 print:text-blue-600" />
                  <span>Flood Recurrence</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-blue-400 print:text-blue-700">
                  {((hazardData.flood_summary?.score ?? 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 print:bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (hazardData.flood_summary?.score ?? 0) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 print:text-slate-600 space-y-0.5">
                <div>Exposure Score: <strong className="text-white print:text-slate-900 font-mono">{(hazardData.flood_summary?.score ?? 0).toFixed(3)}</strong></div>
                <div>Max Recurrence: {(hazardData.flood_summary?.max_rec ?? 0).toFixed(1)}%</div>
                <div>Percentage of Area Affected: {(hazardData.flood_summary?.pct_affected ?? 0).toFixed(1)}%</div>
                <div className="text-[9px] text-slate-500 pt-1">Source: JRC 30m Global Surface Water</div>
              </div>
            </div>

            {/* Cyclone Card */}
            <div className="p-4 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 print:text-slate-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-rose-400 print:text-rose-600" />
                  <span>Cyclone Track</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-rose-400 print:text-rose-700">
                  {((hazardData.cyclone_summary?.score ?? 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 print:bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (hazardData.cyclone_summary?.score ?? 0) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 print:text-slate-600 space-y-0.5">
                <div>Exposure Score: <strong className="text-white print:text-slate-900 font-mono">{(hazardData.cyclone_summary?.score ?? 0).toFixed(3)}</strong></div>
                <div>Tracks in 25km Buffer: {hazardData.cyclone_summary?.tracks_count ?? 0}</div>
                <div>Nearest Track: ~{(hazardData.cyclone_summary?.min_dist_km ?? 0).toFixed(1)} km</div>
                <div className="text-[9px] text-slate-500 pt-1">Source: IMD Cyclone Best Tracks (1982–2020)</div>
              </div>
            </div>

            {/* Wind Card */}
            <div className="p-4 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 print:text-slate-800 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-teal-400 print:text-teal-600" />
                  <span>Wind Zone (IS 875)</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-teal-400 print:text-teal-700">
                  {((hazardData.wind_summary?.score ?? 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 print:bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (hazardData.wind_summary?.score ?? 0) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 print:text-slate-600 space-y-0.5">
                <div>Exposure Score: <strong className="text-white print:text-slate-900 font-mono">{(hazardData.wind_summary?.score ?? 0).toFixed(3)}</strong></div>
                <div>Basic Speed: {(hazardData.wind_summary?.speed_ms ?? 0).toFixed(1)} m/s ({hazardData.wind_summary?.zone || 'Zone IV'})</div>
                <div className="text-[9px] text-slate-500 pt-1">Wind exposure is uniform across this village at the available source resolution.</div>
              </div>
            </div>

            {/* Slope Card */}
            <div className="p-4 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 print:text-slate-800 flex items-center gap-1.5">
                  <Mountain className="w-4 h-4 text-amber-400 print:text-amber-600" />
                  <span>Sector Steep Terrain (≥15°)</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400 print:text-amber-700">
                  {((hazardData.slope_summary?.score ?? 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 print:bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (hazardData.slope_summary?.score ?? 0) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 print:text-slate-600 space-y-0.5">
                <div>Exposure Score: <strong className="text-white print:text-slate-900 font-mono">{(hazardData.slope_summary?.score ?? 0).toFixed(3)}</strong></div>
                <div>Mean Slope: {(hazardData.slope_summary?.mean_slope ?? 0).toFixed(1)}° (Steep Area: {(hazardData.slope_summary?.pct_steep ?? 0).toFixed(1)}%)</div>
                <div className="text-[9px] text-slate-500 pt-1">Village micro-topography descriptive indicator (distinct from mandal &gt;25° engineering constraint).</div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 04 — SECTOR RISK MATRIX */}
        {/* ------------------------------------------------------------- */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm print:bg-white print:border print:border-slate-300 print:text-slate-900 print:rounded-2xl print-avoid-break">
          <div className="border-b border-slate-800 print:border-slate-200 pb-3 flex items-center justify-between print-heading-keep">
            <div>
              <span className="text-xs font-black text-indigo-400 print:text-indigo-600 font-mono">04</span>
              <h2 className="text-sm font-black text-white print:text-slate-900 uppercase tracking-wider">
                SECTOR RISK MATRIX
              </h2>
              <p className="text-[11px] text-slate-400 print:text-slate-500 mt-0.5">
                Comparison of cardinal quadrants partitioned strictly across the official village boundary.
              </p>
            </div>
            <span className="text-[10px] font-mono text-rose-400 print:text-rose-700 font-bold px-2 py-0.5 bg-rose-500/10 print:bg-rose-50 rounded border border-rose-500/20 print:border-rose-200">
              Highest Concern Sector: {highestImpactSector ? highestImpactSector.sector : 'N/A'}
            </span>
          </div>

          {/* Clean Table / Matrix Layout */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 print:border-slate-200 text-slate-400 print:text-slate-600 text-[10px] uppercase font-mono">
                  <th className="py-2.5 px-3">Sector</th>
                  <th className="py-2.5 px-3">Area (km²)</th>
                  <th className="py-2.5 px-3">% of Village</th>
                  <th className="py-2.5 px-3">Hazard Score</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Main Concern / Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                {rankedSectors.map((s, idx) => {
                  const isHighest = idx === 0;
                  return (
                    <tr
                      key={s.sector}
                      className={isHighest ? 'bg-rose-500/10 print:bg-rose-50 font-medium' : 'hover:bg-slate-800/30'}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <strong className={`font-black ${isHighest ? 'text-rose-300 print:text-rose-800' : 'text-slate-200 print:text-slate-900'}`}>
                            {s.sector}
                          </strong>
                          {isHighest && (
                            <span className="text-[8px] font-black uppercase px-1.5 py-0.2 bg-rose-600 text-white rounded">
                              HIGHEST CONCERN
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300 print:text-slate-700">
                        {(s.area_sqkm ?? 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300 print:text-slate-700">
                        {(s.area_pct ?? 0).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-white print:text-slate-900">
                        {(s.sector_hazard_score ?? 0).toFixed(3)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getPriorityBadgeClass(s.priority)}`}>
                          {s.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-400 print:text-slate-600 leading-snug">
                        {s.priority_reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 05 — COMMUNITY PROFILE */}
        {/* ------------------------------------------------------------- */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm print:bg-white print:border print:border-slate-300 print:text-slate-900 print:rounded-2xl print-avoid-break">
          <div className="border-b border-slate-800 print:border-slate-200 pb-3 flex items-center justify-between print-heading-keep">
            <div>
              <span className="text-xs font-black text-indigo-400 print:text-indigo-600 font-mono">05</span>
              <h2 className="text-sm font-black text-white print:text-slate-900 uppercase tracking-wider">
                COMMUNITY PROFILE
              </h2>
              <p className="text-[11px] text-slate-400 print:text-slate-500 mt-0.5">
                Official population baseline sourced from Census 2011 Primary Census Abstract (PCA).
              </p>
            </div>
            <span className="text-[9px] font-mono text-slate-400 print:text-slate-500 font-semibold px-2 py-0.5 bg-slate-800 print:bg-slate-100 rounded border border-slate-700 print:border-slate-300">
              DATA SOURCE: Census 2011 PCA
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Population</span>
              <strong className="text-base font-extrabold text-white print:text-slate-900 font-mono">{pop.toLocaleString()}</strong>
            </div>
            <div className="p-3.5 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Children 0–6 Yrs</span>
              <strong className="text-base font-extrabold text-white print:text-slate-900 font-mono">
                {pop06.toLocaleString()}
              </strong>
            </div>
            <div className="p-3.5 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Persons 7+ (Adult Baseline)</span>
              <strong className="text-base font-extrabold text-white print:text-slate-900 font-mono">
                {pop7Plus.toLocaleString()}
              </strong>
            </div>
            <div className="p-3.5 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Households</span>
              <strong className="text-base font-extrabold text-white print:text-slate-900 font-mono">{hh.toLocaleString()}</strong>
            </div>
            <div className="p-3.5 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Avg Household Size</span>
              <strong className="text-base font-extrabold text-white print:text-slate-900 font-mono">{avgHhSize}</strong>
            </div>
            <div className="p-3.5 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Non-Workers</span>
              <strong className="text-base font-extrabold text-white print:text-slate-900 font-mono">{nonWorkers.toLocaleString()}</strong>
            </div>
            <div className="p-3.5 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Workers</span>
              <strong className="text-base font-extrabold text-white print:text-slate-900 font-mono">{workers.toLocaleString()}</strong>
            </div>
            <div className="p-3.5 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Gender Split (7+)</span>
              <span className="text-xs font-semibold text-slate-400 print:text-slate-600 block mt-1">
                Not itemized in PCA table
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-amber-950/30 print:bg-amber-50 border border-amber-800/40 print:border-amber-200 rounded-2xl text-[11px] text-amber-300 print:text-amber-900 leading-relaxed font-medium">
            Older persons and disability counts are not available at village level in the Census PCA dataset and are therefore not fabricated. Community profile attributes serve as baseline planning estimates.
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 06 — EMERGENCY CAPACITY */}
        {/* ------------------------------------------------------------- */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm print:bg-white print:border print:border-slate-300 print:text-slate-900 print:rounded-2xl print-avoid-break">
          <div className="border-b border-slate-800 print:border-slate-200 pb-3 flex items-center justify-between print-heading-keep">
            <div>
              <span className="text-xs font-black text-indigo-400 print:text-indigo-600 font-mono">06</span>
              <h2 className="text-sm font-black text-white print:text-slate-900 uppercase tracking-wider">
                EMERGENCY CAPACITY
              </h2>
              <p className="text-[11px] text-slate-400 print:text-slate-500 mt-0.5">
                Evaluation of safe ground availability, arterial road connectivity, and local public infrastructure.
              </p>
            </div>
            <span className="text-[9px] font-mono text-slate-400 print:text-slate-500 font-semibold px-2 py-0.5 bg-slate-800 print:bg-slate-100 rounded border border-slate-700 print:border-slate-300">
              INFRASTRUCTURE SOURCE: AP Public Facilities Catalog
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
            <div className="p-4 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Safe Habitable Land</span>
              <strong className="text-sm font-bold text-emerald-400 print:text-emerald-800">
                {safeLandPct}% Safe Ground
              </strong>
              <p className="text-[10px] text-slate-400 print:text-slate-600">Land unexposed above critical flood/cyclone hazard threshold.</p>
            </div>

            <div className="p-4 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Road / Accessibility</span>
              <strong className="text-sm font-bold text-slate-200 print:text-slate-800">
                Mandal Road Connectivity
              </strong>
              <p className="text-[10px] text-slate-400 print:text-slate-600">Connecting village center to primary mandal relief arterial corridors.</p>
            </div>

            <div className="p-4 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Facility Availability</span>
              <strong className="text-sm font-bold text-blue-400 print:text-blue-800">
                {inVillageFacilities.length > 0
                  ? `${inVillageFacilities.length} Mapped Public Facilities`
                  : 'Requires Mandal Host Allocation'}
              </strong>
              <p className="text-[10px] text-slate-400 print:text-slate-600">Cataloged in connected public geospatial infrastructure database.</p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/40 print:bg-slate-100 border border-slate-800 print:border-slate-200 rounded-2xl text-xs space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 print:text-slate-800 block">
              WHAT THIS MEANS:
            </span>
            <p className="text-slate-300 print:text-slate-700 leading-relaxed font-medium">
              Current datasets indicate whether the village/host environment has sufficient planning capacity. This is a decision-support indicator, not a declaration that the village is currently unsafe.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 07 — LOCAL FACILITIES */}
        {/* ------------------------------------------------------------- */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm print:bg-white print:border print:border-slate-300 print:text-slate-900 print:rounded-2xl print-avoid-break">
          <div className="border-b border-slate-800 print:border-slate-200 pb-3 flex items-center justify-between print-heading-keep">
            <div>
              <span className="text-xs font-black text-indigo-400 print:text-indigo-600 font-mono">07</span>
              <h2 className="text-sm font-black text-white print:text-slate-900 uppercase tracking-wider">
                LOCAL FACILITIES
              </h2>
              <p className="text-[11px] text-slate-400 print:text-slate-500 mt-0.5">
                Potential shelter &amp; public buildings located inside the Survey of India polygon.
              </p>
            </div>
            <span className="text-[9px] font-mono text-slate-400 print:text-slate-500 font-semibold px-2 py-0.5 bg-slate-800 print:bg-slate-100 rounded border border-slate-700 print:border-slate-300">
              {inVillageFacilities.length} {inVillageFacilities.length === 1 ? 'Facility' : 'Facilities'} Inside Polygon
            </span>
          </div>

          <div className="p-3.5 bg-indigo-950/30 print:bg-indigo-50 border border-indigo-800/40 print:border-indigo-200 rounded-2xl text-[11px] text-slate-300 print:text-slate-800 leading-relaxed font-medium">
            Mapped facilities are potential locations identified from connected public datasets. Final structural safety, occupancy, emergency suitability and authorization require local authority verification.
          </div>

          {inVillageFacilities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {inVillageFacilities.map((fac, idx) => (
                <div
                  key={fac.center_name + idx}
                  className="p-4 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-xs font-bold text-white print:text-slate-900">
                            #{idx + 1} {fac.center_name}
                          </strong>
                          {fac.facility_type && (
                            <span className="text-[8.5px] font-bold px-1.5 py-0.2 bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded print:bg-teal-50 print:text-teal-700">
                              {fac.facility_type.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        <div className="text-[9.5px] text-slate-400 print:text-slate-500 mt-0.5">
                          Inside SOI Village Polygon &bull; {fac.distance_km} km from active sector
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                        fac.suitability_tier?.includes('HIGH')
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 print:bg-emerald-100 print:text-emerald-800'
                          : 'bg-blue-500/15 text-blue-300 border-blue-500/30 print:bg-blue-50 print:text-blue-800'
                      }`}>
                        {fac.suitability_tier}
                      </span>
                    </div>

                    <div className="mt-2">
                      <span className="text-[8px] font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded print:bg-amber-50 print:text-amber-800">
                        Potential Facility — Authority Verification Required
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2.5 text-[9.5px] bg-slate-900 print:bg-white p-2 rounded-xl border border-slate-800 print:border-slate-200 font-medium">
                      <div>
                        <span className="text-slate-400 block text-[8px] uppercase">Capacity</span>
                        <strong className="text-slate-200 print:text-slate-800">
                          {fac.capacity_total ? `${fac.capacity_total.toLocaleString()} persons` : 'Capacity not available in source data.'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[8px] uppercase">Footprint Area</span>
                        <strong className="text-slate-200 print:text-slate-800">
                          {fac.usable_area_sq_m ? `${fac.usable_area_sq_m.toLocaleString()} m²` : 'N/A in source'}
                        </strong>
                        {fac.usable_area_sq_m && (
                          <span className="text-[7.5px] text-slate-400 block">(Capacity not inferred from building area)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 print:border-slate-200 text-[9.5px] text-slate-400 print:text-slate-600 leading-tight">
                    {fac.why_recommended}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 print:text-amber-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 print:text-amber-600" />
                <span>NO VERIFIED FACILITY MAPPED INSIDE THIS VILLAGE</span>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600 leading-relaxed font-medium">
                No verified disaster-manageable shelter or public facility is cataloged within Census Village {villageCode} in connected datasets. Refer to Section 08 for qualified host candidates in neighboring mandals.
              </p>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 08 — POTENTIAL RELOCATION LOCATIONS */}
        {/* ------------------------------------------------------------- */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm print:bg-white print:border print:border-slate-300 print:text-slate-900 print:rounded-2xl print-avoid-break">
          <div className="border-b border-slate-800 print:border-slate-200 pb-3 flex items-center justify-between print-heading-keep">
            <div>
              <span className="text-xs font-black text-indigo-400 print:text-indigo-600 font-mono">08</span>
              <h2 className="text-sm font-black text-white print:text-slate-900 uppercase tracking-wider">
                POTENTIAL RELOCATION LOCATIONS
              </h2>
              <p className="text-[11px] text-slate-400 print:text-slate-500 mt-0.5">
                AHP/TOPSIS ranked host candidates evaluated on safety, capacity, and accessibility.
              </p>
            </div>
            <span className="text-[9px] font-mono text-slate-400 print:text-slate-500 font-semibold px-2 py-0.5 bg-slate-800 print:bg-slate-100 rounded border border-slate-700 print:border-slate-300">
              MODEL: AHP / TOPSIS Qualified Host Hierarchy
            </span>
          </div>

          <div className="p-3 bg-slate-950/50 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl text-[10px] font-mono text-slate-300 print:text-slate-700 text-center font-bold">
            Relocation hierarchy: Safety → Capacity → Accessibility → Soft Proximity Preference (Potential locations, NOT government-approved sites)
          </div>

          {outsideCandidates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 print:border-slate-200 text-slate-400 print:text-slate-600 text-[10px] uppercase font-mono">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Candidate / Mandal</th>
                    <th className="py-2.5 px-3">District</th>
                    <th className="py-2.5 px-3">Distance</th>
                    <th className="py-2.5 px-3">Safety Status</th>
                    <th className="py-2.5 px-3">Capacity</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3">Why Recommended</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {outsideCandidates.map((cand, idx) => (
                    <tr key={cand.center_name + idx} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-mono font-bold text-white print:text-slate-900">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <strong className="text-white print:text-slate-900 font-bold block">{cand.center_name}</strong>
                        <span className="text-[10px] text-slate-400 print:text-slate-500">{cand.mandal_name} Mandal</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 print:text-slate-700">
                        {cand.district_name}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-teal-400 print:text-teal-800">
                        ~{cand.distance_km} km
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded print:bg-emerald-100 print:text-emerald-800">
                          {cand.safety_status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 print:text-slate-700">
                        {cand.capacity_condition}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-indigo-300 print:text-slate-900">
                        {cand.suitability_score.toFixed(3)}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-300 print:text-slate-600 leading-snug">
                        {cand.why_recommended}
                        {cand.rejected_closer_candidates && cand.rejected_closer_candidates.length > 0 && (
                          <div className="mt-1 p-1.5 bg-rose-500/10 print:bg-rose-50 border border-rose-500/20 print:border-rose-200 rounded text-[9.5px] text-rose-300 print:text-rose-800">
                            <strong>Why closer candidate was rejected:</strong> {cand.rejected_closer_candidates[0].mandal_name} (~{cand.rejected_closer_candidates[0].distance_km} km): {cand.rejected_closer_candidates[0].rejection_reason}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl text-xs text-slate-400 text-center">
              No external relocation candidates evaluated.
            </div>
          )}
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 09 — WHAT-IF SIMULATION */}
        {/* ------------------------------------------------------------- */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm print:bg-white print:border print:border-slate-300 print:text-slate-900 print:rounded-2xl print-avoid-break">
          <div className="border-b border-slate-800 print:border-slate-200 pb-3 flex items-center justify-between print-heading-keep">
            <div>
              <span className="text-xs font-black text-indigo-400 print:text-indigo-600 font-mono">09</span>
              <h2 className="text-sm font-black text-white print:text-slate-900 uppercase tracking-wider">
                WHAT-IF SIMULATION
              </h2>
              <p className="text-[11px] text-slate-400 print:text-slate-500 mt-0.5">
                Stress-testing priority thresholds against simulated peril increases.
              </p>
            </div>
            <span className="text-[10px] font-mono text-rose-300 print:text-rose-800 font-bold px-2.5 py-0.5 bg-rose-500/15 print:bg-rose-100 border border-rose-500/30 print:border-rose-300 rounded-full">
              SCENARIO SIMULATION — NOT A FORECAST
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-3.5 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Baseline Score</span>
              <strong className="text-sm font-black text-white print:text-slate-900 font-mono">
                {(scenarioData?.baseline_hazard_score ?? hazardData.overall_hazard_score).toFixed(3)}
              </strong>
            </div>
            <div className="p-3.5 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Scenario Increase</span>
              <strong className="text-sm font-black text-indigo-400 print:text-indigo-700 font-mono">
                +{scenarioData?.scenario_hazard_increase ?? 5.0}%
              </strong>
            </div>
            <div className="p-3.5 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Simulated Score</span>
              <strong className="text-sm font-black text-rose-400 print:text-rose-700 font-mono">
                {(scenarioData?.simulated_hazard_score ?? (hazardData.overall_hazard_score * 1.05)).toFixed(3)}
              </strong>
            </div>
            <div className="p-3.5 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Simulated Priority</span>
              <strong className="text-sm font-black text-rose-400 print:text-rose-700 font-mono">
                {hazardData.relocation_priority} &rarr; {scenarioData?.simulated_relocation_priority ?? hazardData.relocation_priority}
              </strong>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/40 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl text-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Priority Shift Status: {scenarioData?.priority_shifted ? 'PRIORITY SHIFT OBSERVED' : 'PRIORITY STABLE UNDER +5% PERTURBATION'}
            </span>
            <p className="text-slate-300 print:text-slate-700 leading-relaxed font-medium">
              {scenarioData?.explanation || 'Simulated compound hazard perturbation evaluates spatial sensitivity to extreme peril escalation.'}
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 10 — DISASTER ACTION PLAN */}
        {/* ------------------------------------------------------------- */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm print:bg-white print:border print:border-slate-300 print:text-slate-900 print:rounded-2xl print-avoid-break">
          <div className="border-b border-slate-800 print:border-slate-200 pb-3 flex items-center justify-between print-heading-keep">
            <div>
              <span className="text-xs font-black text-indigo-400 print:text-indigo-600 font-mono">10</span>
              <h2 className="text-sm font-black text-white print:text-slate-900 uppercase tracking-wider">
                DISASTER ACTION PLAN
              </h2>
              <p className="text-[11px] text-slate-400 print:text-slate-500 mt-0.5">
                Staged operational directives derived from multi-hazard exposure and capacity condition.
              </p>
            </div>
            <span className="text-[9px] font-mono text-slate-400 print:text-slate-500 font-semibold px-2 py-0.5 bg-slate-800 print:bg-slate-100 rounded border border-slate-700 print:border-slate-300">
              ACTION FRAMEWORK: 3-Stage Operational Directive
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Immediate: 0-72h */}
            <div className="p-4 bg-rose-500/10 print:bg-rose-50 border border-rose-500/25 print:border-rose-200 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-rose-300 print:text-rose-900 uppercase">
                <Clock className="w-3.5 h-3.5 text-rose-400 print:text-rose-600" />
                <span>IMMEDIATE &bull; 0–72 HOURS</span>
              </div>
              <ul className="text-[11px] text-slate-200 print:text-slate-800 space-y-2 list-disc pl-4 font-medium leading-relaxed">
                <li><strong className="text-white print:text-slate-900">Action:</strong> Focus early warning broadcasts on {highestImpactSector?.sector || 'affected'} sector.</li>
                <li><strong className="text-white print:text-slate-900">Reason:</strong> Sector hazard score is highest ({(highestImpactSector?.sector_hazard_score ?? 0).toFixed(3)}).</li>
                <li><strong className="text-white print:text-slate-900">Responsible:</strong> Mandal Revenue Officer / Gram Sachivalayam.</li>
                <li><strong className="text-white print:text-slate-900">Data Basis:</strong> 4-Quadrant Multi-Hazard Exposure.</li>
              </ul>
            </div>

            {/* Short-Term: 1-6m */}
            <div className="p-4 bg-amber-500/10 print:bg-amber-50 border border-amber-500/25 print:border-amber-200 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 print:text-amber-900 uppercase">
                <Clock className="w-3.5 h-3.5 text-amber-400 print:text-amber-600" />
                <span>SHORT-TERM &bull; 1–6 MONTHS</span>
              </div>
              <ul className="text-[11px] text-slate-200 print:text-slate-800 space-y-2 list-disc pl-4 font-medium leading-relaxed">
                <li><strong className="text-white print:text-slate-900">Action:</strong> Conduct field structural audits for local public buildings.</li>
                <li><strong className="text-white print:text-slate-900">Reason:</strong> Official capacity numbers uncataloged in baseline PCA.</li>
                <li><strong className="text-white print:text-slate-900">Responsible:</strong> R&amp;B / Panchayat Raj Engineering Dept.</li>
                <li><strong className="text-white print:text-slate-900">Data Basis:</strong> Public Infrastructure GIS Inventory.</li>
              </ul>
            </div>

            {/* Long-Term: 1-3y */}
            <div className="p-4 bg-indigo-500/10 print:bg-indigo-50 border border-indigo-500/25 print:border-indigo-200 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-indigo-300 print:text-indigo-900 uppercase">
                <Clock className="w-3.5 h-3.5 text-indigo-400 print:text-indigo-600" />
                <span>LONG-TERM &bull; 1–3 YEARS</span>
              </div>
              <ul className="text-[11px] text-slate-200 print:text-slate-800 space-y-2 list-disc pl-4 font-medium leading-relaxed">
                <li><strong className="text-white print:text-slate-900">Action:</strong> Construct designated elevated cyclone/flood multi-purpose shelters.</li>
                <li><strong className="text-white print:text-slate-900">Reason:</strong> Address village capacity constraints and reduce mandal host dependency.</li>
                <li><strong className="text-white print:text-slate-900">Responsible:</strong> AP State Disaster Management Authority (APSDMA).</li>
                <li><strong className="text-white print:text-slate-900">Data Basis:</strong> Multi-Year Peril Recurrence Rasters.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 11 — DATA CONFIDENCE & LIMITATIONS */}
        {/* ------------------------------------------------------------- */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm print:bg-white print:border print:border-slate-300 print:text-slate-900 print:rounded-2xl print-avoid-break">
          <div className="border-b border-slate-800 print:border-slate-200 pb-3 flex items-center justify-between print-heading-keep">
            <div>
              <span className="text-xs font-black text-indigo-400 print:text-indigo-600 font-mono">11</span>
              <h2 className="text-sm font-black text-white print:text-slate-900 uppercase tracking-wider">
                DATA CONFIDENCE &amp; LIMITATIONS
              </h2>
              <p className="text-[11px] text-slate-400 print:text-slate-500 mt-0.5">
                Explicit provenance attribution, resolution parameters, and known analytical boundaries.
              </p>
            </div>
            <span className="text-[9px] font-mono text-slate-400 print:text-slate-500 font-semibold px-2 py-0.5 bg-slate-800 print:bg-slate-100 rounded border border-slate-700 print:border-slate-300">
              EVIDENCE-BASED AUDIT
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            <div className="p-4 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Population Profile</span>
              <strong className="text-xs font-bold text-slate-200 print:text-slate-900">Census 2011 Primary Census Abstract</strong>
              <p className="text-[10.5px] text-slate-400 print:text-slate-600">Official population baseline. Village-level elderly and disability counts are not cataloged in Census PCA.</p>
            </div>

            <div className="p-4 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Hazard Rasters</span>
              <strong className="text-xs font-bold text-slate-200 print:text-slate-900">JRC 30m / SRTM 90m / IMD Tracks</strong>
              <p className="text-[10.5px] text-slate-400 print:text-slate-600">Continuous physical terrain and peril rasters. High spatial sampling confidence across SOI boundary.</p>
            </div>

            <div className="p-4 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Facilities &amp; Shelters</span>
              <strong className="text-xs font-bold text-slate-200 print:text-slate-900">Public Infrastructure Catalog</strong>
              <p className="text-[10.5px] text-slate-400 print:text-slate-600">Spatially mapped to SOI polygon. Structural safety and occupancy clearance require local verification.</p>
            </div>

            <div className="p-4 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Relocation Candidates</span>
              <strong className="text-xs font-bold text-slate-200 print:text-slate-900">AHP / TOPSIS Qualified Hierarchy</strong>
              <p className="text-[10.5px] text-slate-400 print:text-slate-600">Evaluated on Safety &gt; Capacity &gt; Accessibility. Candidates are potential sites, NOT approved government shelters.</p>
            </div>

            <div className="p-4 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl space-y-1 sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Simulation Disclaimer</span>
              <strong className="text-xs font-bold text-slate-200 print:text-slate-900">Mathematical Sensitivity Perturbation</strong>
              <p className="text-[10.5px] text-slate-400 print:text-slate-600">Scenario models indicate threshold sensitivity; they are NOT weather forecasts, real-time telemetry, or casualty estimates.</p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 12 — FINAL DECISION SUMMARY */}
        {/* ------------------------------------------------------------- */}
        <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl border border-slate-800 print:bg-white print:text-slate-900 print:border-2 print:border-slate-800 print:rounded-2xl print-avoid-break">
          <div className="flex items-center gap-2 border-b border-slate-800 print:border-slate-300 pb-3 print-heading-keep">
            <ShieldCheck className="w-5 h-5 text-emerald-400 print:text-emerald-700" />
            <div>
              <span className="text-xs font-black text-indigo-400 print:text-indigo-600 font-mono">12</span>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-100 print:text-slate-900">
                FINAL DECISION SUPPORT SUMMARY
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            <div className="bg-slate-950/70 print:bg-slate-50 p-3.5 rounded-2xl border border-slate-800 print:border-slate-300 space-y-1">
              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Priority Classification</span>
              <strong className="text-emerald-400 print:text-slate-900 text-sm font-black">{hazardData.relocation_priority}</strong>
              <p className="text-[10px] text-slate-400 print:text-slate-600">Calculated composite index: {(hazardData.overall_hazard_score ?? 0).toFixed(3)}</p>
            </div>

            <div className="bg-slate-950/70 print:bg-slate-50 p-3.5 rounded-2xl border border-slate-800 print:border-slate-300 space-y-1">
              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Primary Concern</span>
              <strong className="text-rose-400 print:text-rose-800 text-sm font-black">{highestImpactSector?.sector || 'N/A'} Sector</strong>
              <p className="text-[10px] text-slate-400 print:text-slate-600">Dominant Peril: {hazardData.dominant_hazard}</p>
            </div>

            <div className="bg-slate-950/70 print:bg-slate-50 p-3.5 rounded-2xl border border-slate-800 print:border-slate-300 space-y-1">
              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Immediate Planning Focus</span>
              <strong className="text-indigo-300 print:text-slate-900 text-xs font-bold block truncate">
                Early Warning &bull; {highestImpactSector?.sector || 'Affected'} Sector
              </strong>
              <p className="text-[10px] text-slate-400 print:text-slate-600">Verify facility clearance &amp; access corridors</p>
            </div>

            <div className="bg-slate-950/70 print:bg-slate-50 p-3.5 rounded-2xl border border-slate-800 print:border-slate-300 space-y-1">
              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Potential Relocation Status</span>
              <strong className="text-teal-400 print:text-teal-800 text-xs font-bold block truncate">
                {outsideCandidates[0] ? `Host: ${outsideCandidates[0].center_name} (~${outsideCandidates[0].distance_km} km)` : (inVillageFacilities[0] ? `In-Village: ${inVillageFacilities[0].center_name}` : 'Mandal HQ Review')}
              </strong>
              <p className="text-[10px] text-slate-400 print:text-slate-600">Qualified candidate location</p>
            </div>

            <div className="bg-slate-950/70 print:bg-slate-50 p-3.5 rounded-2xl border border-slate-800 print:border-slate-300 space-y-1 sm:col-span-2">
              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Key Uncertainty &amp; Limitation</span>
              <strong className="text-amber-300 print:text-amber-900 text-xs font-bold block">
                Field Capacity Verification &amp; PCA Baseline
              </strong>
              <p className="text-[10px] text-slate-400 print:text-slate-600">Village-level elderly/disability counts and live facility occupancy require ground verification.</p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/50 print:bg-slate-100 rounded-xl border border-slate-800 print:border-slate-300 text-xs space-y-1">
            <p className="text-slate-300 print:text-slate-700 leading-relaxed font-medium">
              RakshaSethu provides decision support. Final evacuation, relocation and emergency actions require verification and authorization by the competent authority.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* TECHNICAL DETAILS & METHODOLOGY (COLLAPSIBLE) */}
        {/* ------------------------------------------------------------- */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm print:bg-white print:border print:border-slate-300 print:text-slate-900 print:rounded-2xl print-avoid-break">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full flex items-center justify-between text-left print:pointer-events-none cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400 print:text-indigo-600" />
              <h3 className="text-xs font-black text-white print:text-slate-900 uppercase tracking-wider">
                Technical Methodology &amp; Mathematical Notes
              </h3>
            </div>
            <div className="text-slate-400 print:hidden">
              {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {(showTechnicalDetails || true) && (
            <div className={`space-y-3 text-[11px] text-slate-400 print:text-slate-600 leading-relaxed pt-2 border-t border-slate-800 print:border-slate-200 font-medium ${showTechnicalDetails ? 'block' : 'hidden print:block'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <strong className="text-slate-200 print:text-slate-900 block mb-1">Spatial Projection &amp; Boundaries:</strong>
                  Survey of India (SOI) Census 2011 MultiPolygon boundaries projected to EPSG:7755 (India National Grid Zone 5). Cardinal sectors generated from geometric centroid partitioning.
                </div>
                <div>
                  <strong className="text-slate-200 print:text-slate-900 block mb-1">Hazard Sampling:</strong>
                  Continuous spatial raster sampling of JRC 30m Global Surface Water, NASA SRTM 90m DEM, IMD 1982–2020 Cyclone Best Tracks, and IS 875 Part 3 Wind speed zones.
                </div>
              </div>
              <div className="pt-2">
                <strong className="text-slate-200 print:text-slate-900 block mb-1">Data Provenance Note:</strong>
                {hazardData.data_provenance_note}
              </div>
            </div>
          )}
        </section>

        {/* Print Document Footer */}
        <div className="hidden print:block pt-6 border-t border-slate-300 text-[10px] text-slate-500 text-center font-mono">
          RakshaSethu &bull; Village Decision Brief &bull; Census Village Code {villageCode} ({vName}) &bull; Data Sources: Survey of India, Census 2011 PCA, JRC, NASA SRTM, IMD
        </div>

        {/* Bottom Return Button (Hidden on Print) */}
        <div className="pt-4 pb-8 text-center print:hidden">
          <button
            onClick={onBackToVillage}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl border border-slate-700 transition shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Interactive Village Analysis</span>
          </button>
        </div>

      </div>

    </div>
  );
};

export default VillageAnalysisReportPage;
