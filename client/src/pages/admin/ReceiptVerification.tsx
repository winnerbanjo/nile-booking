import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { CheckCircle, XCircle, Image as ImageIcon, ChevronDown, ChevronUp, Home, Users, BarChart3, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { adminApi } from '../../lib/api';
import type { Booking } from '../../types';
import { format } from 'date-fns';

const adminNav = [
  { name: 'Home', href: '/admin/dashboard', icon: Home },
  { name: 'Verification', href: '/admin/verification', icon: CheckCircle },
  { name: 'Providers', href: '/admin/providers', icon: Users },
  { name: 'Finance', href: '/admin/finance', icon: BarChart3 },
];

const glassCardClass = "bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.3)]";

export const ReceiptVerification: React.FC = () => {
  const location = useLocation();
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<{ [key: string]: 'left' | 'right' | null }>({});
  const [verifying, setVerifying] = useState<string | null>(null);

  // Fetch pending verifications on mount
  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPendingVerifications();
      setPendingBookings(response.bookings);
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
      // Remove from list after successful verification
      setPendingBookings(prev => prev.filter(b => b._id !== bookingId));
      setExpandedId(null);
      alert('Receipt verified! Booking confirmed and visible in merchant dashboard.');
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
      await adminApi.verifyReceipt(bookingId, 'reject');
      // Remove from list after successful rejection
      setPendingBookings(prev => prev.filter(b => b._id !== bookingId));
      setExpandedId(null);
      alert('Receipt rejected. Booking status updated.');
    } catch (error) {
      console.error('Failed to reject receipt:', error);
      alert('Failed to reject receipt. Please try again.');
    } finally {
      setVerifying(null);
    }
  };

  const handleSwipe = (id: string, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      // Swipe right - Approve
      setSwipeDirection({ ...swipeDirection, [id]: 'right' });
      setTimeout(() => {
        handleApprove(id);
        setSwipeDirection({ ...swipeDirection, [id]: null });
      }, 300);
    } else if (info.offset.x < -threshold) {
      // Swipe left - Decline
      setSwipeDirection({ ...swipeDirection, [id]: 'left' });
      setTimeout(() => {
        handleDecline(id);
        setSwipeDirection({ ...swipeDirection, [id]: null });
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Receipt Verification Queue
          </h1>
          <p className="text-base text-gray-400 font-light">
            Review bank transfer receipts | Approve or decline bookings
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#22c55e]" />
          </div>
        ) : pendingBookings.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-400 mb-2">All Clear!</p>
            <p className="text-gray-500">No pending receipt verifications</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${glassCardClass} overflow-hidden`}
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase">Booking</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase">Customer</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase">Service</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase">Amount</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase">Receipt</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingBookings.map((booking, index) => {
                  const serviceName = typeof booking.service === 'object' ? booking.service.name : 'Service';
                  const providerName = typeof booking.provider === 'object' ? booking.provider.businessName : 'Provider';
                  const bookingDate = format(new Date(booking.date), 'MMM d, yyyy');
                  const bookingTime = booking.timeSlot?.startTime || '10:00';
                  
                  return (
                    <motion.tr
                      key={booking._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <p className="font-semibold text-white">{booking.bookingNumber}</p>
                        <p className="text-sm text-gray-400">{bookingDate} | {bookingTime}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-white">{booking.customer.name}</p>
                        <p className="text-sm text-gray-400">{providerName}</p>
                      </td>
                      <td className="py-4 px-6 text-gray-300">{serviceName}</td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-white">₦{booking.pricing?.totalAmount?.toLocaleString() || '0'}</span>
                      </td>
                      <td className="py-4 px-6">
                        {booking.receiptImageUrl ? (
                          <button
                            onClick={() => setExpandedId(expandedId === booking._id ? null : booking._id)}
                            className="flex items-center gap-2 text-[#22c55e] hover:text-green-400 transition-colors"
                          >
                            <ImageIcon className="w-4 h-4" />
                            {expandedId === booking._id ? 'Hide' : 'View'}
                          </button>
                        ) : (
                          <span className="text-gray-500 text-sm">No receipt</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(booking._id)}
                            disabled={verifying === booking._id}
                            className="bg-[#22c55e] hover:bg-green-600 text-white rounded-full backdrop-blur-xl disabled:opacity-50"
                          >
                            {verifying === booking._id ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-1" />
                            )}
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDecline(booking._id)}
                            disabled={verifying === booking._id}
                            className="border-red-400/50 text-red-400 hover:bg-red-500/10 rounded-full backdrop-blur-xl disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        </div>

        {/* Mobile Action Cards with Swipe */}
        <div className="md:hidden space-y-4">
          {pendingBookings.map((booking, index) => {
            const serviceName = typeof booking.service === 'object' ? booking.service.name : 'Service';
            const providerName = typeof booking.provider === 'object' ? booking.provider.businessName : 'Provider';
            const bookingDate = format(new Date(booking.date), 'MMM d, yyyy');
            const bookingTime = booking.timeSlot?.startTime || '10:00';
            
            return (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_e, info) => handleSwipe(booking._id, info)}
                className={`${glassCardClass} p-4 relative overflow-hidden ${
                  swipeDirection[booking._id] === 'right' ? 'bg-[#22c55e]/20' : swipeDirection[booking._id] === 'left' ? 'bg-red-500/20' : ''
                }`}
              >
                {/* Swipe Indicators */}
                <AnimatePresence>
                  {swipeDirection[booking._id] === 'right' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-[#22c55e]/20 flex items-center justify-center"
                    >
                      <CheckCircle className="w-12 h-12 text-[#22c55e]" />
                    </motion.div>
                  )}
                  {swipeDirection[booking._id] === 'left' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-red-500/20 flex items-center justify-center"
                    >
                      <XCircle className="w-12 h-12 text-red-400" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-white mb-1">{booking.customer.name}</p>
                      <p className="text-sm text-gray-400 mb-1">{serviceName}</p>
                      <p className="text-xs text-gray-500">{providerName}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-white">₦{booking.pricing?.totalAmount?.toLocaleString() || '0'}</span>
                      <p className="text-xs text-gray-400 mt-1">{booking.bookingNumber}</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-2">
                      {bookingDate} | {bookingTime}
                    </p>
                    {booking.createdAt && (
                      <p className="text-xs text-gray-500">Uploaded: {format(new Date(booking.createdAt), 'MMM d, h:mm a')}</p>
                    )}
                  </div>
                  {booking.receiptImageUrl && (
                    <>
                      <button
                        onClick={() => setExpandedId(expandedId === booking._id ? null : booking._id)}
                        className="w-full mb-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-300">View Receipt</span>
                        {expandedId === booking._id ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedId === booking._id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-3 overflow-hidden"
                          >
                            <img
                              src={booking.receiptImageUrl}
                              alt="Receipt"
                              className="w-full rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(booking.receiptImageUrl!, '_blank')}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(booking._id)}
                      disabled={verifying === booking._id}
                      className="flex-1 bg-[#22c55e] hover:bg-green-600 text-white rounded-full backdrop-blur-xl disabled:opacity-50"
                    >
                      {verifying === booking._id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Verify
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDecline(booking._id)}
                      disabled={verifying === booking._id}
                      className="flex-1 border-red-400/50 text-red-400 hover:bg-red-500/10 rounded-full backdrop-blur-xl disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">Swipe right to approve | Swipe left to decline</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Expanded Receipt Modal for Desktop */}
        <AnimatePresence>
          {expandedId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedId(null)}
              className="hidden md:flex fixed inset-0 z-50 bg-black/80 backdrop-blur-sm items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-4xl w-full bg-gray-800 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-white">
                    {pendingBookings.find(b => b._id === expandedId)?.bookingNumber}
                  </h3>
                  <button
                    onClick={() => setExpandedId(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                {pendingBookings.find(b => b._id === expandedId)?.receiptImageUrl && (
                  <img
                    src={pendingBookings.find(b => b._id === expandedId)?.receiptImageUrl}
                    alt="Receipt"
                    className="w-full rounded-lg mb-4"
                  />
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (expandedId) {
                        handleApprove(expandedId);
                      }
                    }}
                    disabled={!expandedId || verifying === expandedId}
                    className="flex-1 bg-[#22c55e] hover:bg-green-600 text-white disabled:opacity-50"
                  >
                    {verifying === expandedId ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Verify & Confirm
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (expandedId) {
                        handleDecline(expandedId);
                      }
                    }}
                    disabled={!expandedId || verifying === expandedId}
                    className="flex-1 border-red-400/50 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
          </>
        )}
      </div>

      {/* Mobile Bottom Dock */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-8px_30px_rgb(0,0,0,0.5)]"
      >
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {adminNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#22c55e]/20 text-[#22c55e]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium truncate w-full text-center">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
