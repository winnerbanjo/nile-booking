import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';

export const FaqPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Do I need technical skills?',
      a: 'No. Everything is designed to be simple. You can set up your website and start receiving bookings in just a few minutes without writing code.',
    },
    {
      q: 'Can clients pay online?',
      a: 'Yes. Accept deposits or full payments directly online through direct bank transfers and receipt uploads.',
    },
    {
      q: 'Can I use my own domain?',
      a: 'Yes. Growth and Premium plans include custom domain connection support (e.g., yourname.com).',
    },
    {
      q: 'Can I manage my business on mobile?',
      a: 'Yes. Your Nile Booking dashboard works seamlessly across mobile, tablet, and desktop devices.',
    },
    {
      q: 'Can I change plans later?',
      a: 'Absolutely. You can upgrade or modify your plan at any time as your business grows.',
    },
    {
      q: 'How long does setup take?',
      a: 'Just a few minutes. Enter your business name, add your services, and share your unique booking link.',
    },
    {
      q: 'How do bank transfer deposits work?',
      a: 'When a client books an appointment, they receive your merchant bank transfer account details. They transfer the deposit and upload a screenshot of their receipt. You review and verify it on your dashboard.',
    },
    {
      q: 'Can I assign multiple staff members to services?',
      a: 'Yes! Under your Staff management tab, you can add barbers, stylists, or team members, set their login credentials, and assign specific services to them.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 text-zinc-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        
        <div className="text-center space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200">
            Help & Knowledge Base
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-zinc-600 font-normal">
            Everything you need to know about setting up your booking website
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-xs">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full text-left px-6 py-4 flex items-center justify-between text-xs sm:text-sm font-semibold text-zinc-900"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {activeFaq === idx && (
                <div className="px-6 pb-4 text-xs text-zinc-600 font-normal leading-relaxed border-t border-zinc-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-zinc-900 text-white rounded-2xl p-8 text-center space-y-4">
          <h2 className="text-xl font-bold">Have a question not answered here?</h2>
          <p className="text-xs text-zinc-400 font-normal">Our support team is ready to assist your merchant onboarding.</p>
          <div>
            <Button
              asChild
              className="bg-white text-zinc-900 hover:bg-zinc-100 rounded-lg h-9 px-5 text-xs font-medium"
            >
              <Link to="/register">Contact Support / Get Started</Link>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
