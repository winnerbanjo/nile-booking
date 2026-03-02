import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Globe, Package, Users, Briefcase, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'product' | 'solutions';
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose, type }) => {
  const productItems = [
    {
      icon: CreditCard,
      title: 'Payments',
      description: 'Branded accounts & instant Paystack/Flutterwave payouts',
      href: '/product#payments',
      badge: 'NEW',
    },
    {
      icon: Globe,
      title: 'Website',
      description: '10-second professional site launch',
      href: '/product#website',
    },
    {
      icon: Package,
      title: 'Inventory',
      description: 'Sync products and track expertise automatically',
      href: '/product#inventory',
    },
  ];

  const solutionsItems = [
    {
      icon: Palette,
      title: 'For Creators',
      description: 'Makeup artists, stylists, and beauty professionals',
      href: '/solutions#creators',
    },
    {
      icon: Briefcase,
      title: 'For Freelancers',
      description: 'Consultants, coaches, and independent professionals',
      href: '/solutions#freelancers',
    },
    {
      icon: Users,
      title: 'For Agencies',
      description: 'Teams managing multiple service providers',
      href: '/solutions#agencies',
    },
  ];

  const items = type === 'product' ? productItems : solutionsItems;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-[600px] bg-white border border-gray-200 rounded-3xl shadow-xl p-8 z-50"
            onMouseLeave={onClose}
          >
            <div className="grid grid-cols-1 gap-6">
              {items.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  onClick={onClose}
                  className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                    <item.icon className="w-6 h-6 text-[#22c55e]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                        {item.title}
                      </h3>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-[#22c55e] text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 font-light leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
