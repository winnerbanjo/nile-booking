import React, { useState, useEffect } from 'react';
import { bookingApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Check, X, CheckCircle, FileText, Loader2, Filter } from 'lucide-react';
import type { Booking } from '../types';
import { format } from 'date-fns';

export const Bookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState<Booking | null>(null);
  const [processingReceipt, setProcessingReceipt] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, [statusFilter, page]);

  const loadBookings = async () => {
    try {
      const response = await bookingApi.getBookings({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: 20,
      });
      setBookings(response.bookings || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      await bookingApi.updateBookingStatus(bookingId, newStatus);
      loadBookings();
    } catch (error: any) {
      alert('Failed to update booking: ' + (error.message || 'Unknown error'));
    }
  };

  const handleReceiptAction = async (bookingId: string, action: 'approve' | 'reject') => {
    setProcessingReceipt(bookingId);
    try {
      if (action === 'approve') {
        await bookingApi.updateBookingStatus(bookingId, 'confirmed');
        await bookingApi.updateBookingStatus(bookingId, 'paid');
      } else {
        await bookingApi.updateBookingStatus(bookingId, 'rejected');
      }
      setSelectedReceipt(null);
      loadBookings();
      alert(`Receipt ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
    } catch (error: any) {
      alert('Failed to process receipt: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessingReceipt(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-xs text-zinc-500 font-normal">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight">
              Bookings Manager
            </h1>
            <p className="text-sm text-zinc-500 mt-1 font-normal">
              Track customer reservations, payment verifications, and appointment statuses
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 focus:border-zinc-900 focus:ring-zinc-900 shadow-sm"
            >
              <option value="all">All Bookings Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Clean Table Container */}
        <div className="bg-white border border-zinc-200/80 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-medium">
                <tr>
                  <th className="px-6 py-3.5">Booking ID</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Service</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Payment</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-zinc-400">
                      No bookings found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => {
                    const service = typeof booking.service === 'object' ? booking.service : null;
                    return (
                      <tr key={booking._id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-zinc-900">
                          {booking.bookingNumber}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-zinc-900">{booking.customer.name}</div>
                          <div className="text-[11px] text-zinc-400 font-normal">{booking.customer.email} • {booking.customer.phone}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-800">
                          {service ? service.name : 'Service'}
                        </td>
                        <td className="px-6 py-4 text-zinc-500 font-normal">
                          {format(new Date(booking.date), 'MMM d, yyyy')}
                          <div className="text-[11px] text-zinc-400">{booking.timeSlot?.startTime} - {booking.timeSlot?.endTime}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-zinc-900">
                          ₦{(booking.pricing?.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            booking.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : booking.status === 'completed'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : booking.status === 'rejected'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            booking.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                          }`}>
                            {booking.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {booking.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                                  className="h-7 text-xs bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 px-2.5"
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusUpdate(booking._id, 'rejected')}
                                  className="h-7 text-xs bg-white text-red-600 border-red-200 hover:bg-red-50 px-2"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(booking._id, 'completed')}
                                className="h-7 text-xs bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100 px-2.5"
                              >
                                Mark Completed
                              </Button>
                            )}
                            {booking.paymentType === 'bank_transfer' && booking.receiptImageUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedReceipt(booking)}
                                className="h-7 text-xs bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50 px-2.5"
                              >
                                <FileText className="h-3.5 w-3.5 mr-1 text-zinc-500" />
                                Receipt
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-zinc-200/80 bg-zinc-50/50 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="h-8 text-xs"
              >
                Previous Page
              </Button>
              <span className="text-xs text-zinc-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="h-8 text-xs"
              >
                Next Page
              </Button>
            </div>
          )}
        </div>

        {/* Transfer Receipt Verification Modal */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xl w-full max-w-lg space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-base font-semibold text-zinc-900">Transfer Receipt Verification</h3>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Booking Number</span>
                  <span className="font-semibold text-zinc-900">{selectedReceipt.bookingNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Client Name</span>
                  <span className="font-medium text-zinc-900">{selectedReceipt.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Amount</span>
                  <span className="font-bold text-zinc-900">₦{selectedReceipt.pricing?.totalAmount?.toLocaleString()}</span>
                </div>
              </div>

              {selectedReceipt.receiptImageUrl && (
                <div className="rounded-lg overflow-hidden border border-zinc-200 max-h-64">
                  <img src={selectedReceipt.receiptImageUrl} alt="Receipt" className="w-full h-full object-contain" />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleReceiptAction(selectedReceipt._id, 'approve')}
                  disabled={processingReceipt === selectedReceipt._id}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg h-9 text-xs font-medium"
                >
                  Approve Payment
                </Button>
                <Button
                  onClick={() => handleReceiptAction(selectedReceipt._id, 'reject')}
                  disabled={processingReceipt === selectedReceipt._id}
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-lg h-9 text-xs font-medium"
                >
                  Reject Payment
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
