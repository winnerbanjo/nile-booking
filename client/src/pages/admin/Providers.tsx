import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Shield, Ban, CheckCircle, Star, Users as UsersIcon, Home, CheckCircle as CheckCircleIcon, BarChart3 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

const adminNav = [
  { name: 'Home', href: '/admin/dashboard', icon: Home },
  { name: 'Verification', href: '/admin/verification', icon: CheckCircleIcon },
  { name: 'Providers', href: '/admin/providers', icon: UsersIcon },
  { name: 'Finance', href: '/admin/finance', icon: BarChart3 },
];

const glassCardClass = "bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.3)]";

// Mock provider data
const providers = [
  {
    id: 1,
    name: 'The Modern Barber',
    email: 'barber@nile.ng',
    businessName: 'The Modern Barber',
    slug: 'the-modern-barber',
    phone: '+234 812 345 6789',
    city: 'Lagos',
    country: 'Nigeria',
    rating: 4.9,
    totalBookings: 245,
    totalRevenue: 3675000,
    status: 'active',
    verified: true,
  },
  {
    id: 2,
    name: 'Zara Makeup Studio',
    email: 'zara@nile.ng',
    businessName: 'Zara Makeup Studio',
    slug: 'zara-makeup',
    phone: '+234 812 345 6790',
    city: 'Lagos',
    country: 'Nigeria',
    rating: 4.7,
    totalBookings: 189,
    totalRevenue: 2835000,
    status: 'active',
    verified: true,
  },
  {
    id: 3,
    name: 'Kelvin Photography',
    email: 'kelvin@nile.ng',
    businessName: 'Kelvin Photography',
    slug: 'kelvin-photography',
    phone: '+234 812 345 6791',
    city: 'Abuja',
    country: 'Nigeria',
    rating: 4.5,
    totalBookings: 156,
    totalRevenue: 2340000,
    status: 'frozen',
    verified: false,
  },
];

export const Providers: React.FC = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);

  const filteredProviders = providers.filter(
    (provider) =>
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.businessName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFreezeAccount = (id: number) => {
    console.log('Freezing account:', id);
    // API call to freeze account
  };

  const handleUnfreezeAccount = (id: number) => {
    console.log('Unfreezing account:', id);
    // API call to unfreeze account
  };

  const handleVerifyBadge = (id: number) => {
    console.log('Verifying badge for:', id);
    // API call to verify badge (for 4.9+ stars)
  };

  return (
    <div className="w-full">
      <div className="w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Merchant Empire Management
          </h1>
          <p className="text-base text-gray-400 font-light">
            Searchable provider directory | Freeze accounts | Verify badges
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${glassCardClass} p-4 mb-6`}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or business..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 bg-white/5 border-white/20 text-white placeholder-gray-500 focus:border-[#22c55e]"
            />
          </div>
        </motion.div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${glassCardClass} overflow-hidden`}
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase">Provider</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase">Location</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase">Rating</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase">Bookings</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase">Revenue</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase">Status</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProviders.map((provider, index) => (
                  <motion.tr
                    key={provider.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#22c55e]/20 flex items-center justify-center">
                          <UsersIcon className="w-5 h-5 text-[#22c55e]" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{provider.businessName}</p>
                          <p className="text-sm text-gray-400">{provider.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-300">
                      {provider.city} | {provider.country}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-semibold text-white">{provider.rating}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-300">{provider.totalBookings}</td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-white">₦{(provider.totalRevenue / 1000).toFixed(0)}K</span>
                    </td>
                    <td className="py-4 px-6">
                      {provider.status === 'active' ? (
                        <span className="px-2 py-1 bg-[#22c55e]/20 text-[#22c55e] rounded-full text-xs font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                          Frozen
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {provider.rating >= 4.9 && !provider.verified && (
                          <Button
                            size="sm"
                            onClick={() => handleVerifyBadge(provider.id)}
                            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-full backdrop-blur-xl"
                          >
                            <Shield className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                        )}
                        {provider.status === 'active' ? (
                          <Button
                            size="sm"
                            onClick={() => handleFreezeAccount(provider.id)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-full backdrop-blur-xl"
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Freeze
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleUnfreezeAccount(provider.id)}
                            className="bg-[#22c55e]/20 hover:bg-[#22c55e]/30 text-[#22c55e] border border-[#22c55e]/30 rounded-full backdrop-blur-xl"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Unfreeze
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>

        {/* Mobile Action Cards */}
        <div className="md:hidden space-y-4">
          {filteredProviders.map((provider, index) => (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${glassCardClass} p-4`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white">{provider.businessName}</p>
                    {provider.verified && (
                      <Shield className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-1">{provider.email}</p>
                  <p className="text-xs text-gray-500">{provider.city} | {provider.country}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold text-white">{provider.rating}</span>
                  </div>
                  {provider.status === 'active' ? (
                    <span className="px-2 py-1 bg-[#22c55e]/20 text-[#22c55e] rounded-full text-xs font-semibold">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                      Frozen
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3 p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="text-xs text-gray-400">Bookings</p>
                  <p className="text-sm font-semibold text-white">{provider.totalBookings}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Revenue</p>
                  <p className="text-sm font-semibold text-white">₦{(provider.totalRevenue / 1000).toFixed(0)}K</p>
                </div>
              </div>
              <div className="flex gap-2">
                {provider.rating >= 4.9 && !provider.verified && (
                  <Button
                    onClick={() => handleVerifyBadge(provider.id)}
                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-full backdrop-blur-xl"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Verify
                  </Button>
                )}
                {provider.status === 'active' ? (
                  <Button
                    onClick={() => handleFreezeAccount(provider.id)}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-full backdrop-blur-xl"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Freeze Account
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUnfreezeAccount(provider.id)}
                    className="flex-1 bg-[#22c55e]/20 hover:bg-[#22c55e]/30 text-[#22c55e] border border-[#22c55e]/30 rounded-full backdrop-blur-xl"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Unfreeze
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile Bottom Dock */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-8px_30px_rgb(0,0,0,0.5)]"
      >
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {adminNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#22c55e]/20 text-[#22c55e]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium truncate w-full text-center">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
