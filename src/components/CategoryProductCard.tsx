import React, { useCallback } from 'react';
import { Heart, Star, Plus, Minus, Package } from 'lucide-react';
import type { Product } from '@/types';
import { CachedImage } from '@/components/CachedImage';

export interface ThemeProps {
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  borderColor?: string;
}

interface CategoryProductCardProps {
  product: Product;
  quantity: number;
  onAdd: (product: Product, quantity?: number) => void;
  onIncrement: (product: Product) => void;
  onDecrement: (product: Product) => void;
  onClick: (product: Product) => void;
  theme?: ThemeProps;
  isWishlisted?: boolean;
  onWishlistToggle?: (productId: string) => void;
}

export const CategoryProductCard = React.memo(function CategoryProductCard({
  product,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  onClick,
  theme = {},
  isWishlisted = false,
  onWishlistToggle,
}: CategoryProductCardProps) {
  const { primaryColor = '#e11d48' } = theme;

  const discount = product.mrp > 0 ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const handleWishlistClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onWishlistToggle?.(product.id);
    },
    [onWishlistToggle, product.id]
  );

  return (
    <div
      onClick={() => onClick(product)}
      className="flex flex-row p-3 bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] cursor-pointer"
    >
      {/* Left Column: Info & Pricing */}
      <div className="flex flex-col flex-1 pr-3 justify-center">
        <h3 className="text-[13px] font-bold text-slate-800 leading-tight">
          {product.brand ? `${product.brand} - ` : ''}{product.name}
        </h3>
        <p className="text-xs text-slate-500 mt-1">{product.packSize}</p>
        
        <div className="flex items-center gap-1 mt-2">
          <div className="flex items-center gap-0.5 rounded px-1 py-0.5 bg-green-50 border border-green-100">
            <Star size={10} className="fill-green-600 text-green-600" />
            <span className="text-[10px] font-bold text-green-700">{product.rating || '4.0'}</span>
          </div>
          <span className="text-[10px] text-slate-400">({Math.floor(Math.random() * 800 + 100)})</span>
        </div>

        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="text-sm font-black text-slate-900">₹{product.price}</span>
          {discount > 0 && (
            <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
          )}
        </div>
      </div>

      {/* Right Column: Image, Discount Badge & Actions */}
      <div className="flex flex-col items-end w-[90px] shrink-0">
        {discount > 0 ? (
          <div className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded mb-1 self-end">
            {discount}% OFF MRP
          </div>
        ) : (
          <div className="h-4 mb-1" />
        )}
        
        {/* Filled Curved Square Image Container */}
        <div className="relative w-[72px] h-[72px] rounded-lg overflow-hidden self-end shrink-0 bg-slate-50 flex items-center justify-center">
          {product.image ? (
            <CachedImage
              src={product.image}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover mix-blend-multiply"
            />
          ) : (
            <Package size={24} className="text-slate-300" />
          )}
          
          <button
            type="button"
            onClick={handleWishlistClick}
            className="absolute top-1 right-1 bg-white/90 rounded-full p-1 shadow-sm z-10"
          >
            <Heart
              size={12}
              className={isWishlisted ? 'fill-slate-400 text-slate-400' : 'text-slate-300'}
            />
          </button>
        </div>

        <div className="mt-2 w-full flex justify-end">
          {quantity > 0 ? (
            <div 
              className="flex items-center justify-between w-[80px] h-[28px] rounded border shadow-sm"
              style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}10` }}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDecrement(product); }}
                className="w-7 h-full flex items-center justify-center active:bg-black/5"
                style={{ color: primaryColor }}
              >
                <Minus size={14} />
              </button>
              <span className="text-xs font-bold" style={{ color: primaryColor }}>
                {quantity}
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onIncrement(product); }}
                className="w-7 h-full flex items-center justify-center active:bg-black/5"
                style={{ color: primaryColor }}
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAdd(product, product.moq); }}
              className="flex items-center justify-center w-[80px] h-[28px] rounded border bg-white shadow-sm font-bold text-xs active:scale-95 transition-transform"
              style={{ color: primaryColor, borderColor: `${primaryColor}30` }}
            >
              ADD <Plus size={12} className="ml-1 opacity-70" />
            </button>
          )}
        </div>
        {product.moq > 1 && (
          <p className="text-[9px] text-slate-400 mt-1 self-end text-center w-full">Min Qty {product.moq}</p>
        )}
      </div>
    </div>
  );
});
