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