import React from 'react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HelpCircle, Mail } from 'lucide-react';

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

export const HelpCenter: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] pt-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-4 py-24"
      >
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <HelpCircle className="w-16 h-16 text-[#22c55e] mx-auto mb-6" strokeWidth={1.5} />
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Support when you need it
          </h1>
          <p className="text-xl text-gray-600 font-light leading-relaxed">
            The Help Center provides quick answers to common questions and clear solutions to common issues.
          </p>
        </motion.div>

        <motion.div variants={fadeInUp} className={`${glassCardClass} p-12 md:p-16`}>
          <p className="text-lg text-gray-600 mb-8 font-light leading-relaxed">
            If you need more help, our support team is always available to assist you.
          </p>
          <a
            href="mailto:support@nilebooking.com"
            className="inline-flex items-center gap-3 text-lg font-semibold text-[#22c55e] hover:text-[#16a34a] transition-colors"
          >
            <Mail className="w-5 h-5" />
            support@nilebooking.com
          </a>
        </motion.div>

        <motion.div variants={fadeInUp} className="mt-12 text-center">
          <Button
            size="lg"
            className="rounded-full px-8 py-6 text-lg font-semibold bg-gray-900 text-white hover:bg-gray-800 h-auto tracking-tight"
            asChild
          >
            <Link to="/register">Get Started</Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
