-- 1. Dynamic Home Screen Sections Table
CREATE TABLE IF NOT EXISTS public.home_sections (
id uuid NOT NULL DEFAULT gen_random_uuid(),
title text NOT NULL,
subtitle text DEFAULT '',
section_type text NOT NULL CHECK (section_type = ANY (ARRAY[
'categories'::text,
'popular_products'::text,
'deals'::text,
'essentials'::text,
'stores'::text,
'brands'::text,
'perks'::text,
'banner_slot'::text,
'custom_products'::text
])),
banner_position text DEFAULT 'middle_1',
banner_size text DEFAULT 'medium' CHECK (banner_size = ANY (ARRAY['small'::text, 'medium'::text, 'large'::text])),
sort_order integer NOT NULL DEFAULT 0,
is_active boolean NOT NULL DEFAULT true,
config jsonb NOT NULL DEFAULT '{}'::jsonb,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT home_sections_pkey PRIMARY KEY (id)
);

-- 2. Update home_banners Constraints, Sizes, and Gradient Columns
ALTER TABLE public.home_banners
DROP CONSTRAINT IF EXISTS home_banners_position_check;

ALTER TABLE public.home_banners
ADD CONSTRAINT home_banners_position_check
CHECK ("position" = ANY (ARRAY[
'top'::text,
'carousel'::text,
'middle'::text,
'middle_1'::text,
'middle_2'::text,
'middle_3'::text,
'bottom'::text
]));

ALTER TABLE public.home_banners
ADD COLUMN IF NOT EXISTS size text DEFAULT 'medium' CHECK (size = ANY (ARRAY['small'::text, 'medium'::text, 'large'::text])),
ADD COLUMN IF NOT EXISTS gradient_from text DEFAULT '#065f46',
ADD COLUMN IF NOT EXISTS gradient_to text DEFAULT '#10b981',
ADD COLUMN IF NOT EXISTS gradient_direction text DEFAULT 'to right';

-- 3. Optimization Index for Order Line Item Aggregations
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);

-- 4. RPC Function for Sales-Ranked Popular Products
CREATE OR REPLACE FUNCTION public.get_popular_products(limit_count integer DEFAULT 12)
RETURNS SETOF public.products AS $$
BEGIN
RETURN QUERY
SELECT p.*
FROM public.products p
LEFT JOIN (
SELECT product_id, SUM(quantity) as total_sold
FROM public.order_items
GROUP BY product_id
) oi ON oi.product_id = p.id
WHERE p.is_active = true
ORDER BY COALESCE(oi.total_sold, 0) DESC, p.rating DESC, p.created_at DESC
LIMIT limit_count;
END;

\[
 LANGUAGE plpgsql SECURITY DEFINER;  
  
-- 5. Default Sections Configuration  
INSERT INTO public.home_sections (title, subtitle, section_type, banner_position, banner_size, sort_order, is_active)  
VALUES   
  ('Shop by Category', 'Everything your business needs', 'categories', NULL, NULL, 10, true),  
  ('Popular Products', 'Fresh deals for your business', 'popular_products', NULL, NULL, 20, true),  
  ('Mid Promo 1', 'Featured Wholesale Specials', 'banner_slot', 'middle_1', 'medium', 30, true),  
  ('Wholesale Deals', 'Volume discounts', 'deals', NULL, NULL, 40, true),  
  ('Shop by Stores', 'Curated collections', 'stores', NULL, NULL, 50, true),  
  ('Mid Promo 2', 'Seasonal Deals', 'banner_slot', 'middle_2', 'small', 60, true),  
  ('Everyday Essentials', 'Daily replenishment', 'essentials', NULL, NULL, 70, true),  
  ('Trusted Brands', 'Quality you can rely on', 'brands', NULL, NULL, 80, true),  
  ('Business Perks', 'Why buy with us', 'perks', NULL, NULL, 90, true),  
  ('Bottom Promo', 'Extra Deals', 'banner_slot', 'bottom', 'large', 100, true)  
ON CONFLICT DO NOTHING;  
  
  

\]