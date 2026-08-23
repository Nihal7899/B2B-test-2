// components/ProductCard.tsx
import React, { useMemo, useState } from 'react';
import {
  Heart,
  Star,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle2,
  Package,
  Sparkles,
  Truck,
} from 'lucide-react';
import type { Product } from '@/types';
import { OfferBadge } from './OfferBadge';

// Stable empty object
const DEFAULT_THEME: ThemeProps = {};

interface ThemeProps {
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  borderColor?: string;
  buttonStyle?: 'brand' | 'outline' | 'ghost';
  cardRadius?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadowIntensity?: 'none' | 'sm' | 'md' | 'lg';
  gradientFrom?: string;
  gradientTo?: string;
}

interface ProductCardProps {
  product: Product;
  quantity: number;
  onAdd: (product: Product) => void;
  onIncrement: (product: Product) => void;
  onDecrement: (product: Product) => void;
  onClick: (product: Product) => void;
  horizontal?: boolean;
  theme?: ThemeProps;
  isWishlisted?: boolean;
  onWishlistToggle?: (productId: string) => void;
}

export const ProductCard = React.memo(function ProductCard({
  product,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  onClick,
  horizontal = false,
  theme = DEFAULT_THEME,
  isWishlisted = false,
  onWishlistToggle,
}: ProductCardProps) {
  const {
    primaryColor = '#10b981',
    secondaryColor = '#059669',
    textColor = '#172033',
    borderColor = '#e8edf0',
  } = theme;

  const discount =
    product.mrp > 0
      ? Math.max(
          0,
          Math.round(((product.mrp - product.price) / product.mrp) * 100)
        )
      : 0;

  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd(product);
    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1200);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (onWishlistToggle) {
      onWishlistToggle(product.id);
    }
  };

  const handleIncrement = () => onIncrement(product);
  const handleDecrement = () => onDecrement(product);

  const quantityTheme = useMemo(
    () => ({
      primaryColor,
      secondaryColor,
    }),
    [primaryColor, secondaryColor]
  );

  return (
    <article
      onClick={() => onClick(product)}
      className={`
        group relative flex shrink-0 cursor-pointer flex-col
        overflow-hidden bg-white
        border
        rounded-[24px]
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-[0_18px_40px_rgba(15,23,42,0.14)]
        active:scale-[0.985]
        ${horizontal ? 'w-[158px]' : 'w-full'}
      `}
      style={{
        borderColor,
        boxShadow: '0 7px 24px rgba(15, 23, 42, 0.08)',
      }}
    >
      {/* =========================================================
          IMAGE AREA
      ========================================================= */}

      <div
        className={`
          relative overflow-hidden
          bg-slate-100
          ${horizontal ? 'h-[142px]' : 'h-[220px]'}
        `}
      >
        <img
          src={product.image}
          alt={product.name}
          className="
            h-full
            w-full
            object-cover
            transition-transform
            duration-700
            group-hover:scale-[1.07]
          "
          loading="lazy"
        />

        {/* Soft image gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5" />

        {/* =====================================================
            DISCOUNT BADGE
        ===================================================== */}

        {discount > 0 && (
          <div className="absolute left-2.5 top-2.5">
            <OfferBadge
              discountPercent={discount}
              color={primaryColor}
            />
          </div>
        )}

        {/* =====================================================
            WISHLIST
        ===================================================== */}

        <button
          onClick={handleWishlistClick}
          className="
            absolute right-2.5 top-2.5
            flex h-8 w-8
            items-center justify-center
            rounded-full
            border border-white/60
            bg-white/90
            text-slate-700
            shadow-lg
            backdrop-blur-md
            transition-all
            hover:scale-105
            active:scale-90
          "
          aria-label={
            isWishlisted
              ? 'Remove from wishlist'
              : 'Add to wishlist'
          }
        >
          <Heart
            size={15}
            strokeWidth={2.2}
            className={
              isWishlisted
                ? 'fill-red-500 text-red-500'
                : ''
            }
          />
        </button>

        {/* =====================================================
            STATIC QUALITY BADGE
            Later make dynamic
        ===================================================== */}

        <div
          className="
            absolute bottom-2.5 left-2.5
            flex items-center gap-1
            rounded-full
            border border-white/50
            bg-white/90
            px-2 py-1
            shadow-md
            backdrop-blur-md
          "
        >
          <CheckCircle2
            size={10}
            strokeWidth={2.7}
            style={{ color: primaryColor }}
          />

          <span className="text-[7px] font-extrabold tracking-wide text-slate-700">
            QUALITY
          </span>
        </div>

        {/* Decorative floating icon */}
        <div
          className="
            absolute bottom-[-17px] right-[-12px]
            flex h-[48px] w-[48px]
            items-center justify-center
            rounded-full
            border-[3px] border-white
            shadow-lg
          "
          style={{
            backgroundColor: `${primaryColor}18`,
          }}
        >
          <Package
            size={18}
            strokeWidth={2}
            style={{ color: primaryColor }}
          />
        </div>
      </div>

      {/* =========================================================
          CURVED CONTENT AREA
      ========================================================= */}

      <div className="relative flex flex-1 flex-col px-3 pb-3 pt-3">
        {/* Decorative curved accent */}
        <div
          className="
            pointer-events-none
            absolute -top-[17px]
            left-0
            h-[30px]
            w-[70%]
            rounded-tr-[100%]
          "
          style={{
            backgroundColor: `${primaryColor}18`,
          }}
        />

        {/* =====================================================
            BRAND
        ===================================================== */}

        <div className="relative flex items-center gap-1">
          <span
            className="
              truncate
              text-[9px]
              font-black
              uppercase
              tracking-[0.05em]
            "
            style={{ color: primaryColor }}
          >
            {product.brand}
          </span>

          {/* Static verification */}
          <CheckCircle2
            size={10}
            strokeWidth={2.8}
            style={{ color: primaryColor }}
          />
        </div>

        {/* =====================================================
            PRODUCT NAME
        ===================================================== */}

        <h3
          className="
            mt-1
            line-clamp-2
            min-h-[30px]
            text-[12px]
            font-extrabold
            leading-[1.15]
            tracking-[-0.15px]
          "
          style={{ color: textColor }}
        >
          {product.name}
        </h3>

        {/* =====================================================
            META PILLS
        ===================================================== */}

        <div className="mt-2 flex items-center gap-1 overflow-hidden">
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
            <Package
              size={9}
              strokeWidth={2}
              className="text-slate-400"
            />

            <span className="text-[8px] font-bold text-slate-500">
              {product.packSize}
            </span>
          </div>

          <div className="shrink-0 rounded-full bg-slate-50 px-2 py-1">
            <span className="text-[8px] font-bold text-slate-500">
              MOQ {product.moq}
            </span>
          </div>
        </div>

        {/* =====================================================
            RATING
        ===================================================== */}

        <div className="mt-2 flex items-center gap-1">
          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1">
            <Star
              size={10}
              className="fill-amber-400 text-amber-400"
            />

            <span className="text-[8px] font-extrabold text-slate-700">
              {product.rating}
            </span>
          </div>

          {/* Static for now */}
          <span className="text-[8px] font-medium text-slate-400">
            Trusted
          </span>
        </div>

        {/* =========================================================
            STATIC FEATURE STRIP
        ========================================================= */}

        <div className="mt-2 flex items-center gap-1">
          <div
            className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg py-1.5"
            style={{
              backgroundColor: `${primaryColor}0d`,
            }}
          >
            <Sparkles
              size={9}
              style={{ color: primaryColor }}
            />

            <span
              className="truncate text-[7px] font-bold"
              style={{ color: primaryColor }}
            >
              Fresh
            </span>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg bg-slate-50 py-1.5">
            <Truck
              size={9}
              className="text-slate-500"
            />

            <span className="truncate text-[7px] font-bold text-slate-500">
              Delivery
            </span>
          </div>
        </div>

        {/* =========================================================
            PRICE + ACTION
        ========================================================= */}

        <div className="mt-auto pt-3">
          <div className="flex items-end justify-between gap-1">
            {/* Price */}
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                {product.mrp > product.price && (
                  <p className="truncate text-[8px] font-medium text-slate-400 line-through">
                    MRP ₹{product.mrp}
                  </p>
                )}

                {discount > 0 && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[7px] font-extrabold"
                    style={{
                      backgroundColor: `${primaryColor}12`,
                      color: primaryColor,
                    }}
                  >
                    {discount}% OFF
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-0.5">
                <span
                  className="text-[19px] font-black leading-none tracking-[-0.5px]"
                  style={{ color: primaryColor }}
                >
                  ₹{product.price}
                </span>

                <span className="text-[8px] font-semibold text-slate-400">
                  /{String(product.packSize).split(' ')[1] || ''}
                </span>
              </div>
            </div>

            {/* ===================================================
                ADD / QUANTITY
            =================================================== */}

            {quantity > 0 ? (
              <QuantitySelector
                quantity={quantity}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                theme={quantityTheme}
              />
            ) : added ? (
              <div
                className="
                  flex h-8
                  items-center gap-1
                  rounded-xl
                  px-2.5
                  text-[9px]
                  font-extrabold
                  text-white
                  shadow-md
                "
                style={{
                  backgroundColor: primaryColor,
                }}
              >
                <CheckCircle2 size={12} />
                Added
              </div>
            ) : (
              <button
                onClick={handleAdd}
                className="
                  flex h-9
                  items-center gap-1.5
                  rounded-xl
                  px-3
                  text-[10px]
                  font-extrabold
                  text-white
                  shadow-md
                  transition-all
                  hover:shadow-lg
                  active:scale-95
                "
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                <ShoppingCart
                  size={13}
                  strokeWidth={2.6}
                />

                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});

// ================================================================
// QUANTITY SELECTOR
// ================================================================

interface QuantitySelectorProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'sm' | 'md';
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export const QuantitySelector = React.memo(
  function QuantitySelector({
    quantity,
    onIncrement,
    onDecrement,
    size = 'sm',
    theme = DEFAULT_THEME,
  }: QuantitySelectorProps) {
    const {
      primaryColor = '#10b981',
    } = theme;

    const isSmall = size === 'sm';

    return (
      <div
        className="
          flex items-center
          gap-0.5
          rounded-xl
          p-1
        "
        style={{
          backgroundColor: `${primaryColor}12`,
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDecrement();
          }}
          className={`
            flex items-center justify-center
            rounded-lg bg-white
            shadow-sm
            transition
            hover:bg-slate-50
            active:scale-90
            ${isSmall ? 'h-6 w-6' : 'h-8 w-8'}
          `}
          style={{ color: primaryColor }}
          aria-label="Decrease quantity"
        >
          <Minus size={isSmall ? 12 : 15} strokeWidth={2.5} />
        </button>

        <span
          className={`
            min-w-[17px]
            text-center
            font-black
            ${isSmall ? 'text-[10px]' : 'text-sm'}
          `}
          style={{ color: primaryColor }}
        >
          {quantity}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onIncrement();
          }}
          className={`
            flex items-center justify-center
            rounded-lg bg-white
            shadow-sm
            transition
            hover:bg-slate-50
            active:scale-90
            ${isSmall ? 'h-6 w-6' : 'h-8 w-8'}
          `}
          style={{ color: primaryColor }}
          aria-label="Increase quantity"
        >
          <Plus size={isSmall ? 12 : 15} strokeWidth={2.5} />
        </button>
      </div>
    );
  }
);

// ================================================================
// PRODUCT CAROUSEL
// ================================================================

interface ProductCarouselProps {
  title: string;
  products: Product[];
  getQuantity: (id: string) => number;
  onAdd: (product: Product) => void;
  onIncrement: (product: Product) => void;
  onDecrement: (product: Product) => void;
  onProductClick: (product: Product) => void;
  onViewAll: () => void;
  theme?: ThemeProps;
  wishlist?: string[];
  onWishlistToggle?: (id: string) => void;
}

export const ProductCarousel = React.memo(
  function ProductCarousel({
    title,
    products,
    getQuantity,
    onAdd,
    onIncrement,
    onDecrement,
    onProductClick,
    onViewAll,
    theme = DEFAULT_THEME,
    wishlist = [],
    onWishlistToggle,
  }: ProductCarouselProps) {
    return (
      <section>
        {/* =======================================================
            SECTION HEADER
        ======================================================= */}

        <div className="mb-3 flex items-center justify-between px-4">
          <div className="flex items-start gap-2">
            <div
              className="
                mt-0.5
                h-7
                w-1
                rounded-full
              "
              style={{
                backgroundColor:
                  theme.primaryColor || '#10b981',
              }}
            />

            <div>
              <h2 className="text-[17px] font-black tracking-[-0.4px] text-slate-900">
                {title}
              </h2>

              {/* Static subtitle */}
              <p className="mt-0.5 text-[9px] font-medium text-slate-400">
                Fresh deals for your business
              </p>
            </div>
          </div>

          <button
            onClick={onViewAll}
            className="
              flex items-center gap-1
              rounded-full
              border
              px-3
              py-1.5
              text-[10px]
              font-extrabold
              transition
              active:scale-95
            "
            style={{
              borderColor: `${theme.primaryColor || '#10b981'}30`,
              color: theme.primaryColor || '#10b981',
              backgroundColor: `${theme.primaryColor || '#10b981'}08`,
            }}
          >
            View All
            <span className="text-[12px]">→</span>
          </button>
        </div>

        {/* =======================================================
            PRODUCTS
        ======================================================= */}

        <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar scroll-touch transform-gpu">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              quantity={getQuantity(product.id)}
              onAdd={onAdd}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              onClick={onProductClick}
              horizontal
              theme={theme}
              isWishlisted={wishlist.includes(product.id)}
              onWishlistToggle={onWishlistToggle}
            />
          ))}
        </div>
      </section>
    );
  }
);