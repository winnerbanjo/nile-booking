import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  DollarSign, TrendingUp, Shield, Clock, Home, CheckCircle, 
  Users, BarChart3, Menu, X, ArrowUpRight, CheckCircle2, User, Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../lib/api';

const defaultKpiData = {
  ecosystemGMV: 0,
  nileRevenue: 0,
  trustScore: 4.8,
  pendingVerifications: 0,
  activeProviders: 0,
  totalCustomers: 0,
  totalBookings: 0,
  recentProviders: [],
};

const adminNav = [
  { name: 'Home', href: '/admin/dashboard', icon: Home },
  { name: 'Verification', href: '/admin/verification', icon: CheckCircle },
  { name: 'Providers', href: '/admin/providers', icon: Users },
  { name: 'Finance', href: '/admin/finance', icon: BarChart3 },
];

export const AdminDashboard: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [kpiData, setKpiData] = useState<any>(defaultKpiData);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await adminApi.getAdminStats();
        setKpiData({
          ecosystemGMV: stats.gmv || 0,
          nileRevenue: stats.nileRevenue || 0,
          trustScore: 4.8,
          pendingVerifications: stats.pendingTransfers || 0,
          activeProviders: stats.activeProviders || 0,
          totalCustomers: stats.totalCustomers || 0,
          totalBookings: stats.totalBookings || 0,
          recentProviders: stats.recentProviders || [],
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        setKpiData(defaultKpiData);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-10">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center text-white font-bold">N</div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-gray-900">Nile Booking</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Master Admin</p>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {adminNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{user?.email}</p>
              <Link to="/dashboard" className="text-[10px] text-indigo-600 hover:text-indigo-700 font-semibold truncate">
                Switch to Provider View →
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-w-0 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs">N</div>
            <h1 className="text-sm font-bold tracking-tight text-gray-900">Admin</h1>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-md">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-10 bg-gray-900/50 pt-16">
            <div className="bg-white h-full w-64 shadow-xl flex flex-col">
              <nav className="flex-1 py-4 px-2 space-y-1">
                {adminNav.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    <item.icon className="w-4 h-4 text-gray-400" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">Overview</h2>
              <p className="text-sm text-gray-500 mt-1">Live metrics across the Nile Booking ecosystem.</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-md shadow-sm">
              <Activity className="w-4 h-4 text-green-500" />
              <span>System Operational</span>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Signups / Providers */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Active Providers</h3>
                <Users className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {loading ? '...' : kpiData.activeProviders.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Total Customers */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {loading ? '...' : kpiData.totalCustomers.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Ecosystem GMV */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Ecosystem GMV</h3>
                <DollarSign className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {loading ? '...' : `₦${(kpiData.ecosystemGMV >= 1000000 ? (kpiData.ecosystemGMV / 1000000).toFixed(1) + 'M' : kpiData.ecosystemGMV >= 1000 ? (kpiData.ecosystemGMV / 1000).toFixed(1) + 'K' : (kpiData.ecosystemGMV || 0).toLocaleString())}`}
                </p>
              </div>
            </div>

            {/* Total Bookings */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
                <CheckCircle2 className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {loading ? '...' : kpiData.totalBookings.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Financial Overview & Pending Tasks */}
            <div className="lg:col-span-2 space-y-8">
              {/* Financial Section */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="text-base font-semibold text-gray-900">Financial Summary</h3>
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Nile Revenue (10% Cut)</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {loading ? '...' : `₦${(kpiData.nileRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </p>
                      <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Trust Score</p>
                      <div className="flex items-end gap-2">
                        <p className="text-2xl font-bold text-gray-900">{kpiData.trustScore}</p>
                        <p className="text-sm text-gray-500 mb-1">/ 5.0</p>
                      </div>
                      <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(kpiData.trustScore/5)*100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Signups Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="text-base font-semibold text-gray-900">Recent Signups</h3>
                  <Link to="/admin/providers" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    View All
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3">Business</th>
                        <th className="px-6 py-3">Owner</th>
                        <th className="px-6 py-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                        </tr>
                      ) : kpiData.recentProviders.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No recent signups.</td>
                        </tr>
                      ) : (
                        kpiData.recentProviders.map((provider: any) => (
                          <tr key={provider._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{provider.businessName || 'Unnamed Business'}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{provider.email}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{provider.name || 'N/A'}</td>
                            <td className="px-6 py-4 text-gray-600">
                              {new Date(provider.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Action Items Sidebar */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-base font-semibold text-gray-900">Action Required</h3>
                </div>
                <div className="p-2">
                  <Link
                    to="/admin/verification"
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">Pending Payouts</h4>
                        <span className="text-xs font-bold px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                          {kpiData.pendingVerifications}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Bank transfers awaiting your verification.</p>
                    </div>
                  </Link>
                </div>
              </div>
              
              {/* Documentation / Help */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 shadow-sm text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Shield className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-base font-semibold mb-2">Need Help?</h3>
                  <p className="text-sm text-gray-300 mb-4 text-balance">
                    View the admin documentation for guides on dispute resolution, verification, and payout processing.
                  </p>
                  <button className="text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-lg flex items-center gap-2">
                    Read Docs
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
