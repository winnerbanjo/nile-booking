import { lazy, Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { AdminLayout } from './components/admin/AdminLayout';

// Core routes kept static for instant rendering
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyOtp } from './pages/VerifyOtp';
import { Dashboard } from './pages/Dashboard';
import { PublicProvider } from './pages/PublicProvider';
import { Checkout } from './pages/Checkout';

// Lazy-loaded Merchant Sub-routes
export const servicesImport = () => import('./pages/Services').then((m) => ({ default: m.Services }));
const Services = lazy(servicesImport);
export const categoriesImport = () => import('./pages/dashboard/Categories').then((m) => ({ default: m.Categories }));
const Categories = lazy(categoriesImport);
export const settingsImport = () => import('./pages/Settings').then((m) => ({ default: m.Settings }));
const Settings = lazy(settingsImport);
export const bookingsImport = () => import('./pages/Bookings').then((m) => ({ default: m.Bookings }));
const Bookings = lazy(bookingsImport);
export const financialImport = () => import('./pages/Financial').then((m) => ({ default: m.Financial }));
const Financial = lazy(financialImport);
export const paymentsImport = () => import('./pages/dashboard/Payments').then((m) => ({ default: m.Payments }));
const Payments = lazy(paymentsImport);
export const customersImport = () => import('./pages/Customers').then((m) => ({ default: m.Customers }));
const Customers = lazy(customersImport);
export const staffImport = () => import('./pages/Staff').then((m) => ({ default: m.Staff }));
const Staff = lazy(staffImport);
export const invoicesImport = () => import('./pages/Invoices').then((m) => ({ default: m.Invoices }));
const Invoices = lazy(invoicesImport);

const CustomDomains = lazy(() => import('./pages/CustomDomains').then((m) => ({ default: m.CustomDomains })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const Marketing = lazy(() => import('./pages/Marketing').then((m) => ({ default: m.Marketing })));
const Pages = lazy(() => import('./pages/Pages').then((m) => ({ default: m.Pages })));
const Calendar = lazy(() => import('./pages/Calendar').then((m) => ({ default: m.Calendar })));
const Sales = lazy(() => import('./pages/Sales').then((m) => ({ default: m.Sales })));
const Reviews = lazy(() => import('./pages/Reviews').then((m) => ({ default: m.Reviews })));
const Portfolio = lazy(() => import('./pages/Portfolio').then((m) => ({ default: m.Portfolio })));
const Discounts = lazy(() => import('./pages/Discounts').then((m) => ({ default: m.Discounts })));

// Lazy-loaded Admin Routes
export const adminDashboardImport = () => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }));
const AdminDashboard = lazy(adminDashboardImport);
export const adminProvidersImport = () => import('./pages/admin/Providers').then((m) => ({ default: m.Providers }));
const Providers = lazy(adminProvidersImport);
export const adminBookingsImport = () => import('./pages/admin/Bookings').then((m) => ({ default: m.Bookings }));
const AdminBookings = lazy(adminBookingsImport);
export const adminTransactionsImport = () => import('./pages/admin/Transactions').then((m) => ({ default: m.Transactions }));
const Transactions = lazy(adminTransactionsImport);

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })));
const ReceiptVerification = lazy(() => import('./pages/admin/ReceiptVerification').then((m) => ({ default: m.ReceiptVerification })));
const AdminCustomers = lazy(() => import('./pages/admin/Customers').then((m) => ({ default: m.Customers })));
const Risk = lazy(() => import('./pages/admin/Risk').then((m) => ({ default: m.Risk })));
const Payouts = lazy(() => import('./pages/admin/Payouts').then((m) => ({ default: m.Payouts })));
const Refunds = lazy(() => import('./pages/admin/Refunds').then((m) => ({ default: m.Refunds })));
const AdminSettings = lazy(() => import('./pages/admin/Settings').then((m) => ({ default: m.Settings })));


// Lazy-loaded Marketing & Legal Routes
const Navbar = lazy(() => import('./components/marketing/Navbar').then((m) => ({ default: m.Navbar })));
const Footer = lazy(() => import('./components/marketing/Footer').then((m) => ({ default: m.Footer })));
const Landing = lazy(() => import('./pages/marketing/Landing').then((m) => ({ default: m.Landing })));
const Product = lazy(() => import('./pages/marketing/Product').then((m) => ({ default: m.Product })));
const Solutions = lazy(() => import('./pages/marketing/Solutions').then((m) => ({ default: m.Solutions })));
const HowItWorks = lazy(() => import('./pages/marketing/HowItWorks').then((m) => ({ default: m.HowItWorks })));
const Pricing = lazy(() => import('./pages/marketing/Pricing').then((m) => ({ default: m.Pricing })));
const FaqPage = lazy(() => import('./pages/marketing/FaqPage').then((m) => ({ default: m.FaqPage })));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService').then((m) => ({ default: m.TermsOfService })));
const RefundPolicy = lazy(() => import('./pages/legal/RefundPolicy').then((m) => ({ default: m.RefundPolicy })));
const CookiePolicy = lazy(() => import('./pages/legal/CookiePolicy').then((m) => ({ default: m.CookiePolicy })));
const LinkNest = lazy(() => import('./pages/ecosystem/LinkNest').then((m) => ({ default: m.LinkNest })));
const NileCollective = lazy(() => import('./pages/ecosystem/NileCollective').then((m) => ({ default: m.NileCollective })));

function getMerchantSlug(): string | null {
  const host = window.location.hostname.toLowerCase();
  const path = window.location.pathname;

  if (
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/verify-otp') ||
    path.startsWith('/dashboard') ||
    path.startsWith('/admin')
  ) {
    return null;
  }

  const match = host.match(/^([a-z0-9][a-z0-9-]*)\.nilebooking\.co$/);
  if (match && match[1] !== 'www' && match[1] !== 'app') {
    return match[1];
  }

  if (host !== 'localhost' && !host.includes('.') === false && host.endsWith('.localhost')) {
    const sub = host.split('.')[0];
    if (sub && sub !== 'www' && sub !== 'app') return sub;
  }

  return null;
}

const PageLoader = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="text-center">
      <div className="w-10 h-10 border-3 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
    </div>
  </div>
);

interface ErrorBoundaryProps {
  children: ReactNode;
  location: any;
  user: any;
  logout?: () => void;
}

class AppErrorBoundaryInner extends Component<
  ErrorBoundaryProps,
  { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null; errorId: string; retryCount: number }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, errorId: '', retryCount: 0 };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorId: Math.random().toString(36).substring(2, 9).toUpperCase() };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorMsg = error.message || '';
    const isChunkError = 
      errorMsg.includes('ChunkLoadError') || 
      errorMsg.includes('Loading chunk failed') || 
      errorMsg.includes('Failed to fetch dynamically imported module') ||
      errorMsg.includes('Importing a module script failed');

    const deploymentVersion = import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA || 'unknown';
    const reloadKey = `chunk_reload_${deploymentVersion}`;

    if (isChunkError) {
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, 'true');
        window.location.reload();
        return;
      }
    }

    // Log the error carefully without sensitive data
    console.error(`[AppCrash-${this.state.errorId}] Unhandled Runtime Error:`);
    console.error(`Message: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error(`Component Stack: ${errorInfo.componentStack}`);
    console.error(`Current Route: ${this.props.location?.pathname}${this.props.location?.search}`);
    if (this.props.user) {
      console.error(`User Role: ${this.props.user.role}, ID: ${this.props.user._id}`);
    }

    // Fire and forget to backend
    fetch('/api/system/frontend-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referenceId: this.state.errorId,
        message: error.message,
        stack: error.stack ? error.stack.substring(0, 1000) : '',
        componentStack: errorInfo.componentStack ? errorInfo.componentStack.substring(0, 1000) : '',
        route: `${this.props.location?.pathname || ''}${this.props.location?.search || ''}`,
        userId: this.props.user?._id,
        userRole: this.props.user?.role,
        deploymentVersion,
        browser: navigator.userAgent,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        timestamp: new Date().toISOString()
      })
    }).catch(() => { /* Ignore failure */ });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
              <p className="text-sm text-gray-500">We encountered an unexpected error while loading this page.</p>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs font-mono text-gray-500 border border-gray-100">
                Error Ref: {this.state.errorId}
              </div>
            </div>
            
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => {
                  if (this.state.retryCount > 1) {
                    window.location.reload();
                  } else {
                    this.setState(prev => ({ hasError: false, error: null, errorId: '', retryCount: prev.retryCount + 1 }));
                  }
                }}
                className="w-full px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors"
              >
                Try Again
              </button>
              <a
                href={this.props.user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                className="w-full px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors inline-block"
              >
                Return to Dashboard
              </a>
              {this.props.user && (
                <button
                  onClick={() => {
                    if (this.props.logout) {
                      this.props.logout();
                      window.location.href = '/login';
                    } else {
                      import('./lib/queryClient').then(({ queryClient }) => queryClient.clear());
                      localStorage.removeItem('token');
                      localStorage.removeItem('nile_user');
                      localStorage.removeItem('nile_dashboard_bookings');
                      localStorage.removeItem('nile_crm_cache');
                      sessionStorage.clear();
                      window.location.href = '/login';
                    }
                  }}
                  className="w-full px-6 py-2.5 text-gray-500 rounded-xl text-sm font-medium hover:text-red-600 transition-colors"
                >
                  Log Out
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppErrorBoundary({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  
  // Custom hook usage for location since useLocation is inside router
  // We need to conditionally use it if router context exists, but since we are inside BrowserRouter, we can just use window.location as fallback or use a hook inside another wrapper if needed.
  // Actually, useLocation() will work because we are in BrowserRouter in main.tsx
  let location: any = {};
  try {
    const reactRouterDom = require('react-router-dom');
    location = reactRouterDom.useLocation();
  } catch (e) {
    location = { pathname: window.location.pathname, search: window.location.search };
  }

  return <AppErrorBoundaryInner user={user} location={location} logout={logout}>{children}</AppErrorBoundaryInner>;
}

function StorefrontApp({ slug }: { slug: string }) {
  return (
    <AuthProvider>
      <AppErrorBoundary>
        <Routes>
          <Route
            path="*"
            element={
              <Suspense fallback={<PageLoader />}>
                <PublicProvider slug={slug} />
              </Suspense>
            }
          />
          <Route path="/checkout" element={<Checkout />} />
          <Route
            path="/checkout/success"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">Booking Successful!</h1>
                  <p className="text-gray-600">Your booking has been confirmed.</p>
                </div>
              </div>
            }
          />
        </Routes>
      </AppErrorBoundary>
    </AuthProvider>
  );
}

function RedirectToApp() {
  window.location.href = `https://app.nilebooking.co${window.location.pathname}${window.location.search}`;
  return null;
}

function RootRedirector() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

function MainApp() {
  const host = window.location.hostname.toLowerCase();
  const isAppSubdomain = host.startsWith('app.');
  const isProdMarketing = host === 'nilebooking.co' || host === 'www.nilebooking.co';

  return (
    <AuthProvider>
      <AppErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Auth */}
            <Route path="/login" element={isProdMarketing ? <RedirectToApp /> : <Login />} />
            <Route path="/register" element={isProdMarketing ? <RedirectToApp /> : <Register />} />
            <Route path="/verify-otp" element={isProdMarketing ? <RedirectToApp /> : <VerifyOtp />} />

            {/* Marketing */}
            <Route path="/" element={isAppSubdomain ? <RootRedirector /> : <Landing />} />
            <Route path="/product" element={<><Navbar /><Product /><Footer /></>} />
            <Route path="/solutions" element={<><Navbar /><Solutions /><Footer /></>} />
            <Route path="/how-it-works" element={<><Navbar /><HowItWorks /><Footer /></>} />
            <Route path="/pricing" element={<><Navbar /><Pricing /><Footer /></>} />
            <Route path="/faq" element={<><Navbar /><FaqPage /><Footer /></>} />

            {/* Legal */}
            <Route path="/legal/privacy" element={<><Navbar /><PrivacyPolicy /><Footer /></>} />
            <Route path="/legal/terms" element={<><Navbar /><TermsOfService /><Footer /></>} />
            <Route path="/legal/refund" element={<><Navbar /><RefundPolicy /><Footer /></>} />
            <Route path="/legal/cookies" element={<><Navbar /><CookiePolicy /><Footer /></>} />

            {/* Ecosystem */}
            <Route path="/linknest" element={<><Navbar /><LinkNest /><Footer /></>} />
            <Route path="/collective" element={<><Navbar /><NileCollective /><Footer /></>} />

            {/* Public Storefront */}
            <Route
              path="/p/:slug"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PublicProvider />
                </Suspense>
              }
            />
            <Route path="/checkout" element={<Checkout />} />

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={
                isProdMarketing ? (
                  <RedirectToApp />
                ) : (
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                )
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="services" element={<Services />} />
              <Route path="services/categories" element={<Categories />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="customers" element={<Customers />} />
              <Route path="staff" element={<Staff />} />
              <Route path="sales" element={<Sales />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="financial" element={<Financial />} />
              <Route path="payments" element={<Payments />} />
              <Route path="marketing" element={<Marketing />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="portfolio" element={<Portfolio />} />
              <Route path="discounts" element={<Discounts />} />
              <Route path="settings" element={<Settings />} />
              <Route path="domains" element={<CustomDomains />} />
              <Route path="pages" element={<Pages />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Admin */}
            <Route path="/admin/portal" element={isProdMarketing ? <RedirectToApp /> : <AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/verification"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <ReceiptVerification />
                  </AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/providers"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <Providers />
                  </AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <AdminBookings />
                  </AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <AdminCustomers />
                  </AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/transactions"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <Transactions />
                  </AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/risk"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <Risk />
                  </AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/payouts"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <Payouts />
                  </AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/refunds"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <Refunds />
                  </AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <AdminSettings />
                  </AdminLayout>
                </ProtectedAdminRoute>
              }
            />

            {/* 404 */}
            <Route
              path="*"
              element={
                <>
                  <Navbar />
                  <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] flex items-center justify-center px-4">
                    <div className="text-center max-w-2xl">
                      <h1 className="text-6xl md:text-7xl font-black text-gray-900 mb-6 tracking-tighter">
                        404
                      </h1>
                      <p className="text-xl text-gray-600 mb-8 font-light">
                        Page not found | The page you're looking for doesn't exist.
                      </p>
                      <Button
                        size="lg"
                        className="rounded-full px-8 py-6 text-lg font-semibold bg-[#22c55e] text-white hover:bg-green-600 h-auto tracking-tight"
                        asChild
                      >
                        <Link to="/">Go Home</Link>
                      </Button>
                    </div>
                  </div>
                  <Footer />
                </>
              }
            />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
    </AuthProvider>
  );
}

function App() {
  const merchantSlug = getMerchantSlug();

  if (merchantSlug) {
    return <StorefrontApp slug={merchantSlug} />;
  }
  return <MainApp />;
}

export default App;
