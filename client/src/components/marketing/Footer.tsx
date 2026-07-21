import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone } from 'lucide-react';
import { NileLogo } from '../ui/NileLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-zinc-200/80 py-16 px-4 sm:px-6 lg:px-8 text-zinc-600">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Navigation Columns Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-xs font-normal">
          
          {/* Product */}
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-900 tracking-tight">Product</h4>
            <ul className="space-y-2 text-zinc-500">
              <li><Link to="/product#features" className="hover:text-zinc-900 transition-colors">Features</Link></li>
              <li><Link to="/product#storefront" className="hover:text-zinc-900 transition-colors">Storefront</Link></li>
              <li><Link to="/product#domains" className="hover:text-zinc-900 transition-colors">Domains</Link></li>
              <li><Link to="/pricing" className="hover:text-zinc-900 transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Solutions */}
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-900 tracking-tight">Solutions</h4>
            <ul className="space-y-2 text-zinc-500">
              <li><Link to="/solutions#creators" className="hover:text-zinc-900 transition-colors">For Creators</Link></li>
              <li><Link to="/solutions#freelancers" className="hover:text-zinc-900 transition-colors">For Freelancers</Link></li>
              <li><Link to="/solutions#agencies" className="hover:text-zinc-900 transition-colors">For Agencies</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-900 tracking-tight">Resources</h4>
            <ul className="space-y-2 text-zinc-500">
              <li><Link to="/faq" className="hover:text-zinc-900 transition-colors">Blog</Link></li>
              <li><Link to="/faq" className="hover:text-zinc-900 transition-colors">Documentation</Link></li>
              <li><Link to="/faq" className="hover:text-zinc-900 transition-colors">Help Center</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-900 tracking-tight">Company</h4>
            <ul className="space-y-2 text-zinc-500">
              <li><Link to="/solutions" className="hover:text-zinc-900 transition-colors">About</Link></li>
              <li><Link to="/solutions" className="hover:text-zinc-900 transition-colors">Careers</Link></li>
              <li><Link to="/login" className="hover:text-zinc-900 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal Stack */}
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-900 tracking-tight">Legal</h4>
            <ul className="space-y-2 text-zinc-500">
              <li><Link to="/legal/privacy" className="hover:text-zinc-900 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/legal/terms" className="hover:text-zinc-900 transition-colors">Terms of Service</Link></li>
              <li><Link to="/legal/refund" className="hover:text-zinc-900 transition-colors">Refund & Cancellation Policy</Link></li>
              <li><Link to="/legal/cookies" className="hover:text-zinc-900 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Ecosystem */}
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-900 tracking-tight">Ecosystem</h4>
            <ul className="space-y-2 text-zinc-500">
              <li>
                <Link to="/linknest" className="hover:text-zinc-900 transition-colors block">
                  <span>LinkNest</span>
                  <span className="text-[10px] text-zinc-400 block font-light">For Creators</span>
                </Link>
              </li>
              <li>
                <a href="https://nile.ng/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors block">
                  <span>Nile</span>
                  <span className="text-[10px] text-zinc-400 block font-light">For Retailers</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* HQ Offices Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-zinc-200/80 text-xs">
          
          <div className="space-y-2">
            <h4 className="font-semibold text-zinc-900 tracking-tight">Lagos HQ</h4>
            <div className="text-zinc-500 space-y-1 font-normal leading-relaxed">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-zinc-400 shrink-0" />
                <span>Office 10 Ipaja, Modern Market, Lagos, Nigeria</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <a href="tel:+2348123843076" className="hover:text-zinc-900 transition-colors">
                  +234 812 384 3076
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-zinc-900 tracking-tight">USA HQ</h4>
            <div className="text-zinc-500 space-y-1 font-normal leading-relaxed">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-zinc-400 shrink-0" />
                <span>Nile Technologies Inc.<br />30 N Gould St Ste R<br />Sheridan, WY 82801, USA</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Copyright */}
        <div className="pt-8 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
          <div className="flex items-center gap-3">
            <NileLogo size="sm" />
            <p>© {new Date().getFullYear()} Nile Booking Technologies Inc. All rights reserved.</p>
          </div>
          <p className="font-mono text-[11px] text-zinc-400">Nile Booking — Built for people whose time is worth paying for.</p>
        </div>

      </div>
    </footer>
  );
};
