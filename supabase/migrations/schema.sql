-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL DEFAULT ''::text,
  phone text NOT NULL DEFAULT ''::text,
  business_name text NOT NULL DEFAULT ''::text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  personal_name text,
  registration_status text NOT NULL DEFAULT 'unregistered'::text CHECK (registration_status = ANY (ARRAY['unregistered'::text, 'registered'::text])),
  staff_registration_status text NOT NULL DEFAULT 'unregistered'::text CHECK (staff_registration_status = ANY (ARRAY['unregistered'::text, 'registered'::text])),
  current_cod_balance numeric NOT NULL DEFAULT 0 CHECK (current_cod_balance >= 0::numeric),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_roles (
  user_id uuid NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'customer'::app_role,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  image_url text NOT NULL DEFAULT ''::text,
  description text NOT NULL DEFAULT ''::text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  gradient text,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid,
  brand text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  pack_size text NOT NULL,
  mrp numeric NOT NULL CHECK (mrp >= 0::numeric),
  wholesale_price numeric NOT NULL,
  moq integer NOT NULL DEFAULT 1 CHECK (moq > 0 AND moq <= 10000),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url text NOT NULL DEFAULT ''::text,
  description text NOT NULL DEFAULT ''::text,
  rating numeric NOT NULL DEFAULT 0 CHECK (rating >= 0::numeric AND rating <= 5::numeric),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  discount_percentage numeric DEFAULT 0,
  is_available boolean DEFAULT true,
  min_order_quantity integer DEFAULT 1,
  brand_id uuid,
  hsn_code text,
  gst_percentage numeric DEFAULT 0 CHECK (gst_percentage >= 0::numeric AND gst_percentage <= 100::numeric),
  product_code text UNIQUE,
  subcategory_id uuid,
  image_urls ARRAY DEFAULT '{}'::text[],
  stock_threshold integer NOT NULL DEFAULT 0,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT products_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id)
);
CREATE TABLE public.promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  headline text NOT NULL,
  subtext text NOT NULL DEFAULT ''::text,
  cta_label text NOT NULL DEFAULT 'Shop now'::text,
  image_url text NOT NULL DEFAULT ''::text,
  background text NOT NULL DEFAULT 'brand'::text,
  badge text NOT NULL DEFAULT ''::text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  start_at timestamp with time zone,
  end_at timestamp with time zone,
  action_type text NOT NULL DEFAULT 'OPEN_SCREEN'::text,
  action_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT promotions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.wishlists (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  product_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wishlists_pkey PRIMARY KEY (user_id, product_id),
  CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT wishlists_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.carts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT carts_pkey PRIMARY KEY (id),
  CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.cart_items (
  cart_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity >= 1 AND quantity <= 10000),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (cart_id, product_id),
  CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id),
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  label text NOT NULL DEFAULT 'Business'::text,
  recipient_name text NOT NULL,
  phone text NOT NULL,
  line1 text NOT NULL,
  line2 text NOT NULL DEFAULT ''::text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  latitude numeric,
  longitude numeric,
  place_id text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  business_id uuid,
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT addresses_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number text NOT NULL DEFAULT ((('SK-'::text || to_char(now(), 'YYYY'::text)) || '-'::text) || upper(substr(replace((gen_random_uuid())::text, '-'::text, ''::text), 1, 8))) UNIQUE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  address_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::order_status,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  delivery_fee numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  delivery_address_snapshot jsonb,
  billing_address_snapshot jsonb,
  business_snapshot jsonb,
  gst_amount numeric DEFAULT 0,
  promo_code_id uuid,
  promo_discount numeric DEFAULT 0,
  delivery_zone_id uuid,
  cgst_amount numeric DEFAULT 0,
  sgst_amount numeric DEFAULT 0,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id),
  CONSTRAINT orders_promo_code_id_fkey FOREIGN KEY (promo_code_id) REFERENCES public.promo_codes(id),
  CONSTRAINT orders_delivery_zone_id_fkey FOREIGN KEY (delivery_zone_id) REFERENCES public.delivery_zones(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid,
  brand text NOT NULL,
  product_name text NOT NULL,
  pack_size text NOT NULL,
  unit_price numeric NOT NULL CHECK (unit_price >= 0::numeric),
  mrp numeric NOT NULL CHECK (mrp >= 0::numeric),
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total numeric NOT NULL CHECK (line_total >= 0::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  hsn_code text,
  gst_percentage numeric DEFAULT 0,
  product_code text,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.delivery_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE,
  delivery_partner_id uuid,
  pickup_notes text NOT NULL DEFAULT ''::text,
  status USER-DEFINED NOT NULL DEFAULT 'ready_for_pickup'::order_status,
  picked_up_at timestamp with time zone,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT delivery_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_assignments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT delivery_assignments_delivery_partner_id_fkey FOREIGN KEY (delivery_partner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  provider text NOT NULL DEFAULT 'razorpay'::text,
  provider_order_id text,
  provider_payment_id text,
  amount numeric NOT NULL CHECK (amount >= 0::numeric),
  status USER-DEFINED NOT NULL DEFAULT 'pending'::payment_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.businesses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL DEFAULT auth.uid(),
  business_name text NOT NULL,
  business_type text,
  gst_registered boolean NOT NULL DEFAULT false,
  gstin text,
  gst_verification_status text NOT NULL DEFAULT 'pending'::text CHECK (gst_verification_status = ANY (ARRAY['pending'::text, 'verified'::text, 'failed'::text])),
  gst_verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT businesses_pkey PRIMARY KEY (id),
  CONSTRAINT businesses_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.business_outlets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  outlet_name text NOT NULL,
  outlet_type text,
  phone text,
  address_line_1 text NOT NULL,
  address_line_2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  landmark text,
  latitude numeric,
  longitude numeric,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT business_outlets_pkey PRIMARY KEY (id),
  CONSTRAINT business_outlets_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);
CREATE TABLE public.home_banners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  badge text,
  title text NOT NULL,
  description text NOT NULL DEFAULT ''::text,
  image_url text DEFAULT ''::text,
  background_color text NOT NULL DEFAULT 'brand'::text,
  button_text text NOT NULL DEFAULT 'Shop now'::text,
  action_type text NOT NULL DEFAULT 'OPEN_SCREEN'::text,
  action_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT false,
  start_at timestamp with time zone,
  end_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  position text DEFAULT 'top'::text CHECK ("position" = ANY (ARRAY['top'::text, 'top_slider'::text, 'carousel'::text, 'middle'::text, 'middle_1'::text, 'middle_2'::text, 'middle_3'::text, 'bottom'::text])),
  bg_type text DEFAULT 'color'::text,
  bg_color text DEFAULT '#16a34a'::text,
  bg_gradient text DEFAULT 'from-brand-600 to-brand-800'::text,
  overlay_enabled boolean DEFAULT false,
  overlay_color text DEFAULT '#000000'::text,
  overlay_opacity integer DEFAULT 50,
  show_cta boolean DEFAULT true,
  size text DEFAULT 'medium'::text CHECK (size = ANY (ARRAY['small'::text, 'medium'::text, 'large'::text])),
  gradient_from text DEFAULT '#065f46'::text,
  gradient_to text DEFAULT '#10b981'::text,
  gradient_direction text DEFAULT 'to right'::text,
  CONSTRAINT home_banners_pkey PRIMARY KEY (id)
);
CREATE TABLE public.smart_collections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT ''::text,
  filter_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT smart_collections_pkey PRIMARY KEY (id)
);
CREATE TABLE public.stores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text NOT NULL,
  description text,
  theme_bg text NOT NULL,
  theme_border text NOT NULL,
  theme_text text NOT NULL,
  theme_accent text NOT NULL,
  product_ids jsonb NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  banner_image_url text,
  button_style text DEFAULT 'brand'::text,
  primary_color text DEFAULT '#10b981'::text,
  secondary_color text DEFAULT '#059669'::text,
  text_color text DEFAULT '#064e3b'::text,
  border_color text DEFAULT '#a7f3d0'::text,
  config jsonb DEFAULT '{"hero": {"image": "", "title": "", "ctaLink": "/categories", "ctaText": "Shop Now", "enabled": true, "subtitle": "", "ctaBgColor": "#ffffff", "gradientTo": "#16a34a", "ctaTextColor": "#065f46", "gradientFrom": "#065f46"}, "bulkDeal": {"cta": "", "tag": "", "icon": "Package", "title": "", "enabled": false, "subtitle": "", "ctaBgColor": "#ffffff", "ctaTextColor": "#065f46"}, "trending": {"title": "Top categories", "ctaText": "Browse all categories", "enabled": false, "subtitle": "Jump straight to what customers are buying most", "ctaBgColor": "#ffffff", "iconButtons": [], "ctaTextColor": "#065f46"}, "badgeText": "STORE", "badgeColor": "#fbbf24", "categories": [], "highlights": [], "tintOpacity": 50}'::jsonb,
  rating text,
  orders text,
  store_icon text,
  features jsonb DEFAULT '[]'::jsonb,
  premium_badge jsonb DEFAULT '{"icon": "Sparkles", "label": "PREMIUM", "sublabel": "QUALITY"}'::jsonb,
  badge_text text DEFAULT 'STORE'::text,
  badge_color text DEFAULT '#fbbf24'::text,
  CONSTRAINT stores_pkey PRIMARY KEY (id)
);
CREATE TABLE public.trusted_brands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  primary_color character varying DEFAULT '#3B82F6'::character varying,
  secondary_color character varying DEFAULT '#1E40AF'::character varying,
  product_images jsonb DEFAULT '[]'::jsonb,
  tagline text,
  categories ARRAY,
  bottom_label text,
  bottom_icon text CHECK (bottom_icon = ANY (ARRAY['shield'::text, 'crown'::text, 'leaf'::text])),
  description text,
  config jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT trusted_brands_pkey PRIMARY KEY (id)
);
CREATE TABLE public.product_volume_pricing (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  min_quantity integer NOT NULL CHECK (min_quantity >= 1),
  max_quantity integer,
  unit_price numeric NOT NULL CHECK (unit_price >= 0::numeric),
  discount_percent numeric CHECK (discount_percent >= 0::numeric AND discount_percent <= 100::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_volume_pricing_pkey PRIMARY KEY (id),
  CONSTRAINT product_volume_pricing_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.promo_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])),
  discount_value numeric NOT NULL CHECK (discount_value > 0::numeric),
  min_order_value numeric DEFAULT 0,
  max_discount_amount numeric,
  applies_to text DEFAULT 'all'::text CHECK (applies_to = ANY (ARRAY['all'::text, 'category'::text, 'product'::text])),
  applies_to_ids ARRAY,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT promo_codes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.promo_code_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL,
  user_id uuid NOT NULL,
  order_id uuid NOT NULL,
  used_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT promo_code_usage_pkey PRIMARY KEY (id),
  CONSTRAINT promo_code_usage_promo_code_id_fkey FOREIGN KEY (promo_code_id) REFERENCES public.promo_codes(id),
  CONSTRAINT promo_code_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT promo_code_usage_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.system_settings (
  key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT system_settings_pkey PRIMARY KEY (key)
);
CREATE TABLE public.delivery_zones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pincodes ARRAY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT delivery_zones_pkey PRIMARY KEY (id)
);
CREATE TABLE public.delivery_charges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL,
  min_order_value numeric DEFAULT 0,
  max_order_value numeric,
  charge numeric NOT NULL CHECK (charge >= 0::numeric),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT delivery_charges_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_charges_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.delivery_zones(id)
);
CREATE TABLE public.invoice_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_name text,
  company_address text,
  company_gst text,
  company_phone text,
  company_email text,
  company_logo text,
  bank_name text,
  bank_account text,
  bank_ifsc text,
  terms_conditions text,
  primary_color text DEFAULT '#1d4ed8'::text,
  color_opacity numeric DEFAULT 1,
  first_page_rows integer,
  next_page_rows integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoice_config_pkey PRIMARY KEY (id)
);
CREATE TABLE public.invoice_design (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  settings jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoice_design_pkey PRIMARY KEY (id)
);
CREATE TABLE public.delivery_ranges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  center_lat double precision NOT NULL,
  center_lng double precision NOT NULL,
  radius_km double precision NOT NULL CHECK (radius_km > 0::double precision),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT delivery_ranges_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  onesignal_player_id text NOT NULL,
  device_info jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_push_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT user_push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.push_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  sent_at timestamp with time zone DEFAULT now(),
  sent_by uuid,
  audience_count integer,
  status text DEFAULT 'sent'::text,
  image_url text,
  small_icon text,
  large_icon text,
  big_picture text,
  deep_link text,
  action_buttons jsonb,
  sound text,
  badge_count integer,
  schedule_at timestamp with time zone,
  audience text DEFAULT 'all'::text,
  CONSTRAINT push_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT push_notifications_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES auth.users(id)
);
CREATE TABLE public.subcategories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  image_url text,
  description text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subcategories_pkey PRIMARY KEY (id),
  CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.notification_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  channel_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  small_icon text,
  CONSTRAINT notification_channels_pkey PRIMARY KEY (id)
);
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT app_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.whatsapp_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  audience_type text NOT NULL DEFAULT 'all'::text,
  total_recipients integer NOT NULL DEFAULT 0,
  successful_sends integer NOT NULL DEFAULT 0,
  failed_sends integer NOT NULL DEFAULT 0,
  template_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  button_param text,
  status text NOT NULL DEFAULT 'completed'::text,
  sent_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT whatsapp_campaigns_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES auth.users(id)
);
CREATE TABLE public.whatsapp_message_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid,
  user_id uuid,
  recipient_phone text NOT NULL,
  status text NOT NULL DEFAULT 'queued'::text,
  whatsapp_message_id text,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_message_logs_pkey PRIMARY KEY (id),
  CONSTRAINT whatsapp_message_logs_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.whatsapp_campaigns(id),
  CONSTRAINT whatsapp_message_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.home_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text DEFAULT ''::text,
  section_type text NOT NULL CHECK (section_type = ANY (ARRAY['categories'::text, 'popular_products'::text, 'quick_reorder'::text, 'recently_viewed'::text, 'volume_deals'::text, 'new_arrivals'::text, 'top_rated'::text, 'limited_stock'::text, 'brand_spotlight'::text, 'deals'::text, 'essentials'::text, 'stores'::text, 'brands'::text, 'perks'::text, 'banner_slot'::text, 'custom_products'::text])),
  banner_position text DEFAULT 'middle_1'::text,
  banner_size text DEFAULT 'medium'::text CHECK (banner_size = ANY (ARRAY['small'::text, 'medium'::text, 'large'::text])),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT home_sections_pkey PRIMARY KEY (id)
);
CREATE TABLE public.whatsapp_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text DEFAULT ''::text,
  language text NOT NULL DEFAULT 'en'::text,
  has_header boolean NOT NULL DEFAULT false,
  header_type text NOT NULL DEFAULT 'NONE'::text CHECK (header_type = ANY (ARRAY['NONE'::text, 'IMAGE'::text, 'DOCUMENT'::text, 'VIDEO'::text, 'TEXT'::text])),
  body_text text NOT NULL,
  variables_config jsonb NOT NULL DEFAULT '[]'::jsonb,
  has_dynamic_button boolean NOT NULL DEFAULT false,
  button_label text DEFAULT 'Visit Website'::text,
  button_default_param text DEFAULT ''::text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_templates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0::numeric),
  currency text NOT NULL DEFAULT 'INR'::text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wallets_pkey PRIMARY KEY (id),
  CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL,
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  type text NOT NULL CHECK (type = ANY (ARRAY['credit'::text, 'debit'::text])),
  purpose text NOT NULL CHECK (purpose = ANY (ARRAY['topup'::text, 'order_payment'::text, 'refund'::text, 'cashback'::text, 'adjustment'::text])),
  reference_id text,
  description text NOT NULL DEFAULT ''::text,
  balance_after numeric NOT NULL CHECK (balance_after >= 0::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT wallet_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id),
  CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.delivery_partner_cod_settlements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  delivery_partner_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  cleared_by uuid NOT NULL,
  payment_mode text NOT NULL DEFAULT 'cash'::text CHECK (payment_mode = ANY (ARRAY['cash'::text, 'bank_transfer'::text, 'upi'::text])),
  notes text DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT delivery_partner_cod_settlements_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_partner_cod_settlements_delivery_partner_id_fkey FOREIGN KEY (delivery_partner_id) REFERENCES auth.users(id),
  CONSTRAINT delivery_partner_cod_settlements_cleared_by_fkey FOREIGN KEY (cleared_by) REFERENCES auth.users(id)
);