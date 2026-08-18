import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from '@/context/StoreContext';
import { ChevronLeft, Search, ShoppingCart, Plus, Minus, ChevronRight, X } from 'lucide-react';
import { Product as StoreProduct } from '@/types/storeConfig';
import { useCart } from '@/store';

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
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);

  // All products from categories
  const allProducts: StoreProduct[] = useMemo(() => {
    return categories.flatMap(cat => cat.products);
  }, [categories]);

  // Filter logic
  const filteredProducts = useMemo(() => {
    let result = allProducts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subCategory.toLowerCase().includes(q)
      );
    }
    if (selectedFilter) {
      if (selectedFilter.type === 'category') {
        result = result.filter(p => p.category === selectedFilter.value);
      } else if (selectedFilter.type === 'dietary') {
        // For dietary, we also filter by category (or you could use a 'dietary' field if added)
        result = result.filter(p => p.category === selectedFilter.value || p.subCategory === selectedFilter.value);
      }
    }
    return result;
  }, [allProducts, searchQuery, selectedFilter]);

  // Cart helpers
  const getQuantity = (id: string) => cart.getQuantity(id);
  const addToCart = (product: StoreProduct) => {
    const appProduct: any = {
      id: product.id,
      brand: product.category,
      name: product.title,
      packSize: product.packSize,
      mrp: product.originalPrice,
      price: product.price,
      image: product.imageUrl,
      category: product.category,
      moq: 1,
      rating: 0,
      description: '',
      inStock: product.inStock,
    };
    cart.addToCart(appProduct);
  };
  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) cart.removeFromCart(id);
    else cart.updateQuantity(id, qty);
  };

  // Render product card
  const renderProductCard = (product: StoreProduct) => {
    const qty = getQuantity(product.id) || 0;
    const tier = product.tieredPricing[0];
    const tierLabel = tier ? `₹${tier.unitPrice} for ${tier.minQty} ${product.packSize}+` : null;

    return (
      <div key={product.id} className="bg-white rounded-2xl border border-gray-100 p-2 shadow-sm">
        <div onClick={() => setSelectedProduct(product)} className="cursor-pointer">
          <img src={product.imageUrl || 'https://placehold.co/400x400/EEE/999?text=Product'} alt={product.title} className="w-full h-32 object-cover rounded-xl" />
        </div>
        <div className="mt-2">
          <h4 className="text-sm font-bold text-gray-800 line-clamp-2">{product.title}</h4>
          <p className="text-xs text-gray-500">{product.packSize}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-base font-extrabold text-gray-900">₹{product.price}</span>
            <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
          </div>
          {tierLabel && <p className="text-[10px] text-blue-600 font-medium mt-0.5">{tierLabel}</p>}
          <div className="mt-2">
            {qty === 0 ? (
              <button
                onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                className="w-full py-1.5 rounded-lg border border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 transition"
              >
                + ADD
              </button>
            ) : (
              <div className="flex items-center justify-between bg-red-50 rounded-lg px-2 py-1">
                <button onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, qty - 1); }} className="p-1 rounded-full hover:bg-red-100">
                  <Minus size={14} className="text-red-500" />
                </button>
                <span className="text-sm font-bold text-red-700">{qty}</span>
                <button onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, qty + 1); }} className="p-1 rounded-full hover:bg-red-100">
                  <Plus size={14} className="text-red-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Handlers
  const handleIconClick = (title: string) => {
    setSelectedFilter({ type: 'category', value: title });
    setSearchQuery('');
  };

  const handleDietaryClick = (title: string) => {
    setSelectedFilter({ type: 'dietary', value: title });
    setSearchQuery('');
  };

  const clearFilter = () => {
    setSelectedFilter(null);
    setSearchQuery('');
  };

  const hasActiveFilter = !!(selectedFilter || searchQuery.trim());

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
            {filteredProducts.map(renderProductCard)}
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
                    onClick={() => handleIconClick(item.title)}
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
                    onClick={() => handleDietaryClick(item.title)}
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

          {/* Categories */}
          {categories.map((category) => (
            <section key={category.id} className="px-4 py-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-800">{category.title}</h2>
                {category.products.length > 4 && (
                  <button onClick={() => handleIconClick(category.title)} className="text-xs font-semibold text-green-600 flex items-center">
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
              {category.products.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {category.products.slice(0, 4).map(renderProductCard)}
                </div>
              )}
            </section>
          ))}

          {/* All Products section (optional) */}
          {allProducts.length > 0 && (
            <section className="px-4 py-3 border-t border-gray-100">
              <h2 className="text-base font-bold text-gray-800 mb-3">All Products</h2>
              <div className="grid grid-cols-2 gap-3">
                {allProducts.map(renderProductCard)}
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
          {otherStores.length > 0 && (
            <section className="px-4 py-3 border-t border-gray-100">
              <h2 className="text-base font-bold text-gray-800 mb-3">Other Stores for You</h2>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {otherStores.map(store => (
                  <button
                    key={store.id}
                    onClick={() => {
                      if (store.route.startsWith('/')) navigate(store.route);
                      else goTo(store.route);
                    }}
                    className="shrink-0 w-32 rounded-2xl overflow-hidden border border-gray-100 bg-[#F8FAF4] tap-highlight active:scale-95 transition-transform"
                  >
                    <img src={store.imageUrl} alt={store.title} className="w-full h-20 object-cover" />
                    <div className="p-2 text-center text-xs font-medium text-gray-700">{store.title}</div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={() => setSelectedProduct(null)}>
          <div
            className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">{selectedProduct.title}</h2>
              <button onClick={() => setSelectedProduct(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <img
              src={selectedProduct.imageUrl || 'https://placehold.co/400x400/EEE/999?text=Product'}
              alt={selectedProduct.title}
              className="w-full h-56 object-cover rounded-xl mb-4"
            />
            <p className="text-sm text-gray-600">{selectedProduct.category} · {selectedProduct.subCategory}</p>
            <p className="text-xs text-gray-500 mt-1">{selectedProduct.packSize}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl font-extrabold text-green-700">₹{selectedProduct.price}</span>
              <span className="text-sm text-gray-400 line-through">₹{selectedProduct.originalPrice}</span>
            </div>
            {selectedProduct.tieredPricing.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                {selectedProduct.tieredPricing.map(t => (
                  <div key={t.minQty}>₹{t.unitPrice} for {t.minQty}+ units</div>
                ))}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold"
              >
                Add to Cart
              </button>
              <button onClick={() => setSelectedProduct(null)} className="px-4 py-3 rounded-xl border border-gray-300 text-gray-700">
                Close
              </button>
            </div>
          </div>
        </div>
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