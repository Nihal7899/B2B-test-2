// components/BrandCard.tsx
import React from 'react';
import type { TrustedBrand } from '@/types';

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
    <div className="relative w-32 h-40 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
      {/* Top background */}
      <div className="absolute inset-0" style={{ backgroundColor: primaryColor }} />

      {/* Bottom curved section – 40% height */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,60 Q50,30 100,60 L100,100 L0,100 Z" fill={secondaryColor} />
        </svg>
      </div>

      {/* Logo box – centred in upper 60% */}
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-lg flex items-center justify-center p-1.5 shadow-lg z-10">
        <img src={logoUrl} alt={brandName} className="max-w-full max-h-full object-contain" />
      </div>

      {/* Product images – now within the bottom 40% */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center items-end pb-1 z-20">
        {images.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`${brandName} product ${index + 1}`}
            className="h-10 w-auto object-contain drop-shadow-md"
            style={{ marginLeft: index === 0 ? 0 : -5, zIndex: index + 1 }}
          />
        ))}
      </div>
    </div>
  );
}

// BrandCarousel uses the same BrandCard; no changes needed.
// ---- Carousel that uses BrandCard for each brand ----
interface BrandCarouselProps {
  brands: TrustedBrand[];
}

// Fallback defaults for brands without custom colors/images
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
      {brands.map((brand) => {
        // Use custom fields if available, else fallback
        const primary = (brand as any).primary_color || DEFAULT_PRIMARY;
        const secondary = (brand as any).secondary_color || DEFAULT_SECONDARY;
        const images = (brand as any).product_images?.filter(Boolean) || PLACEHOLDER_PRODUCTS;
        return (
          <BrandCard
            key={brand.id}
            brandName={brand.name}
            primaryColor={primary}
            secondaryColor={secondary}
            logoUrl={brand.logo_url}
            productImages={images}
          />
        );
      })}
    </div>
  );
}