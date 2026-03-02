import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Suspense, Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { SubdomainRouter } from './components/SubdomainRouter';
import { getTenantConfig, getSubdomain } from './lib/subdomain';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
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
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLogin } from './pages/admin/AdminLogin';
import { ReceiptVerification } from './pages/admin/ReceiptVerification';
import { Providers } from './pages/admin/Providers';
import { Navbar } from './components/marketing/Navbar';
import { Footer } from './components/marketing/Footer';
import { Landing } from './pages/marketing/Landing';
import { Product } from './pages/marketing/Product';
import { Solutions } from './pages/marketing/Solutions';
import { Pricing } from './pages/marketing/Pricing';
import { About } from './pages/marketing/About';
import { Careers } from './pages/marketing/Careers';
import { Contact } from './pages/marketing/Contact';
import { Blog } from './pages/marketing/Blog';
import { Documentation } from './pages/marketing/Documentation';
import { HelpCenter } from './pages/marketing/HelpCenter';
import { PrivacyPolicy } from './pages/marketing/PrivacyPolicy';
import { TermsOfService } from './pages/marketing/TermsOfService';
import { LinkNest } from './pages/ecosystem/LinkNest';
import { NileCollective } from './pages/ecosystem/NileCollective';

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 font-light">Loading...</p>
    </div>
  </div>
);

// Error Boundary for App Router
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
      // Fallback to landing page on error
      return (
        <>
          <Navbar />
          <Landing />
          <Footer />
        </>
      );
    }
    return this.props.children;
  }
}

// Homepage component that checks for subdomain
const HomePage = () => {
  // Use getSubdomain() to strictly catch subdomains on nilebooking.co
  const slug = getSubdomain();
  
  // CRITICAL: If slug is null or undefined, DEFINITELY render Landing page DIRECTLY
  if (!slug || slug === null || slug === undefined) {
    return (
      <>
        <Navbar />
        <Landing />
        <Footer />
      </>
    );
  }
  
  // If subdomain slug exists (e.g., 'the-modern-barber'), render PublicProvider with slug prop
  return (
    <Suspense fallback={<PageLoader />}>
      <PublicProvider slug={slug} />
    </Suspense>
  );
};

// Subdomain Router Wrapper Component
const SubdomainRouterWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  useEffect(() => {
    // Subdomain logic in useEffect - doesn't block initial render
    const subdomain = getSubdomain();
    const isMainPath = ['/login', '/register', '/dashboard', '/admin'].some(path => 
      location.pathname.startsWith(path)
    );
    
    // Only apply subdomain routing if subdomain exists and NOT a main path
    if (subdomain && !isMainPath) {
      console.log("SubdomainRouterWrapper: Subdomain detected, applying routing");
      // SubdomainRouter component will handle the redirect
    }
  }, [location.pathname]);
  
  return <>{children}</>;
};

function App() {
  console.log("APP INITIALIZING");
  
  // BYPASS SUBDOMAIN FOR AUTH: Force direct Routes for login/register
  if (typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
    return (
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </AuthProvider>
    );
  }
  
  // Check for subdomain at app level
  const subdomain = typeof window !== 'undefined' ? getSubdomain() : null;
  
  // If subdomain exists, render PublicProvider at root and redirect /p/:slug to /
  if (subdomain) {
    return (
      <AuthProvider>
        <AppErrorBoundary>
          <Routes>
            <Route path="/" element={
              <Suspense fallback={<PageLoader />}>
                <PublicProvider slug={subdomain} />
              </Suspense>
            } />
            <Route path="/p/:slug" element={<Navigate to="/" replace />} />
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
            {/* 404 Fallback for subdomain */}
            <Route
              path="*"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PublicProvider slug={subdomain} />
                </Suspense>
              }
            />
          </Routes>
        </AppErrorBoundary>
      </AuthProvider>
    );
  }
  
  try {
    return (
      <AuthProvider>
        <AppErrorBoundary>
          <SubdomainRouterWrapper>
            <SubdomainRouter>
              <Routes>
                {/* App Routes - Top Level */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Marketing Routes */}
                <Route
                  path="/"
                  element={<HomePage />}
                />
        <Route
          path="/product"
          element={
            <>
              <Navbar />
              <Product />
              <Footer />
            </>
          }
        />
        <Route
          path="/solutions"
          element={
            <>
              <Navbar />
              <Solutions />
              <Footer />
            </>
          }
        />
        <Route
          path="/pricing"
          element={
            <>
              <Navbar />
              <Pricing />
              <Footer />
            </>
          }
        />
        <Route
          path="/about"
          element={
            <>
              <Navbar />
              <About />
              <Footer />
            </>
          }
        />
        <Route
          path="/careers"
          element={
            <>
              <Navbar />
              <Careers />
              <Footer />
            </>
          }
        />
        <Route
          path="/contact"
          element={
            <>
              <Navbar />
              <Contact />
              <Footer />
            </>
          }
        />
        <Route
          path="/resources/blog"
          element={
            <>
              <Navbar />
              <Blog />
              <Footer />
            </>
          }
        />
        <Route
          path="/resources/docs"
          element={
            <>
              <Navbar />
              <Documentation />
              <Footer />
            </>
          }
        />
        <Route
          path="/resources/help"
          element={
            <>
              <Navbar />
              <HelpCenter />
              <Footer />
            </>
          }
        />
        <Route
          path="/legal/privacy"
          element={
            <>
              <Navbar />
              <PrivacyPolicy />
              <Footer />
            </>
          }
        />
        <Route
          path="/legal/terms"
          element={
            <>
              <Navbar />
              <TermsOfService />
              <Footer />
            </>
          }
        />

        {/* Ecosystem Routes */}
        <Route
          path="/linknest"
          element={
            <>
              <Navbar />
              <LinkNest />
              <Footer />
            </>
          }
        />
        <Route
          path="/collective"
          element={
            <>
              <Navbar />
              <NileCollective />
              <Footer />
            </>
          }
        />

        {/* Public Provider Route - Only for main domain (not subdomains) */}
        <Route path="/p/:slug" element={<PublicProvider />} />
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
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="services" element={<Services />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="financial" element={<Financial />} />
          <Route path="payments" element={<Payments />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="settings" element={<Settings />} />
          <Route path="domains" element={<CustomDomains />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Admin Routes - Strict RBAC */}
        <Route path="/admin/portal" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/verification"
          element={
            <ProtectedAdminRoute>
              <ReceiptVerification />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/providers"
          element={
            <ProtectedAdminRoute>
              <Providers />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/finance"
          element={
            <ProtectedAdminRoute>
              <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-8">
                <h1 className="text-4xl font-black mb-4">Financial Overview</h1>
                <p className="text-gray-400">Coming Soon</p>
              </div>
            </ProtectedAdminRoute>
          }
        />
        
        {/* 404 Fallback - Catch all unmatched routes */}
        <Route
          path="*"
          element={
            <>
              <Navbar />
              <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] flex items-center justify-center px-4">
                <div className="text-center max-w-2xl">
                  <h1 className="text-6xl md:text-7xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
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
            </SubdomainRouter>
          </SubdomainRouterWrapper>
        </AppErrorBoundary>
      </AuthProvider>
    );
  } catch (error) {
    console.error('App initialization error:', error);
    // Fallback to landing page on critical error
    return (
      <AuthProvider>
        <Navbar />
        <Landing />
        <Footer />
      </AuthProvider>
    );
  }
}

export default App;
