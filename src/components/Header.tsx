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
  const [address, setAddress] = useState<DbAddress | null>(null);
  const [displayKeywords, setDisplayKeywords] = useState<string[]>(STATIC_B2B_KEYWORDS);
  const [keywordIndex, setKeywordIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  // 1. Fetch active delivery address
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

  // 3. Animated placeholder word cycle
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
    <div className="w-full bg-[#02402c] text-white">
      {/* 1. Location Bar: Scrolls away naturally with native scrolling */}
      <div className="safe-top px-4 pt-3 pb-2 max-w-7xl mx-auto">
        <button
          onClick={onLocationClick}
          type="button"
          className="flex items-center gap-2 text-left active:opacity-80 transition-opacity"
        >
          <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <MapPin size={15} className="text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-bold tracking-tight text-white truncate max-w-[240px] sm:max-w-xs">
                {locationText}
              </span>
              <ChevronDown size={14} className="text-white/80 shrink-0" />
            </div>
            <span className="text-[10px] font-medium text-white/60 leading-none">
              {address ? 'Delivery location' : 'Tap to choose address'}
            </span>
          </div>
        </button>
      </div>

      {/* 2. Sticky Bar: Pins natively to the top with safe-top padding */}
      <div className="sticky top-0 z-40 bg-[#02402c] px-4 pt-2 pb-3.5 shadow-lg rounded-b-3xl safe-top">
        <div className="max-w-7xl mx-auto flex items-center gap-2.5">
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
                '{displayKeywords[keywordIndex] || 'Groceries'}'
              </span>
            </div>
          </div>

          {/* Cart Button */}
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
    </div>
  );
}