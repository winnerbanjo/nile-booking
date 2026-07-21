import React from 'react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

export const Pricing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50/50 py-20 px-4 sm:px-6 lg:px-8 text-zinc-900 overflow-hidden">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-5xl mx-auto space-y-16"
      >
        
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
            <Sparkles className="w-3.5 h-3.5" />
            Transparent Quarterly Pricing
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900">
            Simple pricing. No setup fees. No hidden costs.
          </h1>
          <p className="text-sm text-zinc-500 font-normal">
            All plans are billed every three months. Choose the plan that fits your business today. Upgrade whenever you're ready.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Starter */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-white border border-zinc-200/80 rounded-xl p-6 space-y-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all"
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Starter</h3>
                <p className="text-xs text-zinc-500 mt-1">Essential booking for independent practitioners</p>
              </div>
              <div>
                <span className="text-3xl font-bold text-zinc-900">₦10,000</span>
                <span className="text-xs text-zinc-500 font-normal block mt-0.5">Every 3 months</span>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-700 font-normal pt-2 border-t border-zinc-100">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  Professional website
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  Online bookings
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  Online payments & bank transfers
                </li>
              </ul>
            </div>

            <Button
              asChild
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg h-9 text-xs font-medium transition-colors"
            >
              <Link to="/register">Choose Starter</Link>
            </Button>
          </motion.div>

          {/* Growth */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-zinc-900 text-white rounded-xl p-6 space-y-6 flex flex-col justify-between shadow-xl relative border border-zinc-800"
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-zinc-950 font-bold text-[10px] uppercase tracking-wider px-3 py-0.5 rounded-full">
              Most Popular
            </span>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">Growth</h3>
                <p className="text-xs text-zinc-400 mt-1">For growing shops & busy specialists</p>
              </div>
              <div>
                <span className="text-3xl font-bold text-white">₦15,000</span>
                <span className="text-xs text-zinc-400 font-normal block mt-0.5">Every 3 months</span>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-300 font-normal pt-2 border-t border-zinc-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  Professional website
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  Online bookings & payments
                </li>
                <li className="flex items-center gap-2 font-medium text-white">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  Custom domain included
                </li>
                <li className="flex items-center gap-2 font-medium text-white">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  Priority support
                </li>
              </ul>
            </div>

            <Button
              asChild
              className="w-full bg-white text-zinc-900 hover:bg-zinc-100 rounded-lg h-9 text-xs font-semibold transition-colors"
            >
              <Link to="/register">Choose Growth Plan</Link>
            </Button>
          </motion.div>

          {/* Premium */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-white border border-zinc-200/80 rounded-xl p-6 space-y-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all"
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Premium</h3>
                <p className="text-xs text-zinc-500 mt-1">Full brand customization & team features</p>
              </div>
              <div>
                <span className="text-3xl font-bold text-zinc-900">₦25,000</span>
                <span className="text-xs text-zinc-500 font-normal block mt-0.5">Every 3 months</span>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-700 font-normal pt-2 border-t border-zinc-100">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  All Growth features
                </li>
                <li className="flex items-center gap-2 font-medium text-zinc-900">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  Custom domain included
                </li>
                <li className="flex items-center gap-2 font-medium text-zinc-900">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  Advanced branding & logo studio
                </li>
                <li className="flex items-center gap-2 font-medium text-zinc-900">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  Priority VIP support
                </li>
              </ul>
            </div>

            <Button
              asChild
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg h-9 text-xs font-medium transition-colors"
            >
              <Link to="/register">Choose Premium Plan</Link>
            </Button>
          </motion.div>

        </motion.div>

        {/* CTA Hero */}
        <motion.div
          variants={fadeInUp}
          className="bg-white border border-zinc-200/80 rounded-2xl p-8 text-center space-y-4 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Your next client is already online.
          </h2>
          <p className="text-xs text-zinc-500">Give them a place to discover you, trust you and book you.</p>
          <div>
            <Button
              asChild
              className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-10 px-6 text-xs font-medium shadow-md transition-all transform hover:-translate-y-0.5"
            >
              <Link to="/register" className="inline-flex items-center gap-2 whitespace-nowrap">
                <span>Launch your website today</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
            </Button>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};
