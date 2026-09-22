import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  History,
  Sparkles,
  Check,
  AlertCircle,
  Package,
  Layers,
  ChevronRight,
  Sparkle,
  Grid,
  ArrowUpDown,
  ChevronDown,
  Star,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Filter,
  ShoppingBag,
  Mic,
} from 'lucide-react';
import type { Product, PromoBanner, Category } from '@/types';
import { useCart } from '@/store';
import {
  getLiveSearchSuggestions,
  executeFullSearch,
  type SearchSuggestionItem,
  type RelatedSlugItem,
} from '@/services/searchEngine';
import {
  fetchHomeBanners,
  fetchUserReorderProducts,
  fetchRecentlyViewedProducts,
} from '@/services/catalog';
import { ProductCard, ProductCarousel } from '@/components/ProductCard';
import { PromoCarousel, PromoBannerCard } from '@/components/PromoBanner';
import { TopPromoSlider } from '@/components/TopPromoSlider';
import { CachedImage } from '@/components/CachedImage';
import { VoiceSearchModal } from '@/components/VoiceSearchModal';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating' | 'discount';

interface SortItem {
  id: SortOption;
  label: string;
  subLabel: string;
  icon: typeof Sparkles;
}

const SORT_OPTIONS: SortItem[] = [
  { id: 'default', label: 'Relevancy', subLabel: 'Best match for everyday restocking', icon: SlidersHorizontal },
  { id: 'price-asc', label: 'Price: Low to High', subLabel: 'Budget-friendly wholesale items first', icon: TrendingDown },
  { id: 'price-desc', label: 'Price: High to Low', subLabel: 'Premium & bulk inventory first', icon: TrendingUp },
  { id: 'rating', label: 'Top Rated', subLabel: 'Highest customer satisfaction (4★+)', icon: Star },
  { id: 'discount', label: 'Best Discounts', subLabel: 'Biggest savings and promotional deals', icon: Sparkles },
];

interface SearchScreenProps {
  initialQuery?: string;
  cart?: ReturnType<typeof useCart>;
  onCartClick: () => void;
  onProductClick: (product: Product) => void;
  onBannerAction?: (banner: PromoBanner) => void;
}

const RECENT_SEARCHES_KEY = 'stackknit_recent_searches_v1';

export function SearchScreen({
  initialQuery = '',
  onCartClick,
  onProductClick,
  onBannerAction,
}: SearchScreenProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const cart = useCart();

  const urlQuery = searchParams.get('q') || initialQuery || '';
  const voiceParam = searchParams.get('voice');

  const [query, setQuery] = useState(urlQuery);
  const [submittedQuery, setSubmittedQuery] = useState(urlQuery);
  const [isFocused, setIsFocused] = useState(!urlQuery);

  const [suggestions, setSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);

  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [reorderProducts, setReorderProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [alternativeProducts, setAlternativeProducts] = useState<Product[]>([]);
  const [relatedSlugs, setRelatedSlugs] = useState<RelatedSlugItem[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(false);
  const [highRatingOnly, setHighRatingOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);

  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [priceTouched, setPriceTouched] = useState(false);

  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const voiceAutoTriggeredRef = useRef(false);

  // ---------- VOICE HOOK ----------
  const handleVoiceTranscript = useCallback((text: string) => {
    setQuery(text);
  }, []);

const handleVoiceResult = useCallback(
  (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setSearchParams({ q: trimmed });
    setShowVoiceModal(false);
    // IMPORTANT: kill the native session immediately so reopening the modal
    // starts a fresh recognizer instead of reusing a stale one.
    void stopVoiceSearch();
  },
  [setSearchParams, stopVoiceSearch],
);

  const {
    isListening,
    error: voiceError,
    transcript: voiceTranscript,
    start: startVoiceSearch,
    stop: stopVoiceSearch,
    reset: resetVoiceSearch,
    isNative: isNativeVoice,
  } = useVoiceSearch({
    lang: 'en-IN',
    onTranscript: handleVoiceTranscript,
    onResult: handleVoiceResult,
    timeoutMs: 10000,
    nativeSilenceMs: 1200,
  });

  const openVoiceModal = useCallback(() => {
    // Blur first so the keyboard doesn't pop open over the voice modal
    try {
      searchInputRef.current?.blur();
    } catch {}
    try {
      (document.activeElement as HTMLElement | null)?.blur?.();
    } catch {}

    resetVoiceSearch();
    setShowVoiceModal(true);

    // Short delay so the modal can paint before the mic turns on
    setTimeout(() => {
      void startVoiceSearch();
    }, 150);
  }, [startVoiceSearch, resetVoiceSearch]);

  const closeVoiceModal = useCallback(() => {
    setShowVoiceModal(false);
    void stopVoiceSearch();
  }, [stopVoiceSearch]);

const handleVoiceConfirm = useCallback(
  (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setSearchParams({ q: trimmed });
    setShowVoiceModal(false);
    void stopVoiceSearch();
  },
  [setSearchParams, stopVoiceSearch],
);

  const handleVoiceRetry = useCallback(() => {
    resetVoiceSearch();
    setTimeout(() => {
      void startVoiceSearch();
    }, 120);
  }, [startVoiceSearch, resetVoiceSearch]);

  // Auto-trigger voice when arriving with ?voice=1
  useEffect(() => {
    if (voiceParam === '1' && !voiceAutoTriggeredRef.current) {
      voiceAutoTriggeredRef.current = true;
      const t = window.setTimeout(() => {
        openVoiceModal();
      }, 350);
      return () => window.clearTimeout(t);
    }
  }, [voiceParam, openVoiceModal]);
  // --------------------------------

  const resetAllSearchState = useCallback(() => {
    setQuery('');
    setSubmittedQuery('');
    setIsFocused(false);
    setProducts([]);
    setAlternativeProducts([]);
    setRelatedSlugs([]);
    setDidYouMean(null);
    setSortBy('default');
    setDealsOnly(false);
    setHighRatingOnly(false);
    setInStockOnly(false);
    setPriceRange(null);
    setPriceTouched(false);
  }, []);

  useEffect(() => {
    return () => {
      resetAllSearchState();
    };
  }, [resetAllSearchState]);

  useEffect(() => {
    let mounted = true;
    void Promise.all([
      fetchHomeBanners(),
      fetchUserReorderProducts(10),
      fetchRecentlyViewedProducts(),
    ]).then(([bannerData, reorderData, recentData]) => {
      if (mounted) {
        setBanners(bannerData || []);
        setReorderProducts(reorderData || []);
        setRecentlyViewed(recentData || []);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const topSliderBanners = useMemo(
    () => (Array.isArray(banners) ? banners.filter((b) => b?.position === 'top_slider') : []),
    [banners],
  );
  const carouselBanners = useMemo(
    () => banners.filter((b) => b.position === 'carousel' || b.position === 'middle'),
    [banners],
  );

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (!isFocused && submittedQuery) return;
      const res = await getLiveSearchSuggestions(query);
      if (active) {
        setSuggestions(res.suggestions);
        setDidYouMean(res.didYouMean);
      }
    }, 120);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, isFocused, submittedQuery]);

  const performSearch = useCallback(async (searchTerm: string) => {
    const q = (searchTerm || '').trim();
    setSubmittedQuery(q);
    setIsFocused(false);
    setLoading(true);

    if (q) {
      setRecentSearches((prev) => {
        const updated = [q, ...prev.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, 8);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    }

    const result = await executeFullSearch(q);

    setProducts(result.products);
    setAlternativeProducts(result.alternativeBrandProducts);
    setRelatedSlugs(result.relatedSlugs);
    setAllCategories(result.allCategories);
    setTrendingProducts(result.trendingProducts);
    setDidYouMean(result.didYouMean);
    setLoading(false);
  }, []);

  useEffect(() => {
    setQuery(urlQuery);
    if (urlQuery) {
      void performSearch(urlQuery);
    } else {
      setTimeout(() => searchInputRef.current?.focus(), 120);
    }
  }, [urlQuery, performSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  const handleSelectKeyword = useCallback(
    (text: string) => {
      setQuery(text);
      setSearchParams({ q: text.trim() });
    },
    [setSearchParams],
  );

  const handleSlugClick = (slugItem: RelatedSlugItem) => {
    if (slugItem.type === 'category' && slugItem.id) {
      navigate(`/category?id=${slugItem.id}`);
    } else {
      setQuery(slugItem.name);
      setSearchParams({ q: slugItem.name });
    }
  };

  // ---------- PRICE BOUNDS ----------
  const priceBounds = useMemo<[number, number]>(() => {
    if (products.length === 0) return [0, 0];
    let min = Infinity;
    let max = 0;
    for (const p of products) {
      const v = Number(p.price) || 0;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (!isFinite(min)) min = 0;
    return [Math.floor(min), Math.ceil(max)];
  }, [products]);

  useEffect(() => {
    if (priceBounds[0] === priceBounds[1]) {
      setPriceRange(null);
      setPriceTouched(false);
      return;
    }
    if (!priceTouched) {
      setPriceRange([priceBounds[0], priceBounds[1]]);
    }
  }, [priceBounds, priceTouched]);

  const currentRange: [number, number] = priceRange ?? priceBounds;

  const handlePriceChange = (index: 0 | 1, value: number) => {
    setPriceTouched(true);
    setPriceRange((prev) => {
      const base = prev ?? priceBounds;
      const next: [number, number] = [...base] as [number, number];
      next[index] = value;
      if (next[0] > next[1]) {
        if (index === 0) next[1] = next[0];
        else next[0] = next[1];
      }
      return next;
    });
  };

  const resetPriceRange = () => {
    setPriceRange([priceBounds[0], priceBounds[1]]);
    setPriceTouched(false);
  };
  // --------------------------------

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    if (dealsOnly) result = result.filter((p) => p.mrp > p.price);
    if (highRatingOnly) result = result.filter((p) => (p.rating || 0) >= 4.0);
    if (inStockOnly) result = result.filter((p) => p.inStock);

    if (priceTouched && priceBounds[0] !== priceBounds[1]) {
      result = result.filter((p) => {
        const v = Number(p.price) || 0;
        return v >= currentRange[0] && v <= currentRange[1];
      });
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'discount':
        result.sort((a, b) => {
          const discountA = a.mrp > 0 ? (a.mrp - a.price) / a.mrp : 0;
          const discountB = b.mrp > 0 ? (b.mrp - b.price) / b.mrp : 0;
          return discountB - discountA;
        });
        break;
      default:
        break;
    }

    return result;
  }, [products, dealsOnly, highRatingOnly, inStockOnly, sortBy, priceTouched, currentRange, priceBounds]);

  const activeFiltersCount =
    (sortBy !== 'default' ? 1 : 0) +
    (dealsOnly ? 1 : 0) +
    (highRatingOnly ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (priceTouched ? 1 : 0);

  const hasActiveFilters = activeFiltersCount > 0;

  const resetFilters = () => {
    setSortBy('default');
    setDealsOnly(false);
    setHighRatingOnly(false);
    setInStockOnly(false);
    resetPriceRange();
  };

  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.id === sortBy)?.label || 'Relevancy';

  const SuggestionRow = useCallback(
    ({ item }: { item: SearchSuggestionItem }) => {
      const hasThumb = Boolean(item.imageUrl);

      return (
        <button
          type="button"
          onClick={() => handleSelectKeyword(item.text)}
          className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors group"
        >
          {hasThumb ? (
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-100 shrink-0">
              <CachedImage
                src={item.imageUrl!}
                alt={item.text}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              {item.type === 'category' || item.type === 'subcategory' ? (
                <Layers size={15} className="text-emerald-600" strokeWidth={2.4} />
              ) : item.type === 'brand' ? (
                <Sparkle size={15} className="text-emerald-600" strokeWidth={2.4} />
              ) : (
                <Search size={15} className="text-emerald-600" strokeWidth={2.4} />
              )}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-bold text-slate-800 group-hover:text-emerald-900 truncate transition-colors">
              {item.text}
            </p>
            {item.subText && (
              <p className="text-[10.5px] text-slate-400 font-semibold truncate mt-0.5">
                {item.subText}
              </p>
            )}
          </div>

          {(item.type === 'category' || item.type === 'subcategory') && (
            <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0 tracking-wide">
              {item.type === 'category' ? 'CATEGORY' : 'SUBCATEGORY'}
            </span>
          )}
          {item.type === 'brand' && (
            <span className="text-[9.5px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full shrink-0 tracking-wide">
              BRAND
            </span>
          )}
          {item.type === 'sku' && (
            <span className="text-[9.5px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full shrink-0 tracking-wide">
              SKU
            </span>
          )}

          <ChevronRight
            size={14}
            className="text-slate-300 group-hover:text-emerald-600 shrink-0 transition-colors"
          />
        </button>
      );
    },
    [handleSelectKeyword],
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
      <header className="sticky top-0 z-40 bg-[#02402c] shadow-md safe-top">
        <div className="max-w-7xl mx-auto px-4 pt-3 pb-2.5 text-white">
          <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
            <div className="relative flex-1 flex items-center">
              <div className="absolute left-3.5 pointer-events-none text-emerald-900/60">
                <Search size={18} />
              </div>

              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder="Search beverages, brands, atta, oils, pulses..."
                className="w-full h-11 pl-10 pr-24 rounded-xl bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm placeholder:text-slate-400 transition-all duration-200"
              />

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={openVoiceModal}
                aria-label="Voice search"
                className="absolute right-9 h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 active:scale-90 transition-all"
              >
                <Mic size={15} strokeWidth={2.5} />
              </button>

              {query && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setQuery('');
                    setSubmittedQuery('');
                    setSearchParams({});
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-1.5 h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-90 transition-all"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              onClick={onCartClick}
              type="button"
              className="relative h-11 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center gap-1.5 backdrop-blur-md border border-white/15 transition-all shrink-0 shadow-sm"
              aria-label="View Cart"
            >
              <ShoppingBag size={20} className="text-white" />
              <span className="hidden sm:inline text-xs font-bold">Cart</span>

              {cart.totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-emerald-400 text-emerald-950 text-[11px] font-black shadow-md">
                  {cart.totalItems}
                </span>
              )}
            </button>
          </form>

          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <button
              type="button"
              onClick={() => setIsSortSheetOpen(true)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold transition active:scale-95 ${
                sortBy !== 'default'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md'
              }`}
            >
              <ArrowUpDown size={12} />
              <span>{currentSortLabel}</span>
              <ChevronDown size={11} className="opacity-70" />
            </button>

            <button
              type="button"
              onClick={() => setIsSortSheetOpen(true)}
              className={`flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold transition active:scale-95 ${
                priceTouched
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md'
              }`}
            >
              <SlidersHorizontal size={11} />
              {priceTouched && priceBounds[0] !== priceBounds[1]
                ? `₹${currentRange[0]}–₹${currentRange[1]}`
                : 'Price'}
            </button>

            <button
              type="button"
              onClick={() => setDealsOnly(!dealsOnly)}
              className={`flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold transition active:scale-95 ${
                dealsOnly
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md'
              }`}
            >
              <Sparkles size={11} />
              Best Deals
            </button>

            <button
              type="button"
              onClick={() => setHighRatingOnly(!highRatingOnly)}
              className={`flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold transition active:scale-95 ${
                highRatingOnly
                  ? 'bg-white text-amber-500 shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md'
              }`}
            >
              <Star size={11} className={highRatingOnly ? 'fill-amber-400' : ''} />
              4.0+ Rated
            </button>

            <button
              type="button"
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold transition active:scale-95 ${
                inStockOnly
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md'
              }`}
            >
              <Check size={11} />
              In Stock
            </button>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            hasActiveFilters ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between border-t border-white/15 bg-black/20 px-4 py-2 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-white/90">
              <Filter size={13} className="text-white" />
              <span className="text-[11px] font-bold">
                {activeFiltersCount} {activeFiltersCount === 1 ? 'filter' : 'filters'} applied
              </span>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-rose-600 shadow-sm transition active:scale-95 hover:bg-white"
            >
              <RotateCcw size={11} strokeWidth={2.5} />
              Reset All
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto py-3 space-y-6">
        {isFocused && (
          <div className="mx-4 bg-white rounded-2xl border border-slate-200/80 shadow-card divide-y divide-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {didYouMean && (
              <div
                onClick={() => handleSelectKeyword(didYouMean)}
                className="px-4 py-3 bg-emerald-50 hover:bg-emerald-100/80 cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-2 text-emerald-900">
                  <Sparkles size={16} className="text-emerald-600 shrink-0" />
                  <span>
                    Did you mean{' '}
                    <strong className="font-extrabold text-emerald-800 underline underline-offset-2">
                      {didYouMean}
                    </strong>
                    ?
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Apply</span>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="py-1.5">
                <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Suggestions
                </div>
                {suggestions.map((item, idx) => (
                  <SuggestionRow key={`${item.text}-${idx}`} item={item} />
                ))}
              </div>
            )}

            {recentSearches.length > 0 && !query && (
              <div className="py-2.5 px-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <History size={13} /> Recent Searches
                  </span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSelectKeyword(term)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <History size={12} className="text-slate-400" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!isFocused && submittedQuery && (
          <div className="space-y-6">
            {topSliderBanners.length > 0 && (
              <TopPromoSlider banners={topSliderBanners} onAction={onBannerAction} />
            )}

            {!loading && products.length > 0 && (
              <div className="px-4 flex items-center justify-between">
                <p className="text-[11.5px] font-bold text-slate-500">
                  <span className="text-slate-900">{filteredAndSortedProducts.length}</span>{' '}
                  result{filteredAndSortedProducts.length !== 1 ? 's' : ''} for{' '}
                  <span className="text-emerald-700">"{submittedQuery}"</span>
                </p>
                {priceTouched && priceBounds[0] !== priceBounds[1] && (
                  <button
                    onClick={resetPriceRange}
                    className="text-[10.5px] font-black text-rose-600 flex items-center gap-1 active:scale-95"
                  >
                    <X size={11} strokeWidth={3} />
                    ₹{currentRange[0]}–₹{currentRange[1]}
                  </button>
                )}
              </div>
            )}

            <div className="px-4">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="aspect-square bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 rounded-2xl animate-pulse" />
                      <div className="h-3 w-3/4 bg-slate-200 rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-slate-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : filteredAndSortedProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredAndSortedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantity={cart.getQuantity(product.id)}
                      onAdd={() => cart.addToCart(product)}
                      onIncrement={() => cart.addToCart(product)}
                      onDecrement={() =>
                        cart.updateQuantity(product.id, cart.getQuantity(product.id) - 1)
                      }
                      onClick={() => onProductClick(product)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
                  <AlertCircle size={32} className="mx-auto text-slate-400 mb-1" />
                  <h3 className="text-sm font-bold text-slate-800">No matching products found</h3>
                  <p className="text-xs text-slate-400">
                    {hasActiveFilters
                      ? 'Try clearing active filters to see all available products.'
                      : 'Discover related categories and brand alternatives below.'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 active:scale-95 transition-colors"
                    >
                      <RotateCcw size={13} />
                      Reset All Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {carouselBanners.length > 0 && (
              <div className="pt-2">
                {carouselBanners.length > 1 ? (
                  <PromoCarousel banners={carouselBanners} onAction={onBannerAction} />
                ) : (
                  <div className="px-4">
                    <PromoBannerCard banner={carouselBanners[0]} onAction={onBannerAction} />
                  </div>
                )}
              </div>
            )}

            {alternativeProducts.length > 0 && (
              <div className="space-y-3 px-4 pt-2">
                <div className="flex items-center gap-2">
                  <Sparkle size={17} className="text-emerald-600 fill-emerald-100" />
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Explore Alternatives from Other Brands
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {alternativeProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantity={cart.getQuantity(product.id)}
                      onAdd={() => cart.addToCart(product)}
                      onIncrement={() => cart.addToCart(product)}
                      onDecrement={() =>
                        cart.updateQuantity(product.id, cart.getQuantity(product.id) - 1)
                      }
                      onClick={() => onProductClick(product)}
                    />
                  ))}
                </div>
              </div>
            )}

            {relatedSlugs.length > 0 && (
              <div className="px-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={14} className="text-purple-600" /> Related Collections & Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {relatedSlugs.map((slugItem) => (
                      <button
                        key={slugItem.slug}
                        onClick={() => handleSlugClick(slugItem)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200/60 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <span>{slugItem.name}</span>
                        <ChevronRight size={13} className="text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {reorderProducts.length > 0 && (
              <div className="pt-2">
                <ProductCarousel
                  title="Quick Reorder / Buy Again"
                  subtitle="Frequent purchases for your business"
                  products={reorderProducts}
                  cartVersion={cart.items}
                  getQuantity={(id) => cart.getQuantity(id)}
                  onAdd={(p) => cart.addToCart(p)}
                  onIncrement={(p) => cart.addToCart(p)}
                  onDecrement={(p) => cart.updateQuantity(p.id, cart.getQuantity(p.id) - 1)}
                  onProductClick={onProductClick}
                  onViewAll={() => navigate('/orders')}
                />
              </div>
            )}

            {recentlyViewed.length > 0 && (
              <div className="pt-2">
                <ProductCarousel
                  title="Recently Viewed Products"
                  subtitle="Pick up where you left off"
                  products={recentlyViewed}
                  cartVersion={cart.items}
                  getQuantity={(id) => cart.getQuantity(id)}
                  onAdd={(p) => cart.addToCart(p)}
                  onIncrement={(p) => cart.addToCart(p)}
                  onDecrement={(p) => cart.updateQuantity(p.id, cart.getQuantity(p.id) - 1)}
                  onProductClick={onProductClick}
                  onViewAll={() => navigate('/categories')}
                />
              </div>
            )}

            {allCategories.length > 0 && (
              <div className="px-4">
                <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Grid size={16} className="text-emerald-600" />
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">
                        Explore Categories
                      </h3>
                    </div>
                    <button
                      onClick={() => navigate('/categories')}
                      className="flex items-center text-xs font-bold text-emerald-600"
                    >
                      See all <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {allCategories.slice(0, 8).map((category) => (
                      <button
                        key={category.id}
                        onClick={() => navigate(`/category?id=${category.id}`)}
                        className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <div
                          className="relative h-16 w-16 overflow-hidden rounded-2xl p-0.5 shadow-sm ring-1 ring-slate-100"
                          style={{ background: category.gradient || '#10b981' }}
                        >
                          <img
                            src={category.image}
                            alt={category.name}
                            decoding="async"
                            className="h-full w-full rounded-[14px] object-cover"
                          />
                        </div>
                        <span className="line-clamp-2 text-center text-[10px] font-bold leading-tight text-slate-700">
                          {category.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {trendingProducts.length > 0 && (
              <div className="pt-2">
                <ProductCarousel
                  title="Trending Wholesale Commodities"
                  subtitle="Best sellers and bulk deals across the catalog"
                  products={trendingProducts}
                  cartVersion={cart.items}
                  getQuantity={(id) => cart.getQuantity(id)}
                  onAdd={(p) => cart.addToCart(p)}
                  onIncrement={(p) => cart.addToCart(p)}
                  onDecrement={(p) => cart.updateQuantity(p.id, cart.getQuantity(p.id) - 1)}
                  onProductClick={onProductClick}
                  onViewAll={() => navigate('/categories')}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {isSortSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsSortSheetOpen(false)} />

          <div className="relative z-10 w-full max-w-[720px] rounded-t-[32px] bg-white p-5 pb-8 safe-bottom shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Sort & Filter
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Refine how search results are shown</p>
              </div>
              <button
                onClick={() => setIsSortSheetOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-4 max-h-[64vh] overflow-y-auto overscroll-contain pr-1">
              {priceBounds[0] !== priceBounds[1] && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[13px] font-black text-slate-900 tracking-tight">
                      Price Range
                    </h4>
                    <button
                      type="button"
                      onClick={resetPriceRange}
                      disabled={!priceTouched}
                      className="text-[10.5px] font-black text-[#02402c] disabled:text-slate-300 active:scale-95 transition-all"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="px-1 pb-2">
                    <div className="relative h-1.5 bg-slate-200 rounded-full">
                      <div
                        className="absolute h-1.5 rounded-full bg-[#02402c] transition-all"
                        style={{
                          left: `${((currentRange[0] - priceBounds[0]) / Math.max(1, priceBounds[1] - priceBounds[0])) * 100}%`,
                          right: `${100 - ((currentRange[1] - priceBounds[0]) / Math.max(1, priceBounds[1] - priceBounds[0])) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="relative -mt-3">
                      <input
                        type="range"
                        min={priceBounds[0]}
                        max={priceBounds[1]}
                        value={currentRange[0]}
                        onChange={(e) => handlePriceChange(0, Number(e.target.value))}
                        aria-label="Minimum price"
                        className="range-thumb absolute w-full h-6 appearance-none bg-transparent pointer-events-none"
                      />
                      <input
                        type="range"
                        min={priceBounds[0]}
                        max={priceBounds[1]}
                        value={currentRange[1]}
                        onChange={(e) => handlePriceChange(1, Number(e.target.value))}
                        aria-label="Maximum price"
                        className="range-thumb absolute w-full h-6 appearance-none bg-transparent pointer-events-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex flex-col">
                      <span className="text-[9.5px] font-black text-slate-400 tracking-wider uppercase">
                        Min
                      </span>
                      <span className="text-[14px] font-black text-slate-900 tabular-nums">
                        ₹{currentRange[0].toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-slate-200 mx-3" />
                    <div className="flex flex-col items-end">
                      <span className="text-[9.5px] font-black text-slate-400 tracking-wider uppercase">
                        Max
                      </span>
                      <span className="text-[14px] font-black text-slate-900 tabular-nums">
                        ₹{currentRange[1].toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="h-px bg-slate-100" />

              <div className="space-y-1.5">
                <h4 className="text-[13px] font-black text-slate-900 tracking-tight mb-2">
                  Sort Order
                </h4>
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sortBy === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSortBy(opt.id);
                        setIsSortSheetOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl p-3.5 text-left transition ${
                        isSelected
                          ? 'bg-emerald-50/60 ring-1 ring-emerald-600'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            isSelected
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <p
                            className={`text-xs font-bold leading-none ${
                              isSelected ? 'text-slate-900' : 'text-slate-700'
                            }`}
                          >
                            {opt.label}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">{opt.subLabel}</p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-white shadow-sm">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  resetFilters();
                  setIsSortSheetOpen(false);
                }}
                className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-700 text-[13px] font-black active:scale-95 transition-transform"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setIsSortSheetOpen(false)}
                className="flex-1 h-11 rounded-xl bg-[#02402c] text-white text-[13px] font-black active:scale-95 transition-transform shadow-md shadow-[#02402c]/25"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== VOICE SEARCH MODAL ==================== */}
      <VoiceSearchModal
        open={showVoiceModal}
        onClose={closeVoiceModal}
        isListening={isListening}
        error={voiceError}
        transcript={voiceTranscript}
        onRetry={handleVoiceRetry}
        onConfirm={handleVoiceConfirm}
        lang="en-IN"
      />

      <style>{`
        .range-thumb::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          pointer-events: auto;
          height: 22px;
          width: 22px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2.5px solid #02402c;
          box-shadow: 0 2px 6px rgba(2,64,44,0.25);
          cursor: grab;
          margin-top: 0;
          transition: transform 0.15s ease;
        }
        .range-thumb::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.1);
        }
        .range-thumb::-moz-range-thumb {
          pointer-events: auto;
          height: 22px;
          width: 22px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2.5px solid #02402c;
          box-shadow: 0 2px 6px rgba(2,64,44,0.25);
          cursor: grab;
        }
        .range-thumb::-moz-range-thumb:active {
          cursor: grabbing;
          transform: scale(1.1);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}