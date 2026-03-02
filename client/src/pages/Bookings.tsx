import React, { useState, useEffect } from 'react';
import { bookingApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Select } from '../components/ui/select';
import { Check, X, CheckCircle, Clock, AlertCircle, FileText, Loader2 } from 'lucide-react';
import type { Booking } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

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
      setBookings(response.bookings);
      setTotalPages(response.totalPages);
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
        // Also update payment status to paid
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
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings Manager</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track all your bookings
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No bookings found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => {
                    const service = typeof booking.service === 'object' ? booking.service : null;
                    return (
                      <TableRow key={booking._id}>
                        <TableCell className="font-medium">
                          {booking.bookingNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{booking.customer.name}</div>
                            <div className="text-sm text-gray-500">{booking.customer.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {service ? service.name : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{format(new Date(booking.date), 'MMM d, yyyy')}</div>
                            <div className="text-sm text-gray-500">
                              {booking.timeSlot.startTime} - {booking.timeSlot.endTime}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            ₦{booking.pricing.totalAmount.toLocaleString()}
                          </div>
                          {booking.paymentType === 'deposit' && (
                            <div className="text-xs text-gray-500">
                              (Deposit: ₦{booking.pricing.depositAmount.toLocaleString()})
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              STATUS_COLORS[booking.status]
                            }`}
                          >
                            {booking.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              booking.paymentStatus === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : booking.paymentStatus === 'partial'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {booking.paymentStatus}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {booking.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusUpdate(booking._id, 'rejected')}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(booking._id, 'completed')}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            )}
                            {booking.whatsappLink && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(booking.whatsappLink, '_blank')}
                              >
                                WhatsApp
                              </Button>
                            )}
                            {booking.paymentType === 'bank_transfer' && booking.receiptImageUrl && (
                              <div className="flex items-center gap-2">
                                <img
                                  src={booking.receiptImageUrl}
                                  alt="Receipt"
                                  onClick={() => setSelectedReceipt(booking)}
                                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity object-cover"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedReceipt(booking)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Receipt Viewer Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReceipt(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                    Transfer Receipt
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedReceipt(null)}
                    className="rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Booking Number</p>
                      <p className="font-semibold text-gray-900">{selectedReceipt.bookingNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Customer</p>
                      <p className="font-semibold text-gray-900">{selectedReceipt.customer.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Amount</p>
                      <p className="font-semibold text-gray-900">₦{selectedReceipt.pricing?.totalAmount?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Date</p>
                      <p className="font-semibold text-gray-900">{format(new Date(selectedReceipt.date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                </div>

                {selectedReceipt.receiptImageUrl && (
                  <div className="mb-6">
                    <img
                      src={selectedReceipt.receiptImageUrl}
                      alt="Transfer Receipt"
                      className="w-full rounded-xl border border-gray-200 shadow-lg"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleReceiptAction(selectedReceipt._id, 'approve')}
                    disabled={processingReceipt === selectedReceipt._id}
                    className="flex-1 bg-[#22c55e] hover:bg-green-600 text-white rounded-xl h-12 font-semibold disabled:opacity-50"
                  >
                    {processingReceipt === selectedReceipt._id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Transfer
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleReceiptAction(selectedReceipt._id, 'reject')}
                    disabled={processingReceipt === selectedReceipt._id}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50 rounded-xl h-12 font-semibold disabled:opacity-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
