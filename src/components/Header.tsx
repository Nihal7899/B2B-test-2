import { useEffect, useState, useMemo, useRef } from 'react';
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
  const [isScrolled, setIsScrolled] = useState(false);
  const isScrolledRef = useRef(false);
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

  // 1. Fetch user's active delivery address
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

  // 2. Fetch catalog keywords dynamically for search placeholder
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

  // 3. Jitter-free, 60/120fps Scroll Hysteresis Engine
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;

          // Hysteresis thresholds: collapse above 30px, restore below 8px
          if (y > 30 && !isScrolledRef.current) {
            isScrolledRef.current = true;
            setIsScrolled(true);
          } else if (y <= 8 && isScrolledRef.current) {
            isScrolledRef.current = false;
            setIsScrolled(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 4. Animated placeholder cycle
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
    <header className="sticky top-0 z-50 bg-[#02402c] text-white shadow-lg rounded-b-3xl safe-top transform-gpu will-change-transform">
      <div className="max-w-7xl mx-auto px-4 pt-3 pb-3.5">
        
        {/* Butter-Smooth Collapsible Location Container */}
        <div
          className={`overflow-hidden transform-gpu will-change-[max-height,opacity,transform,margin] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            isScrolled
              ? 'max-h-0 opacity-0 -translate-y-2 mb-0 pointer-events-none'
              : 'max-h-12 opacity-100 translate-y-0 mb-2.5'
          }`}
        >
          <button
            onClick={onLocationClick}
            type="button"
            className="group flex items-center gap-2 text-left active:opacity-80 transition-opacity"
          >
            <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-colors shrink-0">
              <MapPin size={15} className="text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-bold tracking-tight text-white truncate max-w-[240px] sm:max-w-xs">
                  {locationText}
                </span>
                <ChevronDown size={14} className="text-white/80 shrink-0 group-hover:translate-y-0.5 transition-transform" />
              </div>
              <span className="text-[10px] font-medium text-white/60 leading-none">
                {address ? 'Delivery location' : 'Tap to choose address'}
              </span>
            </div>
          </button>
        </div>

        {/* Search Bar & Cart Row */}
        <div className="flex items-center gap-2.5 transform-gpu">
          <div
            onClick={onSearchClick}
            className="relative flex-1 h-11 px-3.5 rounded-xl bg-white text-slate-900 flex items-center gap-2.5 cursor-pointer shadow-sm active:scale-[0.99] transition-transform select-none"
          >
            <Search size={18} className="text-slate-400 shrink-0" />
            <div className="text-sm text-slate-400 flex items-center truncate">
              <span>Search for&nbsp;</span>
              <span
                className={`font-semibold text-slate-700 transition-all duration-150 transform-gpu ${
                  isFading ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0'
                }`}
              >
                '{animatedWords[keywordIndex] || 'Groceries'}'
              </span>
            </div>
          </div>

          <button
            onClick={onCartClick}
            type="button"
            className="relative h-11 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center gap-1.5 backdrop-blur-md border border-white/15 transition-all shrink-0 shadow-sm"
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
    </header>
  );
}