import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  ShoppingBag,
  Layers,
  Sparkles,
  ArrowUpDown,
  Star,
  X,
  Check,
  ChevronDown,
  TrendingDown,
  TrendingUp,
  SlidersHorizontal,
  RotateCcw,
  Filter,
} from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { fetchCategories, fetchProductsBySubcategory, fetchWishlist, toggleWishlist } from '@/services/catalog';
import type { Category, Subcategory, Product } from '@/types';

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

interface CategoryScreenProps {
  onBack: () => void;
  onProduct?: (product: Product) => void;
  cart: any;
}

export function CategoryScreen({ onBack, cart }: CategoryScreenProps) {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('id');
  const navigate = useNavigate();

  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [activeSubId, setActiveSubId] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [query, setQuery] = useState('');

  // Advanced Filter & Modal States
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(false);
  const [highRatingOnly, setHighRatingOnly] = useState(false);

  // Load wishlist & set up listeners
  const loadWishlist = useCallback(async () => {
    try {
      const wl = await fetchWishlist();
      setWishlist(wl);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    void loadWishlist();

    const handleWishlistChange = () => {
      void loadWishlist();
    };

    window.addEventListener('wishlist-updated', handleWishlistChange);
    window.addEventListener('focus', handleWishlistChange);
    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistChange);
      window.removeEventListener('focus', handleWishlistChange);
    };
  }, [loadWishlist]);

  const handleWishlistToggle = async (productId: string) => {
    const isWishlisted = wishlist.includes(productId);
    const nextState = !isWishlisted;
    
    setWishlist((prev) =>
      isWishlisted ? prev.filter((id) => id !== productId) : [...prev, productId]
    );

    try {
      await toggleWishlist(productId, isWishlisted);
      window.dispatchEvent(
        new CustomEvent('wishlist-updated', {
          detail: { productId, wishlisted: nextState },
        })
      );
    } catch (err) {
      console.error('Failed to toggle wishlist', err);
      void loadWishlist();
    }
  };

  // Load category and subcategories
  useEffect(() => {
    if (!categoryId) return;
    (async () => {
      setLoading(true);
      try {
        const { categories } = await fetchCategories();
        const found = categories.find((c) => c.id === categoryId);
        if (found) {
          setCategory(found);
          const subs = found.subcategories || [];
          setSubcategories(subs);
          setActiveSubId('all');
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    })();
  }, [categoryId]);

  // Load products based on active subcategory or "all"
  useEffect(() => {
    if (!category) return;
    (async () => {
      setProductsLoading(true);
      try {
        if (activeSubId === 'all') {
          const subs = category.subcategories || [];
          const prodsArray = await Promise.all(
            subs.map((s) => fetchProductsBySubcategory(s.id))
          );
          const merged = Array.from(
            new Map(prodsArray.flat().map((p) => [p.id, p])).values()
          );
          setProducts(merged);
        } else {
          const prods = await fetchProductsBySubcategory(activeSubId);
          setProducts(prods);
        }
      } catch (err) {
        console.error(err);
      }
      setProductsLoading(false);
    })();
  }, [category, activeSubId]);

  // Advanced Filtration & Sorting
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    if (dealsOnly) {
      result = result.filter((p) => p.mrp > p.price);
    }
    if (highRatingOnly) {
      result = result.filter((p) => (p.rating || 0) >= 4.0);
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
  }, [products, query, dealsOnly, highRatingOnly, sortBy]);

  // Category Theme
  const categoryTheme = useMemo(() => {
    if (!category) return undefined;
    const gradient = category.gradient || '#10b981';
    const hexes = gradient.match(/#(?:[0-9a-fA-F]{3}){1,2}/g);
    const expandHex = (hex: string) =>
      hex.length === 4 ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3] : hex;

    const primaryColor = hexes ? expandHex(hexes[0]) : '#10b981';
    const secondaryColor = hexes && hexes.length > 1 ? expandHex(hexes[1]) : primaryColor;

    return {
      primaryColor,
      secondaryColor,
      textColor: '#172033',
      borderColor: '#e8edf0',
      buttonStyle: 'brand' as const,
      gradientFrom: primaryColor,
      gradientTo: secondaryColor,
    };
  }, [category]);

  const primaryCol = categoryTheme?.primaryColor || '#10b981';

  const activeFiltersCount =
    (sortBy !== 'default' ? 1 : 0) +
    (dealsOnly ? 1 : 0) +
    (highRatingOnly ? 1 : 0) +
    (query.trim() !== '' ? 1 : 0);

  const hasActiveFilters = activeFiltersCount > 0;

  const resetFilters = () => {
    setSortBy('default');
    setDealsOnly(false);
    setHighRatingOnly(false);
    setQuery('');
  };

  const handleProductSelect = (product: Product) => {
    navigate(`/product?id=${product.id}&categoryId=${category?.id}`);
  };

  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.id === sortBy)?.label || 'Relevancy';

  if (loading || !category) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50">
      <header
        className="shrink-0 shadow-md transition-all z-20 safe-top"
        style={{ background: category.gradient || primaryCol }}
      >
        <div className="mx-auto max-w-[720px] px-4 pt-3 pb-2.5 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={onBack}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md transition-transform active:scale-90"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                  Category
                </p>
                <h1 className="text-base font-extrabold leading-tight tracking-tight">
                  {category.name}
                </h1>
              </div>
            </div>

            <button
              onClick={() => navigate('/cart')}
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-sm transition active:scale-95"
              aria-label="View Cart"
            >
              <ShoppingBag size={18} className="text-white" />
              {cart?.totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-md ring-2 ring-white animate-pulse">
                  {cart.totalItems}
                </span>
              )}
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-inner">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search in ${category.name}…`}
              className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none placeholder:text-slate-400"
            />
            {query && (
              <button onClick={() => setQuery('')}>
                <X size={14} className="text-slate-400" />
              </button>
            )}
          </div>

          <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
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
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            hasActiveFilters ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="mx-auto flex max-w-[720px] items-center justify-between border-t border-white/15 bg-black/20 px-4 py-2 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-white/90">
              <Filter size={13} className="text-white" />
              <span className="text-[11px] font-bold">
                {activeFiltersCount} {activeFiltersCount === 1 ? 'filter' : 'filters'} applied
              </span>
            </div>

            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-rose-600 shadow-sm transition active:scale-95 hover:bg-white"
            >
              <RotateCcw size={11} strokeWidth={2.5} />
              Reset All
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex flex-1 min-h-0 w-full max-w-[720px] overflow-hidden safe-bottom">
        <aside className="w-20 md:w-24 shrink-0 overflow-y-auto border-r border-slate-200/80 bg-white py-2 scrollbar-none">
          <button
            onClick={() => setActiveSubId('all')}
            className={`relative flex w-full flex-col items-center gap-1.5 px-1 py-2.5 transition ${
              activeSubId === 'all' ? 'bg-slate-100/80' : 'hover:bg-slate-50'
            }`}
          >
            <div
              className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition ${
                activeSubId === 'all' ? 'shadow-sm' : 'border-slate-100 bg-slate-50'
              }`}
              style={{
                borderColor: activeSubId === 'all' ? primaryCol : '#f1f5f9',
                backgroundColor: activeSubId === 'all' ? `${primaryCol}15` : '#f8fafc',
              }}
            >
              <Layers
                size={20}
                style={{ color: activeSubId === 'all' ? primaryCol : '#64748b' }}
              />
            </div>
            <span
              className={`text-center text-[10px] leading-tight ${
                activeSubId === 'all' ? 'font-black' : 'font-semibold text-slate-500'
              }`}
              style={{ color: activeSubId === 'all' ? primaryCol : undefined }}
            >
              All Items
            </span>
            {activeSubId === 'all' && (
              <span
                className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                style={{ backgroundColor: primaryCol }}
              />
            )}
          </button>

          {subcategories.map((sc) => {
            const active = sc.id === activeSubId;
            return (
              <button
                key={sc.id}
                onClick={() => setActiveSubId(sc.id)}
                className={`relative flex w-full flex-col items-center gap-1.5 px-1 py-2.5 transition ${
                  active ? 'bg-slate-100/80' : 'hover:bg-slate-50'
                }`}
              >
                <div
                  className={`relative h-12 w-12 overflow-hidden rounded-2xl border-2 transition ${
                    active ? 'shadow-sm' : 'border-slate-100'
                  }`}
                  style={{
                    borderColor: active ? primaryCol : '#f1f5f9',
                  }}
                >
                  <img
                    src={sc.image_url}
                    alt={sc.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/120x120/EEE/999?text=Item';
                    }}
                  />
                </div>
                <span
                  className={`line-clamp-2 text-center text-[10px] leading-tight ${
                    active ? 'font-black' : 'font-semibold text-slate-500'
                  }`}
                  style={{ color: active ? primaryCol : undefined }}
                >
                  {sc.name}
                </span>
                {active && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                    style={{ backgroundColor: primaryCol }}
                  />
                )}
              </button>
            );
          })}
        </aside>

        <main className="flex-1 overflow-y-auto px-3 py-3 scrollbar-none">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
              {activeSubId === 'all'
                ? 'All Products'
                : subcategories.find((s) => s.id === activeSubId)?.name || 'Products'}
            </h2>
            <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-extrabold text-slate-600">
              {filteredAndSortedProducts.length} items
            </span>
          </div>

          {productsLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-6 w-6 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                <Search size={24} />
              </div>
              <p className="text-xs font-bold text-slate-600">No matching products</p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                Try clearing filters or changing search keywords
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-700 active:scale-95"
                >
                  <RotateCcw size={12} />
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-8">
              {filteredAndSortedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  quantity={cart?.getQuantity?.(p.id) || 0}
                  onAdd={() => cart?.addToCart?.(p)}
                  onIncrement={() => cart?.addToCart?.(p)}
                  onDecrement={() =>
                    cart?.updateQuantity?.(
                      p.id,
                      (cart?.getQuantity?.(p.id) || 0) - 1
                    )
                  }
                  onClick={() => handleProductSelect(p)}
                  horizontal={false}
                  theme={categoryTheme}
                  isWishlisted={wishlist.includes(p.id)}
                  onWishlistToggle={handleWishlistToggle}
                />
              ))}
            </div>
          )}
        </main>
      </div>

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
                  Choose how products are presented
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
                        ? 'bg-slate-50 ring-1.5'
                        : 'hover:bg-slate-50/70'
                    }`}
                    style={{
                      borderColor: isSelected ? primaryCol : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: isSelected ? `${primaryCol}18` : '#f1f5f9',
                          color: isSelected ? primaryCol : '#64748b',
                        }}
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
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm"
                        style={{ backgroundColor: primaryCol }}
                      >
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
