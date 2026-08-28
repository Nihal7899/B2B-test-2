import { useEffect, useState, useMemo } from 'react';
import { MapPin, ChevronDown, Search, ShoppingBag } from 'lucide-react';
import { fetchAddresses, type DbAddress } from '@/services/catalog';
import { getOrBuildSearchDictionary } from '@/services/searchEngine';

interface HeaderProps {
  onSearchClick: () => void;
  cartCount: number;
  onCartClick: () => void;
  onLocationClick: () => void;
}

export function Header({
  onSearchClick,
  cartCount,
  onCartClick,
  onLocationClick,
}: HeaderProps) {
  const [address, setAddress] = useState<DbAddress | null>(null);
  const [animatedWords, setAnimatedWords] = useState<string[]>([
    'Refined Oil',
    'Basmati Rice',
    'Chakki Atta',
    'Sugar S-30',
    'Toor Dal',
    'Cow Ghee',
    'Spices & Masalas',
  ]);
  const [keywordIndex, setKeywordIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  // 1. Fetch user delivery address once
  useEffect(() => {
    let active = true;
    void fetchAddresses().then((addrs) => {
      if (active && addrs.length > 0) {
        setAddress(addrs.find((a) => a.is_default) || addrs[0]);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // 2. Fetch catalog keywords dynamically
  useEffect(() => {
    let active = true;
    void getOrBuildSearchDictionary().then((dict) => {
      if (active && dict.allKeywords.length > 0) {
        setAnimatedWords(dict.allKeywords.slice(0, 35).map((k) => k.word));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // 3. Cycle animated placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setKeywordIndex((prev) => (prev + 1) % animatedWords.length);
        setIsFading(false);
      }, 150);
    }, 2800);

    return () => clearInterval(interval);
  }, [animatedWords]);

  const locationText = useMemo(() => {
    if (!address) return 'Choose location';
    if (address.label && address.city) return `${address.label} - ${address.city}`;
    return address.city || address.line1;
  }, [address]);

  return (
    <div className="w-full bg-[#02402c]">
      {/* 1. Location Bar: Standard document flow (scrolls off-screen smoothly with no GPU overhead) */}
      <div className="safe-top max-w-7xl mx-auto px-4 pt-2.5 pb-1">
        <button
          onClick={onLocationClick}
          type="button"
          className="flex items-center gap-2 text-left active:opacity-80 transition-opacity"
        >
          <div className="h-7 w-7 rounded-full bg-[#0d4f3b] flex items-center justify-center shrink-0">
            <MapPin size={15} className="text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-bold tracking-tight text-white truncate max-w-[240px] sm:max-w-xs">
                {locationText}
              </span>
              <ChevronDown size={14} className="text-emerald-200 shrink-0" />
            </div>
            <span className="text-[10px] font-medium text-emerald-100/70 leading-none">
              {address ? 'Delivery location' : 'Tap to choose address'}
            </span>
          </div>
        </button>
      </div>

      {/* 2. Sticky Bar: Pins to the top with pure native compositor acceleration */}
      <div className="sticky top-0 z-40 bg-[#02402c] shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-b-2xl">
        <div className="max-w-7xl mx-auto px-4 pt-1.5 pb-3 flex items-center gap-2.5">
          {/* Search Trigger Input */}
          <div
            onClick={onSearchClick}
            className="relative flex-1 h-11 px-3.5 rounded-xl bg-white text-slate-900 flex items-center gap-2.5 cursor-pointer shadow-sm active:scale-[0.99] transition-transform select-none"
          >
            <Search size={18} className="text-slate-400 shrink-0" />
            <div className="text-sm text-slate-400 flex items-center truncate">
              <span>Search for&nbsp;</span>
              <span
                className={`font-semibold text-slate-700 transition-opacity duration-150 ${
                  isFading ? 'opacity-0' : 'opacity-100'
                }`}
              >
                '{animatedWords[keywordIndex] || 'Groceries'}'
              </span>
            </div>
          </div>

          {/* Cart Button with Solid Contrast */}
          <button
            onClick={onCartClick}
            type="button"
            className="relative h-11 px-3.5 rounded-xl bg-[#0d4f3b] hover:bg-[#135d46] active:scale-95 text-white flex items-center justify-center gap-1.5 border border-[#16644c] transition-transform shrink-0 shadow-sm"
            aria-label="Cart"
          >
            <ShoppingBag size={20} className="text-white" />
            <span className="hidden sm:inline text-xs font-bold">Cart</span>

            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-emerald-400 text-emerald-950 text-[11px] font-black shadow-md">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}