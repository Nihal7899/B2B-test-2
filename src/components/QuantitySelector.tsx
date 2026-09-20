import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'sm' | 'md';
}

export function QuantitySelector({ quantity, onIncrement, onDecrement, size = 'sm' }: QuantitySelectorProps) {
  const btn = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const icon = size === 'sm' ? 13 : 17;

  return (
    <div className="flex items-center gap-1 rounded-xl bg-[#02402c]/[0.06] border border-[#02402c]/15 p-0.5">
      <button
        onClick={(e) => { e.stopPropagation(); onDecrement(); }}
        className={`${btn} flex items-center justify-center rounded-lg bg-white text-[#02402c] shadow-sm ring-1 ring-[#02402c]/10 active:scale-90 transition-transform`}
        aria-label="Decrease quantity"
      >
        <Minus size={icon} strokeWidth={2.7} />
      </button>
      <span className="min-w-[1.5rem] text-center text-[13px] font-black text-[#02402c] tabular-nums">
        {quantity}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onIncrement(); }}
        className={`${btn} flex items-center justify-center rounded-lg bg-[#02402c] text-white shadow-sm active:scale-90 transition-transform`}
        aria-label="Increase quantity"
      >
        <Plus size={icon} strokeWidth={2.7} />
      </button>
    </div>
  );
}