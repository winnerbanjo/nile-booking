import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Globe, Check, Search, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.6, -0.05, 0.01, 0.99] },
  },
};

const glassCardClass = "bg-white/40 backdrop-blur-xl border border-white/40 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]";

export const CustomDomains: React.FC = () => {
  const { user } = useAuth();
  const [domain, setDomain] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const [savedDomain, setSavedDomain] = useState<string | null>(null);
  const [savedSubdomain, setSavedSubdomain] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleCheckDomain = async () => {
    if (!domain) {
      alert('Please enter a domain');
      return;
    }

    setCheckingDomain(true);
    try {
      // Simulate domain check
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // Mock: domains ending in .com are available
      setDomainAvailable(domain.endsWith('.com') || domain.endsWith('.ng'));
    } catch (error) {
      setDomainAvailable(false);
    } finally {
      setCheckingDomain(false);
    }
  };

  const handleSaveDomain = async () => {
    if (!domain) {
      alert('Please enter a domain');
      return;
    }

    if (domainAvailable === false) {
      alert('Domain is not available. Please check another domain.');
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSavedDomain(domain);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      alert('Failed to save domain');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSubdomain = async () => {
    if (!subdomain) {
      alert('Please enter a subdomain');
      return;
    }

    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
    if (!subdomainRegex.test(subdomain)) {
      alert('Invalid subdomain format. Use only lowercase letters, numbers, and hyphens.');
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSavedSubdomain(subdomain);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      alert('Failed to save subdomain');
    } finally {
      setLoading(false);
    }
  };

  const defaultSubdomain = user?.slug || 'username';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] bg-fixed px-6 md:px-8 py-4 md:py-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto space-y-6 md:space-y-8"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Domain Engine
            </h1>
            <p className="text-base text-gray-600 font-light tracking-tight" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Custom domains | Subdomain connection | Web presence
            </p>
          </div>
        </motion.div>

        {/* Check Domain Availability */}
        <motion.div variants={fadeInUp} className={glassCardClass}>
          <div className="p-6 md:p-8">
            <h2 className="text-xl font-black text-gray-900 mb-6 tracking-tighter flex items-center gap-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              <Search className="w-5 h-5" />
              Check Domain Availability
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="domain" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Domain Name
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="domain"
                    type="text"
                    placeholder="example.com"
                    value={domain}
                    onChange={(e) => {
                      setDomain(e.target.value.toLowerCase());
                      setDomainAvailable(null);
                    }}
                    disabled={!!savedDomain}
                    className="flex-1 h-12 rounded-xl border-gray-300 bg-white/60 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                  />
                  <Button
                    onClick={handleCheckDomain}
                    disabled={checkingDomain || !domain || !!savedDomain}
                    className="rounded-full bg-gray-900 text-white hover:bg-gray-800 px-6 h-12 font-semibold"
                  >
                    {checkingDomain ? 'Checking...' : 'Check'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1 font-light">
                  Enter your domain without www or http://
                </p>
              </div>

              {domainAvailable !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border-2 ${
                    domainAvailable
                      ? 'bg-[#22c55e]/10 border-[#22c55e]'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {domainAvailable ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-[#22c55e]" />
                        <span className="text-sm font-semibold text-[#22c55e]">
                          Domain is available!
                        </span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-5 h-5 text-red-500" />
                        <span className="text-sm font-semibold text-red-700">
                          Domain is not available
                        </span>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {savedDomain ? (
                <div className="p-4 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl">
                  <div className="flex items-center gap-2 text-[#22c55e] mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-semibold">Domain configured: {savedDomain}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-light mt-2">
                    Please add the following DNS records to your domain:
                  </p>
                  <div className="mt-2 p-3 bg-white/60 rounded border border-white/40 font-mono text-xs">
                    <div>CNAME: www → nile.ng</div>
                    <div>A Record: @ → 192.0.2.1</div>
                  </div>
                </div>
              ) : (
                domainAvailable && (
                  <Button
                    onClick={handleSaveDomain}
                    disabled={loading}
                    className="w-full rounded-full bg-[#22c55e] text-white hover:bg-green-600 px-6 py-6 h-auto font-semibold"
                  >
                    {loading ? 'Saving...' : 'Save Domain'}
                  </Button>
                )
              )}
            </div>
          </div>
        </motion.div>

        {/* Connect Subdomain */}
        <motion.div variants={fadeInUp} className={glassCardClass}>
          <div className="p-6 md:p-8">
            <h2 className="text-xl font-black text-gray-900 mb-6 tracking-tighter flex items-center gap-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              <LinkIcon className="w-5 h-5" />
              Connect Subdomain
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subdomain" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Subdomain
                </Label>
                <div className="flex items-center">
                  <Input
                    id="subdomain"
                    type="text"
                    placeholder={defaultSubdomain}
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                    disabled={!!savedSubdomain}
                    className="flex-1 h-12 rounded-l-xl rounded-r-none border-gray-300 bg-white/60 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                  />
                  <span className="px-4 py-3 bg-white/40 border border-l-0 border-gray-300 rounded-r-xl text-sm text-gray-600 font-light">
                    .nile.ng
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 font-light">
                  Your website will be available at: {subdomain || defaultSubdomain}.nile.ng
                </p>
              </div>

              {savedSubdomain ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-800 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-semibold">
                      Subdomain active: {savedSubdomain}.nile.ng
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 font-light">
                    Your website is now live at this address!
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleSaveSubdomain}
                  disabled={loading || !subdomain}
                  className="w-full rounded-full bg-[#22c55e] text-white hover:bg-green-600 px-6 py-6 h-auto font-semibold"
                >
                  {loading ? 'Saving...' : 'Assign Subdomain'}
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Auto-Save Toast */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 right-6 bg-[#22c55e] text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 z-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">Saved</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
