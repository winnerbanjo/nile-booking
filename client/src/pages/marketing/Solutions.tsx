import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Palette, Briefcase, Users, Check } from 'lucide-react';
import { motion } from 'framer-motion';

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

export const Solutions: React.FC = () => {
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
              Built for how different professionals work
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 font-light leading-relaxed"
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
            >
              Nile Booking adapts to different service models without forcing everyone into the same workflow.
            </motion.p>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-gray-600 mt-4 font-light leading-relaxed max-w-3xl mx-auto"
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
            >
              Whether you sell one-on-one sessions, group services, or project-based work, the platform is flexible enough to fit your needs while staying simple to use.
            </motion.p>
          </div>
        </section>

        {/* Solutions */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {/* For Creators */}
              <motion.div
                id="creators"
                variants={fadeInUp}
                className={`${glassCardClass} p-8 hover:bg-white/50 transition-all duration-300`}
              >
                <Palette className="w-12 h-12 text-[#22c55e] mb-6" strokeWidth={1.5} />
                <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                  Turn your skills into a real business
                </h3>
                <p className="text-base text-gray-600 mb-6 font-light leading-relaxed">
                  Creators use Nile Booking to sell consultations, coaching sessions, creative services, and paid calls.
                </p>
                <h4 className="text-lg font-black text-gray-900 mb-4 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                  With Nile Booking, creators can:
                </h4>
                <ul className="space-y-3">
                  {[
                    'Share one professional link across social media',
                    'Accept bookings without endless DMs',
                    'Get paid upfront for their time',
                    'Look credible with a branded website and domain',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#22c55e] mt-0.5 flex-shrink-0" strokeWidth={2} />
                      <span className="text-sm text-gray-700 font-light">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm text-gray-600 font-light italic">
                  Spend less time managing logistics and more time creating.
                </p>
              </motion.div>

              {/* For Freelancers */}
              <motion.div
                id="freelancers"
                variants={fadeInUp}
                className={`${glassCardClass} p-8 hover:bg-white/50 transition-all duration-300`}
              >
                <Briefcase className="w-12 h-12 text-[#22c55e] mb-6" strokeWidth={1.5} />
                <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                  Less admin. More paid work.
                </h3>
                <p className="text-base text-gray-600 mb-6 font-light leading-relaxed">
                  Freelancers rely on Nile Booking to simplify client management and scheduling.
                </p>
                <h4 className="text-lg font-black text-gray-900 mb-4 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                  You can:
                </h4>
                <ul className="space-y-3">
                  {[
                    'List your services clearly',
                    'Control your availability',
                    'Avoid missed appointments',
                    'Accept deposits or full payments',
                    'Manage all bookings in one place',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#22c55e] mt-0.5 flex-shrink-0" strokeWidth={2} />
                      <span className="text-sm text-gray-700 font-light">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm text-gray-600 font-light italic">
                  Nile Booking helps freelancers stay organized, professional, and in control of their time.
                </p>
              </motion.div>

              {/* For Agencies */}
              <motion.div
                id="agencies"
                variants={fadeInUp}
                className={`${glassCardClass} p-8 hover:bg-white/50 transition-all duration-300`}
              >
                <Users className="w-12 h-12 text-[#22c55e] mb-6" strokeWidth={1.5} />
                <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                  Built to scale with your team
                </h3>
                <p className="text-base text-gray-600 mb-6 font-light leading-relaxed">
                  Agencies use Nile Booking to manage multiple services, providers, and clients under one system.
                </p>
                <h4 className="text-lg font-black text-gray-900 mb-4 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                  It supports:
                </h4>
                <ul className="space-y-3">
                  {[
                    'Structured service offerings',
                    'Centralized booking management',
                    'Consistent client experience',
                    'Professional branding for the agency',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#22c55e] mt-0.5 flex-shrink-0" strokeWidth={2} />
                      <span className="text-sm text-gray-700 font-light">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm text-gray-600 font-light italic">
                  As your agency grows, Nile Booking grows with you.
                </p>
              </motion.div>
            </div>
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
              Ready to get started?
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-semibold bg-gray-900 text-white hover:bg-gray-800 h-auto tracking-tight"
                asChild
              >
                <Link to="/register">Create your free website</Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </motion.div>
    </div>
  );
};
