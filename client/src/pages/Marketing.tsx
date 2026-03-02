import React, { useState } from 'react';
import { ShareCard } from '../components/dashboard/ShareCard';
import { Sparkles, Share2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

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

export const Marketing: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<'barber' | 'fitness' | 'beauty'>('barber');

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] bg-fixed px-6 md:px-8 py-4 md:py-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto space-y-6 md:space-y-8"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Marketing & Growth
            </h1>
            <p className="text-base text-gray-600 font-light tracking-tight" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Generate viral flyers | Share your website | Grow your business
            </p>
          </div>
        </motion.div>

        {/* Industry Selector */}
        <motion.div variants={fadeInUp} className={glassCardClass}>
          <div className="p-6">
            <h2 className="text-xl font-black text-gray-900 mb-4 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Choose Your Industry
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {(['barber', 'fitness', 'beauty'] as const).map((industry) => (
                <button
                  key={industry}
                  onClick={() => setSelectedIndustry(industry)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedIndustry === industry
                      ? 'border-[#22c55e] bg-[#22c55e]/10'
                      : 'border-gray-200 bg-white/60 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900 capitalize" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                    {industry === 'barber' ? 'Barbers & Stylists' : industry === 'fitness' ? 'Fitness & Wellness' : 'Beauty Specialists'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Flyer Generator */}
        <motion.div variants={fadeInUp} className={glassCardClass}>
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Share2 className="w-5 h-5 text-[#22c55e]" />
              <h2 className="text-xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                Viral Flyer Generator
              </h2>
            </div>
            <ShareCard industry={selectedIndustry} />
          </div>
        </motion.div>

        {/* Growth Tips */}
        <motion.div variants={fadeInUp} className={glassCardClass}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-[#22c55e]" />
              <h2 className="text-xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                Growth Tips
              </h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white/60 rounded-xl">
                <p className="text-sm font-semibold text-gray-900 mb-1">Share on WhatsApp</p>
                <p className="text-xs text-gray-600 font-light">Send your flyer to existing clients and ask them to share with friends.</p>
              </div>
              <div className="p-4 bg-white/60 rounded-xl">
                <p className="text-sm font-semibold text-gray-900 mb-1">Post on Social Media</p>
                <p className="text-xs text-gray-600 font-light">Use Instagram Stories, Facebook posts, and Twitter to reach new customers.</p>
              </div>
              <div className="p-4 bg-white/60 rounded-xl">
                <p className="text-sm font-semibold text-gray-900 mb-1">Print & Display</p>
                <p className="text-xs text-gray-600 font-light">Print flyers and display them at your location for walk-in customers.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
