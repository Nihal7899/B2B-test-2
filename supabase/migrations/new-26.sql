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