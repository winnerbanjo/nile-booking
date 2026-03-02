import React from 'react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, ArrowRight, Check } from 'lucide-react';
import { NileLogo } from '../../components/ui/NileLogo';

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

export const NileCollective: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] pt-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-4 py-24"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#22c55e] to-green-600 flex items-center justify-center">
              <Store className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Nile Collective
          </h1>
          <p className="text-xl text-gray-600 font-light leading-relaxed">
            The MERN marketplace for African businesses | Part of the Nile Ecosystem
          </p>
        </motion.div>

        {/* Main Content */}
        <motion.div variants={fadeInUp} className={`${glassCardClass} p-12 md:p-16 mb-8`}>
          <h2 className="text-3xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Buy and Sell with Confidence
          </h2>
          <p className="text-lg text-gray-600 mb-6 font-light leading-relaxed">
            Nile Collective is a full-stack MERN marketplace connecting buyers and sellers across Africa. Built with MongoDB, Express, React, and Node.js, it's designed for businesses that need a reliable platform to grow their reach.
          </p>
          <p className="text-lg text-gray-600 font-light leading-relaxed">
            From handmade crafts to digital services, Nile Collective makes it easy to discover, purchase, and sell products with secure payments and trusted verification.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div variants={fadeInUp} className={`${glassCardClass} p-12 md:p-16 mb-8`}>
          <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Features
          </h3>
          <div className="space-y-4">
            {[
              'Full MERN stack architecture for scalability',
              'Secure payment processing with escrow protection',
              'Seller verification and rating system',
              'Advanced search and filtering',
              'Multi-category marketplace support',
              'Integration with Nile Booking for service providers',
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#22c55e] mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span className="text-base text-gray-700 font-light">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeInUp} className="text-center">
          <p className="text-lg text-gray-600 mb-6 font-light">
            Explore the Nile Collective marketplace and discover amazing products from African businesses.
          </p>
          <Button
            size="lg"
            className="rounded-full px-8 py-6 text-lg font-semibold bg-[#22c55e] text-white hover:bg-green-600 h-auto tracking-tight"
            asChild
          >
            <a href="https://nilecollective.co" target="_blank" rel="noopener noreferrer">
              Visit Nile Collective <ArrowRight className="w-5 h-5 inline-block ml-2" />
            </a>
          </Button>
        </motion.div>

        {/* Ecosystem Link */}
        <motion.div variants={fadeInUp} className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4 font-light">Part of the Nile Ecosystem</p>
          <Link to="/" className="inline-flex items-center gap-2 text-[#22c55e] hover:text-green-600 transition-colors">
            <NileLogo size="sm" />
            <span className="font-semibold">Back to Nile Booking</span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};
