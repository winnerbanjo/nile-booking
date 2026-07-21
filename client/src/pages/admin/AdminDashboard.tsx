import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, TrendingUp, ShieldAlert, Clock, Home, CheckCircle2, 
  Users, BarChart3, ArrowUpRight, User, Activity, AlertTriangle, ArrowDownRight, CreditCard
} from 'lucide-react';
import { adminApi } from '../../lib/api';

const defaultKpiData = {
  ecosystemGMV: 4500000,
  activeSubscriptions: 125,
  completedGMV: 4100000,
  pendingSettlement: 350000,
  trustScore: 4.8,
  pendingVerifications: 3,
  activeProviders: 42,
  totalCustomers: 1250,
  totalBookings: 840,
  recentProviders: [],
};

const ACTION_ALERTS = [
  {
    id: 1,
    priority: 'high',
    entity: 'Zenith Photography',
    amount: null,
    age: '2 hours',
    assigned: 'Unassigned',
    action: 'Review Verification',
    link: '/admin/verification',
    icon: ShieldAlert,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200'
  },
  {
    id: 2,
    priority: 'critical',
    entity: 'The Modern Chef',
    amount: '₦250,000',
    age: '4 hours',
    assigned: 'Finance Team',
    action: 'Approve Payout',
    link: '/admin/payouts',
    icon: CreditCard,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200'
  },
  {
    id: 3,
    priority: 'medium',
    entity: 'Elite Hair Studio',
    amount: '₦15,000',
    age: '1 day',
    assigned: 'Support Team',
    action: 'Resolve Dispute',
    link: '/admin/risk',
    icon: AlertTriangle,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  }
];

export const AdminDashboard: React.FC = () => {
  const [kpiData, setKpiData] = useState<any>(defaultKpiData);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState(ACTION_ALERTS);

  const handleAction = (id: number) => {
    alert(`Action completed for alert ID: ${id}`);
    setAlerts(alerts.filter(a => a.id !== id));
  };

  useEffect(() => {
    // Simulate fetching deep stats
    setTimeout(() => {
      setKpiData(defaultKpiData);
      setLoading(false);
    }, 800);
  }, []);

  const formatMoney = (amount: number) => {
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Platform Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Live metrics across the Nile Booking ecosystem.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
            <option>Today</option>
            <option>Yesterday</option>
            <option>Last 7 Days</option>
            <option>This Month</option>
            <option>This Quarter</option>
          </select>
          <button onClick={() => alert('Action triggered!')} className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Grid - Row 1 (Financials) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ecosystem GMV</h3>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-gray-900 tracking-tighter">
              {loading ? '...' : formatMoney(kpiData.ecosystemGMV)}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.5% from last period</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Subscriptions</h3>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-emerald-600 tracking-tighter">
              {loading ? '...' : kpiData.activeSubscriptions}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12 new this month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Completed GMV</h3>
            <CheckCircle2 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-gray-900 tracking-tighter">
              {loading ? '...' : formatMoney(kpiData.completedGMV)}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <span>Value of fully completed bookings</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Settlement</h3>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-gray-900 tracking-tighter">
              {loading ? '...' : formatMoney(kpiData.pendingSettlement)}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <span>Deposits held for future bookings</span>
          </div>
        </div>
      </div>

      {/* KPI Grid - Row 2 (Operations) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Active Providers</h3>
            <p className="text-2xl font-black text-gray-900">{kpiData.activeProviders}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Customers</h3>
            <p className="text-2xl font-black text-gray-900">{kpiData.totalCustomers.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pending Verifications</h3>
            <p className="text-2xl font-black text-gray-900">{kpiData.pendingVerifications}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Bookings</h3>
            <p className="text-2xl font-black text-gray-900">{kpiData.totalBookings}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Centre */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-gray-900">Action Centre</h3>
              </div>
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                {alerts.length} Urgent Actions
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {alerts.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">All caught up! No urgent actions.</div>
              ) : (
                alerts.map((alert) => (
                <div key={alert.id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${alert.bg} ${alert.border} ${alert.color}`}>
                      <alert.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        {alert.entity}
                        {alert.amount && (
                          <span className="text-xs font-semibold text-gray-500 border border-gray-200 px-1.5 rounded bg-white">
                            {alert.amount}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        <span className="font-medium text-gray-700">{alert.action}</span> • Assigned: {alert.assigned} • Waiting {alert.age}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAction(alert.id)}
                    className="shrink-0 flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                  >
                    Take Action
                  </button>
                </div>
              )))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Recent Transactions</h3>
              <Link to="/admin/transactions" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View Ledger</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3">Reference</th>
                    <th className="px-6 py-3">Provider</th>
                    <th className="px-6 py-3">Gross Amount</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs font-medium text-gray-900">TXN-8923</td>
                    <td className="px-6 py-4 font-medium text-gray-900">The Modern Chef</td>
                    <td className="px-6 py-4">₦15,000</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        SUCCESS
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs font-medium text-gray-900">TXN-8922</td>
                    <td className="px-6 py-4 font-medium text-gray-900">Glamour MUA</td>
                    <td className="px-6 py-4">₦22,000</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        SUCCESS
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Side Column */}
        <div className="space-y-6">
          {/* Trust Score */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Platform Trust Score</h3>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-5xl font-black text-gray-900">{kpiData.trustScore}</span>
              <span className="text-lg font-bold text-gray-400 mb-1">/ 5.0</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(kpiData.trustScore / 5) * 100}%` }} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Booking Completion</span>
                <span className="font-bold text-gray-900">94%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Dispute Rate</span>
                <span className="font-bold text-gray-900">1.2%</span>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-gray-700">Core API</span>
                </div>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-gray-700">Payment Gateway</span>
                </div>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-gray-700">WhatsApp Engine</span>
                </div>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-sm font-medium text-gray-700">Email Service</span>
                </div>
                <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">Degraded</span>
              </div>
            </div>
            <button onClick={() => alert('Action triggered!')} className="w-full mt-5 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              View Status Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
