// components/ProductCard.tsx
import { Heart, Star, ShoppingCart } from 'lucide-react';
import type { Product } from '@/types';
import { OfferBadge } from './OfferBadge';
import { QuantitySelector } from './QuantitySelector';
import { useState } from 'react';

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
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onClick: () => void;
  horizontal?: boolean;
  theme?: ThemeProps;
}

export function ProductCard({
  product,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  onClick,
  horizontal = false,
  theme = {},
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

  const handleAdd = () => {
    onAdd();
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article onClick={onClick} className={cardClasses} style={{ borderColor }}>
      {/* Image with gradient overlay from store theme */}
      <div className="relative bg-ink-50 h-[132px] flex items-center justify-center overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Gradient overlay using store theme */}
        <div
          className="absolute inset-0 bg-gradient-to-t opacity-20 pointer-events-none"
          style={{ background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        <div className="absolute top-2 left-2">
          <OfferBadge discountPercent={discount} />
        </div>
        <button
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 flex items-center justify-center text-ink-500 shadow-sm tap-highlight active:scale-90 transition-transform"
          aria-label="Add to wishlist"
        >
          <Heart size={14} strokeWidth={2} />
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
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              theme={{ primaryColor, secondaryColor }}
            />
          ) : added ? (
            <span className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: primaryColor }}>
              ✓ Added
            </span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); handleAdd(); }}
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
}

// ---- QuantitySelector with theme support ----
interface QuantitySelectorProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  theme?: { primaryColor?: string; secondaryColor?: string };
}

export function QuantitySelector({ quantity, onIncrement, onDecrement, theme = {} }: QuantitySelectorProps) {
  const { primaryColor = '#10b981', secondaryColor = '#059669' } = theme;

  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 p-0.5" style={{ backgroundColor: `${primaryColor}15` }}>
      <button
        onClick={(e) => { e.stopPropagation(); onDecrement(); }}
        className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-100"
        style={{ color: primaryColor }}
      >
        <Minus size={14} />
      </button>
      <span className="min-w-[20px] text-center text-sm font-bold text-emerald-700" style={{ color: primaryColor }}>
        {quantity}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onIncrement(); }}
        className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-100"
        style={{ color: primaryColor }}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

// ---- ProductCarousel (unchanged) ----
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
}

export function ProductCarousel({
  title,
  products,
  getQuantity,
  onAdd,
  onIncrement,
  onDecrement,
  onProductClick,
  onViewAll,
  theme = {},
}: ProductCarouselProps) {
  return (
    <section>
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-base font-bold text-ink-900 tracking-tight">{title}</h2>
        <button onClick={onViewAll} className="text-xs font-semibold text-brand-600 tap-highlight">View All</button>
      </div>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar scroll-touch px-4 pb-1">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            quantity={getQuantity(product.id)}
            onAdd={() => onAdd(product)}
            onIncrement={() => onIncrement(product)}
            onDecrement={() => onDecrement(product)}
            onClick={() => onProductClick(product)}
            horizontal
            theme={theme}
          />
        ))}
      </div>
    </section>
  );
}