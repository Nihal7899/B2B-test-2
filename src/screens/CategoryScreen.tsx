import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  ShoppingBag,
  Layers,
  Sparkles,
  ArrowUpDown,
  Star,
  Tag,
  X,
} from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { fetchCategories, fetchProductsBySubcategory } from '@/services/catalog';
import type { Category, Subcategory, Product } from '@/types';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating' | 'discount';

interface CategoryScreenProps {
  onBack: () => void;
  onProduct: (product: Product) => void;
  cart: any;
}

export function CategoryScreen({ onBack, onProduct, cart }: CategoryScreenProps) {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('id');
  const navigate = useNavigate();

  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [activeSubId, setActiveSubId] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [query, setQuery] = useState('');

  // Advanced Filter States
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [dealsOnly, setDealsOnly] = useState(false);
  const [highRatingOnly, setHighRatingOnly] = useState(false);

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
          // Deduplicate products across subcategories
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

  // Advanced Filtration and Sorting logic
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Search Query
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    // Filter toggles
    if (dealsOnly) {
      result = result.filter((p) => p.mrp > p.price);
    }
    if (highRatingOnly) {
      result = result.filter((p) => (p.rating || 0) >= 4.0);
    }

    // Sorting
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

  const activeFiltersCount =
    (sortBy !== 'default' ? 1 : 0) +
    (dealsOnly ? 1 : 0) +
    (highRatingOnly ? 1 : 0);

  const resetFilters = () => {
    setSortBy('default');
    setDealsOnly(false);
    setHighRatingOnly(false);
  };

  if (loading || !category) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  const primaryCol = categoryTheme?.primaryColor || '#10b981';

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50">
      {/* Header Container */}
      <header
        className="shrink-0 shadow-md transition-all"
        style={{ background: category.gradient || primaryCol }}
      >
        <div className="mx-auto max-w-[720px] px-4 pt-3 pb-2 text-white">
          {/* Top Bar with Cart Button & Badge */}
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

            {/* Cart Button with Counter Badge */}
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

          {/* Search Bar */}
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

          {/* Modern Horizontal Filter Strip */}
          <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {/* Sort Options dropdown/cycle pill */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition outline-none cursor-pointer ${
                  sortBy !== 'default'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md'
                }`}
              >
                <option value="default" className="text-slate-800">⚡ Relevancy</option>
                <option value="price-asc" className="text-slate-800">₹ Price: Low to High</option>
                <option value="price-desc" className="text-slate-800">₹ Price: High to Low</option>
                <option value="rating" className="text-slate-800">★ Top Rated</option>
                <option value="discount" className="text-slate-800">🔥 Best Discounts</option>
              </select>
            </div>

            {/* Deals Pill */}
            <button
              onClick={() => setDealsOnly(!dealsOnly)}
              className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition active:scale-95 ${
                dealsOnly
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md'
              }`}
            >
              <Sparkles size={11} />
              Best Deals
            </button>

            {/* Top Rated Pill */}
            <button
              onClick={() => setHighRatingOnly(!highRatingOnly)}
              className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition active:scale-95 ${
                highRatingOnly
                  ? 'bg-white text-amber-500 shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md'
              }`}
            >
              <Star size={11} className={highRatingOnly ? 'fill-amber-400' : ''} />
              4.0+ Rated
            </button>

            {/* Clear Filters indicator */}
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex shrink-0 items-center gap-0.5 rounded-lg bg-black/25 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md"
              >
                <X size={10} />
                Reset
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Independent Scroll Layout */}
      <div className="mx-auto flex h-[calc(100vh-140px)] w-full max-w-[720px] flex-1 overflow-hidden">
        {/* Left Subcategory Strip (Fixed Height, Independent Scroll) */}
        <aside className="w-20 md:w-24 shrink-0 overflow-y-auto border-r border-slate-200/80 bg-white py-2 scrollbar-none">
          {/* Default "All" Subcategory Option */}
          <button
            onClick={() => setActiveSubId('all')}
            className={`relative flex w-full flex-col items-center gap-1.5 px-1 py-2.5 transition ${
              activeSubId === 'all' ? 'bg-slate-100/80' : 'hover:bg-slate-50'
            }`}
          >
            <div
              className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition ${
                activeSubId === 'all'
                  ? 'border-emerald-500 shadow-sm'
                  : 'border-slate-100 bg-slate-50'
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

          {/* Subcategories list */}
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
                      e.currentTarget.src =
                        'https://placehold.co/120x120/EEE/999?text=Item';
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

        {/* Right Products Container (Independent Scroll) */}
        <main className="flex-1 overflow-y-auto px-3 py-3 scrollbar-none">
          {/* Header Title */}
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
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="mt-3 rounded-xl bg-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-700 active:scale-95"
                >
                  Clear Filters
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
                  onClick={() => onProduct(p)}
                  horizontal={false}
                  theme={categoryTheme}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
