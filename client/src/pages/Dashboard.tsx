import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  MessageCircle,
  Play,
  Package,
  BookOpen,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  Plus,
  Store,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { bookingApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Booking } from '../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Array<{
    id: string;
    client: string;
    phone: string;
    service: string;
    time: string;
    status: string;
    price: number;
  }>>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [appointmentStatuses, setAppointmentStatuses] = useState<{ [key: string]: string }>({});

  const totalGMV = recentBookings.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);
  const totalEscrow = recentBookings.reduce((sum, b) => sum + (b.pricing?.depositAmount || 0), 0);

  const stats = {
    netRevenue: totalGMV,
    revenueGrowth: totalGMV > 0 ? 15 : 0,
    totalBookingsCount: recentBookings.length,
    depositEscrow: totalEscrow,
    activeServicesCount: recentBookings.length,
  };

  useEffect(() => {
    const cached = localStorage.getItem('nile_dashboard_bookings');
    if (cached) {
      try {
        setRecentBookings(JSON.parse(cached));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await bookingApi.getBookings({ limit: 50 });
        const allBookings = response.bookings || [];
        setRecentBookings(allBookings.slice(0, 6));
        localStorage.setItem('nile_dashboard_bookings', JSON.stringify(allBookings.slice(0, 6)));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayList = allBookings
          .filter((booking: Booking) => {
            const bookingDate = new Date(booking.date);
            bookingDate.setHours(0, 0, 0, 0);
            return bookingDate >= today;
          })
          .slice(0, 5)
          .map((booking: Booking) => {
            const serviceName = typeof booking.service === 'object' ? booking.service.name : 'Service';
            const timeSlot = booking.timeSlot || { startTime: '10:00', endTime: '11:00' };
            const time = new Date(`2000-01-01T${timeSlot.startTime}`).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });

            return {
              id: booking._id,
              client: booking.customer.name,
              phone: booking.customer.phone,
              service: serviceName,
              time,
              status: booking.status,
              price: booking.pricing?.totalAmount || booking.pricing?.servicePrice || 0,
            };
          });

        setUpcomingAppointments(todayList);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        // Clean fallback
        setUpcomingAppointments([]);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [user?._id]);

  const handleWhatsAppNudge = (appointment: typeof upcomingAppointments[0]) => {
    const message = encodeURIComponent(
      `Hi ${appointment.client.split(' ')[0]}, this is ${user?.businessName || 'your provider'} from Nile. Checking in on our ${appointment.service} session at ${appointment.time}. See you soon!`
    );
    const phone = appointment.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
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
              to={`/p/${user?.slug || 'the-modern-barber'}`}
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

        {/* 4 Stripe-Style Clean Metric Cards */}
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
              <div className="text-2xl font-semibold text-zinc-900 tracking-tight">
                ₦{(stats.netRevenue / 1000).toFixed(0)}k
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span className="inline-flex items-center text-emerald-600 font-medium">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  +{stats.revenueGrowth}%
                </span>
                <span className="text-zinc-400">vs last week</span>
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
              <div className="text-2xl font-semibold text-zinc-900 tracking-tight">
                {stats.totalBookingsCount}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                32 confirmed • 16 pending
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
              <div className="text-2xl font-semibold text-zinc-900 tracking-tight">
                ₦{(stats.depositEscrow / 1000).toFixed(0)}k
              </div>
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
              <div className="text-2xl font-semibold text-zinc-900 tracking-tight">
                {stats.activeServicesCount} Offered
              </div>
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
                    {recentBookings.length > 0 ? (
                      recentBookings.map((booking) => {
                        const serviceName = typeof booking.service === 'object' ? booking.service.name : 'Service';
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
                              const url = `https://nilebooking.co/p/${user?.slug || 'my-shop'}`;
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
                {upcomingAppointments.map((item) => {
                  const isInProgress = appointmentStatuses[item.id] === 'in_progress';
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-lg border transition-all ${
                        isInProgress
                          ? 'border-emerald-500 bg-emerald-50/40'
                          : 'border-zinc-200 bg-zinc-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-zinc-900">{item.client}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{item.service}</p>
                        </div>
                        <span className="text-xs font-medium text-zinc-700 bg-white px-2 py-0.5 rounded border border-zinc-200">
                          {item.time}
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
                          onClick={() => handleStartSession(item.id)}
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
                })}
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
