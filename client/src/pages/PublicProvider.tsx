import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { serviceApi, scheduleApi, bookingApi } from '../lib/api';
import { getTenantConfig } from '../lib/subdomain';
import { Calendar } from '../components/ui/calendar';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { NileLogo } from '../components/ui/NileLogo';
import type { ProviderWithServices, Schedule, Service } from '../types';
import { addDays, startOfDay, getDay, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Clock, MapPin, CheckCircle, X, CreditCard, Shield, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

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
    transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] },
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

const glassCardClass = "bg-white/40 backdrop-blur-3xl border border-white/30 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]";

interface PublicProviderProps {
  slug?: string | null;
}

export const PublicProvider: React.FC<PublicProviderProps> = ({ slug: propSlug }) => {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const tenantConfig = getTenantConfig();
  // Use prop slug (from subdomain) if provided, otherwise use tenant config slug, otherwise use URL slug
  const slug = propSlug || tenantConfig.slug || urlSlug;
  
  const [data, setData] = useState<ProviderWithServices | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    customer: { name: '', email: '', phone: '' },
    paymentType: 'deposit' as 'full' | 'deposit' | 'pay_later',
    paymentGateway: 'paystack' as 'paystack' | 'flutterwave',
  });
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      loadData();
    }
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (data) {
      // Set page title: "Merchant Name | Nile Booking"
      document.title = `${data.provider.businessName} | Nile Booking`;
    }
  }, [data]);

  useEffect(() => {
    if (selectedDate && selectedService && schedule) {
      calculateAvailableSlots();
    }
  }, [selectedDate, selectedService, schedule]);

  const loadData = async () => {
    if (!slug) return;
    try {
      const [servicesData, scheduleData] = await Promise.all([
        serviceApi.getServicesBySlug(slug),
        scheduleApi.getScheduleBySlug(slug),
      ]);
      setData(servicesData);
      setSchedule(scheduleData);
      if (servicesData.services.length > 0) {
        setSelectedService(servicesData.services[0]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAvailableSlots = () => {
    if (!selectedDate || !selectedService || !schedule) return;

    const dayOfWeek = DAY_NAMES[getDay(selectedDate)];
    const daySchedule = schedule.weeklySchedule[dayOfWeek as keyof typeof schedule.weeklySchedule];

    if (!daySchedule.enabled || daySchedule.timeSlots.length === 0) {
      setAvailableTimeSlots([]);
      return;
    }

    const slots: string[] = [];
    const bufferMinutes = schedule.bufferTime || 15;
    const serviceDurationMinutes = selectedService.duration * 60;

    daySchedule.timeSlots.forEach((slot) => {
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      
      const startTime = new Date(selectedDate);
      startTime.setHours(startHour, startMin, 0, 0);
      
      const endTime = new Date(selectedDate);
      endTime.setHours(endHour, endMin, 0, 0);

      let currentTime = new Date(startTime);
      while (currentTime.getTime() + serviceDurationMinutes * 60000 <= endTime.getTime()) {
        const slotTime = format(currentTime, 'HH:mm');
        slots.push(slotTime);
        currentTime = new Date(currentTime.getTime() + (serviceDurationMinutes + bufferMinutes) * 60000);
      }
    });

    setAvailableTimeSlots(slots);
  };

  const getAvailableDates = (): Date[] => {
    if (!schedule) return [];
    const dates: Date[] = [];
    const today = startOfDay(new Date());
    
    for (let i = 0; i < 60; i++) {
      const date = addDays(today, i);
      const dayOfWeek = DAY_NAMES[getDay(date)];
      const daySchedule = schedule.weeklySchedule[dayOfWeek as keyof typeof schedule.weeklySchedule];
      
      if (daySchedule.enabled && daySchedule.timeSlots.length > 0) {
        dates.push(date);
      }
    }
    
    return dates;
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setShowDatePicker(true);
  };

  const handleProceedToCheckout = () => {
    if (selectedService && selectedDate && selectedTime) {
      setShowCheckout(true);
      setShowDatePicker(false);
    }
  };

  const handleCheckoutSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    try {
      const [startHour, startMin] = selectedTime.split(':').map(Number);
      const startDate = new Date(selectedDate);
      startDate.setHours(startHour, startMin, 0, 0);
      const endDate = new Date(startDate.getTime() + selectedService.duration * 60 * 60 * 1000);
      const endTime = format(endDate, 'HH:mm');

      const response = await bookingApi.createBooking({
        customer: checkoutData.customer,
        serviceId: selectedService._id,
        date: selectedDate.toISOString(),
        timeSlot: {
          startTime: selectedTime,
          endTime: endTime,
        },
        paymentType: checkoutData.paymentType,
        paymentGateway: checkoutData.paymentGateway,
      });

      // Generate WhatsApp link
      const whatsappMessage = encodeURIComponent(
        `Hi! I've booked ${selectedService.name} on ${format(selectedDate, 'MMMM d, yyyy')} at ${selectedTime}. Booking #${response.booking.bookingNumber}`
      );
      const whatsappLink = `https://wa.me/${data?.provider.phone?.replace(/\D/g, '')}?text=${whatsappMessage}`;
      
      window.open(whatsappLink, '_blank');
      alert('Booking confirmed! Opening WhatsApp...');
      setShowCheckout(false);
    } catch (error: any) {
      alert('Failed to create booking: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[#F5F5F7] bg-fixed">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-light">Loading provider...</p>
        </div>
      </div>
    );
  }

  if (!data || !schedule) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[#F5F5F7] bg-fixed">
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Provider not found
          </h1>
          <p className="text-gray-600 font-light">The provider you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const depositAmount = selectedService ? Math.floor(selectedService.price * 0.5) : 0;
  const balanceAmount = selectedService ? selectedService.price - depositAmount : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] bg-fixed">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Floating Glass Navigation */}
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-3xl border-b ${
            scrolled ? 'bg-white/60 border-white/40' : 'bg-white/40 border-white/30'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Nile Booking Logo */}
                <Link to="/" className="flex items-center">
                  <NileLogo size="sm" />
                </Link>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#22c55e] flex items-center justify-center">
                    <span className="text-white font-black text-lg" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                      {data.provider.businessName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                      {data.provider.businessName}
                    </p>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-[#22c55e]" />
                      <span className="text-xs text-gray-600 font-light">Verified by Nile</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm font-semibold text-gray-700">4.9</span>
              </div>
            </div>
          </div>
        </motion.nav>

        {/* Hero Section */}
        <motion.section
          variants={fadeInUp}
          className="relative pt-24 md:pt-32 pb-12 md:pb-16 px-4"
        >
          <div className="max-w-6xl mx-auto text-center">
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-4 leading-[1.05] tracking-tighter"
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}
            >
              {data.provider.businessName}
            </motion.h1>
            {data.provider.phone && (
              <motion.div
                variants={fadeInUp}
                className="flex items-center justify-center gap-2 text-base text-gray-600 font-light mb-4"
              >
                <MapPin className="w-4 h-4" />
                <span>{data.provider.phone}</span>
              </motion.div>
            )}
            <motion.div
              variants={fadeInUp}
              className="flex items-center justify-center gap-2 mb-6"
            >
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-sm font-semibold text-gray-700 ml-2">4.9 (127 reviews)</span>
            </motion.div>
          </div>
        </motion.section>

        {/* Service Selection Deck */}
        <section className="max-w-4xl mx-auto px-4 pb-32 md:pb-24">
          <motion.div variants={fadeInUp} className="mb-6 md:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-2 tracking-tighter text-center" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Select a Service
            </h2>
            <p className="text-center text-gray-600 font-light text-sm md:text-base">Tap to select and book</p>
          </motion.div>

          <div className="space-y-4 mb-12">
            {data.services.map((service, index) => (
              <motion.div
                key={service._id}
                variants={fadeInUp}
                custom={index}
                animate={floatAnimation}
                transition={{ delay: index * 0.1 }}
                whileTap={{ scale: 0.98 }}
                style={{ willChange: 'transform' }}
              >
                <Card
                  className={`${glassCardClass} p-4 md:p-6 cursor-pointer transition-all hover:bg-white/50 min-h-[120px] flex items-center ${
                    selectedService?._id === service._id
                      ? 'ring-2 ring-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                      : ''
                  }`}
                  onClick={() => handleServiceSelect(service)}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                        {service.name}
                      </h3>
                      <p className="text-sm md:text-base text-gray-600 leading-relaxed font-light mb-3 line-clamp-2">
                        {service.description}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                          ₦{service.price.toLocaleString()}
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {service.duration} {service.duration === 1 ? 'hr' : 'hrs'}
                        </span>
                      </div>
                    </div>
                    {selectedService?._id === service._id && (
                      <CheckCircle className="w-6 h-6 text-[#22c55e] flex-shrink-0 ml-4" />
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Date & Time Selection Bottom Sheet */}
        <AnimatePresence>
          {showDatePicker && selectedService && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDatePicker(false)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className={`fixed bottom-0 left-0 right-0 z-50 ${glassCardClass} rounded-t-[32px] p-6 max-h-[85vh] overflow-y-auto`}
                style={{ willChange: 'transform' }}
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                    Select Date & Time
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDatePicker(false)}
                    className="rounded-full min-h-[48px] min-w-[48px]"
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="mb-6">
                  <Calendar
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      if (date) {
                        setSelectedTime(null);
                      }
                    }}
                    availableDates={getAvailableDates()}
                  />
                </div>

                {selectedDate && availableTimeSlots.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                  >
                    <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                      Available Times
                    </Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {availableTimeSlots.map((time) => (
                        <motion.div
                          key={time}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant={selectedTime === time ? "default" : "outline"}
                            className={`h-12 min-h-[48px] font-semibold border-2 rounded-xl transition-all ${
                              selectedTime === time
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white/40 backdrop-blur-sm border-white/30 hover:bg-white/60'
                            }`}
                            onClick={() => setSelectedTime(time)}
                          >
                            {time}
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {selectedDate && availableTimeSlots.length === 0 && (
                  <p className="text-sm text-gray-500 text-center font-light py-4">
                    No available time slots for this date
                  </p>
                )}

                {selectedTime && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Button
                      onClick={handleProceedToCheckout}
                      className="w-full h-14 min-h-[48px] text-base md:text-lg font-black bg-[#22c55e] text-white hover:bg-green-600 rounded-full shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Continue to Checkout
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Checkout Bottom Sheet */}
        <AnimatePresence>
          {showCheckout && selectedService && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCheckout(false)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className={`fixed bottom-0 left-0 right-0 z-50 ${glassCardClass} rounded-t-[32px] p-4 md:p-6 max-h-[90vh] overflow-y-auto`}
                style={{ willChange: 'transform' }}
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                    Complete Booking
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCheckout(false)}
                    className="rounded-full min-h-[48px] min-w-[48px]"
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Booking Summary */}
                <div className={`${glassCardClass} p-4 md:p-6 mb-6 bg-white/30`}>
                  <h3 className="text-lg font-black text-gray-900 mb-4 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                    Booking Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 font-light">Service</span>
                      <span className="text-sm font-semibold text-gray-900">{selectedService.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 font-light">Date & Time</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedDate && format(selectedDate, 'MMM d, yyyy')} | {selectedTime}
                      </span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-white/30">
                      <span className="text-sm font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                        ₦{selectedService.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Escrow Logic */}
                <div className={`${glassCardClass} p-4 md:p-6 mb-6 bg-gradient-to-r from-[#22c55e]/10 to-transparent border-[#22c55e]/20`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-[#22c55e]" />
                    <h3 className="text-sm font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                      Secure Deposit
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 font-light">50% Deposit Required</span>
                      <span className="text-lg font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                        ₦{depositAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 font-light">Balance Due</span>
                      <span className="text-sm font-semibold text-gray-700">At appointment</span>
                    </div>
                    <p className="text-xs text-gray-500 font-light mt-2">
                      Pay ₦{depositAmount.toLocaleString()} now to secure your spot | Balance due at appointment
                    </p>
                  </div>
                </div>

                {/* Customer Details Form */}
                <div className="space-y-4 mb-6">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Full Name</Label>
                    <Input
                      value={checkoutData.customer.name}
                      onChange={(e) => setCheckoutData({
                        ...checkoutData,
                        customer: { ...checkoutData.customer, name: e.target.value }
                      })}
                      className="bg-white/60 border-gray-300 h-12 min-h-[48px]"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Email</Label>
                    <Input
                      type="email"
                      value={checkoutData.customer.email}
                      onChange={(e) => setCheckoutData({
                        ...checkoutData,
                        customer: { ...checkoutData.customer, email: e.target.value }
                      })}
                      className="bg-white/60 border-gray-300 h-12 min-h-[48px]"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Phone</Label>
                    <Input
                      value={checkoutData.customer.phone}
                      onChange={(e) => setCheckoutData({
                        ...checkoutData,
                        customer: { ...checkoutData.customer, phone: e.target.value }
                      })}
                      className="bg-white/60 border-gray-300 h-12 min-h-[48px]"
                      placeholder="+234 812 345 6789"
                    />
                  </div>
                </div>

                {/* Payment Gateway Selection */}
                <div className="mb-6">
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">Payment Method</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCheckoutData({ ...checkoutData, paymentGateway: 'paystack' })}
                      className={`p-4 rounded-xl border-2 transition-all min-h-[80px] flex flex-col items-center justify-center ${
                        checkoutData.paymentGateway === 'paystack'
                          ? 'bg-[#22c55e] border-[#22c55e] text-white'
                          : 'bg-white/40 border-gray-300'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mb-2" />
                      <span className="text-sm font-semibold">Paystack</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCheckoutData({ ...checkoutData, paymentGateway: 'flutterwave' })}
                      className={`p-4 rounded-xl border-2 transition-all min-h-[80px] flex flex-col items-center justify-center ${
                        checkoutData.paymentGateway === 'flutterwave'
                          ? 'bg-[#22c55e] border-[#22c55e] text-white'
                          : 'bg-white/40 border-gray-300'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mb-2" />
                      <span className="text-sm font-semibold">Flutterwave</span>
                    </motion.button>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleCheckoutSubmit}
                    className="w-full h-14 min-h-[48px] text-base md:text-lg font-black bg-gray-900 text-white hover:bg-gray-800 rounded-full"
                    style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}
                  >
                    Pay ₦{depositAmount.toLocaleString()} Now
                  </Button>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Sticky CTA Button */}
        {selectedService && selectedDate && selectedTime && !showCheckout && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-white/90 to-transparent backdrop-blur-xl border-t border-white/30"
            style={{ willChange: 'transform' }}
          >
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleProceedToCheckout}
                className="w-full h-14 min-h-[48px] text-base md:text-lg font-black bg-[#22c55e] text-white hover:bg-green-600 rounded-full shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}
              >
                Book Now
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Powered by Footer */}
        <footer className="py-12 px-4 text-center border-t border-white/30 mt-24 pb-24 md:pb-12">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 font-light transition-colors">
            Powered by Nile Booking
          </Link>
        </footer>
      </motion.div>
    </div>
  );
};
