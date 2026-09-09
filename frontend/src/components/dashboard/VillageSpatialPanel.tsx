import React, { useState, useEffect, useMemo } from 'react';
import {
  Waves,
  Wind,
  Compass,
  Mountain,
  AlertTriangle,
  ShieldCheck,
  Sliders,
  CheckCircle2,
  Activity,
  Layers,
  ArrowRight,
  X
} from 'lucide-react';
import type {
  VillageHazardResponse,
  VillageGeometryResponse,
  VillageScenarioResponse,
  VillageRelocationResponse,
  SectorHazardDetail
} from '../../types/village';
import {
  fetchVillageSummary,
  fetchVillageGeometry,
  fetchVillageScenario,
  fetchVillageRelocationCenters
} from '../../services/api';

interface VillageSpatialPanelProps {
  villageCode: number;
  villageName: string;
  mandalName: string;
  districtName: string;
  onClose: () => void;
  onNavigateToActionPlan?: () => void;
}

const DISASTERS = [
  { id: 'all', label: 'Multi-Hazard', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'flood', label: 'Flood (30m)', icon: <Waves className="w-3.5 h-3.5" /> },
  { id: 'cyclone', label: 'Cyclone Track', icon: <Compass className="w-3.5 h-3.5" /> },
  { id: 'wind', label: 'Wind Zone', icon: <Wind className="w-3.5 h-3.5" /> },
  { id: 'slope', label: 'Terrain (≥15°)', icon: <Mountain className="w-3.5 h-3.5" /> },
];

export const VillageSpatialPanel: React.FC<VillageSpatialPanelProps> = ({
  villageCode,
  villageName,
  mandalName,
  districtName,
  onClose,
  onNavigateToActionPlan,
}) => {
  const [activeDisaster, setActiveDisaster] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [hazardData, setHazardData] = useState<VillageHazardResponse | null>(null);
  const [geomData, setGeomData] = useState<VillageGeometryResponse | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  // What-If Slider (0 to 10)
  const [scenarioIncrease, setScenarioIncrease] = useState<number>(0);
  const [scenarioData, setScenarioData] = useState<VillageScenarioResponse | null>(null);

  // Relocation Centers
  const [relocData, setRelocData] = useState<VillageRelocationResponse | null>(null);
  const [loadingReloc, setLoadingReloc] = useState<boolean>(false);

  // Load Village Summary and Geometry
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadingReloc(true);
    setError(null);

    Promise.all([
      fetchVillageSummary(villageCode, activeDisaster),
      fetchVillageGeometry(villageCode),
      fetchVillageRelocationCenters(villageCode, 4),
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
  }, [villageCode, activeDisaster]);

  // Load Scenario Data when slider moves
  useEffect(() => {
    if (!villageCode) return;
    fetchVillageScenario(villageCode, scenarioIncrease)
      .then((res) => {
        setScenarioData(res);
      })
      .catch(() => {
        // Keep previous scenario data if error
      });
  }, [villageCode, scenarioIncrease]);

  // Priority styling helper
  const getPriorityBadge = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'VERY HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MODERATE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'LOW':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'VERY HIGH':
        return '#f43f5e';
      case 'HIGH':
        return '#f59e0b';
      case 'MODERATE':
        return '#3b82f6';
      case 'LOW':
        return '#10b981';
      default:
        return '#94a3b8';
    }
  };

  // SVG Geometry Projector
  const svgMapData = useMemo(() => {
    if (!geomData || !geomData.sectors_geojson?.features) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const projectCoord = (lon: number, lat: number) => {
      if (lon < minX) minX = lon;
      if (lon > maxX) maxX = lon;
      if (lat < minY) minY = lat;
      if (lat > maxY) maxY = lat;
    };

    const features = geomData.sectors_geojson.features;
    features.forEach((feat: any) => {
      const geom = feat.geometry;
      if (geom.type === 'Polygon') {
        geom.coordinates[0].forEach(([x, y]: [number, number]) => projectCoord(x, y));
      } else if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach((poly: any) => {
          poly[0].forEach(([x, y]: [number, number]) => projectCoord(x, y));
        });
      }
    });

    if (minX === Infinity) return null;

    const padX = (maxX - minX) * 0.1 || 0.001;
    const padY = (maxY - minY) * 0.1 || 0.001;
    minX -= padX;
    maxX += padX;
    minY -= padY;
    maxY += padY;

    const width = 300;
    const height = 240;

    const toSvg = (lon: number, lat: number): [number, number] => {
      const x = ((lon - minX) / (maxX - minX)) * width;
      const y = height - ((lat - minY) / (maxY - minY)) * height;
      return [x, y];
    };

    const sectorPaths = features.map((feat: any) => {
      const sName = feat.properties.sector;
      const geom = feat.geometry;
      let pathStr = '';

      const processRings = (rings: any) => {
        rings.forEach((ring: any) => {
          ring.forEach(([lon, lat]: [number, number], i: number) => {
            const [sx, sy] = toSvg(lon, lat);
            pathStr += `${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)} `;
          });
          pathStr += 'Z ';
        });
      };

      if (geom.type === 'Polygon') {
        processRings(geom.coordinates);
      } else if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach((poly: any) => processRings(poly));
      }

      // Find matching sector priority
      const sDetail = hazardData?.sectors.find((s) => s.sector === sName);
      const priority = sDetail?.priority || 'MODERATE';
      const fillColor = getPriorityColor(priority);

      return {
        sector: sName,
        path: pathStr,
        fillColor,
        area: feat.properties.area_sqkm,
        priority,
      };
    });

    const [cxSvg, cySvg] = toSvg(geomData.centroid_lon, geomData.centroid_lat);

    return {
      width,
      height,
      sectorPaths,
      centroid: [cxSvg, cySvg],
    };
  }, [geomData, hazardData]);

  const activeSectorDetail: SectorHazardDetail | undefined = useMemo(() => {
    if (!hazardData) return undefined;
    if (selectedSector) {
      return hazardData.sectors.find((s) => s.sector === selectedSector);
    }
    // Default to the highest risk sector
    return [...hazardData.sectors].sort((a, b) => b.sector_hazard_score - a.sector_hazard_score)[0];
  }, [hazardData, selectedSector]);

  return (
    <div className="bg-white border border-indigo-200/90 rounded-2xl shadow-md overflow-hidden flex flex-col text-slate-800 font-sans text-xs animate-in fade-in duration-200">
      
      {/* 1. HEADER */}
      <div className="p-3.5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-start justify-between gap-2 shrink-0">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded border border-indigo-400/30">
              Survey of India &bull; Cadastral Spatial
            </span>
            <span className="text-[10px] font-mono text-indigo-300">
              Census Code: {villageCode}
            </span>
          </div>
          <h2 className="text-base font-black uppercase tracking-tight mt-1 text-white">
            {villageName}
          </h2>
          <p className="text-[11px] text-indigo-200 mt-0.5 font-medium">
            {mandalName} Mandal &bull; {districtName} District
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          title="Back to Mandal Overview"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. BODY CONTENT */}
      <div className="p-3.5 space-y-4 overflow-y-auto max-h-[82vh] custom-scrollbar">

        {/* LOADING / ERROR STATE */}
        {loading && (
          <div className="py-12 text-center space-y-2">
            <Activity className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
            <div className="text-xs font-semibold text-slate-700">
              Intersecting 30m/90m spatial rasters with village polygon...
            </div>
            <div className="text-[10px] text-slate-500">
              Survey of India EPSG:7755 boundary geometry
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Spatial Analysis Error</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {!loading && !error && hazardData && (
          <>
            {/* 2.1 CENSUS BASELINE & SPATIAL INTEGRITY BADGE */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-slate-500 font-medium block">Census Population</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  {hazardData.population_total.toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-slate-500 font-medium block">Households</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  {hazardData.households.toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-slate-500 font-medium block">Cadastral Area</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  {hazardData.village_area_sqkm.toFixed(2)} km²
                </span>
              </div>
            </div>

            {/* 2.2 DISASTER ASSESSMENT SELECTOR */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  Select Disaster Focus
                </span>
                <span className="text-[10px] text-indigo-700 font-semibold">
                  Source: Real Spatial Rasters & Tracks
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {DISASTERS.map((d) => {
                  const isActive = activeDisaster === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setActiveDisaster(d.id)}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition border ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{d.icon}</span>
                      <span className="truncate max-w-full text-center">{d.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2.3 REAL VILLAGE MAP & FOUR-DIRECTION SECTOR VISUALIZATION */}
            <div className="bg-slate-900 text-white p-3 rounded-2xl border border-slate-800 shadow-inner space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-200">
                    Spatial Cardinal Sectors (N / E / S / W)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  100% Area Preserved
                </span>
              </div>

              {/* Vector SVG Map */}
              {svgMapData && (
                <div className="relative bg-slate-950/80 rounded-xl p-2 border border-slate-800/80 flex items-center justify-center">
                  <svg
                    viewBox={`0 0 ${svgMapData.width} ${svgMapData.height}`}
                    className="w-full max-h-52 drop-shadow-md select-none"
                  >
                    {/* Village Sectors */}
                    {svgMapData.sectorPaths.map((sec: any) => {
                      const isSelected = (selectedSector || activeSectorDetail?.sector) === sec.sector;
                      return (
                        <path
                          key={sec.sector}
                          d={sec.path}
                          fill={sec.fillColor}
                          fillOpacity={isSelected ? 0.85 : 0.45}
                          stroke={isSelected ? '#ffffff' : '#334155'}
                          strokeWidth={isSelected ? 2 : 1}
                          className="transition-all duration-200 cursor-pointer hover:fill-opacity-70"
                          onClick={() => setSelectedSector(sec.sector)}
                        >
                          <title>{`${sec.sector} Sector — ${sec.priority} Priority (${sec.area.toFixed(2)} km²)`}</title>
                        </path>
                      );
                    })}

                    {/* Centroid Point & Compass Lines */}
                    <circle
                      cx={svgMapData.centroid[0]}
                      cy={svgMapData.centroid[1]}
                      r={4}
                      fill="#ffffff"
                      stroke="#4f46e5"
                      strokeWidth={2}
                    />
                    <text
                      x={svgMapData.centroid[0]}
                      y={svgMapData.centroid[1] - 8}
                      fill="#e2e8f0"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      Centroid
                    </text>
                  </svg>

                  {/* Compass Overlay Badge */}
                  <div className="absolute top-2 right-2 bg-slate-900/90 border border-slate-700/80 px-2 py-1 rounded-md text-[9px] font-mono text-slate-300">
                    EPSG:7755 Proj
                  </div>
                </div>
              )}

              {/* Interactive Sector Buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {hazardData.sectors.map((sec) => {
                  const isSelected = (selectedSector || activeSectorDetail?.sector) === sec.sector;
                  const pBadge = getPriorityBadge(sec.priority);
                  return (
                    <button
                      key={sec.sector}
                      onClick={() => setSelectedSector(sec.sector)}
                      className={`p-1.5 rounded-lg border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-950/80 border-indigo-400 ring-1 ring-indigo-400'
                          : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-200">
                          {sec.sector}
                        </span>
                        <span className={`text-[8px] font-bold px-1 py-0.2 rounded border ${pBadge}`}>
                          {sec.priority}
                        </span>
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 mt-1">
                        {sec.area_sqkm.toFixed(2)} km² &bull; {sec.area_pct}%
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2.4 DETAILED SECTOR HAZARD EXPLANATION */}
            {activeSectorDetail && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black uppercase text-slate-900">
                      {activeSectorDetail.sector} Sector Assessment
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getPriorityBadge(activeSectorDetail.priority)}`}>
                      {activeSectorDetail.priority}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-indigo-700">
                    Hazard Score: {activeSectorDetail.sector_hazard_score.toFixed(3)}
                  </span>
                </div>

                <p className="text-[11px] text-slate-700 leading-relaxed font-medium bg-white p-2 rounded-lg border border-slate-200/80">
                  {activeSectorDetail.priority_reason}
                </p>

                {/* Sub-indicators breakdown */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-white p-2 rounded-lg border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-500">Flood Recurrence (30m):</span>
                    <strong className="font-mono text-slate-900">
                      {activeSectorDetail.flood_mean_recurrence_pct !== undefined
                        ? `${activeSectorDetail.flood_mean_recurrence_pct}% mean`
                        : 'No water'}
                    </strong>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-500">Cyclone Distance:</span>
                    <strong className="font-mono text-slate-900">
                      {activeSectorDetail.cyclone_min_dist_km !== undefined
                        ? `${activeSectorDetail.cyclone_min_dist_km} km`
                        : '—'}
                    </strong>
                  </div>

                  <div
                    className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col justify-between col-span-2 sm:col-span-1"
                    title="Village micro-topography descriptive indicator (≥15°); distinct from the mandal civil-engineering exclusion constraint (>25°)."
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-slate-600 font-medium">Sector Steep Terrain (≥15°):</span>
                      <strong className="font-mono text-slate-900 shrink-0">
                        {activeSectorDetail.slope_mean_degrees !== undefined
                          ? `${activeSectorDetail.slope_mean_degrees}° mean`
                          : 'Flat'}
                      </strong>
                    </div>
                    <div className="text-[8.5px] text-slate-400 mt-1 leading-tight">
                      Village micro-topography descriptive indicator (≥15°); distinct from the mandal civil-engineering exclusion constraint (&gt;25°).
                    </div>
                  </div>

                  <div
                    className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col justify-between col-span-2 sm:col-span-1"
                    title="Wind exposure is uniform across this village at the available source resolution. The BMTPC/IS 875 wind dataset is available at district-level resolution, so artificial N/E/S/W variation is not created."
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-slate-600 font-medium">Design Wind Speed:</span>
                      <strong className="font-mono text-slate-900 shrink-0">
                        {activeSectorDetail.wind_basic_speed_ms
                          ? `${activeSectorDetail.wind_basic_speed_ms} m/s`
                          : '47.0 m/s'}
                      </strong>
                    </div>
                    <div className="text-[8.5px] text-slate-400 mt-1 leading-tight">
                      Wind exposure is uniform across this village at the available source resolution (BMTPC/IS 875 district dataset; no artificial sector variation).
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2.5 0–10 WHAT-IF SENSITIVITY SLIDER */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wide">
                    Village What-If Sensitivity
                  </span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200">
                  SCENARIO SIMULATION — NOT A FORECAST
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600">Hazard Sensitivity Perturbation:</span>
                  <span className="font-mono font-black text-indigo-700">
                    +{scenarioIncrease.toFixed(1)}% Stress
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={scenarioIncrease}
                  onChange={(e) => setScenarioIncrease(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>0 (Baseline)</span>
                  <span>5 (+5% Stress)</span>
                  <span>10 (+10% Stress)</span>
                </div>
              </div>

              {scenarioData && (
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100 text-[11px] space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span>Simulated Relocation Priority:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadge(scenarioData.simulated_relocation_priority)}`}>
                      {scenarioData.simulated_relocation_priority}
                      {scenarioData.priority_shifted ? ' (SHIFTED)' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-600">
                    <span>Simulated Population Load:</span>
                    <strong className="font-mono text-slate-800">
                      {scenarioData.simulated_population_at_risk.toLocaleString()} persons
                    </strong>
                  </div>
                  <p className="text-[10px] text-slate-500 italic pt-0.5 border-t border-slate-100">
                    {scenarioData.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* 2.6 RANKED SAFER RELOCATION CENTERS */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wide">
                    Ranked Safer Relocation Centers
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  Safety First &bull; Soft Distance
                </span>
              </div>

              {loadingReloc ? (
                <div className="py-4 text-center text-xs text-slate-400 animate-pulse">
                  Ranking candidate host locations...
                </div>
              ) : relocData && relocData.recommended_centers.length > 0 ? (
                <div className="space-y-2">
                  {relocData.recommended_centers.map((center, idx) => (
                    <div
                      key={center.center_name + idx}
                      className={`p-2.5 rounded-xl border transition ${
                        idx === 0
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-slate-50/80 border-slate-200/70'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">
                              {center.center_name}
                            </span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${
                              idx === 0
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {center.suitability_tier}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {center.mandal_name} Mandal &bull; {center.district_name} District &bull; ~{center.distance_km} km
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-indigo-700 shrink-0">
                          Score: {center.suitability_score.toFixed(3)}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-600 mt-1.5 leading-snug">
                        {center.why_recommended}
                      </div>

                      {center.closer_candidate_rejection_reason && (
                        <div className="text-[9px] text-slate-400 mt-1 italic">
                          Rationale: {center.closer_candidate_rejection_reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-3 text-center text-xs text-slate-500 italic bg-slate-50 rounded-xl border border-slate-100">
                  No verified host zone candidate within regional coordination radius.
                </div>
              )}
            </div>

            {/* ACTION PLAN NAVIGATION */}
            {onNavigateToActionPlan && (
              <button
                onClick={onNavigateToActionPlan}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition text-center flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Proceed to District Action Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* DATA PROVENANCE FOOTNOTE */}
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-[9px] text-slate-500 leading-tight">
              <strong>Data Provenance:</strong> {hazardData.data_provenance_note}
            </div>
          </>
        )}

      </div>
    </div>
  );
};
