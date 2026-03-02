import React from 'react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Target, Users, Globe } from 'lucide-react';

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

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] pt-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-4 py-24"
      >
        {/* Hero */}
        <motion.div variants={fadeInUp} className={`${glassCardClass} p-12 md:p-16 mb-8`}>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-8 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Empowering African Entrepreneurs
          </h1>
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-600 mb-6 font-light leading-relaxed">
              Nile Booking was born in Lagos, Nigeria | specifically in Ipaja, where we saw firsthand the challenges service providers face every day. From barbershops to salons, fitness trainers to consultants, talented entrepreneurs were struggling with manual booking systems, payment delays, and fragmented client communication.
            </p>
            <p className="text-lg text-gray-600 mb-6 font-light leading-relaxed">
              Our mission is simple: empower the next 100,000 African entrepreneurs to build sustainable service businesses using technology that feels human, not robotic.
            </p>
            <p className="text-lg text-gray-600 font-light leading-relaxed">
              Today, Nile Booking operates from Lagos to Sheridan, Wyoming, serving entrepreneurs across Nigeria and beyond. We're building the infrastructure that makes it easy for service providers to focus on what they do best | delivering exceptional experiences to their clients.
            </p>
          </div>
        </motion.div>

        {/* Mission */}
        <motion.div variants={fadeInUp} className={`${glassCardClass} p-12 md:p-16 mb-8`}>
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-8 h-8 text-[#22c55e]" strokeWidth={2} />
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Our Mission
            </h2>
          </div>
          <p className="text-lg text-gray-600 mb-6 font-light leading-relaxed">
            By 2026, we aim to empower 100,000 service providers across Africa. Every barber, stylist, trainer, consultant, and creative professional deserves access to tools that help them grow their business, not complicate it.
          </p>
          <p className="text-lg text-gray-600 font-light leading-relaxed">
            We believe technology should remove friction, not create it. That's why Nile Booking is built around real workflows | the way service providers actually work, not how engineers think they should work.
          </p>
        </motion.div>

        {/* Values */}
        <motion.div variants={fadeInUp} className={`${glassCardClass} p-12 md:p-16 mb-8`}>
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-8 h-8 text-[#22c55e]" strokeWidth={2} />
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Built for Real People
            </h2>
          </div>
          <p className="text-lg text-gray-600 mb-6 font-light leading-relaxed">
            Nile Booking isn't built in a Silicon Valley bubble. It's built by people who understand the daily realities of running a service business in Lagos, Abuja, Port Harcourt, and cities across Africa.
          </p>
          <p className="text-lg text-gray-600 font-light leading-relaxed">
            We've talked to hundreds of barbers, stylists, trainers, and consultants. We've seen their WhatsApp message threads, their paper calendars, their cash-only transactions. Nile Booking exists to replace all of that with something better | something that actually works.
          </p>
        </motion.div>

        {/* Locations */}
        <motion.div variants={fadeInUp} className={`${glassCardClass} p-12 md:p-16`}>
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-8 h-8 text-[#22c55e]" strokeWidth={2} />
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              From Lagos to Wyoming
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white/50">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-[#22c55e]" />
                <h3 className="font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                  Lagos HQ
                </h3>
              </div>
              <p className="text-gray-600 font-light">
                Office 10 Ipaja, Modern Market<br />
                Lagos, Nigeria
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/50">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-[#22c55e]" />
                <h3 className="font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                  USA HQ
                </h3>
              </div>
              <p className="text-gray-600 font-light">
                NILE TECHNOLOGIES INC<br />
                30 N Gould St Ste R<br />
                Sheridan, WY 82801, USA
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeInUp} className="mt-12 text-center">
          <p className="text-lg text-gray-600 mb-6 font-light">
            Join us in building the future of service commerce in Africa.
          </p>
          <Button
            size="lg"
            className="rounded-full px-8 py-6 text-lg font-semibold bg-[#22c55e] text-white hover:bg-green-600 h-auto tracking-tight"
            asChild
          >
            <Link to="/register">Get Started Free</Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
