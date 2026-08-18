// services/catalog.ts
import { supabase } from '@/lib/supabase';
import type {
  Product,
  Category,
  PromoBanner,
  Order,
  FilterConfig,
  HomeBanner,
  ActionType,
  Store,
  TrustedBrand,
  SmartCollection,
  VolumePricingTier,
  PromoCode,
  DeliveryZone,
  DeliveryCharge,
  CartItem,
} from '@/types';
import { StoreConfig } from '@/types/storeConfig';

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export interface DbProduct {
  id: string;
  category_id: string;
  brand: string;
  name: string;
  slug: string;
  pack_size: string;
  mrp: number;
  wholesale_price: number;
  moq: number;
  stock_quantity: number;
  image_url: string;
  description: string;
  rating: number;
  is_active: boolean;
  hsn_code?: string;
  gst_percentage?: number;
}

export interface DbOrder {
  id: string;
  order_number: string;
  user_id: string;
  address_id: string | null;
  status: string;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  notes: string;
  created_at: string;
  gst_amount?: number;
  promo_code_id?: string | null;
  promo_discount?: number;
  delivery_zone_id?: string | null;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  brand: string;
  product_name: string;
  pack_size: string;
  unit_price: number;
  mrp: number;
  quantity: number;
  line_total: number;
}

export interface DbAddress {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
  is_default: boolean;
  created_at: string;
}

const categoryColors = [
  'bg-brand-50',
  'bg-amber-50',
  'bg-orange-50',
  'bg-yellow-50',
  'bg-rose-50',
  'bg-red-50',
  'bg-sky-50',
  'bg-blue-50',
  'bg-teal-50',
  'bg-emerald-50',
  'bg-indigo-50',
  'bg-purple-50',
];

const PLACEHOLDER_CATEGORY = 'https://placehold.co/600x400/EEE/999?text=Category';
const PLACEHOLDER_PRODUCT = 'https://placehold.co/400x400/EEE/999?text=Product';

export function mapCategory(db: DbCategory, index: number, productCount?: number): Category {
  return {
    id: db.slug,
    name: db.name,
    image: db.image_url?.trim() ? db.image_url : PLACEHOLDER_CATEGORY,
    count: productCount ?? 0,
    color: categoryColors[index % categoryColors.length],
  };
}

export function mapProduct(db: DbProduct, categoryId: string): Product {
  return {
    id: db.id,
    brand: db.brand,
    name: db.name,
    packSize: db.pack_size,
    mrp: Number(db.mrp),
    price: Number(db.wholesale_price),
    image: db.image_url?.trim() ? db.image_url : PLACEHOLDER_PRODUCT,
    category: categoryId,
    moq: db.moq,
    rating: Number(db.rating),
    description: db.description,
    inStock: db.stock_quantity > 0,
    hsn_code: db.hsn_code || '',
    gst_percentage: db.gst_percentage || 0,
  };
}

const bgMap: Record<string, string> = {
  brand: 'bg-gradient-to-br from-brand-700 to-brand-900',
  accent: 'bg-gradient-to-br from-accent-500 to-accent-700',
  ink: 'bg-gradient-to-br from-ink-800 to-ink-900',
};

export function mapOrder(db: DbOrder, items: DbOrderItem[]): Order {
  const statusMap: Record<string, Order['status']> = {
    pending: 'Processing',
    confirmed: 'Processing',
    packed: 'Processing',
    ready_for_pickup: 'Processing',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return {
    id: db.id,
    orderNo: db.order_number,
    date: new Date(db.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    total: Number(db.total),
    status: statusMap[db.status] ?? 'Processing',
    items: items.map((i) => `${i.brand} ${i.product_name}`),
  };
}

// ----- FETCH CATEGORIES -----
export async function fetchCategories(): Promise<{ categories: Category[]; slugMap: Record<string, string> }> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  const slugMap: Record<string, string> = {};
  const categories = (data as DbCategory[]).map((c, i) => {
    slugMap[c.id] = c.slug;
    return mapCategory(c, i);
  });
  return { categories, slugMap };
}

// ----- FETCH PRODUCTS -----
export async function fetchProducts(): Promise<{ products: Product[]; categoryMap: Record<string, string> }> {
  const { data: catData } = await supabase
    .from('categories')
    .select('id, slug')
    .eq('is_active', true);
  const categoryMap: Record<string, string> = {};
  (catData as DbCategory[] | null)?.forEach((c) => {
    categoryMap[c.id] = c.slug;
  });

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const products = (data as DbProduct[]).map((p) =>
    mapProduct(p, categoryMap[p.category_id] ?? '')
  );
  return { products, categoryMap };
}

// ----- FETCH PRODUCT BY ID -----
export async function fetchProductById(id: string): Promise<{ product: Product; related: Product[] } | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  const dbProduct = data as DbProduct;

  const { data: catData } = await supabase
    .from('categories')
    .select('id, slug')
    .eq('id', dbProduct.category_id)
    .maybeSingle();
  const categorySlug = (catData as DbCategory | null)?.slug ?? '';

  const product = mapProduct(dbProduct, categorySlug);

  const { data: relatedData } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', dbProduct.category_id)
    .eq('is_active', true)
    .neq('id', id)
    .limit(6);
  const related = (relatedData as DbProduct[] | null)?.map((p) =>
    mapProduct(p, categorySlug)
  ) ?? [];

  return { product, related };
}

// ----- WISHLIST -----
export async function fetchWishlist(): Promise<string[]> {
  const { data, error } = await supabase.from('wishlists').select('product_id');
  if (error) return [];
  return (data as { product_id: string }[]).map((r) => r.product_id);
}

export async function toggleWishlist(productId: string, isWishlisted: boolean): Promise<void> {
  if (isWishlisted) {
    await supabase.from('wishlists').delete().eq('product_id', productId);
  } else {
    await supabase.from('wishlists').insert({ product_id: productId });
  }
}

// ----- ADDRESSES -----
export async function fetchAddresses(): Promise<DbAddress[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) return [];
  return data as DbAddress[];
}

export async function deleteAddress(id: string): Promise<void> {
  await supabase.from('addresses').delete().eq('id', id);
}

// ----- ORDERS -----
export async function fetchOrders(): Promise<Order[]> {
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (orderError || !orderData) return [];

  const orderIds = (orderData as DbOrder[]).map((o) => o.id);
  if (orderIds.length === 0) return [];

  const { data: itemData } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds);
  const itemsByOrder: Record<string, DbOrderItem[]> = {};
  (itemData as DbOrderItem[] | null)?.forEach((item) => {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
    itemsByOrder[item.order_id].push(item);
  });

  return (orderData as DbOrder[]).map((o) =>
    mapOrder(o, itemsByOrder[o.id] ?? [])
  );
}

export async function fetchOrderDetail(
  orderId: string
): Promise<{ order: DbOrder; items: DbOrderItem[]; address: DbAddress | null } | null> {
  const { data: order, error: oe } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();
  if (oe || !order) return null;
  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);
  let address: DbAddress | null = null;
  if ((order as DbOrder).address_id) {
    const { data: addr } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', (order as DbOrder).address_id)
      .maybeSingle();
    address = addr as DbAddress | null;
  }
  return { order: order as DbOrder, items: (items as DbOrderItem[]) ?? [], address };
}

export async function placeOrder(
  addressId: string,
  items: { product_id: string; quantity: number }[],
  promoCode?: string | null,
  deliveryZoneId?: string | null
): Promise<string | null> {
  const { data, error } = await supabase.rpc('create_order', {
    p_address_id: addressId,
    p_items: items,
    p_promo_code: promoCode || null,
    p_delivery_zone_id: deliveryZoneId || null,
  });
  if (error) throw error;
  return data as string;
}

export async function clearCartItems(cartId: string): Promise<void> {
  await supabase.from('cart_items').delete().eq('cart_id', cartId);
}

// ----- PROFILE -----
export async function fetchProfile() {
  const { data, error } = await supabase.from('profiles').select('*').maybeSingle();
  if (error) return null;
  return data;
}

export async function updateProfile(updates: {
  full_name?: string;
  business_name?: string;
  avatar_url?: string;
  personal_name?: string;
  registration_status?: 'unregistered' | 'registered';
}) {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', (await supabase.auth.getUser()).data.user?.id);
  if (error) throw error;
}

// ----- HOME BANNERS -----
export interface DbHomeBanner {
  id: string;
  badge: string | null;
  title: string;
  description: string;
  image_url: string;
  background_color: string;
  button_text: string;
  action_type: string;
  action_config: Record<string, unknown>;
  display_order: number;
  is_active: boolean;
  position: string;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
  bg_type: string | null;
  bg_color: string | null;
  bg_gradient: string | null;
  overlay_enabled: boolean | null;
  overlay_color: string | null;
  overlay_opacity: number | null;
  show_cta: boolean | null;
}

export function mapHomeBanner(db: DbHomeBanner): PromoBanner {
  return {
    id: db.id,
    headline: db.title,
    subtext: db.description,
    cta: db.button_text,
    image: db.image_url,
    bgClass: bgMap[db.background_color] ?? bgMap.brand,
    textClass: 'text-white',
    badge: db.badge ?? undefined,
    actionType: db.action_type,
    actionConfig: db.action_config,
    position: db.position || 'top',
    background_color: db.background_color,
    bgType: (db.bg_type as 'color' | 'image' | 'gradient') || 'color',
    bgColor: db.bg_color ?? undefined,
    bgGradient: db.bg_gradient ?? undefined,
    overlayEnabled: db.overlay_enabled ?? false,
    overlayColor: db.overlay_color ?? undefined,
    overlayOpacity: db.overlay_opacity ?? 0,
    showCta: db.show_cta !== undefined ? db.show_cta : true,
  };
}

export async function fetchHomeBanners(): Promise<PromoBanner[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('home_banners')
    .select('*')
    .eq('is_active', true)
    .or(`start_at.is.null,start_at.lte.${now}`)
    .or(`end_at.is.null,end_at.gte.${now}`)
    .order('display_order');
  if (error || !data) return [];
  return (data as DbHomeBanner[]).map(mapHomeBanner);
}

export async function fetchAllHomeBanners(): Promise<HomeBanner[]> {
  const { data, error } = await supabase
    .from('home_banners')
    .select('*')
    .order('display_order');
  if (error || !data) return [];
  return data as HomeBanner[];
}

export async function createHomeBanner(
  input: Omit<HomeBanner, 'id' | 'created_at' | 'updated_at'>
): Promise<HomeBanner | null> {
  const { data, error } = await supabase
    .from('home_banners')
    .insert({
      badge: input.badge,
      title: input.title,
      description: input.description,
      image_url: input.image_url,
      background_color: input.background_color,
      button_text: input.button_text,
      action_type: input.action_type,
      action_config: input.action_config,
      display_order: input.display_order,
      is_active: input.is_active,
      position: input.position || 'top',
      start_at: input.start_at,
      end_at: input.end_at,
      bg_type: input.bg_type,
      bg_color: input.bg_color,
      bg_gradient: input.bg_gradient,
      overlay_enabled: input.overlay_enabled,
      overlay_color: input.overlay_color,
      overlay_opacity: input.overlay_opacity,
      show_cta: input.show_cta,
    })
    .select()
    .single();
  if (error) throw error;
  return data as HomeBanner;
}

export async function updateHomeBanner(id: string, updates: Partial<HomeBanner>): Promise<void> {
  const { error } = await supabase
    .from('home_banners')
    .update({
      badge: updates.badge,
      title: updates.title,
      description: updates.description,
      image_url: updates.image_url,
      background_color: updates.background_color,
      button_text: updates.button_text,
      action_type: updates.action_type,
      action_config: updates.action_config,
      display_order: updates.display_order,
      is_active: updates.is_active,
      position: updates.position || 'top',
      start_at: updates.start_at,
      end_at: updates.end_at,
      bg_type: updates.bg_type,
      bg_color: updates.bg_color,
      bg_gradient: updates.bg_gradient,
      overlay_enabled: updates.overlay_enabled,
      overlay_color: updates.overlay_color,
      overlay_opacity: updates.overlay_opacity,
      show_cta: updates.show_cta,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteHomeBanner(id: string): Promise<void> {
  await supabase.from('home_banners').delete().eq('id', id);
}

export async function duplicateHomeBanner(id: string): Promise<HomeBanner | null> {
  const { data: original } = await supabase
    .from('home_banners')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!original) return null;
  const orig = original as DbHomeBanner;
  const { data, error } = await supabase
    .from('home_banners')
    .insert({
      badge: orig.badge,
      title: orig.title + ' (Copy)',
      description: orig.description,
      image_url: orig.image_url,
      background_color: orig.background_color,
      button_text: orig.button_text,
      action_type: orig.action_type,
      action_config: orig.action_config,
      display_order: orig.display_order + 1,
      is_active: false,
      position: orig.position || 'top',
      start_at: null,
      end_at: null,
      bg_type: orig.bg_type,
      bg_color: orig.bg_color,
      bg_gradient: orig.bg_gradient,
      overlay_enabled: orig.overlay_enabled,
      overlay_color: orig.overlay_color,
      overlay_opacity: orig.overlay_opacity,
      show_cta: orig.show_cta,
    })
    .select()
    .single();
  if (error) throw error;
  return data as HomeBanner;
}

// ----- FILTERED PRODUCTS -----
export async function fetchFilteredProducts(filter: FilterConfig): Promise<Product[]> {
  const { data: catData } = await supabase
    .from('categories')
    .select('id, slug')
    .eq('is_active', true);
  const categoryMap: Record<string, string> = {};
  const slugToIdMap: Record<string, string> = {};
  (catData as DbCategory[] | null)?.forEach((c) => {
    categoryMap[c.id] = c.slug;
    slugToIdMap[c.slug] = c.id;
  });

  let query = supabase.from('products').select('*').eq('is_active', true);

  if (filter.category_ids && filter.category_ids.length > 0) {
    const catIds = filter.category_ids.map((id) => slugToIdMap[id] ?? id);
    query = query.in('category_id', catIds);
  }
  if (filter.brand_ids && filter.brand_ids.length > 0) {
    query = query.in('brand', filter.brand_ids);
  }
  if (filter.product_ids && filter.product_ids.length > 0) {
    query = query.in('id', filter.product_ids);
  }
  if (filter.stock_only) {
    query = query.gt('stock_quantity', 0);
  }
  if (typeof filter.price_min === 'number') {
    query = query.gte('wholesale_price', filter.price_min);
  }
  if (typeof filter.price_max === 'number') {
    query = query.lte('wholesale_price', filter.price_max);
  }

  const sortMap: Record<string, string> = {
    discount_desc: 'created_at',
    discount_asc: 'created_at',
    price_asc: 'wholesale_price',
    price_desc: 'wholesale_price',
    rating_desc: 'rating',
    newest: 'created_at',
  };
  const ascending = filter.sort === 'price_asc' || filter.sort === 'rating_desc';
  query = query.order(sortMap[filter.sort ?? 'newest'] ?? 'created_at', { ascending });

  const { data, error } = await query.limit(100);
  if (error) throw error;

  let products = (data as DbProduct[]).map((p) =>
    mapProduct(p, categoryMap[p.category_id] ?? '')
  );

  if (typeof filter.discount_min === 'number' || typeof filter.discount_max === 'number') {
    products = products.filter((p) => {
      const discount = p.mrp > 0 ? ((p.mrp - p.price) / p.mrp) * 100 : 0;
      if (typeof filter.discount_min === 'number' && discount < filter.discount_min)
        return false;
      if (typeof filter.discount_max === 'number' && discount > filter.discount_max)
        return false;
      return true;
    });
  }

  if (filter.sort === 'discount_desc') {
    products.sort((a, b) => {
      const da = a.mrp > 0 ? ((a.mrp - a.price) / a.mrp) * 100 : 0;
      const db = b.mrp > 0 ? ((b.mrp - b.price) / b.mrp) * 100 : 0;
      return db - da;
    });
  } else if (filter.sort === 'discount_asc') {
    products.sort((a, b) => {
      const da = a.mrp > 0 ? ((a.mrp - a.price) / a.mrp) * 100 : 0;
      const db = b.mrp > 0 ? ((b.mrp - b.price) / b.mrp) * 100 : 0;
      return da - db;
    });
  }

  return products;
}

export async function fetchAllBrands(): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('brand')
    .eq('is_active', true);
  if (error || !data) return [];
  const brands = new Set((data as { brand: string }[]).map((r) => r.brand));
  return Array.from(brands).sort();
}

// ----- STORES (UPDATED) -----
export async function fetchStores(): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) return [];
  return data as Store[];
}

export async function fetchAllStores(): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('sort_order');
  if (error) return [];
  return data as Store[];
}

// UPDATED: include all new fields
export async function createStore(
  input: Omit<Store, 'id' | 'created_at' | 'updated_at'>
): Promise<Store | null> {
  const { data, error } = await supabase
    .from('stores')
    .insert({
      name: input.name,
      image_url: input.image_url,
      banner_image_url: input.banner_image_url,
      description: input.description,
      primary_color: input.primary_color,
      secondary_color: input.secondary_color,
      text_color: input.text_color,
      border_color: input.border_color,
      button_style: input.button_style,
      product_ids: input.product_ids,
      sort_order: input.sort_order,
      is_active: input.is_active,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Store;
}

// UPDATED: include all new fields
export async function updateStore(id: string, updates: Partial<Store>): Promise<void> {
  const { error } = await supabase
    .from('stores')
    .update({
      name: updates.name,
      image_url: updates.image_url,
      banner_image_url: updates.banner_image_url,
      description: updates.description,
      primary_color: updates.primary_color,
      secondary_color: updates.secondary_color,
      text_color: updates.text_color,
      border_color: updates.border_color,
      button_style: updates.button_style,
      product_ids: updates.product_ids,
      sort_order: updates.sort_order,
      is_active: updates.is_active,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteStore(id: string): Promise<void> {
  await supabase.from('stores').delete().eq('id', id);
}

export async function fetchStoreById(id: string): Promise<Store> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Store;
}

export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', ids)
    .order('name');
  if (error) throw error;
  return data as Product[];
}

// ----- TRUSTED BRANDS -----
export async function fetchTrustedBrands(): Promise<TrustedBrand[]> {
  const { data, error } = await supabase
    .from('trusted_brands')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) return [];
  return data as TrustedBrand[];
}

export async function fetchAllTrustedBrands(): Promise<TrustedBrand[]> {
  const { data, error } = await supabase
    .from('trusted_brands')
    .select('*')
    .order('sort_order');
  if (error) return [];
  return data as TrustedBrand[];
}

export async function createTrustedBrand(
  input: Omit<TrustedBrand, 'id' | 'created_at' | 'updated_at'>
): Promise<TrustedBrand | null> {
  const { data, error } = await supabase
    .from('trusted_brands')
    .insert({
      name: input.name,
      logo_url: input.logo_url,
      sort_order: input.sort_order,
      is_active: input.is_active,
    })
    .select()
    .single();
  if (error) throw error;
  return data as TrustedBrand;
}

export async function updateTrustedBrand(id: string, updates: Partial<TrustedBrand>): Promise<void> {
  const { error } = await supabase
    .from('trusted_brands')
    .update({
      name: updates.name,
      logo_url: updates.logo_url,
      sort_order: updates.sort_order,
      is_active: updates.is_active,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTrustedBrand(id: string): Promise<void> {
  await supabase.from('trusted_brands').delete().eq('id', id);
}

// ----- SMART COLLECTIONS -----
export async function fetchSmartCollections(): Promise<SmartCollection[]> {
  const { data, error } = await supabase
    .from('smart_collections')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as SmartCollection[];
}

export async function fetchAllSmartCollections(): Promise<SmartCollection[]> {
  const { data, error } = await supabase
    .from('smart_collections')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as SmartCollection[];
}

export async function fetchSmartCollectionById(id: string): Promise<SmartCollection | null> {
  const { data, error } = await supabase
    .from('smart_collections')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as SmartCollection | null;
}

export async function createSmartCollection(
  input: Omit<SmartCollection, 'id' | 'created_at' | 'updated_at'>
): Promise<SmartCollection | null> {
  const { data, error } = await supabase
    .from('smart_collections')
    .insert({
      name: input.name,
      description: input.description,
      filter_config: input.filter_config,
      is_active: input.is_active,
    })
    .select()
    .single();
  if (error) throw error;
  return data as SmartCollection;
}

export async function updateSmartCollection(
  id: string,
  updates: Partial<SmartCollection>
): Promise<void> {
  const { error } = await supabase
    .from('smart_collections')
    .update({
      name: updates.name,
      description: updates.description,
      filter_config: updates.filter_config,
      is_active: updates.is_active,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteSmartCollection(id: string): Promise<void> {
  await supabase.from('smart_collections').delete().eq('id', id);
}

// ================================================================
// VOLUME PRICING
// ================================================================
export async function fetchVolumePricing(productId: string): Promise<VolumePricingTier[]> {
  const { data, error } = await supabase
    .from('product_volume_pricing')
    .select('*')
    .eq('product_id', productId)
    .order('min_quantity');
  if (error) throw error;
  return data as VolumePricingTier[];
}

export async function getEffectiveUnitPrice(product: Product, quantity: number): Promise<number> {
  if (quantity < 1) return product.price;
  const tiers = await fetchVolumePricing(product.id);
  if (!tiers.length) return product.price;
  const applicable = tiers
    .filter(t => quantity >= t.min_quantity && (t.max_quantity === null || quantity <= t.max_quantity))
    .sort((a, b) => a.unit_price - b.unit_price);
  return applicable.length ? applicable[0].unit_price : product.price;
}

export async function createVolumePricingTier(
  input: Omit<VolumePricingTier, 'id' | 'created_at' | 'updated_at'>
): Promise<VolumePricingTier | null> {
  const { data, error } = await supabase.from('product_volume_pricing').insert(input).select().single();
  if (error) throw error;
  return data as VolumePricingTier;
}

export async function updateVolumePricingTier(id: string, updates: Partial<VolumePricingTier>): Promise<void> {
  const { error } = await supabase.from('product_volume_pricing').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteVolumePricingTier(id: string): Promise<void> {
  await supabase.from('product_volume_pricing').delete().eq('id', id);
}

// ================================================================
// GST
// ================================================================
export function computeGST(
  items: CartItem[],
  promoDiscount: number = 0
): {
  gstTotal: number;
  gstBreakdown: Record<number, number>;
  cgstTotal: number;
  sgstTotal: number;
} {
  const breakdown: Record<number, number> = {};
  let total = 0;
  let cgst = 0;
  let sgst = 0;

  // Total taxable before discount
  const totalTaxable = items.reduce((sum, item) => sum + item.effectiveUnitPrice * item.quantity, 0);
  const discountRatio = promoDiscount > 0 && totalTaxable > 0 ? promoDiscount / totalTaxable : 0;

  for (const item of items) {
    const rate = item.product.gst_percentage || 0;
    const taxableBeforeDiscount = item.effectiveUnitPrice * item.quantity;
    const itemDiscount = taxableBeforeDiscount * discountRatio;
    const taxableAfterDiscount = taxableBeforeDiscount - itemDiscount;
    const gst = taxableAfterDiscount * (rate / 100);
    breakdown[rate] = (breakdown[rate] || 0) + gst;
    total += gst;
    cgst += gst / 2;
    sgst += gst / 2;
  }
  return { gstTotal: total, gstBreakdown: breakdown, cgstTotal: cgst, sgstTotal: sgst };
}

// ================================================================
// PROMO CODES
// ================================================================
export async function fetchAllPromoCodes(): Promise<PromoCode[]> {
  const { data, error } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as PromoCode[];
}

export async function createPromoCode(
  input: Omit<PromoCode, 'id' | 'used_count' | 'created_at' | 'updated_at'>
): Promise<PromoCode | null> {
  const { data, error } = await supabase.from('promo_codes').insert(input).select().single();
  if (error) throw error;
  return data as PromoCode;
}

export async function updatePromoCode(id: string, updates: Partial<PromoCode>): Promise<void> {
  const { error } = await supabase.from('promo_codes').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deletePromoCode(id: string): Promise<void> {
  await supabase.from('promo_codes').delete().eq('id', id);
}

export async function validatePromoCode(
  code: string,
  subtotal: number,
  items: CartItem[]
): Promise<{ valid: boolean; discount: number; promoId?: string; error?: string }> {
  const { data: promo, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (error || !promo) return { valid: false, discount: 0, error: 'Invalid promo code' };

  const p = promo as PromoCode;
  if (!p.is_active) return { valid: false, discount: 0, error: 'Promo code is inactive' };
  if (p.start_date && new Date(p.start_date) > new Date()) return { valid: false, discount: 0, error: 'Promo code not yet active' };
  if (p.end_date && new Date(p.end_date) < new Date()) return { valid: false, discount: 0, error: 'Promo code has expired' };
  if (p.usage_limit !== null && p.used_count >= p.usage_limit) return { valid: false, discount: 0, error: 'Promo code usage limit reached' };
  if (p.min_order_value > 0 && subtotal < p.min_order_value) {
    return { valid: false, discount: 0, error: `Minimum order value ₹${p.min_order_value} required` };
  }
  // Check applies_to
  if (p.applies_to === 'category' && p.applies_to_ids?.length) {
    const itemCategories = items.map(i => i.product.category);
    const allowed = p.applies_to_ids.some(id => itemCategories.includes(id));
    if (!allowed) return { valid: false, discount: 0, error: 'Promo code does not apply to items in your cart' };
  }
  if (p.applies_to === 'product' && p.applies_to_ids?.length) {
    const productIds = items.map(i => i.product.id);
    const allowed = p.applies_to_ids.some(id => productIds.includes(id));
    if (!allowed) return { valid: false, discount: 0, error: 'Promo code does not apply to items in your cart' };
  }

  let discount = 0;
  if (p.discount_type === 'percentage') {
    discount = subtotal * (p.discount_value / 100);
    if (p.max_discount_amount && discount > p.max_discount_amount) {
      discount = p.max_discount_amount;
    }
  } else {
    discount = p.discount_value;
  }
  if (discount > subtotal) discount = subtotal;

  return { valid: true, discount, promoId: p.id };
}

// ================================================================
// DELIVERY ZONES & CHARGES (using RPC)
// ================================================================
export async function fetchDeliveryZones(): Promise<DeliveryZone[]> {
  const { data, error } = await supabase.from('delivery_zones').select('*').order('name');
  if (error) throw error;
  return data as DeliveryZone[];
}

export async function fetchAllDeliveryZones(): Promise<DeliveryZone[]> {
  return fetchDeliveryZones();
}

export async function createDeliveryZone(input: Omit<DeliveryZone, 'id' | 'created_at' | 'updated_at'>): Promise<DeliveryZone | null> {
  const { data, error } = await supabase.from('delivery_zones').insert(input).select().single();
  if (error) throw error;
  return data as DeliveryZone;
}

export async function updateDeliveryZone(id: string, updates: Partial<DeliveryZone>): Promise<void> {
  const { error } = await supabase.from('delivery_zones').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteDeliveryZone(id: string): Promise<void> {
  await supabase.from('delivery_zones').delete().eq('id', id);
}

export async function fetchDeliveryChargesForZone(zoneId: string): Promise<DeliveryCharge[]> {
  const { data, error } = await supabase
    .from('delivery_charges')
    .select('*')
    .eq('zone_id', zoneId)
    .eq('is_active', true)
    .order('min_order_value');
  if (error) throw error;
  return data as DeliveryCharge[];
}

export async function createDeliveryCharge(input: Omit<DeliveryCharge, 'id' | 'created_at' | 'updated_at'>): Promise<DeliveryCharge | null> {
  const { data, error } = await supabase.from('delivery_charges').insert(input).select().single();
  if (error) throw error;
  return data as DeliveryCharge;
}

export async function updateDeliveryCharge(id: string, updates: Partial<DeliveryCharge>): Promise<void> {
  const { error } = await supabase.from('delivery_charges').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteDeliveryCharge(id: string): Promise<void> {
  await supabase.from('delivery_charges').delete().eq('id', id);
}

// ----- GET DELIVERY CHARGE (RPC) -----
export async function getDeliveryCharge(
  pincode: string,
  subtotal: number
): Promise<{ charge: number; zoneId?: string }> {
  console.log('[getDeliveryCharge] Calling RPC with:', { pincode, subtotal });
  const { data, error } = await supabase.rpc('get_delivery_charge', {
    p_pincode: pincode,
    p_subtotal: subtotal,
  });

  console.log('[getDeliveryCharge] RPC response:', { data, error });

  if (error) {
    console.error('[getDeliveryCharge] RPC error:', error);
    return { charge: 0 };
  }

  // data is an array of rows: [{ charge, zone_id }, ...]
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn('[getDeliveryCharge] No charge returned');
    return { charge: 0 };
  }

  const firstRow = data[0];
  console.log('[getDeliveryCharge] Final charge:', firstRow.charge);
  return {
    charge: firstRow.charge,
    zoneId: firstRow.zone_id,
  };
}


// ----- DELIVERY RANGES -----
export async function fetchDeliveryRanges(): Promise<DeliveryRange[]> {
  const { data, error } = await supabase
    .from('delivery_ranges')
    .select('*')
    .order('name');
  if (error) throw error;
  return data as DeliveryRange[];
}

export async function createDeliveryRange(
  input: Omit<DeliveryRange, 'id' | 'created_at' | 'updated_at'>
): Promise<DeliveryRange | null> {
  const { data, error } = await supabase
    .from('delivery_ranges')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as DeliveryRange;
}

export async function updateDeliveryRange(
  id: string,
  updates: Partial<DeliveryRange>
): Promise<void> {
  const { error } = await supabase
    .from('delivery_ranges')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteDeliveryRange(id: string): Promise<void> {
  await supabase.from('delivery_ranges').delete().eq('id', id);
}

export async function checkPointInDeliveryRange(lat: number, lng: number): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_point_in_delivery_range', {
    p_lat: lat,
    p_lng: lng,
  });
  if (error) {
    console.error('checkPointInDeliveryRange error:', error);
    return false;
  }
  return data ?? false;
}

export async function fetchStoreConfig(storeId: string): Promise<StoreConfig> {
  const { data, error } = await supabase
    .from('stores')
    .select('config')
    .eq('id', storeId)
    .single();
  if (error) throw error;
  return data.config as StoreConfig;
}

// Update a store's config
export async function updateStoreConfig(storeId: string, config: StoreConfig): Promise<void> {
  const { error } = await supabase
    .from('stores')
    .update({ config })
    .eq('id', storeId);
  if (error) throw error;
}

// Upload image to Supabase Storage and return public URL
export async function uploadStoreImage(
  storeId: string,
  file: File,
  folder: string = 'general'
): Promise<string> {
  const fileName = `${Date.now()}_${file.name}`;
  const path = `stores/${storeId}/${folder}/${fileName}`;
  const { data, error } = await supabase.storage
    .from('store-images')
    .upload(path, file);
  if (error) throw error;
  const { data: urlData } = supabase.storage
    .from('store-images')
    .getPublicUrl(path);
  return urlData.publicUrl;
}