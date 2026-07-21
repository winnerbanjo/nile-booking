import React, { useState } from 'react';
import { Search, Filter, CreditCard, CheckCircle2, Clock, XCircle, MoreHorizontal } from 'lucide-react';

const mockPayouts = [
  {
    id: 'PO-2026-001',
    provider: 'The Modern Chef',
    amount: 250000,
    status: 'Pending Approval',
    destination: 'GTBank - ******3492',
    date: '2026-07-21',
  },
  {
    id: 'PO-2026-002',
    provider: 'Zenith Photography',
    amount: 135000,
    status: 'Paid',
    destination: 'Access Bank - ******8821',
    date: '2026-07-20',
  },
  {
    id: 'PO-2026-003',
    provider: 'Elite Hair Studio',
    amount: 40500,
    status: 'Processing',
    destination: 'First Bank - ******1129',
    date: '2026-07-20',
  },
  {
    id: 'PO-2026-004',
    provider: 'Glamour MUA',
    amount: 22500,
    status: 'Failed',
    destination: 'Zenith Bank - ******9901',
    date: '2026-07-19',
  }
];

export const Payouts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid': 
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> {status}</span>;
      case 'Pending Approval': 
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider"><Clock className="w-3 h-3" /> {status}</span>;
      case 'Processing': 
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider"><Clock className="w-3 h-3" /> {status}</span>;
      case 'Failed': 
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider"><XCircle className="w-3 h-3" /> {status}</span>;
      default: 
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Payout Management</h2>
          <p className="text-sm text-gray-500 mt-1">Review, approve, and track settlements to providers.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by payout ID or provider..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Payout Ref</th>
              <th className="px-6 py-4">Provider</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Destination</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockPayouts.map((payout) => (
              <tr key={payout.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-mono text-xs font-bold text-gray-900">{payout.id}</p>
                  <p className="text-[10px] text-gray-500">{payout.date}</p>
                </td>
                <td className="px-6 py-4 font-bold text-gray-900">{payout.provider}</td>
                <td className="px-6 py-4 font-black text-gray-900">₦{payout.amount.toLocaleString()}</td>
                <td className="px-6 py-4 font-medium text-gray-600">{payout.destination}</td>
                <td className="px-6 py-4">{getStatusBadge(payout.status)}</td>
                <td className="px-6 py-4 text-right">
                  {payout.status === 'Pending Approval' ? (
                    <button onClick={() => alert('Action triggered!')} className="px-3 py-1.5 bg-zinc-950 text-white text-xs font-medium rounded-lg hover:bg-zinc-800 transition-colors">
                      Review
                    </button>
                  ) : (
                    <button onClick={() => alert('Action triggered!')} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
