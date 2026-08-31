import {
  fetchAddresses,
  type DbAddress,
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
import type { Category, Product, PromoBanner, Store, TrustedBrand, HomeSection } from '@/types';

export interface PreloadedHomeData {
  address: DbAddress | null;
  sections: HomeSection[];
  banners: PromoBanner[];
  categories: Category[];
  products: Product[];
  popularProducts: Product[];
  reorderProducts: Product[];
  recentlyViewed: Product[];
  volumeDeals: Product[];
  newArrivals: Product[];
  topRated: Product[];
  limitedStock: Product[];
  brandSpotlight: { brandName: string; products: Product[] } | null;
  stores: Store[];
  brands: TrustedBrand[];
}

let memoryHomeData: PreloadedHomeData | null = null;
let inFlightPromise: Promise<PreloadedHomeData> | null = null;

// Synchronously read from memory or persistent session storage on boot
export function getHomeDataSync(): PreloadedHomeData | null {
  if (memoryHomeData) return memoryHomeData;
  try {
    const raw = sessionStorage.getItem('cafkart_home_cache');
    if (raw) {
      memoryHomeData = JSON.parse(raw);
      return memoryHomeData;
    }
  } catch {}
  return null;
}

export function preloadImage(url: string): Promise<void> {
  if (!url || typeof url !== 'string' || !url.trim()) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    if (img.complete) {
      if ('decode' in img) {
        img.decode().then(resolve).catch(resolve);
      } else {
        resolve();
      }
    } else {
      img.onload = () => {
        if ('decode' in img) {
          img.decode().then(resolve).catch(resolve);
        } else {
          resolve();
        }
      };
      img.onerror = () => resolve();
    }
  });
}

export async function preloadImages(urls: string[], timeoutMs = 800): Promise<void> {
  if (!Array.isArray(urls)) return;
  const validUrls = Array.from(new Set(urls.filter((u) => typeof u === 'string' && u.trim().length > 0))).slice(0, 16);
  if (validUrls.length === 0) return;

  await Promise.race([
    Promise.all(validUrls.map(preloadImage)),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

// Alias for critical preloads
export const preloadCriticalImages = preloadImages;

/**
 * Single deduplicated fetch function shared across App, Auth, and Home
 */
export async function getOrFetchHomeData(): Promise<PreloadedHomeData> {
  if (inFlightPromise) return inFlightPromise;

  inFlightPromise = (async () => {
    try {
      const [
        addrs,
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
        fetchAddresses().catch(() => [] as DbAddress[]),
        fetchHomeSections().catch(() => [] as HomeSection[]),
        fetchHomeBanners().catch(() => [] as PromoBanner[]),
        fetchCategories().catch(() => ({ categories: [] as Category[] })),
        fetchProducts().catch(() => ({ products: [] as Product[] })),
        fetchPopularProducts(12).catch(() => [] as Product[]),
        fetchUserReorderProducts(10).catch(() => [] as Product[]),
        fetchRecentlyViewedProducts().catch(() => [] as Product[]),
        fetchVolumeDealsProducts(10).catch(() => [] as Product[]),
        fetchNewArrivalsProducts(10).catch(() => [] as Product[]),
        fetchTopRatedProducts(10).catch(() => [] as Product[]),
        fetchLimitedStockProducts(10).catch(() => [] as Product[]),
        fetchBrandSpotlight().catch(() => null),
        fetchStores().catch(() => [] as Store[]),
        fetchTrustedBrands().catch(() => [] as TrustedBrand[]),
      ]);

      const safeSections = Array.isArray(secRes) ? secRes.filter((s) => s && s.isActive) : [];
      const safeBanners = Array.isArray(banRes) ? banRes : [];
      const safeCategories = Array.isArray(catRes?.categories)
        ? catRes.categories
        : Array.isArray(catRes)
        ? catRes
        : [];
      const safeProducts = Array.isArray(prodRes?.products)
        ? prodRes.products
        : Array.isArray(prodRes)
        ? prodRes
        : [];

      // Warm up only above-the-fold critical banner and category images
      const criticalImages: string[] = [
        ...safeBanners.slice(0, 3).map((b) => b?.image).filter((img): img is string => Boolean(img)),
        ...safeCategories.slice(0, 8).map((c) => c?.image).filter((img): img is string => Boolean(img)),
      ];
      await preloadImages(criticalImages, 500);

      const addressList = Array.isArray(addrs) ? addrs : [];
      const defaultAddr = addressList.find((a) => a?.is_default) || addressList[0] || null;

      const fullData: PreloadedHomeData = {
        address: defaultAddr,
        sections: safeSections,
        banners: safeBanners,
        categories: safeCategories,
        products: safeProducts,
        popularProducts: Array.isArray(popRes) ? popRes : [],
        reorderProducts: Array.isArray(reorderRes) ? reorderRes : [],
        recentlyViewed: Array.isArray(recentRes) ? recentRes : [],
        volumeDeals: Array.isArray(volumeRes) ? volumeRes : [],
        newArrivals: Array.isArray(newArrRes) ? newArrRes : [],
        topRated: Array.isArray(topRatedRes) ? topRatedRes : [],
        limitedStock: Array.isArray(limitedRes) ? limitedRes : [],
        brandSpotlight: spotlightRes || null,
        stores: Array.isArray(storeRes) ? storeRes : [],
        brands: Array.isArray(brandRes) ? brandRes : [],
      };

      memoryHomeData = fullData;
      try {
        sessionStorage.setItem('cafkart_home_cache', JSON.stringify(fullData));
      } catch {}

      return fullData;
    } catch (e) {
      console.warn('Home fetch warning:', e);
      return (
        memoryHomeData || {
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
        }
      );
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}

// Backward-compatible alias exports
export const preloadHomeScreenDataAndImages = getOrFetchHomeData;
export const getCachedHomeData = getHomeDataSync;
