CREATE OR REPLACE FUNCTION public.create_order(p_address_id uuid, p_items jsonb, p_promo_code text DEFAULT NULL::text, p_delivery_zone_id uuid DEFAULT NULL::uuid, p_business_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_is_active BOOLEAN;
  v_start_date TIMESTAMPTZ;
  v_end_date TIMESTAMPTZ;
  v_usage_limit INTEGER;
  v_used_count INTEGER;
  v_gst_total NUMERIC := 0;
  v_discount_ratio NUMERIC := 0;
  v_pincode TEXT;
  v_zone_id UUID;
  v_charge NUMERIC;
  v_business_snapshot JSONB := NULL;
  v_delivery_address_snapshot JSONB := NULL;
  v_billing_address_snapshot JSONB := NULL;
  
  -- NEW: Stock verification variables
  v_item record;
  v_current_stock integer;
  v_product_name text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Delivery address snapshot + pincode capture
  SELECT
    jsonb_build_object(
      'id', a.id,
      'label', a.label,
      'recipient_name', a.recipient_name,
      'phone', a.phone,
      'line1', a.line1,
      'line2', a.line2,
      'city', a.city,
      'state', a.state,
      'postal_code', a.postal_code,
      'latitude', a.latitude,
      'longitude', a.longitude,
      'place_id', a.place_id
    ),
    a.postal_code
  INTO v_delivery_address_snapshot, v_pincode
  FROM addresses a
  WHERE a.id = p_address_id AND a.user_id = v_user_id;

  IF v_pincode IS NULL THEN
    RAISE EXCEPTION 'Invalid address: address not found or does not belong to user';
  END IF;

  -- 2. Business snapshot + billing address snapshot
  IF p_business_id IS NOT NULL THEN
    SELECT
      jsonb_build_object(
        'id', b.id,
        'business_name', b.business_name,
        'business_type', b.business_type,
        'gst_registered', b.gst_registered,
        'gstin', b.gstin,
        'gst_verification_status', b.gst_verification_status,
        'address_line_1', b.address_line_1,
        'address_line_2', b.address_line_2,
        'city', b.city,
        'state', b.state,
        'landmark', b.landmark,
        'pincode', b.pincode
      ),
      jsonb_build_object(
        'business_name', b.business_name,
        'gstin', b.gstin,
        'address_line_1', b.address_line_1,
        'address_line_2', b.address_line_2,
        'city', b.city,
        'state', b.state,
        'landmark', b.landmark,
        'pincode', b.pincode
      )
    INTO v_business_snapshot, v_billing_address_snapshot
    FROM businesses b
    WHERE b.id = p_business_id AND b.owner_user_id = v_user_id;

    IF v_business_snapshot IS NULL THEN
      RAISE EXCEPTION 'Invalid business: business not found or does not belong to user';
    END IF;
  END IF;

  -- 3. NEW: Stock verification and deduction BEFORE allowing order
  FOR v_item IN 
    SELECT product_id, SUM(quantity)::integer AS quantity 
    FROM jsonb_to_recordset(p_items) AS i(product_id uuid, quantity int)
    GROUP BY product_id 
    ORDER BY product_id ASC 
  LOOP
    SELECT stock_quantity, name 
    INTO v_current_stock, v_product_name
    FROM public.products 
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID % not found', v_item.product_id;
    END IF;

    IF v_current_stock < v_item.quantity THEN
      RAISE EXCEPTION 'Out of stock: "%" (Requested: %, Available: %)', v_product_name, v_item.quantity, v_current_stock;
    END IF;

    UPDATE public.products
    SET stock_quantity = stock_quantity - v_item.quantity,
        updated_at = now()
    WHERE id = v_item.product_id;
  END LOOP;

  -- 4. Compute subtotal and GST with volume pricing
  WITH item_pricing AS (
    SELECT
      i.product_id,
      i.quantity,
      p.wholesale_price,
      p.gst_percentage,
      p.product_code,
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

  -- 5. Compute delivery fee
  SELECT charge, zone_id INTO v_charge, v_zone_id
  FROM get_delivery_charge(v_pincode, v_subtotal);

  IF v_charge IS NOT NULL THEN
    v_delivery_fee := v_charge;
    IF p_delivery_zone_id IS NULL AND v_zone_id IS NOT NULL THEN
      p_delivery_zone_id := v_zone_id;
    END IF;
  END IF;

  -- 6. Validate promo code with explicit error messages
  IF p_promo_code IS NOT NULL THEN
    SELECT
      id, discount_type, discount_value, min_order_value, max_discount_amount,
      is_active, start_date, end_date, usage_limit, used_count
    INTO
      v_promo_id, v_discount_type, v_discount_value, v_min_order_value, v_max_discount_amount,
      v_is_active, v_start_date, v_end_date, v_usage_limit, v_used_count
    FROM promo_codes
    WHERE code = UPPER(p_promo_code);

    IF v_promo_id IS NULL THEN
      RAISE EXCEPTION 'Invalid promo code';
    END IF;

    IF NOT v_is_active THEN
      RAISE EXCEPTION 'This promo code is no longer active';
    END IF;

    IF v_start_date IS NOT NULL AND v_start_date > now() THEN
      RAISE EXCEPTION 'This promo code is not active yet';
    END IF;

    IF v_end_date IS NOT NULL AND v_end_date < now() THEN
      RAISE EXCEPTION 'This promo code has expired';
    END IF;

    IF v_usage_limit IS NOT NULL AND v_used_count >= v_usage_limit THEN
      RAISE EXCEPTION 'This promo code is no longer valid';
    END IF;

    IF v_min_order_value IS NOT NULL AND v_subtotal < v_min_order_value THEN
      RAISE EXCEPTION 'Minimum order value for this promo code is ₹%', v_min_order_value;
    END IF;

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

  -- 7. GST adjustment on discount
  IF v_discount > 0 AND v_subtotal > 0 THEN
    v_discount_ratio := v_discount / v_subtotal;
    v_gst_total := v_gst_total * (1 - v_discount_ratio);
  END IF;

  -- 8. Total
  v_total := v_subtotal - v_discount + v_delivery_fee + v_gst_total;

  -- 9. Insert order
  INSERT INTO orders (
    user_id, address_id, status, subtotal, discount, delivery_fee, total,
    promo_code_id, delivery_zone_id, order_number,
    gst_amount, cgst_amount, sgst_amount,
    business_snapshot,
    delivery_address_snapshot,
    billing_address_snapshot
  )
  VALUES (
    v_user_id, p_address_id, 'pending', v_subtotal, v_discount, v_delivery_fee, v_total,
    v_promo_id, p_delivery_zone_id,
    'SK-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    v_gst_total, v_gst_total / 2, v_gst_total / 2,
    v_business_snapshot,
    v_delivery_address_snapshot,
    v_billing_address_snapshot
  )
  RETURNING id INTO v_order_id;

  -- 10. Insert order items
  INSERT INTO order_items (
    order_id, product_id, brand, product_name, pack_size,
    unit_price, mrp, quantity, line_total,
    hsn_code, gst_percentage, product_code
  )
  SELECT
    v_order_id, p.id, p.brand, p.name, p.pack_size,
    COALESCE(
      (SELECT unit_price FROM product_volume_pricing vp
       WHERE vp.product_id = p.id
         AND i.quantity >= vp.min_quantity
         AND (vp.max_quantity IS NULL OR i.quantity <= vp.max_quantity)
       ORDER BY vp.unit_price ASC LIMIT 1),
      p.wholesale_price
    ),
    p.mrp, i.quantity,
    COALESCE(
      (SELECT unit_price FROM product_volume_pricing vp
       WHERE vp.product_id = p.id
         AND i.quantity >= vp.min_quantity
         AND (vp.max_quantity IS NULL OR i.quantity <= vp.max_quantity)
       ORDER BY vp.unit_price ASC LIMIT 1),
      p.wholesale_price
    ) * i.quantity,
    p.hsn_code, p.gst_percentage, p.product_code
  FROM jsonb_to_recordset(p_items) AS i(product_id UUID, quantity INT)
  JOIN products p ON p.id = i.product_id
  WHERE p.is_active = true;

  -- 11. Increment promo code usage
  IF v_promo_id IS NOT NULL THEN
    UPDATE promo_codes
    SET used_count = used_count + 1,
        updated_at = now()
    WHERE id = v_promo_id;
  END IF;

  RETURN v_order_id;
END;
$function$;


CREATE OR REPLACE FUNCTION public.confirm_order(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_order public.orders%rowtype;
BEGIN
  -- 1. Authorization check
  IF NOT (public.is_admin() OR public.has_role('warehouse_manager')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 2. Lock order row
  SELECT * INTO v_order 
  FROM public.orders 
  WHERE id = p_order_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status != 'pending' THEN
    RAISE EXCEPTION 'Only pending orders can be confirmed';
  END IF;

  -- STOCK DEDUCTION REMOVED FROM HERE: Handled directly in create_order

  -- 3. Mark order confirmed
  UPDATE public.orders 
  SET status = 'confirmed', 
      updated_at = now() 
  WHERE id = p_order_id;
END;
$function$;


CREATE OR REPLACE FUNCTION public.cancel_order_warehouse(p_order_id uuid, p_reason text DEFAULT 'Cancelled by warehouse manager'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_current_status TEXT;
  v_item RECORD;
BEGIN
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

  -- Restore inventory if order was pending or downstream in dispatch (Added 'pending' since deduction happens at creation now)
  IF v_current_status IN ('pending', 'confirmed', 'packed', 'ready_for_pickup', 'out_for_delivery') THEN
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

  UPDATE orders
  SET status = 'cancelled',
      cancel_reason = p_reason,
      updated_at = NOW()
  WHERE id = p_order_id;

  UPDATE delivery_assignments
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE order_id = p_order_id;

  RETURN json_build_object(
    'success', true,
    'order_id', p_order_id,
    'previous_status', v_current_status,
    'stock_restored', (v_current_status IN ('pending', 'confirmed', 'packed', 'ready_for_pickup', 'out_for_delivery'))
  );
END;
$function$;


CREATE OR REPLACE FUNCTION public.update_profile(
  p_full_name TEXT DEFAULT NULL,
  p_personal_name TEXT DEFAULT NULL,
  p_registration_status TEXT DEFAULT NULL,
  p_staff_registration_status TEXT DEFAULT NULL,
  p_delivery_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
  SET
    full_name = COALESCE(p_full_name, full_name),
    personal_name = COALESCE(p_personal_name, personal_name),
    registration_status = COALESCE(p_registration_status, registration_status),
    staff_registration_status = COALESCE(p_staff_registration_status, staff_registration_status),
    delivery_type = COALESCE(p_delivery_type, delivery_type),
    updated_at = NOW()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_profile(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;




-- 2. RPC to fetch only valid, active promos (handles dates and limits automatically)
CREATE OR REPLACE FUNCTION public.get_active_promos()
RETURNS SETOF public.promo_codes
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.promo_codes
  WHERE is_active = true
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
    AND (usage_limit IS NULL OR used_count < usage_limit)
  ORDER BY discount_value DESC;
$$;

-- 3. RPC to fetch a specific promo for checkout validation
CREATE OR REPLACE FUNCTION public.get_promo_by_code(p_code TEXT)
RETURNS SETOF public.promo_codes
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.promo_codes
  WHERE code = p_code
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_promos() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_promo_by_code(TEXT) TO authenticated, anon;
