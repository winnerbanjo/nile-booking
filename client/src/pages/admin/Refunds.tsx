import React, { useState } from 'react';
import { Search, Receipt, AlertCircle, CheckCircle2, RefreshCcw } from 'lucide-react';

const mockRefunds = [
  {
    id: 'REF-5501',
    bookingId: 'BKG-98318',
    customer: 'Chioma Adeyemi',
    provider: 'Glamour MUA',
    amount: 25000,
    status: 'Completed',
    date: '2026-07-22',
  },
  {
    id: 'REF-5502',
    bookingId: 'BKG-98110',
    customer: 'John Doe',
    provider: 'Elite Hair Studio',
    amount: 15000,
    status: 'Processing',
    date: '2026-07-21',
  },
  {
    id: 'REF-5503',
    bookingId: 'BKG-98005',
    customer: 'Jane Smith',
    provider: 'The Modern Chef',
    amount: 50000,
    status: 'Failed',
    date: '2026-07-20',
  }
];

export const Refunds: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': 
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> {status}</span>;
      case 'Processing': 
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider"><RefreshCcw className="w-3 h-3" /> {status}</span>;
      case 'Failed': 
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider"><AlertCircle className="w-3 h-3" /> {status}</span>;
      default: 
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Refunds Log</h2>
          <p className="text-sm text-gray-500 mt-1">Track and process booking refunds.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search refunds by ID, Booking, or Customer..." 
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
              <th className="px-6 py-4">Refund Ref</th>
              <th className="px-6 py-4">Booking Ref</th>
              <th className="px-6 py-4">Customer / Provider</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockRefunds.map((refund) => (
              <tr key={refund.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-mono text-xs font-bold text-gray-900">{refund.id}</p>
                  <p className="text-[10px] text-gray-500">{refund.date}</p>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-blue-600 hover:underline cursor-pointer">{refund.bookingId}</td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900">{refund.customer}</p>
                  <p className="text-xs text-gray-500">{refund.provider}</p>
                </td>
                <td className="px-6 py-4 font-black text-gray-900">₦{refund.amount.toLocaleString()}</td>
                <td className="px-6 py-4">{getStatusBadge(refund.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
