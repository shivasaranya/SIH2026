import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoJsonFeatureCollection, DistrictProperties, MandalProperties, DemographicMetricKey } from '../../types/gis';
import type { StateDemographicSummary } from '../../types/demographics';
import { getColorForValue, getMetricValue, getMandalMetricValue, METRIC_CONFIGS } from '../../utils/mapUtils';

interface GISMapProps {
  districtsGeoJson: GeoJsonFeatureCollection<DistrictProperties> | null;
  mandalsGeoJson: GeoJsonFeatureCollection<MandalProperties> | null;
  vulnerabilityGeoJson: GeoJsonFeatureCollection<MandalProperties> | null;
  demographicsSummary: StateDemographicSummary | null;
  activeMetric: DemographicMetricKey;
  selectedDistrictId: string | null;
  selectedMandal: MandalProperties | null;
  onSelectDistrict: (districtId: string | null) => void;
  onSelectMandal: (mandal: MandalProperties | null) => void;
  showMandals: boolean;
  showFloodWms: boolean;
  showSheltersWms: boolean;
  showHabitationsWms: boolean;
  resetViewTrigger: number;
  selectedState?: string;
}

const AP_CENTER: [number, number] = [15.9129, 79.74];
const AP_BOUNDS: [[number, number], [number, number]] = [
  [12.6, 76.7],
  [19.2, 84.8],
];

const GUJARAT_CENTER: [number, number] = [22.4164, 71.2855];
const GUJARAT_BOUNDS: [[number, number], [number, number]] = [
  [20.1205, 68.0950],
  [24.7124, 74.4761],
];

const KERALA_CENTER: [number, number] = [10.4500, 76.3500];
const KERALA_BOUNDS: [[number, number], [number, number]] = [
  [8.2500, 74.8500],
  [12.8500, 77.4500],
];

const MAHARASHTRA_CENTER: [number, number] = [19.7500, 75.7100];
const MAHARASHTRA_BOUNDS: [[number, number], [number, number]] = [
  [15.6000, 72.6000],
  [22.0500, 80.9500],
];

const HARYANA_CENTER: [number, number] = [29.0588, 76.0856];
const HARYANA_BOUNDS: [[number, number], [number, number]] = [
  [27.6500, 74.4700],
  [30.9300, 77.6000],
];

const PUNJAB_CENTER: [number, number] = [31.1471, 75.3412];
const PUNJAB_BOUNDS: [[number, number], [number, number]] = [
  [29.5400, 73.8800],
  [32.6600, 76.9500],
];

const CHHATTISGARH_CENTER: [number, number] = [21.2787, 81.8661];
const CHHATTISGARH_BOUNDS: [[number, number], [number, number]] = [
  [17.7800, 80.2400],
  [24.1000, 84.4000],
];

export const GISMap: React.FC<GISMapProps> = ({
  districtsGeoJson,
  mandalsGeoJson,
  vulnerabilityGeoJson,
  demographicsSummary,
  activeMetric,
  selectedDistrictId,
  selectedMandal,
  onSelectDistrict,
  onSelectMandal,
  showMandals,
  showFloodWms,
  showSheltersWms,
  showHabitationsWms,
  resetViewTrigger,
  selectedState = 'Andhra Pradesh',
}) => {
  const isGujarat = selectedState.toLowerCase().includes('gujarat');
  const isKerala = selectedState.toLowerCase().includes('kerala') || selectedState.toLowerCase().includes('kerela');
  const isMaharashtra = selectedState.toLowerCase().includes('maharashtra') || selectedState.toLowerCase().includes('maharastra') || selectedState.toLowerCase().includes('mh');
  const isHaryana = selectedState.toLowerCase().includes('haryana') || selectedState.toLowerCase() === 'hr';
  const isPunjab = selectedState.toLowerCase().includes('punjab') || selectedState.toLowerCase() === 'pb';
  const isChhattisgarh = selectedState.toLowerCase().includes('chhattisgarh') || selectedState.toLowerCase().includes('chhatisgarh') || selectedState.toLowerCase() === 'cg';
  const stateCenter = isChhattisgarh ? CHHATTISGARH_CENTER : (isPunjab ? PUNJAB_CENTER : (isHaryana ? HARYANA_CENTER : (isMaharashtra ? MAHARASHTRA_CENTER : (isKerala ? KERALA_CENTER : (isGujarat ? GUJARAT_CENTER : AP_CENTER)))));
  const stateBounds = isChhattisgarh ? CHHATTISGARH_BOUNDS : (isPunjab ? PUNJAB_BOUNDS : (isHaryana ? HARYANA_BOUNDS : (isMaharashtra ? MAHARASHTRA_BOUNDS : (isKerala ? KERALA_BOUNDS : (isGujarat ? GUJARAT_BOUNDS : AP_BOUNDS)))));

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const districtsLayerRef = useRef<L.GeoJSON | null>(null);
  const mandalsLayerRef = useRef<L.GeoJSON | null>(null);
  const vulnerabilityLayerRef = useRef<L.GeoJSON | null>(null);
  const floodWmsRef = useRef<L.TileLayer.WMS | null>(null);
  const sheltersWmsRef = useRef<L.TileLayer.WMS | null>(null);
  const habitationsWmsRef = useRef<L.TileLayer.WMS | null>(null);

  const isAnalyticalMode = [
    'topsis_score',
    'scenario_topsis_score',
    'priority_change',
    'vulnerability',
    'hazard_exposure',
    'demographic_sensitivity',
    'shelter_capacity',
    'road_density',
    'safe_area_fraction',
    'water_sanitation',
    'health_beds',
  ].includes(activeMetric);

  const isCapacityMetric = [
    'shelter_capacity',
    'road_density',
    'safe_area_fraction',
    'water_sanitation',
    'health_beds',
  ].includes(activeMetric);


  // Map of district_id -> demographic summary
  const demoByDistrictId = React.useMemo(() => {
    const map = new Map<string, any>();
    if (demographicsSummary?.districts) {
      for (const d of demographicsSummary.districts) {
        map.set(d.district_id, d);
      }
    }
    return map;
  }, [demographicsSummary]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: stateCenter,
      zoom: isGujarat ? 6 : 7,
      minZoom: 5,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    map.fitBounds(stateBounds, { padding: [10, 10] });
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Handle Reset View Trigger
  useEffect(() => {
    if (mapInstanceRef.current && resetViewTrigger > 0) {
      mapInstanceRef.current.fitBounds(stateBounds, { padding: [10, 10] });
      onSelectDistrict(null);
      onSelectMandal(null);
    }
  }, [resetViewTrigger, stateBounds, onSelectDistrict, onSelectMandal]);

  // Fit map bounds automatically whenever selectedState changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(stateBounds, { padding: [10, 10] });
    }
  }, [selectedState, stateBounds]);

  // 3. Render / Update 26 Districts Choropleth Layer (in Demographic Mode)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !districtsGeoJson) return;

    if (districtsLayerRef.current) {
      map.removeLayer(districtsLayerRef.current);
      districtsLayerRef.current = null;
    }

    // In analytical mode (Vulnerability/Hazard/Sensitivity), districts serve as subtle context boundary outlines
    const metricConfig = METRIC_CONFIGS[activeMetric];

    const layer = L.geoJSON(districtsGeoJson as any, {
      style: (feature) => {
        const did = feature?.properties?.district_id;
        const isSelected = did === selectedDistrictId;

        if (isAnalyticalMode) {
          return {
            fillColor: 'transparent',
            fillOpacity: 0,
            color: isSelected ? '#0284c7' : '#475569',
            weight: isSelected ? 2.5 : 1.2,
            opacity: 0.8,
          };
        }

        const summary = demoByDistrictId.get(did);
        const val = getMetricValue(activeMetric, summary);
        const fillColor = getColorForValue(val, activeMetric);

        return {
          fillColor,
          fillOpacity: isSelected ? 0.85 : 0.65,
          color: isSelected ? '#38bdf8' : '#64748b',
          weight: isSelected ? 3.0 : 1.2,
          opacity: isSelected ? 1.0 : 0.8,
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const did = feature?.properties?.district_id;
        const dname = feature?.properties?.district_name || 'District';
        const summary = demoByDistrictId.get(did);
        const val = getMetricValue(activeMetric, summary);
        const formattedVal = metricConfig.colorScale.formatter(val);

        if (!isAnalyticalMode) {
          featureLayer.bindTooltip(
            `<div class="p-1 text-xs">
              <strong class="text-sm font-bold text-white">${dname}</strong><br/>
              <span class="text-slate-300">${metricConfig.label}: </span>
              <strong class="text-emerald-400 font-mono">${formattedVal}</strong><br/>
              <span class="text-[10px] text-slate-400 font-mono">${summary ? `${summary.village_count} villages` : ''}</span>
            </div>`,
            { sticky: true, className: 'leaflet-custom-tooltip' }
          );
        }

        featureLayer.on({
          mouseover: (e) => {
            const target = e.target;
            if (did !== selectedDistrictId && !isAnalyticalMode) {
              target.setStyle({
                weight: 2.2,
                color: '#f8fafc',
                fillOpacity: 0.75,
              });
              target.bringToFront();
            }
          },
          mouseout: (e) => {
            const target = e.target;
            if (did !== selectedDistrictId && !isAnalyticalMode) {
              target.setStyle({
                weight: 1.2,
                color: '#64748b',
                fillOpacity: 0.65,
              });
            }
          },
          click: (e) => {
            if (!isAnalyticalMode) {
              L.DomEvent.stopPropagation(e);
              onSelectDistrict(did);
              const bounds = (featureLayer as any).getBounds();
              if (bounds && map) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
              }
            }
          },
        });
      },
    });

    layer.addTo(map);
    districtsLayerRef.current = layer;
  }, [districtsGeoJson, demoByDistrictId, activeMetric, selectedDistrictId, onSelectDistrict, isAnalyticalMode]);

  // 4. Render / Update Mandal Vulnerability Choropleth Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (vulnerabilityLayerRef.current) {
      map.removeLayer(vulnerabilityLayerRef.current);
      vulnerabilityLayerRef.current = null;
    }

    if (!isAnalyticalMode || !vulnerabilityGeoJson) return;

    const metricConfig = METRIC_CONFIGS[activeMetric];

    const layer = L.geoJSON(vulnerabilityGeoJson as any, {
      style: (feature) => {
        const props = feature?.properties;
        const isInsufficient =
          props?.relocation_priority_category === 'INSUFFICIENT-DATA' ||
          props?.ranking_status === 'INSUFFICIENT_DATA' ||
          props?.demographic_data_flag === 'ZERO_RURAL_CENSUS_HABITATIONS' ||
          Number(props?.population_total ?? 0) === 0 ||
          props?.topsis_score === undefined ||
          props?.topsis_score === null;

        let fillColor: string;
        if (activeMetric === 'topsis_score') {
          if (isInsufficient) {
            fillColor = '#475569'; // Neutral slate
          } else {
            const cat = props?.relocation_priority_category;
            if (cat === 'VERY HIGH') fillColor = '#dc2626'; // Red
            else if (cat === 'HIGH') fillColor = '#f59e0b'; // Amber
            else if (cat === 'MODERATE') fillColor = '#38bdf8'; // Sky Blue
            else if (cat === 'LOW') fillColor = '#10b981'; // Green
            else fillColor = getColorForValue(Number(props?.topsis_score ?? 0), 'topsis_score');
          }
        } else if (activeMetric === 'scenario_topsis_score') {
          if (isInsufficient) {
            fillColor = '#475569';
          } else {
            const cat = props?.scenario_category || props?.relocation_priority_category;
            if (cat === 'VERY HIGH') fillColor = '#dc2626';
            else if (cat === 'HIGH') fillColor = '#f59e0b';
            else if (cat === 'MODERATE') fillColor = '#38bdf8';
            else if (cat === 'LOW') fillColor = '#10b981';
            else fillColor = getColorForValue(Number(props?.scenario_topsis_score ?? props?.topsis_score ?? 0), 'scenario_topsis_score');
          }
        } else {
          const val = getMandalMetricValue(activeMetric, props);
          fillColor = getColorForValue(val, activeMetric);
        }

        const isSelected = selectedMandal && (
          selectedMandal.mandal_id === props?.mandal_id ||
          selectedMandal.mandal_name === props?.mandal_name
        );

        return {
          fillColor,
          fillOpacity: isSelected ? 0.92 : isInsufficient ? 0.45 : 0.75,
          color: isSelected ? '#ffffff' : '#1e293b',
          weight: isSelected ? 2.5 : 0.7,
          opacity: 0.85,
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const props = feature?.properties || {};
        const mname = props.mandal_name || props.DMNAME || 'Mandal';
        const dname = props.current_district_name || props.DNAME || 'District';
        const val = getMandalMetricValue(activeMetric, props);
        const formattedVal = metricConfig.colorScale.formatter(val);

        const isInsufficient =
          props.relocation_priority_category === 'INSUFFICIENT-DATA' ||
          props.ranking_status === 'INSUFFICIENT_DATA' ||
          props.demographic_data_flag === 'ZERO_RURAL_CENSUS_HABITATIONS' ||
          Number(props.population_total ?? 0) === 0;

        const isRelocMetric = activeMetric === 'topsis_score' || activeMetric === 'scenario_topsis_score' || activeMetric === 'priority_change';
        const relocCat = props.relocation_priority_category || (isInsufficient ? 'INSUFFICIENT-DATA' : 'MODERATE');
        const relocRank = props.relocation_priority_rank ? `#${props.relocation_priority_rank} of 680 Mandals` : 'Excluded (Insufficient Data)';
        const topsis = isInsufficient ? 'N/A' : Number(props.topsis_score ?? 0).toFixed(4);
        const c1 = Number(props.c1_hazard_exposure ?? props.hazard_exposure_index ?? 0).toFixed(3);
        const c2 = Number(props.c2_demographic_sensitivity ?? props.demographic_sensitivity_index ?? 0).toFixed(3);
        const c3 = Number(props.c3_capacity_stress ?? 0.4).toFixed(3);
        const c4 = Number(props.c4_accessibility_constraint ?? 0.3).toFixed(3);

        const hazIdx = Number(props.hazard_exposure_index ?? 0).toFixed(3);
        const demoIdx = Number(props.demographic_sensitivity_index ?? 0).toFixed(3);
        const vulnIdx = Number(props.vulnerability_index ?? 0).toFixed(3);
        const ewp = Number(props.exposure_weighted_population ?? 0).toLocaleString();
        const pop = Number(props.population_total ?? 0).toLocaleString();
        const quad = props.priority_quadrant || 'N/A';
        const hazCat = props.hazard_category || 'N/A';
        const vulnCat = props.vulnerability_category || 'N/A';

        const shelterCap = props.verified_shelter_capacity_persons ? props.verified_shelter_capacity_persons.toLocaleString() : '0';
        const shelterRate = props.shelter_capacity_per_1000 ? `${Number(props.shelter_capacity_per_1000).toFixed(1)}/1k` : '0.0/1k';
        const roadDens = props.road_density_km_per_km2 ? `${Number(props.road_density_km_per_km2).toFixed(2)} km/km²` : '0 km/km²';
        const safeArea = props.safe_area_fraction ? `${(Number(props.safe_area_fraction) * 100).toFixed(1)}%` : '0%';

        const tooltipBody = isRelocMetric
          ? `<div class="space-y-0.5 text-[11px]">
              <div class="flex justify-between">
                <span class="text-slate-400">Planning Priority:</span>
                <strong class="${relocCat === 'VERY HIGH' ? 'text-rose-400' : relocCat === 'HIGH' ? 'text-amber-400' : relocCat === 'MODERATE' ? 'text-sky-400' : relocCat === 'LOW' ? 'text-emerald-400' : 'text-slate-400'} font-bold">${relocCat}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Statewide Rank:</span>
                <strong class="text-white font-mono">${relocRank}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">TOPSIS Score:</span>
                <strong class="text-emerald-400 font-mono">${topsis}</strong>
              </div>
              <div class="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700">
                <span>C1 Haz: ${c1}</span>
                <span>C2 Demo: ${c2}</span>
                <span>C3 Cap: ${c3}</span>
                <span>C4 Acc: ${c4}</span>
              </div>
            </div>`
          : isCapacityMetric
          ? `<div class="space-y-0.5 text-[11px]">
              <div class="flex justify-between">
                <span class="text-slate-400">Designated Shelter Cap:</span>
                <strong class="text-emerald-400 font-mono">${shelterCap} (${shelterRate})</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Road Density (Proxy):</span>
                <strong class="text-sky-400 font-mono">${roadDens}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Safe Habitable Area:</span>
                <strong class="text-amber-300 font-mono">${safeArea}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Census 2011 Pop:</span>
                <span class="text-slate-200 font-mono">${pop}</span>
              </div>
            </div>`
          : `<div class="space-y-0.5 text-[11px]">
              <div class="flex justify-between">
                <span class="text-slate-400">Vulnerability (Vi):</span>
                <strong class="text-emerald-400 font-mono">${vulnIdx} (${vulnCat})</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Hazard Exposure (Hi):</span>
                <strong class="text-sky-400 font-mono">${hazIdx} (${hazCat})</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Sensitivity (Di):</span>
                <strong class="text-purple-400 font-mono">${demoIdx}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Exposure-Weighted Pop:</span>
                <strong class="text-amber-300 font-mono">${ewp}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Census 2011 Pop:</span>
                <span class="text-slate-200 font-mono">${pop}</span>
              </div>
            </div>`;

        featureLayer.bindTooltip(
          `<div class="p-1.5 text-xs min-w-[200px]">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1 mb-1">
              <strong class="text-sm font-bold text-white">${mname}</strong>
              <span class="text-[10px] text-slate-400 font-mono">${props.mandal_id || ''}</span>
            </div>
            <div class="text-[11px] text-slate-300 mb-1 flex justify-between">
              <span>${dname}</span>
              <span class="text-emerald-400 font-mono font-semibold">${metricConfig.label}: ${formattedVal}</span>
            </div>
            
            ${tooltipBody}

            <div class="mt-1.5 pt-1 border-t border-slate-700 text-[10px] text-amber-300 font-medium">
              ${isRelocMetric ? 'Phase 4 TOPSIS Multi-Criteria Decision Model' : isCapacityMetric ? 'Phase 3B Physical Carrying Capacity' : quad}
            </div>
          </div>`,
          { sticky: true, className: 'leaflet-custom-tooltip' }
        );


        featureLayer.on({
          mouseover: (e) => {
            const target = e.target;
            target.setStyle({
              weight: 2.2,
              color: '#38bdf8',
              fillOpacity: 0.9,
            });
            target.bringToFront();
          },
          mouseout: (e) => {
            const target = e.target;
            const isSelected = selectedMandal && (
              selectedMandal.mandal_id === props.mandal_id ||
              selectedMandal.mandal_name === props.mandal_name
            );
            target.setStyle({
              weight: isSelected ? 2.5 : 0.7,
              color: isSelected ? '#ffffff' : '#1e293b',
              fillOpacity: isSelected ? 0.9 : 0.72,
            });
          },
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            onSelectMandal(props);
            const bounds = (featureLayer as any).getBounds();
            if (bounds && map) {
              map.fitBounds(bounds, { padding: [60, 60], maxZoom: 11 });
            }
          },
        });
      },
    });

    layer.addTo(map);
    vulnerabilityLayerRef.current = layer;
  }, [vulnerabilityGeoJson, activeMetric, selectedMandal, onSelectMandal, isAnalyticalMode]);

  // 5. Render / Toggle Mandals Boundaries Vector Layer (when in Demographic mode)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (mandalsLayerRef.current) {
      map.removeLayer(mandalsLayerRef.current);
      mandalsLayerRef.current = null;
    }

    if (isAnalyticalMode || !showMandals || !mandalsGeoJson) return;

    const layer = L.geoJSON(mandalsGeoJson as any, {
      style: {
        color: '#94a3b8',
        weight: 0.8,
        opacity: 0.6,
        fillColor: '#334155',
        fillOpacity: 0.05,
      },
      onEachFeature: (feature, featureLayer) => {
        const props = feature?.properties || {};
        const mname = props.mandal_name || props.DMNAME || 'Mandal';
        const dname = props.current_district_name || 'District';

        featureLayer.bindTooltip(
          `<div class="text-xs">
            <strong>${mname}</strong>
            <div class="text-[10px] text-slate-400">${dname}</div>
          </div>`,
          { sticky: true }
        );

        featureLayer.on({
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            onSelectMandal(props);
          },
        });
      },
    });

    layer.addTo(map);
    mandalsLayerRef.current = layer;
  }, [mandalsGeoJson, showMandals, isAnalyticalMode, onSelectMandal]);

  // 6. Manage APSAC WMS Overlays
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // A. Flood Inundation WMS
    if (showFloodWms && !floodWmsRef.current) {
      floodWmsRef.current = L.tileLayer.wms('https://apsac.ap.gov.in/geoserver/gatishakti/wms', {
        layers: 'gatishakti_Michaung_Flood_Inundation',
        format: 'image/png',
        transparent: true,
        opacity: 0.7,
        attribution: 'APSAC Flood Hazard GIS',
      } as any).addTo(map);
    } else if (!showFloodWms && floodWmsRef.current) {
      map.removeLayer(floodWmsRef.current);
      floodWmsRef.current = null;
    }

    // B. Cyclone Shelters WMS
    if (showSheltersWms && !sheltersWmsRef.current) {
      sheltersWmsRef.current = L.tileLayer.wms('https://apsac.ap.gov.in/geoserver/gatishakti/wms', {
        layers: 'gatishakti_cycloneshelter',
        format: 'image/png',
        transparent: true,
        opacity: 0.85,
        attribution: 'APSAC Cyclone Shelter Infrastructure',
      } as any).addTo(map);
    } else if (!showSheltersWms && sheltersWmsRef.current) {
      map.removeLayer(sheltersWmsRef.current);
      sheltersWmsRef.current = null;
    }

    // C. Habitations WMS
    if (showHabitationsWms && !habitationsWmsRef.current) {
      habitationsWmsRef.current = L.tileLayer.wms('https://apsac.ap.gov.in/geoserver/gatishakti/wms', {
        layers: 'gatishakti_habitation',
        format: 'image/png',
        transparent: true,
        opacity: 0.75,
        attribution: 'APSAC Rural Habitations',
      } as any).addTo(map);
    } else if (!showHabitationsWms && habitationsWmsRef.current) {
      map.removeLayer(habitationsWmsRef.current);
      habitationsWmsRef.current = null;
    }
  }, [showFloodWms, showSheltersWms, showHabitationsWms]);

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-100 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};

