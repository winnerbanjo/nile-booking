import React, { useState } from 'react';
import { NileLogo } from '../../components/ui/NileLogo';
import { authApi } from '../../lib/api';
import { Loader2, AlertCircle } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.adminLogin(password);
      localStorage.setItem('nile_admin_auth', 'true');
      window.location.href = '/admin/dashboard';
    } catch (err: any) {
      setError(err.message || 'Invalid master key or authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 md:p-12 max-w-md w-full">
        {/* Branding */}
        <div className="flex justify-center mb-8">
          <NileLogo size="lg" className="text-white" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-white tracking-tight">Admin Portal</h2>
          <p className="text-sm text-gray-400 mt-1">Enter your platform master key to proceed.</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <label htmlFor="masterKey" className="block text-sm font-semibold text-gray-300 mb-2">
              Master Key
            </label>
            <input
              id="masterKey"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter master key"
              disabled={loading}
              className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/20 transition-all disabled:opacity-50"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!password || loading}
            className="w-full py-3 bg-[#22c55e] hover:bg-[#1eb052] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-[0_4px_12px_rgba(34,197,94,0.15)] flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Authenticating...' : 'Access Admin Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};
