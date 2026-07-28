import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, TrendingUp, ShieldAlert, Clock, CheckCircle2, 
  Users, User, Activity, ArrowUpRight, CreditCard
} from 'lucide-react';
import { adminApi } from '../../lib/api';

export const AdminDashboard: React.FC = () => {
  const { data: statsData, isLoading, isError } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.getAdminStats(),
    staleTime: 1000 * 30, // 30s
  });

  const kpiData = {
    ecosystemGMV: statsData?.gmv || 0,
    activeSubscriptions: statsData?.activeProviders || 0,
    completedGMV: statsData?.gmv || 0,
    pendingSettlement: 0,
    pendingVerifications: statsData?.pendingTransfers || 0,
    activeProviders: statsData?.activeProviders || 0,
    totalCustomers: statsData?.totalCustomers || 0,
    totalBookings: statsData?.totalBookings || 0,
    recentProviders: statsData?.recentProviders || [],
  };

  const formatMoney = (amount: number) => {
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Platform Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Live metrics across the Nile Booking ecosystem.</p>
        </div>
      </div>

      {/* KPI Grid - Row 1 (Financials) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ecosystem GMV</h3>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-gray-900 tracking-tighter">
              {isLoading ? '...' : formatMoney(kpiData.ecosystemGMV)}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Verified Bookings</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Providers</h3>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-emerald-600 tracking-tighter">
              {isLoading ? '...' : kpiData.activeSubscriptions}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <span>Registered merchants</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Completed GMV</h3>
            <CheckCircle2 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-gray-900 tracking-tighter">
              {isLoading ? '...' : formatMoney(kpiData.completedGMV)}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <span>Completed appointments</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Settlement</h3>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-gray-900 tracking-tighter">
              {isLoading ? '...' : formatMoney(kpiData.pendingSettlement)}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-600">
            <span>Deposits held for future bookings</span>
          </div>
        </div>
      </div>

      {/* KPI Grid - Row 2 (Operations) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Active Providers</h3>
            <p className="text-2xl font-black text-gray-900">{kpiData.activeProviders}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Customers</h3>
            <p className="text-2xl font-black text-gray-900">{kpiData.totalCustomers.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pending Verifications</h3>
            <p className="text-2xl font-black text-gray-900">{kpiData.pendingVerifications}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Bookings</h3>
            <p className="text-2xl font-black text-gray-900">{kpiData.totalBookings}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Merchant Registrations */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Recent Merchant Registrations</h3>
              <Link to="/admin/providers" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3">Business Name</th>
                    <th className="px-6 py-3">Owner Email</th>
                    <th className="px-6 py-3">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {kpiData.recentProviders.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                        No merchants registered yet
                      </td>
                    </tr>
                  ) : (
                    kpiData.recentProviders.map((p: any) => (
                      <tr key={p._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{p.businessName || p.name}</td>
                        <td className="px-6 py-4 text-xs font-mono text-gray-600">{p.email}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Side Column */}
        <div className="space-y-6">
          {/* System Status */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">System Status</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Vercel API Gateway</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">MongoDB Atlas</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Mailtrap Sending API</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
