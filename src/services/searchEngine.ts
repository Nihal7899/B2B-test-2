import { supabase } from '@/lib/supabase';
import type { Product, PromoBanner, Category } from '@/types';

export interface SearchSuggestionItem {
  text: string;
  type: 'brand' | 'product' | 'category' | 'subcategory' | 'compound' | 'sku';
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
  matchedCategories: Category[];
  matchedBrands: string[];
}

export interface SearchExecutionResult {
  products: Product[];
  totalCount: number;
  didYouMean: string | null;
  alternativeBrandProducts: Product[];
  relatedSlugs: RelatedSlugItem[];
  matchedCategory: Category | null;
  allCategories: Category[];
  trendingProducts: Product[];
  topBanner: PromoBanner | null;
  middleBanners: PromoBanner[];
}

interface ProductIndexItem {
  id: string;
  name: string;
  brand: string;
  packSize: string;
  categoryId?: string;
  subcategoryId?: string;
  productCode?: string;
  description?: string;
}

interface SearchDictionary {
  products: ProductIndexItem[];
  brands: string[];
  categories: Category[];
  subcategories: { id: string; name: string; slug: string; categoryId: string }[];
  synonyms: Record<string, string[]>;
  vocabulary: string[];
  lastFetched: number;
}

// FIXED: SKU Regex strictly requires at least one letter AND one number (so it doesn't hijack "onion")
const SKU_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{4,12}$/i;
const PACK_SIZE_REGEX = /^\d+(\.\d+)?(kg|g|ml|l|ltr|pc|pcs|tin|jar|box|pkt|dz)$/i;

// FIXED: Hardcoded fallback map so "aloo" always works even if the Supabase table is empty
const FALLBACK_SYNONYMS: Record<string, string[]> = {
  beverage: ['beverages', 'drink', 'drinks', 'cold drink', 'soft drink', 'juice', 'soda', 'syrup', 'tea', 'coffee', 'water'],
  drink: ['beverages', 'cold drink', 'juice', 'soft drinks', 'drinks'],
  oil: ['edible oil', 'refined oil', 'mustard oil', 'sunflower oil', 'ghee', 'cooking oil', 'tel', 'oils'],
  atta: ['flour', 'wheat', 'chakki atta', 'maida', 'sooji', 'grains'],
  flour: ['atta', 'wheat', 'maida', 'besan', 'sooji', 'grains'],
  rice: ['basmati', 'kolam', 'sona masoori', 'poha', 'grains', 'chawal'],
  dal: ['pulses', 'toor dal', 'moong dal', 'chana dal', 'urad dal', 'legumes', 'daal', 'lentils'],
  pulses: ['dal', 'lentils', 'legumes', 'chana', 'rajma', 'toor', 'daal'],
  sugar: ['sweetener', 'jaggery', 'gur', 'chini', 'cheeni'],
  spices: ['masala', 'mirchi', 'turmeric', 'chilli', 'haldi', 'dhaniya', 'jeera'],
  cleaning: ['detergent', 'soap', 'floor cleaner', 'dishwash', 'cleaner', 'phenyl'],
  dairy: ['milk', 'paneer', 'cheese', 'butter', 'curd', 'ghee', 'doodh'],
  snacks: ['biscuits', 'namkeen', 'chips', 'cookies', 'noodles', 'wafer', 'bhujia', 'sev'],
  tomato: ['tomatoes', 'tamatar'],
  potato: ['potatoes', 'aloo', 'alu'],
  onion: ['onions', 'kanda', 'pyaz', 'piyaz'],
  veg: ['vegetables', 'sabji', 'sabzi', 'greens'],
  chicken: ['murgh', 'poultry', 'meat'],
  mutton: ['lamb', 'meat', 'gosht'],
};

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
    // We intentionally separate the synonyms fetch so if the table doesn't exist, it doesn't crash the dictionary
    const [productsRes, categoriesRes, subcategoriesRes, brandsRes] = await Promise.all([
      supabase.from('products').select('id, name, brand, pack_size, category_id, subcategory_id, product_code, description').eq('is_active', true).limit(3000),
      supabase.from('categories').select('id, name, slug, image_url, description, gradient, is_active').eq('is_active', true).order('sort_order', { ascending: true }),
      supabase.from('subcategories').select('id, name, slug, category_id').eq('is_active', true),
      supabase.from('trusted_brands').select('name').eq('is_active', true),
    ]);

    let synonymsRes: any = { data: null };
    try {
      synonymsRes = await supabase.from('search_synonyms').select('keyword, synonyms').eq('is_active', true);
    } catch (e) {
      console.warn("Synonyms table unavailable, falling back to local map.");
    }

    const products: ProductIndexItem[] = (productsRes.data || []).map((p: any) => ({
      id: p.id,
      name: p.name?.trim() || '',
      brand: p.brand?.trim() || '',
      packSize: p.pack_size?.trim() || '',
      categoryId: p.category_id,
      subcategoryId: p.subcategory_id,
      productCode: p.product_code?.trim() || '',
      description: p.description?.trim() || '',
    }));

    const rawBrands = [
      ...products.map((p) => p.brand),
      ...(brandsRes.data || []).map((b) => b.name?.trim()),
    ].filter((b): b is string => Boolean(b));

    const brands = Array.from(new Set(rawBrands));

    const categories: Category[] = (categoriesRes.data || []).map((c: any) => ({
      id: c.id,
      name: c.name?.trim() || '',
      slug: c.slug || '',
      image: c.image_url || '',
      description: c.description || '',
      gradient: c.gradient || '#10b981',
      isActive: c.is_active ?? true,
    }));

    const subcategories = (subcategoriesRes.data || []).map((s: any) => ({
      id: s.id,
      name: s.name?.trim() || '',
      slug: s.slug || '',
      categoryId: s.category_id,
    }));

    // Build Bidirectional Synonyms with Fallback
    const synonymsMap: Record<string, string[]> = {};
    const addSynonyms = (kw: string, syns: string[]) => {
      synonymsMap[kw] = Array.from(new Set([...(synonymsMap[kw] || []), ...syns]));
      syns.forEach(s => {
        synonymsMap[s] = Array.from(new Set([...(synonymsMap[s] || []), kw, ...syns]));
      });
    };
    
    Object.entries(FALLBACK_SYNONYMS).forEach(([k, v]) => addSynonyms(k.toLowerCase(), v.map(s => s.toLowerCase())));
    if (synonymsRes.data) {
      synonymsRes.data.forEach((row: any) => addSynonyms(row.keyword.toLowerCase(), row.synonyms.map((s: string) => s.toLowerCase())));
    }

    // Build strict vocabulary for spell-checker
    const vocabSet = new Set<string>();
    categories.forEach(c => c.name.toLowerCase().split(/[\s,]+/).forEach(w => vocabSet.add(w.replace(/[^\w-]/g, ''))));
    brands.forEach(b => b.toLowerCase().split(/[\s,]+/).forEach(w => vocabSet.add(w.replace(/[^\w-]/g, ''))));
    products.forEach(p => p.name.toLowerCase().split(/[\s,]+/).forEach(w => vocabSet.add(w.replace(/[^\w-]/g, ''))));
    const vocabulary = Array.from(vocabSet).filter(w => w.length >= 3);

    dictionaryCache = { products, brands, categories, subcategories, synonyms: synonymsMap, vocabulary, lastFetched: now };
    return dictionaryCache;
  } catch (err) {
    console.error('Failed to build search dictionary:', err);
    return { products: [], brands: [], categories: [], subcategories: [], synonyms: {}, vocabulary: [], lastFetched: 0 };
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
      suggestions: dict.categories.slice(0, 6).map((c) => ({ text: c.name, type: 'category', id: c.id })),
      matchedCategories: dict.categories.slice(0, 6),
      matchedBrands: dict.brands.slice(0, 4),
    };
  }

  const queryTokens = q.split(/[\s,]+/).map(t => t.replace(/[^\w-]/g, '')).filter(Boolean);
  
  const suggestionList: SearchSuggestionItem[] = [];
  const matchedCategories: Category[] = [];
  const matchedBrands: string[] = [];
  const seenTexts = new Set<string>();

  const addUnique = (item: SearchSuggestionItem) => {
    const key = item.text.toLowerCase().trim();
    if (!seenTexts.has(key)) {
      seenTexts.add(key);
      suggestionList.push(item);
    }
  };

  const skuToken = queryTokens.find(t => SKU_REGEX.test(t));
  if (skuToken) {
    const skuMatches = dict.products.filter(p => p.productCode?.toLowerCase() === skuToken);
    for (const p of skuMatches) {
      addUnique({ text: formatCompoundPhrase(p.brand, p.name, p.packSize), type: 'sku', subText: `SKU: ${p.productCode}` });
    }
  }

  for (const c of dict.categories) {
    if (c.name.toLowerCase().startsWith(q)) {
      matchedCategories.push(c);
      addUnique({ text: c.name, type: 'category', id: c.id, subText: 'Category' });
    }
  }

  for (const b of dict.brands) {
    if (b.toLowerCase().startsWith(q)) {
      matchedBrands.push(b);
      addUnique({ text: b, type: 'brand', subText: 'Brand' });
    }
  }

  for (const c of dict.categories) {
    const cLower = c.name.toLowerCase();
    const cSlug = c.slug.toLowerCase();
    if (!matchedCategories.some(mc => mc.id === c.id)) {
      if (queryTokens.some(t => cLower.includes(t) || cSlug.includes(t))) {
        matchedCategories.push(c);
        addUnique({ text: c.name, type: 'category', id: c.id, subText: 'Category' });
      }
    }
  }

  for (const sc of dict.subcategories) {
    const scLower = sc.name.toLowerCase();
    if (scLower.startsWith(q) || queryTokens.some((t) => scLower.includes(t))) {
      addUnique({ text: sc.name, type: 'subcategory', id: sc.id, subText: 'Subcategory' });
    }
  }

  for (const p of dict.products) {
    const searchable = `${p.brand} ${p.name} ${p.packSize} ${p.description}`.toLowerCase();
    const pName = p.name.toLowerCase();
    
    // FIXED: Properly allow synonyms like "aloo" to trigger product suggestions for "potato"
    const matchesAllTokens = queryTokens.every(t => {
      const equivalents = [t, ...(dict.synonyms[t] || [])];
      return equivalents.some(eq => searchable.includes(eq));
    });

    if (pName.startsWith(q)) {
      addUnique({ text: formatCompoundPhrase(p.brand, p.name, p.packSize), type: 'product', brand: p.brand, packSize: p.packSize, subText: p.packSize || p.brand });
    } else if (matchesAllTokens) {
      addUnique({ text: formatCompoundPhrase(p.brand, p.name, p.packSize), type: 'product', brand: p.brand, packSize: p.packSize, subText: p.packSize || p.brand });
    }
    if (suggestionList.length >= 12) break;
  }

  let didYouMean: string | null = null;
  if (suggestionList.length === 0) {
    const correctedTokens = queryTokens.map(token => {
      if (token.length < 3) return token;
      
      // FIXED: If the word is spelled correctly OR exists in synonyms (like "aloo"), DO NOT touch it.
      if (dict.vocabulary.includes(token) || dict.synonyms[token]) {
        return token;
      }
      
      let bestMatch = token;
      let lowestDist = 3; 

      for (const word of dict.vocabulary) {
        const dist = getLevenshteinDistance(token, word);
        if (dist > 0 && dist < lowestDist) {
          lowestDist = dist;
          bestMatch = word;
        }
      }
      return bestMatch;
    });

    const correctedQuery = correctedTokens.join(' ');
    if (correctedQuery !== queryTokens.join(' ')) {
      didYouMean = correctedQuery;
      addUnique({ text: correctedQuery, type: 'compound', subText: 'Did you mean this?' });
    }
  }

  return {
    didYouMean,
    suggestions: suggestionList.slice(0, 10),
    matchedCategories: matchedCategories.slice(0, 6),
    matchedBrands: matchedBrands.slice(0, 4),
  };
}

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
  const dict = await getOrBuildSearchDictionary();
  const analysis = await getLiveSearchSuggestions(cleanQuery);
  
  // FIXED: If the spell checker corrected a typo (e.g., "oniox" -> "onion"), automatically search the corrected word
  const effectiveQuery = analysis.didYouMean ? analysis.didYouMean : cleanQuery;

  try {
    const rawTokens = effectiveQuery.toLowerCase().split(/[\s,]+/).map(t => t.replace(/[^\w-]/g, '')).filter(Boolean);
    
    // Expand the tokens explicitly here for the database search (e.g. "aloo" -> ["aloo", "potato"])
    const expanded = new Set<string>(rawTokens);
    for (const t of rawTokens) {
      if (dict.synonyms[t]) dict.synonyms[t].forEach(s => expanded.add(s));
    }
    const tokens = Array.from(expanded);

    const matchingCategoryIds = new Set<string>();
    const matchingSubcategoryIds = new Set<string>();
    let primaryCategory: Category | null = null;

    for (const cat of dict.categories) {
      const cName = cat.name.toLowerCase();
      const cSlug = cat.slug.toLowerCase();
      if (cName === effectiveQuery.toLowerCase() || cSlug.includes(effectiveQuery.toLowerCase()) || tokens.some((t) => cName.includes(t) || cSlug.includes(t))) {
        matchingCategoryIds.add(cat.id);
        if (!primaryCategory) primaryCategory = cat;
      }
    }

    for (const sc of dict.subcategories) {
      const scName = sc.name.toLowerCase();
      if (tokens.some((t) => scName.includes(t))) {
        matchingSubcategoryIds.add(sc.id);
        if (sc.categoryId) matchingCategoryIds.add(sc.categoryId);
      }
    }

    let dbQuery = supabase.from('products').select('*').eq('is_active', true);

    if (filter?.categoryId) dbQuery = dbQuery.eq('category_id', filter.categoryId);
    if (filter?.brand) dbQuery = dbQuery.eq('brand', filter.brand);
    if (filter?.hasDealsOnly) dbQuery = dbQuery.gt('discount_percentage', 5);

    const orConditions: string[] = [];

    if (tokens.length > 0) {
      tokens.forEach((t) => {
        if (SKU_REGEX.test(t)) {
          orConditions.push(`product_code.ilike.%${t}%`);
        } else if (PACK_SIZE_REGEX.test(t)) {
          orConditions.push(`pack_size.ilike.%${t}%`);
        } else {
          orConditions.push(`name.ilike.%${t}%`, `brand.ilike.%${t}%`, `description.ilike.%${t}%`);
        }
      });
    }

    if (matchingCategoryIds.size > 0) {
      Array.from(matchingCategoryIds).forEach((cId) => orConditions.push(`category_id.eq.${cId}`));
    }
    if (matchingSubcategoryIds.size > 0) {
      Array.from(matchingSubcategoryIds).forEach((scId) => orConditions.push(`subcategory_id.eq.${scId}`));
    }

    if (orConditions.length > 0) {
      dbQuery = dbQuery.or(orConditions.join(','));
    }

    const { data: rawProducts, error } = await dbQuery.limit(120);
    if (error) throw error;

    const scoredProducts = (rawProducts || []).map((p: any) => {
      let score = 0;
      const pName = (p.name || '').toLowerCase();
      const pBrand = (p.brand || '').toLowerCase();
      const pDesc = (p.description || '').toLowerCase();
      const pPack = (p.pack_size || '').toLowerCase();
      const qLower = effectiveQuery.toLowerCase();

      const mrp = Number(p.mrp || 0);
      const price = Number(p.wholesale_price || 0);
      const marginPercent = mrp > price ? ((mrp - price) / mrp) * 100 : 0;
      
      const stock = p.stock_quantity || 0;
      const moq = p.moq || p.min_order_quantity || 1;
      const isEffectivelyInStock = stock >= moq;

      if (pName === qLower || pName.includes(` ${qLower} `)) score += 1000;
      if (p.product_code?.toLowerCase() === qLower) score += 2000;

      const allTokensMatch = rawTokens.every(t => pName.includes(t) || pBrand.includes(t) || (dict.synonyms[t] && dict.synonyms[t].some(s => pName.includes(s))));
      if (allTokensMatch) score += 500;

      if (pName.startsWith(qLower)) score += 300;
      if (pBrand.startsWith(qLower)) score += 250;

      tokens.forEach((t) => {
        const words = pName.split(/[\s,]+/);
        if (words.includes(t)) score += 60; 
        else if (pName.includes(t)) score += 20; 
        if (pBrand.includes(t)) score += 40;
        if (pPack === t) score += 50; 
        if (pDesc.includes(t)) score += 10;
      });

      if (p.category_id && matchingCategoryIds.has(p.category_id)) score += 100;
      if (p.subcategory_id && matchingSubcategoryIds.has(p.subcategory_id)) score += 150;

      if (isEffectivelyInStock) score += 150; 
      else score -= 500; 
      
      score += marginPercent; 
      score += Number(p.rating || 0) * 15;

      return {
        product: {
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: p.category_id,
          mrp,
          price,
          packSize: p.pack_size || '',
          moq,
          image: p.image_url || (p.image_urls && p.image_urls[0]) || '',
          rating: Number(p.rating || 4.5),
          inStock: isEffectivelyInStock,
          description: p.description || '',
          hsn_code: p.hsn_code,
          gst_percentage: p.gst_percentage,
        } as Product,
        score,
      };
    });

    scoredProducts.sort((a, b) => b.score - a.score);
    
    let matchedProducts = scoredProducts.map((sp) => sp.product);
    if (filter?.inStockOnly) {
      matchedProducts = matchedProducts.filter(p => p.inStock);
    }

    const matchedIds = new Set(matchedProducts.map((p) => p.id));
    const matchedBrandNames = new Set(matchedProducts.map((p) => (p.brand || '').toLowerCase().trim()).filter(Boolean));
    const primaryCatIds = Array.from(new Set(matchedProducts.map((p) => p.category).filter(Boolean)));

    let alternativeProducts: Product[] = [];
    if (primaryCatIds.length > 0) {
      const { data: rawAlt } = await supabase.from('products').select('*').eq('is_active', true).in('category_id', primaryCatIds.slice(0, 3)).limit(20);

      alternativeProducts = (rawAlt || [])
        .filter((p: any) => {
           const stock = p.stock_quantity || 0;
           const moq = p.moq || p.min_order_quantity || 1;
           return !matchedIds.has(p.id) && !matchedBrandNames.has((p.brand || '').toLowerCase()) && (stock >= moq);
        })
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
          inStock: true,
          description: p.description || '',
        }));
    }

    const relatedSlugs: RelatedSlugItem[] = [];
    const seenSlugs = new Set<string>();

    for (const cat of dict.categories) {
      if (primaryCatIds.includes(cat.id) || matchingCategoryIds.has(cat.id)) {
        if (!seenSlugs.has(cat.slug)) {
          seenSlugs.add(cat.slug);
          relatedSlugs.push({ name: cat.name, slug: cat.slug, type: 'category', id: cat.id });
        }
      }
    }

    for (const sc of dict.subcategories) {
      if (matchingSubcategoryIds.has(sc.id) || (sc.categoryId && primaryCatIds.includes(sc.categoryId))) {
        if (!seenSlugs.has(sc.slug)) {
          seenSlugs.add(sc.slug);
          relatedSlugs.push({ name: sc.name, slug: sc.slug, type: 'subcategory', id: sc.id });
        }
      }
    }

    const [bannerRes, trendingRes] = await Promise.all([
      supabase.from('home_banners').select('*').eq('is_active', true).order('display_order', { ascending: true }).limit(6),
      supabase.from('products').select('*').eq('is_active', true).order('rating', { ascending: false }).limit(10),
    ]);

    const promoBanners: PromoBanner[] = (bannerRes.data || []).map((b: any) => ({
      id: b.id, title: b.title, description: b.description || '', imageUrl: b.image_url || '',
      backgroundColor: b.background_color || b.bg_color || '#02402c', buttonText: b.button_text || 'Shop now',
      badge: b.badge || '', position: b.position || 'carousel', actionType: b.action_type || 'OPEN_SCREEN', actionConfig: b.action_config || {},
    }));

    const topBanner = promoBanners.find((b) => b.position === 'top') || promoBanners[0] || null;
    const middleBanners = promoBanners.filter((b) => b.position === 'carousel' || b.position === 'middle');

    const trendingProducts: Product[] = (trendingRes.data || []).map((p: any) => {
      const stock = p.stock_quantity || 0;
      const moq = p.moq || p.min_order_quantity || 1;
      return {
        id: p.id, name: p.name, brand: p.brand, category: p.category_id, mrp: Number(p.mrp || 0), price: Number(p.wholesale_price || 0),
        packSize: p.pack_size || '', moq, image: p.image_url || (p.image_urls && p.image_urls[0]) || '', rating: Number(p.rating || 4.5),
        inStock: stock >= moq, description: p.description || '',
      };
    });

    return {
      products: matchedProducts,
      totalCount: matchedProducts.length,
      didYouMean: analysis.didYouMean, 
      alternativeBrandProducts: alternativeProducts.slice(0, 10),
      relatedSlugs: relatedSlugs.slice(0, 8),
      matchedCategory: primaryCategory,
      allCategories: dict.categories,
      trendingProducts,
      topBanner,
      middleBanners: middleBanners.length > 0 ? middleBanners : promoBanners.slice(0, 3),
    };
  } catch (err) {
    console.error('Advanced search query failed:', err);
    return { products: [], totalCount: 0, didYouMean: null, alternativeBrandProducts: [], relatedSlugs: [], matchedCategory: null, allCategories: dict.categories || [], trendingProducts: [], topBanner: null, middleBanners: [] };
  }
}
