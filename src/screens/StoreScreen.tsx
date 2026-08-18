// screens/StoreScreen.tsx
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Filter, Grid3x3, List, Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Store, Product } from '@/types';
import { fetchStoreById, fetchProductsByIds } from '@/services/catalog';
import { useCart } from '@/store';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductListView } from '@/components/ProductListView';
import { FilterDrawer } from '@/components/FilterDrawer';

export function StoreScreen() {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('storeId');
  const navigate = useNavigate();
  const cart = useCart();

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categories: [] as string[],
    minPrice: 0,
    maxPrice: Infinity,
    inStock: false,
  });

  // Load store and products
  useEffect(() => {
    if (!storeId) {
      navigate('/');
      return;
    }
    (async () => {
      try {
        const storeData = await fetchStoreById(storeId);
        setStore(storeData);
        if (storeData && storeData.product_ids?.length) {
          const productList = await fetchProductsByIds(storeData.product_ids);
          setProducts(productList);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Failed to load store', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [storeId, navigate]);

  // Filter & search logic
  const filteredProducts = useMemo(() => {
    let result = products;
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        `${p.brand} ${p.name} ${p.category}`.toLowerCase().includes(q)
      );
    }
    // Category filter
    if (filters.categories.length) {
      result = result.filter(p => filters.categories.includes(p.category));
    }
    // Price range
    result = result.filter(p => p.price >= filters.minPrice && p.price <= filters.maxPrice);
    // Stock
    if (filters.inStock) {
      result = result.filter(p => p.stock > 0);
    }
    return result;
  }, [products, searchQuery, filters]);

  // Extract unique categories from products
  const allCategories = useMemo(
    () => [...new Set(products.map(p => p.category))].filter(Boolean),
    [products]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-ink-600">Store not found</p>
        <button onClick={() => navigate(-1)} className="text-brand-600 font-bold">
          Go back
        </button>
      </div>
    );
  }

  // Theme helper
  const theme = {
    bg: store.theme_bg || 'bg-brand-50',
    border: store.theme_border || 'border-brand-200',
    text: store.theme_text || 'text-brand-900',
    accent: store.theme_accent || 'bg-brand-600',
    accentHover: store.theme_accent?.replace('bg-', 'hover:bg-') || 'hover:bg-brand-700',
    buttonStyle: store.button_style || 'brand',
  };

  // Button renderer based on store.button_style
  const renderButton = (label: string, onClick: () => void, icon?: React.ReactNode) => {
    const base = 'px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2';
    if (theme.buttonStyle === 'outline') {
      return (
        <button
          onClick={onClick}
          className={`${base} border-2 ${theme.border} ${theme.text} hover:${theme.bg} hover:border-transparent`}
        >
          {icon} {label}
        </button>
      );
    }
    if (theme.buttonStyle === 'ghost') {
      return (
        <button
          onClick={onClick}
          className={`${base} ${theme.text} hover:${theme.bg} hover:bg-opacity-20`}
        >
          {icon} {label}
        </button>
      );
    }
    // default: solid
    return (
      <button
        onClick={onClick}
        className={`${base} ${theme.accent} text-white ${theme.accentHover} shadow-sm`}
      >
        {icon} {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Store Header */}
      <header className={`relative overflow-hidden ${theme.bg} border-b ${theme.border}`}>
        {/* Banner Image (if set) */}
        {store.banner_image_url && (
          <div className="absolute inset-0 opacity-30">
            <img
              src={store.banner_image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="relative z-10 px-4 py-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-full ${theme.bg} ${theme.border} border shadow-sm`}
            >
              <ArrowLeft size={20} className={theme.text} />
            </button>
            <div className="flex-1">
              <h1 className={`text-2xl font-extrabold ${theme.text}`}>{store.name}</h1>
              {store.description && (
                <p className={`text-sm opacity-80 ${theme.text}`}>{store.description}</p>
              )}
            </div>
            {store.image_url && (
              <img
                src={store.image_url}
                alt={store.name}
                className="h-14 w-14 rounded-2xl object-cover border-2 border-white shadow-md"
              />
            )}
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-ink-100 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[180px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in this store…"
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-ink-200 bg-ink-50 text-sm outline-none focus:border-brand-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter & View toggle */}
          <div className="flex items-center gap-2">
            {renderButton(
              'Filter',
              () => setShowFilters(true),
              <Filter size={16} />
            )}
            <div className="flex border border-ink-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? theme.bg + ' ' + theme.text : 'text-ink-400'}`}
              >
                <Grid3x3 size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? theme.bg + ' ' + theme.text : 'text-ink-400'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
        {/* Active filters chips */}
        {(filters.categories.length > 0 || filters.minPrice > 0 || filters.maxPrice < Infinity || filters.inStock) && (
          <div className="flex flex-wrap gap-1.5 mt-2 max-w-7xl mx-auto">
            {filters.categories.map(cat => (
              <span key={cat} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${theme.bg} ${theme.text}`}>
                {cat}
                <button onClick={() => setFilters(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }))}>
                  <X size={12} />
                </button>
              </span>
            ))}
            {(filters.minPrice > 0 || filters.maxPrice < Infinity) && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${theme.bg} ${theme.text}`}>
                ₹{filters.minPrice} – ₹{filters.maxPrice === Infinity ? '∞' : filters.maxPrice}
                <button onClick={() => setFilters(prev => ({ ...prev, minPrice: 0, maxPrice: Infinity }))}>
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.inStock && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${theme.bg} ${theme.text}`}>
                In Stock
                <button onClick={() => setFilters(prev => ({ ...prev, inStock: false }))}>
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Product Listing */}
      <div className="px-4 py-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm text-ink-500">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-ink-500">Sort:</label>
            <select
              className="border-0 bg-transparent font-semibold text-ink-800 outline-none"
              onChange={(e) => {
                // Sorting logic can be added here (e.g., reorder filteredProducts)
                // For simplicity, we skip implementation, but you can add a sort state.
              }}
            >
              <option value="popular">Popular</option>
              <option value="price-low">Price: Low→High</option>
              <option value="price-high">Price: High→Low</option>
            </select>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <ProductGrid products={filteredProducts} cart={cart} />
        ) : (
          <ProductListView products={filteredProducts} cart={cart} />
        )}
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        categories={allCategories}
        selectedCategories={filters.categories}
        onCategoryToggle={(cat) =>
          setFilters(prev => ({
            ...prev,
            categories: prev.categories.includes(cat)
              ? prev.categories.filter(c => c !== cat)
              : [...prev.categories, cat],
          }))
        }
        priceRange={{
          min: filters.minPrice,
          max: filters.maxPrice === Infinity ? 100000 : filters.maxPrice,
        }}
        onPriceChange={(min, max) =>
          setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max || Infinity }))
        }
        inStock={filters.inStock}
        onInStockToggle={() => setFilters(prev => ({ ...prev, inStock: !prev.inStock }))}
        theme={theme}
      />
    </div>
  );
}