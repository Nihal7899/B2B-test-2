// types.ts
export interface Product {
  id: string;
  brand: string;
  name: string;
  packSize: string;
  mrp: number;
  price: number;
  image: string;
  category: string;
  moq: number;
  rating: number;
  description: string;
  inStock: boolean;
  hsn_code?: string;
  gst_percentage?: number;
}

export interface VolumePricingTier {
  id: string;
  product_id: string;
  min_quantity: number;
  max_quantity: number | null;
  unit_price: number;
  discount_percent: number | null;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount_amount: number | null;
  applies_to: 'all' | 'category' | 'product';
  applies_to_ids: string[];
  start_date: string | null;
  end_date: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  pincodes: string[];
  created_at: string;
  updated_at: string;
}

export interface DeliveryCharge {
  id: string;
  zone_id: string;
  min_order_value: number | null;
  max_order_value: number | null;
  charge: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  count: number;
  color: string;
}

// types.ts (add this field inside PromoBanner)
export interface PromoBanner {
  id: string;
  headline: string;
  subtext: string;
  cta: string;
  image: string;
  bgClass: string;
  textClass: string;
  badge?: string;
  actionType?: string;
  actionConfig?: Record<string, unknown>;
  position?: string; // 'top' | 'carousel' | 'middle' | 'bottom'
  background_color?: string; // 👈 add this
  bgType?: 'color' | 'image' | 'gradient';
  bgColor?: string;
  bgGradient?: string;
  overlayEnabled?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  showCta?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  effectiveUnitPrice: number; // after volume pricing
}


export interface Order {
  id: string;
  orderNo: string;
  date: string;
  itemCount: number;
  total: number;
  status: 'Delivered' | 'Processing' | 'Out for Delivery' | 'Cancelled';
  items: string[];
  // New GST fields (optional)
  cgst_amount?: number;
  sgst_amount?: number;
}

export type ScreenName =
  | 'home'
  | 'categories'
  | 'orders'
  | 'cart'
  | 'account'
  | 'product'
  | 'admin'
  | 'warehouse'
  | 'delivery'
  | 'addresses'
  | 'wishlist'
  | 'checkout'
  | 'orderDetail'
  | 'businessRegistration'
  | 'businessSelect'
  | 'outletSelect'
  | 'filteredProducts';

export interface Business {
  id: string;
  owner_user_id: string;
  business_name: string;
  business_type: string;
  gst_registered: boolean;
  gstin: string | null;
  gst_verification_status: 'pending' | 'verified' | 'failed';
  gst_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessOutlet {
  id: string;
  business_id: string;
  outlet_name: string;
  outlet_type: string | null;
  phone: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryAddress {
  id: string;
  user_id: string;
  business_id: string | null;
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
  updated_at: string;
}

export type ActionType =
  | 'VIEW_CATEGORY'
  | 'VIEW_PRODUCT'
  | 'VIEW_BRAND'
  | 'VIEW_OFFER'
  | 'SEARCH'
  | 'FILTER_PRODUCTS'
  | 'OPEN_SMART_COLLECTION'
  | 'OPEN_CART'
  | 'OPEN_ORDERS'
  | 'OPEN_WISHLIST'
  | 'OPEN_ADDRESS'
  | 'OPEN_SCREEN'
  | 'OPEN_EXTERNAL_URL';

export interface FilterConfig {
  category_ids?: string[];
  brand_ids?: string[];
  product_ids?: string[];
  discount_min?: number | null;
  discount_max?: number | null;
  price_min?: number | null;
  price_max?: number | null;
  stock_only?: boolean;
  min_quantity?: number | null;
  availability?: 'available' | 'all';
  sort?: 'discount_desc' | 'discount_asc' | 'price_asc' | 'price_desc' | 'rating_desc' | 'newest';
}

export interface HomeBanner {
  id: string;
  badge: string | null;
  title: string;
  description: string;
  image_url: string;
  background_color: string;
  button_text: string;
  action_type: ActionType;
  action_config: Record<string, unknown>;
  display_order: number;
  is_active: boolean;
  position: string; // 'top' | 'carousel' | 'middle' | 'bottom'
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
  bg_type?: 'color' | 'image' | 'gradient';
  bg_color?: string;          // hex colour
  bg_gradient?: string;       // e.g. 'from-blue-500 to-purple-500'
  overlay_enabled?: boolean;
  overlay_color?: string;
  overlay_opacity?: number;   // 0-100
  show_cta?: boolean;
}

export interface SmartCollection {
  id: string;
  name: string;
  description: string;
  filter_config: FilterConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// types.ts – add this to the Store interface
export interface Store {
  id: string;
  name: string;
  image_url: string;
  banner_image_url?: string;
  description: string;
  primary_color: string;
  secondary_color: string;
  text_color: string;
  border_color: string;
  button_style: 'brand' | 'outline' | 'ghost';
  product_ids: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  config?: any; // <-- add this
}

export interface TrustedBrand {
  id: string;
  name: string;
  logo_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryRange {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}