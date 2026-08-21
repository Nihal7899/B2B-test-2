// components/BrandCard.tsx
import React from 'react';
import type { TrustedBrand } from '@/types';

interface BrandCardProps {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  productImage: string;
  productImages?: string[];
  // NEW editable fields
  tagline?: string;
  categories?: string[];
  bottomLabel?: string;
  bottomIcon?: 'shield' | 'crown' | 'leaf';
}

// Default content (fallback)
const DEFAULT_CONTENT = {
  tagline: 'Quality You Can Trust',
  categories: ['Premium', 'Quality', 'Trusted'],
  bottomLabel: 'Premium Quality',
  bottomIcon: 'shield' as const,
};

// Helper to get content from props or fallback
const getBrandContent = (props: BrandCardProps) => ({
  tagline: props.tagline || DEFAULT_CONTENT.tagline,
  categories: props.categories && props.categories.length > 0 ? props.categories : DEFAULT_CONTENT.categories,
  bottomLabel: props.bottomLabel || DEFAULT_CONTENT.bottomLabel,
  bottomIcon: props.bottomIcon || DEFAULT_CONTENT.bottomIcon,
});

const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return { r: 59, g: 130, b: 246 };
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
};

const getLuminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const values = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
};

function BottomIcon({ type }: { type: 'shield' | 'crown' | 'leaf' }) {
  if (type === 'crown') {
    return (
      <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m3 7 4 4 5-7 5 7 4-4-2 11H5L3 7Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 21h14" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'leaf') {
    return (
      <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 4C11 4 5 7 5 13c0 3 2 5 5 5 6 0 9-6 10-14Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 21c3-6 7-9 13-12" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 20 6v5c0 5.2-3.4 8.5-8 10-4.6-1.5-8-4.8-8-10V6l8-3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m8.5 12 2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BrandCard(props: BrandCardProps) {
  const { brandName, primaryColor, secondaryColor, logoUrl, productImage, productImages = [] } = props;
  const content = getBrandContent(props);

  // Use the first product image (or fallback)
  const image = productImages.find(Boolean) || productImage || 'https://via.placeholder.com/240x240/CCCCCC/999999?text=Product';

  const primaryRgb = hexToRgb(primaryColor);
  const isLightBackground = getLuminance(primaryColor) > 0.68;
  const textColor = isLightBackground ? '#111827' : '#ffffff';

  return (
    <div
      className="
        group
        relative
        h-[300px]            /* increased height for better spacing */
        w-[200px]
        flex-shrink-0
        overflow-hidden
        rounded-[25px]
        isolate
        bg-white
        shadow-[0_10px_35px_rgba(0,0,0,0.14)]
        transition-all
        duration-500
        hover:-translate-y-1
        hover:shadow-[0_18px_45px_rgba(0,0,0,0.20)]
      "
    >
      {/* Main Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              circle at 50% 15%,
              rgba(255,255,255,0.18),
              transparent 30%
            ),
            linear-gradient(
              145deg,
              ${primaryColor} 0%,
              ${primaryColor} 45%,
              ${secondaryColor} 100%
            )
          `,
        }}
      />

      {/* Decorative Glows */}
      <div
        className="absolute -left-12 -top-8 h-32 w-32 rounded-full blur-2xl"
        style={{ background: `rgba(${primaryRgb.r},${primaryRgb.g},${primaryRgb.b},0.35)` }}
      />
      <div className="absolute -right-10 top-20 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

      {/* Abstract Graphics */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.13]" viewBox="0 0 200 300" preserveAspectRatio="none">
        <circle cx="-10" cy="55" r="58" fill="none" stroke="white" strokeWidth="1" />
        <circle cx="-10" cy="55" r="44" fill="none" stroke="white" strokeWidth="1" />
        <circle cx="210" cy="82" r="38" fill="none" stroke="white" strokeWidth="1" />
        <path d="M-20 175 C45 140 100 170 225 125" fill="none" stroke="white" strokeWidth="1.2" />
        <path d="M-20 183 C50 148 108 178 225 133" fill="none" stroke="white" strokeWidth="0.8" />
        <circle cx="168" cy="38" r="2" fill="white" />
        <circle cx="180" cy="48" r="1.5" fill="white" />
        <circle cx="157" cy="49" r="1" fill="white" />
      </svg>

      {/* Top Dot Pattern */}
      <div className="absolute right-4 top-4 z-10 grid grid-cols-3 gap-[4px] opacity-25">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="h-[3px] w-[3px] rounded-full bg-white" />
        ))}
      </div>

      {/* Logo */}
      <div
        className="
          absolute left-1/2 top-[15px] z-30
          flex h-[64px] w-[76px] -translate-x-1/2
          items-center justify-center rounded-[18px]
          border border-white/70 bg-white p-[9px]
          shadow-[0_7px_18px_rgba(0,0,0,0.17)]
          transition-transform duration-500 group-hover:scale-[1.04]
        "
      >
        <img src={logoUrl} alt={`${brandName} logo`} className="max-h-full max-w-full object-contain" loading="lazy" />
        <span className="absolute right-[5px] top-[5px] flex h-[8px] w-[8px] rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.7)]" />
      </div>

      {/* Brand Name + Tagline */}
      <div className="absolute left-3 right-3 top-[86px] z-20 text-center">
        <h3
          className="truncate text-[20px] font-extrabold leading-tight tracking-[-0.035em]"
          style={{
            color: textColor,
            textShadow: isLightBackground ? '0 1px 2px rgba(255,255,255,0.5)' : '0 2px 7px rgba(0,0,0,0.22)',
          }}
        >
          {brandName}
        </h3>
        <p
          className="mt-1 truncate text-[10px] font-medium"
          style={{ color: textColor, opacity: 0.86 }}
        >
          {content.tagline}
        </p>
      </div>

      {/* Category Pills – moved down to avoid overlap */}
      <div className="absolute left-2 right-2 top-[128px] z-30 flex justify-center gap-1.5">
        {content.categories.slice(0, 3).map((cat) => (
          <span
            key={cat}
            className="rounded-full border border-white/25 bg-white/[0.08] px-2 py-[3px] text-[7px] font-semibold tracking-wide text-white backdrop-blur-sm"
          >
            {cat}
          </span>
        ))}
      </div>

      {/* ===== SINGLE PRODUCT CONTAINER (35% of height from bottom) ===== */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-[35%]">
        {/* Background glow behind product */}
        <div className="absolute bottom-0 left-1/2 h-full w-[140%] -translate-x-1/2 rounded-full bg-white/20 blur-2xl" />
        {/* Shadow ellipse */}
        <div className="absolute bottom-[-10px] left-1/2 h-[60px] w-[180px] -translate-x-1/2 rounded-[50%] bg-black/20 blur-md" />

        {/* Product image */}
        <div className="absolute bottom-0 left-1/2 z-20 h-[110%] w-[70%] -translate-x-1/2 transition-all duration-500 group-hover:-translate-y-1 group-hover:scale-[1.04]">
          <img
            src={image}
            alt={`${brandName} product`}
            className="h-full w-full object-contain object-bottom drop-shadow-[0_10px_8px_rgba(0,0,0,0.30)]"
            loading="lazy"
          />
        </div>
      </div>

      {/* Bottom Strip */}
      <div
        className="
          absolute bottom-[9px] left-1/2 z-40
          flex h-[25px] w-[148px] -translate-x-1/2
          items-center justify-center gap-1.5
          rounded-full border border-white/25 bg-white/[0.10] px-3
          text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]
          backdrop-blur-md
        "
      >
        <BottomIcon type={content.bottomIcon} />
        <span className="truncate text-[7px] font-semibold tracking-[0.03em]">
          {content.bottomLabel}
        </span>
      </div>

      {/* Top Light */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-40 h-[90px] bg-gradient-to-b from-white/[0.12] to-transparent" />

      {/* Premium Border */}
      <div className="pointer-events-none absolute inset-0 z-50 rounded-[25px] border border-white/20" />
    </div>
  );
}

// BrandCarousel (unchanged except passing new props)
interface BrandCarouselProps {
  brands: TrustedBrand[];
}

export function BrandCarousel({ brands }: BrandCarouselProps) {
  return (
    <div className="flex gap-4 overflow-x-auto px-4 pb-3 no-scrollbar scroll-touch snap-x snap-mandatory">
      {brands.map((brand) => (
        <div key={brand.id} className="snap-start">
          <BrandCard
            brandName={brand.name}
            primaryColor={brand.primary_color || '#2563EB'}
            secondaryColor={brand.secondary_color || '#1E3A8A'}
            logoUrl={brand.logo_url}
            productImage={brand.product_images?.[0] || 'https://via.placeholder.com/240x240/CCCCCC/999999?text=Product'}
            productImages={brand.product_images || []}
            tagline={brand.tagline}
            categories={brand.categories}
            bottomLabel={brand.bottom_label}
            bottomIcon={brand.bottom_icon}
          />
        </div>
      ))}
    </div>
  );
}