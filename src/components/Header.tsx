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

const STATIC_B2B_KEYWORDS = [
  'Refined Sunflower Oil',
  'Mustard Oil 15L Tin',
  'Basmati Rice 25kg',
  'Chakki Fresh Atta',
  'Premium Sugar S-30',
  'Toor Dal Fatka',
  'Moong Dal Dhuli',
  'Pure Cow Ghee',
  'Spices & Masalas',
  'Beverages & Syrups',
  'Amul Taaza Milk',
  'Tata Salt 1kg Pack',
  'Tea Dust Bulk Bag',
  'Dishwash Liquid 5L',
  'Detergent Powder 25kg',
  'Pooja Agarbatti',
  'Biodegradable Carry Bags',
  'Tomato Ketchup Pouch',
  'Ginger Garlic Paste',
  'Instant Noodles Box',
  'Maida All Purpose Flour',
  'Sooji Rawa 50kg',
  'Chana Dal Polish',
  'Urad Dal Whole',
  'Floor Cleaner 5L',
  'Biscuits & Cookies Carton',
  'Cashews & Almonds',
  'Cardamom & Cloves',
  'Red Chilli Powder',
  'Turmeric Powder',
  'Paneer Bulk Block',
  'Edible Oils',
];

export function Header({
  onSearchClick,
  cartCount,
  onCartClick,
  onLocationClick,
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const isScrolledRef = useRef(false);

  const [address, setAddress] = useState<DbAddress | null>(null);
  const [displayKeywords, setDisplayKeywords] = useState<string[]>(STATIC_B2B_KEYWORDS);
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

  // 2. Fetch catalog keywords dynamically
  useEffect(() => {
    let active = true;
    void getOrBuildSearchDictionary().then((dict) => {
      if (active && dict.allKeywords.length > 0) {
        const dynamicWords = dict.allKeywords.slice(0, 35).map((k) => k.word);
        setDisplayKeywords(dynamicWords);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // 3. Ultra-smooth, zero-lag scroll threshold listener
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      // Only trigger a React state dispatch ONCE when the threshold state flips
      if (scrolled !== isScrolledRef.current) {
        isScrolledRef.current = scrolled;
        setIsScrolled(scrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 4. Animated placeholder word cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setKeywordIndex((prev) => (prev + 1) % displayKeywords.length);
        setIsFading(false);
      }, 150);
    }, 2800);

    return () => clearInterval(interval);
  }, [displayKeywords]);

  const locationText = useMemo(() => {
    if (!address) return 'Choose location';
    if (address.label && address.city) return `${address.label} - ${address.city}`;
    return address.city || address.line1;
  }, [address]);

  return (
    <header className="sticky top-0 z-50 bg-[#02402c] text-white shadow-md rounded-b-3xl safe-top transform-gpu">
      <div className="max-w-7xl mx-auto px-4 pt-3 pb-3.5">
        
        {/* Collapsible Location Bar */}
        <div
          className={`overflow-hidden transition-all duration-200 ease-out transform-gpu ${
            isScrolled
              ? 'max-h-0 opacity-0 -translate-y-2 mb-0 pointer-events-none'
              : 'max-h-14 opacity-100 translate-y-0 mb-2.5'
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

        {/* Sticky Search Input & Cart Row */}
        <div className="flex items-center gap-2.5">
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
                '{displayKeywords[keywordIndex] || 'Groceries'}'
              </span>
            </div>
          </div>

          <button
            onClick={onCartClick}
            type="button"
            className="relative h-11 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center gap-1.5 border border-white/15 transition-all shrink-0 shadow-sm"
            aria-label="View Cart"
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