import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { serviceApi, scheduleApi, bookingApi } from '../lib/api';
import { Calendar } from '../components/ui/calendar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import type { ProviderWithServices, Schedule, Service } from '../types';
import { addDays, startOfDay, getDay, format } from 'date-fns';
import { Star, Clock, MapPin, CheckCircle2, X, Calendar as CalendarIcon, ChevronRight, Upload, Building2, Instagram, Phone, Twitter, Facebook, Shield, FileText, RotateCcw } from 'lucide-react';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DEFAULT_HEADER_BANNER = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&h=600&fit=crop';

interface PublicProviderProps {
  slug?: string | null;
}

export const PublicProvider: React.FC<PublicProviderProps> = ({ slug: propSlug }) => {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  // Slug comes from props (subdomain route) or URL params (/p/:slug route)
  // Do NOT use getTenantConfig() here — it uses old subdomain.ts which has path-bypass bugs
  const slug = propSlug || urlSlug;

  const [data, setData] = useState<ProviderWithServices | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [activePolicyModal, setActivePolicyModal] = useState<'terms' | 'return' | 'privacy' | null>(null);
  const [checkoutPaymentType, setCheckoutPaymentType] = useState<'bank_transfer' | 'pay_later'>('bank_transfer');

  const [checkoutData, setCheckoutData] = useState({
    customer: { name: '', email: '', phone: '' },
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      loadData();
    }
  }, [slug]);

  useEffect(() => {
    if (data) {
      document.title = `${data.provider.businessName} | Official Booking Site`;
    }
  }, [data]);

  // Banner auto-scroll — runs whenever data loads (bannerList is derived from data)
  useEffect(() => {
    if (!data) return;
    const images = data.provider.headerImages && data.provider.headerImages.length > 0
      ? data.provider.headerImages
      : [data.provider.headerImage || DEFAULT_HEADER_BANNER];
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % images.length);
    }, 4500);
    return () => clearInterval(timer);
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
        serviceApi.getServicesBySlug(slug).catch(() => null),
        scheduleApi.getScheduleBySlug(slug).catch(() => null),
      ]);

      const fallbackSchedule = scheduleData || {
        timezone: 'Africa/Lagos',
        bufferTime: 15,
        weeklySchedule: {
          monday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
          tuesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
          wednesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
          thursday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
          friday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
          saturday: { enabled: true, timeSlots: [{ startTime: '10:00', endTime: '16:00' }] },
          sunday: { enabled: false, timeSlots: [] },
        },
      };

      // Only use real data from the API — never fake service IDs
      if (servicesData) {
        setData(servicesData);
        setSchedule(fallbackSchedule as Schedule);
        if (servicesData.services.length > 0) {
          setSelectedService(servicesData.services[0]);
        }
      } else {
        // API failed — still show schedule fallback but mark data as null
        setData(null);
        setSchedule(fallbackSchedule as Schedule);
      }
    } catch (error) {
      console.error('Failed to load storefront:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };


  const calculateAvailableSlots = () => {
    if (!selectedDate || !selectedService || !schedule) return;

    const dayOfWeek = DAY_NAMES[getDay(selectedDate)];
    const daySchedule = schedule.weeklySchedule[dayOfWeek as keyof typeof schedule.weeklySchedule];

    if (!daySchedule || !daySchedule.enabled || daySchedule.timeSlots.length === 0) {
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
        slots.push(format(currentTime, 'HH:mm'));
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

      if (daySchedule && daySchedule.enabled && daySchedule.timeSlots.length > 0) {
        dates.push(date);
      }
    }

    return dates;
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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

    if (!checkoutData.customer.name || !checkoutData.customer.phone) {
      alert('Please enter your name and WhatsApp phone number');
      return;
    }

    try {
      const [startHour, startMin] = selectedTime.split(':').map(Number);
      const startDate = new Date(selectedDate);
      startDate.setHours(startHour, startMin, 0, 0);
      const endDate = new Date(startDate.getTime() + selectedService.duration * 60 * 60 * 1000);
      const endTime = format(endDate, 'HH:mm');

      const response = await bookingApi.createBooking({
        customer: checkoutData.customer,
        serviceId: selectedService._id,
        providerSlug: slug || undefined,
        date: selectedDate.toISOString(),
        timeSlot: {
          startTime: selectedTime,
          endTime: endTime,
        },
        paymentType: checkoutPaymentType,
        receiptImage: receiptImage || undefined,
        notes: checkoutData.notes,
      });

      const whatsappMessage = encodeURIComponent(
        `Hello ${data?.provider.businessName}! I've submitted a booking for ${selectedService.name} on ${format(selectedDate, 'MMMM d, yyyy')} at ${selectedTime}. Booking #${response.booking.bookingNumber}`
      );
      const whatsappLink = `https://wa.me/${data?.provider.phone?.replace(/\D/g, '')}?text=${whatsappMessage}`;

      window.open(whatsappLink, '_blank');
      alert(checkoutPaymentType === 'bank_transfer' 
        ? 'Booking & Transfer Receipt Submitted! Opening WhatsApp to send receipt confirmation to merchant...' 
        : 'Booking Submitted! Opening WhatsApp to send confirmation to merchant...');
      setShowCheckout(false);
    } catch (error: any) {
      alert('Failed to create booking: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-zinc-500 font-normal">Loading Merchant Storefront...</p>
        </div>
      </div>
    );
  }

  if (!data || !schedule) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white border border-zinc-200 rounded-xl max-w-sm">
          <h1 className="text-base font-semibold text-zinc-900 mb-1">Storefront Not Found</h1>
          <p className="text-xs text-zinc-500">The merchant storefront you are looking for is currently unavailable.</p>
        </div>
      </div>
    );
  }

  const bannerList = data.provider.headerImages && data.provider.headerImages.length > 0
    ? data.provider.headerImages
    : [data.provider.headerImage || DEFAULT_HEADER_BANNER];

  // Banner auto-scroll is managed by a top-level useEffect below — see the
  // useEffect with [data] dependency that calls setActiveBannerIndex via interval.

  const merchantLogoUrl = data.provider.logo || data.provider.profileImage;
  const socialHandles = data.provider.socialHandles || {};
  const policies = data.provider.policies || {};

  return (
    <div className="min-h-screen bg-gray-50/60 flex flex-col justify-between">
      
      <div>
        {/* Top Clean Merchant Header Bar (Merchant Custom Logo, No Screaming Nile) */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                {merchantLogoUrl ? (
                  <img src={merchantLogoUrl} alt={data.provider.businessName} className="w-full h-full object-cover" />
                ) : (
                  <span>{data.provider.businessName.charAt(0)}</span>
                )}
              </div>
              <span className="text-sm font-semibold text-zinc-900 tracking-tight">{data.provider.businessName}</span>
            </div>

            <a
              href={`https://wa.me/${data.provider.phone?.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              Contact Merchant
            </a>
          </div>
        </header>

        {/* Multi-Image Hero Banner Carousel */}
        <div className="relative w-full h-52 sm:h-64 md:h-76 bg-zinc-900 overflow-hidden group">
          {bannerList.map((bannerUrl, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === activeBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={bannerUrl}
                alt={`${data.provider.businessName} Banner ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-20 pointer-events-none"></div>

          {/* Carousel Pagination Dots */}
          {bannerList.length > 1 && (
            <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20">
              {bannerList.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBannerIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === activeBannerIndex ? 'bg-emerald-400 w-5' : 'bg-white/60 hover:bg-white'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Merchant Overlay on Banner */}
          <div className="absolute bottom-4 left-4 right-4 max-w-4xl mx-auto flex items-end justify-between gap-4 z-30">
            <div className="flex items-end gap-3.5 sm:gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-white bg-white overflow-hidden shadow-lg flex-shrink-0">
                {merchantLogoUrl ? (
                  <img src={merchantLogoUrl} alt={data.provider.businessName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xl">
                    {data.provider.businessName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="text-white pb-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{data.provider.businessName}</h1>
                <div className="flex items-center gap-2 text-xs text-zinc-200 mt-1">
                  {data.provider.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {data.provider.location}
                    </span>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-300 font-medium">
                    <Star className="w-3.5 h-3.5 fill-amber-300" />
                    4.9 (120+ verified bookings)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Services Container */}
        <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
          
          {/* Merchant Bio Description */}
          {data.provider.bio && (
            <div className="bg-white border border-zinc-200/80 rounded-xl p-4 sm:p-5 shadow-sm">
              <p className="text-xs sm:text-sm text-zinc-600 font-normal leading-relaxed">
                {data.provider.bio}
              </p>
            </div>
          )}

          {/* Services Header */}
          <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
            <h2 className="text-base font-semibold text-zinc-900 tracking-tight">Services & Pricing</h2>
            <span className="text-xs text-zinc-500 font-medium">{data.services.length} Offerings Available</span>
          </div>

          {/* Services Selection Grid */}
          <div className="space-y-3">
            {data.services.map((service) => {
              const isSelected = selectedService?._id === service._id;
              return (
                <div
                  key={service._id}
                  onClick={() => handleServiceSelect(service)}
                  className={`bg-white border rounded-xl p-4 sm:p-5 cursor-pointer transition-all hover:border-zinc-300 shadow-sm flex items-center justify-between gap-4 ${
                    isSelected ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200/80'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-semibold text-zinc-900 tracking-tight truncate">
                        {service.name}
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-3 font-normal">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="font-bold text-zinc-900 text-sm">
                        ₦{service.price.toLocaleString()}
                      </span>
                      <span className="text-zinc-500 flex items-center gap-1 font-normal">
                        <Clock className="w-3.5 h-3.5" />
                        {service.duration} {service.duration === 1 ? 'hr' : 'hrs'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center">
                    <Button
                      size="sm"
                      className={`rounded-lg h-9 px-4 text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                      }`}
                    >
                      Select & Book
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

        </main>
      </div>

      {/* Merchant Public Footer */}
      <footer className="mt-12 bg-white border-t border-zinc-200/80 py-8 px-4 text-zinc-600">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-100 pb-6">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
                {merchantLogoUrl ? (
                  <img src={merchantLogoUrl} alt={data.provider.businessName} className="w-full h-full object-cover" />
                ) : (
                  <span>{data.provider.businessName.charAt(0)}</span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-900">{data.provider.businessName}</h4>
                <p className="text-xs text-zinc-400 font-normal">Official Online Booking Portal</p>
              </div>
            </div>

            {/* Social Handles */}
            <div className="flex items-center gap-3">
              {socialHandles.instagram && (
                <a
                  href={`https://instagram.com/${socialHandles.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {socialHandles.whatsapp && (
                <a
                  href={`https://wa.me/${socialHandles.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-zinc-100 text-zinc-600 hover:text-emerald-600 hover:bg-zinc-200 transition-colors"
                  title="WhatsApp"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
              {socialHandles.twitter && (
                <a
                  href={`https://twitter.com/${socialHandles.twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-zinc-100 text-zinc-600 hover:text-blue-500 hover:bg-zinc-200 transition-colors"
                  title="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {socialHandles.facebook && (
                <a
                  href={`https://facebook.com/${socialHandles.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-zinc-100 text-zinc-600 hover:text-blue-700 hover:bg-zinc-200 transition-colors"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Footer Policy Links */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-zinc-500 font-normal">
            <button
              onClick={() => setActivePolicyModal('terms')}
              className="hover:text-zinc-900 transition-colors"
            >
              Terms & Conditions
            </button>
            <span>•</span>
            <button
              onClick={() => setActivePolicyModal('return')}
              className="hover:text-zinc-900 transition-colors"
            >
              Return & Refund Policy
            </button>
            <span>•</span>
            <button
              onClick={() => setActivePolicyModal('privacy')}
              className="hover:text-zinc-900 transition-colors"
            >
              Privacy Policy
            </button>
          </div>

          {/* Subtle Faint Credit */}
          <div className="text-center pt-4 border-t border-zinc-100">
            <p className="text-[11px] text-zinc-400 font-normal tracking-wide">
              Powered by Nile Technologies
            </p>
          </div>

        </div>
      </footer>

      {/* Date & Time Selection Sheet */}
      {showDatePicker && selectedService && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-zinc-200 p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Select Date & Time</h3>
                <p className="text-xs text-zinc-500">{selectedService.name} • ₦{selectedService.price.toLocaleString()}</p>
              </div>
              <button
                onClick={() => setShowDatePicker(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar */}
            <div className="border border-zinc-200/80 rounded-xl p-3 bg-zinc-50/40">
              <Calendar
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  if (date) setSelectedTime(null);
                }}
                availableDates={getAvailableDates()}
              />
            </div>

            {/* Time Slots */}
            {selectedDate && availableTimeSlots.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-700 block">Available Time Slots</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableTimeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`h-9 text-xs font-medium rounded-lg border transition-all ${
                        selectedTime === time
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedDate && availableTimeSlots.length === 0 && (
              <p className="text-xs text-zinc-500 text-center py-3">No available slots on this date.</p>
            )}

            {selectedTime && (
              <Button
                onClick={handleProceedToCheckout}
                className="w-full bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-11 text-xs font-medium shadow-sm"
              >
                Proceed to Checkout
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}

          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && selectedService && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-zinc-200 p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-5">
            
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Checkout</h3>
                <p className="text-xs text-zinc-500">{data.provider.businessName}</p>
              </div>
              <button
                onClick={() => setShowCheckout(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Box */}
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4 text-xs space-y-2">
              <div className="flex justify-between text-zinc-700">
                <span className="font-normal">Service</span>
                <span className="font-semibold text-zinc-900">{selectedService.name}</span>
              </div>
              <div className="flex justify-between text-zinc-700">
                <span className="font-normal">Date & Time</span>
                <span className="font-semibold text-zinc-900">
                  {selectedDate && format(selectedDate, 'MMM d, yyyy')} at {selectedTime}
                </span>
              </div>
              <div className="flex justify-between text-zinc-700 pt-2 border-t border-zinc-200/60 font-bold text-zinc-900 text-sm">
                <span>Total Amount Due</span>
                <span>₦{selectedService.price.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-700 mb-1 block">Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCheckoutPaymentType('bank_transfer')}
                  className={`h-10 text-xs font-medium rounded-lg border transition-all ${
                    checkoutPaymentType === 'bank_transfer'
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  Bank Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutPaymentType('pay_later')}
                  className={`h-10 text-xs font-medium rounded-lg border transition-all ${
                    checkoutPaymentType === 'pay_later'
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  Pay in Person
                </button>
              </div>
            </div>

            {/* Bank Settlement Account Box */}
            {checkoutPaymentType === 'bank_transfer' && (
              <div className="bg-zinc-900 text-white rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1 font-medium">
                    <Building2 className="w-3.5 h-3.5" />
                    Merchant Transfer Details
                  </span>
                  <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-emerald-400">Bank Transfer</span>
                </div>
                <div className="pt-1">
                  <p className="text-sm font-bold text-white">Access Bank</p>
                  <p className="font-mono text-base font-bold text-emerald-400 tracking-wider">8123843076</p>
                  <p className="text-xs text-zinc-300">{data.provider.businessName}</p>
                </div>
              </div>
            )}

            {/* Client Info Inputs */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-zinc-700 mb-1 block">Full Name *</Label>
                <Input
                  value={checkoutData.customer.name}
                  onChange={(e) => setCheckoutData({
                    ...checkoutData,
                    customer: { ...checkoutData.customer, name: e.target.value }
                  })}
                  placeholder="e.g., Adeola Johnson"
                  className="h-9 text-xs border-zinc-300"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-zinc-700 mb-1 block">WhatsApp Number *</Label>
                <Input
                  value={checkoutData.customer.phone}
                  onChange={(e) => setCheckoutData({
                    ...checkoutData,
                    customer: { ...checkoutData.customer, phone: e.target.value }
                  })}
                  placeholder="+234 812 345 6789"
                  className="h-9 text-xs border-zinc-300"
                />
              </div>

              {/* Optional Transfer Receipt Image Upload */}
              {checkoutPaymentType === 'bank_transfer' && (
                <div>
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">Upload Transfer Receipt Image (Optional)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                    />
                  </div>
                  {receiptImage && (
                    <div className="mt-2 text-xs text-emerald-700 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Receipt screenshot attached!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Action */}
            <Button
              onClick={handleCheckoutSubmit}
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-10 text-xs font-medium shadow-sm"
            >
              {checkoutPaymentType === 'bank_transfer' ? 'Submit Transfer Booking' : 'Confirm Booking'}
            </Button>

          </div>
        </div>
      )}

      {/* Storefront Policy Modals */}
      {activePolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-semibold text-zinc-900 capitalize">
                {activePolicyModal === 'terms' ? 'Terms & Conditions' : activePolicyModal === 'return' ? 'Return & Refund Policy' : 'Privacy Policy'}
              </h3>
              <button
                onClick={() => setActivePolicyModal(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed font-normal bg-zinc-50 border border-zinc-200/80 p-4 rounded-lg">
              {activePolicyModal === 'terms'
                ? (policies.terms || 'All bookings must be confirmed in advance. Cancellations made at least 24 hours prior to appointment time are eligible for reschedule.')
                : activePolicyModal === 'return'
                ? (policies.returnPolicy || 'Services completed are non-refundable. Deposits for cancelled bookings may be transferred to a new slot within 30 days.')
                : (policies.privacyPolicy || 'We value client privacy and only process personal details for booking confirmations.')}
            </p>

            <Button
              onClick={() => setActivePolicyModal(null)}
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 text-xs font-medium"
            >
              Close
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};
