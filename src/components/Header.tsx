import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { MapPin, ChevronDown, Search, X, ShoppingBag, Sparkles, TrendingUp } from 'lucide-react';
import { fetchAddresses, type DbAddress } from '@/services/catalog';

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  cartCount: number;
  onCartClick: () => void;
  onLocationClick: () => void;
}

const B2B_SEARCH_KEYWORDS = [
  'Refined Sunflower Oil',
  'Mustard Oil 15L Tin',
  'Basmati Rice 25kg',
  'Chakki Fresh Atta',
  'Premium Sugar S-30',
  'Toor Dal Fatka',
  'Moong Dal Dhuli',
  'Fortune Kachi Ghani Oil',
  'Pure Cow Ghee',
  'Cardamom & Cloves',
  'Red Chilli Powder 5kg',
  'Turmeric Powder',
  'Cashews & Almonds',
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
  'Paneer Bulk Block',
  'Floor Cleaner 5L',
  'Biscuits & Cookies Carton',
];

// Levenshtein distance calculation for typo tolerance
function getLevenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;

  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      if (b[j - 1] === a[i - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load default address
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

  // Smooth scroll tracking with RAF & Hysteresis to eliminate jitter
  useEffect(() => {
    let ticking = false;
    let lastKnownScrollPosition = 0;

    const onScroll = () => {
      lastKnownScrollPosition = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Hysteresis threshold: hide at > 40px, show back only when scrolled up to < 10px
          if (lastKnownScrollPosition > 40) {
            setIsScrolled(true);
          } else if (lastKnownScrollPosition < 10) {
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

  // Animated placeholder text cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setKeywordIndex((prev) => (prev + 1) % B2B_SEARCH_KEYWORDS.length);
        setIsFading(false);
      }, 150);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  // Advanced Search Suggester & Typo Corrector
  const searchAnalysis = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return {
        didYouMean: null,
        suggestions: B2B_SEARCH_KEYWORDS.slice(0, 6),
      };
    }

    const queryTokens = query.split(/\s+/).filter(Boolean);

    // 1. Direct & Prefix Matching
    const directMatches = B2B_SEARCH_KEYWORDS.filter((item) =>
      item.toLowerCase().includes(query)
    );

    // 2. Tokenized & Fuzzy Matching
    let bestCorrection: { word: string; distance: number } | null = null;
    const fuzzyMatches: { item: string; score: number }[] = [];

    for (const keyword of B2B_SEARCH_KEYWORDS) {
      const keywordLower = keyword.toLowerCase();
      const keywordTokens = keywordLower.split(/\s+/);

      let minTokenDistance = Infinity;
      for (const qToken of queryTokens) {
        for (const kToken of keywordTokens) {
          const dist = getLevenshteinDistance(qToken, kToken);
          if (dist < minTokenDistance) {
            minTokenDistance = dist;
          }
          // Typo threshold: allow 1 error for words >= 3 chars, 2 errors for >= 5 chars
          const maxAllowed = qToken.length >= 5 ? 2 : qToken.length >= 3 ? 1 : 0;
          if (dist > 0 && dist <= maxAllowed && (!bestCorrection || dist < bestCorrection.distance)) {
            bestCorrection = { word: keyword, distance: dist };
          }
        }
      }

      if (minTokenDistance <= 2) {
        fuzzyMatches.push({ item: keyword, score: minTokenDistance });
      }
    }

    fuzzyMatches.sort((a, b) => a.score - b.score);

    // Combine distinct suggestions
    const combinedSuggestions = Array.from(
      new Set([...directMatches, ...fuzzyMatches.map((f) => f.item)])
    ).slice(0, 6);

    const didYouMean =
      directMatches.length === 0 && bestCorrection ? bestCorrection.word : null;

    return {
      didYouMean,
      suggestions: combinedSuggestions,
    };
  }, [search]);

  const locationDisplayText = useMemo(() => {
    if (!address) return 'Choose location';
    if (address.label && address.city) return `${address.label} - ${address.city}`;
    if (address.city) return address.city;
    return address.line1;
  }, [address]);

  const handleSelectSuggestion = useCallback(
    (text: string) => {
      onSearchChange(text);
      setIsSearchFocused(false);
      searchInputRef.current?.blur();
    },
    [onSearchChange]
  );

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#02402c] text-white shadow-lg transition-colors duration-300 transform-gpu will-change-transform">
        <div className="max-w-7xl mx-auto px-4 pt-3 pb-3">
          
          {/* Smooth Collapsible Location Bar via CSS Grid (Zero Layout Thrash) */}
          <div
            className={`grid transition-all duration-300 ease-out ${
              isScrolled
                ? 'grid-rows-[0fr] opacity-0 -translate-y-2 pointer-events-none mb-0'
                : 'grid-rows-[1fr] opacity-100 translate-y-0 mb-2.5'
            }`}
          >
            <div className="overflow-hidden">
              <button
                onClick={onLocationClick}
                className="group flex items-center gap-2 text-left active:opacity-80 transition-opacity"
                type="button"
              >
                <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-colors shrink-0">
                  <MapPin size={15} className="text-emerald-300" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] font-bold tracking-tight text-white truncate max-w-[240px] sm:max-w-xs">
                      {locationDisplayText}
                    </span>
                    <ChevronDown size={14} className="text-emerald-300 shrink-0 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <span className="text-[10px] font-medium text-emerald-200/80 leading-none">
                    {address ? 'Delivery location' : 'Tap to select delivery location'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Persistent Search Bar & Cart Action */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 flex items-center">
              <div className="absolute left-3.5 pointer-events-none text-emerald-900/60 z-10">
                <Search size={18} />
              </div>

              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder=""
                className="w-full h-11 pl-10 pr-9 rounded-xl bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm"
              />

              {/* Dynamic crossfade placeholder */}
              {!search && (
                <div className="absolute left-10 pointer-events-none text-sm text-slate-400 flex items-center select-none truncate pr-3">
                  <span>Search for&nbsp;</span>
                  <span
                    className={`font-semibold text-slate-700 transition-all duration-150 transform-gpu ${
                      isFading ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0'
                    }`}
                  >
                    '{B2B_SEARCH_KEYWORDS[keywordIndex]}'
                  </span>
                </div>
              )}

              {search && (
                <button
                  onClick={() => {
                    onSearchChange('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 active:scale-90 z-10"
                  type="button"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Cart Button */}
            <button
              onClick={onCartClick}
              className="relative h-11 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center gap-1.5 backdrop-blur-md border border-white/15 transition-all shrink-0 shadow-sm"
              aria-label="View Cart"
              type="button"
            >
              <ShoppingBag size={20} className="text-white" />
              <span className="hidden sm:inline text-xs font-bold">Cart</span>

              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-emerald-400 text-emerald-950 text-[11px] font-black shadow-md animate-in fade-in zoom-in duration-200">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Advanced Auto-Suggestion & Spell Correction Dropdown */}
      {isSearchFocused && (
        <div className="fixed inset-0 z-40 top-[70px] flex flex-col justify-start">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm -z-10 animate-in fade-in duration-200"
            onClick={() => setIsSearchFocused(false)}
          />

          {/* Suggestion Card */}
          <div className="mx-auto w-full max-w-[720px] px-4 pt-2">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100 animate-in slide-in-from-top-2 duration-200">
              
              {/* "Did you mean" spell corrector banner */}
              {searchAnalysis.didYouMean && (
                <div
                  onClick={() => handleSelectSuggestion(searchAnalysis.didYouMean!)}
                  className="px-4 py-3 bg-emerald-50 hover:bg-emerald-100/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2 text-emerald-900">
                    <Sparkles size={16} className="text-emerald-600 shrink-0" />
                    <span>
                      Did you mean{' '}
                      <strong className="font-extrabold text-emerald-700 underline underline-offset-2">
                        {searchAnalysis.didYouMean}
                      </strong>
                      ?
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Tap to apply</span>
                </div>
              )}

              {/* Suggestions List */}
              <div className="py-2">
                <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{search ? 'Matching Searches' : 'Popular B2B Commodities'}</span>
                  <TrendingUp size={13} className="text-slate-400" />
                </div>

                {searchAnalysis.suggestions.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 active:bg-slate-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Search size={14} className="text-slate-400 group-hover:text-emerald-600 shrink-0 transition-colors" />
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 truncate">
                        {item}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2 group-hover:text-emerald-600">
                      Search
                    </span>
                  </button>
                ))}
              </div>

              {/* Quick Dismiss Footer */}
              <div className="px-4 py-2 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
                <span>Press enter to search</span>
                <button
                  type="button"
                  onClick={() => setIsSearchFocused(false)}
                  className="font-bold text-emerald-700 hover:text-emerald-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
