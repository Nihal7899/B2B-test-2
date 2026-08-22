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

  // Editable fields
  tagline?: string;
  categories?: string[];
  bottomLabel?: string;
  bottomIcon?: 'shield' | 'crown' | 'leaf';
}

const DEFAULT_CONTENT = {
  tagline: 'Quality You Can Trust',
  categories: ['Premium', 'Quality', 'Trusted'],
  bottomLabel: 'Premium Quality',
  bottomIcon: 'shield' as const,
};

/*
 * STATIC POCKET COLOR
 *
 * Keep this static for now.
 * Later you can replace this with:
 *
 * pocketColor?: string;
 *
 * and make it dynamic from your database.
 */
const POCKET_COLOR = '#123F35';
const POCKET_DARK = '#082A24';
const POCKET_LIGHT = '#2A6557';

const getBrandContent = (props: BrandCardProps) => ({
  tagline: props.tagline || DEFAULT_CONTENT.tagline,
  categories:
    props.categories && props.categories.length > 0
      ? props.categories
      : DEFAULT_CONTENT.categories,
  bottomLabel:
    props.bottomLabel || DEFAULT_CONTENT.bottomLabel,
  bottomIcon:
    props.bottomIcon || DEFAULT_CONTENT.bottomIcon,
});

const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '');

  if (clean.length !== 6) {
    return { r: 59, g: 130, b: 246 };
  }

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

function BottomIcon({
  type,
}: {
  type: 'shield' | 'crown' | 'leaf';
}) {
  if (type === 'crown') {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-[13px] w-[13px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="m3 7 4 4 5-7 5 7 4-4-2 11H5L3 7Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 21h14"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === 'leaf') {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-[14px] w-[14px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M20 4C11 4 5 7 5 13c0 3 2 5 5 5 6 0 9-6 10-14Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 21c3-6 7-9 13-12"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[13px] w-[13px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M12 3 20 6v5c0 5.2-3.4 8.5-8 10-4.6-1.5-8-4.8-8-10V6l8-3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m8.5 12 2.2 2.2 4.8-5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandCard(props: BrandCardProps) {
  const {
    brandName,
    primaryColor,
    secondaryColor,
    logoUrl,
    productImage,
    productImages = [],
  } = props;

  const content = getBrandContent(props);

  const image =
    productImages.find(Boolean) ||
    productImage ||
    'https://via.placeholder.com/240x240/CCCCCC/999999?text=Product';

  const primaryRgb = hexToRgb(primaryColor);

  const isLightBackground =
    getLuminance(primaryColor) > 0.68;

  const textColor = isLightBackground
    ? '#111827'
    : '#ffffff';

  return (
    <div
      className="
        group
        relative
        h-[270px]
        w-[180px]
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

      {/* =========================================================
          ORIGINAL BACKGROUND — KEPT EXACTLY AS YOUR VERSION
          ========================================================= */}

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

      {/* Background glow */}
      <div
        className="absolute -left-12 -top-8 h-32 w-32 rounded-full blur-2xl"
        style={{
          background: `rgba(
            ${primaryRgb.r},
            ${primaryRgb.g},
            ${primaryRgb.b},
            0.35
          )`,
        }}
      />

      <div className="absolute -right-10 top-20 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

      {/* Abstract graphics */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.13]"
        viewBox="0 0 180 270"
        preserveAspectRatio="none"
      >
        <circle
          cx="-10"
          cy="50"
          r="50"
          fill="none"
          stroke="white"
          strokeWidth="1"
        />

        <circle
          cx="-10"
          cy="50"
          r="36"
          fill="none"
          stroke="white"
          strokeWidth="1"
        />

        <circle
          cx="190"
          cy="74"
          r="34"
          fill="none"
          stroke="white"
          strokeWidth="1"
        />

        <path
          d="M-20 158 C40 126 90 153 205 112"
          fill="none"
          stroke="white"
          strokeWidth="1.2"
        />

        <path
          d="M-20 165 C45 133 97 160 205 120"
          fill="none"
          stroke="white"
          strokeWidth="0.8"
        />

        <circle
          cx="150"
          cy="34"
          r="2"
          fill="white"
        />

        <circle
          cx="162"
          cy="43"
          r="1.5"
          fill="white"
        />

        <circle
          cx="141"
          cy="44"
          r="1"
          fill="white"
        />
      </svg>

      {/* Top dot pattern */}
      <div className="absolute right-3 top-3 z-10 grid grid-cols-3 gap-[3px] opacity-25">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="h-[2.5px] w-[2.5px] rounded-full bg-white"
          />
        ))}
      </div>

      {/* =========================================================
          LOGO
          ========================================================= */}

      <div
        className="
          absolute
          left-1/2
          top-[14px]
          z-30
          flex
          h-[58px]
          w-[70px]
          -translate-x-1/2
          items-center
          justify-center
          rounded-[16px]
          border
          border-white/70
          bg-white
          p-[8px]
          shadow-[0_7px_18px_rgba(0,0,0,0.17)]
          transition-transform
          duration-500
          group-hover:scale-[1.04]
        "
      >
        <img
          src={logoUrl}
          alt={`${brandName} logo`}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
        />

        <span
          className="
            absolute
            right-[4px]
            top-[4px]
            flex
            h-[7px]
            w-[7px]
            rounded-full
            bg-emerald-500
            shadow-[0_0_5px_rgba(16,185,129,0.7)]
          "
        />
      </div>

      {/* =========================================================
          BRAND NAME + TAGLINE
          ========================================================= */}

      <div className="absolute left-3 right-3 top-[76px] z-20 text-center">
        <h3
          className="
            truncate
            text-[18px]
            font-extrabold
            leading-tight
            tracking-[-0.035em]
          "
          style={{
            color: textColor,
            textShadow: isLightBackground
              ? '0 1px 2px rgba(255,255,255,0.5)'
              : '0 2px 7px rgba(0,0,0,0.22)',
          }}
        >
          {brandName}
        </h3>

        <p
          className="mt-1 truncate text-[9px] font-medium"
          style={{
            color: textColor,
            opacity: 0.86,
          }}
        >
          {content.tagline}
        </p>
      </div>

      {/* =========================================================
          CATEGORY PILLS
          ========================================================= */}

      <div className="absolute left-2 right-2 top-[115px] z-30 flex justify-center gap-1.5">
        {content.categories.slice(0, 3).map((cat) => (
          <span
            key={cat}
            className="
              rounded-full
              border
              border-white/25
              bg-white/[0.08]
              px-2
              py-[2px]
              text-[6.5px]
              font-semibold
              tracking-wide
              text-white
              backdrop-blur-sm
            "
          >
            {cat}
          </span>
        ))}
      </div>

      {/* =========================================================
          3D POCKET
          =========================================================
          
          Structure:

          1. Back shadow
          2. Back/interior pocket
          3. Product
          4. Front pocket wall
          5. Curved front lip

          The product is deliberately BETWEEN the back and
          front layers so it looks physically placed inside
          the pocket.
          ========================================================= */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-[-3px]
          left-1/2
          z-10
          h-[105px]
          w-[118%]
          -translate-x-1/2
        "
      >
        {/* ---------------------------------------------------------
            BACK SHADOW
            --------------------------------------------------------- */}

        <div
          className="
            absolute
            bottom-[2px]
            left-1/2
            h-[42px]
            w-[92%]
            -translate-x-1/2
            rounded-[50%]
            bg-black/35
            blur-[12px]
          "
        />

        {/* ---------------------------------------------------------
            POCKET BACK / INNER CAVITY

            This creates the dark bowl behind the products.
            --------------------------------------------------------- */}

        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 180 105"
          preserveAspectRatio="none"
        >
          <defs>
            <radialGradient
              id="pocketInnerGradient"
              cx="50%"
              cy="15%"
              r="85%"
            >
              <stop
                offset="0%"
                stopColor={POCKET_LIGHT}
                stopOpacity="0.82"
              />

              <stop
                offset="48%"
                stopColor={POCKET_COLOR}
                stopOpacity="0.95"
              />

              <stop
                offset="100%"
                stopColor={POCKET_DARK}
                stopOpacity="1"
              />
            </radialGradient>

            <linearGradient
              id="pocketBackHighlight"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#FFFFFF"
                stopOpacity="0.18"
              />

              <stop
                offset="35%"
                stopColor="#FFFFFF"
                stopOpacity="0"
              />

              <stop
                offset="100%"
                stopColor="#000000"
                stopOpacity="0.28"
              />
            </linearGradient>
          </defs>

          {/* Main pocket cavity */}
          <path
            d="
              M 3 44
              Q 90 5 177 44
              L 177 91
              Q 90 108 3 91
              Z
            "
            fill="url(#pocketInnerGradient)"
          />

          {/* Inner highlight */}
          <path
            d="
              M 5 45
              Q 90 10 175 45
              L 175 78
              Q 90 59 5 78
              Z
            "
            fill="url(#pocketBackHighlight)"
            opacity="0.8"
          />

          {/* Inner curved edge */}
          <path
            d="
              M 5 46
              Q 90 10 175 46
            "
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
          />
        </svg>

        {/* ---------------------------------------------------------
            SIDE DEPTH / LEFT WALL
            --------------------------------------------------------- */}

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 180 105"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="leftPocketDepth"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor={POCKET_DARK}
                stopOpacity="0.95"
              />

              <stop
                offset="100%"
                stopColor={POCKET_COLOR}
                stopOpacity="0"
              />
            </linearGradient>

            <linearGradient
              id="rightPocketDepth"
              x1="1"
              y1="0"
              x2="0"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor={POCKET_DARK}
                stopOpacity="0.95"
              />

              <stop
                offset="100%"
                stopColor={POCKET_COLOR}
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {/* Left depth */}
          <path
            d="
              M 0 48
              Q 15 41 32 37
              L 32 91
              Q 15 95 0 91
              Z
            "
            fill="url(#leftPocketDepth)"
          />

          {/* Right depth */}
          <path
            d="
              M 180 48
              Q 165 41 148 37
              L 148 91
              Q 165 95 180 91
              Z
            "
            fill="url(#rightPocketDepth)"
          />
        </svg>
      </div>

      {/* =========================================================
          PRODUCT
          ========================================================= */}

      <div
        className="
          absolute
          bottom-[31px]
          left-1/2
          z-20
          h-[50%]
          w-[78%]
          -translate-x-1/2
          transition-all
          duration-500
          group-hover:-translate-y-2
          group-hover:scale-[1.04]
        "
      >
        <img
          src={image}
          alt={`${brandName} product`}
          className="
            h-full
            w-full
            object-contain
            object-bottom
            drop-shadow-[0_13px_15px_rgba(0,0,0,0.48)]
          "
          loading="lazy"
        />
      </div>

      {/* =========================================================
          FRONT POCKET WALL
          
          This is the important layer.
          
          It sits IN FRONT of the product bottom.
          ========================================================= */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-[-3px]
          left-1/2
          z-30
          h-[58px]
          w-[118%]
          -translate-x-1/2
        "
      >
        <svg
          className="h-full w-full overflow-visible"
          viewBox="0 0 180 58"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Main front pocket gradient */}
            <linearGradient
              id="frontPocketGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={POCKET_LIGHT}
                stopOpacity="0.72"
              />

              <stop
                offset="35%"
                stopColor={POCKET_COLOR}
                stopOpacity="0.92"
              />

              <stop
                offset="100%"
                stopColor={POCKET_DARK}
                stopOpacity="0.98"
              />
            </linearGradient>

            {/* Front gloss */}
            <linearGradient
              id="frontPocketGloss"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#FFFFFF"
                stopOpacity="0.20"
              />

              <stop
                offset="18%"
                stopColor="#FFFFFF"
                stopOpacity="0.07"
              />

              <stop
                offset="45%"
                stopColor="#FFFFFF"
                stopOpacity="0"
              />

              <stop
                offset="100%"
                stopColor="#000000"
                stopOpacity="0.22"
              />
            </linearGradient>

            {/* Front edge highlight */}
            <linearGradient
              id="pocketEdgeHighlight"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="#FFFFFF"
                stopOpacity="0"
              />

              <stop
                offset="50%"
                stopColor="#FFFFFF"
                stopOpacity="0.45"
              />

              <stop
                offset="100%"
                stopColor="#FFFFFF"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {/* -----------------------------------------------------
              MAIN FRONT POCKET BODY

              The curved top is the actual pocket opening/lip.
              ----------------------------------------------------- */}

          <path
            d="
              M 0 18
              Q 90 2 180 18
              L 180 58
              Q 90 72 0 58
              Z
            "
            fill="url(#frontPocketGradient)"
          />

          {/* -----------------------------------------------------
              INNER UPPER CURVE

              Gives the opening a recessed 3D appearance.
              ----------------------------------------------------- */}

          <path
            d="
              M 2 18
              Q 90 0 178 18
              Q 90 34 2 18
              Z
            "
            fill={POCKET_DARK}
            opacity="0.45"
          />

          {/* Opening highlight */}
          <path
            d="
              M 4 18
              Q 90 3 176 18
            "
            fill="none"
            stroke="rgba(255,255,255,0.30)"
            strokeWidth="1.2"
          />

          {/* Main front gloss */}
          <path
            d="
              M 0 18
              Q 90 2 180 18
              L 180 58
              Q 90 72 0 58
              Z
            "
            fill="url(#frontPocketGloss)"
          />

          {/* -----------------------------------------------------
              FRONT LOWER EDGE

              This makes the pocket look like a physical pouch.
              ----------------------------------------------------- */}

          <path
            d="
              M 1 55
              Q 90 70 179 55
            "
            fill="none"
            stroke="rgba(0,0,0,0.32)"
            strokeWidth="2.5"
          />

          <path
            d="
              M 4 53
              Q 90 67 176 53
            "
            fill="none"
            stroke="rgba(255,255,255,0.13)"
            strokeWidth="0.8"
          />

          {/* Center shine on front lip */}
          <path
            d="
              M 35 13
              Q 90 5 145 13
            "
            fill="none"
            stroke="url(#pocketEdgeHighlight)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* =========================================================
          POCKET SIDE HIGHLIGHTS
          ========================================================= */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-[23px]
          left-[2px]
          z-35
          h-[30px]
          w-[25px]
          rounded-[50%]
          bg-white/[0.06]
          blur-[4px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          bottom-[23px]
          right-[2px]
          z-35
          h-[30px]
          w-[25px]
          rounded-[50%]
          bg-black/10
          blur-[4px]
        "
      />

      {/* =========================================================
          BOTTOM BADGE
          
          This remains above the pocket.
          ========================================================= */}

      <div
        className="
          absolute
          bottom-[8px]
          left-1/2
          z-40
          flex
          h-[24px]
          w-auto
          min-w-[130px]
          max-w-[90%]
          -translate-x-1/2
          items-center
          justify-center
          gap-1.5
          rounded-full
          border
          border-white/20
          bg-black/35
          px-3
          text-white
          shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_3px_10px_rgba(0,0,0,0.30)]
          backdrop-blur-md
        "
      >
        <BottomIcon type={content.bottomIcon} />

        <span className="truncate text-[6.5px] font-semibold tracking-[0.03em]">
          {content.bottomLabel}
        </span>
      </div>

      {/* =========================================================
          TOP LIGHT
          ========================================================= */}

      <div
        className="
          pointer-events-none
          absolute
          left-0
          right-0
          top-0
          z-40
          h-[80px]
          bg-gradient-to-b
          from-white/[0.12]
          to-transparent
        "
      />

      {/* =========================================================
          PREMIUM BORDER
          ========================================================= */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          z-50
          rounded-[25px]
          border
          border-white/20
        "
      />
    </div>
  );
}

// =============================================================
// BRAND CAROUSEL
// =============================================================

interface BrandCarouselProps {
  brands: TrustedBrand[];
}

export function BrandCarousel({
  brands,
}: BrandCarouselProps) {
  return (
    <div className="flex gap-4 overflow-x-auto px-4 pb-3 no-scrollbar scroll-touch">
      {brands.map((brand) => (
        <div key={brand.id}>
          <BrandCard
            brandName={brand.name}
            primaryColor={brand.primary_color || '#3B82F6'}
            secondaryColor={brand.secondary_color || '#1E40AF'}
            logoUrl={brand.logo_url}
            productImage={
              brand.product_images?.[0] ||
              'https://via.placeholder.com/240x240/CCCCCC/999999?text=Product'
            }
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