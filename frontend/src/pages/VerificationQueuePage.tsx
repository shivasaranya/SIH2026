import React from 'react';
import { useActiveState } from '../context/StateContext';
import { CheckSquare } from 'lucide-react';

export const VerificationQueuePage: React.FC = () => {
  const { currentState } = useActiveState();
  return (
    <div className="flex flex-col gap-6 p-4 bg-white rounded-lg shadow-sm">
      <section>
        <h1 className="text-2xl font-bold text-gray-800">VERIFICATION QUEUE</h1>
        <p className="mt-1 text-sm text-gray-600">Display citizen emergency alerts waiting for government verification.</p>
        <p className="mt-2 text-xs text-gray-500">State: {currentState.name}</p>
      </section>

      <section className="bg-amber-50 rounded p-4 text-center w-full md:w-1/3">
        <p className="text-xs font-medium text-amber-700">PENDING VERIFICATION</p>
        <p className="mt-1 text-2xl font-semibold text-amber-900">0</p>
      </section>

      <section className="p-8 bg-gray-50 rounded border border-gray-200 text-center">
        <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-700">No alerts awaiting verification</p>
        <p className="mt-1 text-xs text-gray-500">Citizen emergency alerts will appear here when reports are received.</p>
      </section>
    </div>
  );
};
