import React, { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { NileLogo } from '../ui/NileLogo';
import * as html2canvas from 'html2canvas';

// Hard-fix: Ensure html2canvas is globally available
declare global {
  interface Window {
    html2canvas: typeof html2canvas.default | typeof html2canvas;
  }
}

if (typeof window !== 'undefined') {
  window.html2canvas = html2canvas.default || html2canvas;
}

interface ShareCardProps {
  industry?: 'barber' | 'fitness' | 'beauty';
}

const INDUSTRY_IMAGES = {
  barber: '/latino-hair-salon-owner-taking-care-client.jpg',
  fitness: '/handsome-black-man-is-engaged-gym.jpg',
  beauty: '/young-woman-taking-care-boy-s-afro-hair.jpg',
};

export const ShareCard: React.FC<ShareCardProps> = ({ industry = 'barber' }) => {
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const sanitizedFlyerRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const businessName = user?.businessName || 'Your Business';
  const businessSlug = user?.slug || 'yourbusiness';
  const businessUrl = `${businessSlug}.nilebooking.co`;
  const instagramHandle = user?.socialHandles?.instagram || '@yourbusiness';
  const twitterHandle = user?.socialHandles?.twitter || '@yourbusiness';

  const handleDownload = async () => {
    if (!sanitizedFlyerRef.current) return;

    setDownloading(true);
    try {
      // Wait a bit for images to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Handle both default and namespace imports
      const html2canvasFn = window.html2canvas || html2canvas.default || html2canvas;
      
      console.log('Starting html2canvas conversion...');
      
      try {
        const canvas = await html2canvasFn(sanitizedFlyerRef.current, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#FFFFFF',
          scale: 2, // High-res quality
          logging: true,
          imageTimeout: 15000,
        });

        console.log('Canvas created successfully, generating download...');
        const link = document.createElement('a');
        link.download = `nile-booking-flyer-${businessSlug}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('Download initiated successfully');
      } catch (captureError: any) {
        // Log specific CSS property issues
        console.error('Capture failed - checking CSS properties...');
        const element = sanitizedFlyerRef.current;
        if (element) {
          const computedStyle = window.getComputedStyle(element);
          console.error('Root element computed styles:', {
            backgroundColor: computedStyle.backgroundColor,
            color: computedStyle.color,
            backgroundImage: computedStyle.backgroundImage,
            filter: computedStyle.filter,
            backdropFilter: computedStyle.backdropFilter,
          });
          
          // Check for problematic color functions in inline styles
          const styles = element.getAttribute('style') || '';
          if (styles.includes('oklch') || styles.includes('oklab')) {
            console.error('Found oklch/oklab in root inline styles:', styles);
          }
          
          // Check all child elements for problematic CSS
          const allElements = element.querySelectorAll('*');
          allElements.forEach((el, index) => {
            const elStyle = window.getComputedStyle(el);
            const elInlineStyle = el.getAttribute('style') || '';
            const bgColor = elStyle.backgroundColor;
            const textColor = elStyle.color;
            
            // Check if computed colors contain oklch/oklab
            if (bgColor && (bgColor.includes('oklch') || bgColor.includes('oklab'))) {
              console.error(`Element ${index} has problematic backgroundColor:`, bgColor, el);
            }
            if (textColor && (textColor.includes('oklch') || textColor.includes('oklab'))) {
              console.error(`Element ${index} has problematic color:`, textColor, el);
            }
            if (elInlineStyle.includes('oklch') || elInlineStyle.includes('oklab')) {
              console.error(`Element ${index} has oklch/oklab in inline styles:`, elInlineStyle, el);
            }
          });
        }
        throw captureError;
      }
    } catch (error: any) {
      console.error('Failed to generate flyer - Full error details:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      // Check for specific CSS property errors
      if (error?.message?.includes('oklch') || error?.message?.includes('oklab')) {
        console.error('CSS Color Function Error: oklch/oklab detected in styles');
      }
      
      alert(`Failed to download flyer: ${error?.message || 'Unknown error'}. Check console for details.`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sanitized Flyer for Download - Hidden but accessible for html2canvas */}
      <div
        id="flyer-to-capture"
        ref={sanitizedFlyerRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '270px',
          height: '480px',
          backgroundColor: '#FFFFFF',
          overflow: 'hidden',
        }}
      >
        {/* Background Image */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        >
          <img
            src={INDUSTRY_IMAGES[industry]}
            alt="Industry background"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            crossOrigin="anonymous"
          />
          {/* Dark Gradient Overlay - Using rgba instead of Tailwind */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.8) 100%)',
            }}
          />
        </div>

        {/* Content */}
        <div
          style={{
            position: 'relative',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '32px',
            color: '#FFFFFF',
          }}
        >
          {/* Top: Logo */}
          <div
            style={{
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 8 C12 12, 20 20, 24 24 C28 28, 36 36, 40 40 M8 8 L8 40 M40 8 L40 40"
                stroke="#22C55E"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 8 Q16 16, 24 24 Q32 32, 40 8"
                stroke="#22C55E"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.6"
                fill="none"
              />
              <path
                d="M12 16 Q18 20, 24 24 Q30 28, 36 12"
                stroke="#22C55E"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.4"
                fill="none"
              />
            </svg>
          </div>

          {/* Middle: Business Info */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.8)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}
            >
              Now Booking
            </div>
            <div
              style={{
                fontSize: '30px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: '1.2',
                color: '#FFFFFF',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              }}
            >
              {businessName}
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.9)',
                marginTop: '16px',
              }}
            >
              {businessUrl}
            </div>
          </div>

          {/* Bottom: Tagline */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: '-0.01em',
              }}
            >
              Expertise, Organized
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        <div className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
          <div
            ref={cardRef}
            className="relative w-[270px] h-[480px] rounded-2xl overflow-hidden"
            style={{ aspectRatio: '9/16' }}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={INDUSTRY_IMAGES[industry]}
                alt="Industry background"
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col justify-between p-8 text-white">
              {/* Top: Logo */}
              <div className="text-center flex justify-center">
                <NileLogo size="sm" showText={false} className="text-white" />
              </div>

              {/* Middle: Business Info */}
              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                <div className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-2">
                  Now Booking
                </div>
                <div className="text-3xl font-black tracking-tighter leading-tight" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                  {businessName}
                </div>
                <div className="text-lg font-semibold text-white/90 mt-4">
                  {businessUrl}
                </div>
              </div>

              {/* Bottom: Tagline */}
              <div className="text-center">
                <div className="text-sm font-light text-white/70 tracking-tight">
                  Expertise, Organized
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleDownload}
          disabled={downloading}
          className="rounded-full bg-[#22c55e] text-white hover:bg-green-600 px-8 py-6 h-auto font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download Flyer
            </>
          )}
        </Button>
      </div>

      {/* Instructions */}
      <div className="text-center">
        <p className="text-sm text-gray-600 font-light">
          Share this flyer on social media | WhatsApp | Print
        </p>
      </div>
    </div>
  );
};
