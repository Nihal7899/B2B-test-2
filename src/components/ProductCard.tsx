// components/ProductCard.tsx
import { Heart, Star, ShoppingCart, Minus, Plus } from 'lucide-react';
import type { Product } from '@/types';
import { OfferBadge } from './OfferBadge';
import { QuantitySelector } from './QuantitySelector';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onClick: () => void;
  horizontal?: boolean;
}

export function ProductCard({
  product,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  onClick,
  horizontal = false,
}: ProductCardProps) {
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd();
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article
      onClick={onClick}
      className={`group flex flex-col rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg ${horizontal ? 'w-[158px] shrink-0' : ''}`}
    >
      <div className="relative mb-2 overflow-hidden rounded-xl bg-gray-50">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-28 w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {discount > 0 && (
          <div className="absolute left-1.5 top-1.5">
            <OfferBadge discountPercent={discount} />
          </div>
        )}
        <button
          onClick={(e) => e.stopPropagation()}
          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white"
        >
          <Heart size={14} className="text-gray-600" />
        </button>
      </div>

      <div className="flex flex-1 flex-col">
        <p className="text-[11px] font-medium text-gray-400">{product.brand}</p>
        <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-800">{product.name}</h4>
        <p className="mt-0.5 text-[11px] text-gray-500">
          MOQ {product.moq} · per {product.packSize}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div>
            <p className="text-sm font-bold text-gray-900">
              ₹{product.price}
              <span className="text-[11px] font-normal text-gray-400">/{product.packSize}</span>
            </p>
            {discount > 0 && (
              <p className="text-[10px] text-gray-400 line-through">₹{product.mrp}</p>
            )}
          </div>
          {quantity > 0 ? (
            <QuantitySelector
              quantity={quantity}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
            />
          ) : added ? (
            <span className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
              ✓ Added
            </span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); handleAdd(); }}
              className="rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
            >
              + Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// Keep existing ProductCarousel with same props
export function ProductCarousel({ title, products, getQuantity, onAdd, onIncrement, onDecrement, onProductClick, onViewAll }: any) {
  return (
    <section>
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-base font-bold text-ink-900 tracking-tight">{title}</h2>
        <button onClick={onViewAll} className="text-xs font-semibold text-brand-600 tap-highlight">View All</button>
      </div>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar scroll-touch px-4 pb-1">
        {products.map((product: any) => (
          <ProductCard
            key={product.id}
            product={product}
            quantity={getQuantity(product.id)}
            onAdd={() => onAdd(product)}
            onIncrement={() => onIncrement(product)}
            onDecrement={() => onDecrement(product)}
            onClick={() => onProductClick(product)}
            horizontal
          />
        ))}
      </div>
    </section>
  );
}