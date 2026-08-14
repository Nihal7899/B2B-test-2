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
  subcategory_id uuid,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
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
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id)
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
  order_id uuid NOT NULL UNIQUE,
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
  image_url text NOT NULL DEFAULT ''::text,
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
  position text DEFAULT 'top'::text CHECK ("position" = ANY (ARRAY['top'::text, 'carousel'::text, 'middle'::text, 'bottom'::text])),
  bg_type text DEFAULT 'color'::text,
  bg_color text DEFAULT '#16a34a'::text,
  bg_gradient text DEFAULT 'from-brand-600 to-brand-800'::text,
  overlay_enabled boolean DEFAULT false,
  overlay_color text DEFAULT '#000000'::text,
  overlay_opacity integer DEFAULT 50,
  show_cta boolean DEFAULT true,
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
  CONSTRAINT trusted_brands_pkey PRIMARY KEY (id)
);