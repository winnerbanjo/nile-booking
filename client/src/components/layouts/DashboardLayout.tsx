import React, { useState, Suspense } from 'react';
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
  TrendingUp,
  Store,
  ExternalLink,
  FileText,
  Users,
  FileSpreadsheet,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { NileLogo } from '../ui/NileLogo';
import { getStorefrontUrl } from '../../lib/subdomain';

import { Star, Tag, ShoppingBag } from 'lucide-react';
import { serviceApi, bookingApi, dashboardApi, categoryApi } from '../../lib/api';
import { queryClient, queryKeys } from '../../lib/queryClient';
import { 
  servicesImport, 
  categoriesImport, 
  settingsImport, 
  bookingsImport, 
  financialImport, 
  paymentsImport, 
  customersImport, 
  staffImport, 
  invoicesImport 
} from '../../App';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Bookings', href: '/dashboard/bookings', icon: BookOpen },
  { name: 'Customers (CRM)', href: '/dashboard/customers', icon: Users },
  { name: 'Services', href: '/dashboard/services', icon: Package },
  { name: 'Staff', href: '/dashboard/staff', icon: UserCheck },
  { name: 'Sales (POS)', href: '/dashboard/sales', icon: ShoppingBag },
  { name: 'Marketing', href: '/dashboard/marketing', icon: TrendingUp },
  { name: 'Reviews', href: '/dashboard/reviews', icon: Star },
  { name: 'Discounts', href: '/dashboard/discounts', icon: Tag },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileSpreadsheet },
  { name: 'Finance', href: '/dashboard/financial', icon: DollarSign },
  { name: 'Availability', href: '/dashboard/settings', icon: Calendar },
  { name: 'Domains', href: '/dashboard/domains', icon: Globe },
  { name: 'Edit Website', href: '/dashboard/profile', icon: Settings },
];

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-white border-r border-zinc-200/80 transform transition-all duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarExpanded ? 'w-60' : 'w-16'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Bar */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-200/80">
            {sidebarExpanded && (
              <Link to="/dashboard" className="flex items-center gap-2">
                <NileLogo size="sm" />
              </Link>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="hidden lg:flex p-1.5 hover:bg-zinc-100 rounded-md text-zinc-500 transition-colors"
              >
                <ChevronRight className={cn('h-4 w-4 transition-transform', !sidebarExpanded && 'rotate-180')} />
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 hover:bg-zinc-100 rounded-md text-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Clean Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const handleMouseEnter = () => {
                // Component Chunk Prefetching
                switch (item.href) {
                  case '/dashboard/services':
                    servicesImport();
                    break;
                  case '/dashboard/bookings':
                    bookingsImport();
                    break;
                  case '/dashboard/customers':
                    customersImport();
                    break;
                  case '/dashboard/staff':
                    staffImport();
                    break;
                  case '/dashboard/invoices':
                    invoicesImport();
                    break;
                  case '/dashboard/financial':
                    financialImport();
                    break;
                  case '/dashboard/settings':
                    settingsImport();
                    break;
                  default:
                    break;
                }

                // Data Prefetching
                if (item.href === '/dashboard/services') {
                  queryClient.prefetchQuery({ queryKey: queryKeys.merchant.services(), queryFn: () => serviceApi.getServices() });
                  queryClient.prefetchQuery({ queryKey: queryKeys.merchant.categories, queryFn: () => categoryApi.getCategories() });
                } else if (item.href === '/dashboard/bookings') {
                  queryClient.prefetchQuery({ queryKey: queryKeys.merchant.bookings(), queryFn: () => bookingApi.getBookings() });
                } else if (item.href === '/dashboard') {
                  queryClient.prefetchQuery({ queryKey: queryKeys.merchant.dashboard, queryFn: () => dashboardApi.getSummary() });
                }
              };
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  onMouseEnter={handleMouseEnter}
                  onFocus={handleMouseEnter}
                  className={cn(
                    'flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-zinc-900 text-white shadow-none'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  )}
                >
                  <item.icon className={cn('h-4 w-4 flex-shrink-0', sidebarExpanded ? 'mr-3' : 'mx-auto')} />
                  {sidebarExpanded && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Account Footer (Ecosystem links completely removed as requested) */}
          <div className="px-3 py-3 border-t border-zinc-200/80 bg-zinc-50/50">
            {sidebarExpanded && (
              <div className="mb-2 px-1">
                <p className="text-xs font-medium text-zinc-900 truncate">
                  {user?.businessName || user?.name}
                </p>
                <p className="text-[11px] text-zinc-400 font-normal truncate">{user?.email}</p>
              </div>
            )}
            <button
              onClick={logout}
              className={cn(
                'w-full flex items-center px-2 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 rounded-md transition-colors',
                !sidebarExpanded && 'justify-center px-0'
              )}
            >
              <LogOut className={cn('h-3.5 w-3.5', sidebarExpanded ? 'mr-2' : '')} />
              {sidebarExpanded && <span>Log Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 px-2 py-1.5 grid grid-cols-4 gap-1">
        {navigation.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 rounded-md text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-zinc-900 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <item.icon className="h-4 w-4 mb-0.5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Main Content Workspace */}
      <div className={cn('transition-all duration-200 pb-16 lg:pb-0', sidebarExpanded ? 'lg:pl-60' : 'lg:pl-16')}>
        
        {/* Minimal Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200/80">
          <div className="flex items-center justify-between h-14 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 hover:bg-zinc-100 rounded-md text-zinc-700"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <a
                href={getStorefrontUrl(user?.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-900 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-all shadow-sm"
              >
                <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>View Website</span>
                <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0" />
              </a>
            </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="p-0">
          <Suspense fallback={
            <div className="p-8 w-full animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="h-32 bg-gray-200 rounded-xl"></div>
                <div className="h-32 bg-gray-200 rounded-xl"></div>
                <div className="h-32 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded-xl"></div>
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};
