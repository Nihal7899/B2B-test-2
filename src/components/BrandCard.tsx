// components/BrandCard.tsx
import React from 'react';

interface BrandCardProps {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  productImages: string[];  // array of up to 3 URLs
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
    <div className="relative w-40 h-52 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
      {/* Top background */}
      <div className="absolute inset-0" style={{ backgroundColor: primaryColor }} />

      {/* Bottom curved section */}
      <div className="absolute bottom-0 left-0 right-0 h-[45%]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,60 Q50,30 100,60 L100,100 L0,100 Z" fill={secondaryColor} />
        </svg>
      </div>

      {/* Logo box – smaller */}
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-lg flex items-center justify-center p-2 shadow-lg z-10">
        <img src={logoUrl} alt={brandName} className="max-w-full max-h-full object-contain" />
      </div>

      {/* Product images – smaller */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center items-end pb-1.5 z-20">
        {images.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`${brandName} product ${index + 1}`}
            className="h-12 w-auto object-contain drop-shadow-md"
            style={{ marginLeft: index === 0 ? 0 : -6, zIndex: index + 1 }}
          />
        ))}
      </div>
    </div>
  );
}