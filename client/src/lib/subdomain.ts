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
 * 100% safe routing logic - extracts subdomain cleanly on production Vercel
 * @returns string | null - The subdomain slug or null if main site
 */
export const getSubdomain = (): string | null => {
  try {
    if (typeof window === 'undefined' || !window.location) {
      return null;
    }

    const host = window.location.hostname.toLowerCase().trim();
    const path = window.location.pathname;

    // Bypass auth, dashboard, and admin paths
    if (
      path.startsWith('/login') ||
      path.startsWith('/register') ||
      path.startsWith('/verify-otp') ||
      path.startsWith('/dashboard') ||
      path.startsWith('/admin')
    ) {
      return null;
    }

    // Production wildcard subdomains (*.nilebooking.co)
    if (host.endsWith('nilebooking.co')) {
      const parts = host.split('.');
      // e.g. ['the-modern-barber', 'nilebooking', 'co']
      if (parts.length > 2) {
        const sub = parts[0];
        if (sub && sub !== 'www' && sub !== 'nilebooking') {
          return sub;
        }
      }
    }

    // Vercel preview domains (*.vercel.app)
    if (host.endsWith('.vercel.app')) {
      const sub = host.split('.')[0];
      if (sub && sub !== 'www' && !sub.startsWith('nile-booking')) {
        return sub;
      }
    }

    // Local development subdomains (*.localhost)
    if (host.includes('.') && !host.startsWith('www.')) {
      const sub = host.split('.')[0];
      if (sub && sub !== 'localhost' && sub !== '127' && sub !== 'www') {
        return sub;
      }
    }

    return null;
  } catch (error) {
    console.error('Error in getSubdomain:', error);
    return null;
  }
};

/**
 * Gets the tenant configuration from the current hostname
 * @returns TenantConfig with slug (null for main site) and isMainSite flag
 */
export const getTenantConfig = (): TenantConfig => {
  try {
    if (typeof window === 'undefined' || !window.location) {
      return { slug: null, isMainSite: true };
    }

    const slug = getSubdomain();
    if (slug) {
      return { slug, isMainSite: false };
    }
    return { slug: null, isMainSite: true };
  } catch (error) {
    console.error('Error in getTenantConfig:', error);
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
