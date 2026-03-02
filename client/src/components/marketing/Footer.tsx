import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Linkedin, Facebook, MapPin, Phone, Mail, Building2 } from 'lucide-react';
import { NileLogo } from '../ui/NileLogo';

export const Footer: React.FC = () => {
  const footerColumns = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/product#features', type: 'route' },
        { label: 'AI', href: '/product#ai', type: 'route' },
        { label: 'Domains', href: '/product#domains', type: 'route' },
        { label: 'Pricing', href: '/pricing', type: 'route' },
      ],
    },
    {
      title: 'Solutions',
      links: [
        { label: 'For Creators', href: '/solutions#creators', type: 'route' },
        { label: 'For Freelancers', href: '/solutions#freelancers', type: 'route' },
        { label: 'For Agencies', href: '/solutions#agencies', type: 'route' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Blog', href: '/resources/blog', type: 'route' },
        { label: 'Documentation', href: '/resources/docs', type: 'route' },
        { label: 'Help Center', href: '/resources/help', type: 'route' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about', type: 'route' },
        { label: 'Careers', href: '/careers', type: 'route' },
        { label: 'Contact', href: '/contact', type: 'route' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/legal/privacy', type: 'route' },
        { label: 'Terms of Service', href: '/legal/terms', type: 'route' },
      ],
    },
    {
      title: 'Ecosystem',
      links: [
        { label: 'LinkNest', href: '/linknest', type: 'route', subtitle: 'For Creators' },
        { label: 'Nile Collective', href: '/collective', type: 'route', subtitle: 'Marketplace' },
        { label: 'Nile', href: 'https://nile.ng/', type: 'external', subtitle: 'For Retailers' },
      ],
    },
  ];

  return (
    <footer className="bg-white/40 backdrop-blur-2xl border-t border-white/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {footerColumns.map((column, index) => (
            <div key={index}>
              <h3 className="text-sm font-black text-gray-900 mb-4 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.type === 'external' ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors block group"
                        style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                      >
                        <span className="font-medium">{link.label}</span>
                        {link.subtitle && (
                          <span className="text-xs text-gray-500 block mt-1 font-light">{link.subtitle}</span>
                        )}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors block"
                        style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="grid md:grid-cols-3 gap-8 mb-12 pt-8 border-t border-white/30">
          <div>
            <h4 className="text-sm font-black text-gray-900 mb-4 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Lagos HQ
            </h4>
            <div className="space-y-2 text-sm text-gray-600 font-light">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Office 10 Ipaja, Modern Market, Lagos, Nigeria</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href="tel:+2348123843076" className="hover:text-gray-900 transition-colors">
                  +234 812 384 3076
                </a>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900 mb-4 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              USA HQ
            </h4>
            <div className="space-y-2 text-sm text-gray-600 font-light">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>NILE TECHNOLOGIES INC<br />30 N Gould St Ste R<br />Sheridan, WY 82801, USA</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900 mb-4 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Banking Details
            </h4>
            <div className="space-y-2 text-sm text-gray-600 font-light">
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Providus Bank<br />Account: 8123843076<br />NILE TECHNOLOGIES INC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-6 mb-8">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/70 transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5 text-gray-700" />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/70 transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin className="w-5 h-5 text-gray-700" />
          </a>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/70 transition-colors"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5 text-gray-700" />
          </a>
        </div>

        <div className="pt-8 border-t border-white/30">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Link to="/" className="inline-block">
                <NileLogo size="md" />
              </Link>
              <p className="text-sm text-gray-600 mt-2 font-light" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                Built for the next 100,000 African entrepreneurs.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-500 font-light">Powered by</span>
              <div className="flex items-center gap-4 opacity-60">
                <span className="text-sm font-medium text-gray-700">Paystack</span>
                <span className="text-sm font-medium text-gray-700">|</span>
                <span className="text-sm font-medium text-gray-700">Flutterwave</span>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-500 font-light">
            © {new Date().getFullYear()} Nile Booking. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
