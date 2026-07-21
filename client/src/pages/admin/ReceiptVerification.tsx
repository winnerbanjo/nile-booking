import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { adminApi } from '../../lib/api';
import type { Booking } from '../../types';

export const ReceiptVerification: React.FC = () => {
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPendingVerifications();
      setPendingBookings(response.bookings || []);
    } catch (error) {
      console.error('Failed to fetch pending verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    try {
      setVerifying(bookingId);
      await adminApi.verifyReceipt(bookingId, 'approve');
      setPendingBookings(prev => prev.filter(b => b._id !== bookingId));
      alert('Receipt verified! Booking confirmed.');
    } catch (error) {
      console.error('Failed to verify receipt:', error);
      alert('Failed to verify receipt. Please try again.');
    } finally {
      setVerifying(null);
    }
  };

  const handleDecline = async (bookingId: string) => {
    try {
      setVerifying(bookingId);
      await adminApi.verifyReceipt(bookingId, 'decline');
      setPendingBookings(prev => prev.filter(b => b._id !== bookingId));
      alert('Receipt declined.');
    } catch (error) {
      console.error('Failed to decline receipt:', error);
      alert('Failed to decline receipt.');
    } finally {
      setVerifying(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-gray-500 font-medium">Loading verifications...</p>
      </div>
    );
  }

  const filteredBookings = pendingBookings.filter(b => 
    b.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Receipt Verification</h2>
          <p className="text-sm text-gray-500 mt-1">Review and approve manual bank transfers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-zinc-950 rounded-xl p-5 shadow-sm text-white">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Pending Review</p>
          <p className="text-3xl font-black tracking-tighter">{pendingBookings.length}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by booking ref or customer name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBookings.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white border border-gray-200 rounded-xl shadow-sm">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
            <p className="text-gray-500">No pending receipts to verify.</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking._id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Booking Ref</p>
                  <p className="font-mono font-bold text-gray-900">{booking.bookingNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</p>
                  <p className="font-bold text-emerald-600">₦{booking.pricing?.totalAmount?.toLocaleString() || '0'}</p>
                </div>
              </div>
              
              <div className="p-4 flex-1">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Customer</p>
                    <p className="font-semibold text-gray-900">{booking.customer?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Receipt</p>
                    {booking.paymentReceiptUrl ? (
                      <a 
                        href={booking.paymentReceiptUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block w-full h-40 rounded-lg border-2 border-dashed border-gray-200 hover:border-emerald-500 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center text-gray-500 group overflow-hidden"
                      >
                        {booking.paymentReceiptUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                          <img src={booking.paymentReceiptUrl} alt="Receipt" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <ImageIcon className="w-8 h-8 mb-2 group-hover:text-emerald-500 transition-colors" />
                            <span className="text-sm font-medium">View Receipt Document</span>
                          </>
                        )}
                      </a>
                    ) : (
                      <div className="w-full h-40 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                        <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-sm">No receipt uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => handleDecline(booking._id!)}
                  disabled={verifying === booking._id}
                  className="flex-1 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 text-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Decline
                </button>
                <button
                  onClick={() => handleApprove(booking._id!)}
                  disabled={verifying === booking._id}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 text-sm"
                >
                  {verifying === booking._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
