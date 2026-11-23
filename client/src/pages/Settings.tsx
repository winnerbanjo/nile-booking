import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { scheduleApi, bookingApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import type { Schedule, WeeklySchedule } from '../types';
import { Plus, Trash2, Clock, CheckCircle2, Sliders, CalendarOff } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [showToast, setShowToast] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [bufferTime, setBufferTime] = useState(15);
  const [bookingWindow, setBookingWindow] = useState(60);
  const [minimumLeadTime, setMinimumLeadTime] = useState(0);
  const [timezone, setTimezone] = useState('Africa/Lagos');
  const [blockedStart, setBlockedStart] = useState('');
  const [blockedEnd, setBlockedEnd] = useState('');
  const [blockedReason, setBlockedReason] = useState('');

  const updateMutation = useMutation({
    mutationFn: (data: {
      weeklySchedule?: WeeklySchedule;
      bufferTime?: number;
      timezone?: string;
      bookingWindowDays?: number;
      minimumLeadTimeMinutes?: number;
      unavailableDates?: Schedule['unavailableDates'];
    }) => scheduleApi.updateSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.merchant.schedule });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    },
    onError: (error) => {
      console.error('Auto-save failed:', error);
    }
  });

  const autoSave = (
    currentSchedule?: Schedule | null,
    overrides?: Partial<{
      bufferTime: number;
      bookingWindowDays: number;
      minimumLeadTimeMinutes: number;
      timezone: string;
    }>
  ) => {
    const sched = currentSchedule || schedule;
    if (!sched) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      updateMutation.mutate({
        weeklySchedule: sched.weeklySchedule,
        bufferTime: overrides?.bufferTime ?? bufferTime,
        timezone: overrides?.timezone ?? timezone,
        bookingWindowDays: overrides?.bookingWindowDays ?? bookingWindow,
        minimumLeadTimeMinutes: overrides?.minimumLeadTimeMinutes ?? minimumLeadTime,
        unavailableDates: sched.unavailableDates.map((entry) => ({
          date: entry.date,
          endDate: entry.endDate || null,
          reason: entry.reason || '',
        })),
      });
    }, 800);
  };

  const defaultSchedule: Schedule = {
    _id: 'default-schedule-id',
    provider: 'default-provider',
    timezone: 'Africa/Lagos',
    bufferTime: 15,
    bookingWindowDays: 60,
    minimumLeadTimeMinutes: 0,
    unavailableDates: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    weeklySchedule: {
      monday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
      tuesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
      wednesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
      thursday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
      friday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
      saturday: { enabled: true, timeSlots: [{ startTime: '10:00', endTime: '16:00' }] },
      sunday: { enabled: false, timeSlots: [] },
    },
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.merchant.schedule,
    queryFn: scheduleApi.getSchedule,
  });

  useEffect(() => {
    if (data) {
      if (data.weeklySchedule) {
        setSchedule({ ...data, unavailableDates: data.unavailableDates || [] });
        setBufferTime(data.bufferTime || 15);
        setBookingWindow(data.bookingWindowDays ?? 60);
        setMinimumLeadTime(data.minimumLeadTimeMinutes ?? 0);
        setTimezone(data.timezone || 'Africa/Lagos');
      } else {
        setSchedule(defaultSchedule);
      }
    } else if (isError) {
      console.error('Failed to load schedule, using fallback');
      setSchedule(defaultSchedule);
    }
  }, [data, isError]);

  const updateDayEnabled = (dayKey: keyof WeeklySchedule, enabled: boolean) => {
    if (!schedule) return;
    const newSchedule = {
      ...schedule,
      weeklySchedule: {
        ...schedule.weeklySchedule,
        [dayKey]: {
          ...schedule.weeklySchedule[dayKey],
          enabled,
        },
      },
    };
    setSchedule(newSchedule);
    autoSave(newSchedule);
  };

  const addTimeSlot = (dayKey: keyof WeeklySchedule) => {
    if (!schedule) return;
    const day = schedule.weeklySchedule[dayKey];
    const newSchedule = {
      ...schedule,
      weeklySchedule: {
        ...schedule.weeklySchedule,
        [dayKey]: {
          ...day,
          timeSlots: [...day.timeSlots, { startTime: '09:00', endTime: '17:00' }],
        },
      },
    };
    setSchedule(newSchedule);
    autoSave(newSchedule);
  };

  const removeTimeSlot = (dayKey: keyof WeeklySchedule, index: number) => {
    if (!schedule) return;
    const day = schedule.weeklySchedule[dayKey];
    const newSchedule = {
      ...schedule,
      weeklySchedule: {
        ...schedule.weeklySchedule,
        [dayKey]: {
          ...day,
          timeSlots: day.timeSlots.filter((_, i) => i !== index),
        },
      },
    };
    setSchedule(newSchedule);
    autoSave(newSchedule);
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
    const newSchedule = {
      ...schedule,
      weeklySchedule: {
        ...schedule.weeklySchedule,
        [dayKey]: {
          ...day,
          timeSlots: updatedSlots,
        },
      },
    };
    setSchedule(newSchedule);
    autoSave(newSchedule);
  };

  const formatBlockedDate = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString().slice(0, 10);
  };

  const addBlockedDate = () => {
    if (!schedule || !blockedStart) return;
    const start = new Date(`${blockedStart}T00:00:00`);
    const end = blockedEnd ? new Date(`${blockedEnd}T00:00:00`) : null;
    if (end && end < start) {
      alert('The blocked range end must be on or after its start date.');
      return;
    }
    const newSchedule: Schedule = {
      ...schedule,
      unavailableDates: [
        ...(schedule.unavailableDates || []),
        {
          date: start.toISOString(),
          endDate: end ? end.toISOString() : null,
          reason: blockedReason.trim(),
        },
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    };
    setSchedule(newSchedule);
    setBlockedStart('');
    setBlockedEnd('');
    setBlockedReason('');
    autoSave(newSchedule);
  };

  const removeBlockedDate = (index: number) => {
    if (!schedule) return;
    const newSchedule: Schedule = {
      ...schedule,
      unavailableDates: (schedule.unavailableDates || []).filter((_, i) => i !== index),
    };
    setSchedule(newSchedule);
    autoSave(newSchedule);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-xs text-zinc-500 font-normal">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (isError && !schedule) {
    return (
      <div className="min-h-screen p-8">
        <EmptyState 
          type="error"
          title="Failed to load settings"
          description="We couldn't retrieve your schedule settings."
          primaryAction={{ label: 'Retry', onClick: () => refetch() }}
        />
      </div>
    );
  }

  if (!schedule) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-zinc-200/80 pb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight">
            Availability & Rules
          </h1>
          <p className="text-sm text-zinc-500 mt-1 font-normal">
            Configure working hours, buffer times, and booking lead rules
          </p>
        </div>

        {/* Smart Controls Card */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 pb-3">
            <Sliders className="w-3.5 h-3.5 text-zinc-600" />
            Booking Parameters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-medium text-zinc-700 mb-1.5 block">Buffer Time</Label>
              <select
                value={bufferTime}
                onChange={(e) => {
                  const newBuffer = parseInt(e.target.value);
                  setBufferTime(newBuffer);
                  autoSave(schedule, { bufferTime: newBuffer });
                }}
                className="w-full h-9 rounded-lg border border-zinc-300 bg-white px-3 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-zinc-900"
              >
                <option value="15">15 minutes buffer</option>
                <option value="30">30 minutes buffer</option>
                <option value="60">1 hour buffer</option>
              </select>
              <p className="text-[11px] text-zinc-400 mt-1">Between appointments</p>
            </div>

            <div>
              <Label className="text-xs font-medium text-zinc-700 mb-1.5 block">Booking Horizon</Label>
              <select
                value={bookingWindow}
                onChange={(e) => {
                  const days = parseInt(e.target.value);
                  setBookingWindow(days);
                  autoSave(schedule, { bookingWindowDays: days });
                }}
                className="w-full h-9 rounded-lg border border-zinc-300 bg-white px-3 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-zinc-900"
              >
                <option value="7">Up to 7 days ahead</option>
                <option value="30">Up to 30 days ahead</option>
                <option value="90">Up to 90 days ahead</option>
              </select>
              <p className="text-[11px] text-zinc-400 mt-1">Client advance notice limit</p>
            </div>

            <div>
              <Label className="text-xs font-medium text-zinc-700 mb-1.5 block">Minimum Lead Time</Label>
              <select
                value={minimumLeadTime}
                onChange={(e) => {
                  const minutes = parseInt(e.target.value);
                  setMinimumLeadTime(minutes);
                  autoSave(schedule, { minimumLeadTimeMinutes: minutes });
                }}
                className="w-full h-9 rounded-lg border border-zinc-300 bg-white px-3 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-zinc-900"
              >
                <option value="0">Instant booking allowed</option>
                <option value="1">1 hour minimum</option>
                <option value="24">24 hours minimum</option>
              </select>
              <p className="text-[11px] text-zinc-400 mt-1">Prevents last-minute bookings</p>
            </div>

            <div>
              <Label className="text-xs font-medium text-zinc-700 mb-1.5 block">Timezone</Label>
              <select
                value={timezone}
                onChange={(e) => {
                  const nextTimezone = e.target.value;
                  setTimezone(nextTimezone);
                  const newSchedule: Schedule = { ...schedule, timezone: nextTimezone };
                  setSchedule(newSchedule);
                  autoSave(newSchedule, { timezone: nextTimezone });
                }}
                className="w-full h-9 rounded-lg border border-zinc-300 bg-white px-3 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-zinc-900"
              >
                {Array.from(new Set([
                  timezone,
                  'Africa/Lagos',
                  'Africa/Abidjan',
                  'Africa/Nairobi',
                  'Africa/Johannesburg',
                  'Africa/Cairo',
                  'Europe/London',
                  'Europe/Paris',
                  'America/New_York',
                  'America/Los_Angeles',
                  'Asia/Dubai',
                  'Asia/Kolkata',
                  'Australia/Sydney',
                  'UTC',
                ])).map((zone) => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
              <p className="text-[11px] text-zinc-400 mt-1">Your working hours are interpreted in this timezone</p>
            </div>
          </div>
        </div>

        {/* Weekly Schedule Editor */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-zinc-900 border-b border-zinc-100 pb-3">
            Weekly Hours
          </h2>

          <div className="space-y-3">
            {DAYS.map(({ key, label }) => {
              const day = schedule.weeklySchedule[key];
              return (
                <div
                  key={key}
                  className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={day.enabled}
                      onChange={(e) => updateDayEnabled(key, e.target.checked)}
                    />
                    <span className="text-xs font-semibold text-zinc-900 w-24">{label}</span>
                  </div>

                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    {day.enabled ? (
                      day.timeSlots.map((slot, index) => (
                        <div key={index} className="flex items-center gap-1.5 bg-white border border-zinc-200 px-2 py-1 rounded-md">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateTimeSlot(key, index, 'startTime', e.target.value)}
                            className="text-xs border-none bg-transparent p-0 text-zinc-900 font-medium focus:ring-0 outline-none"
                          />
                          <span className="text-xs text-zinc-400 font-normal">to</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateTimeSlot(key, index, 'endTime', e.target.value)}
                            className="text-xs border-none bg-transparent p-0 text-zinc-900 font-medium focus:ring-0 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(key, index)}
                            className="text-zinc-400 hover:text-red-600 ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400 font-normal">Unavailable</span>
                    )}

                    {day.enabled && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeSlot(key)}
                        className="h-7 text-[11px] bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100 rounded px-2"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Slot
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Blocked Dates */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center gap-2">
            <CalendarOff className="w-4 h-4 text-zinc-600" />
            Blocked Dates
          </h2>
          <p className="text-xs text-zinc-500 font-normal">
            Customers cannot book on these dates. Use an end date to block a range (inclusive).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <Label className="text-xs font-medium text-zinc-700 mb-1.5 block">From</Label>
              <Input type="date" value={blockedStart} onChange={(e) => setBlockedStart(e.target.value)} className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-xs font-medium text-zinc-700 mb-1.5 block">To (optional)</Label>
              <Input type="date" value={blockedEnd} min={blockedStart || undefined} onChange={(e) => setBlockedEnd(e.target.value)} className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-xs font-medium text-zinc-700 mb-1.5 block">Reason (optional)</Label>
              <Input value={blockedReason} onChange={(e) => setBlockedReason(e.target.value)} placeholder="Holiday, travel..." className="h-9 text-xs" />
            </div>
            <Button
              type="button"
              onClick={addBlockedDate}
              disabled={!blockedStart}
              className="h-9 text-xs bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Block Date
            </Button>
          </div>

          {(schedule.unavailableDates || []).length === 0 ? (
            <p className="text-xs text-zinc-400 font-normal py-1">No blocked dates. Every working day is bookable.</p>
          ) : (
            <div className="space-y-2">
              {(schedule.unavailableDates || []).map((entry, index) => (
                <div key={`${entry.date}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50/40">
                  <div className="text-xs text-zinc-800 font-medium">
                    {formatBlockedDate(entry.date)}
                    {entry.endDate && entry.endDate !== entry.date ? ` → ${formatBlockedDate(entry.endDate)}` : ''}
                    {entry.reason ? <span className="text-zinc-400 font-normal"> · {entry.reason}</span> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBlockedDate(index)}
                    className="text-zinc-400 hover:text-red-600"
                    aria-label={`Remove blocked date ${formatBlockedDate(entry.date)}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Auto-Save Toast */}
        {showToast && (
          <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-3.5 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-xs font-medium z-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Schedule Changes Saved</span>
          </div>
        )}

      </div>
    </div>
  );
};
