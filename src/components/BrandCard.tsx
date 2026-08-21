import React from 'react';
import type { TrustedBrand } from '@/types';

interface BrandCardProps {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  productImage: string;
}

const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '');

  if (clean.length !== 6) {
    return { r: 59, g: 130, b: 246 };
  }

  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
};

const getLuminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);

  const values = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return (
    0.2126 * values[0] +
    0.7152 * values[1] +
    0.0722 * values[2]
  );
};

export function BrandCard({
  brandName,
  primaryColor,
  secondaryColor,
  logoUrl,
  productImage,
}: BrandCardProps) {
  const primaryRgb = hexToRgb(primaryColor);
  const secondaryRgb = hexToRgb(secondaryColor);

  const isLight =
    getLuminance(primaryColor) > 0.65;

  const textColor = isLight ? '#111827' : '#ffffff';

  return (
    <div
      className="
        group relative
        w-[150px] h-[194px]
        flex-shrink-0
        overflow-hidden
        rounded-[24px]
        select-none
        isolate
        shadow-[0_8px_30px_rgba(0,0,0,0.12)]
        transition-all duration-500
        hover:-translate-y-1
        hover:shadow-[0_16px_40px_rgba(0,0,0,0.18)]
      "
      style={{
        '--primary': primaryColor,
        '--secondary': secondaryColor,
      } as React.CSSProperties}
    >
      {/* =========================================================
          BACKGROUND
      ========================================================== */}

      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              circle at 50% 10%,
              rgba(255,255,255,0.20),
              transparent 32%
            ),
            linear-gradient(
              145deg,
              ${primaryColor} 0%,
              ${primaryColor} 42%,
              ${secondaryColor} 100%
            )
          `,
        }}
      />

      {/* =========================================================
          DECORATIVE LIGHT BLOBS
      ========================================================== */}

      <div
        className="absolute -left-10 -top-10 h-28 w-28 rounded-full blur-[2px]"
        style={{
          background: `rgba(
            ${primaryRgb.r},
            ${primaryRgb.g},
            ${primaryRgb.b},
            0.35
          )`,
        }}
      />

      <div
        className="absolute -right-8 top-12 h-24 w-24 rounded-full blur-xl"
        style={{
          background: `rgba(
            255,
            255,
            255,
            0.10
          )`,
        }}
      />

      <div
        className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full blur-2xl"
        style={{
          background: `rgba(
            0,
            0,
            0,
            0.12
          )`,
        }}
      />

      {/* =========================================================
          ABSTRACT SVG GRAPHICS
      ========================================================== */}

      <svg
        className="absolute inset-0 h-full w-full opacity-[0.14]"
        viewBox="0 0 150 194"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <circle
          cx="5"
          cy="42"
          r="38"
          fill="none"
          stroke="white"
          strokeWidth="1"
        />

        <circle
          cx="5"
          cy="42"
          r="28"
          fill="none"
          stroke="white"
          strokeWidth="1"
        />

        <circle
          cx="145"
          cy="70"
          r="28"
          fill="none"
          stroke="white"
          strokeWidth="1"
        />

        <path
          d="M-10 130 C35 105 70 122 165 88"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
        />

        <path
          d="M-10 137 C40 112 75 129 165 95"
          fill="none"
          stroke="white"
          strokeWidth="1"
        />
      </svg>

      {/* =========================================================
          DECORATIVE DOTS
      ========================================================== */}

      <div className="absolute right-4 top-4 grid grid-cols-3 gap-1 opacity-25">
        {[...Array(9)].map((_, index) => (
          <span
            key={index}
            className="h-1 w-1 rounded-full bg-white"
          />
        ))}
      </div>

      {/* =========================================================
          LOGO GLASS CONTAINER
      ========================================================== */}

      <div
        className="
          absolute
          left-1/2 top-[13px]
          z-30
          flex
          h-[58px] w-[70px]
          -translate-x-1/2
          items-center justify-center
          rounded-[17px]
          border border-white/60
          bg-white
          p-2
          shadow-[0_8px_20px_rgba(0,0,0,0.16)]
          transition-transform duration-500
          group-hover:scale-[1.04]
        "
      >
        <img
          src={logoUrl}
          alt={`${brandName} logo`}
          className="
            max-h-full
            max-w-full
            object-contain
          "
          loading="lazy"
        />

        {/* Tiny premium indicator */}
        <span
          className="
            absolute
            right-1.5 top-1.5
            h-1.5 w-1.5
            rounded-full
            bg-emerald-500
            shadow-[0_0_5px_rgba(16,185,129,0.6)]
          "
        />
      </div>

      {/* =========================================================
          BRAND NAME
      ========================================================== */}

      <div
        className="
          absolute
          left-2 right-2
          top-[76px]
          z-20
          text-center
        "
      >
        <h3
          className="
            truncate
            text-[15px]
            font-bold
            tracking-[-0.02em]
          "
          style={{
            color: textColor,
            textShadow: isLight
              ? '0 1px 2px rgba(255,255,255,0.4)'
              : '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          {brandName}
        </h3>

        <div className="mt-1 flex items-center justify-center gap-1.5">
          <span
            className="h-[3px] w-[3px] rounded-full"
            style={{
              backgroundColor: textColor,
              opacity: 0.55,
            }}
          />

          <span
            className="text-[8px] font-medium uppercase tracking-[0.12em]"
            style={{
              color: textColor,
              opacity: 0.72,
            }}
          >
            Trusted Brand
          </span>

          <span
            className="h-[3px] w-[3px] rounded-full"
            style={{
              backgroundColor: textColor,
              opacity: 0.55,
            }}
          />
        </div>
      </div>

      {/* =========================================================
          PRODUCT STAGE
      ========================================================== */}

      <div className="absolute bottom-0 left-0 right-0 z-10 h-[105px]">
        {/* curved stage */}
        <div
          className="absolute bottom-[-30px] left-1/2 h-[100px] w-[175px] -translate-x-1/2 rounded-[50%]"
          style={{
            background: `
              radial-gradient(
                ellipse at center,
                rgba(255,255,255,0.20) 0%,
                rgba(255,255,255,0.08) 42%,
                transparent 70%
              )
            `,
          }}
        />

        {/* dark product platform */}
        <div
          className="absolute bottom-[-24px] left-1/2 h-[65px] w-[165px] -translate-x-1/2 rounded-[50%]"
          style={{
            background: `
              radial-gradient(
                ellipse at center,
                rgba(0,0,0,0.24),
                rgba(0,0,0,0.05) 65%,
                transparent 72%
              )
            `,
          }}
        />

        {/* product glow */}
        <div
          className="
            absolute
            bottom-5
            left-1/2
            h-16 w-28
            -translate-x-1/2
            rounded-full
            bg-white/20
            blur-2xl
          "
        />

        {/* product */}
        <div
          className="
            absolute
            bottom-[-4px]
            left-1/2
            z-20
            h-[94px]
            w-[135px]
            -translate-x-1/2
            transition-all
            duration-500
            group-hover:-translate-y-1
            group-hover:scale-[1.04]
          "
        >
          <img
            src={productImage}
            alt={`${brandName} product`}
            className="
              h-full
              w-full
              object-contain
              object-bottom
              drop-shadow-[0_9px_7px_rgba(0,0,0,0.28)]
            "
            loading="lazy"
          />
        </div>
      </div>

      {/* =========================================================
          BOTTOM TRUST BADGE
      ========================================================== */}

      <div
        className="
          absolute
          bottom-2.5
          left-1/2
          z-30
          flex
          -translate-x-1/2
          items-center
          gap-1.5
          whitespace-nowrap
          rounded-full
          border border-white/20
          bg-black/10
          px-2.5 py-1
          backdrop-blur-md
        "
      >
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/20">
          <svg
            viewBox="0 0 24 24"
            className="h-2.5 w-2.5"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
          >
            <path
              d="M20 6 9 17l-5-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <span className="text-[7px] font-semibold tracking-wide text-white">
          PREMIUM
        </span>
      </div>

      {/* =========================================================
          TOP SHINE
      ========================================================== */}

      <div
        className="
          pointer-events-none
          absolute inset-x-0 top-0
          z-40 h-20
          bg-gradient-to-b
          from-white/10
          to-transparent
        "
      />

      {/* =========================================================
          CARD BORDER
      ========================================================== */}

      <div
        className="
          pointer-events-none
          absolute inset-0
          z-50
          rounded-[24px]
          border border-white/20
        "
      />
    </div>
  );
}

// ================================================================
// BRAND CAROUSEL
// ================================================================

interface BrandCarouselProps {
  brands: TrustedBrand[];
}

const DEFAULT_PRIMARY = '#2563EB';
const DEFAULT_SECONDARY = '#1E3A8A';

const PLACEHOLDER_PRODUCT =
  'https://via.placeholder.com/240x240/CCCCCC/999999?text=Product';

export function BrandCarousel({
  brands,
}: BrandCarouselProps) {
  return (
    <div
      className="
        flex
        gap-3.5
        overflow-x-auto
        px-4 pb-3
        no-scrollbar
        scroll-touch
        snap-x snap-mandatory
      "
    >
      {brands.map((brand) => {
        const primary =
          (brand as any).primary_color ||
          DEFAULT_PRIMARY;

        const secondary =
          (brand as any).secondary_color ||
          DEFAULT_SECONDARY;

        const productImage =
          (brand as any).product_images?.[0] ||
          PLACEHOLDER_PRODUCT;

        return (
          <div
            key={brand.id}
            className="snap-start"
          >
            <BrandCard
              brandName={brand.name}
              primaryColor={primary}
              secondaryColor={secondary}
              logoUrl={brand.logo_url}
              productImage={productImage}
            />
          </div>
        );
      })}
    </div>
  );
}