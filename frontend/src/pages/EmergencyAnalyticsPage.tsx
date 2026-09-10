import React from 'react';
import { useActiveState } from '../context/StateContext';
import { BarChart2 } from 'lucide-react';

export const EmergencyAnalyticsPage: React.FC = () => {
  const { currentState } = useActiveState();
  return (
    <div className="flex flex-col gap-6 p-4 bg-white rounded-lg shadow-sm h-full">
      <section>
        <h1 className="text-2xl font-bold text-gray-800">EMERGENCY ANALYTICS</h1>
        <p className="mt-1 text-sm text-gray-600">Data-driven insights from citizen emergency reporting.</p>
        <p className="mt-2 text-xs text-gray-500">State: {currentState.name}</p>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-indigo-50 rounded p-4 text-center">
          <p className="text-[10px] font-bold text-indigo-700 uppercase">Total Alerts</p>
          <p className="mt-1 text-2xl font-semibold text-indigo-900">0</p>
        </div>
        <div className="bg-emerald-50 rounded p-4 text-center">
          <p className="text-[10px] font-bold text-emerald-700 uppercase">Verified Incidents</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-900">0</p>
        </div>
        <div className="bg-amber-50 rounded p-4 text-center">
          <p className="text-[10px] font-bold text-amber-700 uppercase">Unverified Alerts</p>
          <p className="mt-1 text-2xl font-semibold text-amber-900">0</p>
        </div>
        <div className="bg-rose-50 rounded p-4 text-center">
          <p className="text-[10px] font-bold text-rose-700 uppercase">Very High Priority</p>
          <p className="mt-1 text-2xl font-semibold text-rose-900">0</p>
        </div>
        <div className="bg-sky-50 rounded p-4 text-center">
          <p className="text-[10px] font-bold text-sky-700 uppercase">People Affected</p>
          <p className="mt-1 text-2xl font-semibold text-sky-900">0</p>
        </div>
        <div className="bg-teal-50 rounded p-4 text-center">
          <p className="text-[10px] font-bold text-teal-700 uppercase">Resolved Incidents</p>
          <p className="mt-1 text-2xl font-semibold text-teal-900">0</p>
        </div>
      </section>

      <section className="flex-1 min-h-[300px] flex flex-col items-center justify-center p-8 bg-gray-50 rounded border border-gray-200 text-center">
        <BarChart2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-base font-semibold text-gray-700">Not enough emergency data for analytics.</p>
        <p className="mt-2 text-sm text-gray-500 max-w-md">Analytics charts and response metrics will populate here once actual citizen emergency data is received and verified.</p>
      </section>
    </div>
  );
};
