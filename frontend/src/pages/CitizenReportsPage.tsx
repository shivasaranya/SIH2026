import React from 'react';
import { useActiveState } from '../context/StateContext';
import { Megaphone } from 'lucide-react';

export const CitizenReportsPage: React.FC = () => {
  const { currentState } = useActiveState();
  return (
    <div className="flex flex-col gap-6 p-4 bg-white rounded-lg shadow-sm">
      {/* Header */}
      <section>
        <h1 className="text-2xl font-bold text-gray-800">CITIZEN REPORTS</h1>
        <p className="mt-1 text-sm text-gray-600">Emergency and incident reports submitted by citizens.</p>
        <p className="mt-2 text-xs text-gray-500">State: {currentState.name}</p>
      </section>
      {/* Reports List (empty state) */}
      <section className="p-4 bg-gray-50 rounded border border-gray-200 text-center">
        <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">No citizen reports available</p>
        <p className="mt-1 text-xs text-gray-500">Citizen reports will appear here after the Citizen interface is connected.</p>
      </section>
    </div>
  );
};
