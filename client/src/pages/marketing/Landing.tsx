import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { NileLogo } from '@/components/ui/NileLogo';
import { MessageCircle, Shield, Sparkles, BarChart, Scissors, Globe, Sparkles as SpaIcon, Star, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency, getCurrentCurrency, Currency } from '../../components/CurrencySwitcher';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.6, -0.05, 0.01, 0.99] },
  },
};

const floatAnimation = {
  y: [-4, 4],
  transition: {
    duration: 3,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: 'easeInOut',
  },
};

// Global Glass Card Class
const glassCardClass = "bg-white/40 backdrop-blur-xl border border-white/40 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]";
const glassCardStyle = { willChange: 'transform' };

// Emergency Fallback Hero Component
const EmergencyHero = () => (
  <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4">
    <div className="text-center max-w-2xl">
      <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
        Expertise, organized.
      </h1>
      <p className="text-xl md:text-2xl text-gray-600 mb-8 font-light">
        Your professional website, booking engine, and payments | Launched in 10 seconds.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          size="lg"
          className="rounded-full px-8 py-6 text-base font-semibold bg-gray-900 text-white hover:bg-gray-800"
          asChild
        >
          <Link to="/register">Launch Your Website</Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="rounded-full px-8 py-6 text-base font-semibold border border-gray-300"
          asChild
        >
          <a href="#use-cases">Use Cases</a>
        </Button>
      </div>
    </div>
  </div>
);

// Error Boundary Component for Landing
class LandingErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Landing component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <EmergencyHero />;
    }
    return this.props.children;
  }
}

export const Landing: React.FC = () => {
  const [currency] = useState<Currency>(getCurrentCurrency());

  // Wrap entire component in try-catch and error boundary
  try {
    return (
      <LandingErrorBoundary>
        <LandingContent currency={currency} />
      </LandingErrorBoundary>
    );
  } catch (error) {
    console.error('Landing render error:', error);
    return <EmergencyHero />;
  }
};

// Main Landing Content Component (extracted for error boundary)
const LandingContent: React.FC<{ currency: Currency }> = ({ currency }) => {

  try {
    return (
      <div className="min-h-screen bg-[#f9fafb] bg-fixed relative">
      {/* Background Texture - Grid Pattern - Optimized for mobile scroll performance */}
      <div 
        className="fixed inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)',
          willChange: 'auto',
          transform: 'translateZ(0)',
        }}
      />
      
      {/* Hero Section */}
      <section id="hero" className="relative pt-12 pb-6 px-4 sm:px-6 overflow-hidden">
        {/* Glow Blobs - Nile Green */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#22c55e] rounded-full blur-[120px] opacity-[0.05] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#22c55e] rounded-full blur-[120px] opacity-[0.05] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-[#22c55e] rounded-full blur-[120px] opacity-[0.05] -translate-x-1/2 translate-y-1/2 pointer-events-none" />
        
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/latino-hair-salon-owner-taking-care-client.jpg"
            alt="Professional barber"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/90 to-white" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center mb-8"
          >
            {/* Badge */}
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100/80 backdrop-blur-sm border border-gray-200/50 mb-6"
            >
              <span className="text-xs font-semibold text-gray-700 tracking-tight" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                Nile Booking 2026 | The New Standard
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-2xl sm:text-3xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-gray-900 mb-4 md:mb-6 leading-[1.05] tracking-tighter px-4"
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}
            >
              Expertise, organized.
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-600 max-w-4xl mx-auto leading-relaxed tracking-tight font-light mb-8 md:mb-10 px-4"
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
            >
              Your professional website, booking engine, and payments | Launched in 10 seconds.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                style={{ willChange: 'transform' }}
              >
                <Button
                  size="lg"
                  className="rounded-full px-6 md:px-8 py-5 md:py-6 text-sm md:text-base font-semibold bg-gray-900 text-white hover:bg-gray-800 h-auto min-h-[48px] tracking-tight"
                  asChild
                >
                  <Link to="/register">Launch Your Website</Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                style={{ willChange: 'transform' }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-6 md:px-8 py-5 md:py-6 text-sm md:text-base font-semibold border border-gray-300 hover:border-gray-400 h-auto min-h-[48px] tracking-tight bg-transparent backdrop-blur-sm"
                  asChild
                >
                  <a href="#use-cases">Use Cases</a>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Bento Grid Features - Product Snapshots with Floating Animation */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* The WhatsApp Bridge - Floating UI */}
            <motion.div
              variants={fadeInUp}
              animate={floatAnimation}
              className={`${glassCardClass} p-4 md:p-8 hover:bg-white/50 transition-all duration-300`}
              style={glassCardStyle}
            >
              <div className="mb-6">
                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#22c55e] flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-semibold">Lagos Barber</div>
                      <div className="text-gray-400 text-xs">Online</div>
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4 mb-3">
                    <div className="text-white text-sm mb-2">Check out my website:</div>
                    <div className="bg-white/10 rounded-lg p-3 border border-white/10">
                      <div className="text-white text-xs font-medium mb-1">lagosbarber.nilebooking.com</div>
                      <div className="text-gray-400 text-xs">Book your appointment now</div>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                The WhatsApp Bridge
              </h3>
              <p className="text-base text-gray-600 leading-relaxed tracking-tight font-light">
                Your website link generates rich previews. Clients book and pay without ever leaving the chat.
              </p>
            </motion.div>

            {/* Escrow Logic - Floating UI */}
            <motion.div
              variants={fadeInUp}
              animate={floatAnimation}
              transition={{ delay: 0.1 }}
              className={`${glassCardClass} p-8 hover:bg-white/50 transition-all duration-300`}
            >
              <div className="mb-6">
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">Service: Faded Cut</div>
                    <div className="text-2xl font-black text-gray-900 tracking-tighter">{formatCurrency(15000, currency)}</div>
                  </div>
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Deposit (50%)</span>
                      <span className="text-lg font-black text-gray-900 tracking-tighter">{formatCurrency(7500, currency)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Balance Due</span>
                      <span className="text-sm text-gray-500">At appointment</span>
                    </div>
                  </div>
                  <button className="w-full bg-[#22c55e] text-white rounded-xl py-3 font-semibold text-sm hover:bg-[#16a34a] transition-colors">
                    Pay with Paystack
                  </button>
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                Escrow Logic
              </h3>
              <p className="text-base text-gray-600 leading-relaxed tracking-tight font-light">
                Showing a 50% deposit checkout flow via Paystack. Automated deposits ensure your time is valued.
              </p>
            </motion.div>

            {/* AI Copywriter */}
            <motion.div
              variants={fadeInUp}
              animate={floatAnimation}
              transition={{ delay: 0.2 }}
              className={`${glassCardClass} p-8 hover:bg-white/50 transition-all duration-300`}
            >
              <div className="mb-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-[#22c55e]" />
                    <span className="text-xs font-semibold text-gray-700">AI Writing...</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-200 rounded-full w-full animate-pulse"></div>
                    <div className="h-2 bg-gray-200 rounded-full w-3/4 animate-pulse"></div>
                    <div className="h-2 bg-gray-200 rounded-full w-5/6 animate-pulse"></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600 font-light">
                      "Experience premium hair styling services tailored to your unique style. Our expert barbers combine traditional techniques with modern trends..."
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                AI Copywriter
              </h3>
              <p className="text-base text-gray-600 leading-relaxed tracking-tight font-light">
                A text box showing a service description being typed in real-time. Stop struggling with copy.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section - Native Stories */}
      <section id="use-cases" className="py-16 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-12"
          >
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-6xl font-black text-gray-900 mb-4 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                Real Stories from Real Businesses
              </h2>
              <p className="text-xl text-gray-600 font-light tracking-tight">
                See how professionals across Africa are using Nile Booking
              </p>
            </motion.div>

            {/* 3 Native Use Cases */}
            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              {/* Use Case 1: The Master Barber */}
              <motion.div
                variants={fadeInUp}
                className={`${glassCardClass} p-8 hover:bg-white/50 transition-all duration-300`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#22c55e]/10 flex items-center justify-center">
                    <Scissors className="w-6 h-6 text-[#22c55e]" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                      The Master Barber
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500 font-light">Ipaja, Lagos</span>
                    </div>
                  </div>
                </div>
                <p className="text-base text-gray-600 leading-relaxed tracking-tight font-light mb-4">
                  Managing walk-ins and transfers at a busy barbershop in Ipaja. Clients book via WhatsApp link, pay deposits, and receive automatic confirmations. No more missed appointments or payment disputes.
                </p>
                <div className="space-y-2 pt-4 border-t border-white/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-light">Daily Walk-ins</span>
                    <span className="text-gray-900 font-semibold">15+</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-light">Transfer Bookings</span>
                    <span className="text-gray-900 font-semibold">8/day</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-light">Revenue Increase</span>
                    <span className="text-[#22c55e] font-semibold">+35%</span>
                  </div>
                </div>
              </motion.div>

              {/* Use Case 2: The Digital Agency */}
              <motion.div
                variants={fadeInUp}
                transition={{ delay: 0.1 }}
                className={`${glassCardClass} p-8 hover:bg-white/50 transition-all duration-300`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#22c55e]/10 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-[#22c55e]" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                      G.V.E STUDIO
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500 font-light">Digital Agency</span>
                    </div>
                  </div>
                </div>
                <p className="text-base text-gray-600 leading-relaxed tracking-tight font-light mb-4">
                  Booking discovery calls for G.V.E STUDIO. Clients schedule strategy sessions directly through their professional website. Automated calendar sync, timezone handling, and payment collection all in one place.
                </p>
                <div className="space-y-2 pt-4 border-t border-white/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-light">Discovery Calls</span>
                    <span className="text-gray-900 font-semibold">20/week</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-light">Conversion Rate</span>
                    <span className="text-gray-900 font-semibold">45%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-light">Time Saved</span>
                    <span className="text-[#22c55e] font-semibold">10hrs/week</span>
                  </div>
                </div>
              </motion.div>

              {/* Use Case 3: The Freelance Stylist */}
              <motion.div
                variants={fadeInUp}
                transition={{ delay: 0.2 }}
                className={`${glassCardClass} p-8 hover:bg-white/50 transition-all duration-300`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#22c55e]/10 flex items-center justify-center">
                    <Star className="w-6 h-6 text-[#22c55e]" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                      The Freelance Stylist
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500 font-light">Lagos, Nigeria</span>
                    </div>
                  </div>
                </div>
                <p className="text-base text-gray-600 leading-relaxed tracking-tight font-light mb-4">
                  Selling expertise and appointments on a custom subdomain. Clients discover services, book sessions, and pay deposits | all without leaving the stylist's professional website. Professional presence, zero technical skills required.
                </p>
                <div className="space-y-2 pt-4 border-t border-white/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-light">Subdomain</span>
                    <span className="text-gray-900 font-semibold">stylist.nilebooking.co</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-light">Monthly Bookings</span>
                    <span className="text-gray-900 font-semibold">60+</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-light">Client Satisfaction</span>
                    <span className="text-[#22c55e] font-semibold">98%</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Nile in the Real World - Using GlassCard Class */}
      <section id="solutions" className="py-16 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-8"
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-6xl font-black text-gray-900 mb-4 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                Nile in the Real World
              </h2>
              <p className="text-xl text-gray-600 font-light tracking-tight">
                See how professionals across Africa are transforming their businesses
              </p>
            </motion.div>

            {/* The Modern Stylist - Lagos */}
            <motion.div
              variants={fadeInUp}
              className={`${glassCardClass} p-6 md:p-8 lg:p-16`}
            >
              <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Scissors className="w-6 h-6 sm:w-8 sm:h-8 text-[#22c55e]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                        The Modern Stylist
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-500 font-light">Lagos, Nigeria</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-gray-900">4.9</span>
                      <span className="text-sm text-gray-500">(127 reviews)</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Faded Cut</span>
                        <span className="text-base font-black text-gray-900 tracking-tighter">{formatCurrency(15000, currency)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Beard Trim</span>
                        <span className="text-base font-black text-gray-900 tracking-tighter">{formatCurrency(5000, currency)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">Full Service</span>
                        <span className="text-base font-black text-gray-900 tracking-tighter">{formatCurrency(20000, currency)}</span>
                      </div>
                    </div>
                    <button className="w-full mt-4 bg-gray-900 text-white rounded-xl py-3 font-semibold text-sm hover:bg-gray-800 transition-colors">
                      Book Now
                    </button>
                  </div>
                  <p className="text-base text-gray-600 leading-relaxed tracking-tight font-light">
                    Eliminated 15 DMs a day. Clients now book, pay deposits, and receive WhatsApp confirmations automatically. Revenue increased 40% in the first month.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-light">Daily Bookings</span>
                      <span className="text-2xl font-black text-gray-900 tracking-tighter">24</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-light">No-Show Rate</span>
                      <span className="text-2xl font-black text-[#22c55e] tracking-tighter">2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-light">Revenue Growth</span>
                      <span className="text-2xl font-black text-gray-900 tracking-tighter">+40%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* The Strategy Consultant - Nairobi */}
            <motion.div
              variants={fadeInUp}
              className={`${glassCardClass} p-6 md:p-8 lg:p-16`}
            >
              <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
                <div className="order-2 md:order-1">
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 font-light">Time Zones</span>
                        <span className="text-2xl font-black text-gray-900 tracking-tighter">12</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 font-light">Currency Conversion</span>
                        <span className="text-2xl font-black text-[#22c55e] tracking-tighter">Auto</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 font-light">Client Satisfaction</span>
                        <span className="text-2xl font-black text-gray-900 tracking-tighter">98%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-[#22c55e]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                        The Strategy Consultant
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-500 font-light">Nairobi, Kenya</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
                    <div className="mb-4">
                      <h4 className="text-lg font-black text-gray-900 mb-2 tracking-tighter">Book a 1-hour Strategy Session</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>60 minutes</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Select Time Zone</label>
                      <select className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm">
                        <option>GMT+1 (WAT)</option>
                        <option>GMT+3 (EAT)</option>
                        <option>EST (GMT-5)</option>
                        <option>PST (GMT-8)</option>
                      </select>
                    </div>
                    <button className="w-full bg-gray-900 text-white rounded-xl py-3 font-semibold text-sm hover:bg-gray-800 transition-colors">
                      Book Session
                    </button>
                  </div>
                  <p className="text-base text-gray-600 leading-relaxed tracking-tight font-light">
                    Accepting bookings across time zones with instant currency conversion and professional invoicing. Clients from London to Lagos book seamlessly.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* The Wellness Center - Johannesburg */}
            <motion.div
              variants={fadeInUp}
              className={`${glassCardClass} p-6 md:p-8 lg:p-16`}
            >
              <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
                      <SpaIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[#22c55e]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                        The Wellness Center
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-500 font-light">Johannesburg, South Africa</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6 max-h-96 overflow-y-auto">
                    <h4 className="text-lg font-black text-gray-900 mb-4 tracking-tighter">Service Menu</h4>
                    <div className="space-y-4">
                      {[
                        { name: 'Deep Tissue Massage', duration: '60 min', price: 'R800' },
                        { name: 'Swedish Massage', duration: '90 min', price: 'R1,200' },
                        { name: 'Hot Stone Therapy', duration: '75 min', price: 'R1,000' },
                        { name: 'Aromatherapy', duration: '60 min', price: 'R850' },
                        { name: 'Couples Massage', duration: '90 min', price: 'R2,000' },
                        { name: 'Facial Treatment', duration: '45 min', price: 'R600' },
                      ].map((service, i) => (
                        <div key={i} className="bg-white/70 backdrop-blur-sm border border-gray-100 rounded-xl p-4 hover:bg-white/90 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-semibold text-gray-900 text-sm mb-1">{service.name}</div>
                              <div className="text-xs text-gray-500">{service.duration}</div>
                            </div>
                            <div className="font-black text-gray-900 tracking-tighter">{service.price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-base text-gray-600 leading-relaxed tracking-tight font-light">
                    Managing complex service menus and multi-staff scheduling through a unified digital dashboard. Multiple therapists, varied service durations, and package deals | all managed automatically.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-light">Staff Members</span>
                      <span className="text-2xl font-black text-gray-900 tracking-tighter">8</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-light">Services Offered</span>
                      <span className="text-2xl font-black text-[#22c55e] tracking-tighter">24</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-light">Booking Efficiency</span>
                      <span className="text-2xl font-black text-gray-900 tracking-tighter">100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="enterprise" className="py-16 px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-2xl sm:text-3xl md:text-7xl font-black text-gray-900 mb-8 leading-tight tracking-tighter"
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}
            >
              Start accepting bookings today
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-2xl text-gray-600 mb-16 tracking-tight font-light"
            >
              No credit card required
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-base font-semibold bg-gray-900 text-white hover:bg-gray-800 h-auto tracking-tight"
                asChild
              >
                <Link to="/register">Create your free website</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
    );
  } catch (error) {
    console.error("Landing component error:", error);
    return <EmergencyHero />;
  }
};
