import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NileLogo } from '../ui/NileLogo';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 left-0 right-0 z-[100] transition-all duration-300 backdrop-blur-md border-b border-zinc-200/80 ${
        scrolled ? 'bg-white/90 shadow-xs' : 'bg-white/70'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <NileLogo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-600">
            <Link
              to="/product"
              className={`hover:text-zinc-900 transition-colors ${location.pathname === '/product' ? 'text-zinc-900 font-semibold' : ''}`}
            >
              Product
            </Link>
            <Link
              to="/solutions"
              className={`hover:text-zinc-900 transition-colors ${location.pathname === '/solutions' ? 'text-zinc-900 font-semibold' : ''}`}
            >
              Solutions
            </Link>
            <Link
              to="/how-it-works"
              className={`hover:text-zinc-900 transition-colors ${location.pathname === '/how-it-works' ? 'text-zinc-900 font-semibold' : ''}`}
            >
              How it Works
            </Link>
            <Link
              to="/pricing"
              className={`hover:text-zinc-900 transition-colors ${location.pathname === '/pricing' ? 'text-zinc-900 font-semibold' : ''}`}
            >
              Pricing
            </Link>
            <Link
              to="/faq"
              className={`hover:text-zinc-900 transition-colors ${location.pathname === '/faq' ? 'text-zinc-900 font-semibold' : ''}`}
            >
              FAQ
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-medium text-zinc-700 hover:text-zinc-900 px-3 py-2 transition-colors"
            >
              Sign in
            </Link>
            <Button
              asChild
              className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg h-9 px-4 text-xs font-medium transition-all shadow-xs"
            >
              <Link to="/register">Launch your website</Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-zinc-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-zinc-200 px-4 pt-2 pb-6 space-y-3 shadow-lg"
          >
            <Link
              to="/product"
              className="block text-xs font-medium text-zinc-800 py-2 border-b border-zinc-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Product
            </Link>
            <Link
              to="/solutions"
              className="block text-xs font-medium text-zinc-800 py-2 border-b border-zinc-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Solutions
            </Link>
            <Link
              to="/how-it-works"
              className="block text-xs font-medium text-zinc-800 py-2 border-b border-zinc-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              How it Works
            </Link>
            <Link
              to="/pricing"
              className="block text-xs font-medium text-zinc-800 py-2 border-b border-zinc-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              to="/faq"
              className="block text-xs font-medium text-zinc-800 py-2 border-b border-zinc-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                asChild
                variant="outline"
                className="w-full justify-center border-zinc-300 text-zinc-900 rounded-lg h-10 text-xs font-semibold"
              >
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
              </Button>

              <Button
                asChild
                className="w-full justify-center bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-10 text-xs font-semibold"
              >
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  Launch your website
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
