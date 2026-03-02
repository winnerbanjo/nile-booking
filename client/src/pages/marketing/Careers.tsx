import React from 'react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';

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

export const Careers: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] pt-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-4 py-24"
      >
        <motion.div variants={fadeInUp} className={`${glassCardClass} p-12 md:p-16`}>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-8 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Build meaningful products with us
          </h1>
          <p className="text-xl text-gray-600 mb-8 font-light leading-relaxed">
            We are always looking for people who care about design, technology, and real-world impact.
          </p>
          <p className="text-lg text-gray-600 font-light leading-relaxed">
            If you enjoy building products that empower businesses and creators, we'd love to hear from you.
          </p>
        </motion.div>

        <motion.div variants={fadeInUp} className={`${glassCardClass} p-12 md:p-16 mt-8`}>
          <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Open Positions
          </h2>
          <p className="text-lg text-gray-600 mb-6 font-light leading-relaxed">
            We're currently hiring for roles in engineering, design, and product. Check back soon for specific openings, or reach out to us directly.
          </p>
          <a
            href="mailto:careers@nilebooking.com"
            className="inline-flex items-center gap-2 text-lg font-semibold text-[#22c55e] hover:text-[#16a34a] transition-colors"
          >
            <Mail className="w-5 h-5" />
            careers@nilebooking.com
          </a>
        </motion.div>

        <motion.div variants={fadeInUp} className="mt-12 text-center">
          <Button
            size="lg"
            className="rounded-full px-8 py-6 text-lg font-semibold bg-gray-900 text-white hover:bg-gray-800 h-auto tracking-tight"
            asChild
          >
            <Link to="/register">Join Our Mission</Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
