import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, TrendingUp, Shield, Clock, Home, CheckCircle, Users, BarChart3, Menu, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../lib/api';

const glassCardClass = "bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.3)]";
const glassCardClassLight = "bg-white/40 backdrop-blur-xl border border-white/40 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]";

// Mock KPI data (fallback)
const defaultKpiData = {
  ecosystemGMV: 0,
  nileRevenue: 0,
  trustScore: 4.8,
  pendingVerifications: 0,
};

const adminNav = [
  { name: 'Home', href: '/admin/dashboard', icon: Home },
  { name: 'Verification', href: '/admin/verification', icon: CheckCircle },
  { name: 'Providers', href: '/admin/providers', icon: Users },
  { name: 'Finance', href: '/admin/finance', icon: BarChart3 },
];

export const AdminDashboard: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [kpiData, setKpiData] = useState(defaultKpiData);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Fetch admin stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await adminApi.getAdminStats();
        setKpiData({
          ecosystemGMV: stats.gmv || 0,
          nileRevenue: stats.nileRevenue || 0,
          trustScore: 4.8,
          pendingVerifications: stats.pendingTransfers || 0,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        // Keep default zeros on error
        setKpiData(defaultKpiData);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-2xl border-b border-white/10">
        <div className="flex items-center justify-between h-16 px-4 md:px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Nile Master Admin
            </h1>
            <span className="px-2 py-1 bg-[#22c55e]/20 text-[#22c55e] rounded-full text-xs font-semibold">
              God View
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-gray-400">{user?.email}</span>
            <Link
              to="/dashboard"
              className="text-sm text-[#22c55e] hover:text-green-400 transition-colors"
            >
              Switch to Provider View
            </Link>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Verification Queue Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${glassCardClass} p-6 mb-8`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-white tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Verification Queue
            </h2>
            <Link
              to="/admin/verification"
              className="text-sm text-[#22c55e] hover:text-green-400 transition-colors"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mock pending verifications */}
            {[
              { id: 1, customer: 'Adeola Johnson', amount: 15000, date: '2024-01-15' },
              { id: 2, customer: 'Chukwu Emeka', amount: 12000, date: '2024-01-15' },
              { id: 3, customer: 'Tunde Adeyemi', amount: 18000, date: '2024-01-16' },
            ].map((booking) => (
              <div
                key={booking.id}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all cursor-pointer"
                onClick={() => navigate('/admin/verification')}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-white text-sm">{booking.customer}</p>
                  <span className="text-xs text-gray-400">{booking.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-[#22c55e]">₦{booking.amount.toLocaleString()}</span>
                  <ImageIcon className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* KPI Grid - 4 Column Bento Stack */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Ecosystem GMV */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${glassCardClass} p-6 hover:bg-white/15 transition-all cursor-pointer group relative overflow-hidden`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#22c55e]/20 transition-all"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-6 h-6 text-[#22c55e]" strokeWidth={1.5} />
                <TrendingUp className="w-4 h-4 text-[#22c55e]" />
              </div>
              <h3 className="text-xs font-semibold text-gray-400 mb-2 tracking-tight uppercase">
                Ecosystem GMV
              </h3>
              <p className="text-3xl font-black text-white tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                {loading ? '...' : kpiData.ecosystemGMV >= 1000000 
                  ? `₦${(kpiData.ecosystemGMV / 1000000).toFixed(1)}M`
                  : kpiData.ecosystemGMV >= 1000
                  ? `₦${(kpiData.ecosystemGMV / 1000).toFixed(0)}K`
                  : `₦${(kpiData.ecosystemGMV || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
              <p className="text-xs text-gray-400">Total bookings value</p>
            </div>
          </motion.div>

          {/* Nile Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${glassCardClass} p-6 hover:bg-white/15 transition-all cursor-pointer group relative overflow-hidden`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-xs font-semibold text-gray-400 mb-2 tracking-tight uppercase">
                Nile Revenue
              </h3>
              <p className="text-3xl font-black text-white tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                {loading ? '...' : kpiData.nileRevenue >= 1000000
                  ? `₦${(kpiData.nileRevenue / 1000000).toFixed(1)}M`
                  : kpiData.nileRevenue >= 1000
                  ? `₦${(kpiData.nileRevenue / 1000).toFixed(0)}K`
                  : `₦${(kpiData.nileRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
              <p className="text-xs text-gray-400">10% commission cut</p>
            </div>
          </motion.div>

          {/* Trust Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`${glassCardClass} p-6 hover:bg-white/15 transition-all cursor-pointer group relative overflow-hidden`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-yellow-500/20 transition-all"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <Shield className="w-6 h-6 text-yellow-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-xs font-semibold text-gray-400 mb-2 tracking-tight uppercase">
                Trust Score
              </h3>
              <p className="text-3xl font-black text-white tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                {kpiData.trustScore}
              </p>
              <p className="text-xs text-gray-400">Global average rating</p>
            </div>
          </motion.div>

          {/* Pending Verifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`${glassCardClass} p-6 hover:bg-white/15 transition-all cursor-pointer group relative overflow-hidden`}
            onClick={() => navigate('/admin/verification')}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/20 transition-all"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-6 h-6 text-orange-400" strokeWidth={1.5} />
                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-semibold">
                  {kpiData.pendingVerifications}
                </span>
              </div>
              <h3 className="text-xs font-semibold text-gray-400 mb-2 tracking-tight uppercase">
                Pending Verifications
              </h3>
              <p className="text-3xl font-black text-white tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                {kpiData.pendingVerifications}
              </p>
              <p className="text-xs text-gray-400">Bank transfers awaiting review</p>
            </div>
          </motion.div>
        </div>

        {/* Financial Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`${glassCardClass} p-6 mb-8`}
        >
          <h2 className="text-xl font-black text-white mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
            Financial Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Ecosystem GMV */}
            <div className="p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-6 h-6 text-[#22c55e]" strokeWidth={1.5} />
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <h3 className="text-xs font-semibold text-gray-400 mb-2 tracking-tight uppercase">
                Total Ecosystem GMV
              </h3>
              <p className="text-3xl font-black text-white tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                {loading ? '...' : `₦${(kpiData.ecosystemGMV || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-gradient-to-r from-[#22c55e] to-green-400 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            {/* Nile Commission (10%) */}
            <div className="p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
                <span className="text-xs font-semibold text-green-500">+10%</span>
              </div>
              <h3 className="text-xs font-semibold text-gray-400 mb-2 tracking-tight uppercase">
                Nile Commission (10%)
              </h3>
              <p className="text-3xl font-black text-green-500 tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                {loading ? '...' : `₦${(kpiData.nileRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>

            {/* Pending Payouts */}
            <div className="p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-6 h-6 text-orange-400" strokeWidth={1.5} />
                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-semibold">
                  {kpiData.pendingVerifications || 0}
                </span>
              </div>
              <h3 className="text-xs font-semibold text-gray-400 mb-2 tracking-tight uppercase">
                Pending Payouts
              </h3>
              <p className="text-3xl font-black text-white tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                {loading ? '...' : kpiData.pendingVerifications || 0}
              </p>
              <p className="text-xs text-gray-400 mt-2">Bank transfers awaiting verification</p>
            </div>
          </div>

          {/* Revenue Growth Sparkline */}
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-300">Revenue Growth (7 Days)</h4>
              <span className="text-xs text-green-500 font-semibold">+24.5%</span>
            </div>
            <div className="flex items-end justify-between h-16 gap-1">
              {[45, 52, 48, 61, 58, 67, 72].map((height, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                  className="flex-1 bg-gradient-to-t from-[#22c55e] to-green-400 rounded-t transition-all hover:opacity-80"
                  style={{ minHeight: '8px' }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile Bottom Dock */}
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
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
      </AnimatePresence>
    </div>
  );
};
