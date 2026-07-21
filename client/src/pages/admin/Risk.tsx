import React, { useState } from 'react';
import { Search, Filter, ShieldAlert, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const mockDisputes = [
  {
    id: 'DSP-1029',
    bookingId: 'BKG-98319',
    provider: 'Elite Hair Studio',
    customer: 'Amina Bello',
    reason: 'Service not delivered',
    amount: 15000,
    status: 'Open',
    date: '2026-07-21',
    riskLevel: 'High',
  },
  {
    id: 'DSP-1028',
    bookingId: 'BKG-98200',
    provider: 'Glamour MUA',
    customer: 'Chioma Adeyemi',
    reason: 'Provider did not appear',
    amount: 25000,
    status: 'Under Investigation',
    date: '2026-07-19',
    riskLevel: 'Medium',
  },
  {
    id: 'DSP-1027',
    bookingId: 'BKG-98155',
    provider: 'Zenith Photography',
    customer: 'Michael Eze',
    reason: 'Refund not received',
    amount: 10000,
    status: 'Resolved',
    date: '2026-07-15',
    riskLevel: 'Low',
  }
];

export const Risk: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-amber-100 text-amber-700';
      case 'Under Investigation': return 'bg-blue-100 text-blue-700';
      case 'Resolved': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Disputes & Risk Management</h2>
          <p className="text-sm text-gray-500 mt-1">Monitor high-risk providers, open disputes, and platform safety.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider">Open Disputes</h3>
          </div>
          <p className="text-3xl font-black text-red-700">12</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider">High Risk Providers</h3>
          </div>
          <p className="text-3xl font-black text-amber-700">3</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Under Investigation</h3>
          </div>
          <p className="text-3xl font-black text-blue-700">8</p>
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
        <button onClick={() => alert('Action triggered!')} className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Reference</th>
              <th className="px-6 py-4">Provider / Customer</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Risk Level</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockDisputes.map((dispute) => (
              <tr key={dispute.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono font-bold text-gray-900">{dispute.id}</td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900">{dispute.provider}</p>
                  <p className="text-xs text-gray-500">{dispute.customer}</p>
                </td>
                <td className="px-6 py-4 font-medium text-gray-700">{dispute.reason}</td>
                <td className="px-6 py-4 font-bold text-gray-900">₦{dispute.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold border ${getRiskColor(dispute.riskLevel)}`}>
                    {dispute.riskLevel}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold ${getStatusColor(dispute.status)}`}>
                    {dispute.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
