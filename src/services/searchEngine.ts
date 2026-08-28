import { supabase } from '@/lib/supabase';
import type { Product, PromoBanner } from '@/types';

export interface SearchSuggestionItem {
  text: string;
  type: 'brand' | 'product' | 'category' | 'subcategory' | 'compound';
  subText?: string;
  brand?: string;
  packSize?: string;
  id?: string;
}

export interface RelatedSlugItem {
  name: string;
  slug: string;
  type: 'category' | 'subcategory' | 'brand';
  id?: string;
}

export interface SearchAnalysisResult {
  didYouMean: string | null;
  suggestions: SearchSuggestionItem[];
  matchedCategories: { id: string; name: string; slug: string }[];
  matchedBrands: string[];
}

export interface SearchExecutionResult {
  products: Product[];
  totalCount: number;
  didYouMean: string | null;
  alternativeBrandProducts: Product[];
  relatedSlugs: RelatedSlugItem[];
  promoAd: PromoBanner | null;
}

interface ProductIndexItem {
  id: string;
  name: string;
  brand: string;
  packSize: string;
  categoryId?: string;
  subcategoryId?: string;
  productCode?: string;
}

interface SearchDictionary {
  products: ProductIndexItem[];
  brands: string[];
  categories: { id: string; name: string; slug: string }[];
  subcategories: { id: string; name: string; slug: string; categoryId: string }[];
  lastFetched: number;
}

let dictionaryCache: SearchDictionary | null = null;
const CACHE_TTL = 10 * 60 * 1000;

export function formatCompoundPhrase(brand?: string, name?: string, packSize?: string): string {
  const b = (brand || '').trim();
  let n = (name || '').trim();
  const p = (packSize || '').trim();

  if (!n) return b;
  if (!b) return p ? `${n} ${p}` : n;

  if (n.toLowerCase().startsWith(b.toLowerCase())) {
    return p ? `${n} ${p}` : n;
  }

  const combined = `${b} ${n}`;
  return p ? `${combined} ${p}` : combined;
}

export async function getOrBuildSearchDictionary(): Promise<SearchDictionary> {
  const now = Date.now();
  if (dictionaryCache && now - dictionaryCache.lastFetched < CACHE_TTL) {
    return dictionaryCache;
  }

  try {
    const [productsRes, categoriesRes, subcategoriesRes, brandsRes] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, brand, pack_size, category_id, subcategory_id, product_code')
        .eq('is_active', true)
        .limit(2000),
      supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true),
      supabase
        .from('subcategories')
        .select('id, name, slug, category_id')
        .eq('is_active', true),
      supabase
        .from('trusted_brands')
        .select('name')
        .eq('is_active', true),
    ]);

    const products: ProductIndexItem[] = (productsRes.data || []).map((p: any) => ({
      id: p.id,
      name: p.name?.trim() || '',
      brand: p.brand?.trim() || '',
      packSize: p.pack_size?.trim() || '',
      categoryId: p.category_id,
      subcategoryId: p.subcategory_id,
      productCode: p.product_code?.trim() || '',
    }));

    const rawBrands = [
      ...products.map((p) => p.brand),
      ...(brandsRes.data || []).map((b) => b.name?.trim()),
    ].filter((b): b is string => Boolean(b));

    const brands = Array.from(new Set(rawBrands));

    const categories = (categoriesRes.data || [])
      .map((c) => ({ id: c.id, name: c.name?.trim() || '', slug: c.slug || '' }))
      .filter((c) => Boolean(c.name));

    const subcategories = (subcategoriesRes.data || [])
      .map((s) => ({ id: s.id, name: s.name?.trim() || '', slug: s.slug || '', categoryId: s.category_id }))
      .filter((s) => Boolean(s.name));

    dictionaryCache = {
      products,
      brands,
      categories,
      subcategories,
      lastFetched: now,
    };

    return dictionaryCache;
  } catch (err) {
    console.error('Failed to build search dictionary:', err);
    return {
      products: [],
      brands: [],
      categories: [],
      subcategories: [],
      lastFetched: 0,
    };
  }
}

function getLevenshteinDistance(a = '', b = ''): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= bn; i++) matrix[i] = [i];
  for (let j = 0; j <= an; j++) matrix[0][j] = j;

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b[i - 1] === a[i - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[bn][an];
}

export async function getLiveSearchSuggestions(query = ''): Promise<SearchAnalysisResult> {
  const q = (query || '').trim().toLowerCase();
  const dict = await getOrBuildSearchDictionary();

  if (!q) {
    return {
      didYouMean: null,
      suggestions: dict.categories.slice(0, 6).map((c) => ({
        text: c.name,
        type: 'category',
        id: c.id,
      })),
      matchedCategories: dict.categories.slice(0, 4),
      matchedBrands: dict.brands.slice(0, 4),
    };
  }

  const queryTokens = q.split(/\s+/).filter(Boolean);
  const suggestionList: SearchSuggestionItem[] = [];
  const matchedCategories: { id: string; name: string; slug: string }[] = [];
  const matchedBrands: string[] = [];
  const seenTexts = new Set<string>();

  const addUnique = (item: SearchSuggestionItem) => {
    const key = item.text.toLowerCase().trim();
    if (!seenTexts.has(key)) {
      seenTexts.add(key);
      suggestionList.push(item);
    }
  };

  // 1. Match Brand
  let matchedBrandName: string | null = null;
  let bestBrandDist = Infinity;

  for (const b of dict.brands) {
    const bLower = b.toLowerCase();
    if (bLower === q || bLower.startsWith(q) || queryTokens.some((t) => bLower.includes(t))) {
      matchedBrandName = b;
      matchedBrands.push(b);
      addUnique({ text: b, type: 'brand', subText: 'Brand' });
    } else {
      const dist = getLevenshteinDistance(q, bLower);
      const maxAllowed = q.length >= 6 ? 2 : q.length >= 4 ? 1 : 0;
      if (dist > 0 && dist <= maxAllowed && dist < bestBrandDist) {
        bestBrandDist = dist;
        matchedBrandName = b;
      }
    }
  }

  // 2. Compound Suggestions (Brand + Product + Pack Size)
  if (matchedBrandName) {
    const brandProducts = dict.products.filter(
      (p) => p.brand.toLowerCase() === matchedBrandName!.toLowerCase()
    );

    for (const p of brandProducts) {
      addUnique({
        text: formatCompoundPhrase(p.brand, p.name),
        type: 'compound',
        brand: p.brand,
      });

      if (p.packSize) {
        addUnique({
          text: formatCompoundPhrase(p.brand, p.name, p.packSize),
          type: 'product',
          brand: p.brand,
          packSize: p.packSize,
          subText: p.packSize,
        });
      }
      if (suggestionList.length >= 8) break;
    }
  }

  // 3. Product Title Matches
  for (const p of dict.products) {
    const searchable = `${p.brand} ${p.name} ${p.packSize} ${p.productCode}`.toLowerCase();
    if (queryTokens.every((t) => searchable.includes(t))) {
      addUnique({
        text: formatCompoundPhrase(p.brand, p.name, p.packSize),
        type: 'product',
        brand: p.brand,
        packSize: p.packSize,
        subText: p.packSize || p.brand,
      });
    }
    if (suggestionList.length >= 10) break;
  }

  // 4. Categories & Subcategories
  for (const c of dict.categories) {
    if (c.name.toLowerCase().includes(q)) {
      matchedCategories.push(c);
      addUnique({ text: c.name, type: 'category', id: c.id, subText: 'Category' });
    }
  }

  for (const sc of dict.subcategories) {
    if (sc.name.toLowerCase().includes(q)) {
      addUnique({ text: sc.name, type: 'subcategory', id: sc.id, subText: 'Subcategory' });
    }
  }

  // 5. Spell Corrector
  let didYouMean: string | null = null;
  if (suggestionList.length === 0) {
    let closest: { text: string; dist: number } | null = null;
    for (const p of dict.products) {
      const full = formatCompoundPhrase(p.brand, p.name, p.packSize);
      for (const token of full.toLowerCase().split(/\s+/)) {
        for (const qToken of queryTokens) {
          const dist = getLevenshteinDistance(qToken, token);
          const maxAllowed = qToken.length >= 6 ? 2 : qToken.length >= 3 ? 1 : 0;
          if (dist > 0 && dist <= maxAllowed) {
            if (!closest || dist < closest.dist) {
              closest = { text: full, dist };
            }
          }
        }
      }
    }
    if (closest) {
      didYouMean = closest.text;
      addUnique({ text: closest.text, type: 'compound', subText: 'Did you mean this?' });
    }
  }

  return {
    didYouMean,
    suggestions: suggestionList.slice(0, 8),
    matchedCategories: matchedCategories.slice(0, 4),
    matchedBrands: matchedBrands.slice(0, 4),
  };
}

// Full Search with Multi-Brand Product Alternatives & Related Slugs
export async function executeFullSearch(
  query = '',
  filter?: {
    categoryId?: string;
    brand?: string;
    inStockOnly?: boolean;
    hasDealsOnly?: boolean;
  }
): Promise<SearchExecutionResult> {
  const cleanQuery = (query || '').trim();
  const analysis = await getLiveSearchSuggestions(cleanQuery);
  const effectiveQuery = cleanQuery || analysis.didYouMean || '';
  const dict = await getOrBuildSearchDictionary();

  try {
    let dbQuery = supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    if (filter?.categoryId) dbQuery = dbQuery.eq('category_id', filter.categoryId);
    if (filter?.brand) dbQuery = dbQuery.eq('brand', filter.brand);
    if (filter?.inStockOnly) dbQuery = dbQuery.gt('stock_quantity', 0);
    if (filter?.hasDealsOnly) dbQuery = dbQuery.gt('discount_percentage', 5);

    const tokens = effectiveQuery.toLowerCase().split(/\s+/).filter(Boolean);

    if (tokens.length > 0) {
      const orConditions = tokens
        .map(
          (t) =>
            `name.ilike.%${t}%,brand.ilike.%${t}%,pack_size.ilike.%${t}%,description.ilike.%${t}%,product_code.ilike.%${t}%`
        )
        .join(',');
      dbQuery = dbQuery.or(orConditions);
    }

    const { data: rawProducts, error } = await dbQuery.limit(60);
    if (error) throw error;

    const matchedProducts: Product[] = (rawProducts || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category_id,
      mrp: Number(p.mrp || 0),
      price: Number(p.wholesale_price || 0),
      packSize: p.pack_size || '',
      moq: p.moq || p.min_order_quantity || 1,
      image: p.image_url || (p.image_urls && p.image_urls[0]) || '',
      rating: Number(p.rating || 4.5),
      inStock: (p.stock_quantity || 0) > 0,
      description: p.description || '',
      hsn_code: p.hsn_code,
      gst_percentage: p.gst_percentage,
    }));

    // Detect target category IDs & item keywords (e.g., 'atta', 'oil', 'rice', 'dal')
    const primaryCategoryIds = Array.from(
      new Set(matchedProducts.map((p) => p.category).filter(Boolean))
    );
    const matchedBrandNames = new Set(
      matchedProducts.map((p) => (p.brand || '').toLowerCase().trim())
    );

    // Identify non-brand commodity tokens (e.g. if query is "Ashirvad atta", commodity token is "atta")
    const genericCommodityTokens = tokens.filter(
      (t) => !Array.from(matchedBrandNames).some((b) => b.includes(t))
    );

    // 2. Fetch Alternative Brand Products
    let alternativeProducts: Product[] = [];
    if (matchedProducts.length > 0 || genericCommodityTokens.length > 0) {
      let altQuery = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(20);

      // Filter by same categories or generic tokens, excluding already matched main brands
      if (primaryCategoryIds.length > 0) {
        altQuery = altQuery.in('category_id', primaryCategoryIds);
      } else if (genericCommodityTokens.length > 0) {
        altQuery = altQuery.or(
          genericCommodityTokens.map((t) => `name.ilike.%${t}%,description.ilike.%${t}%`).join(',')
        );
      }

      const { data: rawAlt } = await altQuery;
      const matchedIds = new Set(matchedProducts.map((p) => p.id));

      alternativeProducts = (rawAlt || [])
        .filter((p: any) => !matchedIds.has(p.id) && !matchedBrandNames.has((p.brand || '').toLowerCase()))
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: p.category_id,
          mrp: Number(p.mrp || 0),
          price: Number(p.wholesale_price || 0),
          packSize: p.pack_size || '',
          moq: p.moq || p.min_order_quantity || 1,
          image: p.image_url || (p.image_urls && p.image_urls[0]) || '',
          rating: Number(p.rating || 4.5),
          inStock: (p.stock_quantity || 0) > 0,
          description: p.description || '',
        }));
    }

    // 3. Resolve Related Slugs (Categories, Subcategories & Brands)
    const relatedSlugs: RelatedSlugItem[] = [];
    const seenSlugs = new Set<string>();

    // Add matching categories
    for (const catId of primaryCategoryIds) {
      const c = dict.categories.find((cat) => cat.id === catId);
      if (c && !seenSlugs.has(c.slug)) {
        seenSlugs.add(c.slug);
        relatedSlugs.push({ name: c.name, slug: c.slug, type: 'category', id: c.id });
      }
    }

    // Add matching subcategories
    for (const sc of dict.subcategories) {
      if (
        primaryCategoryIds.includes(sc.categoryId) ||
        tokens.some((t) => sc.name.toLowerCase().includes(t))
      ) {
        if (!seenSlugs.has(sc.slug)) {
          seenSlugs.add(sc.slug);
          relatedSlugs.push({ name: sc.name, slug: sc.slug, type: 'subcategory', id: sc.id });
        }
      }
    }

    // Add related brand slugs
    for (const b of dict.brands) {
      if (tokens.some((t) => b.toLowerCase().includes(t)) || matchedBrandNames.has(b.toLowerCase())) {
        const brandSlug = b.toLowerCase().replace(/\s+/g, '-');
        if (!seenSlugs.has(brandSlug)) {
          seenSlugs.add(brandSlug);
          relatedSlugs.push({ name: b, slug: brandSlug, type: 'brand' });
        }
      }
    }

    // 4. Promo Ad Banner
    const { data: banners } = await supabase
      .from('home_banners')
      .select('*')
      .eq('is_active', true)
      .limit(1);

    const promoAd: PromoBanner | null =
      banners && banners.length > 0
        ? {
            id: banners[0].id,
            title: banners[0].title,
            description: banners[0].description,
            imageUrl: banners[0].image_url,
            backgroundColor: banners[0].background_color || '#16a34a',
            buttonText: banners[0].button_text || 'View Deals',
            badge: banners[0].badge,
            position: banners[0].position,
            actionType: banners[0].action_type,
            actionConfig: banners[0].action_config,
          }
        : null;

    return {
      products: matchedProducts,
      totalCount: matchedProducts.length,
      didYouMean: matchedProducts.length === 0 ? analysis.didYouMean : null,
      alternativeBrandProducts: alternativeProducts.slice(0, 10),
      relatedSlugs: relatedSlugs.slice(0, 8),
      promoAd,
    };
  } catch (err) {
    console.error('Search execution failed:', err);
    return {
      products: [],
      totalCount: 0,
      didYouMean: null,
      alternativeBrandProducts: [],
      relatedSlugs: [],
      promoAd: null,
    };
  }
}