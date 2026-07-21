import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, User, CheckCircle2, Shield, Phone, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { bookingApi } from '../lib/api';
import type { Booking } from '../types';

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | '3day' | 'week'>('week');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingApi.getBookings({ limit: 100 });
      setBookings(res.bookings || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const hours = Array.from({ length: 11 }).map((_, i) => i + 8); // 8:00 AM to 6:00 PM

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-6">
      
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-zinc-200/80 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-emerald-600" />
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">
              Visual Appointment Calendar
            </h1>
            <p className="text-xs text-zinc-500 font-normal">
              {format(currentDate, 'MMMM yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-100 rounded-lg p-0.5 border border-zinc-200">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'day' ? 'bg-white text-zinc-900 shadow-sm font-semibold' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('3day')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === '3day' ? 'bg-white text-zinc-900 shadow-sm font-semibold' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              3-Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'week' ? 'bg-white text-zinc-900 shadow-sm font-semibold' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Week
            </button>
          </div>

          <div className="flex items-center gap-1 border border-zinc-200 rounded-lg bg-white p-1">
            <button
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
              className="p-1 hover:bg-zinc-100 rounded text-zinc-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2 py-0.5 text-xs font-medium text-zinc-900 hover:bg-zinc-100 rounded"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
              className="p-1 hover:bg-zinc-100 rounded text-zinc-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Visual Grid */}
      <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-sm">
        
        {/* Days Header */}
        <div className="grid grid-cols-8 border-b border-zinc-200 text-center bg-zinc-50/80 text-xs font-semibold text-zinc-700">
          <div className="py-3 border-r border-zinc-200 text-zinc-400 font-normal">Time</div>
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={`py-3 border-r border-zinc-200/60 last:border-r-0 ${
                  isToday ? 'bg-emerald-50 text-emerald-900 font-bold' : ''
                }`}
              >
                <div>{format(day, 'EEE')}</div>
                <div className={`text-base font-bold mt-0.5 ${isToday ? 'text-emerald-700' : 'text-zinc-900'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time Rows */}
        <div className="divide-y divide-zinc-100">
          {hours.map((hour) => {
            const timeString = `${hour < 10 ? '0' + hour : hour}:00`;
            return (
              <div key={hour} className="grid grid-cols-8 min-h-[64px] hover:bg-zinc-50/30 transition-colors">
                <div className="p-2 border-r border-zinc-200 text-right pr-3 text-[11px] font-medium text-zinc-400 select-none">
                  {hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`}
                </div>
                {weekDays.map((day) => {
                  const dayBookings = bookings.filter((b) => {
                    const bDate = new Date(b.date);
                    return isSameDay(bDate, day) && b.timeSlot?.startTime?.startsWith(timeString.slice(0, 2));
                  });

                  return (
                    <div
                      key={day.toISOString()}
                      className="p-1 border-r border-zinc-100 last:border-r-0 relative group min-h-[64px]"
                    >
                      {dayBookings.map((b) => (
                        <div
                          key={b._id}
                          className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-2 rounded-lg text-xs space-y-1 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="font-bold flex items-center justify-between text-[11px]">
                            <span className="truncate">{b.customer?.name}</span>
                            <span className="bg-emerald-200 text-emerald-800 text-[10px] px-1 rounded font-mono">
                              {b.timeSlot?.startTime}
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-700 font-medium truncate">
                            {typeof b.service === 'object' ? b.service.name : 'Service'}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
