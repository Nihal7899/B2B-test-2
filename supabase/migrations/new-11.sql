-- Add columns one by one (all are already added in previous steps, but this is the complete list)

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT,
ADD COLUMN IF NOT EXISTS secondary_color TEXT,
ADD COLUMN IF NOT EXISTS text_color TEXT,
ADD COLUMN IF NOT EXISTS border_color TEXT,
ADD COLUMN IF NOT EXISTS button_style TEXT DEFAULT 'brand',
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{
  "header": { "title": "Store", "subtitle": "", "cartBadgeCount": 0 },
  "hero": { "enabled": true, "image": "", "gradientFrom": "#065f46", "gradientTo": "#16a34a", "title": "", "subtitle": "", "ctaText": "Shop Now", "ctaLink": "/categories", "ctaBgColor": "#ffffff", "ctaTextColor": "#065f46" },
  "highlights": [],
  "categories": [],
  "bulkDeal": { "enabled": false, "tag": "", "title": "", "subtitle": "", "cta": "", "icon": "Package", "ctaBgColor": "#ffffff", "ctaTextColor": "#065f46" },
  "trending": { "enabled": false, "title": "Top categories", "subtitle": "Jump straight to what customers are buying most", "iconButtons": [], "ctaText": "Browse all categories", "ctaBgColor": "#ffffff", "ctaTextColor": "#065f46" },
  "tintOpacity": 50,
  "badgeText": "STORE",
  "badgeColor": "#fbbf24"
}'::jsonb;

-- Subcategories table
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX idx_subcategories_category ON subcategories(category_id);

-- Add gradient column to categories (store Tailwind classes)
ALTER TABLE categories ADD COLUMN gradient TEXT;

-- Add subcategory_id to products
ALTER TABLE products ADD COLUMN subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;
CREATE INDEX idx_products_subcategory ON products(subcategory_id);