import React from 'react';

interface ZeroQLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  showText?: boolean;
  className?: string;
}

export const ZeroQLogo: React.FC<ZeroQLogoProps> = ({
  size = 'md',
  variant = 'dark',
  showText = true,
  className = '',
}) => {
  const dimensions = {
    sm: { iconSize: 22, textClass: 'text-lg', gap: 'gap-1.5' },
    md: { iconSize: 28, textClass: 'text-2xl', gap: 'gap-2' },
    lg: { iconSize: 36, textClass: 'text-3xl', gap: 'gap-2.5' },
    xl: { iconSize: 44, textClass: 'text-4xl', gap: 'gap-3' },
  }[size];

  const isLight = variant === 'light';
  const mainColor = isLight ? '#FFFFFF' : '#0B132B';
  const accentColor = '#FF5E36'; // Coral accent for 'Q'
  const laserColor = '#06B6D4';  // Electric Cyan scan line

  return (
    <div
      className={`inline-flex items-center ${dimensions.gap} select-none shrink-0 bg-transparent p-0 border-0 ${className}`}
    >
      {/* Exact QR Scanner Icon Artwork */}
      <svg
        width={dimensions.iconSize}
        height={dimensions.iconSize}
        viewBox="0 0 90 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* 4 Viewfinder Corner Brackets */}
        <path
          d="M 8 30 L 8 16 A 8 8 0 0 1 16 8 L 30 8"
          stroke={mainColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 60 8 L 74 8 A 8 8 0 0 1 82 16 L 82 30"
          stroke={mainColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 8 60 L 8 74 A 8 8 0 0 0 16 82 L 30 82"
          stroke={mainColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 60 82 L 74 82 A 8 8 0 0 0 82 74 L 82 60"
          stroke={mainColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Top-Left Finder Square */}
        <rect
          x="20"
          y="20"
          width="18"
          height="18"
          rx="3"
          fill="none"
          stroke={mainColor}
          strokeWidth="3.5"
        />
        <rect x="25" y="25" width="8" height="8" rx="1.5" fill={mainColor} />

        {/* Top-Right Finder Square */}
        <rect
          x="52"
          y="20"
          width="18"
          height="18"
          rx="3"
          fill="none"
          stroke={mainColor}
          strokeWidth="3.5"
        />
        <rect x="57" y="25" width="8" height="8" rx="1.5" fill={mainColor} />

        {/* Bottom-Left Finder Square */}
        <rect
          x="20"
          y="52"
          width="18"
          height="18"
          rx="3"
          fill="none"
          stroke={mainColor}
          strokeWidth="3.5"
        />
        <rect x="25" y="57" width="8" height="8" rx="1.5" fill={mainColor} />

        {/* QR Matrix Data Dots */}
        <rect x="42" y="22" width="5" height="5" rx="1" fill={mainColor} />
        <rect x="42" y="32" width="5" height="5" rx="1" fill={mainColor} />
        <rect x="42" y="54" width="5" height="5" rx="1" fill={mainColor} />
        <rect x="42" y="64" width="5" height="5" rx="1" fill={mainColor} />
        <rect x="54" y="54" width="5" height="5" rx="1" fill={mainColor} />
        <rect x="64" y="54" width="5" height="5" rx="1" fill={mainColor} />
        <rect x="54" y="64" width="5" height="5" rx="1" fill={mainColor} />
        <rect x="64" y="64" width="5" height="5" rx="1" fill={mainColor} />

        {/* Horizontal Laser Scanning Line */}
        <line
          x1="12"
          y1="45"
          x2="78"
          y2="45"
          stroke={laserColor}
          strokeWidth="4.5"
          strokeLinecap="round"
          className="opacity-95"
        />
      </svg>

      {/* "ZeroQ" Wordmark */}
      {showText && (
        <span
          className={`font-black tracking-tight leading-none ${dimensions.textClass}`}
        >
          <span style={{ color: mainColor }}>Zero</span>
          <span style={{ color: accentColor }}>Q</span>
        </span>
      )}
    </div>
  );
};
