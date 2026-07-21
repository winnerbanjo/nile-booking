import React, { useState } from 'react';
import { ShareCard } from '../components/dashboard/ShareCard';
import { Share2, TrendingUp, Sparkles, Target } from 'lucide-react';

export const Marketing: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<'barber' | 'fitness' | 'beauty'>('barber');

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-zinc-200/80 pb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight">
            Marketing & Growth Tools
          </h1>
          <p className="text-sm text-zinc-500 mt-1 font-normal">
            Generate promotional cards, share custom booking links, and boost client retention
          </p>
        </div>

        {/* Industry Selector */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 pb-3">
            <Target className="w-3.5 h-3.5 text-zinc-600" />
            Select Business Category
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['barber', 'fitness', 'beauty'] as const).map((industry) => (
              <button
                key={industry}
                onClick={() => setSelectedIndustry(industry)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedIndustry === industry
                    ? 'border-zinc-900 bg-zinc-900 text-white font-medium'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 font-normal'
                }`}
              >
                <div className="text-xs font-medium capitalize">
                  {industry === 'barber' ? 'Barbers & Stylists' : industry === 'fitness' ? 'Fitness & Wellness' : 'Beauty & Spa'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Flyer Generator */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Share2 className="w-4 h-4 text-zinc-700" />
            <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
              Promotional Share Card
            </h2>
          </div>
          <ShareCard industry={selectedIndustry} />
        </div>

        {/* Growth Recommendations */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <TrendingUp className="w-4 h-4 text-zinc-700" />
            <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
              Growth Strategies
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-lg text-xs">
              <p className="font-semibold text-zinc-900 mb-1">WhatsApp Direct Share</p>
              <p className="text-zinc-500 leading-relaxed font-normal">Broadcast your direct booking link to existing customer groups for quick re-bookings.</p>
            </div>
            <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-lg text-xs">
              <p className="font-semibold text-zinc-900 mb-1">Instagram Bio Link</p>
              <p className="text-zinc-500 leading-relaxed font-normal">Add your `.nilebooking.co` link directly to your bio so followers can book 24/7.</p>
            </div>
            <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-lg text-xs">
              <p className="font-semibold text-zinc-900 mb-1">QR Code Display</p>
              <p className="text-zinc-500 leading-relaxed font-normal">Print your booking QR code for counter displays to capture repeat walk-in business.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
