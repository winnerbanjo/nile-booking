import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Globe, Scissors, Share2, CheckCircle, ArrowRight } from 'lucide-react';

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

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      icon: Globe,
      title: '1. Create your website',
      desc: 'Choose your business name, pick your subdomain or custom domain, and launch your booking website in seconds.',
    },
    {
      num: '02',
      icon: Scissors,
      title: '2. Add your services',
      desc: 'Set pricing, appointment duration, buffer times between slots, and custom working hours.',
    },
    {
      num: '03',
      icon: Share2,
      title: '3. Share your link',
      desc: 'Place your single booking link on your Instagram bio, WhatsApp business profile, TikTok, or business card.',
    },
    {
      num: '04',
      icon: CheckCircle,
      title: '4. Get booked & paid',
      desc: 'Clients self-schedule 24/7, upload transfer receipt deposits, and receive instant WhatsApp appointment confirmations.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 text-zinc-900 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-5xl mx-auto space-y-16"
      >
        
        <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200">
            Simple 4-Step Process
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900">
            How Nile Booking Works
          </h1>
          <p className="text-sm text-zinc-600 font-normal leading-relaxed">
            Stop answering endless availability messages. Give your clients a fast, direct booking portal.
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} className="space-y-6">
          {steps.map((s, idx) => {
            return (
              <motion.div
                key={idx}
                variants={fadeInUp}
                whileHover={{ x: 4, transition: { duration: 0.2 } }}
                className="bg-white border border-zinc-200/80 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-xs hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white font-bold flex items-center justify-center text-sm shrink-0">
                  {s.num}
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-lg font-semibold text-zinc-900">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 font-normal leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="bg-zinc-900 text-white rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-xl border border-zinc-800"
        >
          <h2 className="text-2xl font-bold tracking-tight">Ready to get booked automatically?</h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto font-normal">
            Your next client is online. Launch your website today.
          </p>
          <div>
            <Button
              asChild
              className="bg-white text-zinc-900 hover:bg-zinc-100 rounded-lg h-10 px-6 text-xs font-semibold shadow-md transition-all transform hover:-translate-y-0.5"
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
