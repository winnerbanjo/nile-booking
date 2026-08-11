import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Globe, Link as LinkIcon, CheckCircle2, AlertCircle, ShoppingBag, CreditCard, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authApi, domainApi } from '../lib/api';

export const CustomDomains: React.FC = () => {
  const { user } = useAuth();
  const [domain, setDomain] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Domain Purchase Flow State
  const [purchaseDomainName, setPurchaseDomainName] = useState('');
  const [searchingDomain, setSearchingDomain] = useState(false);
  const [purchaseDomainAvailable, setPurchaseDomainAvailable] = useState<boolean | null>(null);
  const [purchaseDomainPrice, setPurchaseDomainPrice] = useState(15000);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'NG',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      setSubdomain(user.slug || '');
      setDomain(user.customDomain || '');
      // Prefill contact details
      const names = (user.name || '').split(' ');
      setContactInfo({
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || 'Owner',
        address: user.address || '',
        city: user.location || 'Lagos',
        state: 'Lagos',
        postalCode: '100001',
        country: 'NG',
        phone: user.phone || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // Load Paystack script dynamically
  const loadPaystack = () => {
    return new Promise<void>((resolve, reject) => {
      if ((window as any).PaystackPop) {
        resolve();
        return;
      }
      const existing = document.querySelector('script[src*="paystack"]');
      if (existing) {
        // Script already added, wait a moment and check
        setTimeout(() => {
          if ((window as any).PaystackPop) resolve();
          else reject(new Error('Paystack script loaded but PaystackPop not found'));
        }, 1500);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => {
        setTimeout(() => {
          if ((window as any).PaystackPop) resolve();
          else reject(new Error('PaystackPop not initialized after script load'));
        }, 300);
      };
      script.onerror = () => reject(new Error('Failed to load Paystack script. Check internet connection.'));
      document.body.appendChild(script);
    });
  };

  // Format phone number for Namecheap (requires +CountryCode.Number format)
  const formatPhone = (phone: string, country: string) => {
    const digits = phone.replace(/\D/g, '');
    if (phone.startsWith('+') && phone.includes('.')) return phone; // Already formatted
    if (country === 'NG') {
      const local = digits.startsWith('234') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
      return `+234.${local}`;
    }
    return phone.startsWith('+') ? phone.replace('+', '+').replace(' ', '.') : `+${digits}`;
  };

  const handleCheckDomain = async () => {
    if (!domain) return;
    setCheckingDomain(true);
    setErrorMsg(null);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setDomainAvailable(domain.endsWith('.com') || domain.endsWith('.ng') || domain.endsWith('.co') || domain.endsWith('.com.ng'));
    } catch (error) {
      setDomainAvailable(false);
    } finally {
      setCheckingDomain(false);
    }
  };

  const handleSearchPurchaseDomain = async () => {
    if (!purchaseDomainName) return;
    let queryDomain = purchaseDomainName.trim();
    if (!queryDomain.includes('.')) {
      queryDomain = `${queryDomain}.com`;
      setPurchaseDomainName(queryDomain);
    }
    setSearchingDomain(true);
    setPurchaseDomainAvailable(null);
    setErrorMsg(null);
    try {
      const res = await domainApi.checkAvailability(queryDomain);
      setPurchaseDomainAvailable(res.available);
      if (res.priceNGN) {
        setPurchaseDomainPrice(res.priceNGN);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error checking domain availability');
    } finally {
      setSearchingDomain(false);
    }
  };

  const handlePurchaseDomain = async () => {
    if (!purchaseDomainName || purchaseDomainAvailable === false) return;
    setPaying(true);
    setPaymentStatus('Initializing Paystack Secure Checkout...');
    setErrorMsg(null);

    // Auto-format phone for Namecheap before submitting
    const formattedPhone = formatPhone(contactInfo.phone, contactInfo.country);
    const finalContactInfo = { ...contactInfo, phone: formattedPhone };

    try {
      await loadPaystack();

      if (!(window as any).PaystackPop) {
        throw new Error('Paystack gateway not ready. Please refresh and try again.');
      }

      const handler = (window as any).PaystackPop.setup({
        key: 'pk_live_8a8770480c060bf0555068a2799f96aecbdda177',
        email: finalContactInfo.email || user?.email || 'merchant@nile.ng',
        amount: purchaseDomainPrice * 100, // Dynamic NGN price in kobo
        currency: 'NGN',
        ref: `nile_dom_${Date.now()}`,
        metadata: {
          custom_fields: [
            { display_name: 'Domain', variable_name: 'domain', value: purchaseDomainName },
          ],
        },
        callback: async (response: any) => {
          const reference = response.reference;
          setPaymentStatus('Payment confirmed! Registering domain on Namecheap...');
          try {
            const result = await domainApi.purchase({
              domain: purchaseDomainName,
              reference,
              contactInfo: finalContactInfo,
            });
            if (result.success) {
              if (result.user) {
                localStorage.setItem('nile_user', JSON.stringify(result.user));
              }
              setShowToast(true);
              setShowPurchaseModal(false);
              setTimeout(() => {
                setShowToast(false);
                window.location.reload();
              }, 1500);
            }
          } catch (err: any) {
            setErrorMsg(err.message || 'Domain registration failed. Please contact support.');
          } finally {
            setPaying(false);
            setPaymentStatus('');
          }
        },
        onClose: () => {
          setPaying(false);
          setPaymentStatus('');
          setErrorMsg('Payment window closed. No charge was made.');
        }
      });
      handler.openIframe();
    } catch (e: any) {
      console.error('[PAYSTACK_INIT_ERROR]', e);
      setPaying(false);
      setPaymentStatus('');
      setErrorMsg(e?.message || 'Failed to initialize payment gateway. Please try again.');
    }
  };

  const handleSaveDomain = async () => {
    if (!domain || domainAvailable === false) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const updated = await authApi.updateProfile({ customDomain: domain });
      if (updated) {
        localStorage.setItem('nile_user', JSON.stringify(updated));
      }
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to connect domain');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectDomain = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const updated = await authApi.updateProfile({ customDomain: '' });
      if (updated) {
        localStorage.setItem('nile_user', JSON.stringify(updated));
        setDomain('');
        setDomainAvailable(null);
      }
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to disconnect domain');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSubdomain = async () => {
    if (!subdomain) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const updated = await authApi.updateProfile({ slug: subdomain });
      if (updated) {
        localStorage.setItem('nile_user', JSON.stringify(updated));
      }
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to update subdomain');
    } finally {
      setLoading(false);
    }
  };

  const defaultSubdomain = user?.slug || '';

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-zinc-200/80 pb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight">
            Domains & Branding
          </h1>
          <p className="text-sm text-zinc-500 mt-1 font-normal">
            Configure custom domain names, purchase new domains, and manage your public merchant slug
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

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
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                className="flex-1 h-9 rounded-l-lg rounded-r-none border-zinc-300 text-xs"
              />
              <span className="h-9 px-3 bg-zinc-100 border border-l-0 border-zinc-300 rounded-r-lg text-xs text-zinc-600 font-mono flex items-center">
                .nilebooking.co
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-normal">
              Your default store address: <span className="font-mono text-zinc-700">{subdomain || defaultSubdomain}.nilebooking.co</span>
            </p>

            <Button
              onClick={handleSaveSubdomain}
              disabled={loading || !subdomain || subdomain === user?.slug}
              className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 px-4 text-xs font-medium shadow-sm"
            >
              {loading ? 'Saving...' : 'Update Subdomain'}
            </Button>
          </div>
        </div>

        {/* Register & Buy New Custom Domain Card */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <ShoppingBag className="w-4 h-4 text-zinc-700" />
            <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
              Register & Buy a New Custom Domain
            </h2>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium text-zinc-700 block">Search Domain</Label>
            <div className="flex gap-2.5">
              <Input
                type="text"
                placeholder="mybarbershop.com"
                value={purchaseDomainName}
                onChange={(e) => {
                  setPurchaseDomainName(e.target.value.toLowerCase().replace(/\s/g, ''));
                  setPurchaseDomainAvailable(null);
                }}
                className="flex-1 h-9 text-xs border-zinc-300"
              />
              <Button
                onClick={handleSearchPurchaseDomain}
                disabled={searchingDomain || !purchaseDomainName}
                className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 px-4 text-xs font-medium shadow-sm"
              >
                {searchingDomain ? 'Searching...' : 'Search Availability'}
              </Button>
            </div>

            {purchaseDomainAvailable !== null && (
              <div className={`p-4 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                purchaseDomainAvailable
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50/50 border-red-200 text-red-700'
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${purchaseDomainAvailable ? 'text-emerald-600' : 'text-red-500'}`} />
                  <div>
                    <span className="font-semibold">{purchaseDomainName}</span> is{' '}
                    {purchaseDomainAvailable ? 'available for registration!' : 'already taken or unavailable.'}
                    {purchaseDomainAvailable && (
                      <p className="text-[10px] text-zinc-500 font-normal mt-0.5">Price: ₦{purchaseDomainPrice.toLocaleString()} NGN / Year (incl. DNS setup)</p>
                    )}
                  </div>
                </div>
                {purchaseDomainAvailable && (
                  <Button
                    size="sm"
                    onClick={() => setShowPurchaseModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 h-8 rounded-lg font-medium shadow-sm shrink-0"
                  >
                    Buy & Setup
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Existing Custom Domain Connection (Nameservers Mapping) */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Globe className="w-4 h-4 text-zinc-700" />
            <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
              Connect Existing Custom Domain (.com / .ng)
            </h2>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium text-zinc-700 block">Existing Domain</Label>
            <div className="flex gap-2.5">
              <Input
                type="text"
                placeholder="mybarbershop.com"
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value.toLowerCase());
                  setDomainAvailable(null);
                }}
                className="flex-1 h-9 text-xs border-zinc-300"
              />
              <Button
                onClick={handleCheckDomain}
                disabled={checkingDomain || !domain}
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
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{domainAvailable ? `Domain ${domain} is available for mapping!` : `Domain ${domain} is invalid or unsupported.`}</span>
              </div>
            )}

            {user?.customDomain ? (
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2 text-xs">
                <div className="font-semibold text-zinc-900 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Custom Domain Mapped: {user.customDomain}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDisconnectDomain}
                    disabled={loading}
                    className="h-7 text-[10px] bg-white border-red-200 text-red-700 hover:bg-red-50 px-2.5"
                  >
                    Disconnect
                  </Button>
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

        {/* Purchase Checkout Form Modal */}
        {showPurchaseModal && (
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white border border-zinc-200 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl my-8">
              <div>
                <h3 className="text-base font-semibold text-zinc-950">Domain Registrant details</h3>
                <p className="text-xs text-zinc-500 font-normal mt-0.5">Required details to register your custom domain name officially</p>
              </div>

              <div className="grid grid-cols-2 gap-3.5 text-xs">
                <div>
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">First Name</Label>
                  <Input
                    value={contactInfo.firstName}
                    onChange={(e) => setContactInfo({ ...contactInfo, firstName: e.target.value })}
                    placeholder="Adeola"
                    className="h-9 border-zinc-300 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">Last Name</Label>
                  <Input
                    value={contactInfo.lastName}
                    onChange={(e) => setContactInfo({ ...contactInfo, lastName: e.target.value })}
                    placeholder="Johnson"
                    className="h-9 border-zinc-300 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">Street Address</Label>
                  <Input
                    value={contactInfo.address}
                    onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                    placeholder="30 Ikoyi Road"
                    className="h-9 border-zinc-300 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">City</Label>
                  <Input
                    value={contactInfo.city}
                    onChange={(e) => setContactInfo({ ...contactInfo, city: e.target.value })}
                    placeholder="Ikoyi"
                    className="h-9 border-zinc-300 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">State / Region</Label>
                  <Input
                    value={contactInfo.state}
                    onChange={(e) => setContactInfo({ ...contactInfo, state: e.target.value })}
                    placeholder="Lagos"
                    className="h-9 border-zinc-300 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">Postal Code</Label>
                  <Input
                    value={contactInfo.postalCode}
                    onChange={(e) => setContactInfo({ ...contactInfo, postalCode: e.target.value })}
                    placeholder="100001"
                    className="h-9 border-zinc-300 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">Country Code (2 Letters)</Label>
                  <Input
                    value={contactInfo.country}
                    onChange={(e) => setContactInfo({ ...contactInfo, country: e.target.value.toUpperCase() })}
                    placeholder="NG"
                    maxLength={2}
                    className="h-9 border-zinc-300 text-xs font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">Registrant Phone (+CountryCode.Number)</Label>
                  <Input
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    placeholder="+234.8123456789"
                    className="h-9 border-zinc-300 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">Registrant Email</Label>
                  <Input
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    placeholder="adeola@gmail.com"
                    className="h-9 border-zinc-300 text-xs"
                  />
                </div>
              </div>

              {paymentStatus && (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 flex items-center gap-2 font-medium">
                  <div className="w-3.5 h-3.5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin shrink-0"></div>
                  <span>{paymentStatus}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2.5 border-t border-zinc-100 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowPurchaseModal(false)}
                  disabled={paying}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePurchaseDomain}
                  disabled={paying || !contactInfo.firstName || !contactInfo.lastName || !contactInfo.address || !contactInfo.phone || !contactInfo.email}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₦{purchaseDomainPrice.toLocaleString()} via Paystack</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Save Toast */}
        {showToast && (
          <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-3.5 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-xs font-medium z-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Domain Registered Successfully!</span>
          </div>
        )}

      </div>
    </div>
  );
};
