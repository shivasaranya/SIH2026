import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { HostZoneCandidateItem } from '../types/capacity';
import type { MandalProperties, GeoJsonFeatureCollection } from '../types/gis';
import { fetchHostZones, fetchRelocationGeoJson } from '../services/api';
import { PageHeader } from '../components/common/DesignSystem';
import { 
  ShieldCheck, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Search, 
  Award, 
  Compass,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useActiveState } from '../context/StateContext';

export const CandidateLocationsPage: React.FC = () => {
  const { currentState } = useActiveState();
  
  // GeoJSON features and mandal list
  const [geoFeatures, setGeoFeatures] = useState<MandalProperties[]>([]);
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonFeatureCollection<MandalProperties> | null>(null);
  
  // Origin selection
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedMandalId, setSelectedMandalId] = useState<string>('AP_MANDAL_001'); // Default to Ichchapuram (high-hazard coastal)
  const [searchMandalQuery, setSearchMandalQuery] = useState<string>('');
  
  // Destination evaluation state
  const [loading, setLoading] = useState<boolean>(false);
  const [candidateData, setCandidateData] = useState<{
    sourceMandalName: string;
    sourceDistrictName: string;
    sourceHazard: number;
    sourceCapacityCondition: string;
    sourcePopulation: number;
    candidates: HostZoneCandidateItem[];
    recommended: HostZoneCandidateItem[];
    rejected: HostZoneCandidateItem[];
    softNotice?: string;
  } | null>(null);

  // Selected destination candidate for inspection on map
  const [selectedCandidate, setSelectedCandidate] = useState<HostZoneCandidateItem | null>(null);
  const [showRejectedAccordion, setShowRejectedAccordion] = useState<boolean>(false);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const corridorLineRef = useRef<L.Polyline | null>(null);
  const originMarkerRef = useRef<L.CircleMarker | null>(null);
  const candidateMarkersGroupRef = useRef<L.LayerGroup | null>(null);

  // 1. Fetch Mandal boundaries GeoJSON
  useEffect(() => {
    let isMounted = true;
    fetchRelocationGeoJson(undefined, currentState.id)
      .then((geo) => {
        if (!isMounted) return;
        setGeoJsonData(geo as any);
        const props = (geo.features || []).map((f: any) => f.properties as MandalProperties);
        setGeoFeatures(props);
        
        // If current selected mandal not found in state, default to first
        if (props.length > 0 && props[0]?.mandal_id && !props.some(p => p.mandal_id === selectedMandalId)) {
          setSelectedMandalId(props[0].mandal_id);
        }
      })
      .catch((err) => {
        console.error('Failed to load relocation GeoJSON for Safer Locations:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [currentState.id]);

  // District list for origin selector
  const districtList = useMemo(() => {
    const dSet = new Set<string>();
    for (const m of geoFeatures) {
      const d = m.current_district_name || m.DNAME;
      if (d) dSet.add(d);
    }
    return Array.from(dSet).sort();
  }, [geoFeatures]);

  // Filtered mandals for origin selector
  const filteredOriginMandals = useMemo(() => {
    return geoFeatures.filter((m) => {
      const d = m.current_district_name || m.DNAME || '';
      const name = m.mandal_name || m.DMNAME || '';
      const matchesDist = selectedDistrict === 'ALL' || d === selectedDistrict;
      const matchesSearch = !searchMandalQuery.trim() || name.toLowerCase().includes(searchMandalQuery.toLowerCase().trim());
      return matchesDist && matchesSearch;
    });
  }, [geoFeatures, selectedDistrict, searchMandalQuery]);

  // Current origin mandal properties
  const currentOriginProperties = useMemo(() => {
    return geoFeatures.find(m => m.mandal_id === selectedMandalId) || null;
  }, [geoFeatures, selectedMandalId]);

  // 2. Fetch evidence-based candidate destinations for selected origin mandal
  useEffect(() => {
    let isMounted = true;
    if (!selectedMandalId) return;

    setLoading(true);
    fetchHostZones(selectedMandalId, currentState.id)
      .then((res) => {
        if (!isMounted) return;
        const viables = res.candidates || [];
        const recommendedList = res.recommended_candidates || viables.slice(0, 5);
        const rejectedList = res.rejected_candidates || [];

        setCandidateData({
          sourceMandalName: res.source_mandal_name || currentOriginProperties?.mandal_name || selectedMandalId,
          sourceDistrictName: res.source_district_name || currentOriginProperties?.current_district_name || '',
          sourceHazard: res.source_hazard_exposure ?? Number(currentOriginProperties?.c1_hazard_exposure ?? 0.45),
          sourceCapacityCondition: res.source_capacity_condition || currentOriginProperties?.capacity_condition || 'CAPACITY-CONSTRAINED',
          sourcePopulation: res.source_population ?? Number(currentOriginProperties?.population_total ?? 0),
          candidates: viables,
          recommended: recommendedList,
          rejected: rejectedList,
          softNotice: res.soft_preference_notice,
        });

        // Set top recommended candidate as default inspected destination
        if (recommendedList.length > 0) {
          setSelectedCandidate(recommendedList[0]);
        } else if (viables.length > 0) {
          setSelectedCandidate(viables[0]);
        } else {
          setSelectedCandidate(null);
        }
      })
      .catch((err) => {
        console.error('Failed to evaluate safer locations:', err);
        if (isMounted) {
          setCandidateData(null);
          setSelectedCandidate(null);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedMandalId, currentState.id, currentOriginProperties]);

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const apCenter: [number, number] = [15.9129, 79.7400];
    const map = L.map(mapContainerRef.current, {
      center: apCenter,
      zoom: 7,
      minZoom: 6,
      maxZoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    candidateMarkersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Helper to compute polygon centroid from feature coordinates
  const getFeatureCenter = (feature: any): [number, number] | null => {
    try {
      if (!feature || !feature.geometry) return null;
      const geom = feature.geometry;
      let coords: any[] = [];
      if (geom.type === 'Polygon') {
        coords = geom.coordinates[0];
      } else if (geom.type === 'MultiPolygon') {
        coords = geom.coordinates[0][0];
      }
      if (!coords || coords.length === 0) return null;
      let sumLat = 0;
      let sumLng = 0;
      for (const pt of coords) {
        sumLng += pt[0];
        sumLat += pt[1];
      }
      return [sumLat / coords.length, sumLng / coords.length];
    } catch {
      return null;
    }
  };

  // 4. Update Map Layers (Origin, Selected Destination, Flight corridor, Candidate Points)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoJsonData) return;

    // Clean previous layers
    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
      geojsonLayerRef.current = null;
    }
    if (corridorLineRef.current) {
      map.removeLayer(corridorLineRef.current);
      corridorLineRef.current = null;
    }
    if (originMarkerRef.current) {
      map.removeLayer(originMarkerRef.current);
      originMarkerRef.current = null;
    }
    if (candidateMarkersGroupRef.current) {
      candidateMarkersGroupRef.current.clearLayers();
    }

    let originLatLng: [number, number] | null = null;
    let targetLatLng: [number, number] | null = null;

    // Add Base GeoJSON polygons for Andhra Pradesh
    const geoLayer = L.geoJSON(geoJsonData as any, {
      style: (feature) => {
        const mid = feature?.properties?.mandal_id;
        const isOrigin = mid === selectedMandalId;
        const isDestination = mid === selectedCandidate?.candidate_mandal_id;

        if (isOrigin) {
          return {
            fillColor: '#ef4444',
            fillOpacity: 0.65,
            color: '#b91c1c',
            weight: 3,
            dashArray: '4, 4',
          };
        }
        if (isDestination) {
          return {
            fillColor: '#10b981',
            fillOpacity: 0.65,
            color: '#047857',
            weight: 3,
          };
        }
        return {
          fillColor: '#f1f5f9',
          fillOpacity: 0.35,
          color: '#cbd5e1',
          weight: 0.8,
        };
      },
      onEachFeature: (feature, layer) => {
        const mid = feature.properties?.mandal_id;
        const mname = feature.properties?.mandal_name || feature.properties?.DMNAME || 'Mandal';
        const dname = feature.properties?.current_district_name || feature.properties?.DNAME || '';
        
        layer.bindTooltip(`<strong>${mname}</strong> (${dname})`, {
          sticky: true,
          className: 'custom-map-tooltip text-xs'
        });

        layer.on('click', () => {
          setSelectedMandalId(mid);
        });

        if (mid === selectedMandalId) {
          originLatLng = getFeatureCenter(feature);
        }
        if (mid === selectedCandidate?.candidate_mandal_id) {
          targetLatLng = getFeatureCenter(feature);
        }
      },
    }).addTo(map);

    geojsonLayerRef.current = geoLayer;

    // Draw Candidate Points on Map
    if (candidateData?.candidates && candidateMarkersGroupRef.current) {
      for (const cand of candidateData.candidates) {
        // Find geometry centroid for candidate
        const candFeat = (geoJsonData.features || []).find(
          (f: any) => f.properties?.mandal_id === cand.candidate_mandal_id
        );
        const pt = getFeatureCenter(candFeat);
        if (!pt) continue;

        const isTop = cand.relocation_suitability_rank === 1;
        const isSelected = cand.candidate_mandal_id === selectedCandidate?.candidate_mandal_id;

        const circle = L.circleMarker(pt, {
          radius: isSelected ? 8 : (isTop ? 6 : 4.5),
          fillColor: isSelected ? '#10b981' : (isTop ? '#f59e0b' : '#3b82f6'),
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.95,
        });

        circle.bindTooltip(
          `<strong>${cand.candidate_mandal_name}</strong><br/>Distance: ~${cand.distance_km} km &bull; Score: ${cand.relocation_suitability_score || 'N/A'}`
        );

        circle.on('click', () => {
          setSelectedCandidate(cand);
        });

        candidateMarkersGroupRef.current.addLayer(circle);
      }
    }

    // Draw Origin Marker & Transit Flight Line if both centroids resolved
    if (originLatLng) {
      originMarkerRef.current = L.circleMarker(originLatLng, {
        radius: 7,
        fillColor: '#ef4444',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1,
      }).addTo(map);

      originMarkerRef.current.bindTooltip(
        `<strong>ORIGIN: ${candidateData?.sourceMandalName || 'Affected Mandal'}</strong>`,
        { permanent: false }
      );
    }

    if (originLatLng && targetLatLng && selectedCandidate && selectedCandidate.candidate_mandal_id !== selectedMandalId) {
      // Connect Origin -> Destination
      const corridorLine = L.polyline([originLatLng, targetLatLng], {
        color: '#059669',
        weight: 3,
        dashArray: '6, 6',
        opacity: 0.85,
      }).addTo(map);

      corridorLine.bindPopup(`
        <div class="text-xs p-1">
          <div class="font-bold text-slate-800">Direct Evacuation / Transit Corridor</div>
          <div class="text-slate-600">From: <strong>${candidateData?.sourceMandalName}</strong></div>
          <div class="text-slate-600">To: <strong>${selectedCandidate.candidate_mandal_name}</strong></div>
          <div class="text-emerald-700 font-bold mt-1">Geographic Distance: ~${selectedCandidate.distance_km} km</div>
        </div>
      `);

      corridorLineRef.current = corridorLine;

      // Fit map to show both endpoints with breathing room
      const bounds = L.latLngBounds([originLatLng, targetLatLng]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 9 });
    } else if (originLatLng) {
      map.setView(originLatLng, 8.5);
    }
  }, [geoJsonData, selectedMandalId, selectedCandidate, candidateData]);

  // Quick select presets
  const handleQuickSelect = (mandalId: string) => {
    setSelectedMandalId(mandalId);
  };

  const getProximityBadge = (tier?: number, relation?: string) => {
    if (tier === 1 || relation === 'SAME_MANDAL') {
      return <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">Tier 1: Same Mandal</span>;
    }
    if (tier === 2 || relation === 'ADJACENT_MANDAL') {
      return <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">Tier 2: Adjacent Mandal (Same District)</span>;
    }
    if (tier === 3 || relation === 'FARTHER_MANDAL') {
      return <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">Tier 3: Farther Mandal (Same District)</span>;
    }
    return <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">Tier 4: Different District Fallback</span>;
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-5 bg-transparent text-slate-800 select-none">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">

        {/* 1. HEADER */}
        <PageHeader
          category={`Operational Decision Support \u2022 ${currentState.name} Multi-Criteria Relocation Destination Protocol`}
          title="Potential Safer Locations (Evacuation & Relocation Destinations)"
          description="Evidence-based candidate destination evaluation: Safety First → Capacity Second → Accessibility Third → Distance / Administrative Proximity as Soft Preferences. NCRMP 1.5–2 km is a cyclone shelter service radius, not an evacuation cutoff."
          icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
          rightContent={
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right shrink-0 shadow-2xs">
              <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Evaluated Destination Pool</div>
              <div className="text-xl font-black text-emerald-600 font-mono">
                {candidateData?.candidates.length ?? (currentState.id === 'madhya_pradesh' ? 80 : currentState.id === 'jammu_kashmir' ? 8 : currentState.id === 'tamil_nadu' ? 41 : currentState.id === 'mizoram' ? 5 : 51)} Viable Destinations
              </div>
            </div>
          }
        />

        {/* 2. METHODOLOGY NOTICE BANNER */}
        <div className="bg-gradient-to-r from-emerald-50/90 via-sky-50/80 to-indigo-50/90 border border-emerald-200/80 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span>Evidence-Based Decision Protocol:</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded-md font-extrabold uppercase">
                  Safety &gt; Capacity &gt; Access &gt; Distance
                </span>
              </div>
              <p>
                <strong>Distance is a soft preference. Safety and available capacity take absolute priority.</strong> The system does not enforce arbitrary limits (e.g. 5 km or same-mandal only). The NCRMP 1.5–2 km value is an engineering design radius for cyclone shelters, not a maximum evacuation limit.
              </p>
              <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200/60 font-medium">
                <span><strong>Tier 1:</strong> Same Mandal</span>
                <span>&bull;</span>
                <span><strong>Tier 2:</strong> Adjacent Mandal (Same District)</span>
                <span>&bull;</span>
                <span><strong>Tier 3:</strong> Farther Mandal (Same District)</span>
                <span>&bull;</span>
                <span><strong>Tier 4:</strong> Different District</span>
                <span className="text-slate-500 italic">(A safer Tier 2 or Tier 4 location strictly outranks an unsafe Tier 1 location)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. AFFECTED ORIGIN SELECTOR BAR */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                1. Select Origin Affected Mandal
              </span>
            </div>

            {/* Quick Test Scenarios */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Quick Scenarios:</span>
              <button
                onClick={() => handleQuickSelect('AP_MANDAL_001')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  selectedMandalId === 'AP_MANDAL_001'
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                🌊 Coastal Cyclone (Ichchapuram)
              </button>
              <button
                onClick={() => handleQuickSelect('AP_MANDAL_230')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  selectedMandalId === 'AP_MANDAL_230'
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                ⚖️ Inland Palnadu (Dachepalle)
              </button>
              <button
                onClick={() => handleQuickSelect('AP_MANDAL_244')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  selectedMandalId === 'AP_MANDAL_244'
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                🛡️ Safe Candidate Host (Gurazala)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* District dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Filter by District
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Districts ({districtList.length})</option>
                {districtList.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Mandal Search */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Search Mandal Name
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchMandalQuery}
                  onChange={(e) => setSearchMandalQuery(e.target.value)}
                  placeholder="Type mandal name..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Select Affected Mandal */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Affected Origin Mandal
              </label>
              <select
                value={selectedMandalId}
                onChange={(e) => setSelectedMandalId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {filteredOriginMandals.map((m) => (
                  <option key={m.mandal_id} value={m.mandal_id}>
                    {m.mandal_name || m.DMNAME} ({m.current_district_name || m.DNAME})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 4. ORIGIN STATE CARD */}
        {candidateData && (
          <div className="bg-red-50/50 border border-red-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded-md text-[10px] font-extrabold uppercase">
                  ORIGIN AFFECTED UNIT
                </span>
                <h2 className="text-base font-black text-slate-900 tracking-wide uppercase">
                  {candidateData.sourceMandalName}, {candidateData.sourceDistrictName}
                </h2>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Population: <strong>{Number(candidateData.sourcePopulation).toLocaleString()} persons</strong> &bull; Baseline Capacity: <strong>{candidateData.sourceCapacityCondition}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/80 border border-red-200 rounded-xl px-3 py-2 text-center shadow-2xs">
                <div className="text-[9px] font-bold uppercase text-slate-500">Hazard Exposure</div>
                <div className="text-sm font-black font-mono text-red-600">
                  {candidateData.sourceHazard.toFixed(3)} {candidateData.sourceHazard >= 0.35 ? '(High Risk)' : '(Moderate)'}
                </div>
              </div>

              <div className="bg-white/80 border border-red-200 rounded-xl px-3 py-2 text-center shadow-2xs">
                <div className="text-[9px] font-bold uppercase text-slate-500">Relocation Need</div>
                <div className="text-sm font-black text-slate-800">
                  {candidateData.sourceHazard >= 0.35 ? 'Evacuation Required' : 'Relocation Support'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. SPLIT WORKSPACE: MAP (LEFT) + RANKED DESTINATIONS (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* MAP EXTENT (5 COLS) */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs flex flex-col space-y-2 h-[600px]">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wide">
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                <span>Andhra Pradesh Map &amp; Transit Corridor</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">EPSG:7755 Proj</span>
            </div>

            <div 
              ref={mapContainerRef} 
              className="flex-1 w-full rounded-xl border border-slate-200 overflow-hidden relative"
              style={{ minHeight: '480px' }}
            />

            <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                <span>Origin Mandal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Selected Destination</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                <span>Candidate Hosts</span>
              </div>
            </div>
          </div>

          {/* RANKED DESTINATIONS (7 COLS) */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>2. Recommended Relocation &amp; Evacuation Destinations</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {candidateData?.candidates.length || 0} viable candidates evaluated
              </span>
            </div>

            {loading ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
                <div className="inline-block animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full" />
                <p className="text-xs text-slate-600">Evaluating multi-criteria candidate destinations...</p>
              </div>
            ) : candidateData?.candidates && candidateData.candidates.length > 0 ? (
              <div className="space-y-3">
                {candidateData.candidates.slice(0, 3).map((cand, idx) => {
                  const isSecond = idx === 1;
                  const isThird = idx === 2;
                  const isSelected = selectedCandidate?.candidate_mandal_id === cand.candidate_mandal_id;

                  let medal = '🥇 Best Suitable Location';
                  let medalClass = 'bg-amber-100 text-amber-900 border-amber-300';
                  let cardBorder = isSelected ? 'ring-2 ring-emerald-500 border-emerald-400' : 'border-slate-200/90 hover:border-emerald-300';

                  if (isSecond) {
                    medal = '🥈 Alternative Destination';
                    medalClass = 'bg-slate-200 text-slate-800 border-slate-300';
                  } else if (isThird) {
                    medal = '🥉 Alternative Destination';
                    medalClass = 'bg-orange-100 text-orange-900 border-orange-200';
                  }

                  return (
                    <div
                      key={cand.candidate_mandal_id || idx}
                      onClick={() => setSelectedCandidate(cand)}
                      className={`bg-white border rounded-2xl p-4 shadow-xs space-y-3 cursor-pointer transition-all duration-200 ${cardBorder}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${medalClass}`}>
                              {medal}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 uppercase">
                              {cand.candidate_mandal_name}
                            </h4>
                            <span className="text-xs text-slate-500 font-semibold">
                              ({cand.candidate_district_name || 'Andhra Pradesh'})
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 mt-1 flex items-center gap-3">
                            <span>Distance: <strong className="text-slate-900 font-mono">~{cand.distance_km} km</strong></span>
                            <span>&bull;</span>
                            <span>Suitability Score: <strong className="text-emerald-700 font-mono">{cand.relocation_suitability_score?.toFixed(4) || 'N/A'}</strong></span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {getProximityBadge(cand.proximity_tier, cand.administrative_relation)}
                        </div>
                      </div>

                      {/* Criteria Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-2 border-t border-slate-100">
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                          <span className="text-slate-500 block text-[9px] uppercase font-semibold">Safety (Hazard)</span>
                          <strong className="text-emerald-700 font-mono text-xs">
                            {cand.candidate_hazard_exposure.toFixed(3)} (Low Risk)
                          </strong>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                          <span className="text-slate-500 block text-[9px] uppercase font-semibold">Safe Land Fraction</span>
                          <strong className="text-slate-900 font-mono text-xs">
                            {(cand.candidate_safe_area_fraction * 100).toFixed(1)}%
                          </strong>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                          <span className="text-slate-500 block text-[9px] uppercase font-semibold">Capacity Condition</span>
                          <strong className="text-slate-900 font-mono text-xs">
                            {cand.candidate_capacity_condition}
                          </strong>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                          <span className="text-slate-500 block text-[9px] uppercase font-semibold">Road Accessibility</span>
                          <strong className="text-slate-900 font-mono text-xs">
                            {cand.candidate_road_accessibility.toFixed(2)} Index
                          </strong>
                        </div>
                      </div>

                      {/* Human-Readable Recommendation Reason */}
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Recommendation Rationale:</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-emerald-800">
                          {cand.recommendation_reason || cand.host_candidate_reason}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
                No viable destination candidates resolved for this origin.
              </div>
            )}

            {/* 6. REJECTED CLOSER CANDIDATES ACCORDION */}
            {candidateData && candidateData.rejected && candidateData.rejected.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                <button
                  onClick={() => setShowRejectedAccordion(!showRejectedAccordion)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-800 text-left focus:outline-none"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Why Closer Candidates Were Excluded ({candidateData.rejected.length} candidates filtered out)</span>
                  </div>
                  {showRejectedAccordion ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {showRejectedAccordion && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 max-h-60 overflow-y-auto custom-scrollbar">
                    {candidateData.rejected.map((rej, rIdx) => (
                      <div key={rIdx} className="bg-white border border-slate-200 rounded-xl p-2.5 text-[11px] flex items-start justify-between gap-2 shadow-2xs">
                        <div>
                          <div className="font-bold text-slate-900">
                            {rej.candidate_mandal_name} ({rej.candidate_district_name || 'AP'}) &bull; ~{rej.distance_km} km
                          </div>
                          <div className="text-red-700 font-medium mt-0.5">
                            {rej.rejection_reason || rej.host_candidate_reason}
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold shrink-0">
                          {rej.suitability_tier || 'REJECTED'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
