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
  v_gst_total NUMERIC := 0;
  v_discount_ratio NUMERIC := 0;
  v_pincode TEXT;
  v_zone_id UUID;
  v_charge NUMERIC;
BEGIN
  -- 1. Authenticate
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Validate address and get pincode
  SELECT postal_code INTO v_pincode
  FROM addresses
  WHERE id = p_address_id AND user_id = v_user_id;
  IF v_pincode IS NULL THEN
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

  -- 4. Compute delivery fee
  -- Use the existing get_delivery_charge RPC
  SELECT charge, zone_id INTO v_charge, v_zone_id
  FROM get_delivery_charge(v_pincode, v_subtotal);
  
  IF v_charge IS NOT NULL THEN
    v_delivery_fee := v_charge;
    -- If zone_id is provided and p_delivery_zone_id is not passed, use the found zone
    IF p_delivery_zone_id IS NULL AND v_zone_id IS NOT NULL THEN
      p_delivery_zone_id := v_zone_id;
    END IF;
  END IF;

  -- 5. Validate promo code and compute discount
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

  -- 6. Compute discount ratio for GST adjustment
  IF v_discount > 0 AND v_subtotal > 0 THEN
    v_discount_ratio := v_discount / v_subtotal;
    v_gst_total := v_gst_total * (1 - v_discount_ratio);
  END IF;

  -- 7. Total (subtotal - discount + delivery + GST)
  v_total := v_subtotal - v_discount + v_delivery_fee + v_gst_total;

  -- 8. Insert order with GST breakdown
  INSERT INTO orders (
    user_id,
    address_id,
    status,
    subtotal,
    discount,
    delivery_fee,
    total,
    promo_code_id,
    delivery_zone_id,
    order_number,
    gst_amount,
    cgst_amount,
    sgst_amount
  )
  VALUES (
    v_user_id,
    p_address_id,
    'pending',
    v_subtotal,
    v_discount,
    v_delivery_fee,
    v_total,
    v_promo_id,
    p_delivery_zone_id,
    'SK-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    v_gst_total,
    v_gst_total / 2,
    v_gst_total / 2
  )
  RETURNING id INTO v_order_id;

  -- 9. Insert order items with effective_price and GST
  INSERT INTO order_items (
    order_id,
    product_id,
    brand,
    product_name,
    pack_size,
    unit_price,
    mrp,
    quantity,
    line_total,
    hsn_code,
    gst_percentage
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

  -- 10. Return order ID
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