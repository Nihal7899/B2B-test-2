// components/BrandCard.tsx
import React from 'react';

interface BrandCardProps {
  brandName: string;
  primaryColor: string;      // e.g. '#3B82F6'
  secondaryColor: string;    // e.g. '#1E40AF'
  logoUrl: string;
  productImages: string[];   // up to 3 URLs
}

export function BrandCard({
  brandName,
  primaryColor,
  secondaryColor,
  logoUrl,
  productImages,
}: BrandCardProps) {
  const images = productImages.slice(0, 3);

  return (
    <div className="relative w-56 h-72 rounded-3xl overflow-hidden shadow-lg">
      {/* Top background – solid primary color */}
      <div className="absolute inset-0" style={{ backgroundColor: primaryColor }} />

      {/* Bottom curved section – secondary color via SVG */}
      <div className="absolute bottom-0 left-0 right-0 h-[45%]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,60 Q50,30 100,60 L100,100 L0,100 Z" fill={secondaryColor} />
        </svg>
      </div>

      {/* White logo box – centred in the top half */}
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-xl flex items-center justify-center p-3 shadow-lg z-10">
        <img src={logoUrl} alt={brandName} className="max-w-full max-h-full object-contain" />
      </div>

      {/* Product images – overlapping at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center items-end pb-2 z-20">
        {images.map((url, index) => {
          const marginLeft = index === 0 ? 0 : -8;
          const zIndex = index + 1;
          return (
            <img
              key={index}
              src={url}
              alt={`${brandName} product ${index + 1}`}
              className="h-16 w-auto object-contain drop-shadow-md"
              style={{ marginLeft, zIndex }}
            />
          );
        })}
      </div>
    </div>
  );
}