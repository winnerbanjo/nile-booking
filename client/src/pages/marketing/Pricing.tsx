import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { CurrencySwitcher, formatCurrency, getCurrentCurrency, Currency } from '../../components/CurrencySwitcher';

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

const glassCardClass = "bg-white/40 backdrop-blur-xl border border-white/40 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]";

const PRICING_PLANS = {
  starter: {
    name: 'STARTER',
    priceNGN: 0,
    fee: '3%',
    features: [
      'Unlimited Bookings',
      'Free Subdomain ([yourname].nilebooking.co)',
      'Basic Booking Calendar',
      'Email Notifications',
      'Mobile-Responsive Page',
      'Paystack & Flutterwave Integration',
    ],
  },
  growth: {
    name: 'GROWTH',
    priceNGN: 10000,
    fee: '1%',
    features: [
      'Everything in Starter',
      'Custom Subdomain Support',
      'Flyer Generator',
      'AI Image Optimizer',
      'Advanced Analytics',
      'Priority Email Support',
    ],
  },
  empire: {
    name: 'EMPIRE',
    priceNGN: 50000,
    fee: '0%',
    features: [
      'Everything in Growth',
      'Custom Domain (yourbusiness.com)',
      '24/7 Priority Support',
      'White-Label Options',
      'API Access',
      'Dedicated Account Manager',
    ],
  },
};

export const Pricing: React.FC = () => {
  const [currency, setCurrency] = useState<Currency>(getCurrentCurrency());

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] pt-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter"
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}
            >
              Simple pricing that grows with you
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 font-light leading-relaxed mb-8"
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
            >
              Nile Booking offers transparent pricing designed for service providers at every stage.
            </motion.p>
            {/* Currency Switcher */}
            <motion.div variants={fadeInUp} className="flex justify-center">
              <CurrencySwitcher onCurrencyChange={handleCurrencyChange} />
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards - 3 Tier Grid */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {/* STARTER */}
              <motion.div
                variants={fadeInUp}
                className={`${glassCardClass} p-8 hover:bg-white/50 transition-all duration-300`}
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                    STARTER
                  </h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                      {formatCurrency(PRICING_PLANS.starter.priceNGN, currency)}
                    </span>
                    <span className="text-gray-600 font-light">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 font-light mb-4">
                    {PRICING_PLANS.starter.fee} transaction fee
                  </p>
                </div>
                <ul className="space-y-4 mb-8">
                  {PRICING_PLANS.starter.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#22c55e] mt-0.5 flex-shrink-0" strokeWidth={2} />
                      <span className="text-base text-gray-700 font-light">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full rounded-full bg-gray-900 text-white hover:bg-gray-800 h-auto py-6 text-base font-semibold tracking-tight"
                  size="lg"
                  asChild
                >
                  <Link to="/register">Get Started Free</Link>
                </Button>
              </motion.div>

              {/* GROWTH */}
              <motion.div
                variants={fadeInUp}
                className={`${glassCardClass} p-8 hover:bg-white/50 transition-all duration-300 relative ring-2 ring-[#22c55e]/30 border-t-4 border-[#22c55e]`}
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#22c55e] text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                    GROWTH
                  </h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                      {formatCurrency(PRICING_PLANS.growth.priceNGN, currency)}
                    </span>
                    <span className="text-gray-600 font-light">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 font-light mb-4">
                    {PRICING_PLANS.growth.fee} transaction fee + Custom Subdomain
                  </p>
                </div>
                <ul className="space-y-4 mb-8">
                  {PRICING_PLANS.growth.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#22c55e] mt-0.5 flex-shrink-0" strokeWidth={2} />
                      <span className="text-base text-gray-700 font-light">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full rounded-full bg-[#22c55e] text-white hover:bg-green-600 h-auto py-6 text-base font-semibold tracking-tight"
                  size="lg"
                  asChild
                >
                  <Link to="/register">Start Growth Trial</Link>
                </Button>
              </motion.div>

              {/* EMPIRE */}
              <motion.div
                variants={fadeInUp}
                className={`${glassCardClass} p-8 hover:bg-white/50 transition-all duration-300 border-t-4 border-[#22c55e]/50`}
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                    EMPIRE
                  </h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                      {formatCurrency(PRICING_PLANS.empire.priceNGN, currency)}
                    </span>
                    <span className="text-gray-600 font-light">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 font-light mb-4">
                    {PRICING_PLANS.empire.fee} transaction fee + Custom Domain + 24/7 Support
                  </p>
                </div>
                <ul className="space-y-4 mb-8">
                  {PRICING_PLANS.empire.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#22c55e] mt-0.5 flex-shrink-0" strokeWidth={2} />
                      <span className="text-base text-gray-700 font-light">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full rounded-full bg-gray-900 text-white hover:bg-gray-800 h-auto py-6 text-base font-semibold tracking-tight"
                  size="lg"
                  asChild
                >
                  <Link to="/register">Start Empire Trial</Link>
                </Button>
              </motion.div>
            </div>
            <motion.p
              variants={fadeInUp}
              className="text-center mt-8 text-base text-gray-600 font-light"
            >
              No hidden fees | No long-term contracts | Upgrade only when your business is ready
            </motion.p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tighter"
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}
            >
              Start free today
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 mb-8 font-light"
            >
              No credit card required
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-semibold bg-gray-900 text-white hover:bg-gray-800 h-auto tracking-tight"
                asChild
              >
                <Link to="/register">Get started</Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </motion.div>
    </div>
  );
};
