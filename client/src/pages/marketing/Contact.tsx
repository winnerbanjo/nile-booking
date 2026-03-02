import React from 'react';
import { Button } from '../../components/ui/button';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] },
  },
};

const glassCardClass = "bg-white/40 backdrop-blur-2xl border border-white/30 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]";

export const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] pt-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-4 py-24"
      >
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Let's talk
          </h1>
          <p className="text-xl text-gray-600 font-light leading-relaxed">
            Have questions, feedback, or partnership ideas? Reach out to us anytime.
          </p>
          <p className="text-lg text-gray-600 mt-4 font-light leading-relaxed">
            We're always happy to help and listen.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div variants={fadeInUp} className={`${glassCardClass} p-8`}>
            <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Lagos HQ
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#22c55e] mt-0.5 flex-shrink-0" />
                <span className="text-base text-gray-600 font-light leading-relaxed">
                  Office 10 Ipaja, Modern Market<br />Lagos, Nigeria
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#22c55e] flex-shrink-0" />
                <a href="tel:+2348123843076" className="text-base text-gray-600 hover:text-gray-900 font-light transition-colors">
                  +234 812 384 3076
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className={`${glassCardClass} p-8`}>
            <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              USA HQ
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#22c55e] mt-0.5 flex-shrink-0" />
                <span className="text-base text-gray-600 font-light leading-relaxed">
                  NILE TECHNOLOGIES INC<br />30 N Gould St Ste R<br />Sheridan, WY 82801, USA
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div variants={fadeInUp} className={`${glassCardClass} p-8 mt-8`}>
          <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Get in Touch
          </h2>
          <a
            href="mailto:hello@nilebooking.com"
            className="inline-flex items-center gap-3 text-lg font-semibold text-[#22c55e] hover:text-[#16a34a] transition-colors"
          >
            <Mail className="w-5 h-5" />
            hello@nilebooking.com
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
};
