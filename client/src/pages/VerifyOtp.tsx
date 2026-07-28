import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi, serviceApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { NileLogo } from '../components/ui/NileLogo';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  ArrowRight, RefreshCw, CheckCircle2, PartyPopper, ExternalLink,
  Copy, Check, Globe, Star, Clock, MapPin, ChevronDown, CheckCircle, Circle, Plus
} from 'lucide-react';

type Phase = 'verify' | 'website' | 'service' | 'complete';

const DURATION_OPTIONS = [
  { label: '15 minutes', value: 0.25 },
  { label: '30 minutes', value: 0.5 },
  { label: '45 minutes', value: 0.75 },
  { label: '1 hour', value: 1 },
  { label: '1 hour 30 min', value: 1.5 },
  { label: '2 hours', value: 2 },
  { label: '3 hours', value: 3 },
];

const LOCATION_TYPES = [
  { id: 'at_business', label: 'At my location' },
  { id: 'at_customer', label: "At customer's location" },
  { id: 'online', label: 'Online' },
  { id: 'multiple', label: 'Multiple locations' },
];

// Progress step indicator shown during onboarding phases
function OnboardingProgress({ phase }: { phase: Phase }) {
  const steps = [
    { key: 'account', label: 'Account', done: true },
    { key: 'business', label: 'Business', done: true },
    { key: 'booking', label: 'Booking', done: true },
    { key: 'payout', label: 'Payout', done: true },
    { key: 'website', label: 'Website', done: phase === 'service' || phase === 'complete' },
    { key: 'service', label: 'First Service', done: phase === 'complete', optional: true },
  ];

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap mb-6">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${
              s.done ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
            }`}>
              {s.done ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <span className={`text-[9px] mt-0.5 font-medium ${s.done ? 'text-emerald-600' : 'text-zinc-400'}`}>
              {s.label}{s.optional ? ' *' : ''}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-4 mb-4 ${s.done ? 'bg-emerald-400' : 'bg-zinc-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export const VerifyOtp: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login: setAuthUser } = useAuth();

  const initialEmail = location.state?.email || sessionStorage.getItem('nile_pending_email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resending, setResending] = useState(false);

  // Onboarding phase state
  const [phase, setPhase] = useState<Phase>('verify');
  const [verifiedUser, setVerifiedUser] = useState<any>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  const [serviceSkipped, setServiceSkipped] = useState(false);

  // Service creation state
  const [serviceData, setServiceData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    duration: '',
    locationType: 'at_business',
  });
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceError, setServiceError] = useState('');

  // --- OTP HANDLERS ---
  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.value !== '' && element.nextElementSibling) {
      (element.nextElementSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const inputs = document.querySelectorAll<HTMLInputElement>('.otp-input');
      if (inputs[index - 1]) inputs[index - 1].focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) { setError('Please enter your work email address.'); return; }
    const otpCode = otp.join('');
    if (otpCode.length !== 6) { setError('Please enter all 6 digits of your verification code.'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await authApi.verifyOtp(email, otpCode);
      if (res.data && res.data.token) {
        setAuthUser(res.data);
        sessionStorage.removeItem('nile_pending_email');
        setVerifiedUser(res.data);
        setPhase('website');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Please check the 6-digit code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) { setError('Please enter your email to resend the code.'); return; }
    setResending(true);
    setError('');
    setSuccessMsg('');
    try {
      await authApi.resendOtp(email);
      setSuccessMsg('New verification code sent to your email!');
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // --- WEBSITE PHASE HANDLERS ---
  const websiteUrl = verifiedUser ? `${verifiedUser.slug}.nilebooking.co` : '';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`https://${websiteUrl}`);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const markSkipped = async () => {
    try {
      await authApi.updateOnboarding({ firstServiceSkipped: true, onboardingCompleted: true });
    } catch {
      // Non-blocking — continue regardless
    }
  };

  const markServiceAdded = async () => {
    try {
      await authApi.updateOnboarding({ firstServiceAdded: true, onboardingCompleted: true });
    } catch {
      // Non-blocking
    }
  };

  const handleSkipService = async () => {
    setServiceSkipped(true);
    await markSkipped();
    setPhase('complete');
  };

  // --- SERVICE CREATION HANDLERS ---
  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setServiceData({ ...serviceData, [e.target.name]: e.target.value });
    setServiceError('');
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setServiceError('');

    if (!serviceData.name.trim()) { setServiceError('Enter a name for your service.'); return; }
    if (!serviceData.price || isNaN(Number(serviceData.price)) || Number(serviceData.price) < 0) {
      setServiceError('Enter a valid price for this service.'); return;
    }
    if (!serviceData.duration) { setServiceError('Select how long this service usually takes.'); return; }

    setServiceLoading(true);
    try {
      await serviceApi.createService({
        name: serviceData.name.trim(),
        description: serviceData.description.trim() || `${serviceData.name} service`,
        category: serviceData.category.trim() || 'other',
        price: Number(serviceData.price),
        duration: Number(serviceData.duration),
        location: { name: serviceData.locationType },
      });
      await markServiceAdded();
      setServiceSkipped(false);
      setPhase('complete');
    } catch (err: any) {
      setServiceError(err.response?.data?.message || "We couldn't save your service right now. Please try again.");
    } finally {
      setServiceLoading(false);
    }
  };

  // ─── RENDER: VERIFY PHASE ───────────────────────────────────────────────────
  if (phase === 'verify') {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-zinc-900">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
          <div className="flex justify-center"><NileLogo size="lg" /></div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Verify Your Email</h2>
          <p className="text-xs text-zinc-500 font-normal max-w-xs mx-auto">
            Enter the 6-digit verification code we sent to your email
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-xl border border-zinc-200/80 rounded-2xl space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /><span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-zinc-700">Work Email</label>
                  <button type="button" onClick={() => navigate('/register')} className="text-[10px] text-zinc-500 hover:text-zinc-900 hover:underline">
                    Change email?
                  </button>
                </div>
                <Input type="email" value={email} disabled className="h-9 text-xs border-zinc-300 rounded-lg bg-zinc-50 text-zinc-500 cursor-not-allowed" />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 mb-2 block">6-Digit Verification Code</label>
                <div className="flex justify-between gap-2">
                  {otp.map((data, index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={data}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="otp-input w-11 h-12 text-center text-lg font-bold text-zinc-900 bg-gray-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || otp.join('').length !== 6 || !email}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-11 text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying...' : <><span>Complete Account Setup</span><ArrowRight className="w-4 h-4" /></>}
              </Button>
            </form>

            <div className="text-center pt-2 border-t border-zinc-100 space-y-2">
              <p className="text-xs text-zinc-500 font-normal">Didn't receive the code? Check your inbox or spam.</p>
              <button
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: WEBSITE GENERATED PHASE ────────────────────────────────────────
  if (phase === 'website') {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-zinc-900">
        <div className="sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="bg-white py-10 px-8 shadow-2xl border border-zinc-200 rounded-3xl space-y-6">

            <OnboardingProgress phase="website" />

            {/* Celebration header */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <PartyPopper className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">
                Your website is ready 🎉
              </h2>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-sm mx-auto">
                Your Nile Booking website has been created successfully. You can start sharing your link after adding your services and availability.
              </p>
            </div>

            {/* Website preview card */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {verifiedUser?.businessName?.charAt(0) || 'N'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{verifiedUser?.businessName || verifiedUser?.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] text-emerald-600 font-medium">Live</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2.5">
                <Globe className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                <span className="text-xs text-emerald-600 font-medium flex-1 truncate">{websiteUrl}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyUrl}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-colors"
                >
                  {urlCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {urlCopied ? 'Copied!' : 'Copy Link'}
                </button>
                <a
                  href={`https://${websiteUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Website
                </a>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2.5 pt-1">
              <Button
                onClick={() => setPhase('service')}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-11 text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Your First Service
                <ArrowRight className="w-4 h-4" />
              </Button>
              <button
                onClick={handleSkipService}
                className="w-full text-xs text-zinc-500 hover:text-zinc-700 py-2 font-medium hover:underline transition-colors"
              >
                Skip for Now
              </button>
            </div>

            <p className="text-center text-[10px] text-zinc-400">
              * Optional — you can add services anytime from your dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: ADD FIRST SERVICE PHASE ────────────────────────────────────────
  if (phase === 'service') {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-zinc-900">
        <div className="sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="bg-white py-8 px-8 shadow-xl border border-zinc-200/80 rounded-3xl space-y-6">

            <OnboardingProgress phase="service" />

            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-zinc-600" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 mb-1">Add your first service</h2>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Tell customers what they can book and how much it costs. You can add more services later from your dashboard.
              </p>
              <p className="text-[10px] text-zinc-400 mt-1 font-medium">Step 6 of 6 · Optional</p>
            </div>

            {serviceError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-xs font-medium">
                {serviceError}
              </div>
            )}

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-zinc-700 mb-1 block">Service Name *</Label>
                <Input
                  name="name"
                  value={serviceData.name}
                  onChange={handleServiceChange}
                  placeholder="e.g. Bridal Makeup"
                  className="h-9 text-xs border-zinc-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">Category</Label>
                  <Input
                    name="category"
                    value={serviceData.category}
                    onChange={handleServiceChange}
                    placeholder="e.g. Hair Care"
                    className="h-9 text-xs border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">Price *</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500">₦</span>
                    <Input
                      name="price"
                      type="number"
                      min="0"
                      value={serviceData.price}
                      onChange={handleServiceChange}
                      placeholder="5000"
                      className="h-9 text-xs border-zinc-300 rounded-lg pl-6"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-zinc-700 mb-1 block">Description</Label>
                <textarea
                  name="description"
                  value={serviceData.description}
                  onChange={handleServiceChange}
                  placeholder="Briefly explain what is included in this service."
                  rows={2}
                  className="w-full text-xs border border-zinc-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">Duration *</Label>
                  <div className="relative">
                    <select
                      name="duration"
                      value={serviceData.duration}
                      onChange={handleServiceChange}
                      className="h-9 text-xs w-full border border-zinc-300 rounded-lg bg-white px-2.5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 appearance-none"
                    >
                      <option value="">Select duration</option>
                      {DURATION_OPTIONS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">Location Type</Label>
                  <div className="relative">
                    <select
                      name="locationType"
                      value={serviceData.locationType}
                      onChange={handleServiceChange}
                      className="h-9 text-xs w-full border border-zinc-300 rounded-lg bg-white px-2.5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 appearance-none"
                    >
                      {LOCATION_TYPES.map((lt) => (
                        <option key={lt.id} value={lt.id}>{lt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPhase('website')}
                  className="px-4 h-10 border border-zinc-200 text-zinc-600 rounded-xl text-xs font-medium hover:bg-zinc-50 transition-colors"
                >
                  Back
                </button>
                <Button
                  type="submit"
                  disabled={serviceLoading}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-10 text-xs font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {serviceLoading ? 'Saving your first service...' : (
                    <><span>Save Service & Continue</span><ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </Button>
              </div>
            </form>

            <button
              onClick={handleSkipService}
              disabled={serviceLoading}
              className="w-full text-xs text-zinc-400 hover:text-zinc-600 py-1 font-medium hover:underline transition-colors disabled:opacity-50"
            >
              Skip for Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: SETUP COMPLETE PHASE ────────────────────────────────────────────
  const checklist = [
    { label: 'Merchant account created', done: true },
    { label: 'Email verified', done: true },
    { label: 'Website generated', done: true },
    { label: 'Payout details added', done: !!verifiedUser?.bankAccount?.bankName },
    { label: 'First service added', done: !serviceSkipped },
    { label: 'Availability configured', done: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-zinc-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-10 px-8 shadow-2xl border border-zinc-200 rounded-3xl space-y-6">

          <OnboardingProgress phase="complete" />

          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">
              You're ready to get started 🚀
            </h2>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-sm mx-auto">
              {!serviceSkipped
                ? 'Your website is live and your first service is ready for bookings.'
                : 'Your website is ready. Add a service and set your availability before sharing your booking link.'}
            </p>
          </div>

          {/* Setup checklist */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-2.5">
            <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mb-3">
              Setup Checklist · {checklist.filter((c) => c.done).length} of {checklist.length} completed
            </p>
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                {item.done ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-zinc-300 flex-shrink-0" />
                )}
                <span className={`text-xs ${item.done ? 'text-zinc-700 font-medium' : 'text-zinc-400'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="space-y-2.5">
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-11 text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
            >
              Go to Merchant Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
            <a
              href={`https://${websiteUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-zinc-600 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              View Website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
