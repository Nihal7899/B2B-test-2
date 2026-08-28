import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ShieldCheck, Tag, RotateCcw, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Category, Product, PromoBanner, Store, TrustedBrand, HomeSection } from '@/types';
import type { useCart } from '@/store';
import { PromoCarousel, PromoBannerCard } from '@/components/PromoBanner';
import { PromoAdBanner } from '@/components/PromoAdBanner';
import { ProductCarousel } from '@/components/ProductCard';
import { SectionHeader } from '@/components/SectionHeader';
import { StoreCarousel } from '@/components/StoreCard';
import { BrandCarousel } from '@/components/BrandCard';
import {
  fetchHomeSections,
  fetchHomeBanners,
  fetchCategories,
  fetchProducts,
  fetchPopularProducts,
  fetchUserReorderProducts,
  fetchRecentlyViewedProducts,
  fetchVolumeDealsProducts,
  fetchNewArrivalsProducts,
  fetchTopRatedProducts,
  fetchLimitedStockProducts,
  fetchBrandSpotlight,
  fetchStores,
  fetchTrustedBrands,
} from '@/services/catalog';

interface HomeScreenProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  onCategory: (category: Category) => void;
  onProduct: (product: Product) => void;
  onViewAll: () => void;
  onStoreClick: (store: Store) => void;
  cart: ReturnType<typeof useCart>;
  onBannerAction?: (banner: PromoBanner) => void;
}

export function HomeScreen({
  search = '',
  onProduct,
  onViewAll,
  onStoreClick,
  cart,
  onBannerAction,
}: HomeScreenProps) {
  const navigate = useNavigate();

  const [sections, setSections] = useState<HomeSection[]>([]);
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [reorderProducts, setReorderProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [volumeDeals, setVolumeDeals] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [limitedStock, setLimitedStock] = useState<Product[]>([]);
  const [brandSpotlight, setBrandSpotlight] = useState<{ brandName: string; products: Product[] } | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [brands, setBrands] = useState<TrustedBrand[]>([]);
  const [loading, setLoading] = useState(true);

  // Background updater for dynamic personal sections
  const refreshDynamicSections = useCallback(async () => {
    try {
      const [recent, reorder] = await Promise.all([
        fetchRecentlyViewedProducts(),
        fetchUserReorderProducts(10),
      ]);
      setRecentlyViewed(recent);
      setReorderProducts(reorder);
    } catch (e) {
      console.warn('Failed to refresh dynamic personal sections:', e);
    }
  }, []);

  // Background updater for layout & banners
  const refreshLayoutAndBanners = useCallback(async () => {
    try {
      const [secRes, banRes] = await Promise.all([
        fetchHomeSections(),
        fetchHomeBanners(),
      ]);
      setSections(secRes.filter((s) => s.isActive));
      setBanners(banRes);
    } catch (e) {
      console.warn('Failed to refresh layout:', e);
    }
  }, []);

  const loadAllHomeData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);

    try {
      const [
        secRes,
        banRes,
        catRes,
        prodRes,
        popRes,
        reorderRes,
        recentRes,
        volumeRes,
        newArrRes,
        topRatedRes,
        limitedRes,
        spotlightRes,
        storeRes,
        brandRes,
      ] = await Promise.all([
        fetchHomeSections(),
        fetchHomeBanners(),
        fetchCategories(),
        fetchProducts(),
        fetchPopularProducts(12),
        fetchUserReorderProducts(10),
        fetchRecentlyViewedProducts(),
        fetchVolumeDealsProducts(10),
        fetchNewArrivalsProducts(10),
        fetchTopRatedProducts(10),
        fetchLimitedStockProducts(10),
        fetchBrandSpotlight(),
        fetchStores(),
        fetchTrustedBrands(),
      ]);

      setSections(secRes.filter((s) => s.isActive));
      setBanners(banRes);
      setCategories(catRes.categories || []);
      setProducts(prodRes.products || []);
      setPopularProducts(popRes || []);
      setReorderProducts(reorderRes || []);
      setRecentlyViewed(recentRes || []);
      setVolumeDeals(volumeRes || []);
      setNewArrivals(newArrRes || []);
      setTopRated(topRatedRes || []);
      setLimitedStock(limitedRes || []);
      setBrandSpotlight(spotlightRes);
      setStores(storeRes || []);
      setBrands(brandRes || []);
    } catch (err) {
      console.error('Failed to load home catalog data:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    void loadAllHomeData(true);

    const homeChannel = supabase
      .channel('realtime:home_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'home_sections' }, () => {
        if (active) void refreshLayoutAndBanners();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'home_banners' }, () => {
        if (active) void refreshLayoutAndBanners();
      })
      .subscribe();

    const handleRecentlyViewedUpdate = () => {
      if (active) void fetchRecentlyViewedProducts().then(setRecentlyViewed);
    };
    window.addEventListener('recently-viewed-updated', handleRecentlyViewedUpdate);

    const handleKeepAliveFocus = (e: Event) => {
      const customEvent = e as CustomEvent<{ key?: string }>;
      if (active && (customEvent.detail?.key === '/' || customEvent.detail?.key === 'home' || !customEvent.detail?.key)) {
        void refreshDynamicSections();
        void refreshLayoutAndBanners();
      }
    };
    window.addEventListener('keepalive:activated', handleKeepAliveFocus);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && active) {
        void refreshDynamicSections();
        void refreshLayoutAndBanners();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      window.removeEventListener('recently-viewed-updated', handleRecentlyViewedUpdate);
      window.removeEventListener('keepalive:activated', handleKeepAliveFocus);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      void supabase.removeChannel(homeChannel);
    };
  }, [loadAllHomeData, refreshDynamicSections, refreshLayoutAndBanners]);

  const { filtered, deals, essentials } = useMemo(() => {
    const query = (search || '').trim().toLowerCase();
    const filteredProducts = query
      ? products.filter((p) =>
          `${p.brand || ''} ${p.name || ''} ${p.category || ''}`.toLowerCase().includes(query)
        )
      : products;

    const dealsList = [...filteredProducts]
      .map((p) => ({
        ...p,
        calcDiscount: p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0,
      }))
      .filter((p) => p.calcDiscount >= 8)
      .sort((a, b) => b.calcDiscount - a.calcDiscount)
      .slice(0, 10);

    const staples = ['oil', 'atta', 'flour', 'rice', 'sugar', 'salt', 'milk', 'spice', 'tea', 'dal'];
    const essentialsList = filteredProducts
      .filter((p) => staples.some((s) => `${p.name || ''} ${p.brand || ''}`.toLowerCase().includes(s)))
      .slice(0, 10);

    return {
      filtered: filteredProducts,
      deals: dealsList,
      essentials: essentialsList.length > 0 ? essentialsList : filteredProducts.slice(0, 10),
    };
  }, [search, products]);

  const topBanner = useMemo(() => banners.find((b) => b.position === 'top') || null, [banners]);
  const carouselBanners = useMemo(() => banners.filter((b) => b.position === 'carousel'), [banners]);

  const handleAddToCart = useCallback((p: Product) => cart.addToCart(p), [cart]);
  const handleIncrement = useCallback((p: Product) => cart.addToCart(p), [cart]);
  const handleDecrement = useCallback(
    (p: Product) => cart.updateQuantity(p.id, cart.getQuantity(p.id) - 1),
    [cart]
  );
  const handleGetQuantity = useCallback((id: string) => cart.getQuantity(id), [cart]);

  if (loading) {
    return (
      <div className="space-y-4 p-4 animate-pulse">
        <div className="h-36 bg-slate-200 rounded-2xl w-full" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const query = (search || '').trim();

  const getSlotBanners = (slotPosition?: string) => {
    const target = slotPosition || 'middle_1';
    return banners.filter((b) => {
      if (b.position === target) return true;
      if (target === 'middle_1' && (b.position === 'middle' || !b.position)) return true;
      return false;
    });
  };

  return (
    <div className="space-y-6 pb-6 transform-gpu">
      {!query && topBanner && (
        <PromoAdBanner banner={topBanner} onAction={onBannerAction} />
      )}

      {!query && carouselBanners.length > 0 && (
        <PromoCarousel banners={carouselBanners} onAction={onBannerAction} />
      )}

      {!query ? (
        sections.map((section) => {
          switch (section.sectionType) {
            case 'categories':
              return (
                <section key={section.id} className="px-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-black text-slate-900 tracking-tight">{section.title}</h2>
                      <p className="text-[11px] text-slate-500">{section.subtitle}</p>
                    </div>
                    <button
                      onClick={onViewAll}
                      className="flex items-center text-xs font-bold text-emerald-600"
                    >
                      See all <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {categories.slice(0, 12).map((category) => (
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
              );

            case 'quick_reorder':
              return reorderProducts.length > 0 ? (
                <ProductCarousel
                  key={section.id}
                  title={section.title || 'Buy Again'}
                  products={reorderProducts}
                  getQuantity={handleGetQuantity}
                  onAdd={handleAddToCart}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onProductClick={onProduct}
                  onViewAll={onViewAll}
                />
              ) : null;

            case 'recently_viewed':
              return recentlyViewed.length > 0 ? (
                <ProductCarousel
                  key={section.id}
                  title={section.title || 'Recently Viewed'}
                  products={recentlyViewed}
                  getQuantity={handleGetQuantity}
                  onAdd={handleAddToCart}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onProductClick={onProduct}
                  onViewAll={onViewAll}
                />
              ) : null;

            case 'popular_products':
              return popularProducts.length > 0 ? (
                <ProductCarousel
                  key={section.id}
                  title={section.title || 'Popular Products'}
                  products={popularProducts}
                  getQuantity={handleGetQuantity}
                  onAdd={handleAddToCart}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onProductClick={onProduct}
                  onViewAll={onViewAll}
                />
              ) : null;

            case 'volume_deals':
              return volumeDeals.length > 0 ? (
                <ProductCarousel
                  key={section.id}
                  title={section.title || 'Volume Savings'}
                  products={volumeDeals}
                  getQuantity={handleGetQuantity}
                  onAdd={handleAddToCart}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onProductClick={onProduct}
                  onViewAll={onViewAll}
                />
              ) : null;

            case 'deals':
              return deals.length > 0 ? (
                <ProductCarousel
                  key={section.id}
                  title={section.title || 'Wholesale Deals'}
                  products={deals}
                  getQuantity={handleGetQuantity}
                  onAdd={handleAddToCart}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onProductClick={onProduct}
                  onViewAll={onViewAll}
                />
              ) : null;

            case 'new_arrivals':
              return newArrivals.length > 0 ? (
                <ProductCarousel
                  key={section.id}
                  title={section.title || 'New Arrivals'}
                  products={newArrivals}
                  getQuantity={handleGetQuantity}
                  onAdd={handleAddToCart}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onProductClick={onProduct}
                  onViewAll={onViewAll}
                />
              ) : null;

            case 'top_rated':
              return topRated.length > 0 ? (
                <ProductCarousel
                  key={section.id}
                  title={section.title || 'Top Rated by Businesses'}
                  products={topRated}
                  getQuantity={handleGetQuantity}
                  onAdd={handleAddToCart}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onProductClick={onProduct}
                  onViewAll={onViewAll}
                />
              ) : null;

            case 'limited_stock':
              return limitedStock.length > 0 ? (
                <ProductCarousel
                  key={section.id}
                  title={section.title || 'Fast Selling / Low Stock'}
                  products={limitedStock}
                  getQuantity={handleGetQuantity}
                  onAdd={handleAddToCart}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onProductClick={onProduct}
                  onViewAll={onViewAll}
                />
              ) : null;

            case 'brand_spotlight':
              return brandSpotlight && brandSpotlight.products.length > 0 ? (
                <ProductCarousel
                  key={section.id}
                  title={section.title || `Spotlight: ${brandSpotlight.brandName}`}
                  products={brandSpotlight.products}
                  getQuantity={handleGetQuantity}
                  onAdd={handleAddToCart}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onProductClick={onProduct}
                  onViewAll={onViewAll}
                />
              ) : null;

            case 'essentials':
              return essentials.length > 0 ? (
                <ProductCarousel
                  key={section.id}
                  title={section.title || 'Everyday Essentials'}
                  products={essentials}
                  getQuantity={handleGetQuantity}
                  onAdd={handleAddToCart}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onProductClick={onProduct}
                  onViewAll={onViewAll}
                />
              ) : null;

            case 'banner_slot': {
              const matching = getSlotBanners(section.bannerPosition);
              if (matching.length === 0) return null;
              return (
                <section key={section.id}>
                  {matching.length > 1 ? (
                    <PromoCarousel
                      banners={matching}
                      size={section.bannerSize}
                      onAction={onBannerAction}
                    />
                  ) : (
                    <div className="px-4">
                      <PromoBannerCard
                        banner={matching[0]}
                        size={section.bannerSize}
                        onAction={onBannerAction}
                      />
                    </div>
                  )}
                </section>
              );
            }

            case 'stores':
              return stores.length > 0 ? (
                <div key={section.id}>
                  <SectionHeader title={section.title} subtitle={section.subtitle} accent="bg-purple-600" />
                  <StoreCarousel stores={stores} onStoreClick={onStoreClick} onPrefetch={() => {}} />
                </div>
              ) : null;

            case 'brands':
              return brands.length > 0 ? (
                <div key={section.id}>
                  <SectionHeader title={section.title} subtitle={section.subtitle} accent="bg-blue-600" />
                  <BrandCarousel brands={brands} onBrandClick={(b) => navigate(`/brand?id=${b.id}`)} />
                </div>
              ) : null;

            case 'perks':
              return (
                <section key={section.id} className="px-4">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3.5">
                      <Truck className="text-emerald-600" size={20} />
                      <h3 className="font-bold text-xs text-emerald-900 mt-2">Fast delivery</h3>
                      <p className="text-[10px] text-emerald-700">Same day dispatch</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5">
                      <ShieldCheck className="text-slate-600" size={20} />
                      <h3 className="font-bold text-xs text-slate-800 mt-2">Quality assured</h3>
                      <p className="text-[10px] text-slate-600">Verified brands</p>
                    </div>
                    <div className="rounded-2xl bg-orange-50 border border-orange-100 p-3.5">
                      <Tag className="text-orange-600" size={20} />
                      <h3 className="font-bold text-xs text-orange-900 mt-2">Best prices</h3>
                      <p className="text-[10px] text-orange-700">Wholesale deals</p>
                    </div>
                    <div className="rounded-2xl bg-sky-50 border border-sky-100 p-3.5">
                      <RotateCcw className="text-sky-600" size={20} />
                      <h3 className="font-bold text-xs text-sky-900 mt-2">Easy returns</h3>
                      <p className="text-[10px] text-sky-700">Hassle-free guarantee</p>
                    </div>
                  </div>
                </section>
              );

            default:
              return null;
          }
        })
      ) : (
        <div className="px-4">
          <p className="text-xs text-slate-500 mb-3">
            {filtered.length} products found for <span className="font-bold text-slate-800">“{search}”</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white border rounded-2xl p-3 shadow-sm flex flex-col justify-between">
                <div
                  className="h-28 w-full overflow-hidden rounded-xl bg-slate-50 mb-2 cursor-pointer"
                  onClick={() => onProduct(p)}
                >
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase">{p.brand}</p>
                  <h3 className="text-xs font-bold text-slate-800 line-clamp-2">{p.name}</h3>
                  <p className="text-xs font-black text-slate-900 mt-1">₹{p.price}</p>
                </div>
                <button
                  onClick={() => handleAddToCart(p)}
                  className="mt-2 w-full py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold active:scale-95 transition-transform"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}