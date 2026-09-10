import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { useActiveState } from '../context/StateContext';
import { GISMap } from '../components/map/GISMap';
import { fetchDistrictsGeoJson } from '../services/api';
import type { GeoJsonFeatureCollection, DistrictProperties } from '../types/gis';

export const EmergencyIntelligencePage: React.FC = () => {
  const { currentState } = useActiveState();
  const [districtsGeoJson, setDistrictsGeoJson] = useState<GeoJsonFeatureCollection<DistrictProperties> | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchDistrictsGeoJson(currentState.id).then(data => {
      if (isMounted) setDistrictsGeoJson(data);
    }).catch(console.error);
    return () => { isMounted = false; };
  }, [currentState.id]);

  return (
    <div className="flex flex-col gap-6 p-4 bg-white rounded-lg shadow-sm">
      {/* Header */}
      <section>
        <h1 className="text-2xl font-bold text-gray-800">EMERGENCY INTELLIGENCE</h1>
        <p className="mt-1 text-sm text-gray-600">
          Real-time citizen emergency monitoring and response intelligence
        </p>
        <p className="mt-2 text-xs text-gray-500">State: {currentState.name}</p>
      </section>
      
      {/* Statistics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-indigo-50 rounded p-3 text-center">
          <p className="text-xs font-medium text-gray-500">ACTIVE ALERTS</p>
          <p className="mt-1 text-lg font-semibold text-indigo-900">0</p>
        </div>
        <div className="bg-indigo-50 rounded p-3 text-center">
          <p className="text-xs font-medium text-gray-500">UNVERIFIED</p>
          <p className="mt-1 text-lg font-semibold text-indigo-900">0</p>
        </div>
        <div className="bg-indigo-50 rounded p-3 text-center">
          <p className="text-xs font-medium text-gray-500">VERIFIED INCIDENTS</p>
          <p className="mt-1 text-lg font-semibold text-indigo-900">0</p>
        </div>
        <div className="bg-indigo-50 rounded p-3 text-center">
          <p className="text-xs font-medium text-gray-500">VERY HIGH PRIORITY</p>
          <p className="mt-1 text-lg font-semibold text-indigo-900">0</p>
        </div>
        <div className="col-span-2 bg-indigo-50 rounded p-3 text-center">
          <p className="text-xs font-medium text-gray-500">PEOPLE AFFECTED</p>
          <p className="mt-1 text-lg font-semibold text-indigo-900">0</p>
        </div>
      </section>

      {/* Emergency Map */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">EMERGENCY MAP</h2>
        <div className="relative w-full h-[400px] bg-gray-100 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center">
          {districtsGeoJson ? (
            <GISMap
              districtsGeoJson={districtsGeoJson}
              vulnerabilityGeoJson={null}
              demographicsSummary={null}
              activeMetric="topsis_score"
              selectedDistrictId={null}
              selectedMandal={null}
              onSelectDistrict={() => {}}
              onSelectMandal={() => {}}
              mandalsGeoJson={null}
              showMandals={false}
              showFloodWms={false}
              showSheltersWms={false}
              showHabitationsWms={false}
              showOverpassPOIs={false}
              resetViewTrigger={0}
            />
          ) : (
            <div className="flex flex-col items-center">
              <MapPin className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500 animate-pulse">Loading map...</span>
            </div>
          )}
          
          {/* Overlay to show there are 0 markers */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none z-[1000] flex justify-center">
            <div className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg rounded-lg px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">No active citizen emergency locations</p>
                <p className="text-xs text-gray-600">Citizen GPS alerts will appear here when connected</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    {/* Live Emergency Alerts */}
    <section>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">LIVE EMERGENCY ALERTS</h2>
      <div className="p-4 bg-gray-50 rounded border border-gray-200 text-center">
        <p className="text-sm text-gray-600">No active emergency alerts</p>
        <p className="mt-1 text-xs text-gray-500">
          Emergency messages and GPS locations sent by citizens will appear here once the Citizen interface is connected.
        </p>
      </div>
    </section>

    {/* Incident Details */}
    <section>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">INCIDENT DETAILS</h2>
      <div className="p-4 bg-gray-50 rounded border border-gray-200 text-center">
        <p className="text-sm text-gray-600">No incident selected</p>
        <p className="mt-1 text-xs text-gray-500">
          Select a citizen emergency alert to view message, GPS location and incident details.
        </p>
      </div>
    </section>
  </div>
  );
};
