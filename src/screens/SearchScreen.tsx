import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
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
  Percent,
  Flame,
  RotateCcw,
} from 'lucide-react';
import type { Product, PromoBanner, Category } from '@/types';
import type { useCart } from '@/store';
import {
  getLiveSearchSuggestions,
  executeFullSearch,
  type SearchSuggestionItem,
  type RelatedSlugItem,
} from '@/services/searchEngine';
import {
  fetchUserReorderProducts,
  fetchRecentlyViewedProducts,
} from '@/services/catalog';
import { ProductCard, ProductCarousel } from '@/components/ProductCard';
import { PromoCarousel, PromoBannerCard } from '@/components/PromoBanner';
import { PromoAdBanner } from '@/components/PromoAdBanner';

interface SearchScreenProps {
  initialQuery?: string;
  cart: ReturnType<typeof useCart>;
  onBack: () => void;
  onProductClick: (product: Product) => void;
  onBannerAction?: (banner: PromoBanner) => void;
}

const RECENT_SEARCHES_KEY = 'stackknit_recent_searches_v1';

export function SearchScreen({
  initialQuery = '',
  cart,
  onBack,
  onProductClick,
  onBannerAction,
}: SearchScreenProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(!initialQuery);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);

  // Dynamic Personal Modules (Reorder & Recently Viewed)
  const [reorderProducts, setReorderProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // Search Results & Layout state
  const [products, setProducts] = useState<Product[]>([]);
  const [alternativeProducts, setAlternativeProducts] = useState<Product[]>([]);
  const [relatedSlugs, setRelatedSlugs] = useState<RelatedSlugItem[]>([]);
  const [matchedCategory, setMatchedCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [topBanner, setTopBanner] = useState<PromoBanner | null>(null);
  const [middleBanners, setMiddleBanners] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(false);

  const [filterInStock, setFilterInStock] = useState(false);
  const [filterDeals, setFilterDeals] = useState(false);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load Reorder & Recently Viewed modules on mount
  useEffect(() => {
    let mounted = true;
    void Promise.all([
      fetchUserReorderProducts(10),
      fetchRecentlyViewedProducts(),
    ]).then(([reorder, recent]) => {
      if (mounted) {
        setReorderProducts(reorder || []);
        setRecentlyViewed(recent || []);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const saveRecentSearch = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // Real-time suggestions while typing
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

  const performSearch = useCallback(
    async (searchTerm: string) => {
      const q = (searchTerm || '').trim();
      setSubmittedQuery(q);
      setIsFocused(false);
      setLoading(true);
      if (q) saveRecentSearch(q);

      const result = await executeFullSearch(q, {
        inStockOnly: filterInStock,
        hasDealsOnly: filterDeals,
      });

      setProducts(result.products);
      setAlternativeProducts(result.alternativeBrandProducts);
      setRelatedSlugs(result.relatedSlugs);
      setMatchedCategory(result.matchedCategory);
      setAllCategories(result.allCategories);
      setTrendingProducts(result.trendingProducts);
      setTopBanner(result.topBanner);
      setMiddleBanners(result.middleBanners);
      setDidYouMean(result.didYouMean);
      setLoading(false);
    },
    [filterInStock, filterDeals]
  );

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
      
      {/* Sticky Top Search Header */}
      <div className="sticky top-0 z-40 bg-[#02402c] px-4 py-3 shadow-md">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-7xl mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all shrink-0"
          >
            <ArrowLeft size={20} />
          </button>

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

          <button
            type="submit"
            className="h-11 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold text-xs tracking-wide active:scale-95 transition-transform shrink-0 shadow-sm"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-3 space-y-6">
        
        {/* Real-time Typing Dropdown Overlay */}
        {isFocused && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card divide-y divide-slate-100 overflow-hidden">
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
            
            {/* Top Fixed Promo Ad Banner */}
            {topBanner && (
              <div className="overflow-hidden rounded-2xl shadow-sm">
                <PromoAdBanner banner={topBanner} onAction={onBannerAction} />
              </div>
            )}

            {/* Header & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div>
                <h1 className="text-sm font-extrabold text-slate-900">
                  Search results for <span className="text-emerald-700">"{submittedQuery}"</span>
                </h1>
                <p className="text-[11px] text-slate-500">
                  {matchedCategory ? `Browsing category: ${matchedCategory.name} · ` : ''}
                  {products.length} wholesale commodities found
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFilterInStock(!filterInStock);
                    void performSearch(submittedQuery);
                  }}
                  className={`h-8 px-3 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
                    filterInStock
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {filterInStock && <Check size={13} />} In Stock
                </button>

                <button
                  onClick={() => {
                    setFilterDeals(!filterDeals);
                    void performSearch(submittedQuery);
                  }}
                  className={`h-8 px-3 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
                    filterDeals
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {filterDeals && <Percent size={13} />} Deals
                </button>
              </div>
            </div>

            {/* 1. Primary Matched Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map((product) => (
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
                <h3 className="text-sm font-bold text-slate-800">No exact matches for "{submittedQuery}"</h3>
                <p className="text-xs text-slate-400">Discover related categories and brand alternatives below.</p>
              </div>
            )}

            {/* 2. Middle Promo Banner / Carousel */}
            {middleBanners.length > 0 && (
              <div className="pt-2">
                {middleBanners.length > 1 ? (
                  <PromoCarousel banners={middleBanners} onAction={onBannerAction} />
                ) : (
                  <PromoBannerCard banner={middleBanners[0]} onAction={onBannerAction} />
                )}
              </div>
            )}

            {/* 3. Alternative Products from Other Brands */}
            {alternativeProducts.length > 0 && (
              <div className="space-y-3 pt-2">
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

            {/* 4. Related Slugs & Category Navigation */}
            {relatedSlugs.length > 0 && (
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
            )}

            {/* 5. Quick Reorder (Buy Again) Carousel */}
            {reorderProducts.length > 0 && (
              <div className="pt-2">
                <ProductCarousel
                  title="Quick Reorder / Buy Again"
                  subtitle="Frequent purchases for your business"
                  products={reorderProducts}
                  getQuantity={(id) => cart.getQuantity(id)}
                  onAdd={(p) => cart.addToCart(p)}
                  onIncrement={(p) => cart.addToCart(p)}
                  onDecrement={(p) => cart.updateQuantity(p.id, cart.getQuantity(p.id) - 1)}
                  onProductClick={onProductClick}
                  onViewAll={() => navigate('/orders')}
                />
              </div>
            )}

            {/* 6. Recently Viewed Products Carousel */}
            {recentlyViewed.length > 0 && (
              <div className="pt-2">
                <ProductCarousel
                  title="Recently Viewed Products"
                  subtitle="Pick up where you left off"
                  products={recentlyViewed}
                  getQuantity={(id) => cart.getQuantity(id)}
                  onAdd={(p) => cart.addToCart(p)}
                  onIncrement={(p) => cart.addToCart(p)}
                  onDecrement={(p) => cart.updateQuantity(p.id, cart.getQuantity(p.id) - 1)}
                  onProductClick={onProductClick}
                  onViewAll={() => navigate('/categories')}
                />
              </div>
            )}

            {/* 7. "Explore All Categories" Visual Grid */}
            {allCategories.length > 0 && (
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
            )}

            {/* 8. Top Rated & Trending Wholesale Deals */}
            {trendingProducts.length > 0 && (
              <div className="pt-2">
                <ProductCarousel
                  title="Trending Wholesale Commodities"
                  subtitle="Best sellers and bulk deals across the catalog"
                  products={trendingProducts}
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
    </div>
  );
}