import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Check, ChevronRight, UserPlus, CreditCard, Globe, Image, ArrowRight } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
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

const DOC_SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: UserPlus,
    steps: [
      {
        title: 'Create Your Account',
        description: 'Sign up at nilebooking.co/register with your email and business name. You\'ll receive a verification email to activate your account.',
      },
      {
        title: 'Barber/Merchant Verification',
        description: 'After registration, complete your profile with business details, phone number, and location. Our team verifies accounts within 24 hours to ensure quality.',
      },
      {
        title: 'Set Up Your First Service',
        description: 'Navigate to Dashboard > Services and add your first service. Include name, description, price, duration, and any special features.',
      },
      {
        title: 'Configure Your Schedule',
        description: 'Go to Dashboard > Settings to set your working hours, buffer time between appointments, and mark unavailable dates.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    icon: CreditCard,
    steps: [
      {
        title: 'Nigerian Bank Payout Setup',
        description: 'In Dashboard > Payments, add your Nigerian bank account details. We support all major Nigerian banks via Providus Bank integration.',
      },
      {
        title: 'Verify Bank Account',
        description: 'Enter your account number and select your bank. We\'ll verify the account name matches your business name before enabling payouts.',
      },
      {
        title: 'Payment Gateways',
        description: 'Nile Booking integrates with Paystack and Flutterwave. Customers can pay via card, bank transfer, or mobile money. All payments are held in escrow until service completion.',
      },
      {
        title: 'Cloudinary Receipt Verification',
        description: 'For bank transfer bookings, upload receipt images via Cloudinary. Our AI verifies receipts automatically, and admins can manually approve if needed.',
      },
      {
        title: 'Payout Schedule',
        description: 'Funds are available for payout 24 hours after service completion. Click "Payout" in Dashboard > Payments to transfer funds to your bank account.',
      },
    ],
  },
  {
    id: 'subdomains',
    title: 'Subdomains',
    icon: Globe,
    steps: [
      {
        title: 'Your Free Subdomain',
        description: 'Every Nile Booking account includes a free subdomain: [yourname].nilebooking.co. This is your professional website where customers can view services and book appointments.',
      },
      {
        title: 'Customizing Your Subdomain',
        description: 'Your subdomain automatically displays your business name, services, schedule, and booking calendar. Customize your profile image and bio in Dashboard > Profile.',
      },
      {
        title: 'Sharing Your Website',
        description: 'Share your [yourname].nilebooking.co link on social media, WhatsApp, business cards, or anywhere you want customers to book appointments.',
      },
      {
        title: 'Custom Domain (Growth & Empire Plans)',
        description: 'Upgrade to Growth or Empire plans to connect your own domain (e.g., bookings.yourbusiness.com). We provide DNS configuration instructions.',
      },
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing',
    icon: Image,
    steps: [
      {
        title: 'Flyer Generator',
        description: 'Navigate to Dashboard > Marketing > Share Card. Choose your industry (Barber, Fitness, Beauty) and download a professional flyer with your business name and booking URL.',
      },
      {
        title: 'AI Image Optimizer',
        description: 'In Dashboard > Services, use the AI Image Optimizer to enhance your service images. Upload photos and let AI improve lighting, composition, and quality.',
      },
      {
        title: 'Social Media Integration',
        description: 'Share your website link directly to Instagram, Facebook, Twitter, and WhatsApp. The flyer generator creates shareable images optimized for each platform.',
      },
      {
        title: 'WhatsApp Booking Links',
        description: 'Generate WhatsApp booking links that pre-fill customer information. Customers can book directly from WhatsApp conversations.',
      },
    ],
  },
];

export const Documentation: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] pt-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-4 py-24"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <BookOpen className="w-16 h-16 text-[#22c55e] mx-auto mb-6" strokeWidth={1.5} />
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Nile Booking Documentation
          </h1>
          <p className="text-xl text-gray-600 font-light leading-relaxed">
            Everything you need to get started and grow your service business
          </p>
        </motion.div>

        {/* Documentation Sections */}
        <div className="space-y-8">
          {DOC_SECTIONS.map((section, sectionIndex) => (
            <motion.div
              key={section.id}
              variants={fadeInUp}
              className={`${glassCardClass} p-8 md:p-12 overflow-hidden`}
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#22c55e]/10 flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-[#22c55e]" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                      {section.title}
                    </h2>
                    <p className="text-sm text-gray-600 font-light mt-1">
                      {section.steps.length} guides
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-6 h-6 text-gray-400 transition-transform ${activeSection === section.id ? 'rotate-90' : ''}`}
                />
              </div>

              {activeSection === section.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-8 pt-8 border-t border-white/30"
                >
                  <div className="space-y-6">
                    {section.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="pl-4 border-l-2 border-[#22c55e]/20">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-6 h-6 rounded-full bg-[#22c55e] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {stepIndex + 1}
                          </div>
                          <h3 className="text-lg font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-base text-gray-600 font-light leading-relaxed ml-9">
                          {step.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Quick Links */}
        <motion.div variants={fadeInUp} className={`${glassCardClass} p-8 md:p-12 mt-12`}>
          <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Quick Links
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              to="/register"
              className="flex items-center justify-between p-4 rounded-2xl bg-white/50 hover:bg-white/70 transition-all group"
            >
              <div className="flex items-center gap-3">
                <UserPlus className="w-5 h-5 text-[#22c55e]" />
                <span className="font-semibold text-gray-900">Create Account</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#22c55e] group-hover:translate-x-1 transition-all" />
            </Link>
            <Link
              to="/pricing"
              className="flex items-center justify-between p-4 rounded-2xl bg-white/50 hover:bg-white/70 transition-all group"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-[#22c55e]" />
                <span className="font-semibold text-gray-900">View Pricing</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#22c55e] group-hover:translate-x-1 transition-all" />
            </Link>
            <Link
              to="/resources/help"
              className="flex items-center justify-between p-4 rounded-2xl bg-white/50 hover:bg-white/70 transition-all group"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-[#22c55e]" />
                <span className="font-semibold text-gray-900">Help Center</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#22c55e] group-hover:translate-x-1 transition-all" />
            </Link>
            <Link
              to="/contact"
              className="flex items-center justify-between p-4 rounded-2xl bg-white/50 hover:bg-white/70 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#22c55e]" />
                <span className="font-semibold text-gray-900">Contact Support</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#22c55e] group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeInUp} className="mt-12 text-center">
          <p className="text-lg text-gray-600 mb-6 font-light">
            Ready to start? Create your free account and get your website live in minutes.
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
