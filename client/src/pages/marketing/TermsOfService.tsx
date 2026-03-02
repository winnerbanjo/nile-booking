import React from 'react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

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

export const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] pt-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-4 py-24"
      >
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <FileText className="w-16 h-16 text-[#22c55e] mx-auto mb-6" strokeWidth={1.5} />
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Clear rules. Fair use.
          </h1>
        </motion.div>

        <motion.div variants={fadeInUp} className={`${glassCardClass} p-12 md:p-16`}>
          <p className="text-lg text-gray-600 mb-6 font-light leading-relaxed">
            The Terms of Service outline how Nile Booking works, user responsibilities, and platform guidelines.
          </p>
          <p className="text-lg text-gray-600 font-light leading-relaxed">
            They exist to protect both service providers and customers and to ensure a fair, reliable system for everyone.
          </p>
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
