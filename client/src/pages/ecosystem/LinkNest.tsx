import React from 'react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Link2, ArrowRight, Check } from 'lucide-react';
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

export const LinkNest: React.FC = () => {
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
              <Link2 className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            LinkNest
          </h1>
          <p className="text-xl text-gray-600 font-light leading-relaxed">
            The link-in-bio tool for creators | Part of the Nile Ecosystem
          </p>
        </motion.div>

        {/* Main Content */}
        <motion.div variants={fadeInUp} className={`${glassCardClass} p-12 md:p-16 mb-8`}>
          <h2 className="text-3xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            One Link, Infinite Possibilities
          </h2>
          <p className="text-lg text-gray-600 mb-6 font-light leading-relaxed">
            LinkNest is the modern link-in-bio platform built for creators, influencers, and entrepreneurs who need a professional way to share all their important links in one place.
          </p>
          <p className="text-lg text-gray-600 font-light leading-relaxed">
            Whether you're sharing your latest YouTube video, promoting your website, or directing followers to your store, LinkNest makes it simple and beautiful.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div variants={fadeInUp} className={`${glassCardClass} p-12 md:p-16 mb-8`}>
          <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Features
          </h3>
          <div className="space-y-4">
            {[
              'Customizable bio pages with your branding',
              'Unlimited links and social media integration',
              'Analytics to track clicks and engagement',
              'Mobile-optimized design',
              'Integration with Nile Booking for seamless booking links',
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
            LinkNest is coming soon. Join the waitlist to be notified when we launch.
          </p>
          <Button
            size="lg"
            className="rounded-full px-8 py-6 text-lg font-semibold bg-[#22c55e] text-white hover:bg-green-600 h-auto tracking-tight"
            asChild
          >
            <a href="https://mylinknest.com" target="_blank" rel="noopener noreferrer">
              Visit LinkNest <ArrowRight className="w-5 h-5 inline-block ml-2" />
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
