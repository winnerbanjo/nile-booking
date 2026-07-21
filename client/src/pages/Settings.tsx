import React, { useState, useEffect, useRef } from 'react';
import { scheduleApi, bookingApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import type { Schedule, WeeklySchedule } from '../types';
import { Plus, Trash2, Clock, CheckCircle2, Sliders } from 'lucide-react';

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
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [bufferTime, setBufferTime] = useState(15);
  const [bookingWindow, setBookingWindow] = useState(30);
  const [minimumLeadTime, setMinimumLeadTime] = useState(2);

  useEffect(() => {
    loadData();
  }, []);

  const autoSave = async () => {
    if (!schedule) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
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
    }, 800);
  };

  const defaultSchedule: Schedule = {
    _id: 'default-schedule-id',
    provider: 'default-provider',
    timezone: 'Africa/Lagos',
    bufferTime: 15,
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

  const loadData = async () => {
    try {
      const data = await scheduleApi.getSchedule();
      if (data && data.weeklySchedule) {
        setSchedule(data);
        setBufferTime(data.bufferTime || 15);
      } else {
        setSchedule(defaultSchedule);
      }
    } catch (error) {
      console.error('Failed to load schedule, using fallback:', error);
      setSchedule(defaultSchedule);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-xs text-zinc-500 font-normal">Loading schedule...</p>
        </div>
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
                  setBufferTime(parseInt(e.target.value));
                  autoSave();
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
                  setBookingWindow(parseInt(e.target.value));
                  autoSave();
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
                  setMinimumLeadTime(parseInt(e.target.value));
                  autoSave();
                }}
                className="w-full h-9 rounded-lg border border-zinc-300 bg-white px-3 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-zinc-900"
              >
                <option value="0">Instant booking allowed</option>
                <option value="1">1 hour minimum</option>
                <option value="24">24 hours minimum</option>
              </select>
              <p className="text-[11px] text-zinc-400 mt-1">Prevents last-minute bookings</p>
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
