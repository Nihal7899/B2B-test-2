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