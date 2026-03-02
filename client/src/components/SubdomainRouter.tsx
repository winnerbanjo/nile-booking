import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTenantConfig } from '../lib/subdomain';

interface SubdomainRouterProps {
  children: React.ReactNode;
}

/**
 * SubdomainRouter Component
 * Handles automatic routing to /p/:slug when a tenant subdomain is detected
 * This makes subdomains like 'anybarber.nilebooking.co' work seamlessly
 * The URL path will be set to /p/:slug internally, but the subdomain remains visible
 */
export const SubdomainRouter: React.FC<SubdomainRouterProps> = ({ children }) => {
  // Router hooks must be called unconditionally (React rules)
  // They will work because BrowserRouter is in main.tsx
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    try {
      const tenantConfig = getTenantConfig();
      
      // Marketing paths that should always use main site routing (bypass subdomain)
      const marketingPaths = ['/login', '/register', '/about', '/pricing', '/product', '/solutions', 
                             '/contact', '/blog', '/careers', '/documentation', '/help', '/privacy', 
                             '/terms', '/linknest', '/collective'];
      const isMarketingPath = marketingPaths.includes(location.pathname);
      
      // Don't redirect if we're on a marketing path - allow main site routing
      if (isMarketingPath) {
        console.log("SubdomainRouter: Marketing path detected, bypassing subdomain redirect");
        return;
      }
      
      // Only redirect if we have a valid slug and we're not already on the correct path
      if (tenantConfig.slug && tenantConfig.slug !== null) {
        // If we're on root path or not on the public provider page, redirect to /p/:slug
        if (location.pathname === '/' || !location.pathname.startsWith('/p/')) {
          console.log("SubdomainRouter: Redirecting to /p/", tenantConfig.slug);
          navigate(`/p/${tenantConfig.slug}`, { replace: true });
        }
      } else {
        // Ensure we're not stuck on /p/ path when there's no subdomain
        if (location.pathname.startsWith('/p/') && !tenantConfig.slug) {
          console.log("SubdomainRouter: No subdomain detected, staying on current path");
        }
      }
    } catch (error) {
      console.error("SubdomainRouter error:", error);
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
};
