import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings as SettingsIcon, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { AdminLocalErrorState } from '../../components/admin/AdminLocalErrorState';

export const Settings: React.FC = () => {
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const { data, isLoading, isError, refetch, error } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => adminApi.getSettings(),
    staleTime: 1000 * 60 * 5, // 5 min — settings don't change often
  });

  if (isError) {
    return (
      <AdminLocalErrorState
        title="Failed to load settings"
        message={(error as any)?.message || 'Platform settings could not be loaded.'}
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-gray-500 font-medium">Loading settings...</p>
      </div>
    );
  }

  const handleSave = () => {
    // Settings are currently read-only from env config.
    // A future PATCH /api/admin/settings endpoint would persist changes.
    setSaveState('saving');
    setTimeout(() => {
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    }, 600);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Platform Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Configure global platform variables and commissions.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveState !== 'idle'}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          {saveState === 'saving' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saveState === 'saved' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-5 py-3 text-sm text-amber-700">
        Settings are currently loaded from server configuration. Changes made here are for display only until a write endpoint is deployed.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon className="w-5 h-5 text-gray-900" />
            <h3 className="text-base font-bold text-gray-900">Global Financials</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Subscription Fee (₦)</label>
              <input type="number" defaultValue={data?.subscriptionFee ?? 5000} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Payout Delay (Days)</label>
              <input type="number" defaultValue={data?.payoutDelayDays ?? 3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon className="w-5 h-5 text-gray-900" />
            <h3 className="text-base font-bold text-gray-900">Security & Limits</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">High Value Payout Threshold (₦)</label>
              <input type="number" defaultValue={data?.highValueThreshold ?? 500000} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Refund without Super Admin (₦)</label>
              <input type="number" defaultValue={data?.maxRefundWithoutAdmin ?? 50000} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm col-span-full">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Environment</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-1">Runtime Environment</p>
              <p className="font-semibold text-gray-800 capitalize">{data?.environment || 'production'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Platform Version</p>
              <p className="font-semibold text-gray-800">{data?.version || '1.0.0'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
