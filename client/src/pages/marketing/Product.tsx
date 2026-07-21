import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Globe, Calendar, CreditCard, Users, FileText, UserCheck, CheckCircle2, ArrowRight } from 'lucide-react';

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

export const Product: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50/50 text-zinc-900 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-6xl mx-auto space-y-16"
      >
        
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200">
            Platform Capabilities
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900">
            Engineered for Modern Service Businesses
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 font-normal leading-relaxed">
            Discover the complete suite of storefront, scheduling, payment settlement, CRM, and multi-staff management tools.
          </p>
        </motion.div>

        {/* Product Modules Grid */}
        <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {[
            { icon: Globe, title: 'Storefront & Custom Domain', desc: 'Launch a lightning-fast booking site on your custom domain or Nile subdomain. Upload your business logo, banner, and service catalog.' },
            { icon: Calendar, title: 'Automated Calendar & Slots', desc: 'Set custom weekly working hours, buffer times between appointments, and blocked break periods.' },
            { icon: CreditCard, title: 'Bank Transfer & Upfront Deposits', desc: 'Collect 50% deposits or full upfront payment to protect your time and eliminate no-shows. Direct transfer details & receipt upload.' },
            { icon: Users, title: 'Customer CRM Directory', desc: 'Track client booking frequency, cumulative lifetime revenue (LTV), appointment history, and 1-click WhatsApp messaging.' },
            { icon: UserCheck, title: 'Multi-Staff & Service Mapping', desc: 'Add barbers, stylists, and team members. Assign services and set individual staff login credentials for team access.' },
            { icon: FileText, title: 'Digital Invoice Generator', desc: 'Create professional digital invoices, send transfer payment links to WhatsApp, and print PDF receipts for client records.' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white border border-zinc-200/80 rounded-xl p-6 space-y-3 shadow-xs hover:shadow-md transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900">{item.title}</h3>
                <p className="text-xs text-zinc-600 font-normal leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}

        </motion.div>

        {/* CTA Hero Banner */}
        <motion.div
          variants={fadeInUp}
          className="bg-zinc-900 text-white rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-xl border border-zinc-800"
        >
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">Ready to streamline your service business?</h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto font-normal">
            Launch your professional booking site in under 3 minutes.
          </p>
          <div>
            <Button
              asChild
              className="bg-white text-zinc-900 hover:bg-zinc-100 rounded-lg h-10 px-6 text-xs font-semibold shadow-md transition-all transform hover:-translate-y-0.5"
            >
              <Link to="/register" className="inline-flex items-center gap-2 whitespace-nowrap">
                <span>Launch your website</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
            </Button>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};
