import React, { useEffect, useState, Suspense } from 'react';
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
  GalleryHorizontal,
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
import { PageErrorBoundary } from './PageErrorBoundary';

const navigation = [
  { name: 'Dashboard', shortName: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Calendar', shortName: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Bookings', shortName: 'Bookings', href: '/dashboard/bookings', icon: BookOpen },
  { name: 'Customers (CRM)', shortName: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Services', shortName: 'Services', href: '/dashboard/services', icon: Package },
  { name: 'Staff', shortName: 'Staff', href: '/dashboard/staff', icon: UserCheck },
  { name: 'Sales (POS)', shortName: 'Sales', href: '/dashboard/sales', icon: ShoppingBag },
  { name: 'Marketing', shortName: 'Marketing', href: '/dashboard/marketing', icon: TrendingUp },
  { name: 'Reviews', shortName: 'Reviews', href: '/dashboard/reviews', icon: Star },
  { name: 'Portfolio', shortName: 'Portfolio', href: '/dashboard/portfolio', icon: GalleryHorizontal },
  { name: 'Discounts', shortName: 'Discounts', href: '/dashboard/discounts', icon: Tag },
  { name: 'Invoices', shortName: 'Invoices', href: '/dashboard/invoices', icon: FileSpreadsheet },
  { name: 'Finance', shortName: 'Finance', href: '/dashboard/financial', icon: DollarSign },
  { name: 'Availability', shortName: 'Availability', href: '/dashboard/settings', icon: Calendar },
  { name: 'Domains', shortName: 'Domains', href: '/dashboard/domains', icon: Globe },
  { name: 'Edit Website', shortName: 'Website', href: '/dashboard/profile', icon: Settings },
];

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 1024px)').matches
  );
  const location = useLocation();
  const { user, logout } = useAuth();

  // Collapsing is a desktop-only affordance. The mobile drawer always shows
  // full labels, even if the rail was collapsed before the viewport shrank.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const syncViewport = () => setIsDesktop(query.matches);
    syncViewport();
    query.addEventListener('change', syncViewport);
    return () => query.removeEventListener('change', syncViewport);
  }, []);

  const sidebarLabelsVisible = sidebarExpanded || !isDesktop;

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
          sidebarLabelsVisible ? 'w-60' : 'w-16'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Bar */}
          <div className="flex h-14 items-center gap-2 border-b border-zinc-200/80 px-3">
            {sidebarLabelsVisible ? (
              <Link to="/dashboard" className="flex min-w-0 flex-1 items-center gap-2">
                <NileLogo size="sm" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setSidebarExpanded(true)}
                title="Expand sidebar"
                aria-label="Expand sidebar"
                className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              >
                <NileLogo size="sm" showText={false} />
              </button>
            )}
            <div className={cn('flex shrink-0 items-center gap-1', sidebarLabelsVisible ? 'ml-auto' : 'lg:hidden')}>
              {sidebarLabelsVisible && (
                <button
                  type="button"
                  onClick={() => setSidebarExpanded(false)}
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                  className="hidden h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 lg:flex"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close navigation"
                className="rounded-md p-1.5 text-zinc-700 transition-colors hover:bg-zinc-100 lg:hidden"
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
                  title={sidebarLabelsVisible ? undefined : item.name}
                  aria-label={sidebarLabelsVisible ? undefined : item.name}
                  className={cn(
                    'flex items-center rounded-l-lg text-xs font-medium transition-colors',
                    sidebarLabelsVisible ? 'px-3 py-2' : 'justify-center py-2',
                    isActive
                      ? 'bg-zinc-900 text-white shadow-none'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  )}
                >
                  <item.icon className={cn('h-4 w-4 flex-shrink-0', sidebarLabelsVisible && 'mr-3')} />
                  {sidebarLabelsVisible ? (
                    <span className="truncate">{item.name}</span>
                  ) : (
                    <span className="sr-only">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Account Footer (Ecosystem links completely removed as requested) */}
          <div className={cn('border-t border-zinc-200/80 bg-zinc-50/50 pb-20 pt-3 lg:pb-3', sidebarLabelsVisible ? 'px-3' : 'px-2')}>
            {sidebarLabelsVisible && (
              <div className="mb-2 px-1">
                <p className="text-xs font-medium text-zinc-900 truncate">
                  {user?.businessName || user?.name}
                </p>
                <p className="text-[11px] text-zinc-400 font-normal truncate">{user?.email}</p>
              </div>
            )}
            <button
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              className={cn(
                'w-full flex items-center py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 rounded-md transition-colors',
                sidebarLabelsVisible ? 'px-2' : 'justify-center px-0'
              )}
            >
              <LogOut className={cn('h-3.5 w-3.5 flex-shrink-0', sidebarLabelsVisible && 'mr-2')} />
              {sidebarLabelsVisible && <span>Log Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 gap-1 border-t border-zinc-200 bg-white px-2 pb-[max(0.375rem,env(safe-area-inset-bottom))] pt-1.5 lg:hidden">
        {navigation.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              title={item.name}
              aria-label={item.name}
              className={cn(
                'flex min-w-0 flex-col items-center justify-center rounded-md px-0.5 py-1 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-zinc-900 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <item.icon className="mb-0.5 h-4 w-4 shrink-0" />
              <span className="w-full truncate text-center">{item.shortName}</span>
            </Link>
          );
        })}
      </div>

      {/* Main Content Workspace */}
      <div className={cn('transition-all duration-200 pb-16 lg:pb-0', sidebarLabelsVisible ? 'lg:pl-60' : 'lg:pl-16')}>
        
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
                href={getStorefrontUrl(user?.slug, user?.customDomain)}
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
          <PageErrorBoundary user={user} location={location}>
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
          </PageErrorBoundary>
        </main>
      </div>
    </div>
  );
};
