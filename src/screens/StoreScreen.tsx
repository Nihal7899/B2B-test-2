import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from '@/context/StoreContext';
import { ChevronLeft, Search, ShoppingCart, ChevronRight, X } from 'lucide-react';
import { useCart } from '@/store';
import { fetchProductsByIds, fetchStores } from '@/services/catalog';
import type { Product as AppProduct, Store } from '@/types';
import { ProductCard } from '@/components/ProductCard';

interface StoreScreenProps {
  goTo: (screen: string) => void;
}

function StoreScreenContent({ goTo }: StoreScreenProps) {
  const { config } = useStore();
  const navigate = useNavigate();
  const cart = useCart();
  const { header, iconGrid, dietaryNeeds, promoBanner, categories, packaging, otherStores } = config;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<{ type: 'category' | 'dietary'; value: string } | null>(null);
  const [products, setProducts] = useState<AppProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherStoreDetails, setOtherStoreDetails] = useState<Store[]>([]);

  // Fetch all product IDs from all categories
  const allProductIds = useMemo(() => {
    const ids: string[] = [];
    categories.forEach(cat => {
      cat.productIds.forEach(id => {
        if (!ids.includes(id)) ids.push(id);
      });
    });
    return ids;
  }, [categories]);

  // Fetch product details
  useEffect(() => {
    if (allProductIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchProductsByIds(allProductIds)
      .then(data => {
        setProducts(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [allProductIds]);

  // Fetch other store details
  useEffect(() => {
    if (otherStores.length === 0) return;
    const storeIds = otherStores.map(s => s.storeId);
    fetchStores().then(allStores => {
      const filtered = allStores.filter(s => storeIds.includes(s.id));
      setOtherStoreDetails(filtered);
    });
  }, [otherStores]);

  // Build a map of category ID -> category title
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(c => { map[c.id] = c.title; });
    return map;
  }, [categories]);

  // Filter logic
  const filteredProducts = useMemo(() => {
    let result = products;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    if (selectedFilter) {
      // Filter by category name (from the selected category title)
      result = result.filter(p => p.category === selectedFilter.value);
    }
    return result;
  }, [products, searchQuery, selectedFilter]);

  // Handlers
  const handleIconClick = (categoryId: string) => {
    const categoryTitle = categoryMap[categoryId];
    if (categoryTitle) {
      setSelectedFilter({ type: 'category', value: categoryTitle });
      setSearchQuery('');
    }
  };

  const handleDietaryClick = (categoryId: string) => {
    const categoryTitle = categoryMap[categoryId];
    if (categoryTitle) {
      setSelectedFilter({ type: 'dietary', value: categoryTitle });
      setSearchQuery('');
    }
  };

  const clearFilter = () => {
    setSelectedFilter(null);
    setSearchQuery('');
  };

  const hasActiveFilter = !!(selectedFilter || searchQuery.trim());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 rounded-full border-2 border-green-200 border-t-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-gray-50">
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-green-800 leading-tight">{header.title}</h1>
            <p className="text-xs text-gray-500">{header.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-gray-50">
            <Search size={18} className="text-gray-600" />
          </button>
          <button className="relative p-2 rounded-full hover:bg-gray-50" onClick={() => goTo('cart')}>
            <ShoppingCart size={18} className="text-gray-600" />
            {header.cartBadgeCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                {header.cartBadgeCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within this store…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-green-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter chip */}
      {selectedFilter && (
        <div className="px-4 pb-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {selectedFilter.value}
            <button onClick={clearFilter}><X size={12} /></button>
          </span>
        </div>
      )}

      {/* Results or main content */}
      {hasActiveFilter ? (
        <section className="px-4 py-3">
          <p className="text-xs text-gray-500 mb-3">{filteredProducts.length} products found</p>
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={cart.getQuantity(product.id)}
                onAdd={() => cart.addToCart(product)}
                onIncrement={() => cart.addToCart(product)}
                onDecrement={() => cart.updateQuantity(product.id, cart.getQuantity(product.id) - 1)}
                onClick={() => navigate(`/product?id=${product.id}`)}
              />
            ))}
          </div>
        </section>
      ) : (
        <>
          {/* Icon Grid */}
          {iconGrid.length > 0 && (
            <section className="px-4 py-4">
              <div className="grid grid-cols-4 gap-3">
                {iconGrid.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleIconClick(item.categoryId)}
                    className="flex flex-col items-center tap-highlight active:scale-95 transition-transform"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#F4F9EC] flex items-center justify-center text-3xl">
                      {item.iconUrl}
                    </div>
                    <span className="text-xs text-center mt-1 font-medium text-gray-700">{item.title}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Dietary Needs */}
          {dietaryNeeds.length > 0 && (
            <section className="px-4 py-2">
              <h2 className="text-base font-bold text-gray-800 mb-3">Shop by Dietary Needs</h2>
              <div className="grid grid-cols-2 gap-3">
                {dietaryNeeds.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleDietaryClick(item.categoryId)}
                    className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 tap-highlight active:scale-95 transition-transform"
                  >
                    <img src={item.imageUrl} alt={item.title} className="w-full h-28 object-cover" />
                    <div className="p-2 text-center font-semibold text-sm text-gray-700">{item.title}</div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Promo Banner */}
          {promoBanner.title && (
            <section className="px-4 py-3">
              <div className={`rounded-2xl p-4 ${promoBanner.backgroundTheme} relative overflow-hidden min-h-[140px]`}>
                <div className="space-y-1 max-w-[60%]">
                  {promoBanner.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-800 bg-white/30 px-2 py-0.5 rounded-full">
                      {promoBanner.badge}
                    </span>
                  )}
                  <h3 className="text-xl font-extrabold text-green-900 leading-tight">{promoBanner.title}</h3>
                  {promoBanner.subtitle && (
                    <p className="text-sm text-green-800 opacity-80">{promoBanner.subtitle}</p>
                  )}
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  {promoBanner.floatingProductImages.slice(0, 3).map((url, idx) => (
                    <img key={idx} src={url} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md" />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Categories with products */}
          {categories.map((category) => {
            const categoryProducts = products.filter(p => category.productIds.includes(p.id));
            if (categoryProducts.length === 0) return null;
            return (
              <section key={category.id} className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-gray-800">{category.title}</h2>
                  {categoryProducts.length > 4 && (
                    <button
                      onClick={() => handleIconClick(category.id)}
                      className="text-xs font-semibold text-green-600 flex items-center"
                    >
                      See all <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                {/* Tabs */}
                {category.tabs.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {category.tabs.map(tab => (
                      <div key={tab.id} className="flex flex-col items-center shrink-0">
                        <div className="w-12 h-12 rounded-full bg-[#F4F9EC] flex items-center justify-center text-xl">
                          {tab.iconUrl}
                        </div>
                        <span className="text-[10px] mt-1 text-gray-600 whitespace-nowrap">{tab.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pill filters */}
                {category.pillFilters && category.pillFilters.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {category.pillFilters.map(pill => (
                      <span key={pill} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {pill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Products */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {categoryProducts.slice(0, 4).map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantity={cart.getQuantity(product.id)}
                      onAdd={() => cart.addToCart(product)}
                      onIncrement={() => cart.addToCart(product)}
                      onDecrement={() => cart.updateQuantity(product.id, cart.getQuantity(product.id) - 1)}
                      onClick={() => navigate(`/product?id=${product.id}`)}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {/* All Products */}
          {products.length > 0 && (
            <section className="px-4 py-3 border-t border-gray-100">
              <h2 className="text-base font-bold text-gray-800 mb-3">All Products</h2>
              <div className="grid grid-cols-2 gap-3">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={cart.getQuantity(product.id)}
                    onAdd={() => cart.addToCart(product)}
                    onIncrement={() => cart.addToCart(product)}
                    onDecrement={() => cart.updateQuantity(product.id, cart.getQuantity(product.id) - 1)}
                    onClick={() => navigate(`/product?id=${product.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Packaging */}
          {packaging.length > 0 && (
            <section className="px-4 py-3 border-t border-gray-100">
              <h2 className="text-base font-bold text-gray-800 mb-3">Serve Healthy, Better</h2>
              <div className="grid grid-cols-3 gap-3">
                {packaging.map(item => (
                  <div key={item.id} className="rounded-2xl overflow-hidden border border-gray-100">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-24 object-cover" />
                    <div className="p-2 text-center text-xs font-medium text-gray-700">{item.title}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Other Stores */}
          {otherStoreDetails.length > 0 && (
            <section className="px-4 py-3 border-t border-gray-100">
              <h2 className="text-base font-bold text-gray-800 mb-3">Other Stores for You</h2>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {otherStoreDetails.map(store => (
                  <button
                    key={store.id}
                    onClick={() => navigate(`/store?storeId=${store.id}`)}
                    className="shrink-0 w-32 rounded-2xl overflow-hidden border border-gray-100 bg-[#F8FAF4] tap-highlight active:scale-95 transition-transform"
                  >
                    <img src={store.image_url} alt={store.name} className="w-full h-20 object-cover" />
                    <div className="p-2 text-center text-xs font-medium text-gray-700">{store.name}</div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default function StoreScreen(props: StoreScreenProps) {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('storeId');
  const navigate = useNavigate();

  if (!storeId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <p className="text-ink-600">Store ID missing</p>
        <button onClick={() => navigate(-1)} className="text-brand-600 font-bold">Go back</button>
      </div>
    );
  }

  return (
    <StoreProvider storeId={storeId}>
      <StoreScreenContent {...props} />
    </StoreProvider>
  );
}