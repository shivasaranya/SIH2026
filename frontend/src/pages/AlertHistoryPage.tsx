import React from 'react';
import { useActiveState } from '../context/StateContext';
import { History } from 'lucide-react';

export const AlertHistoryPage: React.FC = () => {
  const { currentState } = useActiveState();
  return (
    <div className="flex flex-col gap-6 p-4 bg-white rounded-lg shadow-sm">
      <section>
        <h1 className="text-2xl font-bold text-gray-800">ALERT HISTORY</h1>
        <p className="mt-1 text-sm text-gray-600">Historical logs of all emergency alerts and their resolutions.</p>
        <p className="mt-2 text-xs text-gray-500">State: {currentState.name}</p>
      </section>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm text-gray-500 border border-gray-200">
          <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
            <tr>
              <th className="px-4 py-3 border-b">Date/Time</th>
              <th className="px-4 py-3 border-b">Alert Type</th>
              <th className="px-4 py-3 border-b">Location</th>
              <th className="px-4 py-3 border-b">Priority</th>
              <th className="px-4 py-3 border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="p-8 text-center bg-gray-50">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-700">No alert history available</p>
                <p className="mt-1 text-xs text-gray-500">Historical citizen alerts will appear here after the emergency reporting system is connected.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
