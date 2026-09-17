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
      className={`flex flex-row p-3 bg-white rounded-xl border shadow-[0_1px_3px_rgba(0,0,0,0.02)] cursor-pointer ${!product.inStock ? 'border-slate-100 opacity-95' : 'border-slate-100'}`}
    >
      {/* Left Column: Info & Pricing */}
      <div className="flex flex-col flex-1 pr-3 justify-center">
        <h3 className={`text-[13px] font-bold leading-tight ${!product.inStock ? 'text-slate-600' : 'text-slate-800'}`}>
          {product.brand ? `${product.brand} - ` : ''}{product.name}
        </h3>
        <p className="text-xs text-slate-500 mt-1">{product.packSize}</p>
        
        <div className="flex items-center gap-1 mt-2">
          <div className={`flex items-center gap-0.5 rounded px-1 py-0.5 border ${!product.inStock ? 'bg-slate-50 border-slate-100' : 'bg-green-50 border-green-100'}`}>
            <Star size={10} className={!product.inStock ? 'fill-slate-400 text-slate-400' : 'fill-green-600 text-green-600'} />
            <span className={`text-[10px] font-bold ${!product.inStock ? 'text-slate-500' : 'text-green-700'}`}>{product.rating || '4.0'}</span>
          </div>
          <span className="text-[10px] text-slate-400">({Math.floor(Math.random() * 800 + 100)})</span>
        </div>

        <div className="mt-4 flex items-baseline gap-1.5">
          <span className={`text-sm font-black ${!product.inStock ? 'text-slate-600' : 'text-slate-900'}`}>₹{product.price}</span>
          {discount > 0 && (
            <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
          )}
        </div>
      </div>

      {/* Right Column: Image, Discount Badge & Actions */}
      <div className="flex flex-col items-end w-[90px] shrink-0">
        {discount > 0 ? (
          <div className={`text-white text-[9px] font-bold px-1.5 py-0.5 rounded mb-1 self-end ${!product.inStock ? 'bg-slate-400' : 'bg-blue-600'}`}>
            {discount}% OFF
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
              className={`absolute inset-0 w-full h-full object-cover mix-blend-multiply transition-all ${!product.inStock ? 'grayscale opacity-70' : ''}`}
            />
          ) : (
            <Package size={24} className="text-slate-300" />
          )}

          {/* Elegant Out of Stock Overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[1.5px]">
              <div className="bg-white/95 px-1.5 py-1 rounded shadow-sm border border-slate-100 flex items-center">
                <span className="text-[7px] font-black tracking-widest text-slate-600 uppercase">Sold Out</span>
              </div>
            </div>
          )}
          
          <button
            type="button"
            onClick={handleWishlistClick}
            className="absolute top-1 right-1 bg-white/90 rounded-full p-1 shadow-sm z-20"
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
                className={`w-7 h-full flex items-center justify-center active:bg-black/5 ${!product.inStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ color: primaryColor }}
                disabled={!product.inStock}
              >
                <Plus size={14} />
              </button>
            </div>
          ) : !product.inStock ? (
            <button
              type="button"
              disabled
              className="flex items-center justify-center w-[80px] h-[28px] rounded-lg border border-slate-100 bg-slate-50 text-slate-400 font-bold text-[9px] cursor-not-allowed shadow-none"
            >
              SOLD OUT
            </button>
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
