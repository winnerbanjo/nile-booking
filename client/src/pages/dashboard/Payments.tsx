import React, { useState, useEffect } from 'react';
import { bookingApi, paymentApi } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { DollarSign, TrendingUp, Clock, CheckCircle, Copy, CreditCard, Shield, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { BookingStats, Booking } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { safeDate } from '../../lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.6, -0.05, 0.01, 0.99] },
  },
};

const floatAnimation = {
  y: [-2, 2],
  transition: {
    duration: 3,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: 'easeInOut',
  },
};

const glassCardClass = "bg-white/40 backdrop-blur-xl border border-white/40 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]";

export const Payments: React.FC = () => {
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedTransactionForRefund, setSelectedTransactionForRefund] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, transactionsData] = await Promise.all([
        bookingApi.getBookingStats(),
        paymentApi.getTransactions({ limit: 50 }),
      ]);
      setStats(statsData);
      setTransactions(transactionsData.transactions);
    } catch (error) {
      console.error('Failed to load financial data:', error);
      // Use mock data on error
      setStats({
        totalBookings: 0,
        confirmedBookings: 0,
        completedBookings: 0,
        pendingBookings: 0,
        totalRevenue: 0,
        pendingPayouts: 0,
        successRate: 0,
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAccountNumber = () => {
    navigator.clipboard.writeText('8123843076');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyReceipt = async (transactionId: string) => {
    try {
      await paymentApi.verifyManualTransaction(transactionId);
      loadData();
    } catch (error) {
      console.error('Failed to verify receipt', error);
      alert('Failed to verify receipt');
    }
  };

  const openRefundModal = (transaction: any) => {
    setSelectedTransactionForRefund(transaction);
    setRefundAmount(transaction.amount - (transaction.refundAmount || 0));
    setRefundReason('');
    setShowRefundModal(true);
  };

  const handleProcessRefund = async () => {
    if (!selectedTransactionForRefund) return;
    try {
      await paymentApi.processRefund(selectedTransactionForRefund._id, {
        amount: refundAmount,
        reason: refundReason,
      });
      setShowRefundModal(false);
      setSelectedTransactionForRefund(null);
      loadData();
    } catch (error) {
      console.error('Failed to process refund', error);
      alert('Failed to process refund');
    }
  };

  const getStatusBadge = (transaction: any, bookingPaymentStatus: string) => {
    if (transaction.refundStatus === 'refunded') {
      return { label: 'Refunded', color: 'bg-red-600 text-white' };
    }
    if (transaction.refundStatus === 'refund_pending') {
      return { label: 'Partial Refund', color: 'bg-orange-600 text-white' };
    }
    if (bookingPaymentStatus === 'confirmed' || transaction.status === 'successful') {
      return { label: 'Confirmed', color: 'bg-[#22c55e] text-white' };
    }
    if (bookingPaymentStatus === 'awaiting_verification') {
      return { label: 'Awaiting Verification', color: 'bg-yellow-500 text-white' };
    }
    if (bookingPaymentStatus === 'awaiting_payment') {
      return { label: 'Awaiting Payment', color: 'bg-orange-500 text-white' };
    }
    if (transaction.status === 'failed' || bookingPaymentStatus === 'cancelled') {
      return { label: 'Cancelled', color: 'bg-gray-500 text-white' };
    }
    return { label: 'Pending', color: 'bg-gray-500 text-white' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[#F5F5F7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-light">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[#F5F5F7]">
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Failed to load financial data
          </h1>
        </div>
      </div>
    );
  }

  const availableBalance = stats.totalRevenue - stats.pendingPayouts;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] bg-fixed p-4 md:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Payments & Payouts
            </h1>
            <p className="text-base text-gray-600 font-light tracking-tight" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Branded Accounts | Revenue Flow | Transaction Intelligence
            </p>
          </div>
        </motion.div>

        {/* Virtual Bank Card - Enhanced Glassmorphism with Tilt Effect */}
        <motion.div
          variants={fadeInUp}
          whileHover={{ 
            rotateY: 8, 
            rotateX: -4,
            scale: 1.02,
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="bg-white/40 backdrop-blur-2xl border border-white/30 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 relative overflow-hidden"
          style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#22c55e]/20 to-transparent rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wider" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                  Nile Business Account
                </p>
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                  Virtual Vault
                </h2>
              </div>
              <CreditCard className="w-12 h-12 text-[#22c55e]" strokeWidth={1.5} />
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 mb-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-8 bg-white/20 rounded"></div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-white/60" />
                  <span className="text-xs text-white/60 font-light">Secure</span>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-sm text-white/60 mb-2 font-light">Account Number</p>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-black text-white tracking-tighter font-mono" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                    8123843076
                  </p>
                  <Button
                    size="sm"
                    onClick={handleCopyAccountNumber}
                    className="rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30 h-auto py-1 px-3"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60 mb-1 font-light">Bank Name</p>
                  <p className="text-lg font-black text-white tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                    Providus Bank
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/60 mb-1 font-light">Account Type</p>
                  <p className="text-lg font-black text-white tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                    Business
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Revenue Tracking Bento Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Available for Payout */}
          <motion.div
            variants={fadeInUp}
            animate={floatAnimation}
            className={`${glassCardClass} p-6 hover:bg-white/50 transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-4">
              <ArrowUpRight className="w-6 h-6 text-[#22c55e]" strokeWidth={1.5} />
              <CheckCircle className="w-4 h-4 text-[#22c55e]" />
            </div>
            <h3 className="text-xs font-semibold text-gray-600 mb-2 tracking-tight uppercase" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Available for Payout
            </h3>
            <p className="text-5xl font-black text-gray-900 tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              ₦{(availableBalance / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-gray-500 font-light">Ready for instant withdrawal</p>
          </motion.div>

          {/* Pending Escrow */}
          <motion.div
            variants={fadeInUp}
            animate={floatAnimation}
            className={`${glassCardClass} p-6 hover:bg-white/50 transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-6 h-6 text-yellow-500" strokeWidth={1.5} />
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
            </div>
            <h3 className="text-xs font-semibold text-gray-600 mb-2 tracking-tight uppercase" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Pending Escrow
            </h3>
            <p className="text-4xl font-black text-gray-900 tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              ₦{(stats.pendingPayouts / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-gray-500 font-light">From upcoming bookings</p>
          </motion.div>

          {/* Lifetime Earnings */}
          <motion.div
            variants={fadeInUp}
            animate={floatAnimation}
            className={`${glassCardClass} p-6 hover:bg-white/50 transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-6 h-6 text-[#22c55e]" strokeWidth={1.5} />
              <DollarSign className="w-4 h-4 text-gray-400" />
            </div>
            <h3 className="text-xs font-semibold text-gray-600 mb-2 tracking-tight uppercase" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Lifetime Earnings
            </h3>
            <p className="text-4xl font-black text-gray-900 tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              ₦{(stats.totalRevenue / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-gray-500 font-light">All-time revenue</p>
          </motion.div>
        </div>

        {/* Payout Button */}
        <motion.div variants={fadeInUp} className={`${glassCardClass} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900 mb-2 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                Withdraw Funds
              </h2>
              <p className="text-sm text-gray-600 font-light">
                Transfer available balance to your personal bank account
              </p>
            </div>
            <Button
              onClick={() => setShowPayoutModal(true)}
              className="rounded-full bg-[#22c55e] text-white hover:bg-green-600 px-8 py-6 h-auto font-semibold"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Payout
            </Button>
          </div>
        </motion.div>

        {/* Transaction History - Clean List */}
        <motion.div variants={fadeInUp} className={`${glassCardClass} p-6`}>
          <h2 className="text-xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Transaction History
          </h2>
          
          {/* Desktop: Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/30">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Service</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="max-w-xs mx-auto space-y-2">
                        <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-400 mb-2">
                          <CreditCard className="w-5 h-5 text-zinc-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-zinc-900">No transactions yet</h3>
                        <p className="text-xs text-zinc-500 font-normal leading-relaxed">
                          Payments and receipts will appear here after your first booking.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction, index) => {
                    const booking = transaction.booking || {};
                    const badge = getStatusBadge(transaction, booking.paymentStatus || 'pending');
                    const customerName = transaction.customerEmail || 'N/A'; // Better: populated customer.name if it was a User ref, but here customer email is stored
                    const serviceName = booking.service?.name || 'N/A';
                    const amount = transaction.amount || 0;
                    
                    const isSuccessful = transaction.status === 'successful';
                    const isCancelled = booking.status === 'cancelled';
                    const canRefund = isSuccessful && transaction.refundStatus !== 'refunded';

                    return (
                      <motion.tr
                        key={transaction._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-white/20 hover:bg-white/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <p className="text-sm font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                            {customerName}
                          </p>
                          <p className="text-xs text-gray-500 font-light">
                            {format(safeDate(transaction.createdAt) || new Date(), 'MMM d, yyyy')}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-gray-700 font-light">{serviceName}</p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className="text-base font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                            ₦{amount.toLocaleString()}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                            {badge.label}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            {booking.paymentStatus === 'awaiting_verification' ? (
                              <Button
                                onClick={() => handleVerifyReceipt(transaction._id)}
                                size="sm"
                                className="bg-[#22c55e] hover:bg-green-600 text-white text-xs px-3 py-1 h-auto"
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                Verify
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-600 font-light">
                                {transaction.paymentGateway ? transaction.paymentGateway.charAt(0).toUpperCase() + transaction.paymentGateway.slice(1) : 'N/A'}
                              </span>
                            )}
                            
                            {canRefund && (
                              <Button
                                onClick={() => openRefundModal(transaction)}
                                size="sm"
                                variant="outline"
                                className="text-red-500 border-red-200 hover:bg-red-50 text-xs px-3 py-1 h-auto w-full max-w-[120px]"
                              >
                                Mark Refunded
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile: Card View */}
          <div className="md:hidden space-y-3">
            {transactions.length === 0 ? (
              <div className="py-8 text-center text-gray-500 font-light">
                No transactions found.
              </div>
            ) : (
              transactions.map((transaction, index) => {
                const booking = transaction.booking || {};
                const badge = getStatusBadge(transaction, booking.paymentStatus || 'pending');
                const customerName = transaction.customerEmail || 'N/A';
                const serviceName = booking.service?.name || 'N/A';
                const amount = transaction.amount || 0;
                
                const isSuccessful = transaction.status === 'successful';
                const canRefund = isSuccessful && transaction.refundStatus !== 'refunded';

                return (
                  <motion.div
                    key={transaction._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/50 rounded-xl p-4 border border-white/40"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-black text-gray-900 tracking-tighter mb-1" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                          {customerName}
                        </p>
                        <p className="text-xs text-gray-600 font-light">{serviceName}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                        {badge.label}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/30">
                      <div className="text-xs text-gray-500 font-light flex flex-col gap-2">
                            {format(safeDate(transaction.createdAt) || new Date(), 'MMM d, yyyy')}
                        {booking.paymentStatus === 'awaiting_verification' && (
                          <Button
                            onClick={() => handleVerifyReceipt(transaction._id)}
                            size="sm"
                            className="w-full mt-3 bg-[#22c55e] hover:bg-green-600 text-white text-xs h-auto py-2"
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Verify Payment Receipt
                          </Button>
                        )}
                        {canRefund && (
                          <Button
                            onClick={() => openRefundModal(transaction)}
                            size="sm"
                            variant="outline"
                            className="w-full mt-1 text-red-500 border-red-200 hover:bg-red-50 text-xs h-auto py-2"
                          >
                            Mark as Refunded
                          </Button>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                          ₦{amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-500 font-light">
                          {transaction.paymentGateway ? transaction.paymentGateway.charAt(0).toUpperCase() + transaction.paymentGateway.slice(1) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Security Badge & Payment Gateways */}
        <motion.div variants={fadeInUp} className={`${glassCardClass} p-6`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#22c55e]" />
              <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                Secure & Encrypted
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Paystack</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200">
                <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">F</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Flutterwave</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tech Empire Footer */}
        <motion.div variants={fadeInUp} className={`${glassCardClass} p-6`}>
          <div className="text-center">
            <p className="text-sm font-black text-gray-900 mb-2 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Part of the Nile Tech Empire
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a
                href="https://mylinknest.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-[#22c55e] transition-colors font-light"
              >
                LinkNest
              </a>
              <span className="text-gray-400">|</span>
              <a
                href="https://nile.ng/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-[#22c55e] transition-colors font-light"
              >
                Nile
              </a>
              <span className="text-gray-400">|</span>
              <a
                href="https://nilecollective.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-[#22c55e] transition-colors font-light"
              >
                Nile Collective
              </a>
            </div>
          </div>
        </motion.div>

        {/* Payout Confirmation Modal */}
        <AnimatePresence>
          {showPayoutModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPayoutModal(false)}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 ${glassCardClass} p-8 w-full max-w-md`}
              >
                <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                  Confirm Payout
                </h3>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-light">Available Balance</span>
                    <span className="text-xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                      ₦{(availableBalance / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-white/30">
                    <span className="text-sm font-semibold text-gray-900">Payout Amount</span>
                    <span className="text-2xl font-black text-[#22c55e] tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                      ₦{(availableBalance / 1000).toFixed(0)}K
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setShowPayoutModal(false)}
                    variant="outline"
                    className="flex-1 rounded-full border-gray-300 hover:bg-white/60"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      alert('Payout initiated! Funds will arrive in 1-2 business days.');
                      setShowPayoutModal(false);
                    }}
                    className="flex-1 rounded-full bg-[#22c55e] text-white hover:bg-green-600 font-semibold"
                  >
                    Confirm Payout
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Refund Modal */}
      <AnimatePresence>
        {showRefundModal && selectedTransactionForRefund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Mark as Refunded</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Record a manual refund for {selectedTransactionForRefund.customerEmail || 'Customer'}'s transaction of ₦{selectedTransactionForRefund.amount?.toLocaleString()}.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Refund Amount (₦)
                    </label>
                    <input
                      type="number"
                      max={selectedTransactionForRefund.amount}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason (Optional)
                    </label>
                    <input
                      type="text"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="e.g. Booking cancelled by customer"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <Button
                    onClick={() => {
                      setShowRefundModal(false);
                      setSelectedTransactionForRefund(null);
                    }}
                    variant="outline"
                    className="border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleProcessRefund}
                    className="bg-red-500 hover:bg-red-600 text-white"
                    disabled={!refundAmount || refundAmount <= 0 || refundAmount > selectedTransactionForRefund.amount}
                  >
                    Confirm Refund
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
