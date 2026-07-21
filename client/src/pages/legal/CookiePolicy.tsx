import React from 'react';
import { Link } from 'react-router-dom';

export const CookiePolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50/50 text-zinc-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 bg-white border border-zinc-200/80 rounded-2xl p-8 sm:p-12 shadow-xs">
        
        <div className="border-b border-zinc-200 pb-6 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Legal Document</span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Cookie Policy</h1>
          <p className="text-xs text-zinc-500 font-mono">Effective Date: July 2026 • Nile Booking Technologies Inc.</p>
        </div>

        <div className="prose prose-zinc max-w-none text-xs sm:text-sm text-zinc-700 leading-relaxed space-y-6">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files placed on your device to ensure smooth website navigation, preserve session authentication, and remember merchant settings across browsing sessions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900">2. How We Use Cookies</h2>
            <p>
              We use essential cookies strictly for secure merchant dashboard logins, maintaining client checkout sessions, and remembering local currency preferences. We do not use intrusive third-party tracking cookies.
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
