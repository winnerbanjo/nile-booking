import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, Eye, Shield, CheckCircle, Calendar, MessageCircle, Play, Sparkles, Zap, Command, Package, BookOpen, CreditCard, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { bookingApi } from '../lib/api';
import { OnboardingTour } from '../components/OnboardingTour';
import { useAuth } from '../contexts/AuthContext';
import type { Booking } from '../types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
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
const glassCardStyle = { willChange: 'transform' };

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [bookingVelocity, setBookingVelocity] = useState(12);
  const [acceptingBookings, setAcceptingBookings] = useState(true);
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);
  const [brandColor, setBrandColor] = useState('#22c55e');
  const [livePrice, setLivePrice] = useState(15000);
  const [showCommandBar, setShowCommandBar] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Array<{
    id: string;
    client: string;
    phone: string;
    service: string;
    time: string;
    status: string;
    price: number;
  }>>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Mock data for The Modern Barber
  const stats = {
    netRevenue: 1250000,
    revenueGrowth: 40,
    depositEscrow: 450000,
    systemStatus: 'Live',
  };

  const [appointmentStatuses, setAppointmentStatuses] = useState<{ [key: string]: string }>({});

  // Fetch bookings filtered by provider
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?._id) {
        setLoadingBookings(false);
        return;
      }

      try {
        setLoadingBookings(true);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const response = await bookingApi.getBookings({ limit: 50 });
        
        // Filter bookings for today and future, and ensure they belong to the logged-in provider
        const todayBookings = response.bookings
          .filter((booking: Booking) => {
            const bookingDate = new Date(booking.date);
            bookingDate.setHours(0, 0, 0, 0);
            const isTodayOrFuture = bookingDate >= today;
            const belongsToProvider = booking.provider === user._id || 
                                     (typeof booking.provider === 'object' && booking.provider._id === user._id);
            return isTodayOrFuture && belongsToProvider;
          })
          .slice(0, 5) // Limit to 5 for Today's Flow
          .map((booking: Booking) => {
            const serviceName = typeof booking.service === 'object' ? booking.service.name : 'Service';
            const timeSlot = booking.timeSlot || { startTime: '10:00', endTime: '11:00' };
            const time = new Date(`2000-01-01T${timeSlot.startTime}`).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
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

        setUpcomingAppointments(todayBookings);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        // Fallback to mock data if API fails
        setUpcomingAppointments([
          { id: '1', client: 'Adeola Johnson', phone: '+2348123456789', service: 'Faded Cut', time: '10:00 AM', status: 'confirmed', price: 15000 },
          { id: '2', client: 'Chukwu Emeka', phone: '+2348123456790', service: 'Line Up', time: '11:30 AM', status: 'confirmed', price: 12000 },
          { id: '3', client: 'Tunde Adeyemi', phone: '+2348123456791', service: 'Full Cut', time: '2:00 PM', status: 'pending', price: 18000 },
          { id: '4', client: 'Kemi Okafor', phone: '+2348123456792', service: 'Faded Cut', time: '4:00 PM', status: 'confirmed', price: 15000 },
          { id: '5', client: 'David Okonkwo', phone: '+2348123456793', service: 'Premium Wash', time: '5:30 PM', status: 'confirmed', price: 20000 },
        ]);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [user?._id]);

  // WhatsApp nudge handler
  const handleWhatsAppNudge = (appointment: typeof upcomingAppointments[0]) => {
    const message = encodeURIComponent(
      `Hi ${appointment.client.split(' ')[0]}, this is your barber from Nile. Just checking in on our ${appointment.service} session at ${appointment.time}. See you soon!`
    );
    const phone = appointment.phone.replace(/[^0-9]/g, ''); // Remove non-digits
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  // Start session handler
  const handleStartSession = async (appointmentId: string) => {
    try {
      // Update local state to show "In Progress"
      setAppointmentStatuses((prev) => ({
        ...prev,
        [appointmentId]: 'in_progress',
      }));
      
      // In production, this would call the API
      // await bookingApi.updateBookingStatus(appointmentId, 'in_progress');
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  // Simulate booking velocity changes
  useEffect(() => {
    const interval = setInterval(() => {
      setBookingVelocity((prev) => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(5, Math.min(25, prev + change));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Command+K handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandBar(!showCommandBar);
      }
      if (e.key === 'Escape') {
        setShowCommandBar(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandBar]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] bg-fixed p-4 md:p-8">
      <OnboardingTour />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Command Bar */}
        <AnimatePresence>
          {showCommandBar && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCommandBar(false)}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4"
              >
                <div className={`${glassCardClass} p-4`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Command className="w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Type a command or search..."
                      className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 text-sm"
                      autoFocus
                    />
                    <span className="text-xs text-gray-500 font-light">ESC</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="px-3 py-2 hover:bg-white/50 rounded-lg cursor-pointer flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">Go to Services</span>
                    </div>
                    <div className="px-3 py-2 hover:bg-white/50 rounded-lg cursor-pointer flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">View Bookings</span>
                    </div>
                    <div className="px-3 py-2 hover:bg-white/50 rounded-lg cursor-pointer flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">Financial Overview</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Command Center
            </h1>
            <p className="text-base text-gray-600 font-light tracking-tight" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              The Modern Barber | Lagos, Nigeria
            </p>
          </div>
          <Button
            onClick={() => setShowCommandBar(!showCommandBar)}
            className="rounded-full bg-white/40 backdrop-blur-xl border border-white/40 text-gray-700 hover:bg-white/60 px-4 py-2 h-auto transition-all"
          >
            <Command className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Cmd+K</span>
          </Button>
        </motion.div>

        {/* Zone 1: Global HUD - 4 Refractive Glass Tiles */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Net Revenue */}
          <motion.div
            layoutId="revenue-card"
            variants={fadeInUp}
            animate={floatAnimation}
            className={`${glassCardClass} p-4 md:p-6 hover:bg-white/50 transition-all duration-300 relative overflow-hidden group cursor-pointer`}
            style={glassCardStyle}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/dashboard/financial'}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#22c55e]/20 transition-all"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-6 h-6 text-[#22c55e]" strokeWidth={1.5} />
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-[#22c55e]"
                />
              </div>
              <h3 className="text-xs font-semibold text-gray-600 mb-2 tracking-tight uppercase" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                Net Revenue
              </h3>
              <p className="text-3xl font-black text-gray-900 tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                ₦{(stats.netRevenue / 1000).toFixed(0)}K
              </p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#22c55e]" />
                <span className="text-sm font-semibold text-[#22c55e]">+{stats.revenueGrowth}%</span>
                <span className="text-xs text-gray-500 font-light">this week</span>
              </div>
            </div>
          </motion.div>

          {/* Booking Velocity */}
          <motion.div
            layoutId="velocity-card"
            variants={fadeInUp}
            animate={floatAnimation}
            className={`${glassCardClass} p-6 hover:bg-white/50 transition-all duration-300 cursor-pointer`}
            onClick={() => window.location.href = '/dashboard/bookings'}
          >
            <div className="flex items-center justify-between mb-4">
              <Eye className="w-6 h-6 text-[#22c55e]" strokeWidth={1.5} />
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-[#22c55e]"
              />
            </div>
            <h3 className="text-xs font-semibold text-gray-600 mb-2 tracking-tight uppercase" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Booking Velocity
            </h3>
            <motion.p
              key={bookingVelocity}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-3xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}
            >
              {bookingVelocity}
            </motion.p>
            <p className="text-xs text-gray-500 mt-2 font-light">viewing now</p>
          </motion.div>

          {/* Deposit Escrow */}
          <motion.div
            layoutId="escrow-card"
            variants={fadeInUp}
            animate={floatAnimation}
            className={`${glassCardClass} p-6 hover:bg-white/50 transition-all duration-300 cursor-pointer`}
            onClick={() => window.location.href = '/dashboard/financial'}
          >
            <div className="flex items-center justify-between mb-4">
              <Shield className="w-6 h-6 text-[#22c55e]" strokeWidth={1.5} />
              <div className="flex items-center gap-1 text-xs">
                <span className="font-semibold text-gray-600">Paystack</span>
                <span className="text-gray-400">|</span>
                <span className="font-semibold text-gray-600">Flutterwave</span>
              </div>
            </div>
            <h3 className="text-xs font-semibold text-gray-600 mb-2 tracking-tight uppercase" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Deposit Escrow
            </h3>
            <p className="text-3xl font-black text-gray-900 tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              ₦{(stats.depositEscrow / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-gray-500 font-light">awaiting completion</p>
          </motion.div>

          {/* System Status */}
          <motion.div
            layoutId="status-card"
            variants={fadeInUp}
            animate={floatAnimation}
            className={`${glassCardClass} p-6 hover:bg-white/50 transition-all duration-300 cursor-pointer`}
            onClick={() => window.location.href = '/dashboard/services'}
          >
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-6 h-6 text-[#22c55e]" strokeWidth={1.5} />
              <span className="px-2 py-1 bg-[#22c55e] text-white rounded-full text-xs font-semibold animate-pulse">
                Live
              </span>
            </div>
            <h3 className="text-xs font-semibold text-gray-600 mb-2 tracking-tight uppercase" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              System Status
            </h3>
            <p className="text-2xl font-black text-gray-900 tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Online
            </p>
            <p className="text-xs text-gray-500 font-light">10-second website</p>
          </motion.div>
        </div>

        {/* Zone 2 & 3: Main Content Area */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Zone 3: The Flow Timeline */}
          <motion.div variants={fadeInUp} className={`${glassCardClass} p-6 lg:col-span-1`}>
            <h2 className="text-xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Today's Flow
            </h2>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment, index) => {
                const isInProgress = appointmentStatuses[appointment.id] === 'in_progress';
                return (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className={`border-l-2 pl-4 pb-4 last:pb-0 relative transition-all cursor-pointer ${
                      isInProgress 
                        ? 'border-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                        : 'border-[#22c55e]'
                    }`}
                  >
                    <div className={`absolute -left-2 top-0 w-4 h-4 rounded-full border-2 border-white transition-all ${
                      isInProgress ? 'bg-[#22c55e] animate-pulse' : 'bg-[#22c55e]'
                    }`}></div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900 tracking-tighter mb-1 truncate" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                          {appointment.client}
                        </p>
                        <p className="text-xs text-gray-600 font-light">{appointment.service}</p>
                        <p className="text-xs text-gray-500 font-light mt-1 hidden sm:block">₦{appointment.price.toLocaleString()}</p>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 ml-2 flex-shrink-0">{appointment.time}</span>
                    </div>
                    {/* Desktop: Side-by-side buttons */}
                    <div className="hidden md:flex items-center gap-2 mt-3">
                      <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                        <Button
                          size="sm"
                          onClick={() => handleWhatsAppNudge(appointment)}
                          className="w-full rounded-full bg-[#22c55e] text-white hover:bg-green-600 h-12 min-h-[48px] text-xs font-semibold transition-all"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          WhatsApp
                        </Button>
                      </motion.div>
                      <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartSession(appointment.id)}
                          disabled={isInProgress}
                          className={`w-full rounded-full border-gray-300 hover:bg-gray-50 h-12 min-h-[48px] text-xs font-semibold transition-all ${
                            isInProgress ? 'bg-[#22c55e]/10 border-[#22c55e] text-[#22c55e]' : ''
                          }`}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          {isInProgress ? 'In Progress' : 'Start'}
                        </Button>
                      </motion.div>
                    </div>
                    {/* Mobile: Stacked buttons */}
                    <div className="md:hidden flex flex-col gap-2 mt-3">
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          size="sm"
                          onClick={() => handleWhatsAppNudge(appointment)}
                          className="w-full rounded-full bg-[#22c55e] text-white hover:bg-green-600 h-12 min-h-[48px] text-xs font-semibold transition-all"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          WhatsApp
                        </Button>
                      </motion.div>
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartSession(appointment.id)}
                          disabled={isInProgress}
                          className={`w-full rounded-full border-gray-300 hover:bg-gray-50 h-12 min-h-[48px] text-xs font-semibold transition-all ${
                            isInProgress ? 'bg-[#22c55e]/10 border-[#22c55e] text-[#22c55e]' : ''
                          }`}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {isInProgress ? 'In Progress' : 'Start'}
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Branded Payments Tile */}
            <div className="mt-6 p-4 bg-gradient-to-r from-[#22c55e]/10 to-transparent rounded-xl border border-[#22c55e]/20">
              <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                <CreditCard className="w-5 h-5 text-[#22c55e]" />
                <div className="flex-1">
                  <p className="text-sm font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                    Branded Payments
                  </p>
                  <p className="text-xs text-gray-600 font-light mt-1">Nile | 8123843076 | Providus Bank</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Zone 2: 30-Second Website Control */}
          <motion.div variants={fadeInUp} className={`${glassCardClass} p-6 lg:col-span-2`}>
            <h2 className="text-xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              30-Second Website | Live Control
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Editor Panel */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Service Price</label>
                  <input
                    type="number"
                    value={livePrice}
                    onChange={(e) => setLivePrice(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-lg font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#22c55e] transition-all"
                    style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Accepting Bookings</label>
                  <button
                    onClick={() => setAcceptingBookings(!acceptingBookings)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all font-semibold ${
                      acceptingBookings
                        ? 'bg-[#22c55e] border-[#22c55e] text-white'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    {acceptingBookings ? 'Yes' : 'No'}
                  </button>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Waitlist Status</label>
                  <button
                    onClick={() => setWaitlistEnabled(!waitlistEnabled)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all font-semibold ${
                      waitlistEnabled
                        ? 'bg-[#22c55e] border-[#22c55e] text-white'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    {waitlistEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Nile Branding Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-16 h-12 rounded-xl border-2 border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Magic Preview - 3D Rotated Mobile Frame */}
              <div className="relative flex items-center justify-center">
                <motion.div
                  className="bg-white rounded-3xl p-4 border-2 border-gray-200 shadow-2xl"
                  style={{
                    transform: 'perspective(1000px) rotateY(-8deg) rotateX(3deg)',
                    transformStyle: 'preserve-3d',
                    width: '220px',
                  }}
                  animate={{
                    rotateY: [-8, 8, -8],
                    rotateX: [3, -3, 3],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl p-4" style={{ minHeight: '320px' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brandColor }}></div>
                      <span className="text-xs font-semibold text-gray-900">
                        {user?.slug ? `${user.slug}.nilebooking.co` : 'yourname.nilebooking.co'}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-full"></div>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3 mb-3">
                      <div className="h-2 bg-gray-300 rounded w-2/3 mb-2"></div>
                      <div className="h-2 bg-gray-300 rounded w-full mb-2"></div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-semibold text-gray-900">Faded Cut</span>
                        <span className="text-sm font-black text-gray-900">₦{livePrice.toLocaleString()}</span>
                      </div>
                    </div>
                    <div
                      className="h-8 rounded-lg flex items-center justify-center mb-2"
                      style={{ backgroundColor: brandColor }}
                    >
                      <span className="text-xs font-semibold text-white">Book Now</span>
                    </div>
                    {!acceptingBookings && (
                      <div className="text-center">
                        <span className="text-xs text-red-600 font-semibold">Not Accepting Bookings</span>
                      </div>
                    )}
                    {waitlistEnabled && (
                      <div className="text-center mt-2">
                        <span className="text-xs text-blue-600 font-semibold">Join Waitlist</span>
                      </div>
                    )}
                  </div>
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e]/10 to-transparent pointer-events-none rounded-3xl"></div>
              </div>
            </div>

            {/* AI Business Strategist */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="mt-8 p-6 bg-white/50 rounded-2xl border border-white/50 cursor-pointer transition-all hover:bg-white/70"
            >
              <div className="flex items-start gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-[#22c55e] mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-black text-gray-900 mb-2 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                    AI Business Strategist
                  </h3>
                  <p className="text-sm text-gray-700 font-light leading-relaxed">
                    Your "Faded Cut" is trending in Ipaja. Consider a 5% price increase or a "Premium Wash" bundle.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="rounded-full text-xs font-semibold border-[#22c55e] hover:bg-[#22c55e] hover:text-white"
                    onClick={() => {
                      // Auto-apply 5% price increase
                      const newPrice = Math.round(livePrice * 1.05);
                      setLivePrice(newPrice);
                      alert(`Price updated to ₦${newPrice.toLocaleString()}`);
                    }}
                  >
                    Auto-Apply
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button size="sm" variant="ghost" className="rounded-full text-xs font-light">
                    Dismiss
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
