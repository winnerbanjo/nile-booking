import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { NileLogo } from '../components/ui/NileLogo';
import { ArrowRight, Globe } from 'lucide-react';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    phone: '',
    country: 'Nigeria',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.register(formData);
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
            Create Merchant Account
          </h1>
          <p className="text-xs text-zinc-500 font-normal">
            Launch your custom booking storefront in seconds
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-6 sm:p-8 shadow-sm space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg font-medium">
                {error}
              </div>
            )}

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
              <Label htmlFor="businessName" className="text-xs font-medium text-zinc-700 mb-1 block">Business Name</Label>
              <Input
                id="businessName"
                name="businessName"
                type="text"
                placeholder="The Modern Barber"
                value={formData.businessName}
                onChange={handleChange}
                className="h-9 text-xs border-zinc-300 rounded-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <Label htmlFor="phone" className="text-xs font-medium text-zinc-700 mb-1 block">WhatsApp Phone</Label>
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
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                className="h-9 text-xs border-zinc-300 rounded-lg"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-10 text-xs font-medium transition-colors shadow-sm"
            >
              {loading ? 'Sending Verification OTP...' : 'Continue to OTP Verification'}
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </form>

          <div className="pt-4 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-500 font-normal">
              Already have an account?{' '}
              <Link to="/login" className="text-zinc-900 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
