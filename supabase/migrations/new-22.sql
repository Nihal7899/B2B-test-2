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
