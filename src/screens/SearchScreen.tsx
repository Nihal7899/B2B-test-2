import { useEffect, useState, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Search,
  X,
  History,
  TrendingUp,
  Sparkles,
  Filter,
  Check,
  ShoppingBag,
  Plus,
  Minus,
  AlertCircle,
} from 'lucide-react';
import type { Product, PromoBanner } from '@/types';
import type { useCart } from '@/store';
import {
  getLiveSearchSuggestions,
  executeFullSearch,
  type SearchSuggestionItem,
} from '@/services/searchEngine';
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
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(!initialQuery);

  // Suggestions & Corrections state (lightweight)
  const [suggestions, setSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);

  // Search Results state
  const [products, setProducts] = useState<Product[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [promoAd, setPromoAd] = useState<PromoBanner | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter Chips
  const [filterInStock, setFilterInStock] = useState(false);
  const [filterDeals, setFilterDeals] = useState(false);

  // Recent Searches
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Save to Recent Searches
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

  // 1. Live Lightweight Suggestions while typing (No full product queries)
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

  // 2. Perform heavy search execution on submit or filter toggle
  const performSearch = useCallback(
    async (searchTerm: string) => {
      const q = searchTerm.trim();
      setSubmittedQuery(q);
      setIsFocused(false);
      setLoading(true);
      if (q) saveRecentSearch(q);

      const result = await executeFullSearch(q, {
        inStockOnly: filterInStock,
        hasDealsOnly: filterDeals,
      });

      setProducts(result.products);
      setRelatedProducts(result.relatedProducts);
      setDidYouMean(result.didYouMean);
      setPromoAd(result.promoAd);
      setLoading(false);
    },
    [filterInStock, filterDeals]
  );

  // Auto-run if opened with initialQuery
  useEffect(() => {
    if (initialQuery) {
      void performSearch(initialQuery);
    } else {
      setTimeout(() => searchInputRef.current?.focus(), 150);
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
      {/* Top Search Bar */}
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
              placeholder="Search by brand, item, or category..."
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

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-3 space-y-4">
        
        {/* Suggestion Dropdown Overlay when typing */}
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
                    className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Search size={14} className="text-slate-400 shrink-0" />
                      <span className="text-xs font-semibold text-slate-700 truncate">{item.text}</span>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                      {item.type}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches section */}
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

        {/* Search Results Display */}
        {!isFocused && submittedQuery && (
          <div className="space-y-4">
            
            {/* Active Query Header & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
              <div>
                <h1 className="text-sm font-extrabold text-slate-900">
                  Search results for <span className="text-emerald-700">"{submittedQuery}"</span>
                </h1>
                <p className="text-[11px] text-slate-500">{products.length} commodities available</p>
              </div>

              {/* Filter Chips */}
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
                  {filterDeals && <Check size={13} />} Volume Deals
                </button>
              </div>
            </div>

            {/* Spell Corrector suggestion card if typo was made */}
            {didYouMean && (
              <div
                onClick={() => handleSelectKeyword(didYouMean)}
                className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer flex items-center justify-between text-xs text-emerald-950 transition-colors hover:bg-emerald-100/70"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-600" />
                  <span>
                    Showing results for <strong>{submittedQuery}</strong>. Did you mean{' '}
                    <span className="font-extrabold text-emerald-700 underline">{didYouMean}</span>?
                  </span>
                </div>
                <span className="font-bold text-[11px] text-emerald-700">Search '{didYouMean}'</span>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-56 bg-slate-200 rounded-2xl animate-pulse" />
                ))}
              </div>
            )}

            {/* Products Grid */}
            {!loading && products.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {products.map((product) => {
                    const qty = cart.getQuantity(product.id);
                    return (
                      <div
                        key={product.id}
                        className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
                      >
                        <div
                          className="h-32 w-full overflow-hidden rounded-xl bg-slate-50 mb-2 cursor-pointer relative"
                          onClick={() => onProductClick(product)}
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {product.mrp > product.price && (
                            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-orange-500 text-white text-[9px] font-black uppercase tracking-wider">
                              {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                            {product.brand}
                          </p>
                          <h3
                            onClick={() => onProductClick(product)}
                            className="text-xs font-bold text-slate-800 line-clamp-2 cursor-pointer mt-0.5"
                          >
                            {product.name}
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {product.packSize} · MOQ: {product.moq}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-sm font-extrabold text-slate-900">₹{product.price}</span>
                            {product.mrp > product.price && (
                              <span className="text-[10px] text-slate-400 line-through ml-1.5">
                                ₹{product.mrp}
                              </span>
                            )}
                          </div>

                          {qty > 0 ? (
                            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg p-0.5">
                              <button
                                onClick={() => cart.updateQuantity(product.id, qty - 1)}
                                className="h-6 w-6 rounded bg-emerald-600 text-white flex items-center justify-center active:scale-95"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="text-xs font-extrabold text-emerald-900 px-1">{qty}</span>
                              <button
                                onClick={() => cart.addToCart(product)}
                                className="h-6 w-6 rounded bg-emerald-600 text-white flex items-center justify-center active:scale-95"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => cart.addToCart(product)}
                              className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-sm transition-all"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Promo Ad Card placed inside Search Results */}
                {promoAd && (
                  <div className="pt-2">
                    <PromoAdBanner banner={promoAd} onAction={onBannerAction} />
                  </div>
                )}
              </>
            )}

            {/* Zero Results State with Recommendations */}
            {!loading && products.length === 0 && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <AlertCircle size={32} />
                  </div>
                  <h2 className="text-base font-black text-slate-900">No exact matches found</h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    We couldn't find items for "{submittedQuery}". Try checking your spelling or search by general category.
                  </p>
                </div>

                {/* Recommended Fallback Products */}
                {relatedProducts.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-900">Popular Business Commodities</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {relatedProducts.map((p) => (
                        <div
                          key={p.id}
                          className="bg-white border rounded-xl p-3 flex flex-col justify-between shadow-sm cursor-pointer"
                          onClick={() => onProductClick(p)}
                        >
                          <img src={p.image} alt={p.name} className="h-24 w-full object-cover rounded-lg mb-2" />
                          <p className="text-[10px] font-bold text-emerald-600 uppercase">{p.brand}</p>
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-2">{p.name}</h4>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-900">₹{p.price}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cart.addToCart(p);
                              }}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-bold"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
