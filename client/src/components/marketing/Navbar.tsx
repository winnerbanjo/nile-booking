import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MegaMenu } from './MegaMenu';
import { CurrencySwitcher } from '../CurrencySwitcher';
import { NileLogo } from '../ui/NileLogo';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [solutionsMenuOpen, setSolutionsMenuOpen] = useState(false);
  const location = useLocation();
  const productMenuRef = useRef<HTMLDivElement>(null);
  const solutionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productMenuRef.current && !productMenuRef.current.contains(event.target as Node)) {
        setProductMenuOpen(false);
      }
      if (solutionsMenuRef.current && !solutionsMenuRef.current.contains(event.target as Node)) {
        setSolutionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className={`sticky top-0 left-0 right-0 relative z-[100] transition-all duration-300 backdrop-blur-md border-b border-white/10 ${
        scrolled ? 'bg-white/80' : 'bg-white/50'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <NileLogo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {/* Product Mega Menu */}
            <div ref={productMenuRef} className="relative">
              <button
                onMouseEnter={() => setProductMenuOpen(true)}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
              >
                Product
                <ChevronDown className="w-4 h-4" />
              </button>
              <MegaMenu
                isOpen={productMenuOpen}
                onClose={() => setProductMenuOpen(false)}
                type="product"
              />
            </div>

            {/* Solutions Mega Menu */}
            <div ref={solutionsMenuRef} className="relative">
              <button
                onMouseEnter={() => setSolutionsMenuOpen(true)}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
              >
                Solutions
                <ChevronDown className="w-4 h-4" />
              </button>
              <MegaMenu
                isOpen={solutionsMenuOpen}
                onClose={() => setSolutionsMenuOpen(false)}
                type="solutions"
              />
            </div>

            {/* Other Links */}
            <a
              href="#how-it-works"
              onClick={(e) => handleNavClick('#how-it-works', e)}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
            >
              How it Works
            </a>
            <Link
              to="/pricing"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/pricing'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
            >
              Pricing
            </Link>
            <a
              href="#enterprise"
              onClick={(e) => handleNavClick('#enterprise', e)}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
            >
              Enterprise
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <CurrencySwitcher />
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              style={{ willChange: 'transform' }}
            >
              <Link
                to="/login"
                className="text-sm font-medium text-[#22c55e] hover:text-green-600 transition-colors"
                style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
              >
                Sign in
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              style={{ willChange: 'transform' }}
            >
              <Button
                className="rounded-full bg-[#22c55e] text-white hover:bg-green-600 h-auto px-6 py-2"
                asChild
              >
                <Link to="/register">Get Started</Link>
              </Button>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 min-h-[48px] min-w-[48px]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-900" />
            ) : (
              <Menu className="h-6 w-6 text-gray-900" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu - Bottom Sheet Style */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md bg-white/90 border-t border-[#E4E4E7] rounded-t-[24px]"
              style={{ willChange: 'transform' }}
            >
              <div className="flex items-center justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>
              <div className="px-4 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                <Link
                  to="/product"
                  className="block text-base font-medium text-gray-900 min-h-[48px] flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                >
                  Product
                </Link>
                <Link
                  to="/solutions"
                  className="block text-base font-medium text-gray-900 min-h-[48px] flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                >
                  Solutions
                </Link>
                <a
                  href="#how-it-works"
                  onClick={(e) => {
                    handleNavClick('#how-it-works', e);
                    setMobileMenuOpen(false);
                  }}
                  className="block text-base font-medium text-gray-900 min-h-[48px] flex items-center"
                  style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                >
                  How it Works
                </a>
                <Link
                  to="/pricing"
                  className="block text-base font-medium text-gray-900 min-h-[48px] flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                >
                  Pricing
                </Link>
                <a
                  href="#enterprise"
                  onClick={(e) => {
                    handleNavClick('#enterprise', e);
                    setMobileMenuOpen(false);
                  }}
                  className="block text-base font-medium text-gray-900 min-h-[48px] flex items-center"
                  style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                >
                  Enterprise
                </a>
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    style={{ willChange: 'transform' }}
                  >
                    <Link
                      to="/login"
                      className="block text-base font-medium text-[#22c55e] hover:text-green-600 min-h-[48px] flex items-center transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                    >
                      Sign in
                    </Link>
                  </motion.div>
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    style={{ willChange: 'transform' }}
                  >
                    <Button
                      className="w-full rounded-full bg-[#22c55e] text-white hover:bg-green-600 h-12 min-h-[48px]"
                      asChild
                    >
                      <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                        Get Started
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
