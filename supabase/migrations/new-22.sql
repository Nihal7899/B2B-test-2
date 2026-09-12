CREATE OR REPLACE FUNCTION public.handle_delivery_partner_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_target_user_id uuid;
  v_order_number text;
  v_order_status text;
  v_channel_id text;
  v_small_icon text;
  v_sound text;
  v_player_ids text[];
  v_title text;
  v_body text;
  v_deep_link text;
  v_buttons jsonb;
  v_data jsonb;
  v_payload jsonb;

  -- REPLACE THESE WITH YOUR ACTUAL CREDENTIALS
  v_supabase_url text := 'https://<YOUR-PROJECT-REF>.supabase.co';
  v_service_key  text := '<YOUR-SERVICE-ROLE-KEY>';
BEGIN
  -- 1. Ensure a partner is assigned
  IF NEW.delivery_partner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 2. If it's an UPDATE, only fire if the delivery partner actually changed
  IF TG_OP = 'UPDATE' AND OLD.delivery_partner_id IS NOT DISTINCT FROM NEW.delivery_partner_id THEN
    RETURN NEW;
  END IF;

  v_target_user_id := NEW.delivery_partner_id;

  -- 3. Fetch order details for the notification text
  SELECT order_number, status INTO v_order_number, v_order_status
  FROM public.orders
  WHERE id = NEW.order_id;

  -- 4. Query channel_id, small_icon, and sound dynamically
  SELECT channel_id, small_icon, sound
  INTO v_channel_id, v_small_icon, v_sound
  FROM public.notification_channels
  WHERE lower(trim(name)) = 'ready_for_pickup'
  LIMIT 1;

  -- 5. Fetch OneSignal Player IDs
  SELECT array_agg(DISTINCT onesignal_player_id)
  INTO v_player_ids
  FROM public.user_push_subscriptions
  WHERE user_id = v_target_user_id
    AND onesignal_player_id IS NOT NULL
    AND trim(onesignal_player_id) <> '';

  IF v_player_ids IS NULL OR array_length(v_player_ids, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- 6. Setup Notification Content
  v_title := 'New Delivery Assigned! 🚚';
  v_body := 'Order #' || COALESCE(v_order_number, 'Unknown') || ' has been assigned to you for pickup.';
  v_deep_link := '/delivery?tab=pending';
  v_buttons := jsonb_build_array(jsonb_build_object('id', 'view_delivery', 'text', 'View Assignment'));
  v_data := jsonb_build_object('order_id', NEW.order_id, 'order_number', v_order_number, 'status', v_order_status, 'screen', 'delivery', 'tab', 'pending', 'url', v_deep_link);

  -- 7. Add sound and channel data to payload exactly like your existing function
  v_payload := jsonb_build_object(
    'playerIds', to_jsonb(v_player_ids),
    'userId', v_target_user_id,
    'title', v_title,
    'body', v_body,
    'channelId', v_channel_id,
    'smallIcon', v_small_icon,
    'sound', v_sound,
    'accentColor', '0a382c',
    'deepLink', v_deep_link,
    'buttons', v_buttons,
    'data', v_data
  );

  -- 8. Log notification
  BEGIN
    INSERT INTO public.push_notifications (
      title, body, data, audience, small_icon, sound, deep_link, action_buttons, status
    ) VALUES (
      v_title, v_body, v_data, 'targeted', v_small_icon, v_sound, v_deep_link, v_buttons, 'sent'
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to log notification: %', SQLERRM;
  END;

  -- 9. Dispatch to correct Edge Function URL
  BEGIN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', v_service_key,
        'Authorization', 'Bearer ' || v_service_key,
        'x-trigger-secret', 'stackknit_trigger_secret'
      ),
      body := v_payload
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Push dispatch failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Attach Trigger to the delivery_assignments table
DROP TRIGGER IF EXISTS trg_delivery_partner_assigned ON public.delivery_assignments;

CREATE TRIGGER trg_delivery_partner_assigned
AFTER INSERT OR UPDATE OF delivery_partner_id ON public.delivery_assignments
FOR EACH ROW
EXECUTE FUNCTION public.handle_delivery_partner_assignment();

ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'investor';


-- =========================================================
-- AUTH HELPER: INVESTOR
-- =========================================================

create or replace function auth_helpers.is_investor()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = 'investor'
  );
$$;


-- =========================================================
-- ORDERS
-- INVESTOR: Can view any order
-- =========================================================

create policy "Investors can view orders"
on public.orders
for select
to authenticated
using (
  auth_helpers.is_investor()
);


-- =========================================================
-- PROFILES
-- INVESTOR: Can view any profile
-- =========================================================

create policy "Investors can view profiles"
on public.profiles
for select
to authenticated
using (
  auth_helpers.is_investor()
);


-- =========================================================
-- PAYMENTS
-- INVESTOR: Can view any payment
-- =========================================================

create policy "Investors can view payments"
on public.payments
for select
to authenticated
using (
  auth_helpers.is_investor()
);


CREATE OR REPLACE FUNCTION get_investor_dashboard_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ist_now timestamptz := (now() AT TIME ZONE 'UTC') + interval '5 hours 30 minutes';
  v_today_date date := v_ist_now::date;
  v_month_start timestamptz := (v_today_date - interval '29 days')::timestamptz;
  v_prev_month_start timestamptz := (v_today_date - interval '59 days')::timestamptz;
  
  v_totals jsonb;
  v_daily_stats jsonb;
  v_prev_revenue numeric;
  v_status_counts jsonb;
  v_payment_totals jsonb;
  v_new_customers int;
  v_active_customers int;
  v_total_customers int;
BEGIN
  -- 1. Lifetime & Overall Order Totals
  SELECT jsonb_build_object(
    'lifetimeSales', COALESCE(SUM(total) FILTER (WHERE status = 'delivered'), 0),
    'lifetimeOrders', COUNT(*),
    'completedOrders', COUNT(*) FILTER (WHERE status = 'delivered'),
    'cancelledOrders', COUNT(*) FILTER (WHERE status = 'cancelled')
  ) INTO v_totals FROM orders;

  -- 2. Daily Stats (Last 30 Days) - Generates exact 30 day series, joining with aggregated order data
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', d.day,
      'revenue', COALESCE(o.revenue, 0),
      'orders', COALESCE(o.orders, 0),
      'discounts', COALESCE(o.discounts, 0),
      'delivery_fees', COALESCE(o.delivery_fees, 0)
    ) ORDER BY d.day ASC
  ) INTO v_daily_stats
  FROM (
    SELECT to_char(generate_series(v_month_start, v_ist_now, '1 day'::interval), 'YYYY-MM-DD') AS day
  ) d
  LEFT JOIN (
    SELECT 
      to_char((created_at AT TIME ZONE 'UTC') + interval '5 hours 30 minutes', 'YYYY-MM-DD') AS order_day,
      SUM(total) FILTER (WHERE status = 'delivered') AS revenue,
      COUNT(*) AS orders,
      SUM(discount) AS discounts,
      SUM(delivery_fee) AS delivery_fees
    FROM orders
    WHERE created_at >= v_month_start
    GROUP BY 1
  ) o ON d.day = o.order_day;

  -- 3. Previous 30 Days Revenue (For growth calculation)
  SELECT COALESCE(SUM(total), 0) INTO v_prev_revenue
  FROM orders
  WHERE status = 'delivered' 
    AND created_at >= v_prev_month_start 
    AND created_at < v_month_start;

  -- 4. Status Counts (Last 30 days)
  SELECT jsonb_object_agg(status, count) INTO v_status_counts
  FROM (
    SELECT status, COUNT(*) as count 
    FROM orders 
    WHERE created_at >= v_month_start 
    GROUP BY status
  ) s;

  -- 5. Payment Methods (Last 30 days)
  SELECT jsonb_object_agg(provider, amount) INTO v_payment_totals
  FROM (
    SELECT UPPER(provider) as provider, SUM(amount) as amount 
    FROM payments 
    WHERE status = 'paid' AND created_at >= v_month_start 
    GROUP BY UPPER(provider)
  ) p;

  -- 6. Customer Demographics
  SELECT COUNT(*) INTO v_total_customers FROM profiles;
  SELECT COUNT(*) INTO v_new_customers FROM profiles WHERE created_at >= v_month_start;
  SELECT COUNT(DISTINCT user_id) INTO v_active_customers FROM orders WHERE created_at >= v_month_start;

  -- 7. Compile and Return Fast JSON Payload
  RETURN jsonb_build_object(
    'totals', COALESCE(v_totals, '{}'::jsonb),
    'dailyStats', COALESCE(v_daily_stats, '[]'::jsonb),
    'prev30DaysRevenue', v_prev_revenue,
    'statusCounts', COALESCE(v_status_counts, '{}'::jsonb),
    'paymentTotals', COALESCE(v_payment_totals, '{}'::jsonb),
    'newCustomers30d', COALESCE(v_new_customers, 0),
    'activeCustomers30d', COALESCE(v_active_customers, 0),
    'totalCustomers', COALESCE(v_total_customers, 0)
  );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION get_investor_dashboard_data() TO authenticated;

DO $$
DECLARE
    table_name text;
    tables_to_remove text[] := ARRAY[
        'products', 
        'categories', 
        'subcategories', 
        'stores', 
        'trusted_brands', 
        'home_sections', 
        'home_banners', 
        'smart_collections', 
        'product_volume_pricing', 
        'wishlists', 
        'payments'
    ];
BEGIN
    FOR table_name IN SELECT unnest(tables_to_remove)
    LOOP
        -- Check if the table is currently in the realtime publication
        IF EXISTS (
            SELECT 1
            FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = table_name
        ) THEN
            -- If it exists, drop it from the publication
            EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', table_name);
        END IF;
    END LOOP;
END $$;

-- 1. Ensure orders table has cancel_reason column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- 2. Drop older signatures to prevent return type conflict errors
DROP FUNCTION IF EXISTS cancel_order_warehouse(UUID, TEXT);
DROP FUNCTION IF EXISTS cancel_order_warehouse(UUID);
DROP FUNCTION IF EXISTS get_warehouse_today_stats();

-- 3. Cancel Order & Auto-Restore Inventory Stock if previously confirmed
CREATE OR REPLACE FUNCTION cancel_order_warehouse(
  p_order_id UUID,
  p_reason TEXT DEFAULT 'Cancelled by warehouse manager'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status TEXT;
  v_item RECORD;
BEGIN
  -- Fetch current status
  SELECT status INTO v_current_status
  FROM orders
  WHERE id = p_order_id;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_current_status = 'cancelled' THEN
    RAISE EXCEPTION 'Order is already cancelled';
  END IF;

  IF v_current_status = 'delivered' THEN
    RAISE EXCEPTION 'Cannot cancel an order that has already been delivered';
  END IF;

  -- Restore inventory if order was confirmed or downstream in dispatch
  IF v_current_status IN ('confirmed', 'packed', 'ready_for_pickup', 'out_for_delivery') THEN
    FOR v_item IN
      SELECT product_id, quantity
      FROM order_items
      WHERE order_id = p_order_id
    LOOP
      UPDATE products
      SET stock_quantity = COALESCE(stock_quantity, 0) + v_item.quantity,
          updated_at = NOW()
      WHERE id = v_item.product_id;
    END LOOP;
  END IF;

  -- Mark order as cancelled with recorded reason
  UPDATE orders
  SET status = 'cancelled',
      cancel_reason = p_reason,
      updated_at = NOW()
  WHERE id = p_order_id;

  -- Cancel delivery assignment if present
  UPDATE delivery_assignments
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE order_id = p_order_id;

  RETURN json_build_object(
    'success', true,
    'order_id', p_order_id,
    'previous_status', v_current_status,
    'stock_restored', (v_current_status IN ('confirmed', 'packed', 'ready_for_pickup', 'out_for_delivery'))
  );
END;
$$;

-- 4. Fast Aggregate Metrics for Today's Processed Orders
CREATE OR REPLACE FUNCTION get_warehouse_today_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'today_volume', COALESCE(SUM(total) FILTER (
      WHERE created_at >= CURRENT_DATE 
        AND status != 'cancelled'
    ), 0),
    'today_orders_count', COUNT(*) FILTER (
      WHERE created_at >= CURRENT_DATE 
        AND status != 'cancelled'
    ),
    'pending_count', COUNT(*) FILTER (WHERE status = 'pending'),
    'confirmed_count', COUNT(*) FILTER (WHERE status = 'confirmed'),
    'packed_count', COUNT(*) FILTER (WHERE status = 'packed'),
    'ready_count', COUNT(*) FILTER (WHERE status = 'ready_for_pickup'),
    'out_count', COUNT(*) FILTER (WHERE status = 'out_for_delivery'),
    'delivered_today_count', COUNT(*) FILTER (
      WHERE status = 'delivered' 
        AND updated_at >= CURRENT_DATE
    )
  ) INTO v_result
  FROM orders;
  
  RETURN v_result;
END;
$$;



-- Force the database to send full row data in websocket payloads
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE delivery_assignments REPLICA IDENTITY FULL;
