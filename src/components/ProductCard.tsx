// components/ProductCard.tsx
import React, { useState, useMemo } from 'react';
import { Heart, Star, ShoppingCart, Plus, Minus } from 'lucide-react';
import type { Product } from '@/types';
import { OfferBadge } from './OfferBadge';

// Stable empty object to prevent breaking React.memo with inline {}
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

// 1. Updated Props: Handlers now expect a Product so we avoid inline arrow functions in parents
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

// 2. Wrapped in React.memo
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
    textColor = '#1f2937',
    borderColor = '#e5e7eb',
    buttonStyle = 'brand',
    cardRadius = 'xl',
    shadowIntensity = 'md',
    gradientFrom = '#065f46',
    gradientTo = '#16a34a',
  } = theme;

  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const [added, setAdded] = useState(false);

  const radiusMap = {
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };
  const shadowMap = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg',
  };

  const cardClasses = `
    group flex flex-col bg-white border 
    ${radiusMap[cardRadius]} ${shadowMap[shadowIntensity]} 
    transition-all duration-300 hover:-translate-y-1 hover:shadow-xl 
    cursor-pointer overflow-hidden
    ${horizontal ? 'w-[158px] shrink-0' : ''}
  `;

  const buttonBase = `
    h-8 px-2.5 flex items-center gap-1 rounded-lg text-white text-[11px] font-bold 
    shadow-sm tap-highlight active:scale-95 transition-transform
  `;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onWishlistToggle) {
      onWishlistToggle(product.id);
    }
  };

  // Stable callbacks for QuantitySelector to preserve its memoization
  const handleIncrement = () => onIncrement(product);
  const handleDecrement = () => onDecrement(product);

  // Stable theme reference for the Quantity Selector
  const quantityTheme = useMemo(
    () => ({ primaryColor, secondaryColor }), 
    [primaryColor, secondaryColor]
  );

  return (
    <article onClick={() => onClick(product)} className={cardClasses} style={{ borderColor }}>
      <div className="relative bg-ink-50 h-[132px] flex items-center justify-center overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        <div className="absolute top-2 left-2">
          <OfferBadge discountPercent={discount} color={primaryColor} />
        </div>
        <button
          onClick={handleWishlistClick}
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 flex items-center justify-center text-ink-500 shadow-sm tap-highlight active:scale-90 transition-transform"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={14}
            strokeWidth={2}
            className={isWishlisted ? 'fill-red-500 text-red-500' : ''}
          />
        </button>
      </div>

      <div className="p-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wide truncate" style={{ color: primaryColor }}>
          {product.brand}
        </p>
        <h3 className="text-[12px] font-bold leading-tight mt-0.5 line-clamp-2 min-h-[30px]" style={{ color: textColor }}>
          {product.name}
        </h3>
        <p className="text-[10px] text-ink-400 mt-1">
          {product.packSize} <span className="text-ink-300 mx-0.5">·</span> MOQ {product.moq}
        </p>
        <div className="flex items-center gap-1 mt-1.5">
          <Star size={11} className="text-amber-400 fill-amber-400" />
          <span className="text-[10px] text-ink-500 font-medium">{product.rating}</span>
        </div>
        <div className="flex items-end justify-between gap-1 mt-2">
          <div className="min-w-0">
            <p className="text-[10px] text-ink-400 line-through">MRP ₹{product.mrp}</p>
            <p className="text-[15px] font-extrabold leading-tight" style={{ color: primaryColor }}>
              ₹{product.price}
            </p>
          </div>
          {quantity > 0 ? (
            <QuantitySelector
              quantity={quantity}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              theme={quantityTheme}
            />
          ) : added ? (
            <span className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: primaryColor }}>
              ✓ Added
            </span>
          ) : (
            <button
              onClick={handleAdd}
              className={buttonBase}
              style={
                buttonStyle === 'outline'
                  ? { backgroundColor: 'transparent', border: `1px solid ${primaryColor}`, color: primaryColor }
                  : buttonStyle === 'ghost'
                  ? { backgroundColor: 'transparent', color: primaryColor }
                  : { backgroundColor: primaryColor }
              }
            >
              <ShoppingCart size={13} strokeWidth={2.5} /> Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
});

// ---- QuantitySelector wrapped in React.memo ----
interface QuantitySelectorProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'sm' | 'md';
  theme?: { primaryColor?: string; secondaryColor?: string };
}

export const QuantitySelector = React.memo(function QuantitySelector({ 
  quantity, 
  onIncrement, 
  onDecrement, 
  size = 'sm', 
  theme = DEFAULT_THEME 
}: QuantitySelectorProps) {
  const { primaryColor = '#10b981' } = theme;
  const sizeClasses = size === 'md' ? 'h-8 w-8 text-sm' : 'h-7 w-7 text-xs';

  return (
    <div className="flex items-center gap-1.5 rounded-lg p-0.5" style={{ backgroundColor: `${primaryColor}15` }}>
      <button
        onClick={(e) => { e.stopPropagation(); onDecrement(); }}
        className={`flex items-center justify-center rounded-md bg-white shadow-sm transition hover:bg-emerald-100 ${sizeClasses}`}
        style={{ color: primaryColor }}
      >
        <Minus size={size === 'md' ? 16 : 14} />
      </button>
      <span className={`min-w-[20px] text-center font-bold ${size === 'md' ? 'text-base' : 'text-sm'}`} style={{ color: primaryColor }}>
        {quantity}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onIncrement(); }}
        className={`flex items-center justify-center rounded-md bg-white shadow-sm transition hover:bg-emerald-100 ${sizeClasses}`}
        style={{ color: primaryColor }}
      >
        <Plus size={size === 'md' ? 16 : 14} />
      </button>
    </div>
  );
});

// ---- ProductCarousel wrapped in React.memo ----
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
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-base font-bold text-ink-900 tracking-tight">{title}</h2>
        <button onClick={onViewAll} className="text-xs font-semibold text-brand-600 tap-highlight">View All</button>
      </div>
      {/* 4. Added transform-gpu for hardware accelerated scrolling */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar scroll-touch px-4 pb-1 transform-gpu">
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
