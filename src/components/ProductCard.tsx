import React, { useMemo, useState, useCallback } from 'react';
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

export interface ThemeProps {
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  borderColor?: string;
  buttonStyle?: 'brand' | 'outline' | 'ghost';
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

const features = [
  { icon: Leaf, label: 'Fresh' },
  { icon: ShieldCheck, label: 'Quality' },
  { icon: Package, label: 'Bulk' },
];

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
    primaryColor = '#02402c',
    secondaryColor = '#03543a',
    textColor = '#172033',
    borderColor = '#e8edf0',
    buttonStyle = 'brand',
  } = theme;

  const discount =
    product.mrp > 0
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const [added, setAdded] = useState(false);

  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onAdd(product);
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
      }, 1000);
    },
    [onAdd, product]
  );

  const handleWishlistClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onWishlistToggle?.(product.id);
    },
    [onWishlistToggle, product.id]
  );

  const handleIncrement = useCallback(() => onIncrement(product), [onIncrement, product]);
  const handleDecrement = useCallback(() => onDecrement(product), [onDecrement, product]);

  const quantityTheme = useMemo(
    () => ({
      primaryColor,
      secondaryColor,
    }),
    [primaryColor, secondaryColor]
  );

  const productTag = discount >= 10 ? 'BEST DEAL' : 'FRESH';
  const productQuality = product.brand;

  return (
    <article
      onClick={() => onClick(product)}
      className={`
        group relative flex flex-col overflow-hidden
        cursor-pointer bg-white border
        ${horizontal ? 'w-[172px] shrink-0' : 'w-full'}
        rounded-2xl shadow-sm
        active:scale-[0.985] transform-gpu
      `}
      style={{ borderColor }}
    >
      <div className="relative flex h-[135px] w-full items-center justify-center overflow-hidden bg-slate-50">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <Package size={34} strokeWidth={1.5} />
          </div>
        )}

        <div className="absolute left-2 top-2">
          {discount > 0 ? (
            <div
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-black tracking-wide text-white shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              <Sparkles size={8} strokeWidth={2.5} />
              {discount}% OFF
            </div>
          ) : (
            <div className="rounded-full bg-white/95 px-2 py-0.5 text-[8px] font-black tracking-wide text-slate-700 shadow-xs">
              {productTag}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleWishlistClick}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-xs active:scale-90"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={13}
            strokeWidth={2.2}
            className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-slate-600'}
          />
        </button>

        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full border border-white bg-white/95 px-1.5 py-0.5 shadow-xs">
          <ShieldCheck size={8} strokeWidth={2.5} style={{ color: primaryColor }} />
          <span
            className="text-[7px] font-extrabold uppercase max-w-[65px] truncate"
            style={{ color: primaryColor }}
          >
            {productQuality}
          </span>
        </div>
      </div>

      <div className="relative p-2.5 flex flex-col justify-between flex-1 bg-white">
        <div>
          <div className="flex items-center gap-1">
            <p
              className="max-w-[100px] truncate text-[8.5px] font-black uppercase tracking-[0.03em]"
              style={{ color: primaryColor }}
            >
              {product.brand}
            </p>
            <div
              className="flex h-3 w-3 items-center justify-center rounded-full"
              style={{ backgroundColor: `${primaryColor}18` }}
            >
              <ShieldCheck size={8} strokeWidth={2.8} style={{ color: primaryColor }} />
            </div>
          </div>

          <h3
            className="mt-0.5 line-clamp-1 text-[11px] font-extrabold leading-tight tracking-[-0.1px]"
            style={{ color: textColor }}
          >
            {product.name}
          </h3>

          <div className="mt-1 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <span className="rounded bg-slate-100 px-1 py-0.5 text-[7.5px] font-bold text-slate-600">
                {product.packSize}
              </span>
              <span className="rounded bg-slate-100 px-1 py-0.5 text-[7.5px] font-bold text-slate-600">
                MOQ {product.moq}
              </span>
            </div>

            <div className="flex items-center gap-0.5 rounded-full bg-amber-50 px-1 py-0.5">
              <Star size={8} className="fill-amber-400 text-amber-400" />
              <span className="text-[8px] font-bold text-slate-700">{product.rating}</span>
            </div>
          </div>

          <div className="mt-1 flex items-center gap-1">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.label}
                  className="flex min-w-0 flex-1 items-center justify-center gap-0.5 rounded bg-slate-50 px-0.5 py-0.5"
                >
                  <Icon size={8} strokeWidth={2.2} style={{ color: primaryColor }} />
                  <span className="truncate text-[6.5px] font-bold text-slate-500">
                    {feature.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-2 flex items-end justify-between gap-1">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-[7.5px] font-medium text-slate-400 line-through">
                ₹{product.mrp}
              </p>
              {discount > 0 && (
                <span className="text-[6.5px] font-extrabold text-red-500">
                  {discount}% OFF
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-0.5">
              <span
                className="text-[15px] font-black leading-none tracking-tight"
                style={{ color: primaryColor }}
              >
                ₹{product.price}
              </span>
              <span className="text-[7px] font-semibold text-slate-400">
                /{product.packSize}
              </span>
            </div>
          </div>

          {quantity > 0 ? (
            <QuantitySelector
              quantity={quantity}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              theme={quantityTheme}
            />
          ) : added ? (
            <span
              className="flex h-7 items-center gap-1 rounded-lg px-2 text-[8.5px] font-extrabold text-white shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              ✓ Added
            </span>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="flex h-7 items-center gap-1 rounded-lg px-2.5 text-[9.5px] font-extrabold shadow-sm active:scale-95"
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
              <ShoppingCart size={11} strokeWidth={2.6} />
              Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
});

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
  const { primaryColor = '#02402c' } = theme;
  const buttonSize = size === 'md' ? 'h-6 w-6' : 'h-5.5 w-5.5';

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg p-0.5 shadow-2xs"
      style={{ backgroundColor: `${primaryColor}18` }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDecrement();
        }}
        className={`flex ${buttonSize} items-center justify-center rounded-md bg-white shadow-2xs active:scale-90`}
        style={{ color: primaryColor }}
        aria-label="Decrease quantity"
      >
        <Minus size={9} />
      </button>

      <span
        className="min-w-[15px] text-center text-[9.5px] font-black"
        style={{ color: primaryColor }}
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onIncrement();
        }}
        className={`flex ${buttonSize} items-center justify-center rounded-md bg-white shadow-2xs active:scale-90`}
        style={{ color: primaryColor }}
        aria-label="Increase quantity"
      >
        <Plus size={9} />
      </button>
    </div>
  );
});

interface ProductCarouselProps {
  title: string;
  subtitle?: string;
  products: Product[];
  getQuantity: (id: string) => number;
  onAdd: (product: Product) => void;
  onIncrement: (product: Product) => void;
  onDecrement: (product: Product) => void;
  onProductClick: (product: Product) => void;
  onViewAll?: () => void;
  theme?: ThemeProps;
  wishlist?: string[];
  onWishlistToggle?: (id: string) => void;
}

export const ProductCarousel = React.memo(function ProductCarousel({
  title,
  subtitle,
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
  const activePrimary = theme.primaryColor || '#02402c';

  return (
    <section className="transform-gpu">
      <div className="mb-2.5 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-1 rounded-full"
            style={{ backgroundColor: activePrimary }}
          />
          <div>
            <h2 className="text-base font-black tracking-tight text-slate-900">
              {title}
            </h2>
            <p className="text-[9px] font-medium text-slate-400">
              {subtitle || 'Fresh deals for your business'}
            </p>
          </div>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9.5px] font-extrabold active:scale-95"
            style={{
              color: activePrimary,
              borderColor: `${activePrimary}35`,
              backgroundColor: `${activePrimary}08`,
            }}
          >
            View All
            <span className="text-[10px]">→</span>
          </button>
        )}
      </div>

      <div className="flex gap-2.5 overflow-x-auto px-4 pb-2 no-scrollbar scroll-touch transform-gpu">
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
