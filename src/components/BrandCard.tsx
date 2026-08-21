// components/BrandCard.tsx
import React from 'react';
import type { TrustedBrand } from '@/types';

// ---- The new portrait card (as designed) ----
interface BrandCardProps {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  productImages: string[];
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
    <div className="relative w-56 h-72 rounded-3xl overflow-hidden shadow-lg flex-shrink-0">
      <div className="absolute inset-0" style={{ backgroundColor: primaryColor }} />
      <div className="absolute bottom-0 left-0 right-0 h-[45%]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,60 Q50,30 100,60 L100,100 L0,100 Z" fill={secondaryColor} />
        </svg>
      </div>
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-xl flex items-center justify-center p-3 shadow-lg z-10">
        <img src={logoUrl} alt={brandName} className="max-w-full max-h-full object-contain" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-center items-end pb-2 z-20">
        {images.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`${brandName} product ${index + 1}`}
            className="h-16 w-auto object-contain drop-shadow-md"
            style={{ marginLeft: index === 0 ? 0 : -8, zIndex: index + 1 }}
          />
        ))}
      </div>
    </div>
  );
}

// ---- Carousel that uses BrandCard for each brand ----
interface BrandCarouselProps {
  brands: TrustedBrand[];
}

// Default colours and placeholder product images (you can customise these)
const DEFAULT_PRIMARY = '#3B82F6';
const DEFAULT_SECONDARY = '#1E40AF';
const PLACEHOLDER_PRODUCTS = [
  'https://via.placeholder.com/80/FF0000/FFFFFF?text=Prod1',
  'https://via.placeholder.com/80/00FF00/FFFFFF?text=Prod2',
  'https://via.placeholder.com/80/0000FF/FFFFFF?text=Prod3',
];

export function BrandCarousel({ brands }: BrandCarouselProps) {
  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-touch px-4 pb-1">
      {brands.map((brand, index) => (
        <BrandCard
          key={brand.id}
          brandName={brand.name}
          primaryColor={DEFAULT_PRIMARY}
          secondaryColor={DEFAULT_SECONDARY}
          logoUrl={brand.logo_url}
          productImages={PLACEHOLDER_PRODUCTS} // or fetch product images per brand if needed
        />
      ))}
    </div>
  );
}