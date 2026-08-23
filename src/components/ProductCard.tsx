// components/ProductCard.tsx
import React, { useMemo, useState } from 'react';
import {
  Heart,
  Star,
  ShoppingCart,
  Plus,
  Minus,
  Leaf,
  ShieldCheck,
  Package,
  Sparkles,
} from 'lucide-react';
import type { Product } from '@/types';
import { OfferBadge } from './OfferBadge';

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

const DEFAULT_THEME: ThemeProps = {};

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
    buttonStyle = 'brand',
  } = theme;

  const discount =
    product.mrp > 0
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
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

  const productTag = discount >= 10 ? 'BEST DEAL' : 'FRESH';
  
  // 🔥 Using brand name instead of 'Farm Fresh'
  const productQuality = product.brand;

  const features = [
    {
      icon: Leaf,
      label: 'Fresh',
    },
    {
      icon: ShieldCheck,
      label: 'Quality',
    },
    {
      icon: Package,
      label: 'Bulk',
    },
  ];

  return (
    <article
      onClick={() => onClick(product)}
      className={`
        group relative flex flex-col overflow-hidden
        cursor-pointer bg-white
        border
        ${horizontal ? 'w-[184px] shrink-0' : 'w-full'}
        rounded-[22px]
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-[0_14px_35px_rgba(15,23,42,0.14)]
        active:scale-[0.985]
      `}
      style={{
        borderColor,
        boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)',
      }}
    >
      {/* =====================================================
          PRODUCT IMAGE
      ===================================================== */}

      <div className="relative h-[144px] overflow-hidden bg-slate-50">
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
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            background: `linear-gradient(
              145deg,
              ${primaryColor}55,
              transparent 55%,
              ${secondaryColor}22
            )`,
          }}
        />

        {/* Bottom image fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />

        {/* =================================================
            DEAL BADGE
        ================================================= */}

        <div className="absolute left-2.5 top-2.5">
          {discount > 0 ? (
            <div
              className="
                flex items-center gap-1
                rounded-full
                px-2.5 py-1
                text-[8px]
                font-black
                tracking-wide
                text-white
                shadow-md
                backdrop-blur-sm
              "
              style={{
                backgroundColor: primaryColor,
              }}
            >
              <Sparkles size={9} strokeWidth={2.5} />
              {discount}% OFF
            </div>
          ) : (
            <div className="rounded-full bg-white/90 px-2.5 py-1 text-[8px] font-black tracking-wide text-slate-700 shadow-sm backdrop-blur-md">
              {productTag}
            </div>
          )}
        </div>

        {/* =================================================
            WISHLIST
        ================================================= */}

        <button
          onClick={handleWishlistClick}
          className="
            absolute right-2.5 top-2.5
            flex h-8 w-8
            items-center justify-center
            rounded-full
            border border-white/70
            bg-white/90
            text-slate-500
            shadow-md
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
            size={14}
            strokeWidth={2.2}
            className={
              isWishlisted
                ? 'fill-red-500 text-red-500'
                : 'text-slate-600'
            }
          />
        </button>

        {/* =================================================
            QUALITY FLOATING BADGE (Brand Name)
        ================================================= */}

        <div
          className="
            absolute
            bottom-2
            right-2
            flex
            items-center
            gap-1
            rounded-full
            border
            border-white
            bg-white/95
            px-2
            py-1
            shadow-md
            backdrop-blur-md
          "
        >
          {/* Changed icon from Leaf to ShieldCheck for brands */}
          <ShieldCheck
            size={9}
            strokeWidth={2.5}
            style={{ color: primaryColor }}
          />

          <span
            className="text-[7px] font-extrabold uppercase max-w-[80px] truncate"
            style={{ color: primaryColor }}
          >
            {productQuality}
          </span>
        </div>
      </div>

      {/* =====================================================
          CURVED CONTENT TOP
      ===================================================== */}

      <div className="relative bg-white">
        {/* Decorative accent curve */}
        <div
          className="absolute -top-[17px] left-0 h-[25px] w-full"
          style={{
            backgroundColor: 'white',
            clipPath: 'ellipse(70% 75% at 25% 100%)',
          }}
        />

        {/* Small accent line */}
        <div
          className="absolute -top-[3px] left-4 h-[3px] w-9 rounded-full opacity-80"
          style={{
            backgroundColor: primaryColor,
          }}
        />

        {/* =================================================
            CONTENT
        ================================================= */}
        
        <div className="relative px-3 pb-2 pt-1">
          {/* Brand */}
          <div className="flex items-center gap-1">
            <p
              className="
                max-w-[105px]
                truncate
                text-[9px]
                font-black
                uppercase
                tracking-[0.04em]
              "
              style={{ color: primaryColor }}
            >
              {product.brand}
            </p>

            {/* Static verified mark */}
            <div
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full"
              style={{
                backgroundColor: `${primaryColor}18`,
              }}
            >
              <ShieldCheck
                size={9}
                strokeWidth={2.8}
                style={{ color: primaryColor }}
              />
            </div>
          </div>

          {/* Product name */}
          <h3
            className="
              mt-0.5
              line-clamp-2
              min-h-[29px]
              text-[12px]
              font-extrabold
              leading-[1.2]
              tracking-[-0.15px]
            "
            style={{ color: textColor }}
          >
            {product.name}
          </h3>

          {/* =================================================
              META
          ================================================= */}

          <div className="mt-1 flex items-center gap-1">
            <span
              className="
                rounded-md
                bg-slate-50
                px-1.5
                py-1
                text-[8px]
                font-bold
                text-slate-500
              "
            >
              {product.packSize}
            </span>

            <span className="text-[9px] text-slate-300">•</span>

            <span
              className="
                rounded-md
                bg-slate-50
                px-1.5
                py-1
                text-[8px]
                font-bold
                text-slate-500
              "
            >
              MOQ {product.moq}
            </span>
          </div>

          {/* =================================================
              RATING
          ================================================= */}

          <div className="mt-1 flex items-center gap-1.5">
            <div
              className="
                flex items-center gap-1
                rounded-full
                bg-amber-50
                px-1.5
                py-0.5
              "
            >
              <Star
                size={9}
                className="fill-amber-400 text-amber-400"
              />

              <span className="text-[9px] font-bold text-slate-700">
                {product.rating}
              </span>
            </div>

            <span className="text-[8px] text-slate-400">
              Trusted
            </span>
          </div>

          {/* =================================================
              MINI FEATURES
          ================================================= */}

          <div className="mt-1 flex items-center gap-1">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.label}
                  className="
                    flex
                    min-w-0
                    flex-1
                    items-center
                    justify-center
                    gap-1
                    rounded-lg
                    bg-slate-50
                    px-1
                    py-1.5
                  "
                >
                  <Icon
                    size={9}
                    strokeWidth={2.3}
                    style={{ color: primaryColor }}
                  />

                  <span className="truncate text-[7px] font-bold text-slate-500">
                    {feature.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* =================================================
              PRICE + CART
          ================================================= */}

          <div className="mt-1.5 flex items-end justify-between gap-1">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-[8px] font-medium text-slate-400 line-through">
                  MRP ₹{product.mrp}
                </p>

                {discount > 0 && (
                  <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[7px] font-extrabold text-red-500">
                    {discount}% OFF
                  </span>
                )}
              </div>

              <div className="mt-0.5 flex items-baseline gap-0.5">
                <span
                  className="text-[18px] font-black leading-none tracking-[-0.5px]"
                  style={{ color: primaryColor }}
                >
                  ₹{product.price}
                </span>

                <span className="text-[7px] font-semibold text-slate-400">
                  /{product.packSize}
                </span>
              </div>
            </div>

            {/* =================================================
                CART STATE
            ================================================= */}

            {quantity > 0 ? (
              <QuantitySelector
                quantity={quantity}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                theme={quantityTheme}
              />
            ) : added ? (
              <span
                className="
                  flex
                  h-8
                  items-center
                  gap-1
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
                ✓ Added
              </span>
            ) : (
              <button
                onClick={handleAdd}
                className="
                  flex
                  h-8
                  items-center
                  gap-1
                  rounded-xl
                  px-2.5
                  text-[10px]
                  font-extrabold
                  shadow-md
                  transition-all
                  active:scale-95
                "
                style={
                  buttonStyle === 'outline'
                    ? {
                        backgroundColor: 'white',
                        border: `1px solid ${primaryColor}`,
                        color: primaryColor,
                      }
                    : buttonStyle === 'ghost'
                    ? {
                        backgroundColor: `${primaryColor}12`,
                        color: primaryColor,
                      }
                    : {
                        backgroundColor: primaryColor,
                        color: 'white',
                      }
                }
              >
                <ShoppingCart
                  size={12}
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

// =============================================================
// QUANTITY SELECTOR
// =============================================================

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

export const QuantitySelector = React.memo(function QuantitySelector({
  quantity,
  onIncrement,
  onDecrement,
  size = 'sm',
  theme = DEFAULT_THEME,
}: QuantitySelectorProps) {
  const {
    primaryColor = '#10b981',
  } = theme;

  const buttonSize =
    size === 'md'
      ? 'h-7 w-7'
      : 'h-6 w-6';

  return (
    <div
      className="
        flex
        items-center
        gap-0.5
        rounded-xl
        p-0.5
        shadow-sm
      "
      style={{
        backgroundColor: `${primaryColor}18`,
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDecrement();
        }}
        className={`
          flex
          ${buttonSize}
          items-center
          justify-center
          rounded-lg
          bg-white
          shadow-sm
          transition
          active:scale-90
        `}
        style={{ color: primaryColor }}
        aria-label="Decrease quantity"
      >
        <Minus size={12} />
      </button>

      <span
        className="
          min-w-[18px]
          text-center
          text-[10px]
          font-black
        "
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
          flex
          ${buttonSize}
          items-center
          justify-center
          rounded-lg
          bg-white
          shadow-sm
          transition
          active:scale-90
        `}
        style={{ color: primaryColor }}
        aria-label="Increase quantity"
      >
        <Plus size={12} />
      </button>
    </div>
  );
});

// =============================================================
// PRODUCT CAROUSEL
// =============================================================

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

export const ProductCarousel = React.memo(function ProductCarousel({
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
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-3 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-1 rounded-full"
            style={{
              backgroundColor:
                theme.primaryColor || '#10b981',
            }}
          />

          <div>
            <h2 className="text-base font-black tracking-tight text-slate-900">
              {title}
            </h2>

            <p className="text-[9px] font-medium text-slate-400">
              Fresh deals for your business
            </p>
          </div>
        </div>

        <button
          onClick={onViewAll}
          className="
            flex
            items-center
            gap-1
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
            color: theme.primaryColor || '#059669',
            borderColor: `${theme.primaryColor || '#10b981'}35`,
            backgroundColor: `${theme.primaryColor || '#10b981'}08`,
          }}
        >
          View All
          <span className="text-[12px]">→</span>
        </button>
      </div>

      {/* =====================================================
          PRODUCTS
      ===================================================== */}

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
});
