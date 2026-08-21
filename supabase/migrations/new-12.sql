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