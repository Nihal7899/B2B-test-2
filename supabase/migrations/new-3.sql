-- Enable pg_cron if not already enabled
create extension if not exists pg_cron;

-- Schedule the cleanup job to run every 5 minutes
select cron.schedule(
  'cleanup-stale-orders',      -- job name
  '*/5 * * * *',               -- every 5 minutes
  'select public.cleanup_stale_orders();'
);

-- To check scheduled jobs:
select * from cron.job;

-- To unschedule (if needed):
select cron.unschedule('cleanup-stale-orders');

ALTER TABLE home_banners
ADD COLUMN IF NOT EXISTS bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '#16a34a',
ADD COLUMN IF NOT EXISTS bg_gradient TEXT DEFAULT 'from-brand-600 to-brand-800',
ADD COLUMN IF NOT EXISTS overlay_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS overlay_opacity INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS show_cta BOOLEAN DEFAULT true;