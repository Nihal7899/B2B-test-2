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

let cachedHomeData: PreloadedHomeData | null = null;
let preloadPromise: Promise<PreloadedHomeData | null> | null = null;

export function preloadImage(url: string): Promise<void> {
  if (!url || typeof url !== 'string' || !url.trim()) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    if (img.complete) {
      if ('decode' in img) {
        img.decode().then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
    } else {
      img.onload = () => {
        if ('decode' in img) {
          img.decode().then(() => resolve()).catch(() => resolve());
        } else {
          resolve();
        }
      };
      img.onerror = () => resolve();
    }
  });
}

export async function preloadImages(urls: string[], timeoutMs = 2000): Promise<void> {
  if (!Array.isArray(urls)) return;
  const uniqueUrls = Array.from(new Set(urls.filter((u) => typeof u === 'string' && u.trim().length > 0)));
  if (uniqueUrls.length === 0) return;

  const tasks = uniqueUrls.map((url) => preloadImage(url));
  await Promise.race([
    Promise.all(tasks),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

export async function preloadHomeScreenDataAndImages(): Promise<PreloadedHomeData | null> {
  if (cachedHomeData) return cachedHomeData;
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
    try {
      const fetchTask = Promise.all([
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

      const timeoutTask = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
      const results = await Promise.race([fetchTask, timeoutTask]);

      if (!results) return null;

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
      ] = results;

      const categories: Category[] = Array.isArray(catRes?.categories)
        ? catRes.categories
        : Array.isArray(catRes)
        ? catRes
        : [];
      const banners: PromoBanner[] = Array.isArray(banRes) ? banRes : [];
      const sections: HomeSection[] = Array.isArray(secRes) ? secRes.filter((s) => s && s.isActive) : [];
      const products: Product[] = Array.isArray(prodRes?.products)
        ? prodRes.products
        : Array.isArray(prodRes)
        ? prodRes
        : [];

      const criticalImageUrls: string[] = [
        ...banners.map((b) => b?.image).filter((img): img is string => Boolean(img)),
        ...categories.slice(0, 16).map((c) => c?.image).filter((img): img is string => Boolean(img)),
      ];

      await preloadImages(criticalImageUrls, 2000);

      const addressList = Array.isArray(addrs) ? addrs : [];
      const foundAddress = addressList.find((a) => a?.is_default) || addressList[0] || null;

      cachedHomeData = {
        address: foundAddress,
        sections,
        banners,
        categories,
        products,
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

      return cachedHomeData;
    } catch (e) {
      console.warn('Preload warning:', e);
      return null;
    } finally {
      preloadPromise = null;
    }
  })();

  return preloadPromise;
}

export function getCachedHomeData(): PreloadedHomeData | null {
  return cachedHomeData;
}
