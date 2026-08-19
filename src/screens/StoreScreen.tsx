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

// Skeleton component
function StoreSkeleton() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="h-64 bg-gray-100 animate-pulse"></div>
      <div className="px-4 py-2">
        <div className="h-10 bg-gray-100 rounded-xl animate-pulse"></div>
      </div>
      <div className="px-4 py-4">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse"></div>
      </div>
    </div>
  );
}

function StoreScreenContent({ goTo }: StoreScreenProps) {
  const { config, loading } = useStore();
  const navigate = useNavigate();
  const cart = useCart();

  // 🔥 Guard: if config is missing, show skeleton
  if (!config) return <StoreSkeleton />;

  // 🔥 Safe destructuring with defaults for all fields
  const {
    header = { title: 'Store', subtitle: '', cartBadgeCount: 0 },
    hero = { enabled: false, imageUrl: '', overlayColor: '#000000', overlayOpacity: 50, tagline: '', ctaText: '', ctaLink: '' },
    stats = { enabled: false, productsCount: 0, customersCount: 0, years: 0, deliveriesCount: 0 },
    promoStrip = { enabled: false, message: '', ctaText: '', ctaLink: '', backgroundColor: '#10b981', textColor: '#ffffff' },
    features = { enabled: false, items: [] },
    iconGrid = [],
    dietaryNeeds = [],
    promoBanner = { badge: '', title: '', subtitle: '', backgroundTheme: 'bg-gray-100', floatingProductImages: [] },
    categories = [],
    packaging = [],
    otherStores = [],
    theme = { primaryColor: '#10b981', secondaryColor: '#059669', textColor: '#1f2937', borderColor: '#e5e7eb', buttonStyle: 'brand', cardRadius: 'xl', shadowIntensity: 'md' },
  } = config;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [products, setProducts] = useState<AppProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [otherStoreDetails, setOtherStoreDetails] = useState<Store[]>([]);

  // Memoized
  const allProductIds = useMemo(() => {
    const ids: string[] = [];
    categories.forEach(cat => {
      cat.productIds.forEach(id => {
        if (!ids.includes(id)) ids.push(id);
      });
    });
    return ids;
  }, [categories]);

  const categoryMap = useMemo(() => {
    const map: Record<string, { title: string; productIds: string[] }> = {};
    categories.forEach(c => { map[c.id] = { title: c.title, productIds: c.productIds }; });
    return map;
  }, [categories]);

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
    if (selectedCategoryId) {
      const category = categoryMap[selectedCategoryId];
      if (category) {
        result = result.filter(p => category.productIds.includes(p.id));
      }
    }
    return result;
  }, [products, searchQuery, selectedCategoryId, categoryMap]);

  // Effects
  useEffect(() => {
    if (allProductIds.length === 0) {
      setProducts([]);
      setProductsLoading(false);
      return;
    }
    setProductsLoading(true);
    fetchProductsByIds(allProductIds)
      .then(data => {
        setProducts(data);
      })
      .catch(console.error)
      .finally(() => setProductsLoading(false));
  }, [allProductIds]);

  useEffect(() => {
    if (otherStores.length === 0) return;
    const storeIds = otherStores.map(s => s.storeId);
    fetchStores().then(allStores => {
      const filtered = allStores.filter(s => storeIds.includes(s.id));
      setOtherStoreDetails(filtered);
    });
  }, [otherStores]);

  // Handlers
  const handleIconClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSearchQuery('');
  };

  const handleDietaryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSearchQuery('');
  };

  const clearFilter = () => {
    setSelectedCategoryId(null);
    setSearchQuery('');
  };

  const hasActiveFilter = !!(selectedCategoryId || searchQuery.trim());

  // Theme classes
  const radiusMap = {
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };
  const shadowMap = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg',
  };
  const cardRadius = radiusMap[theme?.cardRadius || 'xl'];
  const cardShadow = shadowMap[theme?.shadowIntensity || 'md'];

  if (loading) return <StoreSkeleton />;
  if (productsLoading) return <StoreSkeleton />;

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* ===== HERO BANNER ===== */}
      {hero.enabled && hero.imageUrl && (
        <div className="relative h-[220px] md:h-[280px] overflow-hidden">
          <img src={hero.imageUrl} alt={header.title} className="h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: hero.overlayColor || '#000000',
              opacity: (hero.overlayOpacity || 50) / 100,
            }}
          />
          <div className="absolute inset-0 flex flex-col items-start justify-center px-6 text-white">
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight drop-shadow-lg">
              {header.title}
            </h2>
            {hero.tagline && (
              <p className="text-sm md:text-base opacity-90 mt-1 max-w-md drop-shadow">
                {hero.tagline}
              </p>
            )}
            {hero.ctaText && hero.ctaLink && (
              <button
                onClick={() => navigate(hero.ctaLink)}
                className="mt-4 px-6 py-2.5 rounded-xl bg-white text-gray-900 font-bold text-sm shadow-lg hover:bg-gray-100 transition"
              >
                {hero.ctaText}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== PROMO STRIP ===== */}
      {promoStrip.enabled && promoStrip.message && (
        <div
          className="py-3 px-4 text-center text-sm font-medium flex items-center justify-center gap-3 flex-wrap"
          style={{ backgroundColor: promoStrip.backgroundColor || '#10b981', color: promoStrip.textColor || '#ffffff' }}
        >
          <span>{promoStrip.message}</span>
          {promoStrip.ctaText && promoStrip.ctaLink && (
            <button
              onClick={() => navigate(promoStrip.ctaLink)}
              className="bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-xs font-bold"
            >
              {promoStrip.ctaText}
            </button>
          )}
        </div>
      )}

      {/* ===== STATS BAR ===== */}
      {stats.enabled && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 py-4 bg-gray-50 border-b">
          {stats.productsCount > 0 && (
            <div className="text-center">
              <p className="text-xl font-extrabold" style={{ color: theme?.primaryColor || '#10b981' }}>
                {stats.productsCount}+
              </p>
              <p className="text-xs text-gray-500">Products</p>
            </div>
          )}
          {stats.customersCount > 0 && (
            <div className="text-center">
              <p className="text-xl font-extrabold" style={{ color: theme?.primaryColor || '#10b981' }}>
                {stats.customersCount}+
              </p>
              <p className="text-xs text-gray-500">Happy Customers</p>
            </div>
          )}
          {stats.years > 0 && (
            <div className="text-center">
              <p className="text-xl font-extrabold" style={{ color: theme?.primaryColor || '#10b981' }}>
                {stats.years}
              </p>
              <p className="text-xs text-gray-500">Years of Trust</p>
            </div>
          )}
          {stats.deliveriesCount > 0 && (
            <div className="text-center">
              <p className="text-xl font-extrabold" style={{ color: theme?.primaryColor || '#10b981' }}>
                {stats.deliveriesCount}+
              </p>
              <p className="text-xs text-gray-500">Deliveries</p>
            </div>
          )}
        </div>
      )}

      {/* ===== FEATURES ===== */}
      {features.enabled && features.items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 py-4 border-b">
          {features.items.map((item) => (
            <div key={item.id} className="flex flex-col items-center text-center">
              <div className="text-3xl">{item.icon}</div>
              <h4 className="text-sm font-semibold mt-1" style={{ color: theme?.textColor || '#1f2937' }}>
                {item.title}
              </h4>
              <p className="text-[10px] text-gray-500 mt-0.5">{item.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* ===== HEADER WITH BACK & CART ===== */}
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
      {selectedCategoryId && (
        <div className="px-4 pb-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {categoryMap[selectedCategoryId]?.title || 'Category'}
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
                theme={{
                  primaryColor: theme?.primaryColor || '#10b981',
                  secondaryColor: theme?.secondaryColor || '#059669',
                  textColor: theme?.textColor || '#1f2937',
                  borderColor: theme?.borderColor || '#e5e7eb',
                  buttonStyle: theme?.buttonStyle || 'brand',
                  cardRadius: theme?.cardRadius || 'xl',
                  shadowIntensity: theme?.shadowIntensity || 'md',
                }}
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

          {/* Promo Banner (existing) */}
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
                      theme={{
                        primaryColor: theme?.primaryColor || '#10b981',
                        secondaryColor: theme?.secondaryColor || '#059669',
                        textColor: theme?.textColor || '#1f2937',
                        borderColor: theme?.borderColor || '#e5e7eb',
                        buttonStyle: theme?.buttonStyle || 'brand',
                        cardRadius: theme?.cardRadius || 'xl',
                        shadowIntensity: theme?.shadowIntensity || 'md',
                      }}
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
                    theme={{
                      primaryColor: theme?.primaryColor || '#10b981',
                      secondaryColor: theme?.secondaryColor || '#059669',
                      textColor: theme?.textColor || '#1f2937',
                      borderColor: theme?.borderColor || '#e5e7eb',
                      buttonStyle: theme?.buttonStyle || 'brand',
                      cardRadius: theme?.cardRadius || 'xl',
                      shadowIntensity: theme?.shadowIntensity || 'md',
                    }}
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