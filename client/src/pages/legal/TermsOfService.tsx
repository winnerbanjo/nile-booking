import React from 'react';
import { Link } from 'react-router-dom';

export const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50/50 text-zinc-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 bg-white border border-zinc-200/80 rounded-2xl p-8 sm:p-12 shadow-xs">
        
        <div className="border-b border-zinc-200 pb-6 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Legal Document</span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Terms of Service</h1>
          <p className="text-xs text-zinc-500 font-mono">Effective Date: July 2026 • Nile Booking Technologies Inc.</p>
        </div>

        <div className="prose prose-zinc max-w-none text-xs sm:text-sm text-zinc-700 leading-relaxed space-y-6">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900">1. Agreement to Terms</h2>
            <p>
              By creating a merchant account or using the Nile Booking platform, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, you may not access or use our services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900">2. Merchant Responsibilities</h2>
            <p>
              Merchants are solely responsible for setting accurate service descriptions, pricing, working hours, and settlement bank details. Merchants must fulfill booked appointments or notify clients promptly via WhatsApp or phone.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900">3. Booking & Settlement Payments</h2>
            <p>
              Nile Booking facilitates direct client booking and transfer receipt management. Nile Booking is not a bank or deposit-taking institution. Direct bank transfers are settled directly between clients and merchant bank accounts.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900">4. Prohibited Uses</h2>
            <p>
              Users may not use Nile Booking for fraudulent activity, unauthorized payment collection, illegal services, or impersonation of legitimate businesses.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900">5. Termination</h2>
            <p>
              Nile Booking reserves the right to suspend or terminate accounts that violate platform policies or engage in fraudulent activity.
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
