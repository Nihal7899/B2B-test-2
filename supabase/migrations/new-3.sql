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
-- select cron.unschedule('cleanup-stale-orders');

ALTER TABLE home_banners
ADD COLUMN IF NOT EXISTS bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '#16a34a',
ADD COLUMN IF NOT EXISTS bg_gradient TEXT DEFAULT 'from-brand-600 to-brand-800',
ADD COLUMN IF NOT EXISTS overlay_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS overlay_opacity INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS show_cta BOOLEAN DEFAULT true;


-- Drop the old version if it exists
drop function if exists public.cleanup_stale_orders();

-- Create the corrected version
create or replace function public.cleanup_stale_orders()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  v_order_ids uuid[];
  v_count integer;
begin
  -- Collect stale order IDs (pending for >15 min, no paid payment)
  select array_agg(o.id)
  into v_order_ids
  from public.orders o
  left join public.payments p on p.order_id = o.id and p.status = 'paid'
  where o.status = 'pending'
    and o.updated_at < now() - interval '15 minutes'
    and p.id is null;

  -- If none, return 0
  if array_length(v_order_ids, 1) is null then
    return 0;
  end if;

  -- Cancel the orders
  update public.orders
  set status = 'cancelled'
  where id = any(v_order_ids);
  
  get diagnostics v_count = row_count;
  
  -- Mark associated pending payments as 'failed' (since 'cancelled' doesn't exist in payment_status)
  update public.payments
  set status = 'failed'
  where order_id = any(v_order_ids)
  and status = 'pending';
  
  return v_count;
end;
$$;

-- Grant execute permission to authenticated users (for manual triggers if needed)
grant execute on function public.cleanup_stale_orders() to authenticated;