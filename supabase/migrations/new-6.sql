-- Drop existing function
DROP FUNCTION IF EXISTS public.create_order(uuid, jsonb, text, uuid);

CREATE OR REPLACE FUNCTION public.create_order(
  p_address_id uuid,
  p_items jsonb,
  p_promo_code text DEFAULT NULL,
  p_delivery_zone_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_product public.products%ROWTYPE;
  v_qty integer;
  v_volume_price numeric(12,2);
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_gst numeric(12,2) := 0;
  v_cgst numeric(12,2) := 0;
  v_sgst numeric(12,2) := 0;
  v_promo_discount numeric(12,2) := 0;
  v_delivery_charge numeric(12,2) := 0;
  v_promo public.promo_codes%ROWTYPE;
  v_charge public.delivery_charges%ROWTYPE;
BEGIN
  -- Authentication and validation
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.addresses WHERE id = p_address_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Invalid address';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Validate promo code (if provided)
  IF p_promo_code IS NOT NULL THEN
    SELECT * INTO v_promo FROM public.promo_codes
      WHERE code = p_promo_code AND is_active = true
      AND (start_date IS NULL OR start_date <= now())
      AND (end_date IS NULL OR end_date >= now())
      AND (usage_limit IS NULL OR used_count < usage_limit);
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid or expired promo code';
    END IF;
  END IF;

  -- Create order (pending)
  INSERT INTO public.orders (user_id, address_id, promo_code_id)
  VALUES (auth.uid(), p_address_id, v_promo.id)
  RETURNING id INTO v_order_id;

  -- Loop through items
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::integer;
    IF v_qty IS NULL OR v_qty < 1 OR v_qty > 10000 THEN
      RAISE EXCEPTION 'Invalid quantity';
    END IF;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::uuid AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found or inactive';
    END IF;

    IF v_product.stock_quantity < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for %', v_product.name;
    END IF;

    -- Volume Pricing
    v_volume_price := v_product.wholesale_price;
    SELECT unit_price INTO v_volume_price
    FROM public.product_volume_pricing
    WHERE product_id = v_product.id
      AND min_quantity <= v_qty
      AND (max_quantity IS NULL OR max_quantity >= v_qty)
    ORDER BY unit_price ASC
    LIMIT 1;

    IF v_volume_price IS NULL THEN
      v_volume_price := v_product.wholesale_price;
    END IF;

    -- Compute subtotal, discount, GST (total, CGST, SGST)
    v_subtotal := v_subtotal + (v_volume_price * v_qty);
    v_discount := v_discount + ((v_product.mrp - v_volume_price) * v_qty);
    v_gst := v_gst + (v_volume_price * v_qty * (COALESCE(v_product.gst_percentage, 0) / 100));
    v_cgst := v_cgst + (v_volume_price * v_qty * (COALESCE(v_product.gst_percentage, 0) / 200));
    v_sgst := v_sgst + (v_volume_price * v_qty * (COALESCE(v_product.gst_percentage, 0) / 200));

    -- Insert order item
    INSERT INTO public.order_items (
      order_id, product_id, brand, product_name, pack_size,
      unit_price, mrp, quantity, line_total
    ) VALUES (
      v_order_id, v_product.id, v_product.brand, v_product.name,
      v_product.pack_size, v_volume_price, v_product.mrp,
      v_qty, v_volume_price * v_qty
    );
  END LOOP;

  -- Apply Promo
  IF v_promo.id IS NOT NULL THEN
    IF v_subtotal < v_promo.min_order_value THEN
      RAISE EXCEPTION 'Order total below minimum for this promo code';
    END IF;

    IF v_promo.discount_type = 'percentage' THEN
      v_promo_discount := v_subtotal * (v_promo.discount_value / 100);
      IF v_promo.max_discount_amount IS NOT NULL AND v_promo_discount > v_promo.max_discount_amount THEN
        v_promo_discount := v_promo.max_discount_amount;
      END IF;
    ELSE
      v_promo_discount := v_promo.discount_value;
    END IF;

    IF v_promo_discount > v_subtotal THEN
      v_promo_discount := v_subtotal;
    END IF;

    UPDATE public.promo_codes SET used_count = used_count + 1 WHERE id = v_promo.id;
    INSERT INTO public.promo_code_usage (promo_code_id, user_id, order_id)
    VALUES (v_promo.id, auth.uid(), v_order_id);
  END IF;

  -- Delivery Charge
  IF p_delivery_zone_id IS NOT NULL THEN
    SELECT * INTO v_charge
    FROM public.delivery_charges
    WHERE zone_id = p_delivery_zone_id
      AND is_active = true
      AND (min_order_value IS NULL OR v_subtotal >= min_order_value)
      AND (max_order_value IS NULL OR v_subtotal <= max_order_value)
    ORDER BY min_order_value ASC
    LIMIT 1;

    IF FOUND THEN
      v_delivery_charge := v_charge.charge;
    ELSE
      v_delivery_charge := 0;
    END IF;
  END IF;

  -- Update Order with all totals
  UPDATE public.orders
  SET
    subtotal = v_subtotal,
    discount = v_discount,
    gst_amount = v_gst,
    cgst_amount = v_cgst,
    sgst_amount = v_sgst,
    promo_discount = v_promo_discount,
    delivery_fee = v_delivery_charge,
    delivery_zone_id = p_delivery_zone_id,
    total = v_subtotal - v_promo_discount + v_gst + v_delivery_charge
  WHERE id = v_order_id;

  RETURN v_order_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order(uuid, jsonb, text, uuid) TO authenticated;

-- Add SGST and CGST columns to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cgst_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_amount numeric DEFAULT 0;