import React, { useState } from 'react';
import { Search, ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';

export const Risk: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const disputes: any[] = [];

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Disputes & Risk Management</h2>
          <p className="text-sm text-gray-500 mt-1">Monitor high-risk providers, open disputes, and platform safety.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Open Disputes</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">0</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">High Risk Providers</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">0</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Under Investigation</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">0</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search disputes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm p-12 text-center text-gray-500">
        <ShieldCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-900">No open disputes</p>
        <p className="text-xs text-gray-500 mt-0.5 font-normal">
          Platform risk alerts and client dispute claims will appear here.
        </p>
      </div>
    </div>
  );
};
