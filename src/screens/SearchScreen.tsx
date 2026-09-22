import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { PromoAdBanner } from '@/components/PromoAdBanner';

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
  // Direct live subscription to cart store
  const cart = useCart();

  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(!initialQuery);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);

  // Real data modules
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [reorderProducts, setReorderProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // Search results state
  const [products, setProducts] = useState<Product[]>([]);
  const [alternativeProducts, setAlternativeProducts] = useState<Product[]>([]);
  const [relatedSlugs, setRelatedSlugs] = useState<RelatedSlugItem[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter & Sort States
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(false);
  const [highRatingOnly, setHighRatingOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const topBanner = useMemo(
    () => banners.find((b) => b.position === 'top') || banners[0] || null,
    [banners]
  );
  const carouselBanners = useMemo(
    () => banners.filter((b) => b.position === 'carousel' || b.position === 'middle'),
    [banners]
  );

  const saveRecentSearch = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const updated = [
      trimmed,
      ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

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
    }, 100);

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
    if (q) saveRecentSearch(q);

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
    if (initialQuery) {
      void performSearch(initialQuery);
    } else {
      setTimeout(() => searchInputRef.current?.focus(), 120);
    }
  }, [initialQuery, performSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      void performSearch(query);
    }
  };

  const handleSelectKeyword = (text: string) => {
    setQuery(text);
    void performSearch(text);
  };

  const handleSlugClick = (slugItem: RelatedSlugItem) => {
    if (slugItem.type === 'category' && slugItem.id) {
      navigate(`/category?id=${slugItem.id}`);
    } else {
      setQuery(slugItem.name);
      void performSearch(slugItem.name);
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    if (dealsOnly) {
      result = result.filter((p) => p.mrp > p.price);
    }
    if (highRatingOnly) {
      result = result.filter((p) => (p.rating || 0) >= 4.0);
    }
    if (inStockOnly) {
      result = result.filter((p) => p.inStock);
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
  }, [products, dealsOnly, highRatingOnly, inStockOnly, sortBy]);

  const activeFiltersCount =
    (sortBy !== 'default' ? 1 : 0) +
    (dealsOnly ? 1 : 0) +
    (highRatingOnly ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const hasActiveFilters = activeFiltersCount > 0;

  const resetFilters = () => {
    setSortBy('default');
    setDealsOnly(false);
    setHighRatingOnly(false);
    setInStockOnly(false);
  };

  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.id === sortBy)?.label || 'Relevancy';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
      {/* Sticky Header with safe-top for native notch/status-bar spacing */}
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
                className="w-full h-11 pl-10 pr-9 rounded-xl bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm placeholder:text-slate-400"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSubmittedQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 active:scale-90"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Cart Button */}
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

          {/* Horizontal Filter Bar */}
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

        {/* Slide-Down Reset Banner Strip */}
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

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto py-3 space-y-6">
        {/* Real-time Typing Suggestions & Recents Dropdown */}
        {isFocused && (
          <div className="mx-4 bg-white rounded-2xl border border-slate-200/80 shadow-card divide-y divide-slate-100 overflow-hidden">
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
              <div className="py-2">
                <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Suggestions
                </div>
                {suggestions.map((item, idx) => (
                  <button
                    key={`${item.text}-${idx}`}
                    onClick={() => handleSelectKeyword(item.text)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Search size={14} className="text-slate-400 group-hover:text-emerald-600 shrink-0 transition-colors" />
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-900 truncate">
                        {item.text}
                      </span>
                    </div>
                    {item.packSize && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Package size={11} /> {item.packSize}
                      </span>
                    )}
                  </button>
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

        {/* Results Page */}
        {!isFocused && submittedQuery && (
          <div className="space-y-6">
            {/* 1. Top Home Banner */}
            {topBanner && (
              <PromoAdBanner banner={topBanner} onAction={onBannerAction} />
            )}

            {/* 2. Primary Product Grid */}
            <div className="px-4">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
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

            {/* 3. Middle Home Promo Carousel */}
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

            {/* 4. Alternative Brand Products */}
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

            {/* 5. Related Slugs & Category Navigation */}
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

            {/* 6. Quick Reorder Carousel */}
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

            {/* 7. Recently Viewed Carousel */}
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

            {/* 8. "Explore All Categories" Visual Grid */}
            {allCategories.length > 0 && (
              <div className="px-4">
                <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Grid size={16} className="text-emerald-600" />
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">Explore Categories</h3>
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

            {/* 9. Trending Wholesale Deals */}
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

      {/* Sort Sheet Modal */}
      {isSortSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setIsSortSheetOpen(false)}
          />

          <div className="relative z-10 w-full max-w-[720px] rounded-t-[32px] bg-white p-5 pb-8 safe-bottom shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Sort & Filter Order
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose how search products are presented
                </p>
              </div>
              <button
                onClick={() => setIsSortSheetOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-1.5 max-h-[60vh] overflow-y-auto">
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
                        ? 'bg-emerald-50/60 ring-1.5 ring-emerald-600'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
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
                        <p className="mt-1 text-[10px] text-slate-400">
                          {opt.subLabel}
                        </p>
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
        </div>
      )}
    </div>
  );
}
