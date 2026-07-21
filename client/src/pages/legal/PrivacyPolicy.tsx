import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50/50 text-zinc-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 bg-white border border-zinc-200/80 rounded-2xl p-8 sm:p-12 shadow-xs">
        
        <div className="border-b border-zinc-200 pb-6 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Legal Document</span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Privacy Policy</h1>
          <p className="text-xs text-zinc-500 font-mono">Last Updated: July 2026 • Nile Booking Technologies Inc.</p>
        </div>

        <div className="prose prose-zinc max-w-none text-xs sm:text-sm text-zinc-700 leading-relaxed space-y-6">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900">1. Overview & Commitment</h2>
            <p>
              Nile Booking Technologies Inc. ("Nile Booking", "we", "us", or "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy describes how we collect, use, process, and disclose your information across our website, mobile dashboard, and storefront booking services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900">2. Information We Collect</h2>
            <p>
              <strong>Merchant Data:</strong> Name, business name, work email address, WhatsApp phone number, logo, service listings, working hours, and bank settlement details.
            </p>
            <p>
              <strong>Client Data:</strong> When clients book an appointment on a merchant storefront, we collect client full name, email, WhatsApp phone number, requested service, appointment date/time, and transfer receipt screenshots.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900">3. How We Use Your Information</h2>
            <p>
              We process data strictly to facilitate appointment scheduling, send WhatsApp & email confirmations, enable bank transfer receipt verifications, and maintain platform security.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900">4. Data Security & Storage</h2>
            <p>
              We implement industry-standard encryption, SSL data transmission protocols, and strict access controls to safeguard all merchant and client information. We do not sell or rent personal data to third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900">5. Contact Information</h2>
            <p>
              For privacy inquiries or data removal requests, please contact our Legal & Data Protection team at <code>privacy@nile.ng</code>.
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
