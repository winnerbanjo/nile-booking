import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Globe, Search, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
    if (!domain) return;
    setCheckingDomain(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setDomainAvailable(domain.endsWith('.com') || domain.endsWith('.ng') || domain.endsWith('.co'));
    } catch (error) {
      setDomainAvailable(false);
    } finally {
      setCheckingDomain(false);
    }
  };

  const handleSaveDomain = async () => {
    if (!domain || domainAvailable === false) return;
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
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
    if (!subdomain) return;
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setSavedSubdomain(subdomain);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      alert('Failed to save subdomain');
    } finally {
      setLoading(false);
    }
  };

  const defaultSubdomain = user?.slug || 'the-modern-barber';

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-zinc-200/80 pb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight">
            Domains & Branding
          </h1>
          <p className="text-sm text-zinc-500 mt-1 font-normal">
            Configure custom domain names and manage your public merchant slug
          </p>
        </div>

        {/* Free Subdomain Card */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <LinkIcon className="w-4 h-4 text-zinc-700" />
            <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
              Instant Merchant Subdomain
            </h2>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium text-zinc-700 block">Subdomain Address</Label>
            <div className="flex items-center">
              <Input
                type="text"
                placeholder={defaultSubdomain}
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                disabled={!!savedSubdomain}
                className="flex-1 h-9 rounded-l-lg rounded-r-none border-zinc-300 text-xs"
              />
              <span className="h-9 px-3 bg-zinc-100 border border-l-0 border-zinc-300 rounded-r-lg text-xs text-zinc-600 font-mono flex items-center">
                .nilebooking.co
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-normal">
              Your default store address: <span className="font-mono text-zinc-700">{subdomain || defaultSubdomain}.nilebooking.co</span>
            </p>

            {savedSubdomain ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Active: {savedSubdomain}.nilebooking.co</span>
              </div>
            ) : (
              <Button
                onClick={handleSaveSubdomain}
                disabled={loading || !subdomain}
                className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 px-4 text-xs font-medium shadow-sm"
              >
                {loading ? 'Saving...' : 'Update Subdomain'}
              </Button>
            )}
          </div>
        </div>

        {/* Custom Domain Lookup */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Globe className="w-4 h-4 text-zinc-700" />
            <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
              Connect Custom Domain (.com / .ng)
            </h2>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium text-zinc-700 block">Custom Domain</Label>
            <div className="flex gap-2.5">
              <Input
                type="text"
                placeholder="mybarbershop.com"
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value.toLowerCase());
                  setDomainAvailable(null);
                }}
                disabled={!!savedDomain}
                className="flex-1 h-9 text-xs border-zinc-300"
              />
              <Button
                onClick={handleCheckDomain}
                disabled={checkingDomain || !domain || !!savedDomain}
                className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 px-4 text-xs font-medium shadow-sm"
              >
                {checkingDomain ? 'Checking...' : 'Check Availability'}
              </Button>
            </div>

            {domainAvailable !== null && (
              <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                domainAvailable
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <CheckCircle2 className="w-4 h-4" />
                <span>{domainAvailable ? `Domain ${domain} is available for mapping!` : `Domain ${domain} is unavailable.`}</span>
              </div>
            )}

            {savedDomain ? (
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2 text-xs">
                <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Custom Domain Mapped: {savedDomain}
                </div>
                <p className="text-zinc-500 font-normal">Add these DNS records at your domain registrar (Namecheap/GoDaddy):</p>
                <div className="bg-white border border-zinc-200 p-2.5 rounded font-mono text-[11px] space-y-1">
                  <div>CNAME Record: www &rarr; nilebooking.co</div>
                  <div>A Record: @ &rarr; 76.76.21.21</div>
                </div>
              </div>
            ) : (
              domainAvailable && (
                <Button
                  onClick={handleSaveDomain}
                  disabled={loading}
                  className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 px-4 text-xs font-medium shadow-sm"
                >
                  {loading ? 'Saving...' : 'Connect Domain'}
                </Button>
              )
            )}
          </div>
        </div>

        {/* Auto-Save Toast */}
        {showToast && (
          <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-3.5 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-xs font-medium z-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Domain Settings Updated</span>
          </div>
        )}

      </div>
    </div>
  );
};
