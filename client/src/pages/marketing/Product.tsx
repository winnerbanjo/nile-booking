import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, CreditCard, MessageCircle, Sparkles, Globe, Shield, BarChart, Check } from 'lucide-react';
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

export const Product: React.FC = () => {
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
              The complete platform for selling services
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 mb-8 font-light leading-relaxed"
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
            >
              Nile Booking is a service-commerce platform that helps professionals sell their time, skills, and expertise online. It combines bookings, payments, AI assistance, and branding into one simple system.
            </motion.p>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-gray-600 max-w-3xl mx-auto font-light leading-relaxed"
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
            >
              Instead of juggling WhatsApp messages, calendars, and manual payments, Nile Booking gives you a professional website where clients can view your services, book available time slots, and pay instantly.
            </motion.p>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-gray-600 max-w-3xl mx-auto mt-4 font-light leading-relaxed"
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
            >
              Whether you are a solo creator or a growing agency, Nile Booking gives you the tools to look credible, work efficiently, and scale confidently.
            </motion.p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                Everything your service business needs. Nothing you don't.
              </h2>
              <p className="text-xl text-gray-600 font-light max-w-3xl mx-auto">
                Nile Booking is built around the real workflows of service providers.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className={`${glassCardClass} p-8 mb-8`}>
              <h3 className="text-lg font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                Key features include:
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  'Professional service websites with your own link',
                  'Smart availability and booking management',
                  'Flexible payments. Full payment, deposits, or pay later',
                  'AI assistance for content, pricing, and customer communication',
                  'WhatsApp notifications and reminders',
                  'Free subdomain with optional custom domain',
                  'Clean dashboards for bookings, clients, and revenue',
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="flex items-start gap-3"
                  >
                    <Check className="w-5 h-5 text-[#22c55e] mt-0.5 flex-shrink-0" strokeWidth={2} />
                    <span className="text-base text-gray-700 font-light leading-relaxed">{feature}</span>
                  </motion.div>
                ))}
              </div>
              <p className="mt-6 text-base text-gray-600 font-light leading-relaxed">
                Every feature is designed to reduce friction, save time, and help you get booked faster.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Globe,
                  title: 'Professional Websites',
                  description: 'Your own branded link where clients can view services and book instantly.',
                },
                {
                  icon: Calendar,
                  title: 'Smart Availability',
                  description: 'Set working hours, buffer times, and unavailable dates. Clients see only when you\'re available.',
                },
                {
                  icon: CreditCard,
                  title: 'Flexible Payments',
                  description: 'Accept full payment, deposits, or pay later via Paystack and Flutterwave.',
                },
                {
                  icon: MessageCircle,
                  title: 'WhatsApp Integration',
                  description: 'Shareable booking links and automatic WhatsApp notifications for confirmed bookings.',
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className={`${glassCardClass} p-8 hover:bg-white/50 transition-all duration-300`}
                >
                  <feature.icon className="w-10 h-10 text-[#22c55e] mb-4" strokeWidth={1.5} />
                  <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                    {feature.title}
                  </h3>
                  <p className="text-base text-gray-600 font-light leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Section */}
        <section id="ai" className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                Your built-in business assistant
              </h2>
              <p className="text-xl text-gray-600 font-light max-w-3xl mx-auto">
                Nile Booking includes AI that works directly inside your business.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div variants={fadeInUp}>
                <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                  The AI helps you:
                </h3>
                <div className="space-y-4">
                  {[
                    'Write clear and professional service descriptions',
                    'Suggest pricing based on service type and duration',
                    'Recommend better availability schedules',
                    'Answer common customer questions automatically',
                    'Summarize bookings, income, and client activity',
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      variants={fadeInUp}
                      className="flex items-start gap-3"
                    >
                      <Sparkles className="w-5 h-5 text-[#22c55e] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-base text-gray-700 font-light leading-relaxed">{item}</span>
                    </motion.div>
                  ))}
                </div>
                <p className="mt-6 text-base text-gray-600 font-light leading-relaxed">
                  This is not a chatbot gimmick. It is a practical assistant designed to help service providers work smarter and present themselves better online.
                </p>
              </motion.div>
              <motion.div variants={fadeInUp} className={`${glassCardClass} p-8`}>
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[#22c55e]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold mb-1 text-gray-900">AI Assistant</div>
                        <div className="text-sm text-gray-600 font-light">
                          I can help optimize your service description to be more engaging and SEO-friendly.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-700">U</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold mb-1 text-gray-900">You</div>
                        <div className="text-sm text-gray-600 font-light">
                          Optimize my "Bridal Makeup" service description
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Domains Section */}
        <section id="domains" className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                Own your brand online
              </h2>
              <p className="text-xl text-gray-600 font-light max-w-3xl mx-auto">
                Every Nile Booking user gets a free subdomain on signup. For example, yourname.nilebooking.com. This gives you a professional presence instantly.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div variants={fadeInUp} className={`${glassCardClass} p-8`}>
                <Globe className="w-10 h-10 text-[#22c55e] mb-4" strokeWidth={1.5} />
                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                  Free Subdomain
                </h3>
                <p className="text-base text-gray-600 mb-4 font-light">
                  Get started instantly with a free subdomain like:
                </p>
                <div className="bg-white rounded-lg p-4 font-mono text-lg border border-gray-200">
                  yourname.nilebooking.com
                </div>
              </motion.div>
              
              <motion.div variants={fadeInUp} className={`${glassCardClass} p-8`}>
                <Globe className="w-10 h-10 text-[#22c55e] mb-4" strokeWidth={1.5} />
                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                  Custom Domain
                </h3>
                <p className="text-base text-gray-600 mb-4 font-light">
                  If you want full ownership, you can purchase a custom domain directly from your dashboard. Examples include:
                </p>
                <div className="space-y-2 mb-4">
                  <div className="bg-white rounded-lg p-3 font-mono text-sm border border-gray-200">makeupbyzara.com</div>
                  <div className="bg-white rounded-lg p-3 font-mono text-sm border border-gray-200">coachdaniel.co</div>
                  <div className="bg-white rounded-lg p-3 font-mono text-sm border border-gray-200">studiobyade.ng</div>
                </div>
                <p className="text-sm text-gray-500 font-light">
                  Domains are powered by Namecheap and connected automatically. No DNS setup. No technical stress. Just your brand, live and ready.
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
