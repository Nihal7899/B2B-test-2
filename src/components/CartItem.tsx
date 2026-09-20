import { Trash2, AlertCircle } from 'lucide-react';
import type { CartItem as CartItemType } from '@/types';
import { QuantitySelector } from './QuantitySelector';
import { CachedImage } from '@/components/CachedImage';

interface CartItemProps {
  item: CartItemType;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  onClick: () => void;
}

export function CartItem({ item, onIncrement, onDecrement, onRemove, onClick }: CartItemProps) {
  const hasVolumeDiscount = item.effectiveUnitPrice < item.product.price;
  const lineTotal = item.effectiveUnitPrice * item.quantity;

  return (
    <div className="flex gap-3 py-3.5">
      {/* Image */}
      <button
        onClick={onClick}
        className="h-[84px] w-[84px] rounded-2xl overflow-hidden bg-slate-50 shrink-0 ring-1 ring-slate-100 active:scale-95 transition-transform"
      >
        <CachedImage
          src={item.product.image}
          alt={item.product.name}
          className="h-full w-full object-cover"
        />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {/* Brand chip */}
              <span className="inline-block text-[9.5px] font-black text-[#02402c] bg-[#02402c]/[0.08] rounded px-1.5 py-[2px] tracking-wider uppercase">
                {item.product.brand}
              </span>

              {/* Name */}
              <h3 className="font-bold text-[13.5px] text-slate-900 truncate mt-1.5 tracking-[-0.01em]">
                {item.product.name}
              </h3>

              {/* Pack + price hint */}
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5 truncate">
                {item.product.packSize} · ₹{item.product.price}/unit
                {hasVolumeDiscount && (
                  <span className="ml-1.5 text-[9.5px] text-emerald-600 font-black uppercase tracking-wide">
                    • Volume
                  </span>
                )}
              </p>
            </div>

            {/* Remove */}
            <button
              onClick={onRemove}
              className="h-7 w-7 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors shrink-0 active:scale-95"
              aria-label="Remove item"
            >
              <Trash2 size={13} strokeWidth={2.4} />
            </button>
          </div>

          {/* Out of stock */}
          {!item.product.inStock && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-100 px-2 py-1.5">
              <AlertCircle size={11} className="text-red-500 shrink-0" strokeWidth={2.5} />
              <p className="text-[10px] font-bold text-red-600">Out of stock — remove to checkout</p>
            </div>
          )}
        </div>

        {/* Bottom row: qty + price */}
        <div className="flex items-end justify-between mt-2.5 gap-2">
          <QuantitySelector
            quantity={item.quantity}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
          />
          <div className="text-right shrink-0">
            <p className="text-[15.5px] font-black text-[#02402c] tabular-nums leading-none tracking-[-0.02em]">
              ₹{lineTotal.toLocaleString('en-IN')}
            </p>
            {item.quantity > 1 && (
              <p className="text-[9.5px] font-bold text-slate-400 mt-1 tabular-nums">
                ₹{item.effectiveUnitPrice.toLocaleString('en-IN')} × {item.quantity}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}