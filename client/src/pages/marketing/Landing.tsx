import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { NileLogo } from '@/components/ui/NileLogo';
import { Footer } from '@/components/marketing/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  CheckCircle2,
  Calendar,
  CreditCard,
  Globe,
  Clock,
  MessageSquare,
  Zap,
  ChevronDown,
  ArrowRight,
  Check,
  Sparkles,
} from 'lucide-react';

const HERO_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&fit=crop',
    title: 'Barber & Grooming Studio',
    subtitle: 'Bookings & Upfront Deposits',
  },
  {
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&fit=crop',
    title: 'Hair & Beauty Salon',
    subtitle: 'Multi-Staff Scheduling',
  },
  {
    url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&fit=crop',
    title: 'Strategy & Coaching',
    subtitle: 'Worldwide Client Booking',
  },
  {
    url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1200&fit=crop',
    title: 'Creative Studio',
    subtitle: 'Direct Portfolio Checkout',
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const Landing: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const featureGridItems = [
    { title: 'Professional website', desc: 'Fast, mobile-optimized storefront for your business' },
    { title: 'Online booking', desc: 'Instant 24/7 appointment self-scheduling' },
    { title: 'Deposit collection', desc: 'Protect your calendar with automatic upfront deposits' },
    { title: 'Online payments', desc: 'Accept direct bank transfer & payment receipts' },
    { title: 'Availability management', desc: 'Custom working hours, breaks & blocked days' },
    { title: 'Appointment reminders', desc: 'Instant WhatsApp & client booking notifications' },
    { title: 'Client history', desc: 'Track customer booking frequency & lifetime spend' },
    { title: 'Service catalogue', desc: 'Organize prices, durations & service categories' },
    { title: 'Custom branding', desc: 'Upload your own business logo, colors & hero banner' },
    { title: 'Custom domain', desc: 'Connect your own domain name (e.g. yourname.com)' },
    { title: 'Mobile dashboard', desc: 'Manage bookings, clients & schedule from any device' },
    { title: 'Analytics', desc: 'Real-time booking revenue & client performance data' },
    { title: 'Invoices', desc: 'Generate & send printable digital client invoices' },
    { title: 'Multi-staff scheduling', desc: 'Assign barbers, stylists & staff to specific services' },
    { title: 'Time zone support', desc: 'Automatic local timezone conversions for remote clients' },
    { title: 'SEO-ready pages', desc: 'Optimized search engine metadata for google discovery' },
  ];

  const faqs = [
    {
      q: 'Do I need technical skills?',
      a: 'No. Everything is designed to be simple. You can set up your website and start receiving bookings in just a few minutes without writing a single line of code.',
    },
    {
      q: 'Can clients pay online?',
      a: 'Yes. Accept deposits or full payments directly online through direct bank transfers and receipt uploads.',
    },
    {
      q: 'Can I use my own domain?',
      a: 'Yes. Growth and Premium plans include custom domain connection support (e.g., yourname.com).',
    },
    {
      q: 'Can I manage my business on mobile?',
      a: 'Yes. Your Nile Booking dashboard works seamlessly across mobile, tablet, and desktop devices.',
    },
    {
      q: 'Can I change plans later?',
      a: 'Absolutely. You can upgrade or modify your plan at any time as your business grows.',
    },
    {
      q: 'How long does setup take?',
      a: 'Just a few minutes. Enter your business name, add your services, and share your unique booking link.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white overflow-hidden">
      
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <Link to="/" className="flex items-center">
            <NileLogo size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-600">
            <Link to="/product" className="hover:text-zinc-900 transition-colors">Product</Link>
            <Link to="/solutions" className="hover:text-zinc-900 transition-colors">Solutions</Link>
            <Link to="/how-it-works" className="hover:text-zinc-900 transition-colors">How it Works</Link>
            <Link to="/pricing" className="hover:text-zinc-900 transition-colors">Pricing</Link>
            <Link to="/faq" className="hover:text-zinc-900 transition-colors">FAQ</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-medium text-zinc-700 hover:text-zinc-900 px-3 py-2 transition-colors"
            >
              Sign in
            </Link>
            <Button
              asChild
              className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg h-9 px-4 text-xs font-medium transition-all shadow-sm hover:shadow"
            >
              <Link to="/register">Launch your website</Link>
            </Button>
          </div>

        </div>
      </header>

      {/* Side-by-Side Split Hero Section */}
      <section className="pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          
          {/* Left Column: Copy & Actions */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-6"
          >
            <motion.div variants={fadeInUp}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 leading-[1.08]">
                Your talent gets them interested.<br />
                <span className="text-zinc-500 font-semibold">Your website gets you booked.</span>
              </h1>
            </motion.div>

            <motion.p variants={fadeInUp} className="text-base sm:text-lg text-zinc-600 font-normal leading-relaxed">
              Showcase your work, accept appointments, and collect deposits from one professional website.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                asChild
                className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-11 px-6 text-xs font-semibold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <Link to="/register" className="inline-flex items-center gap-2 whitespace-nowrap">
                  <span>Launch your website</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="bg-white border-zinc-300 text-zinc-900 hover:bg-zinc-100 rounded-xl h-11 px-6 text-xs font-semibold transition-all shadow-xs"
              >
                <Link to="/login">Sign In</Link>
              </Button>

              <Link
                to="/how-it-works"
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900 px-3 py-2.5 inline-flex items-center gap-1 transition-colors group"
              >
                See how it works
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp} className="pt-4 border-t border-zinc-200/80">
              <p className="text-xs text-zinc-500 font-normal leading-relaxed">
                <strong className="text-zinc-900 font-semibold">Trusted by modern service businesses.</strong> Built for barbers, stylists, consultants, coaches, photographers, therapists & agencies.
              </p>
            </motion.div>
          </motion.div>

          {/* Right Column: Sliding Image Carousel with Framer Motion */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full h-80 sm:h-96 lg:h-[460px] rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 bg-zinc-900 group"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIdx}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="absolute inset-0"
              >
                <img
                  src={HERO_IMAGES[currentImageIdx].url}
                  alt={HERO_IMAGES[currentImageIdx].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>

                <div className="absolute bottom-6 left-6 right-6 text-white space-y-1 z-10">
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-zinc-100 border border-white/20">
                    {HERO_IMAGES[currentImageIdx].subtitle}
                  </span>
                  <h3 className="text-lg font-bold text-white pt-1">{HERO_IMAGES[currentImageIdx].title}</h3>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slider Indicator Dots */}
            <div className="absolute top-4 right-4 flex gap-1.5 z-20">
              {HERO_IMAGES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIdx(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentImageIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </motion.div>

        </div>
      </section>

      {/* Core Value Propositions (Pillars) */}
      <section className="py-20 bg-white border-y border-zinc-200/80 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto space-y-16"
        >
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
              Built for people whose time is worth paying for
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 font-normal">
              Reinvent your booking experience with tools engineered to turn visitors into paying clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {[
              { icon: Globe, title: 'A home for your business', desc: 'A beautiful website is no longer optional. Every Nile Booking website is fast, mobile-ready and designed to turn visitors into bookings.' },
              { icon: Calendar, title: 'Bookings without back & forth', desc: "Stop answering 'Are you available?'. Clients choose a service, pick a time and confirm instantly." },
              { icon: CreditCard, title: 'Payments that respect time', desc: 'Accept deposits or full payment before appointments. Protect your schedule and reduce no-shows.' },
              { icon: Clock, title: 'Your calendar, organised', desc: 'Working hours, unavailable dates, breaks and appointments all live in one place.' },
              { icon: MessageSquare, title: 'Built for WhatsApp', desc: 'Share one link. Clients see your business, services and availability without endless chats.' },
              { icon: Zap, title: 'Everything in one place', desc: 'Website. Bookings. Payments. Calendar. Clients. One dashboard.' },
            ].map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-gray-50/60 border border-zinc-200/80 rounded-xl p-6 space-y-3 shadow-xs hover:shadow-md hover:border-zinc-300 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 tracking-tight">{pillar.title}</h3>
                  <p className="text-xs text-zinc-600 font-normal leading-relaxed">{pillar.desc}</p>
                </motion.div>
              );
            })}

          </div>

          {/* Designed for Every Service Business Banner */}
          <motion.div
            variants={fadeInUp}
            className="bg-zinc-900 text-white rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-xl border border-zinc-800"
          >
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Designed for every service business</h3>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-3xl mx-auto leading-relaxed font-normal">
              Barbers, salons, makeup artists, photographers, consultants, tutors, fitness coaches, therapists, dentists, lawyers, agencies and every business that sells expertise.
            </p>
          </motion.div>

        </motion.div>
      </section>

      {/* Feature Directory Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
            Complete Feature Directory
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal">
            Everything included to manage, market, and grow your service business
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {featureGridItems.map((item, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              className="bg-white border border-zinc-200/80 rounded-xl p-4 space-y-1 shadow-xs hover:border-zinc-300 transition-all"
            >
              <div className="flex items-center gap-2 text-zinc-900 font-semibold text-xs tracking-tight">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{item.title}</span>
              </div>
              <p className="text-[11px] text-zinc-500 font-normal leading-snug pl-5">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it Works (4 Steps) */}
      <section className="py-20 bg-white border-y border-zinc-200/80 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto space-y-12"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
              How It Works
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 font-normal">
              Launch your online booking storefront in 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '1', title: 'Create your website', desc: 'Choose your business name and launch your website.' },
              { num: '2', title: 'Add your services', desc: 'Set pricing, duration and availability.' },
              { num: '3', title: 'Share your link', desc: 'Send one link across WhatsApp, Instagram, TikTok or anywhere.' },
              { num: '4', title: 'Get booked', desc: 'Clients book and pay while you focus on your work.' },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -4 }}
                className="bg-gray-50/60 border border-zinc-200/80 rounded-xl p-6 space-y-3 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-xs">
                  {step.num}
                </div>
                <h3 className="text-sm font-semibold text-zinc-900">{step.title}</h3>
                <p className="text-xs text-zinc-500 font-normal leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
            Simple pricing. No setup fees. No hidden costs.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal">
            All plans are billed every three months. Choose the plan that fits your business today.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {/* Starter */}
          <motion.div variants={fadeInUp} className="bg-white border border-zinc-200/80 rounded-xl p-6 space-y-6 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Starter</h3>
                <p className="text-xs text-zinc-500 mt-1">Essential booking for independent practitioners</p>
              </div>
              <div>
                <span className="text-3xl font-bold text-zinc-900">₦10,000</span>
                <span className="text-xs text-zinc-500 font-normal block mt-0.5">Every 3 months</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-700 font-normal pt-2 border-t border-zinc-100">
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
              <Link to="/register">Get Started with Starter</Link>
            </Button>
          </motion.div>

          {/* Growth */}
          <motion.div variants={fadeInUp} className="bg-zinc-900 text-white rounded-xl p-6 space-y-6 flex flex-col justify-between shadow-xl relative border border-zinc-800">
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
              <ul className="space-y-2 text-xs text-zinc-300 font-normal pt-2 border-t border-zinc-800">
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
          <motion.div variants={fadeInUp} className="bg-white border border-zinc-200/80 rounded-xl p-6 space-y-6 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Premium</h3>
                <p className="text-xs text-zinc-500 mt-1">Full brand customization & team features</p>
              </div>
              <div>
                <span className="text-3xl font-bold text-zinc-900">₦25,000</span>
                <span className="text-xs text-zinc-500 font-normal block mt-0.5">Every 3 months</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-700 font-normal pt-2 border-t border-zinc-100">
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

      </section>

      {/* FAQ Accordion */}
      <section className="py-20 bg-white border-y border-zinc-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 font-normal">
              Everything you need to know about getting started with Nile Booking
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-gray-50/60 border border-zinc-200/80 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between text-xs sm:text-sm font-semibold text-zinc-900"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-zinc-600 font-normal leading-relaxed border-t border-zinc-200/40 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Premium Elevated Call to Action Hero Banner */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-b from-zinc-900 to-zinc-950 text-white rounded-3xl p-10 sm:p-16 text-center space-y-8 shadow-2xl relative overflow-hidden border border-zinc-800"
        >
          {/* Subtle Glow Background Effect */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 max-w-3xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium bg-white/10 text-emerald-400 border border-white/10 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              Join Thousands of Modern Service Businesses
            </div>

            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Your next client is already online.<br />
              <span className="text-zinc-400 font-normal">Give them a place to discover you, trust you and book you.</span>
            </h2>
          </div>

          <div className="pt-4 relative z-10 flex flex-col sm:flex-row justify-center items-center gap-3">
            <Button
              asChild
              className="bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl h-12 px-7 text-xs font-semibold shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 group border border-white"
            >
              <Link to="/register" className="inline-flex items-center gap-2 whitespace-nowrap">
                <span>Launch your website today</span>
                <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="bg-zinc-900/80 border-zinc-700 text-white hover:bg-zinc-800 rounded-xl h-12 px-7 text-xs font-semibold transition-all backdrop-blur-md"
            >
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};
