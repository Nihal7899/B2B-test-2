CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.handle_order_status_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_target_user_id uuid;
  v_channel_id text;
  v_small_icon text;
  v_player_ids text[];
  v_title text;
  v_body text;
  v_deep_link text;
  v_buttons jsonb;
  v_data jsonb;
  v_payload jsonb;
  v_status text;

  -- ── CONFIGURATION (Add your project URL & service_role key here) ──
  v_supabase_url text := 'https://<YOUR-PROJECT-REF>.supabase.co';
  v_service_key  text := '<YOUR-SERVICE-ROLE-KEY>';
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  v_status := NEW.status::text;

  IF v_status = 'ready_for_pickup' THEN
    SELECT delivery_partner_id INTO v_target_user_id
    FROM public.delivery_assignments
    WHERE order_id = NEW.id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_target_user_id IS NULL THEN
      RETURN NEW;
    END IF;
  ELSIF v_status IN ('confirmed', 'out_for_delivery', 'delivered', 'cancelled') THEN
    v_target_user_id := NEW.user_id;
  ELSE
    RETURN NEW;
  END IF;

  SELECT channel_id, small_icon
  INTO v_channel_id, v_small_icon
  FROM public.notification_channels
  WHERE lower(trim(name)) = lower(trim(v_status))
  LIMIT 1;

  SELECT array_agg(DISTINCT onesignal_player_id)
  INTO v_player_ids
  FROM public.user_push_subscriptions
  WHERE user_id = v_target_user_id
    AND onesignal_player_id IS NOT NULL
    AND trim(onesignal_player_id) <> '';

  IF v_player_ids IS NULL OR array_length(v_player_ids, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  CASE v_status
    WHEN 'confirmed' THEN
      v_title := 'Order is confirmed';
      v_body := 'Your order #' || NEW.order_number || ' has been confirmed and is being packed.';
      v_deep_link := '/order?id=' || NEW.id;
      v_buttons := jsonb_build_array(jsonb_build_object('id', 'view_order', 'text', 'View Order'));
      v_data := jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'status', v_status, 'screen', 'orderDetail', 'url', v_deep_link);

    WHEN 'ready_for_pickup' THEN
      v_title := 'Order Ready for Pickup';
      v_body := 'Order #' || NEW.order_number || ' is packed and awaiting pickup at the warehouse.';
      v_deep_link := '/delivery?tab=pending';
      v_buttons := jsonb_build_array(jsonb_build_object('id', 'view_pending', 'text', 'View Pending Deliveries'));
      v_data := jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'status', v_status, 'screen', 'delivery', 'tab', 'pending', 'url', v_deep_link);

    WHEN 'out_for_delivery' THEN
      v_title := 'Order Out for Delivery';
      v_body := 'Order #' || NEW.order_number || ' is out for delivery. Keep payment ready if COD.';
      v_deep_link := '/order?id=' || NEW.id;
      v_buttons := jsonb_build_array(jsonb_build_object('id', 'view_order', 'text', 'View Order'));
      v_data := jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'status', v_status, 'screen', 'orderDetail', 'url', v_deep_link);

    WHEN 'delivered' THEN
      v_title := 'Order Delivered';
      v_body := 'Order #' || NEW.order_number || ' has been delivered. Thank you for shopping with us!';
      v_deep_link := '/order?id=' || NEW.id;
      v_buttons := jsonb_build_array(jsonb_build_object('id', 'view_order', 'text', 'View Order'));
      v_data := jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'status', v_status, 'screen', 'orderDetail', 'url', v_deep_link);

    WHEN 'cancelled' THEN
      v_title := 'Order Cancelled';
      v_body := 'Order #' || NEW.order_number || ' has been cancelled.';
      v_deep_link := '/order?id=' || NEW.id;
      v_buttons := jsonb_build_array(jsonb_build_object('id', 'view_order', 'text', 'View Order'));
      v_data := jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'status', v_status, 'screen', 'orderDetail', 'url', v_deep_link);

    ELSE
      RETURN NEW;
  END CASE;

  v_payload := jsonb_build_object(
    'playerIds', to_jsonb(v_player_ids),
    'userId', v_target_user_id,
    'title', v_title,
    'body', v_body,
    'channelId', v_channel_id,
    'smallIcon', v_small_icon,
    'accentColor', '0a382c',
    'deepLink', v_deep_link,
    'buttons', v_buttons,
    'data', v_data
  );

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
    RAISE WARNING 'Push notification dispatch failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


DROP TRIGGER IF EXISTS trg_order_status_push_notification ON public.orders;

CREATE TRIGGER trg_order_status_push_notification
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_status_push_notification();
