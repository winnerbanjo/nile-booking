/**
 * Subdomain Routing Utility
 * Extracts tenant slug from hostname for dynamic subdomain routing
 * Supports: nilebooking.co, www.nilebooking.co, and *.nilebooking.co subdomains
 */

export interface TenantConfig {
  slug: string | null;
  isMainSite: boolean;
}

/**
 * Gets the subdomain slug from the current hostname
 * 100% safe routing logic - prevents routing loops
 * @returns string | null - The subdomain slug or null if main site
 */
export const getSubdomain = (): string | null => {
  try {
    // Safety check: return null during build or if window is undefined
    if (typeof window === 'undefined' || !window.location) {
      console.log("DEBUG: Window undefined, returning null");
      return null;
    }

    const host = window.location.hostname;
    const path = window.location.pathname;
    
    // SAFE-MODE LOGGING: Log hostname at the very top
    console.log("HOSTNAME DETECTED:", host);
    console.log("PATH DETECTED:", path);
    
    // SUBDOMAIN BYPASS: If path is '/register' or '/login', return NULL immediately
    // This ensures subdomain logic NEVER interferes with sign-up process
    if (path === '/register' || path === '/login') {
      console.log("DEBUG: Detected Subdomain: null (register/login path - bypass subdomain)");
      return null; // Force main site routing for sign-up process
    }
    
    // MARKETING PATHS: Return null for other main marketing paths, even if subdomain is present
    // This allows /about, /pricing, etc. to work on main domain
    const marketingPaths = ['/about', '/pricing', '/product', '/solutions', 
                           '/contact', '/blog', '/careers', '/documentation', '/help', '/privacy', 
                           '/terms', '/linknest', '/collective'];
    if (marketingPaths.includes(path)) {
      console.log("DEBUG: Detected Subdomain: null (marketing path - bypass subdomain)");
      return null; // Force main site routing for marketing paths
    }
    
    // SUBDOMAIN CATCHER: Extract slug correctly from nilebooking.co
    // Logic: If host includes 'nilebooking.co' and is NOT 'www.nilebooking.co' or exact 'nilebooking.co', extract slug
    if (host.includes('nilebooking.co') && host !== 'nilebooking.co' && host !== 'www.nilebooking.co') {
      const parts = host.split('.');
      // Ensure it's a subdomain (at least 3 parts: subdomain.nilebooking.co)
      if (parts.length >= 3 && parts[parts.length - 2] === 'nilebooking' && parts[parts.length - 1] === 'co') {
        const slug = parts[0];
        // Safety check: prevent 'www' or empty from being returned
        if (slug && slug !== 'www' && slug !== '') {
          console.log("Detected Subdomain:", slug);
          return slug;
        }
      }
    }
    
    // Also return null for vercel.app domains
    if (host.includes('vercel.app')) {
      console.log("DEBUG: Detected Subdomain: null (vercel.app - main site)");
      return null; // Force main site routing
    }
    
    console.log("Detected Subdomain: null (no subdomain match)");
    return null;
  } catch (error) {
    console.error("Error in getSubdomain:", error);
    return null;
  }
};

/**
 * Gets the tenant configuration from the current hostname
 * @returns TenantConfig with slug (null for main site) and isMainSite flag
 */
export const getTenantConfig = (): TenantConfig => {
  try {
    // Safety check: return main site config during build or if window is undefined
    if (typeof window === 'undefined' || !window.location) {
      return { slug: null, isMainSite: true };
    }

    const slug = getSubdomain();
    
    if (slug) {
      return { slug, isMainSite: false };
    }
  
    return { slug: null, isMainSite: true };
  } catch (error) {
    console.error("Error in getTenantConfig:", error);
    return { slug: null, isMainSite: true };
  }
};

/**
 * Checks if the current hostname indicates a tenant subdomain
 * @returns true if a tenant slug is detected
 */
export const isTenantSubdomain = (): boolean => {
  const config = getTenantConfig();
  return !config.isMainSite && config.slug !== null;
};

/**
 * Returns full URL to merchant storefront (subdomain on production, path on local/dev)
 */
export const getStorefrontUrl = (slug?: string | null): string => {
  const merchantSlug = slug || 'the-modern-barber';
  if (typeof window === 'undefined') return `/p/${merchantSlug}`;
  
  const host = window.location.hostname;
  const protocol = window.location.protocol;

  if (host.includes('nilebooking.co')) {
    return `${protocol}//${merchantSlug}.nilebooking.co`;
  }
  return `/p/${merchantSlug}`;
};
