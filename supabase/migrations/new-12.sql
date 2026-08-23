CREATE TABLE notification_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL UNIQUE,   -- e.g. "orders", "promotions"
  name TEXT NOT NULL,                -- display name, e.g. "Orders"
  description TEXT,                  -- optional
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add small_icon column
ALTER TABLE notification_channels
ADD COLUMN small_icon TEXT;

-- (Optional) You can also add an index if you query by it often

ALTER TABLE trusted_brands
ADD COLUMN primary_color VARCHAR(20) DEFAULT '#3B82F6',
ADD COLUMN secondary_color VARCHAR(20) DEFAULT '#1E40AF',
ADD COLUMN product_images JSONB DEFAULT '[]';

ALTER TABLE trusted_brands
ADD COLUMN tagline TEXT,
ADD COLUMN categories TEXT[],
ADD COLUMN bottom_label TEXT,
ADD COLUMN bottom_icon TEXT CHECK (bottom_icon IN ('shield', 'crown', 'leaf'));


-- =========================================================
-- BRANDS STORAGE BUCKET
-- =========================================================

-- Create public bucket
insert into storage.buckets (id, name, public)
values ('brands', 'brands', true)
on conflict (id) do nothing;


-- =========================================================
-- ANYONE: Can SELECT / VIEW brand images
-- =========================================================

create policy "Anyone can view brand images"
on storage.objects
for select
to public
using (
  bucket_id = 'brands'
);


-- =========================================================
-- ADMIN: Full access
-- =========================================================

-- Admin can upload
create policy "Admins can upload brand images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'brands'
  and auth_helpers.is_admin()
);


-- Admin can update
create policy "Admins can update brand images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'brands'
  and auth_helpers.is_admin()
)
with check (
  bucket_id = 'brands'
  and auth_helpers.is_admin()
);


-- Admin can delete
create policy "Admins can delete brand images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'brands'
  and auth_helpers.is_admin()
);

ALTER TABLE trusted_brands ADD COLUMN description TEXT;

-- Add config column to trusted_brands
ALTER TABLE trusted_brands ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

-- Optional: create index for faster queries (if needed)
CREATE INDEX IF NOT EXISTS idx_trusted_brands_config ON trusted_brands USING gin (config);

-- Add columns for badge and all card fields
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS rating TEXT,
ADD COLUMN IF NOT EXISTS orders TEXT,
ADD COLUMN IF NOT EXISTS store_icon TEXT,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS premium_badge JSONB DEFAULT '{"icon":"Sparkles","label":"PREMIUM","sublabel":"QUALITY"}'::jsonb,
ADD COLUMN IF NOT EXISTS badge_text TEXT DEFAULT 'STORE',
ADD COLUMN IF NOT EXISTS badge_color TEXT DEFAULT '#fbbf24';

-- Remove old tint_opacity if it exists
ALTER TABLE stores DROP COLUMN IF EXISTS tint_opacity;

-- SQL migration for compression settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default compression config
INSERT INTO public.app_settings (key, value)
VALUES (
  'compression_config',
  '{
    "thresholds": [
      {"minSizeMB": 0, "maxSizeMB": 2, "quality": 90},
      {"minSizeMB": 2, "maxSizeMB": 4, "quality": 80},
      {"minSizeMB": 4, "maxSizeMB": 6, "quality": 70},
      {"minSizeMB": 6, "maxSizeMB": null, "quality": 60}
    ]
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;



