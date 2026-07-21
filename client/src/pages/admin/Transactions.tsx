import React, { useState } from 'react';
import { Search, Filter, Download, ArrowRightLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const mockTransactions = [
  {
    id: 'TXN-89234',
    bookingId: 'BKG-98321',
    provider: 'Zenith Photography',
    amount: 150000,
    nileCommission: 15000,
    providerPayout: 135000,
    paymentMethod: 'Bank Transfer',
    status: 'Settled',
    date: '2026-07-25T14:30:00Z',
  },
  {
    id: 'TXN-89233',
    bookingId: 'BKG-98320',
    provider: 'The Modern Chef',
    amount: 85000,
    nileCommission: 8500,
    providerPayout: 76500,
    paymentMethod: 'Card (Paystack)',
    status: 'Processing',
    date: '2026-07-25T12:15:00Z',
  },
  {
    id: 'TXN-89232',
    bookingId: 'BKG-98319',
    provider: 'Elite Hair Studio',
    amount: 45000,
    nileCommission: 4500,
    providerPayout: 40500,
    paymentMethod: 'Bank Transfer',
    status: 'Settled',
    date: '2026-07-24T09:45:00Z',
  },
  {
    id: 'TXN-89231',
    bookingId: 'BKG-98318',
    provider: 'Glamour MUA',
    amount: 25000,
    nileCommission: 2500,
    providerPayout: 22500,
    paymentMethod: 'Card (Paystack)',
    status: 'Failed',
    date: '2026-07-24T08:20:00Z',
  },
  {
    id: 'TXN-89230',
    bookingId: 'BKG-98317',
    provider: 'Zenith Photography',
    amount: 35000,
    nileCommission: 3500,
    providerPayout: 31500,
    paymentMethod: 'Bank Transfer',
    status: 'Refunded',
    date: '2026-07-23T16:10:00Z',
  }
];

export const Transactions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Settled': 
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> {status}</span>;
      case 'Processing': 
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider"><ArrowRightLeft className="w-3 h-3" /> {status}</span>;
      case 'Failed': 
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider"><AlertCircle className="w-3 h-3" /> {status}</span>;
      case 'Refunded': 
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider"><ArrowRightLeft className="w-3 h-3" /> {status}</span>;
      default: 
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Financial Ledger</h2>
          <p className="text-sm text-gray-500 mt-1">Global transaction records, commission tracking, and settlement status.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg shadow-sm transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-950 rounded-xl p-5 shadow-sm text-white">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Total Processing Volume</p>
          <p className="text-3xl font-black tracking-tighter">₦4,500,000</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Nile Commission (10%)</p>
          <p className="text-3xl font-black tracking-tighter text-emerald-600">₦450,000</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Provider Payout</p>
          <p className="text-3xl font-black tracking-tighter text-gray-900">₦4,050,000</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by transaction ID, booking ID, or provider..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none">
            <option>All Statuses</option>
            <option>Settled</option>
            <option>Processing</option>
            <option>Failed</option>
            <option>Refunded</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Transaction / Date</th>
                <th className="px-6 py-4">Booking Ref</th>
                <th className="px-6 py-4">Provider</th>
                <th className="px-6 py-4">Gross Amount</th>
                <th className="px-6 py-4 bg-emerald-50/50 text-emerald-700">Nile Cut (10%)</th>
                <th className="px-6 py-4">Net Payout</th>
                <th className="px-6 py-4">Method / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs font-bold text-gray-900">{txn.id}</p>
                    <p className="text-[10px] text-gray-500">{new Date(txn.date).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-blue-600 hover:underline cursor-pointer">
                    {txn.bookingId}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {txn.provider}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    ₦{txn.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600 bg-emerald-50/30">
                    ₦{txn.nileCommission.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    ₦{txn.providerPayout.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 space-y-1.5">
                    <p className="text-xs text-gray-500 font-medium">{txn.paymentMethod}</p>
                    <div>{getStatusBadge(txn.status)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-sm text-gray-500">
          <span>Showing 1 to 5 of 3,192 transactions</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <button className="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};
