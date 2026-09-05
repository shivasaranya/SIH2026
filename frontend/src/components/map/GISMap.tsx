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
  priorityFilter?: 'VERY_HIGH' | 'MODERATE' | 'LOW' | null;
}

import { useActiveState } from '../../context/StateContext';

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
  priorityFilter = null,
}) => {
  const { currentState } = useActiveState();
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

  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const fitToStateBounds = (targetMap: L.Map, animated: boolean = false) => {
    let bounds: L.LatLngBounds | null = null;
    if (vulnerabilityLayerRef.current && vulnerabilityLayerRef.current.getLayers().length > 0) {
      const b = vulnerabilityLayerRef.current.getBounds();
      if (b.isValid()) bounds = b;
    }
    if (!bounds && districtsLayerRef.current && districtsLayerRef.current.getLayers().length > 0) {
      const b = districtsLayerRef.current.getBounds();
      if (b.isValid()) bounds = b;
    }
    const targetBounds = bounds || L.latLngBounds(currentState.bounds);
    targetMap.fitBounds(targetBounds, {
      padding: [16, 16],
      animate: animated,
      maxZoom: 8.5,
    });
  };

  // 1. Initialize Leaflet Map with genuine open, keyless light basemap
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: currentState.center,
      zoom: 7,
      minZoom: 5.5,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.1,
      zoomDelta: 0.5,
    });

    // Standard OpenStreetMap - completely open, genuinely accessible, no API key required
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
    }).addTo(map);

    // Dedicated panes to guarantee correct visual stacking order:
    // districtsPane (zIndex 400), mandalsPane (zIndex 450), markersPane (zIndex 470)
    map.createPane('districtsPane');
    const dPane = map.getPane('districtsPane');
    if (dPane) dPane.style.zIndex = '400';

    map.createPane('mandalsPane');
    const mPane = map.getPane('mandalsPane');
    if (mPane) mPane.style.zIndex = '450';

    map.createPane('markersPane');
    const mkPane = map.getPane('markersPane');
    if (mkPane) mkPane.style.zIndex = '470';

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Initially show complete state with comfortable padding
    fitToStateBounds(map, false);
    mapInstanceRef.current = map;

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        fitToStateBounds(mapInstanceRef.current, false);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Handle Reset View Trigger (Comfortably show complete state with padding)
  const prevResetTriggerRef = useRef(resetViewTrigger);
  useEffect(() => {
    if (resetViewTrigger > 0 && resetViewTrigger !== prevResetTriggerRef.current) {
      prevResetTriggerRef.current = resetViewTrigger;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        fitToStateBounds(mapInstanceRef.current, true);
      }
    }
  }, [resetViewTrigger]);

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
      pane: 'districtsPane',
      interactive: !isAnalyticalMode,
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

  // 4. Render / Update Mandal Vector Layer (Neutral Boundaries or Choropleth for other metrics)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (vulnerabilityLayerRef.current) {
      map.removeLayer(vulnerabilityLayerRef.current);
      vulnerabilityLayerRef.current = null;
    }

    if (!isAnalyticalMode || !vulnerabilityGeoJson) return;

    const isRelocationPriority = activeMetric === 'topsis_score' || activeMetric === 'scenario_topsis_score';

    const layer = L.geoJSON(vulnerabilityGeoJson as any, {
      pane: 'mandalsPane',
      interactive: true,
      style: (feature) => {
        const props = feature?.properties || {};
        const isSelected = selectedMandal && (
          selectedMandal.mandal_id === props?.mandal_id ||
          selectedMandal.mandal_name === props?.mandal_name
        );

        // In Relocation Priority mode: Visibly colored mandal polygons (Red / Yellow / Green / Neutral)
        if (isRelocationPriority) {
          const pop = Number(props.population_total ?? 0);
          const isInsufficient =
            props.relocation_priority_category === 'INSUFFICIENT-DATA' ||
            props.ranking_status === 'INSUFFICIENT_DATA' ||
            props.demographic_data_flag === 'ZERO_RURAL_CENSUS_HABITATIONS' ||
            pop === 0 ||
            props.topsis_score === undefined ||
            props.topsis_score === null;

          const rawCat = (props.relocation_priority_category || 'MODERATE').toUpperCase().replace('-', ' ').trim();
          let priorityGroup: 'VERY_HIGH' | 'MODERATE' | 'LOW' | null = null;
          let fillColor = '#cbd5e1'; // Neutral light gray for insufficient data
          let strokeColor = '#94a3b8';
          let fillOpacity = 0.35;

          if (isInsufficient) {
            fillColor = '#cbd5e1';
            strokeColor = '#94a3b8';
            fillOpacity = 0.35;
          } else if (rawCat === 'VERY HIGH' || rawCat === 'HIGH') {
            priorityGroup = 'VERY_HIGH';
            fillColor = '#ef4444'; // Red
            strokeColor = '#b91c1c';
            fillOpacity = 0.72;
          } else if (rawCat === 'MODERATE') {
            priorityGroup = 'MODERATE';
            fillColor = '#f59e0b'; // Yellow / Amber
            strokeColor = '#d97706';
            fillOpacity = 0.70;
          } else {
            priorityGroup = 'LOW';
            fillColor = '#10b981'; // Green
            strokeColor = '#059669';
            fillOpacity = 0.70;
          }

          // Apply priority filter: [ All ] [ 🔴 Very High ] [ 🟡 Moderate ] [ 🟢 Low ]
          if (priorityFilter) {
            if (isInsufficient || priorityGroup !== priorityFilter) {
              fillColor = '#f8fafc';
              strokeColor = '#e2e8f0';
              fillOpacity = 0.06;
            }
          }

          if (isSelected) {
            return {
              fillColor,
              fillOpacity: 0.90,
              color: '#1e1b4b',
              weight: 2.5,
              opacity: 1,
            };
          }

          return {
            fillColor,
            fillOpacity,
            color: strokeColor,
            weight: 0.75,
            opacity: 0.85,
          };
        }

        // For other metrics (e.g. hazard_exposure, demographic_sensitivity, etc.): use standard choropleth
        const val = getMandalMetricValue(activeMetric, props);
        const fillColor = getColorForValue(val, activeMetric);

        return {
          fillColor,
          fillOpacity: isSelected ? 0.92 : 0.72,
          color: isSelected ? '#ffffff' : '#1e293b',
          weight: isSelected ? 2.5 : 0.7,
          opacity: 0.85,
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const props = feature?.properties || {};
        const isCapacityMetric = activeMetric === 'shelter_capacity' || activeMetric === 'road_density' || activeMetric === 'safe_area_fraction';

        const mname = props.mandal_name || props.DMNAME || 'Mandal';
        const dname = props.current_district_name || props.DNAME || 'District';
        const metricConfig = METRIC_CONFIGS[activeMetric];
        const val = getMandalMetricValue(activeMetric, props);
        const formattedVal = metricConfig ? metricConfig.colorScale.formatter(val) : '—';

        const pop = Number(props.population_total ?? 0);
        const isInsufficient =
          props.relocation_priority_category === 'INSUFFICIENT-DATA' ||
          props.ranking_status === 'INSUFFICIENT_DATA' ||
          props.demographic_data_flag === 'ZERO_RURAL_CENSUS_HABITATIONS' ||
          pop === 0 ||
          props.topsis_score === undefined ||
          props.topsis_score === null;

        const rawCat = (props.relocation_priority_category || 'MODERATE').toUpperCase().replace('-', ' ').trim();
        const rankText = props.relocation_priority_rank ? `#${props.relocation_priority_rank}` : '—';
        const topsisText = isInsufficient ? '—' : Number(props.topsis_score ?? 0).toFixed(4);

        const getBaseStyle = () => {
          const isSelected = selectedMandal && (
            selectedMandal.mandal_id === props?.mandal_id ||
            selectedMandal.mandal_name === props?.mandal_name
          );

          if (isRelocationPriority) {
            let pGroup: 'VERY_HIGH' | 'MODERATE' | 'LOW' | null = null;
            let fColor = '#cbd5e1';
            let sColor = '#94a3b8';
            let fOpacity = 0.35;

            if (isInsufficient) {
              fColor = '#cbd5e1';
              sColor = '#94a3b8';
              fOpacity = 0.35;
            } else if (rawCat === 'VERY HIGH' || rawCat === 'HIGH') {
              pGroup = 'VERY_HIGH';
              fColor = '#ef4444';
              sColor = '#b91c1c';
              fOpacity = 0.72;
            } else if (rawCat === 'MODERATE') {
              pGroup = 'MODERATE';
              fColor = '#f59e0b';
              sColor = '#d97706';
              fOpacity = 0.70;
            } else {
              pGroup = 'LOW';
              fColor = '#10b981';
              sColor = '#059669';
              fOpacity = 0.70;
            }

            if (priorityFilter && (isInsufficient || pGroup !== priorityFilter)) {
              fColor = '#f8fafc';
              sColor = '#e2e8f0';
              fOpacity = 0.06;
            }

            return {
              fillColor: fColor,
              fillOpacity: isSelected ? 0.90 : fOpacity,
              color: isSelected ? '#1e1b4b' : sColor,
              weight: isSelected ? 2.5 : 0.75,
              opacity: 0.85,
            };
          } else {
            const mVal = getMandalMetricValue(activeMetric, props);
            const fColor = getColorForValue(mVal, activeMetric);
            return {
              fillColor: fColor,
              fillOpacity: isSelected ? 0.92 : 0.72,
              color: isSelected ? '#ffffff' : '#1e293b',
              weight: isSelected ? 2.5 : 0.7,
              opacity: 0.85,
            };
          }
        };

        // Relocation Priority Tooltip
        if (isRelocationPriority) {
          let badgeHtml = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">Insufficient Data</span>';
          if (!isInsufficient) {
            if (rawCat === 'VERY HIGH' || rawCat === 'HIGH') {
              badgeHtml = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">🔴 VERY HIGH PRIORITY</span>';
            } else if (rawCat === 'MODERATE') {
              badgeHtml = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">🟡 MODERATE PRIORITY</span>';
            } else {
              badgeHtml = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">🟢 LOW PRIORITY</span>';
            }
          }

          featureLayer.bindTooltip(
            `<div class="p-1.5 text-xs min-w-[160px]">
              <div class="font-extrabold text-slate-900 uppercase text-xs">${mname}</div>
              <div class="text-[10px] text-slate-500 mb-1">${dname} District</div>
              <div class="mb-1">${badgeHtml}</div>
              ${!isInsufficient ? `<div class="text-[10px] text-slate-600 flex justify-between pt-1 border-t border-slate-100 font-medium">
                <span>Rank: <strong>${rankText}</strong></span>
                <span>TOPSIS: <strong class="font-mono">${topsisText}</strong></span>
              </div>` : ''}
            </div>`,
            { sticky: true }
          );
        } else {
          // Other analytical metrics tooltip
          const hazIdx = Number(props.hazard_exposure_index ?? 0).toFixed(3);
          const demoIdx = Number(props.demographic_sensitivity_index ?? 0).toFixed(3);
          const vulnIdx = Number(props.vulnerability_index ?? 0).toFixed(3);
          const shelterCap = props.verified_shelter_capacity_persons ? props.verified_shelter_capacity_persons.toLocaleString() : '0';
          const shelterRate = props.shelter_capacity_per_1000 ? `${Number(props.shelter_capacity_per_1000).toFixed(1)}/1k` : '0.0/1k';
          const roadDens = props.road_density_km_per_km2 ? `${Number(props.road_density_km_per_km2).toFixed(2)} km/km²` : '0 km/km²';
          const safeArea = props.safe_area_fraction ? `${(Number(props.safe_area_fraction) * 100).toFixed(1)}%` : '0%';

          const tooltipBody = isCapacityMetric
            ? `<div class="space-y-0.5 text-[11px]">
                <div class="flex justify-between">
                  <span class="text-slate-500">Designated Shelter Cap:</span>
                  <strong class="text-emerald-600 font-mono">${shelterCap} (${shelterRate})</strong>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Road Density:</span>
                  <strong class="text-sky-600 font-mono">${roadDens}</strong>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Safe Habitable Area:</span>
                  <strong class="text-amber-600 font-mono">${safeArea}</strong>
                </div>
              </div>`
            : `<div class="space-y-0.5 text-[11px]">
                <div class="flex justify-between">
                  <span class="text-slate-500">Vulnerability (Vi):</span>
                  <strong class="text-emerald-600 font-mono">${vulnIdx}</strong>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Hazard Exposure (Hi):</span>
                  <strong class="text-sky-600 font-mono">${hazIdx}</strong>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Sensitivity (Di):</span>
                  <strong class="text-indigo-600 font-mono">${demoIdx}</strong>
                </div>
              </div>`;

          featureLayer.bindTooltip(
            `<div class="p-1.5 text-xs min-w-[190px]">
              <div class="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
                <strong class="text-sm font-bold text-slate-900">${mname}</strong>
                <span class="text-[10px] text-slate-500 font-mono">${props.mandal_id || ''}</span>
              </div>
              <div class="text-[11px] text-slate-600 mb-1 flex justify-between">
                <span>${dname}</span>
                <span class="text-indigo-600 font-mono font-semibold">${metricConfig ? metricConfig.label : ''}: ${formattedVal}</span>
              </div>
              ${tooltipBody}
            </div>`,
            { sticky: true }
          );
        }

        featureLayer.on({
          mouseover: (e) => {
            const target = e.target;
            target.setStyle({
              weight: 2.2,
              color: '#0f172a',
              fillOpacity: Math.min(1, (target.options.fillOpacity || 0.7) + 0.18),
            });
            target.bringToFront();
          },
          mouseout: (e) => {
            const target = e.target;
            target.setStyle(getBaseStyle());
          },
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            featureLayer.closeTooltip?.();
            onSelectMandal(props);
            const bounds = (featureLayer as any).getBounds();
            if (bounds && bounds.isValid() && map) {
              map.fitBounds(bounds, { padding: [60, 60], maxZoom: 11 });
            }
          },
        });
      },
    });

    layer.addTo(map);
    vulnerabilityLayerRef.current = layer;

    if (!selectedMandal && !selectedDistrictId) {
      const b = layer.getBounds();
      if (b.isValid()) {
        map.fitBounds(b, { padding: [16, 16], maxZoom: 8.5 });
      }
    }
  }, [vulnerabilityGeoJson, activeMetric, priorityFilter, selectedMandal, onSelectMandal, isAnalyticalMode]);

  // Clean up any residual markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (markersLayerRef.current) {
      map.removeLayer(markersLayerRef.current);
      markersLayerRef.current = null;
    }
  }, [activeMetric]);

  // 4b. Auto-zoom/pan to selected mandal when updated from List or Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedMandal) return;

    const targetLayer = vulnerabilityLayerRef.current || mandalsLayerRef.current;
    if (!targetLayer) return;

    targetLayer.eachLayer((l: any) => {
      const p = l.feature?.properties;
      if (
        p &&
        ((selectedMandal.mandal_id && p.mandal_id === selectedMandal.mandal_id) ||
         (selectedMandal.mandal_name && p.mandal_name === selectedMandal.mandal_name) ||
         (selectedMandal.DMNAME && p.DMNAME === selectedMandal.DMNAME))
      ) {
        const bounds = l.getBounds?.();
        if (bounds && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [80, 80], maxZoom: 11 });
        }
      }
    });
  }, [selectedMandal]);

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
      pane: 'mandalsPane',
      interactive: true,
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
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-white">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};

