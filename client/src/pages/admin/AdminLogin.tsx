import React, { useState } from 'react';
import { NileLogo } from '../../components/ui/NileLogo';

export const AdminLogin: React.FC = () => {
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'alphaadmin2026') {
      localStorage.setItem('nile_admin_auth', 'true');
      window.location.href = '/admin/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-2xl border-2 border-[#22c55e] rounded-[24px] shadow-[0_0_30px_rgba(34,197,94,0.3)] p-8 md:p-12 max-w-md w-full">
        {/* Branding */}
        <div className="flex justify-center mb-8">
          <NileLogo size="lg" className="text-white" />
        </div>

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
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/20 transition-all"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!password}
            className="w-full py-3 bg-[#22c55e] hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
          >
            Access Admin Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};
