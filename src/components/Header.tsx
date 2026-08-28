import { useEffect, useState, useMemo } from 'react';
import { MapPin, ChevronDown, Search, X, ShoppingBag } from 'lucide-react';
import { fetchAddresses, type DbAddress } from '@/services/catalog';

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  cartCount: number;
  onCartClick: () => void;
  onLocationClick: () => void;
}

const B2B_SEARCH_KEYWORDS = [
  'Oil',
  'Basmati Rice',
  'Atta & Flour',
  'Sugar & Jaggery',
  'Pulses & Dals',
  'Spices & Masalas',
  'Ghee & Butter',
  'Dry Fruits & Nuts',
  'Dairy & Milk',
  'Tea & Coffee',
  'Cleaning Essentials',
  'Fresh Vegetables',
  'Snacks & Namkeen',
  'Biscuits & Cookies',
  'Soaps & Detergents',
  'Pooja Needs',
  'Packaging Materials',
  'Sauces & Spreads',
  'Cooking Pastes',
  'Noodles & Pasta',
  'Bulk Grains',
  'Edible Oils',
  'Beverage Syrups',
  'Disposables',
  'Whole Spices',
  'Floor Cleaners',
  'Lentils & Legumes',
  'Salt & Seasonings',
  'Refined Oil',
  'Mustard Oil',
  'Toor Dal',
  'Wheat Flour',
];

export function Header({
  search,
  onSearchChange,
  cartCount,
  onCartClick,
  onLocationClick,
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [address, setAddress] = useState<DbAddress | null>(null);
  const [keywordIndex, setKeywordIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadAddress = async () => {
      try {
        const addresses = await fetchAddresses();
        if (!mounted) return;
        const defaultAddr = addresses.find((a) => a.is_default) || addresses[0] || null;
        setAddress(defaultAddr);
      } catch (err) {
        console.error('Failed to load address for header:', err);
      }
    };
    void loadAddress();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setKeywordIndex((prev) => (prev + 1) % B2B_SEARCH_KEYWORDS.length);
        setIsFading(false);
      }, 200);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  const locationDisplayText = useMemo(() => {
    if (!address) return 'Choose location';
    if (address.label && address.city) return `${address.label} - ${address.city}`;
    if (address.city) return address.city;
    return address.line1;
  }, [address]);

  return (
    <header className="sticky top-0 z-50 bg-[#02402c] text-white shadow-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 pt-3 pb-3">
        {/* Collapsible Location Row */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isScrolled
              ? 'max-h-0 opacity-0 -translate-y-2 pointer-events-none mb-0'
              : 'max-h-12 opacity-100 translate-y-0 mb-2.5'
          }`}
        >
          <button
            onClick={onLocationClick}
            className="group flex items-center gap-2 text-left active:opacity-80 transition-opacity"
            type="button"
          >
            <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-colors">
              <MapPin size={15} className="text-emerald-300" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-bold tracking-tight text-white truncate max-w-[240px] sm:max-w-xs">
                  {locationDisplayText}
                </span>
                <ChevronDown size={14} className="text-emerald-300 shrink-0 group-hover:translate-y-0.5 transition-transform" />
              </div>
              <span className="text-[10px] font-medium text-emerald-200/75 leading-none">
                {address ? 'Delivery location' : 'Tap to set address'}
              </span>
            </div>
          </button>
        </div>

        {/* Sticky Search & Cart Row */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 flex items-center">
            <div className="absolute left-3.5 pointer-events-none text-gray-400">
              <Search size={18} />
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-11 pl-10 pr-9 rounded-xl bg-white text-gray-900 text-sm font-medium placeholder-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-inner"
            />

            {!search && (
              <div className="absolute left-10 pointer-events-none text-sm text-gray-400 flex items-center select-none">
                <span>Search for&nbsp;</span>
                <span
                  className={`font-semibold text-gray-700 transition-all duration-200 ${
                    isFading ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0'
                  }`}
                >
                  '{B2B_SEARCH_KEYWORDS[keywordIndex]}'
                </span>
              </div>
            )}

            {search && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 p-1 rounded-full text-gray-400 hover:text-gray-600 active:scale-90"
                type="button"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            onClick={onCartClick}
            className="relative h-11 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center gap-1.5 backdrop-blur-md border border-white/10 transition-all shrink-0"
            aria-label="View Cart"
            type="button"
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
