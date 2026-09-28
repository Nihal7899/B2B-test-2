CREATE TABLE IF NOT EXISTS public.search_synonyms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  keyword character varying(255) NOT NULL UNIQUE,
  synonyms text[] NOT NULL DEFAULT '{}'::text[],
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT search_synonyms_pkey PRIMARY KEY (id)
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
  is_default boolean NOT NULL DEFAULT false,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  landmark text,
  pincode text,
  CONSTRAINT businesses_pkey PRIMARY KEY (id),
  CONSTRAINT businesses_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES auth.users(id)
);

-- =====================================================
-- app_settings
-- Admin: ALL permissions
-- =====================================================

create policy "Admins can manage app settings"
on public.app_settings
for all
to authenticated
using (
  auth_helpers.is_admin()
)
with check (
  auth_helpers.is_admin()
);


-- =====================================================
-- home_sections
-- Admin: ALL permissions
-- Anyone: SELECT
-- =====================================================

create policy "Anyone can view home sections"
on public.home_sections
for select
to public
using (
  true
);

create policy "Admins can manage home sections"
on public.home_sections
for all
to authenticated
using (
  auth_helpers.is_admin()
)
with check (
  auth_helpers.is_admin()
);


-- =====================================================
-- notification_channels
-- Admin: ALL permissions
-- =====================================================

create policy "Admins can manage notification channels"
on public.notification_channels
for all
to authenticated
using (
  auth_helpers.is_admin()
)
with check (
  auth_helpers.is_admin()
);


-- =====================================================
-- search_synonyms
-- Admin: ALL permissions
-- Anyone: SELECT
-- =====================================================

create policy "Anyone can view search synonyms"
on public.search_synonyms
for select
to public
using (
  true
);

create policy "Admins can manage search synonyms"
on public.search_synonyms
for all
to authenticated
using (
  auth_helpers.is_admin()
)
with check (
  auth_helpers.is_admin()
);


-- =====================================================
-- subcategories
-- Admin: ALL permissions
-- Anyone: SELECT
-- =====================================================

create policy "Anyone can view subcategories"
on public.subcategories
for select
to public
using (
  true
);

create policy "Admins can manage subcategories"
on public.subcategories
for all
to authenticated
using (
  auth_helpers.is_admin()
)
with check (
  auth_helpers.is_admin()
);


-- =====================================================
-- whatsapp_campaigns
-- Admin: ALL permissions
-- =====================================================

create policy "Admins can manage WhatsApp campaigns"
on public.whatsapp_campaigns
for all
to authenticated
using (
  auth_helpers.is_admin()
)
with check (
  auth_helpers.is_admin()
);


-- =====================================================
-- whatsapp_message_logs
-- Admin: ALL permissions
-- =====================================================

create policy "Admins can manage WhatsApp message logs"
on public.whatsapp_message_logs
for all
to authenticated
using (
  auth_helpers.is_admin()
)
with check (
  auth_helpers.is_admin()
);


-- =====================================================
-- whatsapp_templates
-- Admin: ALL permissions
-- =====================================================

create policy "Admins can manage WhatsApp templates"
on public.whatsapp_templates
for all
to authenticated
using (
  auth_helpers.is_admin()
)
with check (
  auth_helpers.is_admin()
);


alter table public.app_settings enable row level security;

alter table public.home_sections enable row level security;

alter table public.notification_channels enable row level security;

alter table public.search_synonyms enable row level security;

alter table public.subcategories enable row level security;

alter table public.whatsapp_campaigns enable row level security;

alter table public.whatsapp_message_logs enable row level security;

alter table public.whatsapp_templates enable row level security;