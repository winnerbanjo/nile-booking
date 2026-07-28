import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { Button } from '../../components/ui/button';

export const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminCustomers', page, searchTerm],
    queryFn: () => adminApi.getCustomers({ page, limit: 25, search: searchTerm }),
    staleTime: 1000 * 30,
  });

  const customers = data?.customers || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="w-full space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Customer Directory</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and audit client accounts across the Nile ecosystem.</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Showing {customers.length} of {total} registered customers
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Customer Name</th>
                <th className="px-6 py-3">Email Address</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Joined Date</th>
                <th className="px-6 py-3">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-red-500">
                    <p className="text-sm font-semibold text-red-700">Failed to load customers</p>
                    <p className="text-xs text-red-500 mt-0.5">Please try again later.</p>
                  </td>
                </tr>
              ) : isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-28 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded"></div></td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-900">No customer records</p>
                    <p className="text-xs text-gray-500 mt-0.5">Registered clients will appear in this directory.</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id || Math.random()} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{c?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-600">{c?.email || 'No email'}</td>
                    <td className="px-6 py-4 text-xs text-gray-600">{c?.phone || 'N/A'}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {c?.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        c?.isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {c?.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs"
            >
              Previous
            </Button>
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-xs"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
