import { supabase } from '@/lib/supabase';
import type { Product, PromoBanner, Category } from '@/types';

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
  promoBanners: PromoBanner[];
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
  lastFetched: number;
}

// B2B Domain Synonyms & Stems for Semantic Category Mapping
const SYNONYM_MAP: Record<string, string[]> = {
  beverage: ['beverages', 'drink', 'drinks', 'cold drink', 'soft drink', 'juice', 'soda', 'syrup', 'tea', 'coffee', 'water'],
  beverages: ['beverage', 'drinks', 'cold drink', 'soft drinks', 'juice', 'soda', 'syrups', 'tea', 'coffee'],
  drink: ['beverages', 'cold drink', 'juice', 'soft drinks'],
  drinks: ['beverages', 'cold drinks', 'juices', 'soft drinks'],
  oil: ['edible oil', 'refined oil', 'mustard oil', 'sunflower oil', 'ghee', 'cooking oil'],
  oils: ['oil', 'refined oil', 'mustard oil', 'sunflower oil', 'ghee'],
  atta: ['flour', 'wheat', 'chakki atta', 'maida', 'sooji', 'grains'],
  flour: ['atta', 'wheat', 'maida', 'besan', 'sooji', 'grains'],
  rice: ['basmati', 'kolam', 'sona masoori', 'poha', 'grains'],
  dal: ['pulses', 'toor dal', 'moong dal', 'chana dal', 'urad dal', 'legumes'],
  pulses: ['dal', 'lentils', 'legumes', 'chana', 'rajma', 'toor'],
  sugar: ['sweetener', 'jaggery', 'gur'],
  spices: ['masala', 'mirchi', 'turmeric', 'chilli', 'haldi', 'dhaniya'],
  cleaning: ['detergent', 'soap', 'floor cleaner', 'dishwash', 'cleaner'],
  dairy: ['milk', 'paneer', 'cheese', 'butter', 'curd', 'ghee'],
  snacks: ['biscuits', 'namkeen', 'chips', 'cookies', 'noodles'],
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
    const [productsRes, categoriesRes, subcategoriesRes, brandsRes] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, brand, pack_size, category_id, subcategory_id, product_code, description')
        .eq('is_active', true)
        .limit(3000),
      supabase
        .from('categories')
        .select('id, name, slug, image_url, description, gradient, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
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

// Expand keywords with domain synonyms
function expandQueryTokens(tokens: string[]): string[] {
  const expanded = new Set<string>(tokens);
  for (const t of tokens) {
    const synonyms = SYNONYM_MAP[t.toLowerCase()];
    if (synonyms) {
      synonyms.forEach((syn) => expanded.add(syn.toLowerCase()));
    }
  }
  return Array.from(expanded);
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
      matchedCategories: dict.categories.slice(0, 6),
      matchedBrands: dict.brands.slice(0, 4),
    };
  }

  const queryTokens = q.split(/\s+/).filter(Boolean);
  const expandedTokens = expandQueryTokens(queryTokens);
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

  // 1. Check Category Matches (e.g. "Beverages", "Drinks")
  for (const c of dict.categories) {
    const cLower = c.name.toLowerCase();
    const cSlug = c.slug.toLowerCase();
    if (
      cLower.includes(q) ||
      cSlug.includes(q) ||
      expandedTokens.some((t) => cLower.includes(t) || cSlug.includes(t))
    ) {
      matchedCategories.push(c);
      addUnique({
        text: c.name,
        type: 'category',
        id: c.id,
        subText: 'Category',
      });
    }
  }

  // 2. Check Subcategories
  for (const sc of dict.subcategories) {
    const scLower = sc.name.toLowerCase();
    if (scLower.includes(q) || expandedTokens.some((t) => scLower.includes(t))) {
      addUnique({
        text: sc.name,
        type: 'subcategory',
        id: sc.id,
        subText: 'Subcategory',
      });
    }
  }

  // 3. Match Brands
  let matchedBrandName: string | null = null;
  for (const b of dict.brands) {
    const bLower = b.toLowerCase();
    if (bLower === q || bLower.startsWith(q) || queryTokens.some((t) => bLower.includes(t))) {
      matchedBrandName = b;
      matchedBrands.push(b);
      addUnique({ text: b, type: 'brand', subText: 'Brand' });
    }
  }

  // 4. Compound Suggestions
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

  // 5. Product SKU Matches
  for (const p of dict.products) {
    const searchable = `${p.brand} ${p.name} ${p.packSize} ${p.productCode} ${p.description}`.toLowerCase();
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

  // 6. Fuzzy Spell Corrector
  let didYouMean: string | null = null;
  if (suggestionList.length === 0) {
    let closest: { text: string; dist: number } | null = null;

    // Check against categories first
    for (const c of dict.categories) {
      const dist = getLevenshteinDistance(q, c.name.toLowerCase());
      if (dist > 0 && dist <= 2) {
        closest = { text: c.name, dist };
        break;
      }
    }

    if (!closest) {
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
    }

    if (closest) {
      didYouMean = closest.text;
      addUnique({ text: closest.text, type: 'compound', subText: 'Did you mean this?' });
    }
  }

  return {
    didYouMean,
    suggestions: suggestionList.slice(0, 8),
    matchedCategories: matchedCategories.slice(0, 6),
    matchedBrands: matchedBrands.slice(0, 4),
  };
}

// Deep Multi-Vector Search Engine Execution
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
  const effectiveQuery = cleanQuery || analysis.didYouMean || '';

  try {
    const rawTokens = effectiveQuery.toLowerCase().split(/\s+/).filter(Boolean);
    const tokens = expandQueryTokens(rawTokens);

    // 1. Detect if the search query matches any category or subcategory
    const matchingCategoryIds = new Set<string>();
    const matchingSubcategoryIds = new Set<string>();
    let primaryCategory: Category | null = null;

    for (const cat of dict.categories) {
      const cName = cat.name.toLowerCase();
      const cSlug = cat.slug.toLowerCase();
      if (
        cName.includes(effectiveQuery.toLowerCase()) ||
        cSlug.includes(effectiveQuery.toLowerCase()) ||
        tokens.some((t) => cName.includes(t) || cSlug.includes(t))
      ) {
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

    // 2. Build multi-branch Postgres query
    let dbQuery = supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    if (filter?.categoryId) dbQuery = dbQuery.eq('category_id', filter.categoryId);
    if (filter?.brand) dbQuery = dbQuery.eq('brand', filter.brand);
    if (filter?.inStockOnly) dbQuery = dbQuery.gt('stock_quantity', 0);
    if (filter?.hasDealsOnly) dbQuery = dbQuery.gt('discount_percentage', 5);

    const orConditions: string[] = [];

    // Branch A: Direct textual token matches on products
    if (tokens.length > 0) {
      tokens.forEach((t) => {
        orConditions.push(
          `name.ilike.%${t}%`,
          `brand.ilike.%${t}%`,
          `pack_size.ilike.%${t}%`,
          `description.ilike.%${t}%`,
          `product_code.ilike.%${t}%`
        );
      });
    }

    // Branch B: Category / Subcategory ID relational matches
    if (matchingCategoryIds.size > 0) {
      Array.from(matchingCategoryIds).forEach((cId) => {
        orConditions.push(`category_id.eq.${cId}`);
      });
    }

    if (matchingSubcategoryIds.size > 0) {
      Array.from(matchingSubcategoryIds).forEach((scId) => {
        orConditions.push(`subcategory_id.eq.${scId}`);
      });
    }

    if (orConditions.length > 0) {
      dbQuery = dbQuery.or(orConditions.join(','));
    }

    const { data: rawProducts, error } = await dbQuery.limit(100);
    if (error) throw error;

    // 3. Relevance Scoring & Ranking
    const scoredProducts = (rawProducts || []).map((p: any) => {
      let score = 0;
      const pName = (p.name || '').toLowerCase();
      const pBrand = (p.brand || '').toLowerCase();
      const pDesc = (p.description || '').toLowerCase();
      const qLower = effectiveQuery.toLowerCase();

      // Highest priority: Exact or substring match in product name / brand
      if (pName.includes(qLower)) score += 100;
      if (pBrand.includes(qLower)) score += 80;

      // Medium priority: Matches any of the search tokens
      tokens.forEach((t) => {
        if (pName.includes(t)) score += 30;
        if (pBrand.includes(t)) score += 25;
        if (pDesc.includes(t)) score += 10;
      });

      // Category matching bonus
      if (p.category_id && matchingCategoryIds.has(p.category_id)) score += 50;
      if (p.subcategory_id && matchingSubcategoryIds.has(p.subcategory_id)) score += 40;

      // In stock & ratings priority
      if ((p.stock_quantity || 0) > 0) score += 15;
      score += Number(p.rating || 0) * 2;

      return {
        product: {
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
        } as Product,
        score,
      };
    });

    // Sort descending by calculated relevance score
    scoredProducts.sort((a, b) => b.score - a.score);
    const matchedProducts = scoredProducts.map((sp) => sp.product);

    // 4. Derive Alternatives from Other Brands
    const matchedIds = new Set(matchedProducts.map((p) => p.id));
    const matchedBrandNames = new Set(
      matchedProducts.map((p) => (p.brand || '').toLowerCase().trim()).filter(Boolean)
    );
    const primaryCatIds = Array.from(
      new Set(matchedProducts.map((p) => p.category).filter(Boolean))
    );

    let alternativeProducts: Product[] = [];
    if (primaryCatIds.length > 0) {
      const { data: rawAlt } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .in('category_id', primaryCatIds.slice(0, 3))
        .limit(16);

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

    // 5. Related Category / Subcategory / Brand Slugs
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

    // 6. Fetch Dynamic Home Banners & Trending Products for Screen Sections
    const [bannerRes, trendingRes] = await Promise.all([
      supabase
        .from('home_banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(4),
      supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(10),
    ]);

    const promoBanners: PromoBanner[] = (bannerRes.data || []).map((b: any) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      imageUrl: b.image_url,
      backgroundColor: b.background_color || b.bg_color || '#02402c',
      buttonText: b.button_text || 'Shop now',
      badge: b.badge,
      position: b.position,
      actionType: b.action_type,
      actionConfig: b.action_config,
    }));

    const trendingProducts: Product[] = (trendingRes.data || []).map((p: any) => ({
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

    return {
      products: matchedProducts,
      totalCount: matchedProducts.length,
      didYouMean: matchedProducts.length === 0 ? analysis.didYouMean : null,
      alternativeBrandProducts: alternativeProducts.slice(0, 10),
      relatedSlugs: relatedSlugs.slice(0, 8),
      matchedCategory: primaryCategory,
      allCategories: dict.categories,
      trendingProducts,
      promoBanners,
    };
  } catch (err) {
    console.error('Advanced search query failed:', err);
    return {
      products: [],
      totalCount: 0,
      didYouMean: null,
      alternativeBrandProducts: [],
      relatedSlugs: [],
      matchedCategory: null,
      allCategories: dict.categories || [],
      trendingProducts: [],
      promoBanners: [],
    };
  }
}
