import React from 'react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
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

export const Blog: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] pt-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-4 py-24"
      >
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Insights for modern service businesses
          </h1>
          <p className="text-xl text-gray-600 font-light leading-relaxed">
            The Nile Booking blog covers topics such as:
          </p>
        </motion.div>

        <motion.div variants={fadeInUp} className={`${glassCardClass} p-12 md:p-16`}>
          <ul className="space-y-6">
            {[
              'Running a service business online',
              'Pricing services effectively',
              'Reducing no-shows',
              'Using AI in service workflows',
              'Branding and credibility for freelancers and creators',
            ].map((topic, index) => (
              <li key={index} className="text-lg text-gray-700 font-light leading-relaxed">
                {topic}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-base text-gray-600 font-light italic">
            Short reads. Real insights. No noise.
          </p>
        </motion.div>

        <motion.div variants={fadeInUp} className="mt-12 text-center">
          <p className="text-lg text-gray-600 mb-6 font-light">
            Blog posts coming soon. Check back for practical insights and tips.
          </p>
          <Button
            size="lg"
            className="rounded-full px-8 py-6 text-lg font-semibold bg-gray-900 text-white hover:bg-gray-800 h-auto tracking-tight"
            asChild
          >
            <Link to="/register">Get Started</Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
