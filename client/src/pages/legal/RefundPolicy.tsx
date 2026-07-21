import React from 'react';
import { Link } from 'react-router-dom';

export const RefundPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50/50 text-zinc-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 bg-white border border-zinc-200/80 rounded-2xl p-8 sm:p-12 shadow-xs">
        
        <div className="border-b border-zinc-200 pb-6 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Legal Document</span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Refund & Cancellation Policy</h1>
          <p className="text-xs text-zinc-500 font-mono">Effective Date: July 2026 • Nile Booking Technologies Inc.</p>
        </div>

        <div className="prose prose-zinc max-w-none text-xs sm:text-sm text-zinc-700 leading-relaxed space-y-6">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900">1. Deposit & Booking Cancellations</h2>
            <p>
              Upfront deposits collected during booking serve to reserve the merchant's calendar time slot. Clients wishing to cancel or reschedule must notify the merchant at least 24 hours prior to the scheduled appointment time.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900">2. Merchant Deposit Refunds</h2>
            <p>
              Cancellations made with more than 24 hours notice may be eligible for a full deposit refund or slot transfer to a new date at the merchant's discretion. Late cancellations (less than 24 hours notice) or no-shows forfeit the deposit.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900">3. Platform Subscription Refunds</h2>
            <p>
              Merchant quarterly plan subscriptions (Starter ₦10,000, Growth ₦15,000, Premium ₦25,000) are refundable within 7 days of initial subscription purchase if no storefront bookings have been processed.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-zinc-200 flex justify-between items-center text-xs">
          <Link to="/" className="text-zinc-900 font-semibold hover:underline">← Back to Nile Booking</Link>
          <span className="text-zinc-400">© 2026 Nile Booking Technologies Inc.</span>
        </div>

      </div>
    </div>
  );
};
