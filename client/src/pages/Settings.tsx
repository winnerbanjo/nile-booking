import React, { useState, useEffect, useRef } from 'react';
import { scheduleApi, bookingApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import type { Schedule, WeeklySchedule, Booking } from '../types';
import { Plus, Trash2, ChevronLeft, ChevronRight, MessageCircle, DollarSign, Calendar as CalendarIcon, X, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

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

const glassCardClass = "bg-white/40 backdrop-blur-xl border border-white/40 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]";
const smartControlCardClass = "bg-white/10 backdrop-blur-2xl border border-white/10 rounded-xl p-5";

export const Settings: React.FC = () => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [showToast, setShowToast] = useState(false);
  const [dateRibbonStart, setDateRibbonStart] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Rules state
  const [bufferTime, setBufferTime] = useState(15);
  const [bookingWindow, setBookingWindow] = useState(30);
  const [minimumLeadTime, setMinimumLeadTime] = useState(2);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (schedule) {
      loadBookings();
    }
  }, [schedule, currentWeek]);

  // Auto-save function
  const autoSave = async () => {
    if (!schedule) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await scheduleApi.updateSchedule({
          weeklySchedule: schedule.weeklySchedule,
          bufferTime,
        });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 1000); // Wait 1 second after last change
  };

  const loadData = async () => {
    try {
      const data = await scheduleApi.getSchedule();
      setSchedule(data);
      setBufferTime(data.bufferTime || 15);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      
      const response = await bookingApi.getBookings({
        limit: 100,
      });
      
      const weekBookings = response.bookings.filter((booking) => {
        const bookingDate = parseISO(booking.date);
        return bookingDate >= weekStart && bookingDate <= weekEnd;
      });
      
      setBookings(weekBookings);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    }
  };

  const updateDayEnabled = (dayKey: keyof WeeklySchedule, enabled: boolean) => {
    if (!schedule) return;
    setSchedule({
      ...schedule,
      weeklySchedule: {
        ...schedule.weeklySchedule,
        [dayKey]: {
          ...schedule.weeklySchedule[dayKey],
          enabled,
        },
      },
    });
    autoSave();
  };

  const addTimeSlot = (dayKey: keyof WeeklySchedule) => {
    if (!schedule) return;
    const day = schedule.weeklySchedule[dayKey];
    setSchedule({
      ...schedule,
      weeklySchedule: {
        ...schedule.weeklySchedule,
        [dayKey]: {
          ...day,
          timeSlots: [...day.timeSlots, { startTime: '09:00', endTime: '17:00' }],
        },
      },
    });
    autoSave();
  };

  const removeTimeSlot = (dayKey: keyof WeeklySchedule, index: number) => {
    if (!schedule) return;
    const day = schedule.weeklySchedule[dayKey];
    setSchedule({
      ...schedule,
      weeklySchedule: {
        ...schedule.weeklySchedule,
        [dayKey]: {
          ...day,
          timeSlots: day.timeSlots.filter((_, i) => i !== index),
        },
      },
    });
    autoSave();
  };

  const updateTimeSlot = (
    dayKey: keyof WeeklySchedule,
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    if (!schedule) return;
    const day = schedule.weeklySchedule[dayKey];
    const updatedSlots = day.timeSlots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    );
    setSchedule({
      ...schedule,
      weeklySchedule: {
        ...schedule.weeklySchedule,
        [dayKey]: {
          ...day,
          timeSlots: updatedSlots,
        },
      },
    });
    autoSave();
  };

  const handleControlChange = (setter: (value: number) => void, value: number) => {
    setter(value);
    autoSave();
  };

  const toggleDayExpansion = (dayKey: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayKey)) {
        next.delete(dayKey);
      } else {
        next.add(dayKey);
      }
      return next;
    });
  };

  const getBookingsForDay = (day: Date) => {
    return bookings.filter((booking) => {
      const bookingDate = parseISO(booking.date);
      return isSameDay(bookingDate, day);
    });
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const visibleDays = weekDays.slice(dateRibbonStart, dateRibbonStart + 5);
  const today = new Date();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[#F5F5F7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-light">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[#F5F5F7]">
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Failed to load schedule
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] bg-fixed px-6 md:px-8 py-4 md:py-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-6 md:space-y-8"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Smart Calendar
            </h1>
            <p className="text-base text-gray-600 font-light tracking-tight" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Manage your availability | Buffer & Boundary controls
            </p>
          </div>
        </motion.div>

        {/* Smart Controls Section */}
        <motion.div variants={fadeInUp} className={`${glassCardClass} p-6`}>
          <h2 className="text-xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Smart Controls
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Buffer Time */}
            <div className={smartControlCardClass}>
              <h3 className="text-xs font-black text-gray-900 mb-2 tracking-tight uppercase" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                BUFFER
              </h3>
              <select
                value={bufferTime}
                onChange={(e) => handleControlChange(setBufferTime, parseInt(e.target.value))}
                className="w-full h-10 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#22c55e] mt-2"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
              </select>
              <p className="text-xs text-gray-600 mt-2 font-light" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 400 }}>
                Time between bookings for cleanup
              </p>
            </div>

            {/* Booking Window */}
            <div className={smartControlCardClass}>
              <h3 className="text-xs font-black text-gray-900 mb-2 tracking-tight uppercase" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                BOOKING WINDOW
              </h3>
              <select
                value={bookingWindow}
                onChange={(e) => handleControlChange(setBookingWindow, parseInt(e.target.value))}
                className="w-full h-10 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#22c55e] mt-2"
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
              <p className="text-xs text-gray-600 mt-2 font-light" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 400 }}>
                How far in advance clients can book
              </p>
            </div>

            {/* Lead Time */}
            <div className={smartControlCardClass}>
              <h3 className="text-xs font-black text-gray-900 mb-2 tracking-tight uppercase" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                LEAD TIME
              </h3>
              <select
                value={minimumLeadTime}
                onChange={(e) => handleControlChange(setMinimumLeadTime, parseInt(e.target.value))}
                className="w-full h-10 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#22c55e] mt-2"
              >
                <option value="0">Instant</option>
                <option value="1">1 hour</option>
                <option value="24">24 hours</option>
              </select>
              <p className="text-xs text-gray-600 mt-2 font-light" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 400 }}>
                Don't allow bookings less than this before start time
              </p>
            </div>
          </div>
        </motion.div>

        {/* Compact Calendar - Desktop Full Grid, Mobile Horizontal Ribbon */}
        <motion.div variants={fadeInUp} className={`${glassCardClass} p-6`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                className="rounded-full border-gray-300 hover:bg-white/60"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-black text-gray-900 tracking-tighter hidden md:block" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                className="rounded-full border-gray-300 hover:bg-white/60"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={() => setCurrentWeek(new Date())}
              className="rounded-full bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 h-auto text-sm font-semibold"
            >
              Today
            </Button>
          </div>

          {/* Desktop: Full Calendar Grid */}
          <div className="hidden md:grid grid-cols-7 gap-4">
            {weekDays.map((day, dayIndex) => {
              const dayKey = DAYS[dayIndex].key;
              const daySchedule = schedule.weeklySchedule[dayKey];
              const dayBookings = getBookingsForDay(day);
              const isToday = isSameDay(day, today);

              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`${glassCardClass} p-4 min-h-[200px] ${isToday ? 'ring-2 ring-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.3)]' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {DAYS[dayIndex].label.slice(0, 3)}
                      </p>
                      <p className={`text-lg font-black tracking-tighter ${isToday ? 'text-[#22c55e]' : 'text-gray-900'}`} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                        {format(day, 'd')}
                      </p>
                    </div>
                    <Checkbox
                      checked={daySchedule.enabled}
                      onChange={(e) => updateDayEnabled(dayKey, e.target.checked)}
                    />
                  </div>

                  {daySchedule.enabled && (
                    <div className="space-y-2 mb-3">
                      {daySchedule.timeSlots.map((slot, slotIndex) => (
                        <div
                          key={slotIndex}
                          className="bg-[#22c55e]/10 rounded-lg p-2 border border-[#22c55e]/20"
                        >
                          <p className="text-xs font-semibold text-gray-900">
                            {slot.startTime} - {slot.endTime}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 mt-3">
                    {dayBookings.map((booking) => (
                      <motion.div
                        key={booking._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/60 rounded-lg p-2 border border-white/40 cursor-pointer hover:bg-white/80 transition-all"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {booking.customer.name}
                        </p>
                        <p className="text-xs text-gray-600 font-light">
                          {booking.timeSlot.startTime}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile: Horizontal Date Ribbon */}
          <div className="md:hidden overflow-x-auto pb-2 -mx-6 px-6">
            <div className="flex gap-3 min-w-max">
              {visibleDays.map((day, dayIndex) => {
                const actualIndex = dateRibbonStart + dayIndex;
                const dayKey = DAYS[actualIndex].key;
                const daySchedule = schedule.weeklySchedule[dayKey];
                const isToday = isSameDay(day, today);

                return (
                  <div
                    key={day.toISOString()}
                    className={`flex-shrink-0 w-20 p-3 rounded-xl border-2 transition-all ${
                      isToday
                        ? 'bg-[#22c55e]/10 border-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                        : 'bg-white/40 border-white/40'
                    }`}
                  >
                    <p className="text-xs font-semibold text-gray-500 uppercase text-center mb-1">
                      {DAYS[actualIndex].label.slice(0, 3)}
                    </p>
                    <p className={`text-xl font-black text-center ${isToday ? 'text-[#22c55e]' : 'text-gray-900'}`} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                      {format(day, 'd')}
                    </p>
                    {daySchedule.enabled && (
                      <div className="mt-2 space-y-1">
                        {daySchedule.timeSlots.slice(0, 2).map((slot, slotIndex) => (
                          <div key={slotIndex} className="bg-[#22c55e]/10 rounded px-1.5 py-0.5">
                            <p className="text-[10px] font-semibold text-gray-900 text-center">
                              {slot.startTime}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRibbonStart(Math.max(0, dateRibbonStart - 1))}
                disabled={dateRibbonStart === 0}
                className="rounded-full"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRibbonStart(Math.min(2, dateRibbonStart + 1))}
                disabled={dateRibbonStart >= 2}
                className="rounded-full"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Weekly Schedule Editor - Accordion on Mobile */}
        <motion.div variants={fadeInUp} className={`${glassCardClass} p-6`}>
          <h2 className="text-xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Weekly Schedule
          </h2>
          <div className="space-y-4 md:space-y-6">
            {DAYS.map(({ key, label }) => {
              const day = schedule.weeklySchedule[key];
              const isExpanded = expandedDays.has(key);
              
              return (
                <div
                  key={key}
                  className={`${glassCardClass} p-4 md:p-6 transition-all ${
                    isExpanded ? 'bg-white/50 backdrop-blur-2xl' : 'bg-white/30'
                  }`}
                >
                  {/* Day Header - Always Visible */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={day.enabled}
                        onChange={(e) => updateDayEnabled(key, e.target.checked)}
                      />
                      <Label className="text-base font-black text-gray-900 tracking-tighter cursor-pointer" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                        {label}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      {day.enabled && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addTimeSlot(key)}
                          className="hidden md:flex rounded-full border-gray-300 hover:bg-white/60"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Slot
                        </Button>
                      )}
                      {/* Mobile: Expand/Collapse Button */}
                      <button
                        onClick={() => toggleDayExpansion(key)}
                        className="md:hidden p-2 hover:bg-white/50 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-600" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Time Slots - Desktop: Always Visible, Mobile: Accordion */}
                  <AnimatePresence>
                    {(day.enabled && (isExpanded || !isMobile)) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 pl-8 md:pl-0 mt-3">
                          {day.timeSlots.length === 0 ? (
                            <p className="text-sm text-gray-500 font-light">No time slots</p>
                          ) : (
                            day.timeSlots.map((slot, index) => (
                              <div key={index} className="flex items-center gap-2 flex-wrap">
                                <Input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(e) =>
                                    updateTimeSlot(key, index, 'startTime', e.target.value)
                                  }
                                  className="w-32 bg-white/60 border-gray-300"
                                />
                                <span className="text-gray-500 font-light">to</span>
                                <Input
                                  type="time"
                                  value={slot.endTime}
                                  onChange={(e) =>
                                    updateTimeSlot(key, index, 'endTime', e.target.value)
                                  }
                                  className="w-32 bg-white/60 border-gray-300"
                                />
                                {day.timeSlots.length > 1 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeTimeSlot(key, index)}
                                    className="rounded-full border-red-300 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                                {/* Mobile: Add Slot Button */}
                                {index === day.timeSlots.length - 1 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addTimeSlot(key)}
                                    className="md:hidden rounded-full border-gray-300 hover:bg-white/60"
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add
                                  </Button>
                                )}
                              </div>
                            ))
                          )}
                          {day.timeSlots.length === 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addTimeSlot(key)}
                              className="rounded-full border-gray-300 hover:bg-white/60"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Time Slot
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Auto-Save Toast */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 right-6 bg-[#22c55e] text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 z-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">Saved</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Booking Detail Modal */}
        <AnimatePresence>
          {selectedBooking && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedBooking(null)}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 ${glassCardClass} p-8 w-full max-w-md mx-6`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                    Booking Details
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedBooking(null)}
                    className="rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Customer</p>
                    <p className="text-lg font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                      {selectedBooking.customer.name}
                    </p>
                    <p className="text-sm text-gray-600 font-light">{selectedBooking.customer.email}</p>
                    <p className="text-sm text-gray-600 font-light">{selectedBooking.customer.phone}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Service</p>
                    <p className="text-base font-semibold text-gray-900">{selectedBooking.service?.name || 'N/A'}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Date & Time</p>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-900 font-light">
                          {format(parseISO(selectedBooking.date), 'MMM d, yyyy')} | {selectedBooking.timeSlot.startTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Payment Status</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedBooking.paymentStatus || 'Pending'} | {selectedBooking.paymentGateway || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/30">
                    <Button
                      className="w-full rounded-full bg-[#22c55e] text-white hover:bg-green-600 h-auto py-3 font-semibold"
                      onClick={() => {
                        window.open(`https://wa.me/${selectedBooking.customer.phone.replace(/\D/g, '')}`, '_blank');
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Open in WhatsApp
                    </Button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
