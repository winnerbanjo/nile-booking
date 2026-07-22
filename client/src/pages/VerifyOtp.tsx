import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { NileLogo } from '../components/ui/NileLogo';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowRight, RefreshCw, CheckCircle2, Mail, PartyPopper, ExternalLink } from 'lucide-react';

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
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<any>(null);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.value !== '' && element.nextElementSibling) {
      (element.nextElementSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const inputs = document.querySelectorAll<HTMLInputElement>('.otp-input');
      if (inputs[index - 1]) {
        inputs[index - 1].focus();
      }
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setError('Please enter your work email address.');
      return;
    }
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of your verification OTP code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await authApi.verifyOtp(email, otpCode);
      if (res.data && res.data.token) {
        setAuthUser(res.data);
        sessionStorage.removeItem('nile_pending_email');
        setVerifiedUser(res.data);
        setIsVerifiedSuccess(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invalid verification code. Please check your Mailtrap inbox.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email to resend OTP code.');
      return;
    }
    setResending(true);
    setError('');
    setSuccessMsg('');
    try {
      await authApi.resendOtp(email);
      setSuccessMsg('New 6-digit OTP code sent to your email!');
    } catch (err: any) {
      setError('Failed to resend OTP code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (isVerifiedSuccess && verifiedUser) {
    const slug = verifiedUser.slug || 'your-business';
    const storefrontUrl = `${slug}.nilebooking.co`;

    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-zinc-900">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-10 px-8 shadow-2xl border border-emerald-100 rounded-3xl space-y-6 text-center">
            
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <PartyPopper className="w-8 h-8 text-emerald-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">
                Your Website is Live! 🚀
              </h2>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Congratulations! Your custom booking storefront has been successfully generated and is now online.
              </p>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 my-6">
              <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mb-2">Your Live URL</p>
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-medium">
                <span>{storefrontUrl}</span>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-11 text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-zinc-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <NileLogo size="lg" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          Verify Your Email
        </h2>
        <p className="text-xs text-zinc-500 font-normal max-w-xs mx-auto">
          Enter the 6-digit verification code sent to your email
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
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-zinc-700">Work Email</label>
                <button 
                  type="button" 
                  onClick={() => navigate('/register')}
                  className="text-[10px] text-zinc-500 hover:text-zinc-900 hover:underline"
                >
                  Change email?
                </button>
              </div>
              <Input
                type="email"
                value={email}
                disabled
                className="h-9 text-xs border-zinc-300 rounded-lg bg-zinc-50 text-zinc-500 cursor-not-allowed"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 mb-2 block">6-Digit Verification Code</label>
              <div className="flex justify-between gap-2">
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={data}
                    onChange={(e) => handleChange(e.target, index)}
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
              {loading ? (
                <span>Verifying Code...</span>
              ) : (
                <>
                  <span>Complete Account Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-zinc-100 space-y-2">
            <p className="text-xs text-zinc-500 font-normal">
              Didn't receive the code? Check your inbox or spam.
            </p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:underline disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>Resend OTP Code</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
