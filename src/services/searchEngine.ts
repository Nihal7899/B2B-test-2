import { supabase } from '@/lib/supabase';
import type { Product, PromoBanner } from '@/types';

export interface SearchSuggestionItem {
  text: string;
  type: 'product' | 'brand' | 'category' | 'subcategory';
  id?: string;
  count?: number;
}

export interface SearchAnalysisResult {
  didYouMean: string | null;
  suggestions: SearchSuggestionItem[];
  matchedCategories: { id: string; name: string }[];
  matchedBrands: string[];
}

export interface SearchExecutionResult {
  products: Product[];
  totalCount: number;
  didYouMean: string | null;
  relatedProducts: Product[];
  promoAd: PromoBanner | null;
}

interface SearchDictionary {
  productNames: string[];
  brands: string[];
  categories: { id: string; name: string }[];
  subcategories: { id: string; name: string }[];
  allKeywords: { word: string; type: SearchSuggestionItem['type']; id?: string }[];
  lastFetched: number;
}

let dictionaryCache: SearchDictionary | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// 1. Build and cache Search Dictionary from Database Schema
export async function getOrBuildSearchDictionary(): Promise<SearchDictionary> {
  const now = Date.now();
  if (dictionaryCache && now - dictionaryCache.lastFetched < CACHE_TTL) {
    return dictionaryCache;
  }

  try {
    const [productsRes, categoriesRes, subcategoriesRes, brandsRes] = await Promise.all([
      supabase
        .from('products')
        .select('name, brand, product_code')
        .eq('is_active', true)
        .limit(1000),
      supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true),
      supabase
        .from('subcategories')
        .select('id, name')
        .eq('is_active', true),
      supabase
        .from('trusted_brands')
        .select('name')
        .eq('is_active', true),
    ]);

    const productNames = Array.from(
      new Set((productsRes.data || []).map((p) => p.name.trim()).filter(Boolean))
    );
    const brands = Array.from(
      new Set([
        ...(productsRes.data || []).map((p) => p.brand?.trim()),
        ...(brandsRes.data || []).map((b) => b.name?.trim()),
      ].filter(Boolean))
    );
    const categories = (categoriesRes.data || []).map((c) => ({ id: c.id, name: c.name.trim() }));
    const subcategories = (subcategoriesRes.data || []).map((s) => ({ id: s.id, name: s.name.trim() }));

    const allKeywords: SearchDictionary['allKeywords'] = [];

    categories.forEach((c) => allKeywords.push({ word: c.name, type: 'category', id: c.id }));
    subcategories.forEach((s) => allKeywords.push({ word: s.name, type: 'subcategory', id: s.id }));
    brands.forEach((b) => allKeywords.push({ word: b, type: 'brand' }));
    productNames.forEach((p) => allKeywords.push({ word: p, type: 'product' }));

    dictionaryCache = {
      productNames,
      brands,
      categories,
      subcategories,
      allKeywords,
      lastFetched: now,
    };

    return dictionaryCache;
  } catch (err) {
    console.error('Failed to build search dictionary:', err);
    return {
      productNames: [],
      brands: [],
      categories: [],
      subcategories: [],
      allKeywords: [],
      lastFetched: 0,
    };
  }
}

// 2. High-performance Levenshtein Distance for Spell Correction
function getLevenshteinDistance(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= bn; i++) matrix[i] = [i];
  for (let j = 0; j <= an; j++) matrix[0][j] = j;

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

// 3. Fast Suggestions & Spell Corrector (Runs strictly on memory without network calls)
export async function getLiveSearchSuggestions(query: string): Promise<SearchAnalysisResult> {
  const q = query.trim().toLowerCase();
  const dict = await getOrBuildSearchDictionary();

  if (!q) {
    return {
      didYouMean: null,
      suggestions: dict.categories.slice(0, 5).map((c) => ({
        text: c.name,
        type: 'category',
        id: c.id,
      })),
      matchedCategories: dict.categories.slice(0, 4),
      matchedBrands: dict.brands.slice(0, 4),
    };
  }

  const queryTokens = q.split(/\s+/).filter(Boolean);

  // Exact & Prefix matches
  const directMatches: SearchSuggestionItem[] = [];
  const matchedCategories: { id: string; name: string }[] = [];
  const matchedBrands: string[] = [];

  for (const item of dict.allKeywords) {
    const itemLower = item.word.toLowerCase();
    if (itemLower.includes(q) || queryTokens.every((t) => itemLower.includes(t))) {
      directMatches.push({ text: item.word, type: item.type, id: item.id });
      if (item.type === 'category' && item.id) {
        matchedCategories.push({ id: item.id, name: item.word });
      }
      if (item.type === 'brand') {
        matchedBrands.push(item.word);
      }
    }
  }

  // Typo & Fuzzy Matching for "Did You Mean"
  let bestCandidate: { word: string; distance: number } | null = null;

  if (directMatches.length === 0) {
    for (const item of dict.allKeywords) {
      const itemTokens = item.word.toLowerCase().split(/\s+/);
      for (const qToken of queryTokens) {
        for (const iToken of itemTokens) {
          const dist = getLevenshteinDistance(qToken, iToken);
          const maxAllowed = qToken.length >= 6 ? 2 : qToken.length >= 3 ? 1 : 0;
          if (dist > 0 && dist <= maxAllowed) {
            if (!bestCandidate || dist < bestCandidate.distance) {
              bestCandidate = { word: item.word, distance: dist };
            }
          }
        }
      }
    }
  }

  // Deduplicate and cap suggestions
  const seen = new Set<string>();
  const uniqueSuggestions: SearchSuggestionItem[] = [];
  for (const m of directMatches) {
    if (!seen.has(m.text.toLowerCase())) {
      seen.add(m.text.toLowerCase());
      uniqueSuggestions.push(m);
      if (uniqueSuggestions.length >= 8) break;
    }
  }

  return {
    didYouMean: bestCandidate ? bestCandidate.word : null,
    suggestions: uniqueSuggestions,
    matchedCategories: matchedCategories.slice(0, 4),
    matchedBrands: matchedBrands.slice(0, 4),
  };
}

// 4. Full Search Query Execution (Only called when user submits search)
export async function executeFullSearch(
  query: string,
  filter?: {
    categoryId?: string;
    brand?: string;
    inStockOnly?: boolean;
    hasDealsOnly?: boolean;
  }
): Promise<SearchExecutionResult> {
  const cleanQuery = query.trim();
  const analysis = await getLiveSearchSuggestions(cleanQuery);
  const effectiveQuery = cleanQuery || analysis.didYouMean || '';

  try {
    let dbQuery = supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    if (filter?.categoryId) {
      dbQuery = dbQuery.eq('category_id', filter.categoryId);
    }
    if (filter?.brand) {
      dbQuery = dbQuery.eq('brand', filter.brand);
    }
    if (filter?.inStockOnly) {
      dbQuery = dbQuery.gt('stock_quantity', 0);
    }
    if (filter?.hasDealsOnly) {
      dbQuery = dbQuery.gt('discount_percentage', 5);
    }

    if (effectiveQuery) {
      dbQuery = dbQuery.or(
        `name.ilike.%${effectiveQuery}\%,brand.ilike.\%${effectiveQuery}%,description.ilike.%${effectiveQuery}\%,product_code.ilike.\%${effectiveQuery}%`
      );
    }

    const { data: rawProducts, error } = await dbQuery.limit(60);
    if (error) throw error;

    const mappedProducts: Product[] = (rawProducts || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category_id,
      mrp: Number(p.mrp),
      price: Number(p.wholesale_price),
      packSize: p.pack_size,
      moq: p.moq || p.min_order_quantity || 1,
      image: p.image_url || (p.image_urls && p.image_urls[0]) || '',
      rating: Number(p.rating || 4.5),
      inStock: p.stock_quantity > 0,
      description: p.description || '',
      hsn_code: p.hsn_code,
      gst_percentage: p.gst_percentage,
    }));

    // Fetch matching promo ad banner for the search result screen
    const { data: banners } = await supabase
      .from('home_banners')
      .select('*')
      .eq('is_active', true)
      .limit(2);

    const promoAd: PromoBanner | null = banners && banners.length > 0 ? {
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
    } : null;

    // Fetch related fallback products if count is 0
    let relatedProducts: Product[] = [];
    if (mappedProducts.length === 0) {
      const { data: fallbackData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(8);

      relatedProducts = (fallbackData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category_id,
        mrp: Number(p.mrp),
        price: Number(p.wholesale_price),
        packSize: p.pack_size,
        moq: p.moq || p.min_order_quantity || 1,
        image: p.image_url || (p.image_urls && p.image_urls[0]) || '',
        rating: Number(p.rating || 4.5),
        inStock: p.stock_quantity > 0,
        description: p.description || '',
      }));
    }

    return {
      products: mappedProducts,
      totalCount: mappedProducts.length,
      didYouMean: mappedProducts.length === 0 ? analysis.didYouMean : null,
      relatedProducts,
      promoAd,
    };
  } catch (err) {
    console.error('Search execution failed:', err);
    return {
      products: [],
      totalCount: 0,
      didYouMean: null,
      relatedProducts: [],
      promoAd: null,
    };
  }
}
