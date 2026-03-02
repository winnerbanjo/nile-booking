import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Settings,
  Package,
  LogOut,
  Menu,
  X,
  BookOpen,
  DollarSign,
  Globe,
  ChevronRight,
  Link as LinkIcon,
  ShoppingBag,
  Store,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { NileLogo } from '../ui/NileLogo';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Services', href: '/dashboard/services', icon: Package },
  { name: 'Bookings', href: '/dashboard/bookings', icon: BookOpen },
  { name: 'Financial', href: '/dashboard/financial', icon: DollarSign },
  { name: 'Marketing', href: '/dashboard/marketing', icon: TrendingUp },
  { name: 'Availability', href: '/dashboard/settings', icon: Calendar },
  { name: 'Domains', href: '/dashboard/domains', icon: Globe },
  { name: 'Settings', href: '/dashboard/profile', icon: Settings },
];

const ecosystemLinks = [
  { name: 'LinkNest', href: 'https://mylinknest.com/', icon: LinkIcon, subtitle: 'For Creators' },
  { name: 'Nile', href: 'https://nile.ng/', icon: ShoppingBag, subtitle: 'For Retailers' },
  { name: 'Nile Collective', href: 'https://nilecollective.co/', icon: Store, subtitle: 'Marketplace' },
];

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7]">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-white/40 backdrop-blur-2xl border-r border-white/30 transform transition-all duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarExpanded ? 'w-64' : 'w-20'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/30">
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Link to="/dashboard">
                    <NileLogo size="sm" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="hidden lg:block p-2 hover:bg-white/50 rounded-md transition-colors"
              >
                <ChevronRight className={cn('h-4 w-4 text-gray-600 transition-transform', !sidebarExpanded && 'rotate-180')} />
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-white/50 rounded-md"
              >
                <X className="h-5 w-5 text-gray-900" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-gray-900 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-white/50'
                  )}
                  style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                >
                  <item.icon className={cn('h-5 w-5', sidebarExpanded ? 'mr-3' : 'mx-auto')} />
                  <AnimatePresence>
                    {sidebarExpanded && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </nav>

          {/* Ecosystem Switcher - Hidden on Mobile */}
          <div className="hidden lg:block px-4 py-4 border-t border-white/30">
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-4"
                >
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                    Ecosystem
                  </p>
                  <div className="space-y-2">
                    {ecosystemLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/50 transition-colors group"
                      >
                        <link.icon className="w-4 h-4 text-gray-600 group-hover:text-[#22c55e] transition-colors" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                            {link.name}
                          </p>
                          <p className="text-xs text-gray-500 font-light truncate">{link.subtitle}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* User info & logout */}
            <div className={cn('mb-3 px-2 py-2', !sidebarExpanded && 'px-0')}>
              <AnimatePresence>
                {sidebarExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="text-sm font-semibold text-gray-900 truncate" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                      {user?.businessName || user?.name}
                    </p>
                    <p className="text-xs text-gray-500 font-light truncate">{user?.email}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start text-gray-700 hover:bg-white/50 transition-colors',
                !sidebarExpanded && 'justify-center px-0'
              )}
              onClick={logout}
            >
              <LogOut className={cn('h-4 w-4', sidebarExpanded ? 'mr-3' : '')} />
              <AnimatePresence>
                {sidebarExpanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Logout
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Dock */}
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-t border-white/30 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]"
        >
          <div className="grid grid-cols-4 gap-1 px-2 py-2">
            {navigation.slice(0, 4).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-white/50'
                  )}
                >
                  <item.icon className="h-5 w-5 mb-1" />
                  <span className="text-[10px] font-medium truncate w-full text-center">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Main content */}
      <div className={cn('transition-all duration-300 pb-16 lg:pb-0', sidebarExpanded ? 'lg:pl-64' : 'lg:pl-20')}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/40 backdrop-blur-2xl border-b border-white/30">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-white/50 rounded-md"
            >
              <Menu className="h-6 w-6 text-gray-900" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              {user?.slug && (
                <a
                  href={`https://${user.slug}.nilebooking.co/`}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                >
                  View My Website
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
