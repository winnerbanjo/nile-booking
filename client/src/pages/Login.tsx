import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi, ApiError } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { NileLogo } from '../components/ui/NileLogo';
import { ArrowRight, ShieldCheck, KeyRound, CheckCircle2, X } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotErr, setForgotErr] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPassword = customPass || password;

    if (!loginEmail || !loginPassword) {
      setError('Please provide email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(loginEmail, loginPassword);
      navigate('/dashboard');
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid credentials. Please check your email and password.');
      } else if (err instanceof ApiError && err.status === 403) {
        setError('Access denied. Provider account required.');
      } else {
        setError(err.message || 'Login failed. Please verify connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleSubmit(undefined, demoEmail, demoPass);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErr('');
    setForgotMsg('');
    setForgotLoading(true);

    try {
      if (forgotStep === 1) {
        await authApi.forgotPassword(forgotEmail);
        setForgotMsg('6-digit reset code sent to your email!');
        setForgotStep(2);
      } else {
        await authApi.resetPassword({
          email: forgotEmail,
          otpCode: resetOtp,
          newPassword,
        });
        setForgotMsg('Password reset successful! You can now log in.');
        setTimeout(() => {
          setShowForgotModal(false);
          setEmail(forgotEmail);
          setPassword(newPassword);
          setForgotStep(1);
          setForgotMsg('');
        }, 1500);
      }
    } catch (err: any) {
      setForgotErr(err.message || 'Password reset request failed.');
    } finally {
      setForgotLoading(false);
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
            Sign in to Merchant Hub
          </h1>
          <p className="text-xs text-zinc-500 font-normal">
            Manage your storefront, bookings, and customer details
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-6 sm:p-8 shadow-sm space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg font-medium">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-xs font-medium text-zinc-700 mb-1.5 block">
                Work Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="barber@nile.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-xs border-zinc-300 rounded-lg"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-zinc-700">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] font-semibold text-zinc-900 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="•••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 text-xs border-zinc-300 rounded-lg"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-10 text-xs font-medium transition-colors shadow-sm"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </form>

          <div className="pt-4 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-500 font-normal">
              Don't have a merchant account?{' '}
              <Link to="/register" className="text-zinc-900 font-semibold hover:underline">
                Create Storefront
              </Link>
            </p>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 max-w-sm w-full space-y-4 shadow-xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-zinc-900 font-semibold text-base">
              <KeyRound className="w-5 h-5 text-emerald-600" />
              Reset Password
            </div>

            {forgotErr && (
              <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {forgotErr}
              </div>
            )}

            {forgotMsg && (
              <div className="p-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{forgotMsg}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-3.5">
              <div>
                <Label className="text-xs font-medium text-zinc-700 mb-1 block">Work Email</Label>
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="barber@nile.ng"
                  className="h-9 text-xs border-zinc-300 rounded-lg"
                  required
                />
              </div>

              {forgotStep === 2 && (
                <>
                  <div>
                    <Label className="text-xs font-medium text-zinc-700 mb-1 block">6-Digit Reset Code</Label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      placeholder="123456"
                      className="h-9 text-xs border-zinc-300 rounded-lg font-mono tracking-widest text-center"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-zinc-700 mb-1 block">New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="h-9 text-xs border-zinc-300 rounded-lg"
                      required
                      minLength={6}
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 text-xs font-medium"
              >
                {forgotLoading
                  ? 'Processing...'
                  : forgotStep === 1
                  ? 'Send 6-Digit Reset OTP'
                  : 'Update Password & Save'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
