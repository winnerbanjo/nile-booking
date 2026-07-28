import React, { useState } from 'react';
import { Search, CreditCard } from 'lucide-react';

export const Payouts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const payouts: any[] = [];

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Merchant Payouts</h2>
          <p className="text-sm text-gray-500 mt-1">Audit merchant bank settlements and payout schedules.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search provider or destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Showing 0 payouts
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-12 text-center text-gray-500">
        <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-900">No payout requests</p>
        <p className="text-xs text-gray-500 mt-0.5 font-normal">
          Merchant payout settlements will appear here after verified completion.
        </p>
      </div>
    </div>
  );
};
