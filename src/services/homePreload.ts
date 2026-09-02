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

export async function preloadAllImages(urls: string[], maxWaitMs = 5000): Promise<void> {
  const validUrls = Array.from(new Set(urls.filter((u) => typeof u === 'string' && u.trim().length > 0)));
  if (validUrls.length === 0) return;

  await Promise.race([
    Promise.allSettled(validUrls.map((url) => preloadImage(url))),
    new Promise((resolve) => setTimeout(resolve, maxWaitMs)),
  ]);
}

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

      // Extract all image URLs across all home modules
      const allImageUrls: string[] = [];
      safeBanners.forEach((b) => b?.image && allImageUrls.push(b.image));
      safeCategories.forEach((c) => c?.image && allImageUrls.push(c.image));
      safeProducts.forEach((p) => p?.image && allImageUrls.push(p.image));
      fullData.popularProducts.forEach((p) => p?.image && allImageUrls.push(p.image));
      fullData.reorderProducts.forEach((p) => p?.image && allImageUrls.push(p.image));
      fullData.recentlyViewed.forEach((p) => p?.image && allImageUrls.push(p.image));
      fullData.volumeDeals.forEach((p) => p?.image && allImageUrls.push(p.image));
      fullData.newArrivals.forEach((p) => p?.image && allImageUrls.push(p.image));
      fullData.topRated.forEach((p) => p?.image && allImageUrls.push(p.image));
      fullData.limitedStock.forEach((p) => p?.image && allImageUrls.push(p.image));
      if (fullData.brandSpotlight?.products) {
        fullData.brandSpotlight.products.forEach((p) => p?.image && allImageUrls.push(p.image));
      }
      fullData.stores.forEach((s) => s?.logo && allImageUrls.push(s.logo));
      fullData.brands.forEach((b) => b?.logo && allImageUrls.push(b.logo));

      // Decode all assets into memory before resolving
      await preloadAllImages(allImageUrls, 6000);

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

export const preloadHomeScreenDataAndImages = getOrFetchHomeData;
export const getCachedHomeData = getHomeDataSync;
