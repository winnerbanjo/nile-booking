import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  TrendingUp,
  MessageCircle,
  Play,
  Package,
  BookOpen,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Plus,
  Store,
  Calendar,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { dashboardApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Booking } from '../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointmentStatuses, setAppointmentStatuses] = useState<{ [key: string]: string }>({});

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboardSummary', user?._id],
    queryFn: () => dashboardApi.getSummary(),
    enabled: !!user?._id,
    staleTime: 1000 * 30, // 30 seconds
  });

  const metrics = data?.metrics || {
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    totalDepositEscrow: 0,
    totalCustomers: 0,
    activeServices: 0,
  };

  const recentBookings: Booking[] = data?.recentBookings || [];
  const upcomingAppointments: any[] = data?.upcomingAppointments || [];

  const handleWhatsAppNudge = (appointment: any) => {
    const clientName = appointment.customer?.name || 'Client';
    const clientPhone = (appointment.customer?.phone || '').replace(/[^0-9]/g, '');
    const serviceName = typeof appointment.service === 'object' ? appointment.service.name : 'Booking';
    const startTime = appointment.timeSlot?.startTime || 'your scheduled time';

    const message = encodeURIComponent(
      `Hi ${clientName.split(' ')[0]}, this is ${user?.businessName || 'your provider'} from Nile. Checking in on our ${serviceName} session at ${startTime}. See you soon!`
    );
    window.open(`https://wa.me/${clientPhone}?text=${message}`, '_blank');
  };

  const handleStartSession = (appointmentId: string) => {
    setAppointmentStatuses((prev) => ({
      ...prev,
      [appointmentId]: 'in_progress',
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight">
                Dashboard Overview
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Live Storefront
              </span>
            </div>
            <p className="text-sm text-zinc-500 mt-1 font-normal">
              {user?.businessName || 'Merchant Storefront'} • {user?.email}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to={`/p/${user?.slug || ''}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors shadow-2xs"
            >
              <Store className="w-3.5 h-3.5 text-zinc-500" />
              View Public Store
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </Link>
            <Link
              to="/dashboard/services"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Service
            </Link>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Net Revenue */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm hover:border-zinc-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Gross Volume</span>
              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-zinc-600" />
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <div className="h-8 w-24 bg-zinc-100 animate-pulse rounded"></div>
              ) : (
                <div className="text-2xl font-semibold text-zinc-900 tracking-tight">
                  ₦{metrics.totalRevenue.toLocaleString()}
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span className="inline-flex items-center text-emerald-600 font-medium">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  Verified Payouts
                </span>
              </div>
            </div>
          </div>

          {/* Total Bookings */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm hover:border-zinc-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Bookings</span>
              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-zinc-600" />
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <div className="h-8 w-16 bg-zinc-100 animate-pulse rounded"></div>
              ) : (
                <div className="text-2xl font-semibold text-zinc-900 tracking-tight">
                  {metrics.totalBookings}
                </div>
              )}
              <div className="text-xs text-zinc-500 mt-1">
                {metrics.confirmedBookings} confirmed • {metrics.pendingBookings} pending
              </div>
            </div>
          </div>

          {/* Deposit Escrow */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm hover:border-zinc-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Deposit Escrow</span>
              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-zinc-600" />
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <div className="h-8 w-24 bg-zinc-100 animate-pulse rounded"></div>
              ) : (
                <div className="text-2xl font-semibold text-zinc-900 tracking-tight">
                  ₦{metrics.totalDepositEscrow.toLocaleString()}
                </div>
              )}
              <div className="text-xs text-zinc-500 mt-1">
                Rolling 2-day payouts
              </div>
            </div>
          </div>

          {/* Active Services */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm hover:border-zinc-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Active Services</span>
              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                <Package className="w-4 h-4 text-zinc-600" />
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <div className="h-8 w-16 bg-zinc-100 animate-pulse rounded"></div>
              ) : (
                <div className="text-2xl font-semibold text-zinc-900 tracking-tight">
                  {metrics.activeServices} Offered
                </div>
              )}
              <div className="text-xs text-emerald-600 font-medium mt-1">
                Online & available
              </div>
            </div>
          </div>

        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column (2/3 width) - Recent Bookings Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-zinc-200/80 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-200/80 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                    Recent Bookings
                  </h2>
                  <p className="text-xs text-zinc-500 font-normal">
                    Latest client appointments & payment statuses
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-xs text-zinc-600 hover:text-zinc-900">
                  <Link to="/dashboard/bookings">View all</Link>
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/70 border-b border-zinc-200/80 text-zinc-500 font-medium">
                    <tr>
                      <th className="px-6 py-3">Client</th>
                      <th className="px-6 py-3">Service</th>
                      <th className="px-6 py-3">Date & Time</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4"><div className="h-4 w-28 bg-zinc-100 rounded"></div></td>
                          <td className="px-6 py-4"><div className="h-4 w-24 bg-zinc-100 rounded"></div></td>
                          <td className="px-6 py-4"><div className="h-4 w-20 bg-zinc-100 rounded"></div></td>
                          <td className="px-6 py-4"><div className="h-4 w-16 bg-zinc-100 rounded"></div></td>
                          <td className="px-6 py-4"><div className="h-4 w-16 bg-zinc-100 rounded"></div></td>
                        </tr>
                      ))
                    ) : recentBookings.length > 0 ? (
                      recentBookings.map((booking) => {
                        const serviceName = typeof booking.service === 'object' ? booking.service?.name : 'Service';
                        return (
                          <tr key={booking._id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-6 py-3.5 font-medium text-zinc-900">
                              {booking.customer?.name || 'Customer'}
                              <div className="text-[11px] text-zinc-400 font-normal">{booking.customer?.phone}</div>
                            </td>
                            <td className="px-6 py-3.5 font-normal">{serviceName}</td>
                            <td className="px-6 py-3.5 text-zinc-500 font-normal">
                              {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {booking.timeSlot?.startTime || '10:00'}
                            </td>
                            <td className="px-6 py-3.5 font-medium text-zinc-900">
                              ₦{(booking.pricing?.totalAmount || booking.pricing?.servicePrice || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-3.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                booking.status === 'confirmed' || booking.paymentStatus === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {booking.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <p className="text-sm font-medium text-zinc-900 mb-1">No bookings yet</p>
                          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
                            Share your website link with clients to start receiving appointments!
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const url = `https://nilebooking.co/p/${user?.slug || ''}`;
                              navigator.clipboard.writeText(url);
                              alert('Shop link copied to clipboard!');
                            }}
                            className="bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50 text-xs rounded-lg"
                          >
                            Copy My Shop Link
                          </Button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column (1/3 width) - Today's Schedule Flow */}
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                  Today's Schedule
                </h2>
                <span className="text-xs text-zinc-500 font-normal">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    <div className="h-16 bg-zinc-100 animate-pulse rounded-lg"></div>
                    <div className="h-16 bg-zinc-100 animate-pulse rounded-lg"></div>
                  </div>
                ) : upcomingAppointments.length === 0 ? (
                  <div className="py-8 text-center space-y-1">
                    <Calendar className="w-8 h-8 text-zinc-300 mx-auto" />
                    <p className="text-xs font-semibold text-zinc-900">No appointments scheduled for today</p>
                    <p className="text-[11px] text-zinc-500 font-normal">Upcoming appointments will appear here.</p>
                  </div>
                ) : (
                  upcomingAppointments.map((item) => {
                    const isInProgress = appointmentStatuses[item._id] === 'in_progress';
                    const serviceName = typeof item.service === 'object' ? item.service?.name : 'Service';
                    const timeStr = item.timeSlot?.startTime || '10:00';
                    return (
                      <div
                        key={item._id}
                        className={`p-3.5 rounded-lg border transition-all ${
                          isInProgress
                            ? 'border-emerald-500 bg-emerald-50/40'
                            : 'border-zinc-200 bg-zinc-50/40'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-semibold text-zinc-900">{item.customer?.name}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{serviceName}</p>
                          </div>
                          <span className="text-xs font-medium text-zinc-700 bg-white px-2 py-0.5 rounded border border-zinc-200">
                            {timeStr}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-200/60">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWhatsAppNudge(item)}
                            className="flex-1 h-7 text-[11px] font-medium bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          >
                            <MessageCircle className="w-3 h-3 mr-1 text-emerald-600" />
                            WhatsApp
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleStartSession(item._id)}
                            disabled={isInProgress}
                            className={`flex-1 h-7 text-[11px] font-medium ${
                              isInProgress
                                ? 'bg-emerald-600 text-white'
                                : 'bg-zinc-900 text-white hover:bg-zinc-800'
                            }`}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            {isInProgress ? 'In Progress' : 'Start'}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Storefront Settings Summary Card */}
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                  Storefront Setup
                </h3>
                <Store className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-zinc-500 font-normal">
                Customize your merchant banner, bio, and mobile storefront.
              </p>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full bg-zinc-50 border-zinc-300 text-zinc-900 hover:bg-zinc-100 text-xs font-medium rounded-lg h-9 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Link to="/dashboard/profile" className="flex items-center justify-center gap-1.5">
                  <span>Edit My Website</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                </Link>
              </Button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
