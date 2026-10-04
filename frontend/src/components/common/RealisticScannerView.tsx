import React from 'react';

interface RealisticScannerViewProps {
  isScanning?: boolean;
  size?: number;
  className?: string;
  label?: string;
}

export const RealisticScannerView: React.FC<RealisticScannerViewProps> = ({
  isScanning = false,
  size = 180,
  className = '',
  label = 'GATE SCANNER #01',
}) => {
  return (
    <div
      className={`relative bg-[#0B132B] rounded-xl border border-[#1D4ED8]/30 p-4 flex flex-col items-center justify-center overflow-hidden shadow-inner ${className}`}
      style={{ width: size, minHeight: size }}
    >
      {/* Viewfinder Target Reticle Corners */}
      <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-[#06B6D4]" />
      <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-[#06B6D4]" />
      <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-[#06B6D4]" />
      <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-[#06B6D4]" />

      {/* Optical Sensor Status Tag */}
      <div className="absolute top-1.5 px-2 py-0.5 text-[8px] font-mono tracking-widest text-[#06B6D4] bg-[#0F172A] rounded border border-[#1D4ED8]/40 uppercase">
        {label}
      </div>

      {/* Realistic Standard High-Density QR Code Card */}
      <div className="relative mt-3 bg-white p-2.5 rounded shadow-md flex items-center justify-center">
        <svg
          width={size * 0.58}
          height={size * 0.58}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="select-none"
        >
          {/* Top-Left Position Pattern */}
          <rect x="6" y="6" width="32" height="32" rx="3" fill="#0B132B" />
          <rect x="12" y="12" width="20" height="20" rx="1.5" fill="white" />
          <rect x="18" y="18" width="8" height="8" rx="1" fill="#0B132B" />

          {/* Top-Right Position Pattern */}
          <rect x="82" y="6" width="32" height="32" rx="3" fill="#0B132B" />
          <rect x="88" y="12" width="20" height="20" rx="1.5" fill="white" />
          <rect x="94" y="18" width="8" height="8" rx="1" fill="#0B132B" />

          {/* Bottom-Left Position Pattern */}
          <rect x="6" y="82" width="32" height="32" rx="3" fill="#0B132B" />
          <rect x="12" y="88" width="20" height="20" rx="1.5" fill="white" />
          <rect x="18" y="94" width="8" height="8" rx="1" fill="#0B132B" />

          {/* Alignment Pattern (Bottom-Right) */}
          <rect x="78" y="78" width="16" height="16" rx="2" fill="#0B132B" />
          <rect x="82" y="82" width="8" height="8" rx="1" fill="white" />
          <rect x="84" y="84" width="4" height="4" fill="#0B132B" />

          {/* Timing Patterns */}
          <rect x="44" y="18" width="5" height="5" fill="#0B132B" />
          <rect x="54" y="18" width="5" height="5" fill="#0B132B" />
          <rect x="64" y="18" width="5" height="5" fill="#0B132B" />
          <rect x="18" y="44" width="5" height="5" fill="#0B132B" />
          <rect x="18" y="54" width="5" height="5" fill="#0B132B" />
          <rect x="18" y="64" width="5" height="5" fill="#0B132B" />

          {/* Authentic High-Density Data Matrix Modules */}
          {/* Row 1-3 */}
          <rect x="44" y="6" width="5" height="5" fill="#0B132B" />
          <rect x="56" y="6" width="5" height="5" fill="#0B132B" />
          <rect x="68" y="6" width="5" height="5" fill="#0B132B" />
          <rect x="48" y="12" width="5" height="5" fill="#0B132B" />
          <rect x="60" y="12" width="5" height="5" fill="#0B132B" />
          <rect x="72" y="12" width="5" height="5" fill="#0B132B" />

          {/* Center Matrix */}
          <rect x="44" y="30" width="5" height="5" fill="#0B132B" />
          <rect x="50" y="30" width="5" height="5" fill="#0B132B" />
          <rect x="62" y="30" width="5" height="5" fill="#0B132B" />
          <rect x="68" y="30" width="5" height="5" fill="#0B132B" />
          <rect x="80" y="30" width="5" height="5" fill="#0B132B" />
          <rect x="92" y="30" width="5" height="5" fill="#0B132B" />
          <rect x="104" y="30" width="5" height="5" fill="#0B132B" />

          <rect x="6" y="44" width="5" height="5" fill="#0B132B" />
          <rect x="30" y="44" width="5" height="5" fill="#0B132B" />
          <rect x="44" y="44" width="5" height="5" fill="#0B132B" />
          <rect x="56" y="44" width="5" height="5" fill="#0B132B" />
          <rect x="68" y="44" width="5" height="5" fill="#0B132B" />
          <rect x="80" y="44" width="5" height="5" fill="#0B132B" />
          <rect x="98" y="44" width="5" height="5" fill="#0B132B" />
          <rect x="108" y="44" width="5" height="5" fill="#0B132B" />

          <rect x="12" y="52" width="5" height="5" fill="#0B132B" />
          <rect x="36" y="52" width="5" height="5" fill="#0B132B" />
          <rect x="48" y="52" width="5" height="5" fill="#0B132B" />
          <rect x="60" y="52" width="5" height="5" fill="#0B132B" />
          <rect x="74" y="52" width="5" height="5" fill="#0B132B" />
          <rect x="86" y="52" width="5" height="5" fill="#0B132B" />
          <rect x="102" y="52" width="5" height="5" fill="#0B132B" />

          <rect x="6" y="60" width="5" height="5" fill="#0B132B" />
          <rect x="24" y="60" width="5" height="5" fill="#0B132B" />
          <rect x="44" y="60" width="5" height="5" fill="#0B132B" />
          <rect x="52" y="60" width="5" height="5" fill="#0B132B" />
          <rect x="68" y="60" width="5" height="5" fill="#0B132B" />
          <rect x="82" y="60" width="5" height="5" fill="#0B132B" />
          <rect x="94" y="60" width="5" height="5" fill="#0B132B" />
          <rect x="108" y="60" width="5" height="5" fill="#0B132B" />

          <rect x="12" y="68" width="5" height="5" fill="#0B132B" />
          <rect x="30" y="68" width="5" height="5" fill="#0B132B" />
          <rect x="48" y="68" width="5" height="5" fill="#0B132B" />
          <rect x="60" y="68" width="5" height="5" fill="#0B132B" />
          <rect x="72" y="68" width="5" height="5" fill="#0B132B" />
          <rect x="88" y="68" width="5" height="5" fill="#0B132B" />
          <rect x="100" y="68" width="5" height="5" fill="#0B132B" />

          {/* Lower Matrix */}
          <rect x="44" y="82" width="5" height="5" fill="#0B132B" />
          <rect x="56" y="82" width="5" height="5" fill="#0B132B" />
          <rect x="66" y="82" width="5" height="5" fill="#0B132B" />
          <rect x="100" y="82" width="5" height="5" fill="#0B132B" />
          <rect x="108" y="82" width="5" height="5" fill="#0B132B" />

          <rect x="48" y="92" width="5" height="5" fill="#0B132B" />
          <rect x="62" y="92" width="5" height="5" fill="#0B132B" />
          <rect x="72" y="92" width="5" height="5" fill="#0B132B" />
          <rect x="104" y="92" width="5" height="5" fill="#0B132B" />

          <rect x="44" y="104" width="5" height="5" fill="#0B132B" />
          <rect x="54" y="104" width="5" height="5" fill="#0B132B" />
          <rect x="68" y="104" width="5" height="5" fill="#0B132B" />
          <rect x="80" y="104" width="5" height="5" fill="#0B132B" />
          <rect x="94" y="104" width="5" height="5" fill="#0B132B" />
          <rect x="108" y="104" width="5" height="5" fill="#0B132B" />
        </svg>

        {/* Animated Laser Scanning Line */}
        <div
          className={`absolute left-0 right-0 h-0.5 bg-[#06B6D4] shadow-[0_0_12px_#06B6D4] pointer-events-none ${
            isScanning ? 'animate-bounce' : 'top-1/2 -translate-y-1/2 opacity-70'
          }`}
        />
      </div>

      {/* Optical Frame Subtitle */}
      <div className="mt-2 text-[9px] font-mono text-[#06B6D4] tracking-wider uppercase flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse" />
        <span>OPTICAL 2D SENSOR</span>
      </div>
    </div>
  );
};
