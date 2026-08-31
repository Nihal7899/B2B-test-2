import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  ChevronDown,
  Search,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Tag,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Category, Product, PromoBanner, Store, TrustedBrand, HomeSection } from '@/types';
import { useCart } from '@/store';
import { PromoCarousel, PromoBannerCard } from '@/components/PromoBanner';
import { PromoAdBanner } from '@/components/PromoAdBanner';
import { TopPromoSlider } from '@/components/TopPromoSlider';
import { ProductCarousel } from '@/components/ProductCard';
import { SectionHeader } from '@/components/SectionHeader';
import { StoreCarousel } from '@/components/StoreCard';
import { BrandCarousel } from '@/components/BrandCard';
import {
  fetchAddresses,
  type DbAddress,
  fetchHomeSections,
  fetchHomeBanners,
  fetchUserReorderProducts,
  fetchRecentlyViewedProducts,
} from '@/services/catalog';
import { getOrBuildSearchDictionary } from '@/services/searchEngine';
import { getHomeDataSync, getOrFetchHomeData } from '@/services/homePreload';

interface HomeScreenProps {
  onCategory: (category: Category) => void;
  onProduct: (product: Product) => void;
  onViewAll: () => void;
  onStoreClick: (store: Store) => void;
  cart?: ReturnType<typeof useCart>;
  onBannerAction?: (banner: PromoBanner) => void;
}

const STATIC_B2B_KEYWORDS = [
  'Refined Sunflower Oil',
  'Mustard Oil 15L Tin',
  'Basmati Rice 25kg',
  'Chakki Fresh Atta',
  'Premium Sugar S-30',
  'Toor Dal Fatka',
  'Moong Dal Dhuli',
  'Pure Cow Ghee',
  'Spices & Masalas',
  'Beverages & Syrups',
  'Amul Taaza Milk',
  'Tata Salt 1kg Pack',
  'Tea Dust Bulk Bag',
  'Dishwash Liquid 5L',
  'Detergent Powder 25kg',
  'Pooja Agarbatti',
  'Biodegradable Carry Bags',
  'Tomato Ketchup Pouch',
  'Ginger Garlic Paste',
  'Instant Noodles Box',
  'Maida All Purpose Flour',
  'Sooji Rawa 50kg',
  'Chana Dal Polish',
  'Urad Dal Whole',
  'Floor Cleaner 5L',
  'Biscuits & Cookies Carton',
  'Cashews & Almonds',
  'Cardamom & Cloves',
  'Red Chilli Powder',
  'Turmeric Powder',
  'Paneer Bulk Block',
  'Edible Oils',
];

export function HomeScreen({
  onCategory: _onCategory,
  onProduct,
  onViewAll,
  onStoreClick,
  onBannerAction,
}: HomeScreenProps) {
  const navigate = useNavigate();
  const cart = useCart();

  // Instant synchronous cache resolution: No skeleton screen on initial render
  const initialCache = useMemo(() => getHomeDataSync(), []);

  const [address, setAddress] = useState<DbAddress | null>(initialCache?.address || null);
  const [displayKeywords, setDisplayKeywords] = useState<string[]>(STATIC_B2B_KEYWORDS);
  const [keywordIndex, setKeywordIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const [sections, setSections] = useState<HomeSection[]>(initialCache?.sections || []);
  const [banners, setBanners] = useState<PromoBanner[]>(initialCache?.banners || []);
  const [categories, setCategories] = useState<Category[]>(initialCache?.categories || []);
  const [products, setProducts] = useState<Product[]>(initialCache?.products || []);
  const [popularProducts, setPopularProducts] = useState<Product[]>(initialCache?.popularProducts || []);
  const [reorderProducts, setReorderProducts] = useState<Product[]>(initialCache?.reorderProducts || []);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(initialCache?.recentlyViewed || []);
  const [volumeDeals, setVolumeDeals] = useState<Product[]>(initialCache?.volumeDeals || []);
  const [newArrivals, setNewArrivals] = useState<Product[]>(initialCache?.newArrivals || []);
  const [topRated, setTopRated] = useState<Product[]>(initialCache?.topRated || []);
  const [limitedStock, setLimitedStock] = useState<Product[]>(initialCache?.limitedStock || []);
  const [brandSpotlight, setBrandSpotlight] = useState<{ brandName: string; products: Product[] } | null>(
    initialCache?.brandSpotlight || null
  );
  const [stores, setStores] = useState<Store[]>(initialCache?.stores || []);
  const [brands, setBrands] = useState<TrustedBrand[]>(initialCache?.brands || []);
  
  // Never show skeleton if cache or preloaded data exists
  const [loading, setLoading] = useState(!initialCache || initialCache.sections.length === 0);

  // Apply full catalog payload smoothly
  const applyCatalogData = useCallback((data: NonNullable<typeof initialCache>) => {
    setSections(data.sections);
    setBanners(data.banners);
    setCategories(data.categories);
    setProducts(data.products);
    setPopularProducts(data.popularProducts);
    setReorderProducts(data.reorderProducts);
    setRecentlyViewed(data.recentlyViewed);
    setVolumeDeals(data.volumeDeals);
    setNewArrivals(data.newArrivals);
    setTopRated(data.topRated);
    setLimitedStock(data.limitedStock);
    setBrandSpotlight(data.brandSpotlight);
    setStores(data.stores);
    setBrands(data.brands);
    if (data.address) setAddress(data.address);
    setLoading(false);
  }, []);

  // 1. Fetch & refresh data quietly without toggling skeleton
  useEffect(() => {
    let active = true;
    void getOrFetchHomeData().then((data) => {
      if (active && data) {
        applyCatalogData(data);
      }
    });
    return () => {
      active = false;
    };
  }, [applyCatalogData]);

  // 2. Fetch addresses safely
  useEffect(() => {
    let active = true;
    void fetchAddresses()
      .then((addrs) => {
        if (active && Array.isArray(addrs) && addrs.length > 0) {
          setAddress(addrs.find((a) => a?.is_default) || addrs[0]);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // 3. Dynamic keywords for search placeholder
  useEffect(() => {
    let active = true;
    void getOrBuildSearchDictionary()
      .then((dict) => {
        if (active && dict && Array.isArray(dict.allKeywords) && dict.allKeywords.length > 0) {
          setDisplayKeywords(dict.allKeywords.slice(0, 35).map((k) => k.word));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // 4. Cycle animated placeholder
  useEffect(() => {
    if (!displayKeywords || displayKeywords.length === 0) return;
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setKeywordIndex((prev) => (prev + 1) % displayKeywords.length);
        setIsFading(false);
      }, 150);
    }, 2800);

    return () => clearInterval(interval);
  }, [displayKeywords]);

  // Background personal sections refresh
  const refreshDynamicSections = useCallback(async () => {
    try {
      const [recent, reorder] = await Promise.all([
        fetchRecentlyViewedProducts().catch(() => []),
        fetchUserReorderProducts(10).catch(() => []),
      ]);
      setRecentlyViewed(Array.isArray(recent) ? recent : []);
      setReorderProducts(Array.isArray(reorder) ? reorder : []);
    } catch (e) {
      console.warn('Failed to refresh dynamic sections:', e);
    }
  }, []);

  // Realtime layout updates
  const refreshLayoutAndBanners = useCallback(async () => {
    try {
      const [secRes, banRes] = await Promise.all([
        fetchHomeSections().catch(() => []),
        fetchHomeBanners().catch(() => []),
      ]);
      setSections(Array.isArray(secRes) ? secRes.filter((s) => s && s.isActive) : []);
      setBanners(Array.isArray(banRes) ? banRes : []);
    } catch (e) {
      console.warn('Failed to refresh layout:', e);
    }
  }, []);

  useEffect(() => {
    let active = true;

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
      if (active) {
        void fetchRecentlyViewedProducts().then((res) => {
          if (active && Array.isArray(res)) setRecentlyViewed(res);
        });
      }
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
  }, [refreshDynamicSections, refreshLayoutAndBanners]);

  const deals = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products
      .map((p) => ({
        ...p,
        calcDiscount: p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0,
      }))
      .filter((p) => p.calcDiscount >= 8)
      .sort((a, b) => b.calcDiscount - a.calcDiscount)
      .slice(0, 10);
  }, [products]);

  const essentials = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const staples = ['oil', 'atta', 'flour', 'rice', 'sugar', 'salt', 'milk', 'spice', 'tea', 'dal'];
    const list = products.filter((p) =>
      staples.some((s) => `${p?.name || ''} ${p?.brand || ''}`.toLowerCase().includes(s))
    );
    return list.length > 0 ? list.slice(0, 10) : products.slice(0, 10);
  }, [products]);

  const topBanner = useMemo(() => (Array.isArray(banners) ? banners.find((b) => b?.position === 'top') || null : null), [banners]);
  const topSliderBanners = useMemo(() => (Array.isArray(banners) ? banners.filter((b) => b?.position === 'top_slider') : []), [banners]);
  const carouselBanners = useMemo(() => (Array.isArray(banners) ? banners.filter((b) => b?.position === 'carousel') : []), [banners]);

  const handleAddToCart = useCallback((p: Product) => cart.addToCart(p), [cart]);
  const handleIncrement = useCallback((p: Product) => cart.addToCart(p), [cart]);
  const handleDecrement = useCallback(
    (p: Product) => cart.updateQuantity(p.id, cart.getQuantity(p.id) - 1),
    [cart]
  );
  const handleGetQuantity = useCallback((id: string) => cart.getQuantity(id), [cart]);

  const locationText = useMemo(() => {
    if (!address) return 'Choose location';
    if (address.label && address.city) return `${address.label} - ${address.city}`;
    return address.city || address.line1;
  }, [address]);

  const getSlotBanners = (slotPosition?: string) => {
    if (!Array.isArray(banners)) return [];
    const target = slotPosition || 'middle_1';
    return banners.filter((b) => {
      if (b?.position === target) return true;
      if (target === 'middle_1' && (b?.position === 'middle' || !b?.position)) return true;
      return false;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-36 safe-bottom">
      <div 
        className="fixed top-0 left-0 right-0 z-50 bg-[#02402c] pointer-events-none" 
        style={{ height: 'env(safe-area-inset-top, 0px)' }} 
      />

      <div className="bg-[#02402c] text-white safe-top">
        <div className="max-w-7xl mx-auto px-4 pt-3 pb-2">
          <button
            onClick={() => navigate('/addresses')}
            type="button"
            className="group flex items-center gap-2 text-left active:opacity-80 transition-opacity"
          >
            <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <MapPin size={15} className="text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-bold tracking-tight text-white truncate max-w-[240px] sm:max-w-xs">
                  {locationText}
                </span>
                <ChevronDown size={14} className="text-white/80 shrink-0" />
              </div>
              <span className="text-[10px] font-medium text-white/60 leading-none">
                {address ? 'Delivery location' : 'Tap to choose address'}
              </span>
            </div>
          </button>
        </div>
      </div>

      <div 
        className="sticky z-40 bg-[#02402c] text-white px-4 pt-2.5 pb-3.5 shadow-md rounded-b-3xl"
        style={{ top: 'env(safe-area-inset-top, 0px)' }} 
      >
        <div className="max-w-7xl mx-auto flex items-center gap-2.5">
          <div
            onClick={() => navigate('/search')}
            className="relative flex-1 h-11 px-3.5 rounded-xl bg-white text-slate-900 flex items-center gap-2.5 cursor-pointer shadow-sm active:scale-[0.99] transition-transform select-none"
          >
            <Search size={18} className="text-slate-400 shrink-0" />
            <div className="text-sm text-slate-400 flex items-center truncate">
              <span>Search for&nbsp;</span>
              <span
                className={`font-semibold text-slate-700 transition-opacity duration-150 ${
                  isFading ? 'opacity-0' : 'opacity-100'
                }`}
              >
                '{displayKeywords[keywordIndex] || 'Groceries'}'
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/cart')}
            type="button"
            className="relative h-11 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center gap-1.5 border border-white/15 transition-all shrink-0 shadow-sm"
            aria-label="View Cart"
          >
            <ShoppingBag size={20} className="text-white" />
            <span className="hidden sm:inline text-xs font-bold">Cart</span>

            {cart.totalItems > 0 && (
              <span className="absolute -top-1 -right-1 z-10 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-emerald-400 text-emerald-950 text-[11px] font-black shadow-md border border-[#02402c]">
                {cart.totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-6 pt-4 pb-16">
        {loading ? (
          <div className="space-y-4 p-4 animate-pulse">
            <div className="h-36 bg-slate-200 rounded-2xl w-full" />
            <div className="grid grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {topBanner && (
              <PromoAdBanner banner={topBanner} onAction={onBannerAction} />
            )}

            {topSliderBanners.length > 0 && (
              <TopPromoSlider banners={topSliderBanners} onAction={onBannerAction} />
            )}

            {carouselBanners.length > 0 && (
              <PromoCarousel banners={carouselBanners} onAction={onBannerAction} />
            )}

            {sections.map((section) => {
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
                                loading="eager"
                                decoding="sync"
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
                      cartVersion={cart.items}
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
                      cartVersion={cart.items}
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
                      cartVersion={cart.items}
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
                      cartVersion={cart.items}
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
                      cartVersion={cart.items}
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
                      cartVersion={cart.items}
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
                      cartVersion={cart.items}
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
                      cartVersion={cart.items}
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
                      cartVersion={cart.items}
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
                      cartVersion={cart.items}
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
                        <div className="px-3">
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
            })}
          </>
        )}
      </div>
    </div>
  );
}
