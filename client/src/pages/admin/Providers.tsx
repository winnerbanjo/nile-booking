import React, { useState } from 'react';
import { Search, Filter, Download, MoreHorizontal, Store, Star, MapPin } from 'lucide-react';
import { ActionModal } from '../../components/admin/ActionModal';

const mockProviders = [
  {
    id: 'PRV-100',
    name: 'The Modern Barber',
    businessName: 'The Modern Barber',
    email: 'barber@nile.ng',
    phone: '+234 812 345 6789',
    city: 'Lagos',
    rating: 4.9,
    totalBookings: 245,
    totalRevenue: 3675000,
    status: 'Active',
    verified: true,
  },
  {
    id: 'PRV-101',
    name: 'Zara Makeup Studio',
    businessName: 'Zara Makeup Studio',
    email: 'zara@nile.ng',
    phone: '+234 812 345 6790',
    city: 'Lagos',
    rating: 4.7,
    totalBookings: 189,
    totalRevenue: 2835000,
    status: 'Active',
    verified: true,
  },
  {
    id: 'PRV-102',
    name: 'Kelvin Photography',
    businessName: 'Kelvin Photography',
    email: 'kelvin@nile.ng',
    phone: '+234 812 345 6791',
    city: 'Abuja',
    rating: 4.5,
    totalBookings: 156,
    totalRevenue: 2340000,
    status: 'Suspended',
    verified: false,
  },
];

export const Providers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<any>(null);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Service Providers</h2>
          <p className="text-sm text-gray-500 mt-1">Manage all merchants, verification status, and business health.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => alert('Action triggered!')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg shadow-sm transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-950 rounded-xl p-5 shadow-sm text-white">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Total Providers</p>
          <p className="text-3xl font-black tracking-tighter">4,281</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Active This Week</p>
          <p className="text-3xl font-black tracking-tighter text-emerald-600">3,942</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pending Verification</p>
          <p className="text-3xl font-black tracking-tighter text-amber-600">156</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by business name, email, or city..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => alert('Action triggered!')} className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Business</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Performance</th>
                <th className="px-6 py-4">Revenue</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockProviders.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{provider.businessName}</p>
                        <p className="text-xs text-gray-500">{provider.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-900">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{provider.city}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {provider.rating}
                    </p>
                    <p className="text-xs text-gray-500">{provider.totalBookings} bookings</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-emerald-600">₦{provider.totalRevenue.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold ${
                      provider.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {provider.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedProvider(provider)} 
                      className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-sm text-gray-500">
          <span>Showing 1 to 3 of 4,281 providers</span>
          <div className="flex items-center gap-2">
            <button onClick={() => alert('Action triggered!')} className="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <button onClick={() => alert('Action triggered!')} className="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>

      <ActionModal
        isOpen={!!selectedProvider}
        onClose={() => setSelectedProvider(null)}
        title="Provider Management"
        data={selectedProvider ? {
          'Business': selectedProvider.businessName,
          'Owner': selectedProvider.name,
          'Email': selectedProvider.email,
          'Phone': selectedProvider.phone,
          'Location': selectedProvider.city,
          'Revenue': `₦${selectedProvider.totalRevenue.toLocaleString()}`,
          'Status': selectedProvider.status,
        } : {}}
        actions={[
          { label: 'View Storefront', variant: 'primary', onClick: () => alert('Opening storefront...') },
          { label: 'Send Payout Report', variant: 'secondary', onClick: () => alert('Report sent.') },
          { label: selectedProvider?.status === 'Active' ? 'Suspend Provider' : 'Activate Provider', variant: 'danger', onClick: () => alert('Provider status changed.') },
        ]}
      />
    </div>
  );
};
