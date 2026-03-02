import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const ComingSoonModal: React.FC<ComingSoonModalProps> = ({ isOpen, onClose, title = 'Coming Soon' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white/40 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-md w-full p-8 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                  {title}
                </h2>
                <p className="text-base text-gray-600 mb-8 font-light leading-relaxed">
                  We're working on something amazing. This feature will be available soon.
                </p>
                <Button
                  onClick={onClose}
                  className="rounded-full bg-gray-900 text-white hover:bg-gray-800 px-8 py-6"
                >
                  Got it
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
