ALTER TABLE public.home_sections
  DROP CONSTRAINT IF EXISTS home_sections_section_type_check;

ALTER TABLE public.home_sections
  ADD CONSTRAINT home_sections_section_type_check
  CHECK (section_type = ANY (ARRAY[
    'categories'::text,
    'popular_products'::text,
    'quick_reorder'::text,
    'recently_viewed'::text,
    'volume_deals'::text,
    'new_arrivals'::text,
    'top_rated'::text,
    'limited_stock'::text,
    'brand_spotlight'::text,
    'deals'::text,
    'essentials'::text,
    'stores'::text,
    'brands'::text,
    'perks'::text,
    'banner_slot'::text,
    'custom_products'::text
  ]));

ALTER TABLE public.products 
ADD COLUMN stock_threshold integer NOT NULL DEFAULT 0;