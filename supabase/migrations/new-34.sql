-- Site content config store
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique check (section_key in ('hero','footer','about')),
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.site_content enable row level security;

-- =====================================================
-- STORAGE BUCKET: site-assets
-- Public read, Admin full access
-- =====================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'site-assets',
  'site-assets',
  true,
  null,
  null
)
on conflict (id) do nothing;


-- Anyone can view site assets
create policy "Anyone can view site assets"
on storage.objects
for select
to public
using (
  bucket_id = 'site-assets'
);


-- Admins can upload site assets
create policy "Admins can upload site assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-assets'
  and auth_helpers.is_admin()
);


-- Admins can update site assets
create policy "Admins can update site assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-assets'
  and auth_helpers.is_admin()
)
with check (
  bucket_id = 'site-assets'
  and auth_helpers.is_admin()
);


-- Admins can delete site assets
create policy "Admins can delete site assets"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-assets'
  and auth_helpers.is_admin()
);


-- =====================================================
-- site_content
-- Public read, Admin full access
-- =====================================================

alter table public.site_content enable row level security;


-- Anyone can view site content
create policy "Anyone can view site content"
on public.site_content
for select
to public
using (
  true
);


-- Admins can manage site content
create policy "Admins can manage site content"
on public.site_content
for all
to authenticated
using (
  auth_helpers.is_admin()
)
with check (
  auth_helpers.is_admin()
);