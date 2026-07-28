import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ShieldAlert, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { formatDateSafe } from '../../lib/utils';
import { AdminLocalErrorState } from '../../components/admin/AdminLocalErrorState';

export const Risk: React.FC = () => {
  const { data, isLoading, isError, refetch, error } = useQuery({
    queryKey: ['adminRisk'],
    queryFn: () => adminApi.getRisk(),
    staleTime: 1000 * 60,
  });

  if (isError) {
    return (
      <AdminLocalErrorState
        title="Failed to load disputes & risk data"
        message={(error as any)?.message || 'Platform risk data could not be loaded.'}
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-gray-500 font-medium">Loading risk data...</p>
      </div>
    );
  }

  const disputes: any[] = Array.isArray(data?.data) ? data.data : [];
  const summary = data?.summary || { openDisputes: 0, highRiskProviders: 0, underInvestigation: 0 };

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
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Open Disputes</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{summary.openDisputes}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Suspended Providers</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{summary.highRiskProviders}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Under Investigation</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{summary.underInvestigation}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Disputed Bookings</h3>
        </div>
        {disputes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ShieldCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-900">No open disputes</p>
            <p className="text-xs text-gray-500 mt-0.5 font-normal">
              Platform risk alerts and client dispute claims will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Booking</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Provider</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {disputes.map((d: any) => (
                  <tr key={d._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{d.bookingNumber || '—'}</td>
                    <td className="px-6 py-4 text-xs text-gray-600">{d.customerName || '—'}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{d.providerName || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700">
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{formatDateSafe(d.updatedAt || d.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
