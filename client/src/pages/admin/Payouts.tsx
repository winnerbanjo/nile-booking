import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, CreditCard, Loader2 } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { normaliseApiResponse, formatDateSafe } from '../../lib/utils';
import { AdminLocalErrorState } from '../../components/admin/AdminLocalErrorState';

const formatMoney = (amount: number) =>
  `₦${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

export const Payouts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch, error } = useQuery({
    queryKey: ['adminPayouts', page, searchTerm],
    queryFn: () => adminApi.getPayouts({ page, limit: 25, search: searchTerm }),
    staleTime: 1000 * 30,
  });

  if (isError) {
    return (
      <AdminLocalErrorState
        title="Failed to load payouts"
        message={(error as any)?.message || 'Merchant payout records could not be loaded.'}
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-gray-500 font-medium">Loading payouts...</p>
      </div>
    );
  }

  const normalised = normaliseApiResponse(data, 'payouts');
  const payouts = normalised.data;
  const pagination = normalised.pagination;

  const filtered = payouts.filter((p: any) =>
    !searchTerm ||
    p?.providerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p?.transactionReference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            placeholder="Search provider or reference..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Showing {filtered.length} of {pagination.total} payouts
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-12 text-center text-gray-500">
          <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-900">No payout records</p>
          <p className="text-xs text-gray-500 mt-0.5 font-normal">
            Merchant payout settlements will appear here after verified completion.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3">Provider</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Gateway</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p: any) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{p.transactionReference || '—'}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{p.providerName || 'Unknown provider'}</td>
                    <td className="px-6 py-4 font-bold text-emerald-700">{formatMoney(p.amount)}</td>
                    <td className="px-6 py-4 text-xs capitalize">{p.paymentGateway || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        p.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        p.status === 'failed' ? 'bg-red-50 text-red-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {p.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{formatDateSafe(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded-lg disabled:opacity-40 text-xs font-medium hover:bg-gray-50">Previous</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages} className="px-3 py-1 border rounded-lg disabled:opacity-40 text-xs font-medium hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
