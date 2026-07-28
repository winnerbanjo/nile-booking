import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, CalendarDays } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { formatDateSafe, normaliseApiResponse } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { AdminLocalErrorState } from '../../components/admin/AdminLocalErrorState';

export const Bookings: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch, error } = useQuery({
    queryKey: ['adminBookings', page, searchTerm],
    queryFn: () => adminApi.getBookings({ page, limit: 25, search: searchTerm }),
    staleTime: 1000 * 15,
  });

  if (isError) {
    return (
      <AdminLocalErrorState
        title="Failed to load bookings"
        message={(error as any)?.message || 'Ecosystem bookings could not be loaded.'}
        onRetry={() => refetch()}
      />
    );
  }

  const normalised = normaliseApiResponse(data, 'bookings');
  const bookings = normalised.data;
  const { total, totalPages } = normalised.pagination;

  return (
    <div className="w-full space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Ecosystem Bookings</h2>
          <p className="text-sm text-gray-500 mt-1">Audit and track all appointments across active providers.</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search booking number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        {!isLoading && (
          <div className="text-xs text-gray-500 font-medium">
            Showing {bookings.length} of {total} total bookings
          </div>
        )}
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Booking ID</th>
                <th className="px-6 py-3">Provider</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Service</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-28 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded"></div></td>
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-900">No bookings found</p>
                    <p className="text-xs text-gray-500 mt-0.5">Bookings will appear here when appointments are scheduled.</p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking: any) => {
                  const providerName = (booking?.provider as any)?.businessName || (booking?.provider as any)?.name || 'Provider';
                  const serviceName = (booking?.service as any)?.name || 'Service';
                  return (
                    <tr key={booking?._id || Math.random()} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-gray-900">{booking?.bookingNumber}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{providerName}</td>
                      <td className="px-6 py-4 text-gray-700">{booking?.customer?.name}</td>
                      <td className="px-6 py-4 text-gray-700">{serviceName}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {formatDateSafe(booking?.date)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        ₦{(booking?.pricing?.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          booking?.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {booking?.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
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
