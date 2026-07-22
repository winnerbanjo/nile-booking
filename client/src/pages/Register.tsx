import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { NileLogo } from '../components/ui/NileLogo';
import { ArrowRight, ArrowLeft, Eye, EyeOff, Scissors, Dumbbell, Sparkles, Briefcase, LayoutGrid } from 'lucide-react';

const INDUSTRIES = [
  { id: 'barber', label: 'Barbers & Stylists', icon: Scissors },
  { id: 'fitness', label: 'Fitness & Wellness', icon: Dumbbell },
  { id: 'beauty', label: 'Beauty & Spa', icon: Sparkles },
  { id: 'professional', label: 'Professional Services', icon: Briefcase },
  { id: 'other', label: 'Other', icon: LayoutGrid },
];

export const Register: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    phone: '',
    country: 'Nigeria',
    industry: '',
    slug: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Auto-generate slug
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]/g, '-');
    setFormData({ ...formData, businessName: val, slug: autoSlug });
    setError('');
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all required fields.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match. Please try again.');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.industry) {
        setError('Please select an industry to continue.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!formData.businessName || !formData.country || !formData.slug) {
        setError('Please fill in required business details, including your Storefront URL.');
        return;
      }
      setStep(4);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.bankName || !formData.accountName || !formData.accountNumber) {
      setError('Please fill in your account details to receive payouts.');
      return;
    }

    setLoading(true);

    try {
      await authApi.register(formData);
      sessionStorage.setItem('nile_pending_email', formData.email.trim().toLowerCase());
      navigate('/verify-otp', { state: { email: formData.email.trim().toLowerCase() } });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex justify-center mb-1">
            <NileLogo size="md" />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
            {step === 1 && 'Create Merchant Account'}
            {step === 2 && 'What do you do?'}
            {step === 3 && 'Business Details'}
            {step === 4 && 'Payout Details'}
          </h1>
          <p className="text-xs text-zinc-500 font-normal">
            {step === 1 && 'Step 1 of 4: Account Basics'}
            {step === 2 && 'Step 2 of 4: Select Industry'}
            {step === 3 && 'Step 3 of 4: Storefront Setup'}
            {step === 4 && 'Step 4 of 4: Get Paid'}
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-6 sm:p-8 shadow-sm space-y-5">
          <form onSubmit={step === 4 ? handleSubmit : handleNextStep} className="space-y-4">
            
            {/* Progress Bar */}
            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${step >= i ? 'bg-zinc-900' : 'bg-zinc-100'}`} />
              ))}
            </div>

            {error && (
              <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg font-medium">
                {error}
              </div>
            )}

            {/* STEP 1: Account Basics */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <Label htmlFor="name" className="text-xs font-medium text-zinc-700 mb-1 block">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Adeola Johnson"
                    value={formData.name}
                    onChange={handleChange}
                    className="h-9 text-xs border-zinc-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs font-medium text-zinc-700 mb-1 block">Work Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="barber@nile.ng"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-9 text-xs border-zinc-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-xs font-medium text-zinc-700 mb-1 block">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      className="h-9 text-xs border-zinc-300 rounded-lg pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-xs font-medium text-zinc-700 mb-1 block">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Retype password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="h-9 text-xs border-zinc-300 rounded-lg pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Industry Selection */}
            {step === 2 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 gap-3">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, industry: ind.id });
                        setError('');
                      }}
                      className={`flex items-center gap-3 p-3.5 border rounded-xl transition-all ${
                        formData.industry === ind.id 
                          ? 'border-zinc-900 bg-zinc-900 text-white ring-2 ring-zinc-900/20' 
                          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${formData.industry === ind.id ? 'bg-white/10' : 'bg-zinc-100'}`}>
                        <ind.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">{ind.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Business Details */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <Label htmlFor="businessName" className="text-xs font-medium text-zinc-700 mb-1 block">Business Name</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    type="text"
                    placeholder="The Modern Barber"
                    value={formData.businessName}
                    onChange={handleBusinessNameChange}
                    className="h-9 text-xs border-zinc-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug" className="text-xs font-medium text-zinc-700 mb-1 block">Storefront URL</Label>
                  <div className="flex rounded-lg shadow-sm">
                    <Input
                      id="slug"
                      name="slug"
                      type="text"
                      placeholder="the-modern-barber"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className="h-9 text-xs border-zinc-300 rounded-r-none rounded-l-lg flex-1 focus:z-10"
                      required
                    />
                    <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-zinc-300 bg-zinc-50 text-zinc-500 sm:text-xs">
                      .nilebooking.co
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">This is where clients will go to book you.</p>
                </div>

                <div>
                  <Label htmlFor="country" className="text-xs font-medium text-zinc-700 mb-1 block">Country</Label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="h-9 text-xs w-full border border-zinc-300 rounded-lg bg-white px-2.5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="Nigeria">Nigeria 🇳🇬</option>
                    <option value="Ghana">Ghana 🇬🇭</option>
                    <option value="Kenya">Kenya 🇰🇪</option>
                    <option value="United Kingdom">United Kingdom 🇬🇧</option>
                    <option value="United States">United States 🇺🇸</option>
                    <option value="South Africa">South Africa 🇿🇦</option>
                    <option value="Canada">Canada 🇨🇦</option>
                    <option value="UAE">UAE 🇦🇪</option>
                    <option value="International">International 🌍</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-xs font-medium text-zinc-700 mb-1 block">WhatsApp Phone (Optional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+234 812 345 6789"
                    value={formData.phone}
                    onChange={handleChange}
                    className="h-9 text-xs border-zinc-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: Account Details */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-emerald-800 text-xs font-medium mb-4">
                  We need this to settle your earnings from customer bookings.
                </div>
                
                <div>
                  <Label htmlFor="bankName" className="text-xs font-medium text-zinc-700 mb-1 block">Bank Name</Label>
                  <Input
                    id="bankName"
                    name="bankName"
                    type="text"
                    placeholder="e.g. Guarantee Trust Bank"
                    value={formData.bankName}
                    onChange={handleChange}
                    className="h-9 text-xs border-zinc-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="accountNumber" className="text-xs font-medium text-zinc-700 mb-1 block">Account Number</Label>
                  <Input
                    id="accountNumber"
                    name="accountNumber"
                    type="text"
                    placeholder="0123456789"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    className="h-9 text-xs border-zinc-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="accountName" className="text-xs font-medium text-zinc-700 mb-1 block">Account Name</Label>
                  <Input
                    id="accountName"
                    name="accountName"
                    type="text"
                    placeholder="Adeola Johnson"
                    value={formData.accountName}
                    onChange={handleChange}
                    className="h-9 text-xs border-zinc-300 rounded-lg"
                    required
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="pt-4 flex gap-3">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="px-4 h-10 border-zinc-200 text-zinc-700 rounded-lg text-xs font-medium hover:bg-zinc-50 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Button>
              )}
              
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-10 text-xs font-medium transition-colors shadow-sm"
              >
                {step < 4 ? (
                  <>Continue <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></>
                ) : loading ? (
                  'Creating Account...'
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </div>
          </form>

          {step === 1 && (
            <div className="pt-4 border-t border-zinc-100 text-center">
              <p className="text-xs text-zinc-500 font-normal">
                Already have an account?{' '}
                <Link to="/login" className="text-zinc-900 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
