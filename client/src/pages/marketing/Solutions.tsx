import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Scissors, Camera, Briefcase, GraduationCap, HeartPulse, Sparkles, ArrowRight } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const Solutions: React.FC = () => {
  const verticals = [
    {
      icon: Scissors,
      title: 'Barbers & Hair Stylists',
      desc: 'Eliminate 15+ WhatsApp DMs a day. Clients select cuts, pick available slots, pay deposits, and receive instant confirmation.',
    },
    {
      icon: Sparkles,
      title: 'Beauty Salons & Spas',
      desc: 'Manage multi-staff schedules, service catalogs, packages, and deposit settlements seamlessly.',
    },
    {
      icon: Camera,
      title: 'Photographers & Studios',
      desc: 'Book portrait sessions, commercial shoots, and studio rentals with upfront deposit protection.',
    },
    {
      icon: Briefcase,
      title: 'Consultants & Agencies',
      desc: 'Schedule strategy calls, client discovery sessions, and retainer appointments across time zones.',
    },
    {
      icon: GraduationCap,
      title: 'Tutors & Coaches',
      desc: 'Organize 1-on-1 tutoring sessions, fitness training, and group workshops with automated calendar sync.',
    },
    {
      icon: HeartPulse,
      title: 'Therapists & Wellness Practitioners',
      desc: 'Provide a clean, private, and professional booking experience for private appointments.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 text-zinc-900 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-6xl mx-auto space-y-16"
      >
        
        <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200">
            Tailored Industry Solutions
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900">
            Designed for Every Service Business
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 font-normal leading-relaxed">
            Whether you sell appointments, expertise, or creative services, Nile Booking provides a trusted home for your business.
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {verticals.map((v, idx) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white border border-zinc-200/80 rounded-xl p-6 space-y-3 shadow-xs hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900">{v.title}</h3>
                <p className="text-xs text-zinc-600 font-normal leading-relaxed">{v.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="bg-white border border-zinc-200/80 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-zinc-900">Launch your industry-tailored website today</h2>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-lg mx-auto font-normal">
            Join thousands of African service professionals booking clients automatically.
          </p>
          <div>
            <Button
              asChild
              className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-10 px-6 text-xs font-medium shadow-md transition-all transform hover:-translate-y-0.5"
            >
              <Link to="/register">
                Start Free Storefront
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};
