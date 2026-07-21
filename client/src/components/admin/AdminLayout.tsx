import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CreditCard,
  ShieldAlert,
  ArrowRightLeft,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ServerCrash,
  CheckCircle2,
  FileCheck2,
  Receipt,
  UserCircle
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Ecosystem',
    items: [
      { name: 'Providers', href: '/admin/providers', icon: Users },
      { name: 'Customers', href: '/admin/customers', icon: UserCircle },
      { name: 'Bookings', href: '/admin/bookings', icon: CalendarDays },
    ]
  },
  {
    title: 'Trust & Safety',
    items: [
      { name: 'Verification', href: '/admin/verification', icon: FileCheck2 },
      { name: 'Disputes & Risk', href: '/admin/risk', icon: ShieldAlert },
    ]
  },
  {
    title: 'Finance',
    items: [
      { name: 'Transactions', href: '/admin/transactions', icon: ArrowRightLeft },
      { name: 'Payouts', href: '/admin/payouts', icon: CreditCard },
      { name: 'Refunds', href: '/admin/refunds', icon: Receipt },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Settings', href: '/admin/settings', icon: Settings },
    ]
  }
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/portal');
  };

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900 font-sans">
      
      {/* ─── Desktop Sidebar (Black & Green) ─── */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-zinc-900 fixed h-full z-20">
        <div className="p-5 flex flex-col gap-1 border-b border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-zinc-950 font-black tracking-tighter text-lg">
              N
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">Nile Booking</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Master Admin</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto custom-scrollbar">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <div className="px-3 py-2.5 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-white truncate">{user?.email || 'admin@nile.ng'}</span>
              <span className="text-[10px] text-zinc-500 font-medium">Super Admin</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ─── Mobile Sidebar Overlay ─── */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-64 h-full bg-zinc-950 border-r border-zinc-900 flex flex-col relative">
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-5 flex items-center gap-3 border-b border-white/5">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-zinc-950 font-black">N</div>
              <h1 className="text-sm font-bold text-white tracking-tight">Nile Admin</h1>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
              {NAV_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{group.title}</h3>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                          location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ─── Main Content Area ─── */}
      <main className="flex-1 md:ml-64 min-w-0 flex flex-col bg-gray-50 min-h-screen">
        
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 px-4 md:px-8 flex items-center justify-between shadow-sm">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Global Search */}
            <div className="hidden md:flex items-center relative w-96">
              <Search className="w-4 h-4 absolute left-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search providers, bookings, transactions..." 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    alert(`Searching for: ${e.currentTarget.value}`);
                  }
                }}
                className="w-full pl-9 pr-4 py-2 bg-gray-100/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 text-gray-900"
              />
              <div className="absolute right-2 px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-medium text-gray-400">
                ⌘K
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Environment Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-xs font-semibold">
              <ServerCrash className="w-3.5 h-3.5" />
              Staging Environment
            </div>

            {/* Notifications */}
            <button 
              onClick={() => {
                setHasNotifications(false);
                alert("You have 0 new notifications.");
              }}
              className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {hasNotifications && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto">
          {children}
        </div>

      </main>
    </div>
  );
};
