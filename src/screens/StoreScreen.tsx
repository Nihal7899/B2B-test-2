// screens/StoreScreen.tsx
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Filter, Grid3x3, List, Search, X, Star, Truck, ShieldCheck, Tag } from 'lucide-react';
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
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        `${p.brand} ${p.name} ${p.category}`.toLowerCase().includes(q)
      );
    }
    if (filters.categories.length) {
      result = result.filter(p => filters.categories.includes(p.category));
    }
    result = result.filter(p => p.price >= filters.minPrice && p.price <= filters.maxPrice);
    if (filters.inStock) {
      result = result.filter(p => p.stock > 0);
    }
    return result;
  }, [products, searchQuery, filters]);

  // Unique categories from store products
  const storeCategories = useMemo(
    () => [...new Set(products.map(p => p.category))].filter(Boolean),
    [products]
  );

  // Featured products (first 4)
  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);

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

  // Theme helpers using hex colors
  const primary = store.primary_color || '#10b981';
  const secondary = store.secondary_color || '#059669';
  const textColor = store.text_color || '#064e3b';
  const borderColor = store.border_color || '#a7f3d0';
  const buttonStyle = store.button_style || 'brand';

  const renderButton = (label: string, onClick: () => void, icon?: React.ReactNode) => {
    const base = 'px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2';
    if (buttonStyle === 'outline') {
      return (
        <button
          onClick={onClick}
          className={`${base} border-2`}
          style={{ borderColor: borderColor, color: textColor }}
        >
          {icon} {label}
        </button>
      );
    }
    if (buttonStyle === 'ghost') {
      return (
        <button
          onClick={onClick}
          className={base}
          style={{ color: textColor }}
        >
          {icon} {label}
        </button>
      );
    }
    // default: solid
    return (
      <button
        onClick={onClick}
        className={`${base} text-white shadow-sm`}
        style={{ backgroundColor: primary }}
      >
        {icon} {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-ink-50">
      {/* ===== HERO BANNER ===== */}
      <header className="relative overflow-hidden" style={{ backgroundColor: primary }}>
        {store.banner_image_url && (
          <div className="absolute inset-0 opacity-40">
            <img src={store.banner_image_url} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="relative z-10 px-4 py-6 max-w-7xl mx-auto text-white">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-white/20 backdrop-blur-sm mb-3 inline-flex"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-4">
            {store.image_url && (
              <img
                src={store.image_url}
                alt={store.name}
                className="h-20 w-20 rounded-2xl object-cover border-2 border-white shadow-lg"
              />
            )}
            <div>
              <h1 className="text-3xl font-extrabold">{store.name}</h1>
              {store.description && (
                <p className="text-sm opacity-90 mt-1">{store.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== STORE STATS / PERKS ===== */}
      <section className="px-4 py-4 bg-white border-b" style={{ borderColor: borderColor }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="flex flex-col items-center">
            <Truck size={20} style={{ color: primary }} />
            <span className="text-xs font-semibold mt-1" style={{ color: textColor }}>Fast Delivery</span>
          </div>
          <div className="flex flex-col items-center">
            <ShieldCheck size={20} style={{ color: primary }} />
            <span className="text-xs font-semibold mt-1" style={{ color: textColor }}>Quality Assured</span>
          </div>
          <div className="flex flex-col items-center">
            <Tag size={20} style={{ color: primary }} />
            <span className="text-xs font-semibold mt-1" style={{ color: textColor }}>Best Prices</span>
          </div>
          <div className="flex flex-col items-center">
            <Star size={20} style={{ color: primary }} />
            <span className="text-xs font-semibold mt-1" style={{ color: textColor }}>Trusted by 100+</span>
          </div>
        </div>
      </section>

      {/* ===== CATEGORY PILLS ===== */}
      {storeCategories.length > 0 && (
        <section className="px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-2">
            {storeCategories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  // Toggle category filter
                  setFilters(prev => ({
                    ...prev,
                    categories: prev.categories.includes(cat)
                      ? prev.categories.filter(c => c !== cat)
                      : [...prev.categories, cat]
                  }));
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                style={{
                  backgroundColor: filters.categories.includes(cat) ? primary : 'transparent',
                  color: filters.categories.includes(cat) ? '#fff' : textColor,
                  borderColor: borderColor,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ===== TOOLBAR ===== */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b px-4 py-2" style={{ borderColor: borderColor }}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
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
          <div className="flex items-center gap-2">
            {renderButton('Filter', () => setShowFilters(true), <Filter size={16} />)}
            <div className="flex border rounded-xl overflow-hidden" style={{ borderColor: borderColor }}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-ink-100' : ''}`}
                style={{ color: viewMode === 'grid' ? textColor : '#9ca3af' }}
              >
                <Grid3x3 size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-ink-100' : ''}`}
                style={{ color: viewMode === 'list' ? textColor : '#9ca3af' }}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PRODUCT LISTING ===== */}
      <div className="px-4 py-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm text-ink-500">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
        </div>

        {viewMode === 'grid' ? (
          <ProductGrid products={filteredProducts} cart={cart} />
        ) : (
          <ProductListView products={filteredProducts} cart={cart} />
        )}
      </div>

      {/* ===== FILTER DRAWER ===== */}
      <FilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        categories={storeCategories}
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
        theme={{ primary, secondary, textColor, borderColor, buttonStyle }}
      />
    </div>
  );
}