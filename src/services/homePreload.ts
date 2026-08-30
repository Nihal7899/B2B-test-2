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
let preloadPromise: Promise<PreloadedHomeData> | null = null;

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

export async function preloadImages(urls: string[], timeoutMs = 2500): Promise<void> {
  const uniqueUrls = Array.from(new Set(urls.filter((u) => Boolean(u && u.trim()))));
  if (uniqueUrls.length === 0) return;

  const tasks = uniqueUrls.map((url) => preloadImage(url));
  await Promise.race([
    Promise.all(tasks),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

export async function preloadHomeScreenDataAndImages(): Promise<PreloadedHomeData> {
  if (cachedHomeData) return cachedHomeData;
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
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

      const categories = catRes.categories || [];
      const banners = banRes || [];
      const sections = secRes.filter((s) => s.isActive) || [];

      const criticalImageUrls: string[] = [
        ...banners.map((b) => b.image).filter(Boolean),
        ...categories.slice(0, 16).map((c) => c.image).filter(Boolean),
      ];

      await preloadImages(criticalImageUrls, 2000);

      cachedHomeData = {
        address: addrs.find((a) => a.is_default) || addrs[0] || null,
        sections,
        banners,
        categories,
        products: prodRes.products || [],
        popularProducts: popRes || [],
        reorderProducts: reorderRes || [],
        recentlyViewed: recentRes || [],
        volumeDeals: volumeRes || [],
        newArrivals: newArrRes || [],
        topRated: topRatedRes || [],
        limitedStock: limitedRes || [],
        brandSpotlight: spotlightRes,
        stores: storeRes || [],
        brands: brandRes || [],
      };

      return cachedHomeData;
    } finally {
      preloadPromise = null;
    }
  })();

  return preloadPromise;
}

export function getCachedHomeData(): PreloadedHomeData | null {
  return cachedHomeData;
}
