-- Add product_code column to products
ALTER TABLE public.products ADD COLUMN product_code TEXT UNIQUE;

-- Create a function to generate a 6‑digit alphanumeric code
CREATE OR REPLACE FUNCTION generate_product_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  done BOOLEAN;
BEGIN
  done := false;
  WHILE NOT done LOOP
    new_code := UPPER(
      SUBSTR(MD5(RANDOM()::TEXT), 1, 4) ||
      SUBSTR(MD5(RANDOM()::TEXT), 1, 2)
    );
    BEGIN
      -- Try to insert – if unique constraint fails, loop retries
      UPDATE products SET product_code = new_code WHERE id = NEW.id;
      done := true;
    EXCEPTION WHEN unique_violation THEN
      -- Collision, retry
    END;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to products (before insert, but we need to set after insert)
CREATE OR REPLACE TRIGGER set_product_code
AFTER INSERT ON products
FOR EACH ROW
WHEN (NEW.product_code IS NULL)
EXECUTE FUNCTION generate_product_code();

-- If you want to backfill existing products:
-- UPDATE products SET product_code = UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6)) WHERE product_code IS NULL;
-- But you need to handle uniqueness manually.

-- Update create_order to include product_code in order_items
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

  -- 4. Compute delivery fee
  SELECT charge, zone_id INTO v_charge, v_zone_id
  FROM get_delivery_charge(v_pincode, v_subtotal);
  
  IF v_charge IS NOT NULL THEN
    v_delivery_fee := v_charge;
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

  -- 7. Total
  v_total := v_subtotal - v_discount + v_delivery_fee + v_gst_total;

  -- 8. Insert order
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

  -- 9. Insert order items with product_code
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
    gst_percentage,
    product_code  -- new column
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
    p.gst_percentage,
    p.product_code
  FROM jsonb_to_recordset(p_items) AS i(product_id UUID, quantity INT)
  JOIN products p ON p.id = i.product_id
  WHERE p.is_active = true;

  -- 10. Return order ID
  RETURN v_order_id;
END;
$$;

ALTER TABLE public.order_items ADD COLUMN product_code TEXT;