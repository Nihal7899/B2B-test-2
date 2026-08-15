CREATE OR REPLACE FUNCTION create_order(
  p_address_id UUID,
  p_items JSONB,
  p_promo_code TEXT DEFAULT NULL,
  p_delivery_zone_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_user_id UUID;
  v_subtotal NUMERIC;
  v_discount NUMERIC := 0;
  v_delivery_fee NUMERIC := 0;
  v_total NUMERIC;
  v_promo_id UUID;
  v_discount_type TEXT;
  v_discount_value NUMERIC;
  v_min_order_value NUMERIC;
  v_max_discount_amount NUMERIC;
  v_item RECORD;
  v_gst_total NUMERIC := 0;
BEGIN
  -- 1. Authenticate
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Validate address
  IF NOT EXISTS (
    SELECT 1 FROM addresses
    WHERE id = p_address_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Invalid address: address not found or does not belong to user';
  END IF;

  -- 3. Compute subtotal and GST with volume pricing
  WITH item_pricing AS (
    SELECT
      i.product_id,
      i.quantity,
      p.wholesale_price,
      p.gst_percentage,
      COALESCE(
        (SELECT unit_price
         FROM product_volume_pricing vp
         WHERE vp.product_id = p.id
           AND i.quantity >= vp.min_quantity
           AND (vp.max_quantity IS NULL OR i.quantity <= vp.max_quantity)
         ORDER BY vp.unit_price ASC
         LIMIT 1),
        p.wholesale_price
      ) AS effective_price
    FROM jsonb_to_recordset(p_items) AS i(product_id UUID, quantity INT)
    JOIN products p ON p.id = i.product_id
    WHERE p.is_active = true
  )
  SELECT
    SUM(effective_price * quantity),
    SUM(effective_price * quantity * (gst_percentage / 100))
  INTO v_subtotal, v_gst_total
  FROM item_pricing;

  IF v_subtotal IS NULL OR v_subtotal = 0 THEN
    RAISE EXCEPTION 'No valid items or all items are inactive';
  END IF;

  -- 4. Validate promo code
  IF p_promo_code IS NOT NULL THEN
    SELECT
      id, discount_type, discount_value, min_order_value, max_discount_amount
    INTO
      v_promo_id, v_discount_type, v_discount_value, v_min_order_value, v_max_discount_amount
    FROM promo_codes
    WHERE code = UPPER(p_promo_code)
      AND is_active = true
      AND (start_date IS NULL OR start_date <= now())
      AND (end_date IS NULL OR end_date >= now())
      AND (usage_limit IS NULL OR used_count < usage_limit);

    IF v_promo_id IS NOT NULL AND v_subtotal >= v_min_order_value THEN
      IF v_discount_type = 'percentage' THEN
        v_discount := v_subtotal * (v_discount_value / 100);
        IF v_max_discount_amount IS NOT NULL AND v_discount > v_max_discount_amount THEN
          v_discount := v_max_discount_amount;
        END IF;
      ELSE
        v_discount := v_discount_value;
      END IF;
      IF v_discount > v_subtotal THEN
        v_discount := v_subtotal;
      END IF;
    END IF;
  END IF;

  -- 5. Delivery fee (adjust if you compute based on zone)
  v_delivery_fee := 0;

  -- 6. Total with GST
  v_total := v_subtotal - v_discount + v_delivery_fee + v_gst_total;

  -- 7. Insert order
  INSERT INTO orders (
    user_id, address_id, status, subtotal, discount, delivery_fee, total,
    promo_code_id, delivery_zone_id, order_number
  )
  VALUES (
    v_user_id, p_address_id, 'pending', v_subtotal, v_discount,
    v_delivery_fee, v_total, v_promo_id, p_delivery_zone_id,
    'SK-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  )
  RETURNING id INTO v_order_id;

  -- 8. Insert order items (with effective_price and GST)
  INSERT INTO order_items (
    order_id, product_id, brand, product_name, pack_size,
    unit_price, mrp, quantity, line_total, hsn_code, gst_percentage
  )
  SELECT
    v_order_id,
    p.id,
    p.brand,
    p.name,
    p.pack_size,
    COALESCE(
      (SELECT unit_price
       FROM product_volume_pricing vp
       WHERE vp.product_id = p.id
         AND i.quantity >= vp.min_quantity
         AND (vp.max_quantity IS NULL OR i.quantity <= vp.max_quantity)
       ORDER BY vp.unit_price ASC
       LIMIT 1),
      p.wholesale_price
    ) AS unit_price,
    p.mrp,
    i.quantity,
    COALESCE(
      (SELECT unit_price
       FROM product_volume_pricing vp
       WHERE vp.product_id = p.id
         AND i.quantity >= vp.min_quantity
         AND (vp.max_quantity IS NULL OR i.quantity <= vp.max_quantity)
       ORDER BY vp.unit_price ASC
       LIMIT 1),
      p.wholesale_price
    ) * i.quantity AS line_total,
    p.hsn_code,
    p.gst_percentage
  FROM jsonb_to_recordset(p_items) AS i(product_id UUID, quantity INT)
  JOIN products p ON p.id = i.product_id
  WHERE p.is_active = true;

  -- 9. Return order ID
  RETURN v_order_id;
END;
$$;

-- Drop old version if exists
drop function if exists public.cleanup_stale_orders();

-- Create the corrected function
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
  -- Collect stale order IDs:
  -- pending, updated_at > 15 min, no paid payment, no COD payment
  select array_agg(o.id)
  into v_order_ids
  from public.orders o
  left join public.payments p_paid on p_paid.order_id = o.id and p_paid.status = 'paid'
  left join public.payments p_cod on p_cod.order_id = o.id and p_cod.provider = 'cod'
  where o.status = 'pending'
    and o.updated_at < now() - interval '15 minutes'
    and p_paid.id is null
    and p_cod.id is null;

  -- If none, return 0
  if array_length(v_order_ids, 1) is null then
    return 0;
  end if;

  -- Cancel the orders
  update public.orders
  set status = 'cancelled'
  where id = any(v_order_ids);
  
  get diagnostics v_count = row_count;
  
  -- Mark associated razorpay pending payments as failed
  update public.payments
  set status = 'failed'
  where order_id = any(v_order_ids)
    and status = 'pending'
    and provider = 'razorpay';
  
  return v_count;
end;
$$;

-- Grant execute permission to authenticated users (for manual triggers if needed)
grant execute on function public.cleanup_stale_orders() to authenticated;