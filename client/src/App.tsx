import { Routes, Route, Link } from 'react-router-dom';
import { Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyOtp } from './pages/VerifyOtp';
import { Dashboard } from './pages/Dashboard';
import { Services } from './pages/Services';
import { Settings } from './pages/Settings';
import { PublicProvider } from './pages/PublicProvider';
import { Checkout } from './pages/Checkout';
import { Bookings } from './pages/Bookings';
import { Financial } from './pages/Financial';
import { Payments } from './pages/dashboard/Payments';
import { CustomDomains } from './pages/CustomDomains';
import { Profile } from './pages/Profile';
import { Marketing } from './pages/Marketing';
import { Pages } from './pages/Pages';
import { Customers } from './pages/Customers';
import { Staff } from './pages/Staff';
import { Invoices } from './pages/Invoices';
import { Calendar } from './pages/Calendar';
import { Sales } from './pages/Sales';
import { Reviews } from './pages/Reviews';
import { Discounts } from './pages/Discounts';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLogin } from './pages/admin/AdminLogin';
import { ReceiptVerification } from './pages/admin/ReceiptVerification';
import { Providers } from './pages/admin/Providers';
import { Bookings } from './pages/admin/Bookings';
import { Customers } from './pages/admin/Customers';
import { Transactions } from './pages/admin/Transactions';
import { AdminLayout } from './components/admin/AdminLayout';
import { Navbar } from './components/marketing/Navbar';
import { Footer } from './components/marketing/Footer';
import { Landing } from './pages/marketing/Landing';
import { Product } from './pages/marketing/Product';
import { Solutions } from './pages/marketing/Solutions';
import { HowItWorks } from './pages/marketing/HowItWorks';
import { Pricing } from './pages/marketing/Pricing';
import { FaqPage } from './pages/marketing/FaqPage';
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { TermsOfService } from './pages/legal/TermsOfService';
import { RefundPolicy } from './pages/legal/RefundPolicy';
import { CookiePolicy } from './pages/legal/CookiePolicy';
import { LinkNest } from './pages/ecosystem/LinkNest';
import { NileCollective } from './pages/ecosystem/NileCollective';

// ─── Subdomain detection ──────────────────────────────────────────────────────
// Reads window.location.hostname directly every time App renders.
// This is 100% reliable in the browser — window is always defined here.
function getMerchantSlug(): string | null {
  const host = window.location.hostname.toLowerCase();
  const path = window.location.pathname;

  // Skip subdomain routing for auth/dashboard paths
  if (
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/verify-otp') ||
    path.startsWith('/dashboard') ||
    path.startsWith('/admin')
  ) {
    return null;
  }

  // e.g. "the-modern-chef.nilebooking.co" → "the-modern-chef"
  const match = host.match(/^([a-z0-9][a-z0-9-]*)\.nilebooking\.co$/);
  if (match && match[1] !== 'www') {
    console.log('[Nile] merchant subdomain:', match[1]);
    return match[1];
  }

  // Local dev subdomains (e.g. themodernchef.localhost)
  if (host !== 'localhost' && !host.includes('.') === false && host.endsWith('.localhost')) {
    const sub = host.split('.')[0];
    if (sub && sub !== 'www') return sub;
  }

  return null;
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 font-light">Loading...</p>
    </div>
  </div>
);

// ─── Error Boundary ───────────────────────────────────────────────────────────
class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Something went wrong</h1>
            <p className="text-zinc-500 mb-6">Please refresh the page to try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Storefront App (runs on *.nilebooking.co subdomains) ─────────────────────
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

// ─── Main App (runs on nilebooking.co main domain) ────────────────────────────
function MainApp() {
  return (
    <AuthProvider>
      <AppErrorBoundary>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />

          {/* Marketing */}
          <Route path="/" element={<Landing />} />
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

          {/* Public Storefront (path-based, for main domain) */}
          <Route
            path="/p/:slug"
            element={
              <Suspense fallback={<PageLoader />}>
                <PublicProvider />
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

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="services" element={<Services />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="customers" element={<Customers />} />
            <Route path="staff" element={<Staff />} />
            <Route path="sales" element={<Sales />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="financial" element={<Financial />} />
            <Route path="payments" element={<Payments />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="discounts" element={<Discounts />} />
            <Route path="settings" element={<Settings />} />
            <Route path="domains" element={<CustomDomains />} />
            <Route path="pages" element={<Pages />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Admin */}
          <Route path="/admin/portal" element={<AdminLogin />} />
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
                  <Bookings />
                </AdminLayout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <ProtectedAdminRoute>
                <AdminLayout>
                  <Customers />
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
            path="/admin/finance"
            element={
              <ProtectedAdminRoute>
                <AdminLayout>
                  <div className="bg-white border border-gray-200 rounded-xl p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Financial Overview</h1>
                    <p className="text-gray-500">Coming Soon</p>
                  </div>
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
      </AppErrorBoundary>
    </AuthProvider>
  );
}

// ─── Root App — single branch decision ───────────────────────────────────────
function App() {
  // getMerchantSlug() is called at render time — always reads the CURRENT
  // window.location.hostname, which is 100% correct in the browser.
  const merchantSlug = getMerchantSlug();

  if (merchantSlug) {
    return <StorefrontApp slug={merchantSlug} />;
  }
  return <MainApp />;
}

export default App;
