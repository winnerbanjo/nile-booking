import React from 'react';

interface NileLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const NileLogo: React.FC<NileLogoProps> = ({ 
  className = '', 
  showText = true,
  size = 'md' 
}) => {
  // Determine stroke color based on className or context
  const isWhite = className?.includes('text-white');
  const strokeColor = isWhite ? 'currentColor' : '#22c55e';
  
  // Size mapping - default h-8 w-auto
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-12 w-auto',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Flowing River N - Abstract Curve Design */}
      <svg
        className={`${sizeClasses[size]} flex-shrink-0`}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main flowing N curve - mimics a river */}
        <path
          d="M8 8 C12 12, 20 20, 24 24 C28 28, 36 36, 40 40 M8 8 L8 40 M40 8 L40 40"
          stroke={strokeColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Flowing accent curve - river flow */}
        <path
          d="M8 8 Q16 16, 24 24 Q32 32, 40 8"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
          fill="none"
        />
        {/* Subtle wave accent */}
        <path
          d="M12 16 Q18 20, 24 24 Q30 28, 36 12"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.4"
          fill="none"
        />
      </svg>
      {showText && (
        <span 
          className={`hidden md:block text-xl md:text-2xl font-black ${isWhite ? 'text-white' : 'text-gray-900'} tracking-tighter`}
          style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}
        >
          Nile Booking
        </span>
      )}
    </div>
  );
};
