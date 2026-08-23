-- =========================================================
-- PRODUCT-IMAGES STORAGE BUCKET
-- =========================================================

-- Create public bucket
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;


-- =========================================================
-- ANYONE: Can view/download product images
-- =========================================================

create policy "Anyone can view product images"
on storage.objects
for select
to public
using (
  bucket_id = 'product-images'
);


-- =========================================================
-- ADMIN: Full access
-- =========================================================

-- Admin can upload product images
create policy "Admins can upload product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and auth_helpers.is_admin()
);


-- Admin can update product images
create policy "Admins can update product images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and auth_helpers.is_admin()
)
with check (
  bucket_id = 'product-images'
  and auth_helpers.is_admin()
);


-- Admin can delete product images
create policy "Admins can delete product images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and auth_helpers.is_admin()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';