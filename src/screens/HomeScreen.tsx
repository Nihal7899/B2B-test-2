import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Search,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Tag,
  RotateCcw,
  ChevronRight,
  X
} from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';

import type { Category, Product, PromoBanner, Store, TrustedBrand, HomeSection, DbAddress } from '@/types';
import { useCart } from '@/store';
import { PromoCarousel, PromoBannerCard } from '@/components/PromoBanner';
import { PromoAdBanner } from '@/components/PromoAdBanner';
import { TopPromoSlider } from '@/components/TopPromoSlider';
import { ProductCarousel } from '@/components/ProductCard';
import { SectionHeader } from '@/components/SectionHeader';
import { StoreCarousel } from '@/components/StoreCard';
import { BrandCarousel } from '@/components/BrandCard';
import { ModernPopupBanner } from '@/components/ModernPopupBanner';
import { CachedImage } from '@/components/CachedImage';
import { NavigationBar } from '@capawesome/capacitor-navigation-bar';
import { HomeIndicator } from '@capawesome/capacitor-home-indicator';

import {
  fetchHomeSections,
  fetchHomeBanners,
  fetchUserReorderProducts,
  fetchRecentlyViewedProducts,
  fetchCategories,
  fetchProducts,
  fetchStores,
  fetchTrustedBrands,
  fetchWishlist,    // Added
  toggleWishlist    // Added
} from '@/services/catalog';
import { getOrBuildSearchDictionary } from '@/services/searchEngine';
import { getHomeDataSync, updateHomeDataCache, type PreloadedHomeData } from '@/services/homePreload';
import { startContinuousLocationWatch } from '@/services/location';

interface HomeScreenProps {
  onCategory: (category: Category) => void;
  onProduct: (product: Product) => void;
  onViewAll: () => void;
  onStoreClick: (store: Store) => void;
  onBannerAction?: (banner: PromoBanner) => void;
}

const STATIC_B2B_KEYWORDS = [
  'Refined Sunflower Oil',
  'Mustard Oil 15L Tin',
  'Basmati Rice 25kg',
  'Chakki Fresh Atta',
  'Premium Sugar S-30',
  'Toor Dal Fatka',
  'Pure Cow Ghee',
  'Amul Taaza Milk',
  'Tata Salt 1kg Pack',
  'Tea Dust Bulk Bag',
];

// --- Custom Premium SVGs ---
const StandardModeIcon = ({ active }: { active: boolean }) => {
  const color = active ? "#02402c" : "#ffffff";
  return (
    <svg width="24" height="22" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <rect x="4" y="7" width="20" height="14" rx="3" stroke={color} strokeWidth="2" />
      <path d="M4 12h20 M12 12l2 2.5 2-2.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const ExpressModeIcon = ({ active }: { active: boolean }) => {
  const color = active ? "#02402c" : "#ffffff";
  const cargoFill = active ? "#02402c" : "transparent";
  const lightningColor = "#fde047"; 
  
  return (
    <svg width="32" height="22" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 14h4 M3 10h3 M4 18h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path 
        d="M 11 18 V 6.5 A 2.5 2.5 0 0 1 13.5 4 H 20.5 A 2.5 2.5 0 0 1 23 6.5 V 18 H 18 A 3 3 0 0 0 12 18 H 11 Z" 
        fill={cargoFill} 
        stroke={color} 
        strokeWidth="2" 
        strokeLinejoin="round" 
      />
      <path d="M17 7l-2 5h2.5l-1 4 3-5h-2.5l1.5-4h-2z" fill={lightningColor} />
      <path 
        d="M 23 11 H 27 L 30.5 14.5 V 18 H 29 A 3 3 0 0 0 23 18 Z" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinejoin="round" 
      />
      <path d="M23 11h2.5l2 2.5v1.5h-4.5v-4z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="15" cy="18" r="2.5" fill={active ? "#ffffff" : "transparent"} stroke={color} strokeWidth="2" />
      <circle cx="26" cy="18" r="2.5" fill={active ? "#ffffff" : "transparent"} stroke={color} strokeWidth="2" />
    </svg>
  );
};

const SolidMapPin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-white">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 22C12 22 20 14.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 14.4183 12 22 12 22ZM12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" />
  </svg>
);
// -----------------------------

const HomeSearchBar = memo(function HomeSearchBar({ onSearchClick }: { onSearchClick: () => void }) {
  const [displayKeywords, setDisplayKeywords] = useState<string[]>(STATIC_B2B_KEYWORDS);
  const [keywordIndex, setKeywordIndex] = useState(0);

  useEffect(() => {
    let active = true;
    void getOrBuildSearchDictionary()
      .then((dict) => {
        if (active && dict?.allKeywords?.length) {
          setDisplayKeywords(dict.allKeywords.slice(0, 30).map((k) => k.word));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!displayKeywords || displayKeywords.length === 0) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setKeywordIndex((prev) => (prev + 1) % displayKeywords.length);
      }
    }, 3200);

    return () => clearInterval(interval);
  }, [displayKeywords]);

  return (
    <div
      onClick={onSearchClick}
      className="relative flex-1 h-11 px-3.5 rounded-xl bg-white text-slate-900 flex items-center gap-2.5 cursor-pointer shadow-sm select-none"
    >
      <Search size={18} className="text-slate-400 shrink-0" />
      <div className="text-sm text-slate-400 flex items-center truncate">
        <span>Search for&nbsp;</span>
        <span className="font-semibold text-slate-700">
          '{displayKeywords[keywordIndex] || 'Groceries'}'
        </span>
      </div>
    </div>
  );
});

export function HomeScreen({
  onCategory: _onCategory,
  onProduct,
  onViewAll,
  onStoreClick,
  onBannerAction,
}: HomeScreenProps) {
  const navigate = useNavigate();
  const cart = useCart();

  // --- Real Backend Wishlist Sync ---
  const [wishlist, setWishlist] = useState<string[]>([]);

  const loadWishlist = useCallback(async () => {
    try {
      const wl = await fetchWishlist();
      setWishlist(wl || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    void loadWishlist();
    const handleWishlistChange = () => void loadWishlist();
    window.addEventListener('wishlist-updated', handleWishlistChange);
    window.addEventListener('focus', handleWishlistChange);
    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistChange);
      window.removeEventListener('focus', handleWishlistChange);
    };
  }, [loadWishlist]);

  const handleWishlistToggle = useCallback(async (productId: string) => {
    const isWishlisted = wishlist.includes(productId);
    const nextState = !isWishlisted;
    
    // Optimistic UI update
    setWishlist((prev) => 
      isWishlisted ? prev.filter((id) => id !== productId) : [...prev, productId]
    );

    try {
      await toggleWishlist(productId, isWishlisted);
      window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: { productId, wishlisted: nextState } }));
    } catch (err) {
      // Revert if API fails
      void loadWishlist();
    }
  }, [wishlist, loadWishlist]);
  // ----------------------------------

  const initialCache = useMemo(() => {
    return (
      getHomeDataSync() ||
      ({
        address: null,
        sections: [],
        banners: [],
        categories: [],
        products: [],
        popularProducts: [],
        reorderProducts: [],
        recentlyViewed: [],
        volumeDeals: [],
        newArrivals: [],
        topRated: [],
        limitedStock: [],
        brandSpotlight: null,
        stores: [],
        brands: [],
      } as PreloadedHomeData)
    );
  }, []);

  const [sections, setSections] = useState<HomeSection[]>(initialCache.sections);
  const [banners, setBanners] = useState<PromoBanner[]>(initialCache.banners);
  const [categories, setCategories] = useState<Category[]>(initialCache.categories);
  const [products, setProducts] = useState<Product[]>(initialCache.products);
  const [stores, setStores] = useState<Store[]>(initialCache.stores);
  const [brands, setBrands] = useState<TrustedBrand[]>(initialCache.brands);

  const [popularProducts, setPopularProducts] = useState<Product[]>(initialCache.popularProducts);
  const [reorderProducts, setReorderProducts] = useState<Product[]>(initialCache.reorderProducts);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(initialCache.recentlyViewed);
  const [volumeDeals, setVolumeDeals] = useState<Product[]>(initialCache.volumeDeals);
  const [newArrivals, setNewArrivals] = useState<Product[]>(initialCache.newArrivals);
  const [topRated, setTopRated] = useState<Product[]>(initialCache.topRated);
  const [limitedStock, setLimitedStock] = useState<Product[]>(initialCache.limitedStock);
  const [brandSpotlight, setBrandSpotlight] = useState(initialCache.brandSpotlight);

  const [address] = useState<DbAddress | null>(initialCache.address);
  const [showPopup, setShowPopup] = useState(() => !sessionStorage.getItem('hasSeenBottomPopup'));

  const [deliveryMode, setDeliveryMode] = useState<'standard' | 'express'>('standard');

  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locationCheckComplete, setLocationCheckComplete] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchProfilePreference = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && active) {
          const { data } = await supabase
            .from('profiles')
            .select('delivery_type')
            .eq('id', user.id)
            .single();
            
          if (data?.delivery_type) {
            setDeliveryMode(data.delivery_type as 'standard' | 'express');
          }
        }
      } catch (e) {
        console.warn('Failed to load delivery preference:', e);
      }
    };
    void fetchProfilePreference();
    
    return () => {
      active = false;
    };
  }, []);

  const handleDeliveryModeToggle = useCallback(async (mode: 'standard' | 'express') => {
    setDeliveryMode(mode);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ delivery_type: mode })
          .eq('id', user.id);
      }
    } catch (e) {
      console.warn('Failed to update delivery preference:', e);
    }
  }, []);

  const bottomPopupBanner = useMemo(() => {
    return Array.isArray(banners) ? banners.find((b) => b?.position === 'bottom_popup') : null;
  }, [banners]);

  const dismissPopup = useCallback(() => {
    setShowPopup(false);
    sessionStorage.setItem('hasSeenBottomPopup', 'true');
  }, []);

  useEffect(() => {
    let active = true;

    const checkLocationImmediately = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const perm = await Geolocation.checkPermissions();
          if (perm.location === 'granted' || perm.coarseLocation === 'granted') {
            void startContinuousLocationWatch();
            if (active) {
              setShowLocationPrompt(false);
              setLocationCheckComplete(true);
            }
          } else {
            if (active) {
              setShowLocationPrompt(true);
              setLocationCheckComplete(true);
            }
          }
        } catch {
          if (active) {
            setShowLocationPrompt(true);
            setLocationCheckComplete(true);
          }
        }
      } else {
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const res = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
            if (res.state === 'granted') {
              void startContinuousLocationWatch();
              if (active) {
                setShowLocationPrompt(false);
                setLocationCheckComplete(true);
              }
            } else {
              if (active) {
                setShowLocationPrompt(true);
                setLocationCheckComplete(true);
              }
            }
          } catch {
            if (active) {
              setShowLocationPrompt(true);
              setLocationCheckComplete(true);
            }
          }
        } else {
          if (active) {
            setShowLocationPrompt(true);
            setLocationCheckComplete(true);
          }
        }
      }
    };

    void checkLocationImmediately();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const restoreSystemNav = async () => {
      try {
        if (Capacitor.getPlatform() === 'android') await NavigationBar.show();
        if (Capacitor.getPlatform() === 'ios') await HomeIndicator.show();
      } catch (e) {
        console.warn(e);
      }
    };

    if (locationCheckComplete) {
      const willShowPopup = bottomPopupBanner && showPopup && !showLocationPrompt;
      if (!willShowPopup) {
        restoreSystemNav();
      }
    }
  }, [locationCheckComplete, bottomPopupBanner, showPopup, showLocationPrompt]);
  
  const handleAllowLocation = async () => {
    setShowLocationPrompt(false);

    if (Capacitor.isNativePlatform()) {
      try {
        const perm = await Geolocation.requestPermissions();
        if (perm.location === 'granted' || perm.coarseLocation === 'granted') {
          void startContinuousLocationWatch();
        }
      } catch (e) {
        console.warn(e);
      }
    } else {
      void startContinuousLocationWatch();
    }
  };

  const handleDismissLocation = () => {
    setShowLocationPrompt(false);
  };

  const refreshDynamicSections = useCallback(async () => {
    try {
      const [recent, reorder] = await Promise.all([
        fetchRecentlyViewedProducts().catch(() => []),
        fetchUserReorderProducts(10).catch(() => []),
      ]);
      if (Array.isArray(recent)) setRecentlyViewed(recent);
      if (Array.isArray(reorder)) setReorderProducts(reorder);

      updateHomeDataCache({
        recentlyViewed: Array.isArray(recent) ? recent : undefined,
        reorderProducts: Array.isArray(reorder) ? reorder : undefined,
      });
    } catch (e) {
      console.warn('Failed to refresh dynamic sections:', e);
    }
  }, []);

  const refreshLayoutAndBanners = useCallback(async () => {
    try {
      const [secRes, banRes] = await Promise.all([
        fetchHomeSections().catch(() => []),
        fetchHomeBanners().catch(() => []),
      ]);

      const newSections = Array.isArray(secRes) ? secRes.filter((s) => s && s.isActive) : undefined;
      const newBanners = Array.isArray(banRes) ? banRes : undefined;

      if (newSections) setSections(newSections);
      if (newBanners) setBanners(newBanners);

      updateHomeDataCache({
        sections: newSections,
        banners: newBanners
      });
    } catch (e) {
      console.warn('Failed to refresh layout:', e);
    }
  }, []);

  const refreshCatalogData = useCallback(async () => {
    try {
      const [catRes, prodRes, storeRes, brandRes] = await Promise.all([
        fetchCategories().catch(() => ({ categories: [] as Category[] })),
        fetchProducts().catch(() => ({ products: [] as Product[] })),
        fetchStores().catch(() => [] as Store[]),
        fetchTrustedBrands().catch(() => [] as TrustedBrand[]),
      ]);

      if (catRes.categories?.length) setCategories(catRes.categories);
      if (prodRes.products?.length) setProducts(prodRes.products);
      if (storeRes?.length) setStores(storeRes);
      if (brandRes?.length) setBrands(brandRes);

      updateHomeDataCache({
        categories: catRes.categories?.length ? catRes.categories : undefined,
        products: prodRes.products?.length ? prodRes.products : undefined,
        stores: storeRes?.length ? storeRes : undefined,
        brands: brandRes?.length ? brandRes : undefined,
      });
    } catch (e) {
      console.warn('Failed to refresh core catalog data:', e);
    }
  }, []);

  useEffect(() => {
    if (!products || products.length === 0) return;

    const productMap = new Map(products.map(p => [p.id, p]));

    const syncList = (list: Product[]) => {
      if (!list || !Array.isArray(list)) return list;
      let changed = false;

      const updated = list.map(p => {
        const fresh = productMap.get(p.id);
        if (fresh && (fresh.price !== p.price || fresh.mrp !== p.mrp || fresh.inStock !== p.inStock)) {
          changed = true;
          return fresh;
        }
        return p;
      });

      return changed ? updated : list;
    };

    setPopularProducts(prev => syncList(prev));
    setVolumeDeals(prev => syncList(prev));
    setNewArrivals(prev => syncList(prev));
    setTopRated(prev => syncList(prev));
    setLimitedStock(prev => syncList(prev));
    setRecentlyViewed(prev => syncList(prev));
    setReorderProducts(prev => syncList(prev));

    setBrandSpotlight(prev => {
      if (!prev) return prev;
      const synced = syncList(prev.products);
      return synced !== prev.products ? { ...prev, products: synced } : prev;
    });
  }, [products]);

  useEffect(() => {
    let active = true;

    const handleRecentlyViewedUpdate = () => {
      if (active) {
        void fetchRecentlyViewedProducts().then((res) => {
          if (active && Array.isArray(res)) {
            setRecentlyViewed(res);
            updateHomeDataCache({ recentlyViewed: res });
          }
        });
      }
    };
    window.addEventListener('recently-viewed-updated', handleRecentlyViewedUpdate);

    const handleKeepAliveFocus = (e: Event) => {
      const customEvent = e as CustomEvent<{ key?: string }>;
      if (active && (customEvent.detail?.key === '/' || customEvent.detail?.key === 'home' || !customEvent.detail?.key)) {
        void refreshDynamicSections();
        void refreshLayoutAndBanners();
        void refreshCatalogData();
      }
    };
    window.addEventListener('keepalive:activated', handleKeepAliveFocus);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && active) {
        void refreshDynamicSections();
        void refreshLayoutAndBanners();
        void refreshCatalogData();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      window.removeEventListener('recently-viewed-updated', handleRecentlyViewedUpdate);
      window.removeEventListener('keepalive:activated', handleKeepAliveFocus);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshDynamicSections, refreshLayoutAndBanners, refreshCatalogData]);

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
    if (!address) return 'Baithu riha periera moola hosangadi,...'; 
    return address.line1 || address.city || 'Choose location';
  }, [address]);

  const getSlotBanners = useCallback(
    (slotPosition?: string) => {
      if (!Array.isArray(banners)) return [];
      const target = slotPosition || 'middle_1';
      return banners.filter((b) => {
        if (b?.position === target) return true;
        if (target === 'middle_1' && (b?.position === 'middle' || !b?.position)) return true;
        return false;
      });
    },
    [banners]
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-36 safe-bottom">
      <div 
        className="fixed top-0 left-0 right-0 z-50 bg-[#02402c] pointer-events-none" 
        style={{ height: 'env(safe-area-inset-top, 0px)' }} 
      />

      {/* --- REVISED HEADER COMPONENT --- */}
      <div className="bg-[#02402c] safe-top border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 pt-3 pb-3 flex items-center gap-3">
          
          {/* Location Button */}
          <button
            onClick={() => navigate('/addresses')}
            className="flex-1 flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-3.5 py-2.5 overflow-hidden transition-colors"
          >
            <div className="shrink-0 flex items-center justify-center">
              <SolidMapPin />
            </div>
            <span className="text-[13px] font-medium text-white truncate text-left tracking-wide">
              {locationText}
            </span>
          </button>

          {/* Delivery Mode Toggle */}
          <button
            onClick={() => handleDeliveryModeToggle(deliveryMode === 'standard' ? 'express' : 'standard')}
            className="shrink-0 flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 shadow-sm transition-transform active:scale-95"
          >
            <div className="flex items-center justify-center scale-90 origin-center">
              {deliveryMode === 'standard' ? <StandardModeIcon active={true} /> : <ExpressModeIcon active={true} />}
            </div>
            <span className="text-[13px] font-bold text-[#02402c] tracking-wide">
              {deliveryMode === 'standard' ? 'Standard' : 'Express'}
            </span>
          </button>

        </div>
      </div>
      {/* -------------------------------- */}

      <div 
        className="sticky z-40 bg-[#02402c] text-white px-4 pt-1 pb-4 shadow-md rounded-b-3xl"
        style={{ top: 'env(safe-area-inset-top, 0px)' }} 
      >
        <div className="max-w-7xl mx-auto flex items-center gap-2.5">
          <HomeSearchBar onSearchClick={() => navigate('/search')} />

          <button
            onClick={() => navigate('/cart')}
            type="button"
            className="relative h-11 px-3.5 rounded-xl bg-white/10 text-white flex items-center justify-center gap-1.5 border border-white/15 shrink-0 shadow-sm"
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

      <div className="space-y-6 pt-4 pb-16 transform-gpu">
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
                    {categories.slice(0, 16).map((category) => (
                      <button
                        key={category.id}
                        onClick={() => navigate(`/category?id=${category.id}`)}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div
                          className="relative h-16 w-16 overflow-hidden rounded-2xl p-0.5 shadow-sm ring-1 ring-slate-100"
                          style={{ background: category.gradient || '#10b981' }}
                        >
                          <CachedImage
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
                  getQuantity={handleGetQuantity}
                  onAdd={handleAddToCart}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onProductClick={onProduct}
                  onViewAll={onViewAll}
                  wishlist={wishlist}
                  onWishlistToggle={handleWishlistToggle}
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
                  wishlist={wishlist}
                  onWishlistToggle={handleWishlistToggle}
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
                  wishlist={wishlist}
                  onWishlistToggle={handleWishlistToggle}
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
                  wishlist={wishlist}
                  onWishlistToggle={handleWishlistToggle}
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
                  wishlist={wishlist}
                  onWishlistToggle={handleWishlistToggle}
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
                  wishlist={wishlist}
                  onWishlistToggle={handleWishlistToggle}
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
                  wishlist={wishlist}
                  onWishlistToggle={handleWishlistToggle}
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
                  wishlist={wishlist}
                  onWishlistToggle={handleWishlistToggle}
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
                  wishlist={wishlist}
                  onWishlistToggle={handleWishlistToggle}
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
                  wishlist={wishlist}
                  onWishlistToggle={handleWishlistToggle}
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
      </div>

      {showLocationPrompt && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end pointer-events-none">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity duration-300" 
            onClick={handleDismissLocation}
          />
          <div className="relative w-full bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] pointer-events-auto flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300 pb-6 safe-bottom">
            <div className="flex justify-end p-4">
              <button 
                onClick={handleDismissLocation}
                className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="px-6 pb-4 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <SolidMapPin />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">Enable Location</h2>
              <p className="text-sm text-slate-500 mb-8 max-w-[280px]">
                We need your location to show wholesale deals, accurate stock, and express delivery times in your area.
              </p>
              
              <div className="w-full flex flex-col gap-3">
                <button 
                  onClick={handleAllowLocation}
                  className="w-full h-12 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-transform"
                >
                  Allow Location
                </button>
                <button 
                  onClick={handleDismissLocation}
                  className="w-full h-12 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm active:bg-slate-100 transition-colors"
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {bottomPopupBanner && showPopup && locationCheckComplete && !showLocationPrompt && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end pointer-events-none">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity duration-300" 
            onClick={dismissPopup}
          />
          
          <div className="relative w-full h-[55%] min-h-[380px] max-h-[480px] bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] pointer-events-auto flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300">
            
            <div className="flex justify-end p-3 absolute top-0 right-0 z-50">
              <button 
                onClick={dismissPopup}
                className="h-8 w-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>

            <ModernPopupBanner 
              banner={bottomPopupBanner} 
              className="w-full h-full rounded-none"
              onAction={(banner) => {
                dismissPopup();
                onBannerAction?.(banner);
              }}
              onDismiss={dismissPopup}
            />
          </div>
        </div>
      )}
    </div>
  );
}
