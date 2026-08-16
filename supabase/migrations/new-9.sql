-- =========================================================
-- CREATE STORAGE BUCKET
-- =========================================================

insert into storage.buckets (id, name, public)
values ('push-notifications', 'push-notifications', true)
on conflict (id) do nothing;


-- =========================================================
-- PUBLIC: Anyone can SELECT / DOWNLOAD files
-- =========================================================

create policy "Anyone can view push notification files"
on storage.objects
for select
to public
using (
  bucket_id = 'push-notifications'
);


-- =========================================================
-- ADMIN: Full access
-- =========================================================

-- Admin can SELECT
create policy "Admins can view push notification files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'push-notifications'
  and auth_helpers.is_admin()
);


-- Admin can INSERT
create policy "Admins can upload push notification files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'push-notifications'
  and auth_helpers.is_admin()
);


-- Admin can UPDATE
create policy "Admins can update push notification files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'push-notifications'
  and auth_helpers.is_admin()
)
with check (
  bucket_id = 'push-notifications'
  and auth_helpers.is_admin()
);


-- Admin can DELETE
create policy "Admins can delete push notification files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'push-notifications'
  and auth_helpers.is_admin()
);



-- Store push subscription per user (supports multiple devices)
CREATE TABLE public.user_push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  onesignal_player_id text NOT NULL,
  device_info jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX idx_user_push_subscriptions_user_device 
  ON public.user_push_subscriptions (user_id, onesignal_player_id);

-- Notification history (admin log)
CREATE TABLE public.push_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  sent_at timestamptz DEFAULT now(),
  sent_by uuid REFERENCES auth.users(id),
  audience_count integer,
  status text DEFAULT 'sent'
);

-- Enable RLS
ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage own subscriptions
CREATE POLICY "Users can manage own subscriptions"
  ON public.user_push_subscriptions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin can read notifications (optional)
CREATE POLICY "Admins can read all notifications"
  ON public.push_notifications
  FOR SELECT
  USING (auth.role() = 'admin');
  
  -- =========================================================
-- INVOICE_CONFIG
-- =========================================================

-- Anyone can view
create policy "Anyone can view invoice config"
on public.invoice_config
for select
to public
using (true);

-- Admin can insert
create policy "Admins can insert invoice config"
on public.invoice_config
for insert
to authenticated
with check (
  auth_helpers.is_admin()
);

-- Admin can update
create policy "Admins can update invoice config"
on public.invoice_config
for update
to authenticated
using (
  auth_helpers.is_admin()
)
with check (
  auth_helpers.is_admin()
);

-- Admin can delete
create policy "Admins can delete invoice config"
on public.invoice_config
for delete
to authenticated
using (
  auth_helpers.is_admin()
);


-- =========================================================
-- INVOICE_DESIGN
-- =========================================================

-- Anyone can view
create policy "Anyone can view invoice design"
on public.invoice_design
for select
to public
using (true);

-- Admin can insert
create policy "Admins can insert invoice design"
on public.invoice_design
for insert
to authenticated
with check (
  auth_helpers.is_admin()
);

-- Admin can update
create policy "Admins can update invoice design"
on public.invoice_design
for update
to authenticated
using (
  auth_helpers.is_admin()
)
with check (
  auth_helpers.is_admin()
);

-- Admin can delete
create policy "Admins can delete invoice design"
on public.invoice_design
for delete
to authenticated
using (
  auth_helpers.is_admin()
);


-- =========================================================
-- PROMO_CODES
-- =========================================================

-- Anyone can view
create policy "Anyone can view promo codes"
on public.promo_codes
for select
to public
using (true);

-- Admin can insert
create policy "Admins can insert promo codes"
on public.promo_codes
for insert
to authenticated
with check (
  auth_helpers.is_admin()
);

-- Admin can update
create policy "Admins can update promo codes"
on public.promo_codes
for update
to authenticated
using (
  auth_helpers.is_admin()
)
with check (
  auth_helpers.is_admin()
);

-- Admin can delete
create policy "Admins can delete promo codes"
on public.promo_codes
for delete
to authenticated
using (
  auth_helpers.is_admin()
);


-- =========================================================
-- PROMO_CODE_USAGE
-- =========================================================

-- Users can view their own promo code usage
create policy "Users can view own promo code usage"
on public.promo_code_usage
for select
to authenticated
using (
  user_id = auth.uid()
);


-- Users can insert their own promo code usage
create policy "Users can insert own promo code usage"
on public.promo_code_usage
for insert
to authenticated
with check (
  user_id = auth.uid()
);


-- Admin can view all promo code usage
create policy "Admins can view promo code usage"
on public.promo_code_usage
for select
to authenticated
using (
  auth_helpers.is_admin()
);


-- Admin can insert any promo code usage
create policy "Admins can insert promo code usage"
on public.promo_code_usage
for insert
to authenticated
with check (
  auth_helpers.is_admin()
);


-- Admin can update any promo code usage
create policy "Admins can update promo code usage"
on public.promo_code_usage
for update
to authenticated
using (
  auth_helpers.is_admin()
)
with check (
  auth_helpers.is_admin()
);


-- Admin can delete any promo code usage
create policy "Admins can delete promo code usage"
on public.promo_code_usage
for delete
to authenticated
using (
  auth_helpers.is_admin()
);

-- =========================================================
-- PRODUCT_VOLUME_PRICING
-- =========================================================

-- Anyone can view volume pricing
create policy "Anyone can view product volume pricing"
on public.product_volume_pricing
for select
to public
using (true);


-- Admin can insert
create policy "Admins can insert product volume pricing"
on public.product_volume_pricing
for insert
to authenticated
with check (
  auth_helpers.is_admin()
);


-- Admin can update
create policy "Admins can update product volume pricing"
on public.product_volume_pricing
for update
to authenticated
using (
  auth_helpers.is_admin()
)
with check (
  auth_helpers.is_admin()
);


-- Admin can delete
create policy "Admins can delete product volume pricing"
on public.product_volume_pricing
for delete
to authenticated
using (
  auth_helpers.is_admin()
);


-- =========================================================
-- STORES
-- =========================================================

-- Anyone can view stores
create policy "Anyone can view stores"
on public.stores
for select
to public
using (true);

-- Admin can insert stores
create policy "Admins can insert stores"
on public.stores
for insert
to authenticated
with check (
  auth_helpers.is_admin()
);

-- Admin can update stores
create policy "Admins can update stores"
on public.stores
for update
to authenticated
using (
  auth_helpers.is_admin()
)
with check (
  auth_helpers.is_admin()
);

-- Admin can delete stores
create policy "Admins can delete stores"
on public.stores
for delete
to authenticated
using (
  auth_helpers.is_admin()
);


-- =========================================================
-- TRUSTED_BRANDS
-- =========================================================

-- Anyone can view trusted brands
create policy "Anyone can view trusted brands"
on public.trusted_brands
for select
to public
using (true);

-- Admin can insert trusted brands
create policy "Admins can insert trusted brands"
on public.trusted_brands
for insert
to authenticated
with check (
  auth_helpers.is_admin()
);

-- Admin can update trusted brands
create policy "Admins can update trusted brands"
on public.trusted_brands
for update
to authenticated
using (
  auth_helpers.is_admin()
)
with check (
  auth_helpers.is_admin()
);

-- Admin can delete trusted brands
create policy "Admins can delete trusted brands"
on public.trusted_brands
for delete
to authenticated
using (
  auth_helpers.is_admin()
);