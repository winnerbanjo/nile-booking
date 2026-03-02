import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, DollarSign, Globe, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

type Industry = 'barber' | 'fitness' | 'beauty' | 'other';

interface OnboardingTourProps {
  onComplete?: (industry: Industry) => void;
}

const INDUSTRIES: { value: Industry; label: string; description: string }[] = [
  { value: 'barber', label: 'Barbers & Stylists', description: 'Manage chairs, track tips, automate walk-ins' },
  { value: 'fitness', label: 'Fitness & Wellness', description: 'Sell sessions, track attendance, grow community' },
  { value: 'beauty', label: 'Beauty Specialists', description: 'High-touch booking for high-end results' },
  { value: 'other', label: 'Other', description: 'Customize your experience' },
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    const isFirstLogin = !hasCompletedOnboarding;
    
    if (isFirstLogin) {
      setIsVisible(true);
    }
  }, []);

  const steps = [
    {
      id: 'industry',
      title: 'Which industry are you in?',
      description: 'Help us customize your Nile Booking experience',
      content: (
        <div className="space-y-4 mt-6">
          {INDUSTRIES.map((industry) => (
            <motion.button
              key={industry.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedIndustry(industry.value)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedIndustry === industry.value
                  ? 'border-[#22c55e] bg-[#22c55e]/10'
                  : 'border-gray-200 bg-white/60 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                {industry.label}
              </div>
              <div className="text-sm text-gray-600 font-light">{industry.description}</div>
            </motion.button>
          ))}
        </div>
      ),
      canProceed: selectedIndustry !== null,
    },
    {
      id: 'calendar',
      title: 'Smart Calendar',
      description: 'Set your availability and let clients book instantly',
      icon: Calendar,
      spotlight: '#smart-calendar',
    },
    {
      id: 'financials',
      title: 'Financial Engine',
      description: 'Track revenue, manage payouts, and grow your business',
      icon: DollarSign,
      spotlight: '#financials',
    },
    {
      id: 'currency',
      title: 'Global Pricing',
      description: 'Switch between currencies to serve clients worldwide',
      icon: Globe,
      spotlight: '#currency-switcher',
    },
  ];

  const handleNext = () => {
    if (currentStep === 0 && selectedIndustry) {
      setCurrentStep(1);
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    if (selectedIndustry) {
      localStorage.setItem('user_industry', selectedIndustry);
    }
    setIsVisible(false);
    if (onComplete && selectedIndustry) {
      onComplete(selectedIndustry);
    }
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={handleSkip}
          />

          {/* Tour Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[101] bg-white/40 backdrop-blur-xl border border-white/40 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {Icon && <Icon className="w-5 h-5 text-[#22c55e]" />}
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <button
                onClick={handleSkip}
                className="p-2 hover:bg-white/50 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              {currentStepData.title}
            </h3>
            <p className="text-base text-gray-600 font-light mb-6">
              {currentStepData.description}
            </p>

            {currentStepData.content}

            <div className="flex items-center gap-3 mt-8">
              <Button
                onClick={handleSkip}
                variant="outline"
                className="flex-1 rounded-full border-gray-300 hover:bg-white/60"
              >
                Skip Tour
              </Button>
              <Button
                onClick={handleNext}
                disabled={!currentStepData.canProceed}
                className="flex-1 rounded-full bg-[#22c55e] text-white hover:bg-green-600 font-semibold"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </div>

            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-[#22c55e]'
                      : index < currentStep
                      ? 'w-2 bg-[#22c55e]/50'
                      : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
