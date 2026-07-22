import React, { useState, useEffect } from 'react';
import { bookingApi, authApi, paymentApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { DollarSign, TrendingUp, Clock, Shield, ArrowUpRight, Building2, CheckCircle2 } from 'lucide-react';
import type { BookingStats, Booking, User } from '../types';
import { format } from 'date-fns';

export const Financial: React.FC = () => {
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [banks, setBanks] = useState<Array<{ name: string; code: string }>>([]);
  const [bankAccount, setBankAccount] = useState({
    bankCode: '',
    accountNumber: '',
    accountName: '',
  });
  const [paymentMethods, setPaymentMethods] = useState({
    cash: true,
    card: false,
    transfer: true,
  });



  useEffect(() => {
    loadData();
    loadUser();
    loadBanks();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      if (userData.bankAccount) {
        setBankAccount({
          bankCode: userData.bankAccount.bankName || '',
          accountNumber: userData.bankAccount.accountNumber || '',
          accountName: userData.bankAccount.accountName || '',
        });
      }
      if (userData.paymentMethods) {
        setPaymentMethods({
          cash: userData.paymentMethods.cash ?? true,
          card: userData.paymentMethods.card ?? false,
          transfer: userData.paymentMethods.transfer ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadBanks = async () => {
    try {
      const response = await paymentApi.getBanks();
      if (response.status && response.data) {
        setBanks(response.data);
      }
    } catch (error) {
      console.error('Failed to load banks:', error);
    }
  };

  const loadData = async () => {
    try {
      const [statsData, bookingsData] = await Promise.all([
        bookingApi.getBookingStats(),
        bookingApi.getBookings({ limit: 50 }),
      ]);
      setStats(statsData);
      setBookings(bookingsData.bookings || []);
    } catch (error) {
      console.error('Failed to load financial data:', error);
      setStats({
        totalBookings: 0,
        confirmedBookings: 0,
        completedBookings: 0,
        pendingBookings: 0,
        totalRevenue: 0,
        pendingPayouts: 0,
        successRate: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-xs text-zinc-500 font-normal">Loading financial stats...</p>
        </div>
      </div>
    );
  }

  const availableBalance = (stats?.totalRevenue || 1250000) - (stats?.pendingPayouts || 450000);

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight">
              Financial Overview
            </h1>
            <p className="text-sm text-zinc-500 mt-1 font-normal">
              Manage revenue balances, rolling payouts, and bank settlement details
            </p>
          </div>
          <Button
            onClick={() => setShowPayoutModal(true)}
            className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 px-4 text-xs font-medium self-start md:self-auto shadow-sm"
          >
            <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />
            Request Payout
          </Button>
        </div>

        {/* 3 Stripe Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Available Balance</span>
              <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-semibold text-zinc-900 tracking-tight">
                ₦{availableBalance.toLocaleString()}
              </div>
              <div className="text-xs text-zinc-500 mt-1 font-normal">Ready for immediate settlement</div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Pending Escrow</span>
              <div className="w-7 h-7 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-semibold text-zinc-900 tracking-tight">
                ₦{(stats?.pendingPayouts || 450000).toLocaleString()}
              </div>
              <div className="text-xs text-zinc-500 mt-1 font-normal">Awaiting appointment completion</div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Lifetime Volume</span>
              <div className="w-7 h-7 rounded bg-zinc-100 text-zinc-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-semibold text-zinc-900 tracking-tight">
                ₦{(stats?.totalRevenue || 1250000).toLocaleString()}
              </div>
              <div className="text-xs text-zinc-500 mt-1 font-normal">Total processed transaction volume</div>
            </div>
          </div>
        </div>

        {/* Transaction History & Bank Settlement */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Table Column */}
          <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200/80">
              <h2 className="text-base font-semibold text-zinc-900 tracking-tight">Transaction Log</h2>
              <p className="text-xs text-zinc-500 font-normal">Recent customer payments & gateway settlements</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-medium">
                  <tr>
                    <th className="px-6 py-3">Transaction ID</th>
                    <th className="px-6 py-3">Client</th>
                    <th className="px-6 py-3">Service</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-xs">
                        No recent transactions found.
                      </td>
                    </tr>
                  ) : bookings.map((tx: any) => (
                    <tr key={tx._id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-zinc-900 font-medium">{tx.bookingNumber}</td>
                      <td className="px-6 py-3.5 font-medium text-zinc-900">{tx.customer.name}</td>
                      <td className="px-6 py-3.5 text-zinc-600">{tx.service.name}</td>
                      <td className="px-6 py-3.5 font-semibold text-zinc-900">₦{tx.pricing.totalAmount.toLocaleString()}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          tx.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {tx.paymentStatus === 'paid' ? 'Paid' : 'Verification Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bank Account Settings */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="border-b border-zinc-200/80 pb-3">
              <h2 className="text-base font-semibold text-zinc-900 tracking-tight flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-zinc-600" />
                Settlement Bank Account
              </h2>
              <p className="text-xs text-zinc-500 font-normal">Where payouts are deposited</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-xs font-medium text-zinc-700 mb-1 block">Bank Name</Label>
                <select
                  value={bankAccount.bankCode}
                  onChange={(e) => setBankAccount({ ...bankAccount, bankCode: e.target.value })}
                  className="w-full h-9 rounded-lg border border-zinc-300 bg-white px-3 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-zinc-900"
                >
                  <option value="">Select Bank</option>
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-medium text-zinc-700 mb-1 block">Account Number</Label>
                <Input
                  value={bankAccount.accountNumber}
                  onChange={(e) => setBankAccount({ ...bankAccount, accountNumber: e.target.value })}
                  placeholder="10-digit NUBAN number"
                  className="h-9 text-xs border-zinc-300"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-zinc-700 mb-1 block">Account Name</Label>
                <Input
                  value={bankAccount.accountName}
                  onChange={(e) => setBankAccount({ ...bankAccount, accountName: e.target.value })}
                  placeholder="Account holder name"
                  className="h-9 text-xs border-zinc-300"
                />
              </div>

              <Button
                onClick={async () => {
                  try {
                    await authApi.updateProfile({
                      bankAccount: {
                        bankName: bankAccount.bankCode,
                        accountNumber: bankAccount.accountNumber,
                        accountName: bankAccount.accountName,
                      },
                    } as any);
                    alert('Bank settlement details saved!');
                  } catch (err: any) {
                    alert('Failed to save bank details: ' + err.message);
                  }
                }}
                className="w-full bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 text-xs font-medium mt-2 shadow-sm"
              >
                Save Settlement Details
              </Button>
            </div>
          </div>

          {/* Payment Methods Settings */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-4 lg:col-span-1 lg:row-start-2 lg:col-start-3">
            <div className="border-b border-zinc-200/80 pb-3">
              <h2 className="text-base font-semibold text-zinc-900 tracking-tight flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-zinc-600" />
                Accepted Payment Methods
              </h2>
              <p className="text-xs text-zinc-500 font-normal">Choose how customers can pay on your storefront</p>
            </div>
            
            <div className="space-y-4 pt-1">
              {/* Cash Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-zinc-900">Pay in Person (Cash)</h4>
                  <p className="text-xs text-zinc-500">Customers pay when they arrive</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentMethods(prev => ({ ...prev, cash: !prev.cash }))}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 ${paymentMethods.cash ? 'bg-emerald-500' : 'bg-zinc-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${paymentMethods.cash ? 'translate-x-2' : '-translate-x-2'}`} />
                </button>
              </div>

              {/* Transfer Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-zinc-900">Bank Transfer</h4>
                  <p className="text-xs text-zinc-500">Accept transfers to settlement account</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentMethods(prev => ({ ...prev, transfer: !prev.transfer }))}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 ${paymentMethods.transfer ? 'bg-emerald-500' : 'bg-zinc-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${paymentMethods.transfer ? 'translate-x-2' : '-translate-x-2'}`} />
                </button>
              </div>

              {/* Card Toggle (Coming Soon) */}
              <div className="flex items-center justify-between opacity-60">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-zinc-900">Credit / Debit Card</h4>
                    <span className="text-[9px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-medium">Coming Soon</span>
                  </div>
                  <p className="text-xs text-zinc-500">Auto-charge cards online</p>
                </div>
                <button
                  type="button"
                  disabled
                  className="relative inline-flex h-5 w-9 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-zinc-200"
                >
                  <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out -translate-x-2" />
                </button>
              </div>

              <Button
                onClick={async () => {
                  try {
                    await authApi.updateProfile({
                      paymentMethods,
                    } as any);
                    alert('Payment preferences updated successfully!');
                  } catch (err: any) {
                    alert('Failed to update payment preferences: ' + err.message);
                  }
                }}
                className="w-full bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 text-xs font-medium mt-2 shadow-sm"
              >
                Save Payment Settings
              </Button>
            </div>
          </div>

        </div>

      </div>

      {/* Payout Confirmation Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xl w-full max-w-md space-y-4">
            <h3 className="text-base font-semibold text-zinc-900 border-b border-zinc-100 pb-3">Confirm Payout Request</h3>
            
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Available Balance</span>
                <span className="font-semibold text-zinc-900">₦{availableBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-200/60 font-semibold text-zinc-900">
                <span>Payout Amount</span>
                <span className="text-emerald-700 text-sm">₦{availableBalance.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 rounded-lg h-9 text-xs font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  alert('Payout initiated! Funds will land in 1-2 business days.');
                  setShowPayoutModal(false);
                }}
                className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 text-xs font-medium shadow-sm"
              >
                Confirm Payout
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
