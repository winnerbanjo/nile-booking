import React from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Platform Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Configure global platform variables and commissions.</p>
        </div>
        <button 
          onClick={() => alert("Settings saved successfully!")}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
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
              <input type="number" defaultValue={5000} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Payout Delay (Days)</label>
              <input type="number" defaultValue={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
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
              <input type="number" defaultValue={500000} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Refund without Super Admin (₦)</label>
              <input type="number" defaultValue={50000} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
