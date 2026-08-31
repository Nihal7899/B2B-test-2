// services/actionResolver.ts
import type { ActionType, FilterConfig, Category, Product, ScreenName, Store } from '@/types';
import { fetchSmartCollectionById } from './catalog';

export interface ActionContext {
  setScreen: (screen: ScreenName) => void;
  setSearch: (query: string) => void;
  openProduct: (product: Product | { id: string; name?: string }) => void;
  openCategory: (category: Category | { id: string; name?: string }) => void;
  openBrand?: (brand: { id: string; name?: string }) => void;
  openStore?: (store: Store | { id: string; name?: string }) => void;
  navigate?: (path: string) => void;
  setFilterConfig: (config: FilterConfig | null) => void;
  setFilterTitle: (title: string) => void;
}

export async function handleHomeAction(
  actionType?: string,
  actionConfig?: Record<string, unknown>,
  ctx?: ActionContext
): Promise<void> {
  if (!actionType || !ctx) return;

  const config = actionConfig || {};

  switch (actionType) {
    case 'VIEW_CATEGORY': {
      const categoryId = (config.category_id as string) || (config.id as string);
      const categoryIds = config.category_ids as string[];
      const categoryName = (config.category_name as string) || 'Category';

      if (categoryId) {
        if (ctx.navigate) {
          ctx.navigate(`/category?id=${encodeURIComponent(categoryId)}`);
        } else if (ctx.openCategory) {
          ctx.openCategory({ id: categoryId, name: categoryName } as Category);
        }
      } else if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
        if (categoryIds.length === 1) {
          if (ctx.navigate) {
            ctx.navigate(`/category?id=${encodeURIComponent(categoryIds[0])}`);
          } else if (ctx.openCategory) {
            ctx.openCategory({ id: categoryIds[0], name: categoryName } as Category);
          }
        } else {
          ctx.setFilterConfig({ category_ids: categoryIds });
          ctx.setFilterTitle(categoryName || 'Categories');
          ctx.setScreen('filteredProducts');
        }
      } else {
        console.warn('VIEW_CATEGORY: missing category_id');
      }
      break;
    }

    case 'VIEW_BRAND': {
      const brandId = (config.brand_id as string) || (config.id as string) || (config.brand as string);
      if (brandId) {
        if (ctx.navigate) {
          ctx.navigate(`/brand?id=${encodeURIComponent(brandId)}`);
        } else if (ctx.openBrand) {
          ctx.openBrand({ id: brandId });
        }
      } else {
        console.warn('VIEW_BRAND: missing brand_id');
      }
      break;
    }

    case 'OPEN_STORE':
    case 'VIEW_STORE': {
      const storeId = (config.store_id as string) || (config.id as string);
      if (storeId) {
        if (ctx.navigate) {
          ctx.navigate(`/store?storeId=${encodeURIComponent(storeId)}`);
        } else if (ctx.openStore) {
          ctx.openStore({ id: storeId });
        }
      } else {
        console.warn('OPEN_STORE: missing store_id');
      }
      break;
    }

    case 'VIEW_PRODUCT': {
      const productId = (config.product_id as string) || (config.id as string);
      const productName = (config.product_name as string) || '';

      if (productId) {
        if (ctx.openProduct) {
          ctx.openProduct({ id: productId, name: productName } as Product);
        } else if (ctx.navigate) {
          ctx.navigate(`/product?id=${encodeURIComponent(productId)}`);
        }
      }
      break;
    }

    case 'VIEW_OFFER':
    case 'SEARCH': {
      const query = (config.query as string) || '';
      ctx.setSearch(query);
      if (ctx.navigate) {
        ctx.navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
      } else {
        ctx.setScreen('search');
      }
      break;
    }

    case 'FILTER_PRODUCTS': {
      const filter: FilterConfig = {};

      if (config.category_ids && Array.isArray(config.category_ids) && config.category_ids.length > 0) {
        filter.category_ids = config.category_ids as string[];
      }
      if (config.brand_ids && Array.isArray(config.brand_ids) && config.brand_ids.length > 0) {
        filter.brand_ids = config.brand_ids as string[];
      }
      if (config.product_ids && Array.isArray(config.product_ids) && config.product_ids.length > 0) {
        filter.product_ids = config.product_ids as string[];
      }
      if (config.discount_min !== undefined && config.discount_min !== null && config.discount_min !== '') {
        filter.discount_min = Number(config.discount_min);
      }
      if (config.discount_max !== undefined && config.discount_max !== null && config.discount_max !== '') {
        filter.discount_max = Number(config.discount_max);
      }
      if (config.price_min !== undefined && config.price_min !== null && config.price_min !== '') {
        filter.price_min = Number(config.price_min);
      }
      if (config.price_max !== undefined && config.price_max !== null && config.price_max !== '') {
        filter.price_max = Number(config.price_max);
      }
      if (config.stock_only !== undefined) {
        filter.stock_only = Boolean(config.stock_only);
      }
      if (config.sort) {
        filter.sort = config.sort as FilterConfig['sort'];
      }

      ctx.setFilterConfig(Object.keys(filter).length > 0 ? filter : {});
      const title = (config.title as string) || (filter.category_ids?.length ? 'Categories' : 'Products');
      ctx.setFilterTitle(title);
      ctx.setScreen('filteredProducts');
      break;
    }

    case 'OPEN_SMART_COLLECTION': {
      const collectionId = config.collection_id as string;
      if (collectionId) {
        try {
          const collection = await fetchSmartCollectionById(collectionId);
          if (collection) {
            ctx.setFilterConfig(collection.filter_config);
            ctx.setFilterTitle(collection.name);
            ctx.setScreen('filteredProducts');
          }
        } catch (err) {
          console.error('Error fetching smart collection:', err);
        }
      }
      break;
    }

    case 'OPEN_CART':
      ctx.setScreen('cart');
      break;

    case 'OPEN_ORDERS':
      ctx.setScreen('orders');
      break;

    case 'OPEN_WISHLIST':
      ctx.setScreen('wishlist');
      break;

    case 'OPEN_ADDRESS':
      ctx.setScreen('addresses');
      break;

    case 'OPEN_SCREEN': {
      const screen = config.screen as ScreenName;
      if (screen) {
        ctx.setScreen(screen);
      }
      break;
    }

    case 'OPEN_EXTERNAL_URL': {
      const url = config.url as string;
      if (url) {
        window.open(url, '_blank');
      }
      break;
    }

    default:
      console.warn('Unknown action type:', actionType);
  }
}
