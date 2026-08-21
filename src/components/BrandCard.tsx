import React from 'react';
import type { TrustedBrand } from '@/types';

interface BrandCardProps {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  productImage: string;
}

export function BrandCard({
  brandName,
  primaryColor,
  secondaryColor,
  logoUrl,
  productImage,
}: BrandCardProps) {
  return (
    <div className="relative w-32 h-40 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
      <div className="absolute inset-0" style={{ backgroundColor: primaryColor }} />
      <div className="absolute bottom-0 left-0 right-0 h-[40%]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,60 Q50,30 100,60 L100,100 L0,100 Z" fill={secondaryColor} />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[40%] flex items-end justify-center z-20">
        <img
          src={productImage}
          alt={`${brandName} product`}
          className="h-full w-full object-contain object-bottom drop-shadow-md"
        />
      </div>
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-lg flex items-center justify-center p-1.5 shadow-lg z-10">
        <img src={logoUrl} alt={brandName} className="max-w-full max-h-full object-contain" />
      </div>
    </div>
  );
}

// Carousel (unchanged)
interface BrandCarouselProps {
  brands: TrustedBrand[];
}

const DEFAULT_PRIMARY = '#3B82F6';
const DEFAULT_SECONDARY = '#1E40AF';
const PLACEHOLDER_PRODUCT = 'https://via.placeholder.com/120/CCCCCC/999999?text=Product';

export function BrandCarousel({ brands }: BrandCarouselProps) {
  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-touch px-4 pb-1">
      {brands.map((brand) => {
        const primary = (brand as any).primary_color || DEFAULT_PRIMARY;
        const secondary = (brand as any).secondary_color || DEFAULT_SECONDARY;
        const productImage = (brand as any).product_images?.[0] || PLACEHOLDER_PRODUCT;
        return (
          <BrandCard
            key={brand.id}
            brandName={brand.name}
            primaryColor={primary}
            secondaryColor={secondary}
            logoUrl={brand.logo_url}
            productImage={productImage}
          />
        );
      })}
    </div>
  );
}